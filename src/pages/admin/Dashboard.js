import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Users, Package, IndianRupee, CheckCircle2, AlertTriangle, ShoppingBag, BookOpen, MessageCircle, Download, Plus, ClipboardList } from 'lucide-react';
import { db, collection, getDocs, query, where, doc, cachedGetDoc } from '../../services/firebase';
import { formatPrice } from '../../utils/price';
import { DashboardSkeleton } from '../../components/LoadingSkeleton';
import { useNavigate } from 'react-router-dom';
import { drawText } from '../../utils/pdfHelper';

const fadeUp = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } };

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ retailers: 0, todayOrders: 0, todayDelivered: 0, pendingUdhaar: 0 });
  const [payments, setPayments] = useState({ today: 0 });
  const [defaulters, setDefaulters] = useState([]);
  const [todayTotal, setTodayTotal] = useState(0);
  const [productDemand, setProductDemand] = useState([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fabOpen, setFabOpen] = useState(false);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const usersSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'retailer')));
        const retailerCount = usersSnap.size;

        const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const ordersSnap = await getDocs(query(collection(db, 'orders'), where('date', '==', today)));
        const todayOrders = ordersSnap.docs.map(d => d.data());
        const todayDelivered = todayOrders.filter(o => o.status === 'Delivered').length;
        const todayAmt = todayOrders.reduce((s, o) => s + (o.total || 0), 0);
        setTodayTotal(todayAmt);

        const balSnap = await getDocs(collection(db, 'retailer_balances'));
        // Calculate actual dues from ledger (source of truth)
        const allLedgerSnap = await getDocs(collection(db, 'ledger'));
        const allLedgerEntries = allLedgerSnap.docs.map(d => d.data());
        const dueByRetailer = {};
        allLedgerEntries.forEach(e => {
          const rid = e.retailerId;
          if (!rid) return;
          if (!dueByRetailer[rid]) dueByRetailer[rid] = 0;
          if (e.type === 'debit') dueByRetailer[rid] += (e.amount || 0);
          else dueByRetailer[rid] -= (e.amount || 0);
        });
        const totalUdhaar = Object.values(dueByRetailer).reduce((s, v) => s + Math.max(0, v), 0);

        // Map phone/id to name from users
        const nameMap = {};
        usersSnap.docs.forEach(d => { const data = d.data(); nameMap[d.id] = data.name || d.id; if (data.id) nameMap[data.id] = data.name || d.id; });

        const defaultersList = Object.entries(dueByRetailer).filter(([, bal]) => bal > 0).sort((a, b) => b[1] - a[1])
          .map(([id, balance]) => ({ id, balance, name: nameMap[id] || id, phone: id }));
        setDefaulters(defaultersList.slice(0, 6));
        setOverdueCount(defaultersList.filter(d => d.balance > 5000).length);

        const ledgerSnap = await getDocs(query(collection(db, 'ledger'), where('type', '==', 'credit'), where('date', '==', today)));
        const todayCollected = ledgerSnap.docs.reduce((s, d) => s + Math.abs(d.data().amount), 0);


        // Product demand for today
        const demandMap = {};
        todayOrders.forEach(o => {
          (o.items || []).forEach(item => {
            demandMap[item.name] = (demandMap[item.name] || 0) + (parseFloat(String(item.qty).replace(/[^0-9.]/g, '')) || 0);
          });
        });
        setProductDemand(Object.entries(demandMap).map(([name, qty]) => ({ name, qty })).sort((a, b) => b.qty - a.qty));

        setStats({ retailers: retailerCount, todayOrders: todayOrders.length, todayDelivered, pendingUdhaar: totalUdhaar });
        setPayments({ today: todayCollected });
      } catch (err) {
      }
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

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="space-y-5">
      {/* Welcome Banner */}
      <motion.div {...fadeUp}
        className="relative bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a] rounded-2xl p-6 text-white overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-royal-500/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-mint-500/10 rounded-full blur-2xl" />
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <p className="text-gray-400 text-xs font-medium">{getGreeting()},</p>
            <h2 className="text-xl font-black mt-0.5">{JSON.parse(localStorage.getItem('lg_user') || '{}').name || 'Admin'} 👋</h2>
            <p className="text-gray-400 text-xs mt-2">
              {stats.todayOrders > 0 ? `${stats.todayOrders} orders today` : 'No orders yet today'} • {stats.retailers} retailers
            </p>
          </div>
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Today's Collection</p>
            <p className="text-2xl font-black text-mint-400 mt-0.5">₹{payments.today.toLocaleString()}</p>
          </div>
        </div>
      </motion.div>

      {/* Today's Summary */}
      <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
        <h3 className="font-bold text-gray-800 dark:text-white text-[15px] mb-3">Today's Summary</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <Link to="/admin/daily-ledger">
            <div className="card !p-4 cursor-pointer hover:shadow-card-hover">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-royal-600 via-royal-700 to-royal-800 flex items-center justify-center">
                  <Package size={14} className="text-white" />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-800 dark:text-white">{stats.todayOrders}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">Orders</p>
            </div>
          </Link>
          <Link to="/admin/daily-ledger">
            <div className="card !p-4 cursor-pointer hover:shadow-card-hover">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-mint-500 via-mint-600 to-mint-700 flex items-center justify-center">
                  <CheckCircle2 size={14} className="text-white" />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-800 dark:text-white">{stats.todayDelivered}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">Delivered</p>
            </div>
          </Link>
          <Link to="/admin/daily-ledger">
            <div className="card !p-4 cursor-pointer hover:shadow-card-hover">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center">
                  <IndianRupee size={14} className="text-white" />
                </div>
              </div>
              <p className="text-2xl font-black text-gray-800 dark:text-white">{formatPrice(todayTotal)}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">Order Value</p>
            </div>
          </Link>
          <Link to="/admin/ledger">
            <div className="card !p-4 cursor-pointer hover:shadow-card-hover">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 via-green-500 to-green-600 flex items-center justify-center">
                  <IndianRupee size={14} className="text-white" />
                </div>
              </div>
              <p className="text-2xl font-black text-mint-600">{formatPrice(payments.today)}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">Collected</p>
            </div>
          </Link>
        </div>
      </motion.div>

      {/* Delivery Progress — Premium Donut */}
      <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
        <div className="card !p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-bold text-gray-800 dark:text-white">Delivery Progress</p>
            {stats.todayOrders > 0 ? (
              <span className="text-[10px] font-bold text-mint-600 bg-mint-50 dark:bg-mint-900/20 px-2.5 py-1 rounded-lg">
                {stats.todayDelivered}/{stats.todayOrders} done
              </span>
            ) : (
              <span className="text-[10px] font-bold text-gray-400 bg-gray-50 dark:bg-[#111111] px-2.5 py-1 rounded-lg">
                No orders yet
              </span>
            )}
          </div>
          <div className="flex items-center gap-6">
            {/* Donut Chart */}
            <div className="relative w-28 h-28 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" strokeWidth="10"
                  className="stroke-gray-100 dark:stroke-gray-700" />
                {stats.todayOrders > 0 && (
                  <>
                    <motion.circle cx="50" cy="50" r="40" fill="none" strokeWidth="10"
                      strokeLinecap="round" className="stroke-mint-500"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - stats.todayDelivered / stats.todayOrders) }}
                      transition={{ duration: 1.2, delay: 0.4, ease: 'easeOut' }} />
                    {stats.todayOrders - stats.todayDelivered > 0 && (() => {
                      const dispatched = stats.todayOrders - stats.todayDelivered;
                      const dispatchedPct = dispatched / stats.todayOrders;
                      const deliveredPct = stats.todayDelivered / stats.todayOrders;
                      return (
                        <motion.circle cx="50" cy="50" r="40" fill="none" strokeWidth="10"
                          strokeLinecap="round" className="stroke-amber-400"
                          strokeDasharray={`${2 * Math.PI * 40 * dispatchedPct} ${2 * Math.PI * 40 * (1 - dispatchedPct)}`}
                          strokeDashoffset={`${-2 * Math.PI * 40 * deliveredPct}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5, delay: 1.2 }} />
                      );
                    })()}
                  </>
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.6 }}
                  className="text-2xl font-black text-gray-800 dark:text-white leading-none">
                  {stats.todayOrders > 0 ? Math.round((stats.todayDelivered / stats.todayOrders) * 100) : 0}%
                </motion.span>
                <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 mt-0.5">complete</span>
              </div>
            </div>
            {/* Stats breakdown */}
            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-mint-500 shadow-sm shadow-mint-500/30" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-200">Delivered</span>
                    <span className="text-xs font-black text-mint-600">{stats.todayDelivered}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 dark:bg-[#1a1a1a] rounded-full mt-1 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: stats.todayOrders > 0 ? `${(stats.todayDelivered / stats.todayOrders) * 100}%` : '0%' }}
                      transition={{ duration: 0.8, delay: 0.6 }}
                      className="h-full bg-mint-500 rounded-full" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-400 shadow-sm shadow-amber-400/30" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-200">Pending</span>
                    <span className="text-xs font-black text-amber-600">{stats.todayOrders - stats.todayDelivered}</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 dark:bg-[#1a1a1a] rounded-full mt-1 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: stats.todayOrders > 0 ? `${((stats.todayOrders - stats.todayDelivered) / stats.todayOrders) * 100}%` : '0%' }}
                      transition={{ duration: 0.8, delay: 0.8 }}
                      className="h-full bg-amber-400 rounded-full" />
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100 dark:border-[#222222]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">Total Orders</span>
                  <span className="text-sm font-black text-gray-800 dark:text-white">{stats.todayOrders}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Business Overview */}
      <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
        <h3 className="font-bold text-gray-800 dark:text-white text-[15px] mb-3">Pending Dues</h3>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/admin/ledger">
            <div className="card !p-4 border border-red-100 dark:border-red-900/30 cursor-pointer hover:shadow-card-hover">
              <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase">Total Udhaar</p>
              <p className="text-xl font-black text-red-500 mt-1">{formatPrice(stats.pendingUdhaar)}</p>
            </div>
          </Link>
          <Link to="/admin/ledger">
            <div className="card !p-4 border border-amber-100 dark:border-amber-900/30 cursor-pointer hover:shadow-card-hover">
              <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase">Overdue ({'>'}₹5K)</p>
              <p className="text-xl font-black text-amber-600 mt-1">{overdueCount} retailers</p>
            </div>
          </Link>
        </div>
      </motion.div>

      {/* Quick Links */}
      <motion.div {...fadeUp} transition={{ delay: 0.22 }} className="grid grid-cols-3 gap-3">
        <Link to="/admin/daily-ledger">
          <motion.div whileTap={{ scale: 0.97 }} className="card !p-3.5 text-center cursor-pointer hover:shadow-card-hover">
            <ShoppingBag size={20} className="text-royal-600 mx-auto mb-1.5" />
            <p className="text-[11px] font-bold text-gray-700 dark:text-gray-200">Daily Sheet</p>
          </motion.div>
        </Link>
        <Link to="/admin/ledger">
          <motion.div whileTap={{ scale: 0.97 }} className="card !p-3.5 text-center cursor-pointer hover:shadow-card-hover">
            <BookOpen size={20} className="text-mint-600 mx-auto mb-1.5" />
            <p className="text-[11px] font-bold text-gray-700 dark:text-gray-200">Ledger</p>
          </motion.div>
        </Link>
        <Link to="/admin/retailers">
          <motion.div whileTap={{ scale: 0.97 }} className="card !p-3.5 text-center cursor-pointer hover:shadow-card-hover">
            <Users size={20} className="text-amber-600 mx-auto mb-1.5" />
            <p className="text-[11px] font-bold text-gray-700 dark:text-gray-200">Retailers</p>
          </motion.div>
        </Link>
        <motion.div whileTap={{ scale: 0.97 }} onClick={async () => {
          const { jsPDF } = await import('jspdf');
          const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
          const w = pdf.internal.pageSize.getWidth();
          const h = pdf.internal.pageSize.getHeight();
          const m = 14; let y = 0;
          const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
          const time = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
          const tableW = w - (m * 2);

          // --- Premium Header ---
          pdf.setFillColor(15, 23, 42); pdf.rect(0, 0, w, 32, 'F');
          // Accent line
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

          // --- KPI Cards ---
          const cardW = (tableW - 6) / 4;
          const cardH = 26;
          const kpis = [
            { label: 'TOTAL ORDERS', value: `${stats.todayOrders}`, sub: `${stats.todayDelivered} delivered`, color: [59, 130, 246] },
            { label: 'ORDER VALUE', value: `Rs.${todayTotal.toLocaleString('en-IN')}`, sub: 'today\'s total', color: [245, 158, 11] },
            { label: 'COLLECTED', value: `Rs.${payments.today.toLocaleString('en-IN')}`, sub: 'payments received', color: [16, 185, 129] },
            { label: 'PENDING DUES', value: `Rs.${stats.pendingUdhaar.toLocaleString('en-IN')}`, sub: `${overdueCount} overdue (>5K)`, color: [239, 68, 68] },
          ];
          kpis.forEach((kpi, i) => {
            const cx = m + i * (cardW + 2);
            pdf.setFillColor(250, 250, 252); pdf.setDrawColor(230, 232, 240);
            pdf.roundedRect(cx, y, cardW, cardH, 2.5, 2.5, 'FD');
            // Top accent bar
            pdf.setFillColor(...kpi.color); pdf.roundedRect(cx + 3, y + 2, 12, 2, 1, 1, 'F');
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(6); pdf.setTextColor(100, 116, 139);
            pdf.text(kpi.label, cx + 4, y + 9);
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(13); pdf.setTextColor(15, 23, 42);
            pdf.text(kpi.value, cx + 4, y + 17);
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6.5); pdf.setTextColor(120, 130, 150);
            pdf.text(kpi.sub, cx + 4, y + 22);
          });
          y += cardH + 8;

          // --- Delivery Progress Bar ---
          const pct = stats.todayOrders > 0 ? Math.round((stats.todayDelivered / stats.todayOrders) * 100) : 0;
          pdf.setFillColor(248, 250, 252); pdf.setDrawColor(230, 232, 240);
          pdf.roundedRect(m, y, tableW, 18, 2.5, 2.5, 'FD');
          pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(15, 23, 42);
          pdf.text('Delivery Progress', m + 5, y + 7);
          pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(100, 116, 139);
          pdf.text(`${stats.todayDelivered} of ${stats.todayOrders} orders delivered`, m + 50, y + 7);
          pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.setTextColor(16, 185, 129);
          pdf.text(`${pct}%`, w - m - 5, y + 7, { align: 'right' });
          // Progress bar background
          pdf.setFillColor(226, 232, 240); pdf.roundedRect(m + 5, y + 11, tableW - 10, 4, 2, 2, 'F');
          if (pct > 0) { pdf.setFillColor(16, 185, 129); pdf.roundedRect(m + 5, y + 11, (tableW - 10) * (pct / 100), 4, 2, 2, 'F'); }
          y += 24;

          // --- Business Overview Strip ---
          pdf.setFillColor(241, 245, 249); pdf.setDrawColor(226, 232, 240);
          pdf.roundedRect(m, y, tableW, 12, 2, 2, 'FD');
          pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7.5); pdf.setTextColor(51, 65, 85);
          const overviewItems = [
            `Retailers: ${stats.retailers}`,
            `Pending Orders: ${stats.todayOrders - stats.todayDelivered}`,
            `Total Due: Rs.${stats.pendingUdhaar.toLocaleString('en-IN')}`,
            `Overdue (>5K): ${overdueCount}`,
          ];
          const stripItemW = tableW / overviewItems.length;
          overviewItems.forEach((item, i) => {
            pdf.text(item, m + 5 + i * stripItemW, y + 7.5);
          });
          y += 18;

          // --- Product Demand Table ---
          if (productDemand.length > 0) {
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.setTextColor(15, 23, 42);
            pdf.text('Product Demand', m, y + 5);
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(100, 116, 139);
            pdf.text(`${productDemand.length} products ordered today`, m + 42, y + 5);
            y += 10;
            // Table header
            pdf.setFillColor(30, 41, 59); pdf.roundedRect(m, y, tableW, 8, 1.5, 1.5, 'F');
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7.5); pdf.setTextColor(255, 255, 255);
            pdf.text('#', m + 5, y + 5.5);
            pdf.text('PRODUCT NAME', m + 14, y + 5.5);
            pdf.text('QTY', w - m - 5, y + 5.5, { align: 'right' });
            y += 10;
            productDemand.forEach((p, i) => {
              if (y > h - 20) { pdf.addPage(); y = 12; }
              if (i % 2 === 0) { pdf.setFillColor(248, 250, 252); pdf.rect(m, y - 1.5, tableW, 7.5, 'F'); }
              pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(100, 116, 139);
              pdf.text(`${i + 1}`, m + 5, y + 4);
              pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(30, 41, 59);
              drawText(pdf, p.name.slice(0, 35), m + 14, y + 4, { bold: true, size: 9, color: [30, 41, 59] });
              pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.setTextColor(15, 23, 42);
              pdf.text(`${p.qty}`, w - m - 5, y + 4, { align: 'right' });
              y += 7.5;
            });
            y += 8;
          }

          // --- Top Defaulters Table ---
          if (defaulters.length > 0) {
            if (y > h - 60) { pdf.addPage(); y = 12; }
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.setTextColor(15, 23, 42);
            pdf.text('Top Defaulters', m, y + 5);
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(100, 116, 139);
            pdf.text(`${defaulters.length} retailers with pending dues`, m + 40, y + 5);
            y += 10;
            // Table header
            pdf.setFillColor(30, 41, 59); pdf.roundedRect(m, y, tableW, 8, 1.5, 1.5, 'F');
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7.5); pdf.setTextColor(255, 255, 255);
            pdf.text('#', m + 5, y + 5.5);
            pdf.text('RETAILER', m + 14, y + 5.5);
            pdf.text('PHONE', m + 80, y + 5.5);
            pdf.text('DUE AMOUNT', w - m - 5, y + 5.5, { align: 'right' });
            y += 10;
            defaulters.forEach((d, i) => {
              if (y > h - 15) { pdf.addPage(); y = 12; }
              if (i % 2 === 0) { pdf.setFillColor(248, 250, 252); pdf.rect(m, y - 1.5, tableW, 7.5, 'F'); }
              pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(100, 116, 139);
              pdf.text(`${i + 1}`, m + 5, y + 4);
              pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(30, 41, 59);
              drawText(pdf, (d.name || '-').slice(0, 28), m + 14, y + 4, { bold: true, size: 9, color: [30, 41, 59] });
              pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(100, 116, 139);
              pdf.text(d.phone || '-', m + 80, y + 4);
              pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9.5); pdf.setTextColor(220, 38, 38);
              pdf.text(`Rs.${d.balance.toLocaleString('en-IN')}`, w - m - 5, y + 4, { align: 'right' });
              y += 7.5;
            });
          }

          // --- Footer ---
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
        }} className="card !p-3.5 text-center cursor-pointer hover:shadow-card-hover">
          <Download size={20} className="text-red-500 mx-auto mb-1.5" />
          <p className="text-[11px] font-bold text-gray-700 dark:text-gray-200">Report</p>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Today's Product Demand */}
        {productDemand.length > 0 && (
          <motion.div {...fadeUp} transition={{ delay: 0.23 }}>
            <h3 className="font-bold text-gray-800 dark:text-white text-[15px] mb-3">Today's Demand Summary</h3>
            <div className="card !p-0 overflow-hidden">
              <div className="divide-y divide-gray-50 dark:divide-gray-700 max-h-[280px] overflow-y-auto">
                {productDemand.map((p, i) => (
                  <div key={i} className="px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-bold text-gray-400 w-5">{i + 1}</span>
                      <p className="font-semibold text-sm text-gray-800 dark:text-white">{p.name}</p>
                    </div>
                    <span className="font-black text-lg text-royal-700 dark:text-royal-300">{p.qty}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Top Defaulters */}
        <motion.div {...fadeUp} transition={{ delay: 0.25 }}>
          <div className="flex items-center gap-2 mb-3">
            <h3 className="font-bold text-gray-800 dark:text-white text-[15px]">Top Defaulters</h3>
            {overdueCount > 0 && <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">{overdueCount} overdue</span>}
          </div>
          <div className="card !p-0 overflow-hidden">
            {defaulters.length > 0 ? (
              <div className="divide-y divide-gray-50 dark:divide-gray-700">
                {defaulters.map((d, i) => (
                  <div key={i}>
                    <div className="px-4 py-3 flex items-center justify-between hover:bg-red-50/30 dark:hover:bg-red-900/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center text-red-500 font-bold text-[10px]">
                          {i + 1}
                        </div>
                        <p className="font-semibold text-sm text-gray-800 dark:text-white">{d.name}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className={`font-extrabold text-sm ${d.balance > 5000 ? 'text-red-600' : 'text-red-400'}`}>{formatPrice(d.balance)}</p>
                        <a href={`https://wa.me/91${d.phone}?text=${encodeURIComponent(`Hi ${d.name}, your pending balance at Lucy Garden is Rs.${d.balance.toLocaleString()}. Kindly clear at earliest. Thank you!`)}`} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center hover:bg-green-600 shadow-sm">
                          <MessageCircle size={14} className="text-white" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center">
                <CheckCircle2 size={24} className="text-mint-500 mx-auto mb-2" />
                <p className="text-sm text-gray-400">All clear! No pending dues.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Quick Actions FAB — Mobile Only */}
      <div className="fixed bottom-24 right-4 z-40 lg:hidden">
        <AnimatePresence>
          {fabOpen && (
            <motion.div initial={{ opacity: 0, y: 10, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10, scale: 0.9 }}
              className="absolute bottom-16 right-0 bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#222222] shadow-2xl p-2 min-w-[180px]">
              {[
                { label: 'Place Order', icon: ClipboardList, to: '/admin/place-order', color: 'text-royal-600' },
                { label: 'Daily Sheet', icon: ShoppingBag, to: '/admin/daily-ledger', color: 'text-amber-600' },
                { label: 'Ledger', icon: BookOpen, to: '/admin/ledger', color: 'text-blue-600' },
              ].map((item, i) => (
                <motion.button key={item.to} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => { setFabOpen(false); navigate(item.to); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-[#1a1a1a] transition-colors">
                  <item.icon size={16} className={item.color} />
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{item.label}</span>
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setFabOpen(!fabOpen)}
          className={`w-14 h-14 rounded-2xl shadow-xl flex items-center justify-center transition-all ${fabOpen ? 'bg-gray-800 dark:bg-white rotate-45' : 'bg-gradient-to-br from-royal-600 to-mint-600 shadow-royal-600/30'}`}>
          <Plus size={24} className={fabOpen ? 'text-white dark:text-gray-800' : 'text-white'} />
        </motion.button>
      </div>
    </div>
  );
}
