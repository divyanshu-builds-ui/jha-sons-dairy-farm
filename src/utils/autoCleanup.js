import { db, collection, getDocs, deleteDoc, doc, getDoc, writeBatch } from '../services/firebase';

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const CLEANUP_KEY = 'lg_last_cleanup';

const CLEANUP_TARGETS = [
  // NOTE: 'ledger' is NEVER auto-cleaned — it's permanent financial record
  // NOTE: 'orders' kept for 1 year minimum for history/ledger reference
  { col: 'order_history', dateField: 'createdAt', maxAge: ONE_YEAR_MS },
  { col: 'company_orders', dateField: 'updatedAt', maxAge: ONE_YEAR_MS },
  { col: 'daily_stock', dateField: 'updatedAt', maxAge: ONE_YEAR_MS },
  { col: 'app_errors', dateField: 'timestamp', maxAge: SEVEN_DAYS_MS, maxDocs: 50 },
  { col: 'audit_log', dateField: 'timestamp', maxAge: ONE_YEAR_MS },
];

export async function runAutoCleanup() {
  const lastRun = localStorage.getItem(CLEANUP_KEY);
  const today = new Date().toDateString();
  if (lastRun === today) return;

  // Only run cleanup for admin/dev — retailers should NOT trigger this
  try {
    const activePhone = sessionStorage.getItem('lg_active_phone');
    const saved = activePhone ? localStorage.getItem(`lg_user_${activePhone}`) : localStorage.getItem('lg_user');
    if (saved) {
      const user = JSON.parse(saved);
      if (user.role === 'retailer') {
        localStorage.setItem(CLEANUP_KEY, today);
        return; // Skip cleanup for retailers — saves hundreds of reads
      }
    }
  } catch (e) {}

  try {
    const settingsDoc = await getDoc(doc(db, 'settings', 'app'));
    if (settingsDoc.exists() && settingsDoc.data().autoCleanup === false) {
      localStorage.setItem(CLEANUP_KEY, today);
      return;
    }
  } catch (e) { return; }

  const cutoff = new Date(Date.now() - ONE_YEAR_MS).toISOString();
  let totalDeleted = 0;

  for (const target of CLEANUP_TARGETS) {
    try {
      const snap = await getDocs(collection(db, target.col));
      const targetCutoff = new Date(Date.now() - (target.maxAge || ONE_YEAR_MS)).toISOString();
      let toDelete = snap.docs.filter(d => {
        const dateVal = d.data()[target.dateField];
        return dateVal && dateVal < targetCutoff;
      });
      // Cap: if maxDocs set and total exceeds, delete oldest
      if (target.maxDocs && snap.docs.length > target.maxDocs && toDelete.length === 0) {
        const sorted = snap.docs.map(d => ({ ref: d.ref, ts: d.data()[target.dateField] || '' })).sort((a, b) => a.ts.localeCompare(b.ts));
        toDelete = sorted.slice(0, snap.docs.length - target.maxDocs).map(d => ({ ref: d.ref }));
      }
      // Batch delete (max 100 per target per run)
      const batch = writeBatch(db);
      const deleteSlice = toDelete.slice(0, 100);
      deleteSlice.forEach(d => batch.delete(d.ref || doc(db, target.col, d.id)));
      if (deleteSlice.length > 0) {
        await batch.commit();
        totalDeleted += deleteSlice.length;
      }
    } catch (e) {}
  }

  localStorage.setItem(CLEANUP_KEY, today);

  if (totalDeleted > 0) {
    try {
      const { addDoc } = await import('../services/firebase');
      await addDoc(collection(db, 'audit_log'), {
        action: 'auto_cleanup', description: `Deleted ${totalDeleted} documents older than 1 year`,
        performedBy: 'system', timestamp: new Date().toISOString(),
      });
    } catch (e) {}
  }
}
