const USAGE_KEY = 'lg_usage_today';

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

export function getUsageLocal() {
  try {
    const stored = JSON.parse(localStorage.getItem(USAGE_KEY) || '{}');
    if (stored.date !== getTodayKey()) return { reads: 0, writes: 0, deletes: 0, date: getTodayKey() };
    return stored;
  } catch { return { reads: 0, writes: 0, deletes: 0, date: getTodayKey() }; }
}

// Sync local usage to Firebase
export async function syncUsageToFirebase() {
  try {
    const { db, doc, getDoc, setDoc } = await import('../services/firebase');
    const local = getUsageLocal();
    if (local.reads === 0 && local.writes === 0 && local.deletes === 0) return;
    const docRef = doc(db, 'settings', 'usage_' + local.date);
    const existing = await getDoc(docRef);
    if (existing.exists()) {
      const prev = existing.data();
      await setDoc(docRef, {
        reads: (prev.reads || 0) + local.reads,
        writes: (prev.writes || 0) + local.writes,
        deletes: (prev.deletes || 0) + local.deletes,
        date: local.date,
        lastSync: new Date().toISOString(),
      });
    } else {
      await setDoc(docRef, { ...local, lastSync: new Date().toISOString() });
    }
    // Reset local after sync
    localStorage.setItem(USAGE_KEY, JSON.stringify({ reads: 0, writes: 0, deletes: 0, date: getTodayKey() }));
  } catch (e) {}
}

// Auto-sync every 10 minutes (was 5 min — reduced to save reads) + on page unload
let syncInterval = null;
export function initUsageTracking() {
  if (syncInterval) return;
  syncInterval = setInterval(syncUsageToFirebase, 10 * 60 * 1000);
  window.addEventListener('beforeunload', () => {
    syncUsageToFirebase();
  });
}
