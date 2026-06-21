import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { HardDrive, Upload, Download, RefreshCw, Clock, Trash2, FileDown, FileUp } from 'lucide-react';
import { db, collection, getDocs, doc, setDoc, deleteDoc } from '../../services/firebase';
import { useConfirm } from '../../components/ConfirmModal';

const BACKUP_COLLECTIONS = ['users', 'products', 'settings', 'retailer_balances', 'ledger', 'orders', 'order_history', 'support_tickets'];

export default function BackupRestore() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const confirm = useConfirm();
  const [successMsg, setSuccessMsg] = useState('');
  const [restoreResult, setRestoreResult] = useState('');
  const [restoreProgress, setRestoreProgress] = useState(null);

  useEffect(() => { fetchBackups(); }, []);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'backups'));
      setBackups(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
    } catch (e) { setBackups([]); }
    setLoading(false);
  };

  // === LOCAL DOWNLOAD ===
  const downloadBackup = async () => {
    const ok = await confirm({ title: 'Download Backup', message: `Download all data (${BACKUP_COLLECTIONS.join(', ')}) as JSON file to your device?`, confirmText: 'Download', type: 'info' });
    if (!ok) return;
    setDownloading(true);
    setSuccessMsg('');
    try {
      const data = {};
      let totalDocs = 0;
      for (const col of BACKUP_COLLECTIONS) {
        const snap = await getDocs(collection(db, col));
        data[col] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        totalDocs += snap.size;
      }
      const backup = { data, collections: BACKUP_COLLECTIONS, docCount: totalDocs, createdAt: new Date().toISOString(), version: '2.4.0' };
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `LG_Backup_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccessMsg(`Downloaded! ${totalDocs} docs from ${BACKUP_COLLECTIONS.length} collections.`);
    } catch (e) {
      setSuccessMsg(`❌ Download failed: ${e.message}`);
    }
    setDownloading(false);
  };

  // === RESTORE FROM FILE ===
  const restoreFromFile = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const backup = JSON.parse(text);
        if (!backup.data || !backup.collections) { setRestoreResult('❌ Invalid backup file'); return; }

        const ok = await confirm({
          title: '⚠️ Restore from File',
          message: `File: ${file.name}\nCollections: ${backup.collections.join(', ')}\nDocs: ${backup.docCount}\nCreated: ${backup.createdAt?.slice(0, 16).replace('T', ' ')}\n\nThis will CLEAN + REPLACE these collections. IRREVERSIBLE.`,
          confirmText: 'Yes, Restore', type: 'critical'
        });
        if (!ok) return;
        const ok2 = await confirm({ title: 'Final Confirmation', message: 'ALL current data will be DELETED and replaced. Last chance.', confirmText: 'DO IT', type: 'critical' });
        if (!ok2) return;

        setRestoring('file');
        setRestoreResult('');
        setRestoreProgress({ done: 0, total: backup.docCount || 0, phase: 'Cleaning...' });

        const { writeBatch } = await import('../../services/firebase');
        const data = backup.data;

        for (const col of Object.keys(data)) {
          const existingSnap = await getDocs(collection(db, col));
          for (let i = 0; i < existingSnap.docs.length; i += 500) {
            const batch = writeBatch(db);
            existingSnap.docs.slice(i, i + 500).forEach(d => batch.delete(doc(db, col, d.id)));
            await batch.commit();
          }
        }

        setRestoreProgress({ done: 0, total: backup.docCount || 0, phase: 'Restoring...' });
        let done = 0, errors = 0;
        for (const [col, docs] of Object.entries(data)) {
          for (const d of docs) {
            const { id, ...rest } = d;
            try { await setDoc(doc(db, col, id), rest); } catch { errors++; }
            done++;
            if (done % 10 === 0) setRestoreProgress({ done, total: backup.docCount || done, phase: 'Restoring...' });
          }
        }
        setRestoreResult(errors === 0 ? `Restore complete! ${done} docs restored.` : `⚠️ ${done - errors}/${done} restored. ${errors} failed.`);
      } catch (e) { setRestoreResult(`❌ File read failed: ${e.message}`); }
      setRestoring(null);
      setRestoreProgress(null);
    };
    input.click();
  };

  // === CLOUD BACKUP ===
  const createBackup = async () => {
    const ok = await confirm({ title: 'Cloud Backup', message: `Save to Firestore? (${BACKUP_COLLECTIONS.join(', ')})`, confirmText: 'Backup', type: 'warning' });
    if (!ok) return;
    setCreating(true);
    setSuccessMsg('');
    try {
      const data = {};
      let totalDocs = 0;
      for (const col of BACKUP_COLLECTIONS) {
        const snap = await getDocs(collection(db, col));
        data[col] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        totalDocs += snap.size;
      }
      await setDoc(doc(db, 'backups', `backup_${Date.now()}`), { data: JSON.stringify(data), createdAt: new Date().toISOString(), collections: BACKUP_COLLECTIONS, docCount: totalDocs });
      setSuccessMsg(`Cloud backup created! ${totalDocs} docs.`);
      fetchBackups();
    } catch (e) { setSuccessMsg(`❌ Failed: ${e.message}`); }
    setCreating(false);
  };

  // === CLOUD RESTORE ===
  const restore = async (backup) => {
    const ok = await confirm({ title: '⚠️ Restore', message: `REPLACE: ${backup.collections?.join(', ')}\n${backup.docCount} docs from ${backup.createdAt?.slice(0, 16).replace('T', ' ')}`, confirmText: 'Yes, Restore', type: 'critical' });
    if (!ok) return;
    const ok2 = await confirm({ title: 'Final', message: 'Last chance. All data will be replaced.', confirmText: 'DO IT', type: 'critical' });
    if (!ok2) return;

    setRestoring(backup.id);
    setRestoreResult('');
    setRestoreProgress({ done: 0, total: backup.docCount || 0, phase: 'Cleaning...' });
    try {
      const data = JSON.parse(backup.data);
      const { writeBatch } = await import('../../services/firebase');
      for (const col of Object.keys(data)) {
        const existingSnap = await getDocs(collection(db, col));
        for (let i = 0; i < existingSnap.docs.length; i += 500) {
          const batch = writeBatch(db);
          existingSnap.docs.slice(i, i + 500).forEach(d => batch.delete(doc(db, col, d.id)));
          await batch.commit();
        }
      }
      setRestoreProgress({ done: 0, total: backup.docCount || 0, phase: 'Restoring...' });
      let done = 0, errors = 0;
      for (const [col, docs] of Object.entries(data)) {
        for (const d of docs) {
          const { id, ...rest } = d;
          try { await setDoc(doc(db, col, id), rest); } catch { errors++; }
          done++;
          if (done % 10 === 0) setRestoreProgress({ done, total: backup.docCount || done, phase: 'Restoring...' });
        }
      }
      setRestoreResult(errors === 0 ? `Done! ${done} docs restored.` : `⚠️ ${done - errors}/${done}. ${errors} failed.`);
    } catch (e) { setRestoreResult(`❌ Failed: ${e.message}`); }
    setRestoring(null);
    setRestoreProgress(null);
  };

  const remove = async (id) => {
    const ok = await confirm({ title: 'Delete', message: 'Delete this cloud backup?', confirmText: 'Delete', type: 'danger' });
    if (!ok) return;
    await deleteDoc(doc(db, 'backups', id));
    setBackups(b => b.filter(x => x.id !== id));
  };

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white">Backup & Restore</h2>
          <p className="text-[10px] text-gray-500">{BACKUP_COLLECTIONS.length} collections • Local + Cloud</p>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={fetchBackups} className="p-2.5 bg-gray-800 border border-gray-700 rounded-xl">
          <RefreshCw size={14} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>

      {/* LOCAL SECTION */}
      <div className="bg-gray-900 border border-green-900/50 rounded-2xl p-4">
        <p className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-3">Local Backup (Safest)</p>
        <div className="grid grid-cols-2 gap-2">
          <motion.button whileTap={{ scale: 0.95 }} onClick={downloadBackup} disabled={downloading}
            className="py-3 rounded-xl bg-green-900/30 border border-green-800/50 text-xs font-bold text-green-400 flex items-center justify-center gap-2 disabled:opacity-50">
            {downloading ? <div className="w-3.5 h-3.5 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" /> : <><FileDown size={14} /> Download</>}
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={restoreFromFile} disabled={!!restoring}
            className="py-3 rounded-xl bg-amber-900/30 border border-amber-800/50 text-xs font-bold text-amber-400 flex items-center justify-center gap-2 disabled:opacity-50">
            <FileUp size={14} /> Restore File
          </motion.button>
        </div>
        <p className="text-[9px] text-gray-600 mt-2">JSON file on your device. Works even if Firebase is down.</p>
      </div>

      {/* CLOUD BUTTON */}
      <motion.button whileTap={{ scale: 0.97 }} onClick={createBackup} disabled={creating}
        className="w-full py-3 rounded-2xl text-xs font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white disabled:opacity-50 flex items-center justify-center gap-2">
        {creating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><HardDrive size={13} /> Cloud Backup</>}
      </motion.button>

      {/* Messages */}
      {successMsg && <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className={`rounded-xl p-3 border text-xs font-medium ${successMsg.includes('❌') ? 'bg-red-900/20 border-red-800/50 text-red-400' : 'bg-green-900/20 border-green-800/50 text-green-400'}`}>{successMsg}</motion.div>}
      {restoreResult && <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className={`rounded-xl p-3 border text-xs font-medium ${restoreResult.includes('❌') ? 'bg-red-900/20 border-red-800/50 text-red-400' : restoreResult.includes('⚠️') ? 'bg-amber-900/20 border-amber-800/50 text-amber-400' : 'bg-green-900/20 border-green-800/50 text-green-400'}`}>{restoreResult}</motion.div>}
      {restoreProgress && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-gray-400">{restoreProgress.phase}</span>
            <span className="text-[10px] font-bold text-white">{restoreProgress.done}/{restoreProgress.total}</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
            <motion.div className="h-full bg-green-500 rounded-full" animate={{ width: `${(restoreProgress.done / Math.max(restoreProgress.total, 1)) * 100}%` }} />
          </div>
        </div>
      )}

      {/* Cloud Backups List */}
      <div>
        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Cloud Backups</p>
        <div className="space-y-2">
          {loading ? [1, 2].map(i => <div key={i} className="h-20 bg-gray-800 rounded-2xl animate-pulse" />) : backups.length === 0 ? (
            <p className="text-xs text-gray-600 text-center py-6">No cloud backups</p>
          ) : backups.map((b, i) => (
            <motion.div key={b.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Clock size={12} className="text-gray-500" />
                  <span className="text-xs font-bold text-white">{b.createdAt?.slice(0, 16).replace('T', ' ')}</span>
                </div>
                <span className="text-[9px] text-gray-600">{b.docCount} docs</span>
              </div>
              <div className="flex items-center gap-2">
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => restore(b)} disabled={!!restoring}
                  className="flex-1 py-2 rounded-xl bg-green-900/30 border border-green-800/50 text-[10px] font-bold text-green-400 flex items-center justify-center gap-1 disabled:opacity-50">
                  {restoring === b.id ? <div className="w-3 h-3 border-2 border-green-400/30 border-t-green-400 rounded-full animate-spin" /> : <><Upload size={10} /> Restore</>}
                </motion.button>
                <motion.button whileTap={{ scale: 0.9 }} onClick={() => {
                  try {
                    const data = JSON.parse(b.data);
                    const blob = new Blob([JSON.stringify({ data, collections: b.collections, docCount: b.docCount, createdAt: b.createdAt, version: '2.4.0' }, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `LG_Backup_${b.createdAt?.slice(0, 10)}.json`; a.click(); URL.revokeObjectURL(url);
                  } catch {}
                }} className="py-2 px-3 rounded-xl bg-blue-900/20 border border-blue-800/50">
                  <Download size={12} className="text-blue-400" />
                </motion.button>
                <button onClick={() => remove(b.id)} className="py-2 px-3 rounded-xl bg-red-900/20 border border-red-800/50">
                  <Trash2 size={12} className="text-red-400" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
