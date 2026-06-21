import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, RefreshCw, AlertTriangle, TrendingUp, TrendingDown, Clock, AlertOctagon } from 'lucide-react';
import { db, collection, getDocs, query, where } from '../../services/firebase';
import { formatPrice } from '../../utils/price';

export default function RetailerActivity() {
  const [retailers, setRetailers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all | active | inactive | never

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [retSnap, ordSnap] = await Promise.all([
        getDocs(query(collection(db, 'users'), where('role', '==', 'retailer'))),
        getDocs(collection(db, 'orders')),
      ]);
      setRetailers(retSnap.docs.map(d => ({ phone: d.id, ...d.data() })));
      setOrders(ordSnap.docs.map(d => d.data()));
    } catch (e) {}
    setLoading(false);
  };

  // Build retailer stats
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  const sevenDays = 7 * 24 * 60 * 60 * 1000;

  const retailerStats = retailers.map(r => {
    const myOrders = orders.filter(o => o.phone === r.phone);
    const lastOrder = myOrders.length > 0
      ? myOrders.reduce((latest, o) => (!latest || (o.createdAt || '') > latest) ? (o.createdAt || '') : latest, '')
      : null;
    const last30 = myOrders.filter(o => o.createdAt && (now - new Date(o.createdAt).getTime()) < thirtyDays);
    const last7 = myOrders.filter(o => o.createdAt && (now - new Date(o.createdAt).getTime()) < sevenDays);
    const totalSpent = myOrders.reduce((s, o) => s + (o.total || 0), 0);
    const daysSinceOrder = lastOrder ? Math.floor((now - new Date(lastOrder).getTime()) / (24 * 60 * 60 * 1000)) : null;

    let status = 'active';
    if (!lastOrder) status = 'never';
    else if (daysSinceOrder > 30) status = 'inactive';
    else if (daysSinceOrder > 7) status = 'slowing';

    return { ...r, lastOrder, last30Count: last30.length, last7Count: last7.length, totalOrders: myOrders.length, totalSpent, daysSinceOrder, status };
  });

  retailerStats.sort((a, b) => {
    if (a.status === 'never' && b.status !== 'never') return 1;
    if (b.status === 'never' && a.status !== 'never') return -1;
    return (b.last7Count - a.last7Count) || (b.last30Count - a.last30Count);
  });

  const filtered = filter === 'all' ? retailerStats
    : filter === 'active' ? retailerStats.filter(r => r.status === 'active')
    : filter === 'inactive' ? retailerStats.filter(r => r.status === 'inactive' || r.status === 'slowing')
    : retailerStats.filter(r => r.status === 'never');

  const activeCount = retailerStats.filter(r => r.status === 'active').length;
  const slowCount = retailerStats.filter(r => r.status === 'slowing').length;
  const inactiveCount = retailerStats.filter(r => r.status === 'inactive').length;
  const neverCount = retailerStats.filter(r => r.status === 'never').length;

  const statusConfig = {
    active: { color: 'text-green-400', bg: 'bg-green-900/20 border-green-800/50', dot: 'bg-green-400', label: 'Active' },
    slowing: { color: 'text-amber-400', bg: 'bg-amber-900/20 border-amber-800/50', dot: 'bg-amber-400', label: 'Slowing' },
    inactive: { color: 'text-red-400', bg: 'bg-red-900/20 border-red-800/50', dot: 'bg-red-400', label: '30d+ Inactive' },
    never: { color: 'text-gray-500', bg: 'bg-gray-800 border-gray-700', dot: 'bg-gray-600', label: 'Never Ordered' },
  };

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white">Retailer Activity</h2>
          <p className="text-[10px] text-gray-500">{retailers.length} retailers tracked</p>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={fetchData}
          className="p-2.5 bg-gray-800 border border-gray-700 rounded-xl">
          <RefreshCw size={14} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>

      {/* Churn Risk Alert */}
      {retailerStats.filter(r => r.daysSinceOrder !== null && r.daysSinceOrder >= 3 && r.daysSinceOrder < 30).length > 0 && (
        <div className="bg-red-900/20 border border-red-800/50 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertOctagon size={14} className="text-red-400" />
            <p className="text-xs font-bold text-red-400">Churn Risk ({retailerStats.filter(r => r.daysSinceOrder !== null && r.daysSinceOrder >= 3 && r.daysSinceOrder < 30).length} retailers)</p>
          </div>
          <p className="text-[10px] text-gray-400 mb-3">Haven't ordered in 3+ days — may need follow-up</p>
          <div className="space-y-1.5">
            {retailerStats.filter(r => r.daysSinceOrder !== null && r.daysSinceOrder >= 3 && r.daysSinceOrder < 30).sort((a, b) => b.daysSinceOrder - a.daysSinceOrder).slice(0, 5).map(r => (
              <div key={r.phone} className="flex items-center justify-between py-1.5 px-2 bg-red-900/10 rounded-lg">
                <span className="text-[10px] font-bold text-white">{r.name}</span>
                <span className="text-[9px] font-bold text-red-400">{r.daysSinceOrder} days</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2">
        <button onClick={() => setFilter('active')} className={`rounded-xl p-3 text-center border transition-all ${filter === 'active' ? 'ring-2 ring-green-500' : ''} bg-green-900/20 border-green-800/50`}>
          <p className="text-lg font-black text-green-400">{activeCount}</p>
          <p className="text-[8px] font-bold text-green-500/70 uppercase">Active</p>
        </button>
        <button onClick={() => setFilter('inactive')} className={`rounded-xl p-3 text-center border transition-all ${filter === 'inactive' ? 'ring-2 ring-amber-500' : ''} bg-amber-900/20 border-amber-800/50`}>
          <p className="text-lg font-black text-amber-400">{slowCount + inactiveCount}</p>
          <p className="text-[8px] font-bold text-amber-500/70 uppercase">Inactive</p>
        </button>
        <button onClick={() => setFilter('never')} className={`rounded-xl p-3 text-center border transition-all ${filter === 'never' ? 'ring-2 ring-gray-500' : ''} bg-gray-800 border-gray-700`}>
          <p className="text-lg font-black text-gray-400">{neverCount}</p>
          <p className="text-[8px] font-bold text-gray-500 uppercase">Never</p>
        </button>
        <button onClick={() => setFilter('all')} className={`rounded-xl p-3 text-center border transition-all ${filter === 'all' ? 'ring-2 ring-blue-500' : ''} bg-gray-800 border-gray-700`}>
          <p className="text-lg font-black text-white">{retailers.length}</p>
          <p className="text-[8px] font-bold text-gray-500 uppercase">All</p>
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="h-20 bg-gray-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r, i) => {
            const cfg = statusConfig[r.status];
            return (
              <motion.div key={r.phone} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 * i }}
                className={`rounded-2xl border p-4 ${cfg.bg}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-[9px] font-bold text-gray-600 bg-gray-800 w-5 h-5 rounded-md flex items-center justify-center shrink-0">{i + 1}</span>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{r.name}</p>
                      <p className="text-[10px] text-gray-500">{r.phone} • {r.area || 'No area'}</p>
                    </div>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                </div>

                <div className="flex items-center gap-4 mt-2.5 text-[10px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {r.daysSinceOrder !== null ? `${r.daysSinceOrder}d ago` : 'Never'}
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp size={10} />
                    {r.last7Count} this week
                  </span>
                  <span className="flex items-center gap-1">
                    {r.last30Count > r.last7Count * 3 ? <TrendingDown size={10} className="text-red-400" /> : <TrendingUp size={10} className="text-green-400" />}
                    {r.last30Count} / 30d
                  </span>
                  <span className="text-gray-600">{formatPrice(r.totalSpent)}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {filtered.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users size={32} className="text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No retailers in this category</p>
        </div>
      )}
    </div>
  );
}
