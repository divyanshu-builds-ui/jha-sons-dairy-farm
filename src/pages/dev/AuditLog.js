import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ScrollText, RefreshCw, Filter, Trash2, User, ShoppingCart, IndianRupee, Settings, Shield } from 'lucide-react';
import { db, collection, getDocs, addDoc, deleteDoc, doc } from '../../services/firebase';
import { useConfirm } from '../../components/ConfirmModal';

const ACTION_ICONS = {
  order_status: ShoppingCart,
  payment: IndianRupee,
  retailer_edit: User,
  retailer_delete: Trash2,
  settings_change: Settings,
  maintenance: Shield,
  default: ScrollText,
};

const ACTION_COLORS = {
  order_status: 'text-blue-400 bg-blue-900/30 border-blue-800',
  payment: 'text-green-400 bg-green-900/30 border-green-800',
  retailer_edit: 'text-purple-400 bg-purple-900/30 border-purple-800',
  retailer_delete: 'text-red-400 bg-red-900/30 border-red-800',
  settings_change: 'text-amber-400 bg-amber-900/30 border-amber-800',
  maintenance: 'text-red-400 bg-red-900/30 border-red-800',
  default: 'text-gray-400 bg-gray-800 border-gray-700',
};

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('');
  const [dateRange, setDateRange] = useState('all'); // all | today | 7d | 30d
  const [clearing, setClearing] = useState(false);
  const confirm = useConfirm();

  useEffect(() => { fetchLogs(); }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, 'audit_log'));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
      setLogs(list);
    } catch (e) {}
    setLoading(false);
  };

  const clearLogs = async () => {
    const ok = await confirm({ title: 'Clear Audit Log', message: `Delete all ${logs.length} audit entries? This cannot be undone.`, confirmText: 'Clear All', type: 'danger' });
    if (!ok) return;
    setClearing(true);
    try {
      for (const l of logs) {
        await deleteDoc(doc(db, 'audit_log', l.id));
      }
      setLogs([]);
    } catch (e) {}
    setClearing(false);
  };

  const now = Date.now();
  const dateFiltered = dateRange === 'all' ? logs
    : logs.filter(l => l.timestamp && (now - new Date(l.timestamp).getTime()) < (dateRange === 'today' ? 86400000 : dateRange === '7d' ? 604800000 : 2592000000));
  const filtered = (filter === 'all' ? dateFiltered : dateFiltered.filter(l => l.action === filter))
    .filter(l => !userFilter || (l.performedBy || '').toLowerCase().includes(userFilter.toLowerCase()));

  const actionTypes = [...new Set(logs.map(l => l.action))];

  const timeAgo = (ts) => {
    if (!ts) return '';
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white">Audit Log</h2>
          <p className="text-[10px] text-gray-500">{logs.length} actions recorded</p>
        </div>
        <div className="flex gap-2">
          {logs.length > 0 && (
            <motion.button whileTap={{ scale: 0.9 }} onClick={clearLogs} disabled={clearing}
              className="p-2.5 bg-red-900/30 border border-red-800 rounded-xl disabled:opacity-50">
              {clearing ? <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-3.5 h-3.5 border-2 border-red-300 border-t-red-600 rounded-full" /> : <Trash2 size={14} className="text-red-400" />}
            </motion.button>
          )}
          <motion.button whileTap={{ scale: 0.9 }} onClick={fetchLogs}
            className="p-2.5 bg-gray-800 border border-gray-700 rounded-xl">
            <RefreshCw size={14} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-2">
        {/* Date range + user */}
        <div className="flex items-center gap-2 flex-wrap">
          {['all', 'today', '7d', '30d'].map(d => (
            <button key={d} onClick={() => setDateRange(d)}
              className={`text-[9px] font-bold px-2.5 py-1 rounded-lg border ${dateRange === d ? 'bg-blue-900/30 border-blue-700 text-blue-400' : 'bg-gray-800 border-gray-700 text-gray-500'}`}>
              {d === 'all' ? 'All Time' : d === 'today' ? 'Today' : d === '7d' ? '7 Days' : '30 Days'}
            </button>
          ))}
          <input type="text" placeholder="Filter by user..." value={userFilter} onChange={e => setUserFilter(e.target.value)}
            className="text-[10px] bg-gray-800 border border-gray-700 rounded-lg px-2.5 py-1 text-gray-300 placeholder-gray-600 outline-none focus:border-gray-500 w-28" />
        </div>
        {/* Action type */}
        {actionTypes.length > 1 && (
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setFilter('all')}
              className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all ${filter === 'all' ? 'bg-white/10 border-white/20 text-white' : 'bg-gray-800 border-gray-700 text-gray-500'}`}>
              All ({dateFiltered.length})
            </button>
            {actionTypes.map(type => (
              <button key={type} onClick={() => setFilter(type)}
                className={`text-[10px] font-bold px-3 py-1.5 rounded-lg border transition-all ${filter === type ? 'bg-white/10 border-white/20 text-white' : 'bg-gray-800 border-gray-700 text-gray-500'}`}>
                {type.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Log List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-gray-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <ScrollText size={32} className="text-gray-700 mx-auto mb-3" />
          <p className="text-sm font-bold text-gray-500">No audit logs yet</p>
          <p className="text-xs text-gray-600 mt-1">Actions will be recorded here automatically</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry, i) => {
            const Icon = ACTION_ICONS[entry.action] || ACTION_ICONS.default;
            const color = ACTION_COLORS[entry.action] || ACTION_COLORS.default;
            return (
              <motion.div key={entry.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.02 * i }}
                className="bg-gray-900/50 border border-gray-800 rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <span className="text-[9px] font-bold text-gray-600 bg-gray-800 w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-2">{i + 1}</span>
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${color}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-bold text-white truncate">{entry.description}</p>
                      <span className="text-[9px] text-gray-600 shrink-0 ml-2">{timeAgo(entry.timestamp)}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[10px] text-gray-500">
                      <span>By: <span className="text-gray-400 font-bold">{entry.performedBy || 'Admin'}</span></span>
                      {entry.target && <span>On: <span className="text-gray-400 font-bold">{entry.target}</span></span>}
                    </div>
                    {entry.details && (
                      <p className="text-[10px] text-gray-600 mt-1 bg-gray-800/50 rounded-lg px-2 py-1 font-mono">{entry.details}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Helper function to log audit entries from anywhere in the app
export const logAudit = async (action, description, target = '', details = '', performedBy = 'Admin') => {
  try {
    await addDoc(collection(db, 'audit_log'), {
      action,
      description,
      target,
      details,
      performedBy,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {}
};
