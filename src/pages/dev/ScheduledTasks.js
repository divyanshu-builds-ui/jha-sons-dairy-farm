import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Play, Pause, Trash2, Plus, RefreshCw, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { db, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, writeBatch } from '../../services/firebase';
import { useConfirm } from '../../components/ConfirmModal';

const ACTIONS = [
  { value: 'cleanup_errors', label: 'Cleanup Errors', desc: 'Delete resolved + old errors (30d+)' },
  { value: 'cleanup_old_orders', label: 'Cleanup Old Orders', desc: 'Delete orders older than 1 YEAR (ledger untouched)' },
  { value: 'reset_usage', label: 'Reset Usage', desc: 'Reset daily usage counters to 0' },
  { value: 'sync_balances', label: 'Sync Balances', desc: 'Recalculate retailer balances from ledger' },
  { value: 'clear_expired_sessions', label: 'Clear Expired Sessions', desc: 'Remove expired session data from users' },
  { value: 'remove_retailer_ids', label: 'Remove LG-RET IDs', desc: 'Remove old LG-RET-xxx id field from all retailers' },
];

// Actual task execution functions
const executeAction = async (action) => {
  const now = new Date();
  let result = { deleted: 0, updated: 0 };

  switch (action) {
    case 'cleanup_errors': {
      const snap = await getDocs(collection(db, 'app_errors'));
      const cutoff = new Date(now - 30 * 86400000).toISOString();
      const toDelete = snap.docs.filter(d => {
        const data = d.data();
        return data.resolved || (data.timestamp && data.timestamp < cutoff);
      });
      const batchSize = 500;
      for (let i = 0; i < toDelete.length; i += batchSize) {
        const batch = writeBatch(db);
        toDelete.slice(i, i + batchSize).forEach(d => batch.delete(doc(db, 'app_errors', d.id)));
        await batch.commit();
      }
      result.deleted = toDelete.length;
      break;
    }
    case 'cleanup_old_orders': {
      // Only delete orders older than 365 days (1 year) — NEVER touch ledger
      const snap = await getDocs(collection(db, 'orders'));
      const cutoff = new Date(now - 365 * 86400000).toISOString().split('T')[0];
      const toDelete = snap.docs.filter(d => {
        const data = d.data();
        const date = data.date || data.createdAt?.split?.('T')?.[0];
        return date && date < cutoff;
      });
      const batchSize = 500;
      for (let i = 0; i < toDelete.length; i += batchSize) {
        const batch = writeBatch(db);
        toDelete.slice(i, i + batchSize).forEach(d => batch.delete(doc(db, 'orders', d.id)));
        await batch.commit();
      }
      result.deleted = toDelete.length;
      break;
    }
    case 'reset_usage': {
      const today = now.toISOString().split('T')[0];
      await updateDoc(doc(db, 'settings', 'usage_' + today), { reads: 0, writes: 0, deletes: 0, resetAt: now.toISOString() }).catch(async () => {
        const { setDoc } = await import('../../services/firebase');
        await setDoc(doc(db, 'settings', 'usage_' + today), { reads: 0, writes: 0, deletes: 0, resetAt: now.toISOString() });
      });
      result.updated = 1;
      break;
    }
    case 'sync_balances': {
      const usersSnap = await getDocs(collection(db, 'users'));
      const ledgerSnap = await getDocs(collection(db, 'ledger'));
      const ledgerEntries = ledgerSnap.docs.map(d => d.data());
      let updated = 0;
      for (const userDoc of usersSnap.docs) {
        const phone = userDoc.id;
        const userData = userDoc.data();
        if (userData.role !== 'retailer') continue;
        const entries = ledgerEntries.filter(e => e.retailerId === phone);
        const balance = entries.reduce((sum, e) => {
          return e.type === 'debit' ? sum + (e.amount || 0) : sum - (e.amount || 0);
        }, 0);
        await updateDoc(doc(db, 'retailer_balances', phone), { balance }).catch(async () => {
          const { setDoc } = await import('../../services/firebase');
          await setDoc(doc(db, 'retailer_balances', phone), { balance });
        });
        updated++;
      }
      result.updated = updated;
      break;
    }
    case 'clear_expired_sessions': {
      const snap = await getDocs(collection(db, 'users'));
      let updated = 0;
      for (const userDoc of snap.docs) {
        const data = userDoc.data();
        if (data.sessionExpiry && new Date(data.sessionExpiry) < now) {
          await updateDoc(doc(db, 'users', userDoc.id), { activeSession: null, sessionExpiry: null });
          updated++;
        }
      }
      result.updated = updated;
      break;
    }
    case 'remove_retailer_ids': {
      const { deleteField } = await import('../../services/firebase');
      const snap = await getDocs(collection(db, 'users'));
      let updated = 0;
      for (const userDoc of snap.docs) {
        const data = userDoc.data();
        if (data.id && data.id.startsWith('LG-RET-')) {
          await updateDoc(doc(db, 'users', userDoc.id), { id: deleteField() });
          updated++;
        }
      }
      result.updated = updated;
      break;
    }
    default:
      break;
  }
  return result;
};

