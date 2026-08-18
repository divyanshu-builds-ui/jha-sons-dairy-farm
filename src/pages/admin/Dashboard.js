import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Package, IndianRupee, CheckCircle2, Download,
  TrendingUp, AlertTriangle, MapPin, Clock,
} from 'lucide-react';
import { db, collection, getDocs, query, where, cachedGetDocs } from '../../services/firebase';
import { formatPrice } from '../../utils/price';
import { DashboardSkeleton } from '../../components/LoadingSkeleton';
import { drawText } from '../../utils/pdfHelper';

const fadeUp = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 } };

const WaIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="#fff">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.532 5.862L.054 23.25a.75.75 0 0 0 .916.916l5.388-1.478A11.955 11.955 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.686-.523-5.204-1.43l-.374-.22-3.868 1.06 1.06-3.868-.22-.374A9.956 9.956 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
  </svg>
);

export default function Dashboard() {
  const user = JSON.parse(localStorage.getItem('lg_user') || '{}');
  const [stats, setStats] = useState({ retailers: 0, todayOrders: 0, todayDelivered: 0, pendingUdhaar: 0 });
  const [payments, setPayments] = useState({ today: 0 });
  const [defaulters, setDefaulters] = useState([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [productDemand, setProductDemand] = useState([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [areaStats, setAreaStats] = useState([]);
  const [retailersOrdered, setRetailersOrdered] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const usersSnap = await cachedGetDocs(query(collection(db, 'users'), where('role', '==', 'retailer')), 'dash_users', 5 * 60 * 1000);

        const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const ordersSnap = await getDocs(query(collection(db, 'orders'), where('date', '==', today)));
        const todayOrders = ordersSnap.docs.map(d => d.data());
        const todayDelivered = todayOrders.filter(o => o.status === 'Delivered').length;
        setTodayTotal(todayOrders.reduce((s, o) => s + (o.total || 0), 0));
        setRetailersOrdered(new Set(todayOrders.map(o => o.phone)).size);

        // Area-wise breakdown
        const areaMap = {};
        todayOrders.forEach(o => {
          const area = o.area || 'Unknown';
          if (!areaMap[area]) areaMap[area] = { orders: 0, delivered: 0 };
          areaMap[area].orders++;
          if (o.status === 'Delivered') areaMap[area].delivered++;
        });
        setAreaStats(Object.entries(areaMap).map(([area, d]) => ({ area, ...d })).sort((a, b) => b.orders - a.orders));

        const allLedgerSnap = await cachedGetDocs(collection(db, 'ledger'), 'dash_ledger', 3 * 60 * 1000);
        const allLedgerEntries = allLedgerSnap.docs.map(d => d.data());
        const dueByRetailer = {};
        allLedgerEntries.forEach(e => {
          const rid = e.retailerId;
          if (!rid) return;
          if (!dueByRetailer[rid]) dueByRetailer[rid] = 0;
          dueByRetailer[rid] += e.type === 'debit' ? (e.amount || 0) : -(e.amount || 0);
        });
        const totalUdhaar = Object.values(dueByRetailer).reduce((s, v) => s + Math.max(0, v), 0);

        const nameMap = {};
        usersSnap.docs.forEach(d => { nameMap[d.id] = d.data().name || d.id; });

        const defaultersList = Object.entries(dueByRetailer)
          .filter(([, bal]) => bal > 0)
          .sort((a, b) => b[1] - a[1])
          .map(([id, balance]) => ({ id, balance, name: nameMap[id] || id, phone: id }));
        setDefaulters(defaultersList);
        setOverdueCount(defaultersList.filter(d => d.balance > 5000).length);

        const ledgerSnap = await getDocs(query(collection(db, 'ledger'), where('type', '==', 'credit'), where('date', '==', today)));
        setPayments({ today: ledgerSnap.docs.reduce((s, d) => s + Math.abs(d.data().amount), 0) });

        const demandMap = {};
        todayOrders.forEach(o => {
          (o.items || []).forEach(item => {
            demandMap[item.name] = (demandMap[item.name] || 0) + (parseFloat(String(item.qty).replace(/[^0-9.]/g, '')) || 0);
          });
        });
        setProductDemand(Object.entries(demandMap).map(([name, qty]) => ({ name, qty })).sort((a, b) => b.qty - a.qty));

        setStats({ retailers: usersSnap.size, todayOrders: todayOrders.length, todayDelivered, pendingUdhaar: totalUdhaar });
      } catch (err) {}
      setLoading(false);
    }
    fetchDashboard();
  }, []);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const todayDate = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  const pct = stats.todayOrders > 0 ? Math.round((stats.todayDelivered / stats.todayOrders) * 100) : 0;
  const pending = stats.todayOrders - stats.todayDelivered;

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="lg:grid lg:grid-cols-[1fr_290px] lg:gap-5 lg:items-start space-y-4 lg:space-y-0">

      {/* ── LEFT COLUMN ── */}
      <div className="space-y-4">

        {/* Welcome */}
        <motion.div {...fadeUp} className="bg-navy-800 dark:bg-navy-900 rounded-xl overflow-hidden">
          <div className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-white/40 text-xs">{getGreeting()}</p>
                <h2 className="text-xl font-bold text-white mt-0.5 truncate">{user.name || 'Admin'}</h2>
                <p className="text-white/30 text-[11px] mt-0.5">{todayDate}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[10px] text-white/40 uppercase tracking-wider">Collected</p>
                <p className="text-2xl font-bold text-green-400 font-mono leading-tight">
                  ₹{payments.today.toLocaleString()}
                </p>
              </div>
            </div>
          </div>
          {/* Mini stats strip */}
          <div className="grid grid-cols-3 divide-x divide-white/10 border-t border-white/10">
            {[
              { label: 'Retailers Ordered', value: retailersOrdered, sub: `of ${stats.retailers}` },
              { label: 'Pending Dispatch', value: pending, sub: 'orders left' },
              { label: 'Total Due', value: `₹${Math.round(stats.pendingUdhaar / 1000)}K`, sub: `${overdueCount} overdue` },
            ].map(({ label, value, sub }) => (
              <div key={label} className="px-4 py-3 text-center">
                <p className="text-base font-bold text-white font-mono leading-tight">{value}</p>
                <p className="text-[9px] text-white/30 mt-0.5 leading-tight">{label}</p>
                <p className="text-[9px] text-white/20">{sub}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Stat Cards */}
        <motion.div {...fadeUp} transition={{ delay: 0.05 }} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { to: '/admin/daily-ledger', label: 'Orders',      value: stats.todayOrders,          icon: Package,      accent: 'bg-navy-700',  iconBg: 'bg-navy-50 dark:bg-navy-900/40',   iconColor: 'text-navy-700 dark:text-navy-300' },
            { to: '/admin/daily-ledger', label: 'Delivered',   value: stats.todayDelivered,        icon: CheckCircle2, accent: 'bg-green-600', iconBg: 'bg-green-50 dark:bg-green-900/30', iconColor: 'text-green-700 dark:text-green-400' },
            { to: '/admin/daily-ledger', label: 'Order Value', value: formatPrice(todayTotal),     icon: IndianRupee,  accent: 'bg-amber-500', iconBg: 'bg-amber-50 dark:bg-amber-900/30', iconColor: 'text-amber-700 dark:text-amber-400' },
            { to: '/admin/ledger',       label: 'Collected',   value: formatPrice(payments.today), icon: TrendingUp,   accent: 'bg-green-600', iconBg: 'bg-green-50 dark:bg-green-900/30', iconColor: 'text-green-700 dark:text-green-400' },
          ].map(({ to, label, value, icon: Icon, accent, iconBg, iconColor }) => (
            <Link key={label} to={to}>
              <div className="card !p-0 overflow-hidden hover:shadow-md transition-shadow group">
                <div className={`h-0.5 ${accent}`} />
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <p className="text-[10px] font-bold text-warm-400 uppercase tracking-wide">{label}</p>
                    <div className={`w-7 h-7 ${iconBg} rounded-lg flex items-center justify-center`}>
                      <Icon size={13} className={iconColor} />
                    </div>
                  </div>
                  <p className="text-2xl font-bold text-warm-800 dark:text-warm-100 font-mono leading-none">{value}</p>
                </div>
              </div>
            </Link>
          ))}
        </motion.div>

        {/* Delivery Progress — segmented bar */}
        <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
          <div className="card !p-5">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-bold text-warm-800 dark:text-warm-100">Delivery Progress</p>
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                pct === 100 ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                : stats.todayOrders > 0 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                : 'bg-warm-100 dark:bg-[#2e2d2b] text-warm-400'
              }`}>
                {stats.todayOrders > 0 ? `${pct}% complete` : 'No orders yet'}
              </span>
            </div>

            {/* Segmented progress bar */}
            <div className="w-full h-3 bg-warm-100 dark:bg-[#2e2d2b] rounded-full overflow-hidden mb-4">
              <motion.div
                className="h-full bg-green-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Delivered', value: stats.todayDelivered, color: 'text-green-700 dark:text-green-400', dot: 'bg-green-500' },
                { label: 'Pending',   value: pending,               color: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-400' },
                { label: 'Total',     value: stats.todayOrders,     color: 'text-warm-800 dark:text-warm-100',   dot: 'bg-warm-300 dark:bg-warm-600' },
              ].map(({ label, value, color, dot }) => (
                <div key={label} className="bg-warm-50 dark:bg-[#2e2d2b] rounded-lg px-3 py-2.5 text-center">
                  <div className="flex items-center justify-center gap-1.5 mb-1">
                    <div className={`w-2 h-2 rounded-full ${dot}`} />
                    <p className="text-[10px] text-warm-400 font-semibold">{label}</p>
                  </div>
                  <p className={`text-xl font-bold font-mono ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Dues */}
        <motion.div {...fadeUp} transition={{ delay: 0.15 }} className="grid grid-cols-2 gap-3">
          <Link to="/admin/ledger">
            <div className="card !p-0 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-0.5 bg-red-500" />
              <div className="p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertTriangle size={12} className="text-red-500" />
                  <p className="text-[10px] font-bold text-warm-400 uppercase tracking-wide">Total Udhaar</p>
                </div>
                <p className="text-2xl font-bold text-red-600 font-mono leading-none">{formatPrice(stats.pendingUdhaar)}</p>
                <p className="text-[10px] text-warm-400 mt-1.5">{defaulters.length} retailers with dues</p>
              </div>
            </div>
          </Link>
          <Link to="/admin/ledger">
            <div className="card !p-0 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-0.5 bg-amber-500" />
              <div className="p-4">
                <div className="flex items-center gap-1.5 mb-2">
                  <Clock size={12} className="text-amber-500" />
                  <p className="text-[10px] font-bold text-warm-400 uppercase tracking-wide">Overdue {'>'}₹5K</p>
                </div>
                <p className="text-2xl font-bold text-amber-600 font-mono leading-none">{overdueCount}</p>
                <p className="text-[10px] text-warm-400 mt-1.5">retailers need attention</p>
              </div>
            </div>
          </Link>
        </motion.div>

        {/* Area Breakdown */}
        {areaStats.length > 0 && (
          <motion.div {...fadeUp} transition={{ delay: 0.18 }}>
            <div className="flex items-center gap-2 mb-2">
              <MapPin size={12} className="text-warm-400" />
              <p className="text-[11px] font-bold text-warm-500 dark:text-warm-400 uppercase tracking-wide">Area Breakdown</p>
            </div>
            <div className="card !p-0 overflow-hidden">
              <div className="divide-y divide-warm-100 dark:divide-[#2e2d2b]">
                {areaStats.map(({ area, orders, delivered }) => {
                  const areaPct = orders > 0 ? Math.round((delivered / orders) * 100) : 0;
                  return (
                    <div key={area} className="px-4 py-3 flex items-center gap-4">
                      <p className="text-sm font-semibold text-warm-800 dark:text-warm-100 w-28 truncate shrink-0">{area}</p>
                      <div className="flex-1">
                        <div className="w-full h-1.5 bg-warm-100 dark:bg-[#2e2d2b] rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-navy-600 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${areaPct}%` }}
                            transition={{ duration: 0.8, delay: 0.3 }}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs font-bold text-warm-800 dark:text-warm-100 font-mono w-8 text-right">{orders}</span>
                        <span className="text-[10px] text-green-600 dark:text-green-400 font-semibold w-14 text-right">{delivered} done</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {/* Mobile — Demand */}
        {productDemand.length > 0 && (
          <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="lg:hidden">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold text-warm-500 dark:text-warm-400 uppercase tracking-wide">Today's Demand</p>
              <span className="text-[10px] text-warm-400">{productDemand.length} products</span>
            </div>
            <div className="card !p-0 overflow-hidden">
              <div className="divide-y divide-warm-100 dark:divide-[#2e2d2b]">
                {productDemand.map((p, i) => (
                  <div key={i} className="px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-warm-400 w-4 text-right">{i + 1}</span>
                      <p className="text-sm font-medium text-warm-800 dark:text-warm-100">{p.name}</p>
                    </div>
                    <span className="text-base font-bold text-navy-700 dark:text-navy-300 font-mono">{p.qty}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Mobile — Defaulters */}
        <motion.div {...fadeUp} transition={{ delay: 0.22 }} className="lg:hidden">
          <div className="flex items-center gap-2 mb-2">
            <p className="text-[11px] font-bold text-warm-500 dark:text-warm-400 uppercase tracking-wide">Top Defaulters</p>
            {overdueCount > 0 && <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full">{overdueCount}</span>}
          </div>
          <div className="card !p-0 overflow-hidden">
            {defaulters.length > 0 ? (
              <div className="divide-y divide-warm-100 dark:divide-[#2e2d2b]">
                {defaulters.map((d, i) => (
                  <div key={i} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[10px] font-bold text-warm-400 w-4 text-right shrink-0">{i + 1}</span>
                      <p className="text-sm font-semibold text-warm-800 dark:text-warm-100 truncate">{d.name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <p className={`text-sm font-bold font-mono ${d.balance > 5000 ? 'text-red-600' : 'text-red-400'}`}>{formatPrice(d.balance)}</p>
                      <a href={`https://wa.me/91${d.phone}?text=${encodeURIComponent(`Hi ${d.name}, your pending balance at Lucy Garden is Rs.${d.balance.toLocaleString()}. Kindly clear at earliest. Thank you!`)}`}
                        target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                        className="w-7 h-7 bg-[#25D366] rounded-lg flex items-center justify-center hover:bg-[#1ebe5d] shrink-0">
                        <WaIcon />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <CheckCircle2 size={22} className="text-green-500 mx-auto mb-2" />
                <p className="text-sm text-warm-400">All clear! No pending dues.</p>
              </div>
            )}
          </div>
        </motion.div>

      </div>

      {/* ── RIGHT COLUMN (desktop only) ── */}
      <div className="hidden lg:flex flex-col gap-4 sticky top-[57px]">

        {/* Download Report */}
        <motion.button {...fadeUp} transition={{ delay: 0.05 }}
          onClick={async () => {
            const { jsPDF } = await import('jspdf');
            const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
            const w = pdf.internal.pageSize.getWidth();
            const h = pdf.internal.pageSize.getHeight();
            const m = 14; let y = 0;
            const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            const tableW = w - m * 2;

            pdf.setFillColor(15, 23, 42); pdf.rect(0, 0, w, 32, 'F');
            pdf.setFillColor(16, 185, 129); pdf.rect(0, 32, w, 1.2, 'F');
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(18); pdf.setTextColor(255, 255, 255);
            pdf.text('LUCY GARDEN', m, 13);
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(148, 163, 184);
            pdf.text('Fresh Dairy Supply', m, 20);
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.setTextColor(255, 255, 255);
            pdf.text('DAILY BUSINESS REPORT', w - m, 13, { align: 'right' });
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(148, 163, 184);
            pdf.text(today, w - m, 20, { align: 'right' });
            pdf.setFontSize(8); pdf.setTextColor(100, 116, 139);
            pdf.text(`Generated at ${time}`, w - m, 27, { align: 'right' });
            y = 39;

            const cardW = (tableW - 6) / 4; const cardH = 26;
            const kpis = [
              { label: 'TOTAL ORDERS', value: `${stats.todayOrders}`, sub: `${stats.todayDelivered} delivered`, color: [59, 130, 246] },
              { label: 'ORDER VALUE', value: `Rs.${todayTotal.toLocaleString('en-IN')}`, sub: "today's total", color: [245, 158, 11] },
              { label: 'COLLECTED', value: `Rs.${payments.today.toLocaleString('en-IN')}`, sub: 'payments received', color: [16, 185, 129] },
              { label: 'PENDING DUES', value: `Rs.${stats.pendingUdhaar.toLocaleString('en-IN')}`, sub: `${overdueCount} overdue (>5K)`, color: [239, 68, 68] },
            ];
            kpis.forEach((kpi, i) => {
              const cx = m + i * (cardW + 2);
              pdf.setFillColor(250, 250, 252); pdf.setDrawColor(230, 232, 240);
              pdf.roundedRect(cx, y, cardW, cardH, 2.5, 2.5, 'FD');
              pdf.setFillColor(...kpi.color); pdf.roundedRect(cx + 3, y + 2, 12, 2, 1, 1, 'F');
              pdf.setFont('helvetica', 'bold'); pdf.setFontSize(6); pdf.setTextColor(100, 116, 139);
              pdf.text(kpi.label, cx + 4, y + 9);
              pdf.setFont('helvetica', 'bold'); pdf.setFontSize(13); pdf.setTextColor(15, 23, 42);
              pdf.text(kpi.value, cx + 4, y + 17);
              pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6.5); pdf.setTextColor(120, 130, 150);
              pdf.text(kpi.sub, cx + 4, y + 22);
            });
            y += cardH + 8;

            const pctPdf = stats.todayOrders > 0 ? Math.round((stats.todayDelivered / stats.todayOrders) * 100) : 0;
            pdf.setFillColor(248, 250, 252); pdf.setDrawColor(230, 232, 240);
            pdf.roundedRect(m, y, tableW, 18, 2.5, 2.5, 'FD');
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(15, 23, 42);
            pdf.text('Delivery Progress', m + 5, y + 7);
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(100, 116, 139);
            pdf.text(`${stats.todayDelivered} of ${stats.todayOrders} delivered`, m + 50, y + 7);
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.setTextColor(16, 185, 129);
            pdf.text(`${pctPdf}%`, w - m - 5, y + 7, { align: 'right' });
            pdf.setFillColor(226, 232, 240); pdf.roundedRect(m + 5, y + 11, tableW - 10, 4, 2, 2, 'F');
            if (pctPdf > 0) { pdf.setFillColor(16, 185, 129); pdf.roundedRect(m + 5, y + 11, (tableW - 10) * (pctPdf / 100), 4, 2, 2, 'F'); }
            y += 24;

            pdf.setFillColor(241, 245, 249); pdf.setDrawColor(226, 232, 240);
            pdf.roundedRect(m, y, tableW, 12, 2, 2, 'FD');
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7.5); pdf.setTextColor(51, 65, 85);
            const overviewItems = [`Retailers: ${stats.retailers}`, `Ordered: ${retailersOrdered}`, `Total Due: Rs.${stats.pendingUdhaar.toLocaleString('en-IN')}`, `Overdue (>5K): ${overdueCount}`];
            overviewItems.forEach((item, i) => { pdf.text(item, m + 5 + i * (tableW / overviewItems.length), y + 7.5); });
            y += 18;

            if (productDemand.length > 0) {
              pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.setTextColor(15, 23, 42);
              pdf.text('Product Demand', m, y + 5);
              pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(100, 116, 139);
              pdf.text(`${productDemand.length} products`, m + 42, y + 5);
              y += 10;
              pdf.setFillColor(30, 41, 59); pdf.roundedRect(m, y, tableW, 8, 1.5, 1.5, 'F');
              pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7.5); pdf.setTextColor(255, 255, 255);
              pdf.text('#', m + 5, y + 5.5); pdf.text('PRODUCT NAME', m + 14, y + 5.5); pdf.text('QTY', w - m - 5, y + 5.5, { align: 'right' });
              y += 10;
              productDemand.forEach((p, i) => {
                if (y > h - 20) { pdf.addPage(); y = 12; }
                if (i % 2 === 0) { pdf.setFillColor(248, 250, 252); pdf.rect(m, y - 1.5, tableW, 7.5, 'F'); }
                pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(100, 116, 139);
                pdf.text(`${i + 1}`, m + 5, y + 4);
                drawText(pdf, p.name.slice(0, 35), m + 14, y + 4, { bold: true, size: 9, color: [30, 41, 59] });
                pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.setTextColor(15, 23, 42);
                pdf.text(`${p.qty}`, w - m - 5, y + 4, { align: 'right' });
                y += 7.5;
              });
              y += 8;
            }

            if (defaulters.length > 0) {
              if (y > h - 60) { pdf.addPage(); y = 12; }
              pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.setTextColor(15, 23, 42);
              pdf.text('Top Defaulters', m, y + 5);
              y += 10;
              pdf.setFillColor(30, 41, 59); pdf.roundedRect(m, y, tableW, 8, 1.5, 1.5, 'F');
              pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7.5); pdf.setTextColor(255, 255, 255);
              pdf.text('#', m + 5, y + 5.5); pdf.text('RETAILER', m + 14, y + 5.5); pdf.text('PHONE', m + 80, y + 5.5); pdf.text('DUE AMOUNT', w - m - 5, y + 5.5, { align: 'right' });
              y += 10;
              defaulters.forEach((d, i) => {
                if (y > h - 15) { pdf.addPage(); y = 12; }
                if (i % 2 === 0) { pdf.setFillColor(248, 250, 252); pdf.rect(m, y - 1.5, tableW, 7.5, 'F'); }
                pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(100, 116, 139);
                pdf.text(`${i + 1}`, m + 5, y + 4);
                drawText(pdf, (d.name || '-').slice(0, 28), m + 14, y + 4, { bold: true, size: 9, color: [30, 41, 59] });
                pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(100, 116, 139);
                pdf.text(d.phone || '-', m + 80, y + 4);
                pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9.5); pdf.setTextColor(220, 38, 38);
                pdf.text(`Rs.${d.balance.toLocaleString('en-IN')}`, w - m - 5, y + 4, { align: 'right' });
                y += 7.5;
              });
            }

            const pageCount = pdf.getNumberOfPages();
            for (let p = 1; p <= pageCount; p++) {
              pdf.setPage(p);
              pdf.setFillColor(248, 250, 252); pdf.rect(0, h - 12, w, 12, 'F');
              pdf.setDrawColor(226, 232, 240); pdf.line(m, h - 12, w - m, h - 12);
              pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(150, 150, 150);
              pdf.text('Lucy Garden • Daily Business Report • Confidential', m, h - 5);
              pdf.text(`Page ${p} of ${pageCount}`, w - m, h - 5, { align: 'right' });
            }
            pdf.save(`LG_Report_${today.replace(/[\s,]/g, '')}.pdf`);
          }}
          className="w-full card !p-4 flex items-center gap-3 hover:shadow-md transition-shadow text-left">
          <div className="w-9 h-9 bg-navy-50 dark:bg-navy-900/30 rounded-lg flex items-center justify-center shrink-0">
            <Download size={15} className="text-navy-700 dark:text-navy-300" />
          </div>
          <div>
            <p className="text-sm font-semibold text-warm-800 dark:text-warm-100">Download Report</p>
            <p className="text-[10px] text-warm-400">Daily business PDF</p>
          </div>
        </motion.button>

        {/* Product Demand */}
        {productDemand.length > 0 && (
          <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold text-warm-500 dark:text-warm-400 uppercase tracking-wide">Today's Demand</p>
              <span className="text-[10px] text-warm-400">{productDemand.length} products</span>
            </div>
            <div className="card !p-0 overflow-hidden">
              <div className="divide-y divide-warm-100 dark:divide-[#2e2d2b] max-h-[480px] overflow-y-auto">
                {productDemand.map((p, i) => (
                  <div key={i} className="px-4 py-2.5 flex items-center justify-between hover:bg-warm-50 dark:hover:bg-[#222] transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-warm-400 w-4 text-right">{i + 1}</span>
                      <p className="text-sm font-medium text-warm-800 dark:text-warm-100">{p.name}</p>
                    </div>
                    <span className="text-base font-bold text-navy-700 dark:text-navy-300 font-mono">{p.qty}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Top Defaulters */}
        <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
          <div className="flex items-center gap-2 mb-2">
            <p className="text-[11px] font-bold text-warm-500 dark:text-warm-400 uppercase tracking-wide">Top Defaulters</p>
            {overdueCount > 0 && <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full">{overdueCount}</span>}
          </div>
          <div className="card !p-0 overflow-hidden">
            {defaulters.length > 0 ? (
              <div className="divide-y divide-warm-100 dark:divide-[#2e2d2b]">
                {defaulters.map((d, i) => (
                  <div key={i} className="px-4 py-2.5 flex items-center justify-between hover:bg-warm-50 dark:hover:bg-[#222] transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-[10px] font-bold text-warm-400 w-4 text-right shrink-0">{i + 1}</span>
                      <p className="text-sm font-semibold text-warm-800 dark:text-warm-100 truncate">{d.name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <p className={`text-sm font-bold font-mono ${d.balance > 5000 ? 'text-red-600' : 'text-red-400'}`}>
                        {formatPrice(d.balance)}
                      </p>
                      <a href={`https://wa.me/91${d.phone}?text=${encodeURIComponent(`Hi ${d.name}, your pending balance at Lucy Garden is Rs.${d.balance.toLocaleString()}. Kindly clear at earliest. Thank you!`)}`}
                        target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                        className="w-7 h-7 bg-[#25D366] rounded-lg flex items-center justify-center hover:bg-[#1ebe5d] shrink-0">
                        <WaIcon />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-5 text-center">
                <CheckCircle2 size={20} className="text-green-500 mx-auto mb-1.5" />
                <p className="text-sm text-warm-400">All clear!</p>
              </div>
            )}
          </div>
        </motion.div>

      </div>

    </div>
  );
}
