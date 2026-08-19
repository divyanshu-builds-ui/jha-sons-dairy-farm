import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShoppingCart, TrendingUp, Clock, Package, RefreshCw, Calendar, ArrowUpRight, ArrowDownRight, IndianRupee } from 'lucide-react';
import { db, collection, getDocs, query, orderBy, limit } from '../../services/firebase';
import { formatPrice } from '../../utils/price';

const getDateStr = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return getDateStr(d); };

export default function OrderAnalytics() {
  const [allOrders, setAllOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7');

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(500)));
      setAllOrders(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {}
    setLoading(false);
  };

  const cutoff = new Date(Date.now() - Number(period) * 24 * 60 * 60 * 1000);
  const orders = allOrders.filter(o => o.createdAt && new Date(o.createdAt) >= cutoff);

  const today = getDateStr(new Date());
  const yesterday = daysAgo(1);
  const lastWeekDay = daysAgo(7);

  const todayOrders = allOrders.filter(o => o.date === today);
  const yesterdayOrders = allOrders.filter(o => o.date === yesterday);
  const lastWeekOrders = allOrders.filter(o => o.date === lastWeekDay);

  const todayRevenue = todayOrders.reduce((s, o) => s + (o.total || 0), 0);
  const yesterdayRevenue = yesterdayOrders.reduce((s, o) => s + (o.total || 0), 0);
  const lastWeekRevenue = lastWeekOrders.reduce((s, o) => s + (o.total || 0), 0);

  const totalRevenue = orders.reduce((s, o) => s + (o.total || 0), 0);
  const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

  // Revenue comparison
  const revChange = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue * 100).toFixed(0) : 0;
  const orderChange = yesterdayOrders.length > 0 ? ((todayOrders.length - yesterdayOrders.length) / yesterdayOrders.length * 100).toFixed(0) : 0;

  // Daily revenue graph (last 7 days)
  const revenueGraph = [];
  for (let i = 6; i >= 0; i--) {
    const date = daysAgo(i);
    const dayOrders = allOrders.filter(o => o.date === date);
    revenueGraph.push({ date, revenue: dayOrders.reduce((s, o) => s + (o.total || 0), 0), count: dayOrders.length });
  }
  const maxRevenue = Math.max(...revenueGraph.map(d => d.revenue), 1);

  // Product-wise breakdown
  const productMap = {};
  orders.forEach(o => {
    (o.items || []).forEach(item => {
      const name = item.name;
      if (!productMap[name]) productMap[name] = { qty: 0, revenue: 0, orders: 0 };
      productMap[name].qty += parseFloat(String(item.qty).replace(/[^0-9.]/g, '')) || 0;
      productMap[name].revenue += (item.price || 0) * (parseFloat(String(item.qty).replace(/[^0-9.]/g, '')) || 0);
      productMap[name].orders++;
    });
  });
  const topProducts = Object.entries(productMap).sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 10);
  const maxProductRev = topProducts.length > 0 ? topProducts[0][1].revenue : 1;

  // Peak hours
  const hourMap = {};
  orders.forEach(o => { if (!o.createdAt) return; const hr = new Date(o.createdAt).getHours(); hourMap[hr] = (hourMap[hr] || 0) + 1; });
  const peakHours = Object.entries(hourMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxHourCount = peakHours.length > 0 ? peakHours[0][1] : 1;

  // Status breakdown
  const statusMap = {};
  orders.forEach(o => { statusMap[o.status || 'Unknown'] = (statusMap[o.status || 'Unknown'] || 0) + 1; });
  const statusColors = { Pending: 'text-amber-400', Confirmed: 'text-blue-400', Dispatched: 'text-purple-400', Delivered: 'text-green-400', Cancelled: 'text-red-400', Returned: 'text-gray-400' };

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white">Order Analytics</h2>
          <p className="text-[10px] text-gray-500">{orders.length} orders in last {period} days</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={period} onChange={e => setPeriod(e.target.value)}
            className="text-[10px] font-bold bg-gray-800 border border-gray-700 text-gray-300 rounded-lg px-2 py-1.5">
            <option value="1">Today</option><option value="7">7 Days</option><option value="30">30 Days</option><option value="90">90 Days</option>
          </select>
          <motion.button whileTap={{ scale: 0.9 }} onClick={fetchOrders} className="p-2.5 bg-gray-800 border border-gray-700 rounded-xl">
            <RefreshCw size={14} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <IndianRupee size={12} className="text-green-500" />
            <span className="text-[9px] font-bold text-gray-500 uppercase">Today Revenue</span>
          </div>
          <p className="text-xl font-black text-white">{formatPrice(todayRevenue)}</p>
          <div className="flex items-center gap-1 mt-1">
            {Number(revChange) >= 0 ? <ArrowUpRight size={10} className="text-green-400" /> : <ArrowDownRight size={10} className="text-red-400" />}
            <span className={`text-[9px] font-bold ${Number(revChange) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{revChange}% vs yesterday</span>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <ShoppingCart size={12} className="text-blue-500" />
            <span className="text-[9px] font-bold text-gray-500 uppercase">Today Orders</span>
          </div>
          <p className="text-xl font-black text-white">{todayOrders.length}</p>
          <div className="flex items-center gap-1 mt-1">
            {Number(orderChange) >= 0 ? <ArrowUpRight size={10} className="text-green-400" /> : <ArrowDownRight size={10} className="text-red-400" />}
            <span className={`text-[9px] font-bold ${Number(orderChange) >= 0 ? 'text-green-400' : 'text-red-400'}`}>{orderChange}% vs yesterday</span>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={12} className="text-purple-500" />
            <span className="text-[9px] font-bold text-gray-500 uppercase">Avg Order</span>
          </div>
          <p className="text-xl font-black text-white">{formatPrice(avgOrderValue)}</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Package size={12} className="text-amber-500" />
            <span className="text-[9px] font-bold text-gray-500 uppercase">Products Sold</span>
          </div>
          <p className="text-xl font-black text-white">{Object.keys(productMap).length}</p>
        </div>
      </div>

      {/* Day Comparison Table */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <p className="text-xs font-bold text-gray-500 uppercase mb-3">Day Comparison</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-gray-800/50 rounded-xl p-3">
            <p className="text-[9px] text-gray-500 uppercase mb-1">Last Week</p>
            <p className="text-sm font-black text-gray-300">{formatPrice(lastWeekRevenue)}</p>
            <p className="text-[9px] text-gray-500">{lastWeekOrders.length} orders</p>
          </div>
          <div className="bg-gray-800/50 rounded-xl p-3">
            <p className="text-[9px] text-gray-500 uppercase mb-1">Yesterday</p>
            <p className="text-sm font-black text-gray-300">{formatPrice(yesterdayRevenue)}</p>
            <p className="text-[9px] text-gray-500">{yesterdayOrders.length} orders</p>
          </div>
          <div className="bg-green-900/20 border border-green-800/50 rounded-xl p-3">
            <p className="text-[9px] text-green-500 uppercase mb-1">Today</p>
            <p className="text-sm font-black text-green-400">{formatPrice(todayRevenue)}</p>
            <p className="text-[9px] text-green-500">{todayOrders.length} orders</p>
          </div>
        </div>
      </div>

      {/* Revenue Graph (7 days) */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <p className="text-xs font-bold text-gray-500 uppercase mb-3">
          <IndianRupee size={11} className="inline mr-1" />Revenue (Last 7 Days)
        </p>
        <div className="flex items-end gap-1.5 h-28">
          {revenueGraph.map((d, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[8px] text-gray-500 font-bold">{d.revenue > 0 ? `₹${(d.revenue/1000).toFixed(1)}k` : ''}</span>
              <motion.div initial={{ height: 0 }} animate={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
                transition={{ duration: 0.5, delay: 0.05 * i }}
                className={`w-full rounded-t-lg min-h-[4px] ${i === 6 ? 'bg-gradient-to-t from-green-600 to-green-400' : 'bg-gradient-to-t from-gray-700 to-gray-500'}`} />
              <span className="text-[8px] text-gray-600">{d.date.split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Product-wise Revenue Breakdown */}
      {topProducts.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <p className="text-xs font-bold text-gray-500 uppercase mb-3">
            <Package size={11} className="inline mr-1" />Product Revenue Breakdown
          </p>
          <div className="space-y-2.5">
            {topProducts.map(([name, data], i) => (
              <div key={name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-[9px] font-bold text-gray-600 bg-gray-800 w-5 h-5 rounded-md flex items-center justify-center shrink-0">{i + 1}</span>
                    <p className="text-[11px] font-bold text-white truncate">{name}</p>
                  </div>
                  <span className="text-[10px] font-bold text-green-400 ml-2">{formatPrice(data.revenue)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(data.revenue / maxProductRev) * 100}%` }}
                      transition={{ duration: 0.5, delay: 0.03 * i }}
                      className="h-full bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full" />
                  </div>
                  <span className="text-[9px] text-gray-500 w-14 text-right">{data.qty} qty</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Breakdown */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <p className="text-xs font-bold text-gray-500 uppercase mb-3">Status Breakdown</p>
        <div className="flex flex-wrap gap-3">
          {Object.entries(statusMap).map(([status, count]) => (
            <div key={status} className="flex items-center gap-2">
              <span className={`text-sm font-black ${statusColors[status] || 'text-gray-400'}`}>{count}</span>
              <span className="text-[10px] text-gray-500">{status}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Peak Hours */}
      {peakHours.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <p className="text-xs font-bold text-gray-500 uppercase mb-3">
            <Clock size={11} className="inline mr-1" />Peak Hours
          </p>
          <div className="space-y-2">
            {peakHours.map(([hr, count]) => (
              <div key={hr} className="flex items-center gap-3">
                <span className="text-[10px] text-gray-400 w-12 shrink-0">{Number(hr) > 12 ? `${Number(hr)-12} PM` : Number(hr) === 0 ? '12 AM' : `${hr} AM`}</span>
                <div className="flex-1 h-4 bg-gray-800 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(count / maxHourCount) * 100}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full" />
                </div>
                <span className="text-[10px] font-bold text-gray-300 w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