export default function ScheduledTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', schedule: 'daily', action: 'cleanup_errors', enabled: true });
  const [running, setRunning] = useState(null);
  const [lastResult, setLastResult] = useState(null);
  const confirm = useConfirm();

  useEffect(() => { fetchTasks(); }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'scheduled_tasks'));
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) { setTasks([]); }
    setLoading(false);
  };

  const addTask = async () => {
    if (!form.name.trim()) return;
    await addDoc(collection(db, 'scheduled_tasks'), { ...form, createdAt: new Date().toISOString(), lastRun: null, status: 'idle', lastResult: null });
    setForm({ name: '', schedule: 'daily', action: 'cleanup_errors', enabled: true });
    setShowAdd(false);
    fetchTasks();
  };

  const toggleTask = async (task) => {
    const ok = await confirm({ title: task.enabled ? 'Disable Task' : 'Enable Task', message: `${task.enabled ? 'Disable' : 'Enable'} "${task.name}"?`, confirmText: task.enabled ? 'Disable' : 'Enable', type: 'warning' });
    if (!ok) return;
    await updateDoc(doc(db, 'scheduled_tasks', task.id), { enabled: !task.enabled });
    setTasks(t => t.map(x => x.id === task.id ? { ...x, enabled: !x.enabled } : x));
  };

  const removeTask = async (id) => {
    const ok = await confirm({ title: 'Delete Task', message: 'Remove this scheduled task?', confirmText: 'Delete', type: 'danger' });
    if (!ok) return;
    await deleteDoc(doc(db, 'scheduled_tasks', id));
    setTasks(t => t.filter(x => x.id !== id));
  };

  const runNow = async (task) => {
    const ok = await confirm({ title: 'Run Now', message: `Execute "${task.name}" (${task.action.replace(/_/g, ' ')}) immediately? This will perform real operations.`, confirmText: 'Run', type: 'warning' });
    if (!ok) return;
    setRunning(task.id);
    setLastResult(null);
    try {
      const result = await executeAction(task.action);
      const runData = { lastRun: new Date().toISOString(), status: 'completed', lastResult: `Deleted: ${result.deleted}, Updated: ${result.updated}` };
      await updateDoc(doc(db, 'scheduled_tasks', task.id), runData);
      setTasks(t => t.map(x => x.id === task.id ? { ...x, ...runData } : x));
      setLastResult({ id: task.id, success: true, msg: `Done! Deleted: ${result.deleted}, Updated: ${result.updated}` });
    } catch (e) {
      const runData = { lastRun: new Date().toISOString(), status: 'failed', lastResult: `Error: ${e.message}` };
      await updateDoc(doc(db, 'scheduled_tasks', task.id), runData).catch(() => {});
      setTasks(t => t.map(x => x.id === task.id ? { ...x, ...runData } : x));
      setLastResult({ id: task.id, success: false, msg: `❌ Failed: ${e.message}` });
    }
    setRunning(null);
  };

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white">Scheduled Tasks</h2>
          <p className="text-[10px] text-gray-500">Automated maintenance jobs</p>
        </div>
        <div className="flex gap-2">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowAdd(!showAdd)} className="p-2.5 bg-green-900/30 border border-green-800 rounded-xl">
            <Plus size={14} className="text-green-400" />
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={fetchTasks} className="p-2.5 bg-gray-800 border border-gray-700 rounded-xl">
            <RefreshCw size={14} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-900/20 border border-blue-800/50 rounded-xl p-3 flex items-start gap-2">
        <AlertTriangle size={12} className="text-blue-400 shrink-0 mt-0.5" />
        <p className="text-[10px] text-blue-300/80">"Run Now" executes the actual action (deletes data, updates records). Tasks don't auto-run — use this as manual trigger.</p>
      </div>

      {/* Add Form */}
      {showAdd && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
          className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Task name"
            className="w-full bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-green-700" />
          <div className="flex gap-2">
            <select value={form.schedule} onChange={e => setForm({ ...form, schedule: e.target.value })}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>
            <select value={form.action} onChange={e => setForm({ ...form, action: e.target.value })}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none">
              {ACTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
            </select>
          </div>
          {/* Action description */}
          <p className="text-[9px] text-gray-500">{ACTIONS.find(a => a.value === form.action)?.desc}</p>
          <motion.button whileTap={{ scale: 0.97 }} onClick={addTask}
            className="w-full py-2.5 rounded-xl bg-green-600 text-xs font-bold text-white">Add Task</motion.button>
        </motion.div>
      )}

      {/* Tasks List */}
      {loading ? (
        [1,2,3].map(i => <div key={i} className="h-20 bg-gray-800 rounded-2xl animate-pulse" />)
      ) : tasks.length === 0 ? (
        <p className="text-xs text-gray-600 text-center py-8">No scheduled tasks — tap + to create one</p>
      ) : (
        <div className="space-y-2">
          {tasks.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className={`bg-gray-900 border rounded-2xl p-4 ${t.enabled ? 'border-gray-800' : 'border-red-900/30 opacity-60'}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-gray-600 bg-gray-800 w-5 h-5 rounded-md flex items-center justify-center shrink-0">{i + 1}</span>
                  {t.enabled ? <CheckCircle2 size={12} className="text-green-500" /> : <XCircle size={12} className="text-red-500" />}
                  <span className="text-sm font-bold text-white">{t.name}</span>
                </div>
                <span className="text-[9px] px-2 py-0.5 rounded bg-gray-800 text-gray-400 font-mono">{t.schedule}</span>
              </div>
              <p className="text-[10px] text-gray-500 mb-1">
                Action: <span className="text-gray-400">{t.action?.replace(/_/g, ' ')}</span>
                {t.lastRun && <> • Last: <span className="text-gray-400">{t.lastRun.slice(0, 16).replace('T', ' ')}</span></>}
              </p>
              {/* Last result */}
              {t.lastResult && (
                <p className={`text-[9px] mb-2 ${t.status === 'completed' ? 'text-green-400' : 'text-red-400'}`}>{t.lastResult}</p>
              )}
              {/* Run result toast */}
              {lastResult?.id === t.id && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className={`text-[10px] font-medium mb-2 ${lastResult.success ? 'text-green-400' : 'text-red-400'}`}>
                  {lastResult.msg}
                </motion.p>
              )}
              <div className="flex items-center gap-2">
                <button onClick={() => runNow(t)} disabled={running === t.id}
                  className="flex-1 py-1.5 rounded-lg bg-blue-900/30 border border-blue-800/50 text-[10px] font-bold text-blue-400 flex items-center justify-center gap-1 disabled:opacity-50">
                  {running === t.id ? <div className="w-3 h-3 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" /> : <><Play size={9} /> Run</>}
                </button>
                <button onClick={() => toggleTask(t)} className="flex-1 py-1.5 rounded-lg bg-amber-900/20 border border-amber-800/50 text-[10px] font-bold text-amber-400 flex items-center justify-center gap-1"><Pause size={9} /> {t.enabled ? 'Disable' : 'Enable'}</button>
                <button onClick={() => removeTask(t.id)} className="py-1.5 px-2.5 rounded-lg bg-red-900/20 border border-red-800/50"><Trash2 size={10} className="text-red-400" /></button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Actions Reference */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <p className="text-xs font-bold text-gray-500 uppercase mb-3">Available Actions</p>
        <div className="space-y-2">
          {ACTIONS.map(a => (
            <div key={a.value} className="flex items-center justify-between py-2 px-3 bg-gray-800/50 rounded-xl">
              <span className="text-[11px] text-gray-300 font-medium">{a.label}</span>
              <span className="text-[9px] text-gray-500">{a.desc}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
