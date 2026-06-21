import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Database, RefreshCw, AlertTriangle, CheckCircle2, ShoppingCart, BookOpen, Headphones } from 'lucide-react';
import { db, collection, getDocs, deleteDoc, doc, getDoc, setDoc, query, where } from '../../services/firebase';
import { useConfirm } from '../../components/ConfirmModal';
import { runAutoCleanup } from '../../utils/autoCleanup';

export default function DatabaseCleanup() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState('');
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [log, setLog] = useState([]);
  const [autoCleanEnabled, setAutoCleanEnabled] = useState(true);
  const confirm = useConfirm();

  useEffect(() => { fetchStats(); fetchAutoCleanSetting(); }, []);

  const fetchAutoCleanSetting = async () => {
    try {
      const d = await getDoc(doc(db, 'settings', 'app'));
      if (d.exists() && d.data().autoCleanup === false) setAutoCleanEnabled(false);
    } catch (e) {}
  };

  const toggleAutoClean = async () => {
    const newVal = !autoCleanEnabled;
    const ok = await confirm({ title: newVal ? 'Enable Auto Cleanup' : 'Disable Auto Cleanup', message: newVal ? 'Enable automatic deletion of data older than 1 year on every app load?' : 'Disable automatic cleanup? Old data will accumulate.', confirmText: newVal ? 'Enable' : 'Disable', type: 'warning' });
    if (!ok) return;
    setAutoCleanEnabled(newVal);
    await setDoc(doc(db, 'settings', 'app'), { autoCleanup: newVal }, { merge: true });
    addLog(newVal ? 'Auto cleanup enabled' : 'Auto cleanup disabled', 'success');
  };

  const runManualCleanup = async () => {
    const ok = await confirm({ title: 'Run Auto Cleanup Now', message: 'Delete all data older than 1 year (orders, ledger, history, errors, audit logs)?', confirmText: 'Run Cleanup', type: 'danger' });
    if (!ok) return;
    setCleaning('auto');
    localStorage.removeItem('lg_last_cleanup');
    await runAutoCleanup();
    setCleaning('');
    addLog('Manual cleanup completed', 'success');
    fetchStats();
  };

  const addLog = (msg, type = 'info') => setLog(prev => [{ msg, type, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 30));

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [ordersSnap, ledgerSnap, ticketsSnap, errorsSnap] = await Promise.all([
        getDocs(collection(db, 'orders')),
        getDocs(collection(db, 'ledger')),
        getDocs(collection(db, 'support_tickets')),
        getDocs(collection(db, 'app_errors')),
      ]);

      const now = Date.now();
      const d90 = 90 * 24 * 60 * 60 * 1000;
      const d30 = 30 * 24 * 60 * 60 * 1000;

      const orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const oldOrders = orders.filter(o => o.createdAt && (now - new Date(o.createdAt).getTime()) > d90);
      const deliveredOld = oldOrders.filter(o => o.status === 'Delivered');

      const ledger = ledgerSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const oldLedger = ledger.filter(l => l.createdAt && (now - new Date(l.createdAt).getTime()) > d90);

      const tickets = ticketsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const resolvedTickets = tickets.filter(t => t.status === 'Resolved' && t.createdAt && (now - new Date(t.createdAt).getTime()) > d30);

      const errors = errorsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      setStats({
        totalOrders: orders.length,
        oldDelivered: deliveredOld.length,
        oldOrderIds: deliveredOld.map(o => o.id),
        totalLedger: ledger.length,
        oldLedger: oldLedger.length,
        oldLedgerIds: oldLedger.map(l => l.id),
        totalTickets: tickets.length,
        resolvedTickets: resolvedTickets.length,
        resolvedTicketIds: resolvedTickets.map(t => t.id),
        totalErrors: errors.length,
        errorIds: errors.map(e => e.id),
      });
      addLog(`Stats loaded — ${orders.length} orders, ${ledger.length} ledger, ${tickets.length} tickets, ${errors.length} errors`);
    } catch (err) { addLog(`ERROR: ${err.message}`, 'error'); }
    setLoading(false);
  };

  const cleanCollection = async (ids, collectionName, label) => {
    if (ids.length === 0) { addLog(`No ${label} to clean`, 'warn'); return; }
    const ok = await confirm({ title: `Delete ${ids.length} ${label}`, message: `Permanently delete ${ids.length} ${label}? This cannot be undone.`, confirmText: 'Delete', type: 'danger' });
    if (!ok) return;
    setCleaning(collectionName);
    setProgress({ done: 0, total: ids.length });
    let count = 0;
    for (const id of ids) {
      try {
        await deleteDoc(doc(db, collectionName, id));
        count++;
        setProgress({ done: count, total: ids.length });
      } catch (err) { addLog(`Failed: ${id}`, 'error'); }
    }
    addLog(`Deleted ${count} ${label}`, 'success');
    setCleaning('');
    setProgress({ done: 0, total: 0 });
    fetchStats();
  };

  const CleanupCard = ({ icon: Icon, title, description, count, total, ids, collectionName, color }) => (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
            <Icon size={18} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-white">{title}</p>
            <p className="text-[10px] text-gray-500 mt-0.5">{description}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-xs text-gray-400">{total} total</span>
              <span className="text-xs font-bold text-amber-400">{count} deletable</span>
            </div>
          </div>
        </div>
      </div>
      {count > 0 && (
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => cleanCollection(ids, collectionName, title)}
          disabled={!!cleaning}
          className="w-full mt-3 py-2.5 rounded-xl text-[11px] font-bold text-red-400 bg-red-900/20 border border-red-800 disabled:opacity-40 flex items-center justify-center gap-2">
          {cleaning === collectionName ? (
            <><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-3.5 h-3.5 border-2 border-red-300 border-t-red-600 rounded-full" /> Deleting {progress.done}/{progress.total}</>
          ) : (
            <><Trash2 size={11} /> Delete {count} items</>
          )}
        </motion.button>
      )}
      {count === 0 && (
        <div className="mt-3 py-2 text-center">
          <span className="text-[10px] text-green-500 font-bold">Clean — nothing to delete</span>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white">Database Cleanup</h2>
          <p className="text-[10px] text-gray-500">Remove old/orphan data to keep Firestore lean</p>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={fetchStats}
          className="p-2.5 bg-gray-800 border border-gray-700 rounded-xl">
          <RefreshCw size={14} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>

      {/* Auto Cleanup Controls */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-bold text-white">Auto Cleanup (1 Year)</p>
            <p className="text-[10px] text-gray-500">Runs daily on app load — deletes data older than 1 year</p>
          </div>
          <motion.button whileTap={{ scale: 0.9 }} onClick={toggleAutoClean}
            className={`w-12 h-7 rounded-full p-0.5 transition-colors ${autoCleanEnabled ? 'bg-green-500' : 'bg-gray-700'}`}>
            <motion.div className="w-6 h-6 bg-white rounded-full shadow-md" animate={{ x: autoCleanEnabled ? 20 : 0 }} />
          </motion.button>
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={runManualCleanup} disabled={!!cleaning}
          className="w-full py-2.5 rounded-xl text-[11px] font-bold text-amber-400 bg-amber-900/20 border border-amber-800 disabled:opacity-40 flex items-center justify-center gap-2">
          {cleaning === 'auto' ? (
            <><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-3.5 h-3.5 border-2 border-amber-300 border-t-amber-600 rounded-full" /> Running...</>
          ) : (
            <><RefreshCw size={11} /> Run Cleanup Now (1 Year)</>
          )}
        </motion.button>
      </div>

      {/* Warning */}
      <div className="bg-amber-900/20 border border-amber-800/50 rounded-2xl p-4 flex items-start gap-3">
        <AlertTriangle size={16} className="text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-amber-300">Caution</p>
          <p className="text-[11px] text-amber-400/80 mt-0.5">Deleted data cannot be recovered. Only old delivered orders (90+ days) and resolved tickets (30+ days) are shown for cleanup.</p>
        </div>
      </div>

      {/* Cleanup Cards */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-28 bg-gray-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : stats && (
        <div className="space-y-3">
          <CleanupCard
            icon={ShoppingCart} title="Old Delivered Orders" description="Orders delivered 90+ days ago"
            count={stats.oldDelivered} total={stats.totalOrders} ids={stats.oldOrderIds}
            collectionName="orders" color="bg-gradient-to-br from-blue-600 to-blue-700"
          />
          <CleanupCard
            icon={BookOpen} title="Old Ledger Entries" description="Ledger entries 90+ days old"
            count={stats.oldLedger} total={stats.totalLedger} ids={stats.oldLedgerIds}
            collectionName="ledger" color="bg-gradient-to-br from-purple-600 to-purple-700"
          />
          <CleanupCard
            icon={Headphones} title="Resolved Tickets" description="Resolved tickets 30+ days old"
            count={stats.resolvedTickets} total={stats.totalTickets} ids={stats.resolvedTicketIds}
            collectionName="support_tickets" color="bg-gradient-to-br from-green-600 to-green-700"
          />
          <CleanupCard
            icon={Database} title="Error Logs" description="All captured error logs"
            count={stats.totalErrors} total={stats.totalErrors} ids={stats.errorIds}
            collectionName="app_errors" color="bg-gradient-to-br from-red-600 to-red-700"
          />

          {/* Estimated Savings */}
          {(stats.oldDelivered + stats.oldLedger + stats.resolvedTickets + stats.totalErrors) > 0 && (
            <div className="bg-green-900/20 border border-green-800/50 rounded-2xl p-4">
              <p className="text-xs font-bold text-green-400 mb-3">Estimated Savings if Cleaned</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <p className="text-lg font-black text-green-400">{stats.oldDelivered + stats.oldLedger + stats.resolvedTickets + stats.totalErrors}</p>
                  <p className="text-[9px] text-gray-500 uppercase">Documents Freed</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-green-400">~{((stats.oldDelivered + stats.oldLedger + stats.resolvedTickets + stats.totalErrors) * 0.5).toFixed(0)} KB</p>
                  <p className="text-[9px] text-gray-500 uppercase">Storage Saved</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-green-400">~{((stats.oldDelivered + stats.oldLedger + stats.resolvedTickets) * 2).toLocaleString()}</p>
                  <p className="text-[9px] text-gray-500 uppercase">Reads/Day Saved</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-black text-green-400">{((stats.oldDelivered + stats.oldLedger + stats.resolvedTickets + stats.totalErrors) / (stats.totalOrders + stats.totalLedger + stats.totalTickets + stats.totalErrors) * 100).toFixed(0)}%</p>
                  <p className="text-[9px] text-gray-500 uppercase">DB Reduction</p>
                </div>
              </div>
              <p className="text-[9px] text-gray-600 mt-3 text-center">Fewer documents = faster queries + lower Firestore usage</p>
            </div>
          )}
        </div>
      )}

      {/* Log */}
      {log.length > 0 && (
        <div className="bg-black rounded-2xl p-4 border border-gray-800">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-bold text-gray-500 uppercase">Cleanup Log</p>
            <button onClick={() => setLog([])} className="text-[10px] text-gray-600 hover:text-gray-400">Clear</button>
          </div>
          <div className="space-y-1 max-h-[150px] overflow-y-auto font-mono">
            {log.map((l, i) => (
              <p key={i} className={`text-[11px] ${l.type === 'error' ? 'text-red-400' : l.type === 'success' ? 'text-green-400' : l.type === 'warn' ? 'text-amber-400' : 'text-gray-400'}`}>
                <span className="text-gray-600">[{l.time}]</span> {l.msg}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
