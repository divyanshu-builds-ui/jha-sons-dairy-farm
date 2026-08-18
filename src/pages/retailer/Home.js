import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ShoppingCart, BookOpen, AlertTriangle, Truck, Clock, Package,
  CheckCircle2, Flame, IndianRupee, Info, ChevronRight, TrendingUp, History,
  User, Settings, Headphones, GraduationCap,
} from 'lucide-react';
import { db, doc, collection, query, where, orderBy, getDocs, limit, cachedGetDoc } from '../../services/firebase';
import { formatPrice } from '../../utils/price';
import { useCache } from '../../hooks/useCache';

const getDayIndex = (len) => {
  const d = new Date();
  return (d.getFullYear() * 1000 + d.getMonth() * 32 + d.getDate()) % len;
};

const GREETINGS = [
  'Your orders, delivered fresh daily.', 'Quality dairy at your doorstep.', 'Fresh stock ready for tomorrow.',
  'Trusted supply, every single day.', 'Your daily dairy partner.', 'Freshness guaranteed, always.',
  'Reliable delivery, rain or shine.', 'Quality you can count on.', 'Fresh from farm to your shop.',
  'Your business, our priority.', 'Consistent quality, daily delivery.', 'Built on trust, delivered with care.',
  'Fresh products, happy customers.', 'Your growth is our success.', 'Premium dairy, affordable prices.',
  'Order today, deliver tomorrow.', 'Simplifying your daily supply.', 'Where freshness meets reliability.',
];

const fadeUp = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0, transition: { duration: 0.16 } } };
const fmtHour = (h) => h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;

const STATUS_CFG = {
  'Pending':    { color: 'text-amber-700 dark:text-amber-400',  bg: 'bg-amber-50 dark:bg-amber-950/30',  border: 'border-amber-200 dark:border-amber-800',  icon: Clock,        step: 0 },
  'Confirmed':  { color: 'text-navy-700 dark:text-navy-300',    bg: 'bg-navy-50 dark:bg-navy-950/30',    border: 'border-navy-200 dark:border-navy-800',    icon: CheckCircle2, step: 1 },
  'Dispatched': { color: 'text-blue-700 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-950/30',    border: 'border-blue-200 dark:border-blue-800',    icon: Truck,        step: 2 },
  'In Transit': { color: 'text-blue-700 dark:text-blue-400',    bg: 'bg-blue-50 dark:bg-blue-950/30',    border: 'border-blue-200 dark:border-blue-800',    icon: Truck,        step: 2 },
  'Delivered':  { color: 'text-green-700 dark:text-green-400',  bg: 'bg-green-50 dark:bg-green-950/30',  border: 'border-green-200 dark:border-green-800',  icon: CheckCircle2, step: 3 },
  'Cancelled':  { color: 'text-red-700 dark:text-red-400',      bg: 'bg-red-50 dark:bg-red-950/30',      border: 'border-red-200 dark:border-red-800',      icon: Clock,        step: -1 },
  'Returned':   { color: 'text-warm-600 dark:text-warm-400',    bg: 'bg-warm-100 dark:bg-warm-800/20',   border: 'border-warm-200 dark:border-warm-700',    icon: Clock,        step: -1 },
};

// Order window countdown
const getOrderWindowInfo = (timing) => {
  const now = new Date();
  const h = now.getHours() + now.getMinutes() / 60;
  if (timing.orderStart === -1 || timing.orderEnd === -1) return { open: true, label: 'Open anytime' };
  if (h >= timing.orderStart && h < timing.orderEnd) {
    const remaining = timing.orderEnd - h;
    const hrs = Math.floor(remaining);
    const mins = Math.round((remaining - hrs) * 60);
    return { open: true, label: hrs > 0 ? `Closes in ${hrs}h ${mins}m` : `Closes in ${mins}m` };
  }
  if (h < timing.orderStart) {
    const wait = timing.orderStart - h;
    const hrs = Math.floor(wait);
    const mins = Math.round((wait - hrs) * 60);
    return { open: false, label: hrs > 0 ? `Opens in ${hrs}h ${mins}m` : `Opens in ${mins}m` };
  }
  return { open: false, label: 'Opens tomorrow' };
};

export default function Home() {
  const user = JSON.parse(localStorage.getItem('lg_user') || '{}');

  const { data: homeData, loading } = useCache(`home_${user.phone}`, async () => {
    let balance = 0, lastPayment = null, todayOrder = null, recentOrders = [],
      monthStats = { orders: 0, amount: 0, payments: 0 }, streak = 0;
    let timing = { orderStart: 12, orderEnd: 16, deliveryStart: 6, deliveryEnd: 12 };

    const appDoc = await cachedGetDoc(doc(db, 'settings', 'app'));
    if (appDoc.exists()) {
      const ad = appDoc.data();
      timing = { orderStart: ad.orderStart ?? 12, orderEnd: ad.orderEnd ?? 16, deliveryStart: ad.deliveryStart ?? 6, deliveryEnd: ad.deliveryEnd ?? 12 };
    }

    const ledgerSnap = await getDocs(query(collection(db, 'ledger'), where('retailerId', '==', user.phone)));
    const ledgerEntries = ledgerSnap.docs.map(d => d.data());
    balance = ledgerEntries.reduce((sum, e) => e.type === 'debit' ? sum + (e.amount || 0) : sum - (e.amount || 0), 0);

    const credits = ledgerEntries.filter(e => e.type === 'credit').sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    if (credits.length > 0) lastPayment = { date: credits[0].date, amount: credits[0].amount };

    const ordersSnap = await getDocs(query(collection(db, 'orders'), where('phone', '==', user.phone), orderBy('createdAt', 'desc'), limit(30)));
    const allOrders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const todayStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    todayOrder = allOrders.find(o => (o.date === todayStr || o.date === tomorrowStr) && o.status !== 'Cancelled') || null;
    recentOrders = allOrders.slice(0, 5);

    let streakCount = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const ds = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      if (allOrders.some(o => o.date === ds && o.status !== 'Cancelled')) streakCount++;
      else if (i > 0) break;
    }
    streak = streakCount;

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthOrders = allOrders.filter(o => new Date(o.createdAt) >= monthStart && o.status !== 'Cancelled' && o.status !== 'Returned');
    monthStats = {
      orders: monthOrders.length,
      amount: monthOrders.reduce((s, o) => s + (o.actualTotal || o.total || 0), 0),
      payments: ledgerEntries.filter(e => e.type === 'credit' && new Date(e.createdAt) >= monthStart).reduce((s, e) => s + (e.amount || 0), 0),
    };

    return { balance, lastPayment, todayOrder, recentOrders, monthStats, streak, timing };
  }, [user.phone]); // eslint-disable-line

  const {
    balance = 0, lastPayment = null, todayOrder = null, recentOrders = [],
    monthStats = { orders: 0, amount: 0, payments: 0 }, streak = 0,
    timing = { orderStart: 12, orderEnd: 16, deliveryStart: 6, deliveryEnd: 12 },
  } = homeData || {};

  const dailyGreeting = useMemo(() => GREETINGS[getDayIndex(GREETINGS.length)], []);
  const orderWindow = useMemo(() => getOrderWindowInfo(timing), [timing]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-5 h-5 border-2 border-warm-200 border-t-navy-700 rounded-full animate-spin" />
    </div>
  );

  const todayCfg = todayOrder ? (STATUS_CFG[todayOrder.status] || STATUS_CFG['Pending']) : null;

  // ── Sidebar widgets ────────────────────────────────────────────────────────

  const FinanceCard = () => (
    <div className="bg-white dark:bg-[#1a1917] border border-warm-200 dark:border-[#2e2d2b] rounded-xl overflow-hidden">
      <div className="px-4 py-2.5 border-b border-warm-100 dark:border-[#2e2d2b] flex items-center justify-between">
        <p className="text-[10px] font-bold text-warm-400 uppercase tracking-widest">Finance</p>
        {balance > 0 && <span className="text-[9px] font-bold text-red-500 bg-red-50 dark:bg-red-950/30 px-1.5 py-0.5 rounded">Due</span>}
      </div>
      <Link to="/my-ledger">
        <div className="px-4 py-3.5 flex items-center justify-between hover:bg-warm-50 dark:hover:bg-[#222] transition-colors">
          <div>
            <p className="text-[10px] text-warm-400 mb-1">Udhaar (Due)</p>
            <p className={`font-bold text-xl font-mono leading-none ${balance > 0 ? 'text-red-600' : 'text-green-700'}`}>
              {balance > 0 ? formatPrice(balance) : '₹0'}
            </p>
            {balance > 0 && <p className="text-[10px] text-red-400 mt-1">Tap to view ledger</p>}
          </div>
          <ChevronRight size={14} className="text-warm-300" />
        </div>
      </Link>
      <div className="h-px bg-warm-100 dark:bg-[#2e2d2b]" />
      <Link to="/my-ledger">
        <div className="px-4 py-3.5 flex items-center justify-between hover:bg-warm-50 dark:hover:bg-[#222] transition-colors">
          <div>
            <p className="text-[10px] text-warm-400 mb-1">Last Payment</p>
            <p className="font-bold text-xl text-green-700 font-mono leading-none">
              {lastPayment ? `₹${lastPayment.amount?.toLocaleString()}` : '—'}
            </p>
            {lastPayment && <p className="text-[10px] text-warm-400 mt-1">{lastPayment.date}</p>}
          </div>
          <ChevronRight size={14} className="text-warm-300" />
        </div>
      </Link>
    </div>
  );

  const ScheduleCard = () => (
    <Link to="/order">
      <div className="bg-white dark:bg-[#1a1917] border border-warm-200 dark:border-[#2e2d2b] rounded-xl p-4 hover:border-navy-200 dark:hover:border-navy-800 transition-colors">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Truck size={13} className="text-navy-600 dark:text-navy-400" />
            <p className="text-[10px] font-bold text-warm-400 uppercase tracking-widest">Schedule</p>
          </div>
          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
            orderWindow.open
              ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
              : 'bg-warm-100 dark:bg-[#2e2d2b] text-warm-500'
          }`}>
            {orderWindow.label}
          </span>
        </div>
        <div className="space-y-2">
          {timing.deliveryStart !== -1 && timing.deliveryEnd !== -1 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                <p className="text-xs text-warm-500 dark:text-warm-400">Delivery</p>
              </div>
              <p className="text-xs font-semibold text-warm-800 dark:text-warm-200">
                {fmtHour(timing.deliveryStart)} – {fmtHour(timing.deliveryEnd)}
              </p>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-navy-500 rounded-full" />
              <p className="text-xs text-warm-500 dark:text-warm-400">Order Window</p>
            </div>
            <p className="text-xs font-semibold text-warm-800 dark:text-warm-200">
              {timing.orderStart === -1 || timing.orderEnd === -1 ? 'Anytime' : `${fmtHour(timing.orderStart)} – ${fmtHour(timing.orderEnd)}`}
            </p>
          </div>
          <div className="flex items-center gap-1.5 pt-2 border-t border-warm-100 dark:border-[#2e2d2b]">
            <Info size={10} className="text-navy-500 shrink-0" />
            <p className="text-[10px] text-navy-600 dark:text-navy-400">Order today → delivery tomorrow morning</p>
          </div>
        </div>
      </div>
    </Link>
  );

  // ── Main render ─────────────────────────────────────────────────────────────

  return (
    <div className="pb-24 lg:pb-6 lg:grid lg:grid-cols-[1fr_280px] lg:gap-5 lg:items-start">

      {/* ── LEFT COLUMN ── */}
      <div className="space-y-4">

        {/* Welcome */}
        <motion.div initial="initial" animate="animate" variants={fadeUp}
          className="bg-navy-700 dark:bg-navy-800 rounded-xl overflow-hidden">
          <div className="p-4">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-white/50 text-[11px]">{getGreeting()}</p>
                <h2 className="text-lg font-bold text-white mt-0.5 leading-tight" style={{ overflowWrap: 'anywhere' }}>{user.name || 'User'}</h2>
                {user.shop && <p className="text-white/40 text-[11px] mt-0.5 truncate">{user.shop}</p>}
                <p className="text-white/25 text-[10px] mt-1">{dailyGreeting}</p>
              </div>
              {streak >= 2 && (
                <div className="flex items-center gap-1 bg-white/10 rounded-lg px-2 py-1.5 border border-white/10 shrink-0 ml-3">
                  <Flame size={12} className="text-orange-300" />
                  <span className="text-[11px] text-white/80 font-semibold">{streak}d</span>
                </div>
              )}
            </div>
          </div>

          {/* Mini stats strip */}
          <div className="grid grid-cols-3 divide-x divide-white/10 border-t border-white/10">
            <Link to="/my-ledger">
              <div className="px-3 py-2.5 text-center hover:bg-white/5 transition-colors">
                <p className={`text-sm font-bold font-mono leading-tight ${balance > 0 ? 'text-red-300' : 'text-green-400'}`}>
                  {balance > 0 ? `₹${Math.round(balance / 1000) > 0 ? Math.round(balance / 1000) + 'K' : balance.toLocaleString()}` : '₹0'}
                </p>
                <p className="text-[9px] text-white/30 mt-0.5">Udhaar</p>
              </div>
            </Link>
            <Link to="/track">
              <div className="px-3 py-2.5 text-center hover:bg-white/5 transition-colors">
                {todayOrder ? (
                  <>
                    <p className="text-sm font-bold text-white leading-tight">
                      {todayOrder.status}
                    </p>
                    <p className="text-[9px] text-white/30 mt-0.5">Today's Order</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-white/60 leading-tight">No Order</p>
                    <p className="text-[9px] text-white/30 mt-0.5">Today</p>
                  </>
                )}
              </div>
            </Link>
            <div className="px-3 py-2.5 text-center">
              <p className="text-sm font-bold text-white font-mono leading-tight">{monthStats.orders}</p>
              <p className="text-[9px] text-white/30 mt-0.5">This Month</p>
            </div>
          </div>

          {/* Due alert */}
          {balance > 0 && (
            <Link to="/my-ledger">
              <div className="mx-4 mb-4 mt-3 bg-red-500/20 rounded-lg px-3.5 py-2.5 flex items-center justify-between border border-red-400/20 hover:bg-red-500/25 transition-colors">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={13} className="text-red-300 shrink-0" />
                  <div>
                    <p className="text-[10px] text-red-200/60 uppercase tracking-wide">Due Amount</p>
                    <p className="font-bold text-base text-red-100 font-mono leading-tight">₹{balance.toLocaleString()}</p>
                  </div>
                </div>
                <ChevronRight size={15} className="text-red-300/60" />
              </div>
            </Link>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16, delay: 0.05 }} className="grid grid-cols-4 gap-2">
          {[
            { to: '/order',     icon: ShoppingCart, label: 'Order',  color: 'text-navy-700 dark:text-navy-300',   bg: 'bg-navy-50 dark:bg-navy-900/30',   border: 'border-navy-100 dark:border-navy-900/50',   accent: 'bg-navy-700' },
            { to: '/track',     icon: Package,      label: 'Track',  color: 'text-blue-700 dark:text-blue-400',   bg: 'bg-blue-50 dark:bg-blue-950/30',   border: 'border-blue-100 dark:border-blue-900/50',   accent: 'bg-blue-600' },
            { to: '/my-ledger', icon: BookOpen,     label: 'Ledger', color: 'text-red-600 dark:text-red-400',     bg: 'bg-red-50 dark:bg-red-950/30',     border: 'border-red-100 dark:border-red-900/50',     accent: 'bg-red-500' },
            { to: '/prices',    icon: IndianRupee,  label: 'Prices', color: 'text-green-700 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950/30', border: 'border-green-100 dark:border-green-900/50', accent: 'bg-green-600' },
          ].map(({ to, icon: Icon, label, color, bg, border, accent }) => (
            <Link key={to} to={to}>
              <div className={`bg-white dark:bg-[#1a1917] border ${border} rounded-xl overflow-hidden hover:shadow-sm transition-shadow`}>
                <div className={`h-0.5 ${accent}`} />
                <div className="p-2.5 flex flex-col items-center gap-1.5">
                  <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center`}>
                    <Icon size={15} className={color} />
                  </div>
                  <p className="text-[10px] font-semibold text-warm-700 dark:text-warm-200">{label}</p>
                </div>
              </div>
            </Link>
          ))}
        </motion.div>

        {/* Today's Order */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16, delay: 0.08 }}>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[11px] font-bold text-warm-500 dark:text-warm-400 uppercase tracking-wide">Today's Order</p>
            <Link to="/track" className="text-[11px] text-navy-600 dark:text-navy-400 font-medium">Track →</Link>
          </div>

          {todayOrder && todayCfg ? (
            <Link to="/track">
              <div className="bg-white dark:bg-[#1a1917] border border-warm-200 dark:border-[#2e2d2b] rounded-xl overflow-hidden hover:border-warm-300 dark:hover:border-[#4a4845] transition-colors">
                {/* Status header */}
                <div className="flex items-center justify-between px-3.5 py-3 border-b border-warm-100 dark:border-[#2e2d2b]">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 ${todayCfg.bg} rounded-lg flex items-center justify-center border ${todayCfg.border}`}>
                      <todayCfg.icon size={13} className={todayCfg.color} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-warm-800 dark:text-warm-100">{todayOrder.status}</p>
                      <p className="text-[10px] text-warm-400">{todayOrder.date}</p>
                    </div>
                  </div>
                  <p className="font-bold text-sm text-warm-800 dark:text-warm-100 font-mono">{formatPrice(todayOrder.total)}</p>
                </div>

                {/* Mini progress timeline */}
                {todayCfg.step >= 0 && (
                  <div className="px-3.5 py-2.5 border-b border-warm-100 dark:border-[#2e2d2b]">
                    <div className="flex items-center gap-0">
                      {['Confirmed', 'Dispatched', 'Delivered'].map((s, i) => {
                        const done = todayCfg.step > i;
                        const active = todayCfg.step === i + 1 || (i === 0 && todayCfg.step === 1);
                        const filled = todayCfg.step >= i + 1;
                        return (
                          <React.Fragment key={s}>
                            <div className="flex flex-col items-center gap-1">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors ${
                                filled ? 'bg-navy-700 border-navy-700' : 'bg-white dark:bg-[#1a1917] border-warm-200 dark:border-[#4a4845]'
                              }`}>
                                {filled && <CheckCircle2 size={10} className="text-white" strokeWidth={3} />}
                              </div>
                              <p className={`text-[8px] font-semibold whitespace-nowrap ${filled ? 'text-navy-700 dark:text-navy-300' : 'text-warm-300 dark:text-warm-600'}`}>{s}</p>
                            </div>
                            {i < 2 && (
                              <div className={`flex-1 h-0.5 mb-3.5 mx-1 rounded-full transition-colors ${filled && todayCfg.step > i + 1 ? 'bg-navy-700' : 'bg-warm-200 dark:bg-[#2e2d2b]'}`} />
                            )}
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Items */}
                <div className="px-3.5 py-2.5 flex flex-wrap gap-1.5">
                  {todayOrder.items?.slice(0, 4).map((item, i) => (
                    <span key={i} className="text-[10px] text-warm-600 dark:text-warm-400 bg-warm-50 dark:bg-[#2e2d2b] px-2 py-0.5 rounded border border-warm-200 dark:border-[#4a4845]">
                      {item.name} × {String(item.qty).replace(/[^0-9.]/g, '')}
                    </span>
                  ))}
                  {todayOrder.items?.length > 4 && (
                    <span className="text-[10px] text-navy-600 dark:text-navy-400 px-1 py-0.5">+{todayOrder.items.length - 4} more</span>
                  )}
                </div>
              </div>
            </Link>
          ) : (
            <Link to="/order">
              <div className="bg-white dark:bg-[#1a1917] border border-dashed border-warm-200 dark:border-[#2e2d2b] rounded-xl p-5 text-center hover:border-navy-300 dark:hover:border-navy-700 transition-colors">
                <Package size={20} className="text-warm-300 dark:text-warm-600 mx-auto mb-1.5" />
                <p className="text-sm text-warm-400">No order placed yet</p>
                <p className="text-xs text-navy-600 dark:text-navy-400 font-medium mt-0.5">Tap to place order →</p>
              </div>
            </Link>
          )}
        </motion.div>

        {/* This Month */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16, delay: 0.11 }}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <TrendingUp size={12} className="text-warm-400" />
            <p className="text-[11px] font-bold text-warm-500 dark:text-warm-400 uppercase tracking-wide">This Month</p>
          </div>
          <div className="bg-white dark:bg-[#1a1917] border border-warm-200 dark:border-[#2e2d2b] rounded-xl overflow-hidden">
            <div className="grid grid-cols-3 divide-x divide-warm-100 dark:divide-[#2e2d2b]">
              <Link to="/track">
                <div className="px-3 py-3.5 text-center hover:bg-warm-50 dark:hover:bg-[#222] transition-colors">
                  <p className="text-[9px] text-warm-400 uppercase tracking-widest mb-1">Orders</p>
                  <p className="font-bold text-2xl text-warm-800 dark:text-warm-100 font-mono leading-none">{monthStats.orders}</p>
                </div>
              </Link>
              <Link to="/my-ledger">
                <div className="px-3 py-3.5 text-center hover:bg-warm-50 dark:hover:bg-[#222] transition-colors">
                  <p className="text-[9px] text-warm-400 uppercase tracking-widest mb-1">Bought</p>
                  <p className="font-bold text-sm text-warm-800 dark:text-warm-100 font-mono leading-none mt-1">{formatPrice(monthStats.amount)}</p>
                </div>
              </Link>
              <Link to="/my-ledger">
                <div className="px-3 py-3.5 text-center hover:bg-warm-50 dark:hover:bg-[#222] transition-colors">
                  <p className="text-[9px] text-warm-400 uppercase tracking-widest mb-1">Paid</p>
                  <p className="font-bold text-sm text-green-700 dark:text-green-400 font-mono leading-none mt-1">{formatPrice(monthStats.payments)}</p>
                </div>
              </Link>
            </div>
            {/* Payment progress bar */}
            {monthStats.amount > 0 && (
              <div className="px-4 py-2.5 border-t border-warm-100 dark:border-[#2e2d2b]">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[9px] text-warm-400">Payment progress</p>
                  <p className="text-[9px] font-bold text-warm-500 dark:text-warm-400">
                    {Math.min(100, Math.round((monthStats.payments / monthStats.amount) * 100))}%
                  </p>
                </div>
                <div className="w-full h-1.5 bg-warm-100 dark:bg-[#2e2d2b] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-green-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (monthStats.payments / monthStats.amount) * 100)}%` }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Recent Orders */}
        {recentOrders.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.16, delay: 0.14 }}>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <History size={12} className="text-warm-400" />
                <p className="text-[11px] font-bold text-warm-500 dark:text-warm-400 uppercase tracking-wide">Recent Orders</p>
              </div>
              <Link to="/history" className="text-[11px] text-navy-600 dark:text-navy-400 font-medium">View All →</Link>
            </div>
            <div className="bg-white dark:bg-[#1a1917] border border-warm-200 dark:border-[#2e2d2b] rounded-xl overflow-hidden divide-y divide-warm-100 dark:divide-[#2e2d2b]">
              {recentOrders.map((order, i) => {
                const cfg = STATUS_CFG[order.status] || STATUS_CFG['Pending'];
                return (
                  <div key={i}
                    className="flex items-center justify-between px-3.5 py-2.5 cursor-pointer hover:bg-warm-50 dark:hover:bg-[#222] transition-colors"
                    onClick={() => window.location.href = '/track'}>
                    <div>
                      <p className="text-sm font-medium text-warm-800 dark:text-warm-100">{order.date}</p>
                      <p className="text-[10px] text-warm-400">{order.items?.length} items · {formatPrice(order.total)}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
                      {order.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Mobile-only sidebar widgets */}
        <div className="lg:hidden flex flex-col gap-4">
          <FinanceCard />
          <ScheduleCard />
        </div>

      </div>

      {/* ── RIGHT COLUMN (desktop) ── */}
      <div className="hidden lg:flex flex-col gap-4 sticky top-[57px] self-start">
        <FinanceCard />
        <ScheduleCard />
      </div>

    </div>
  );
}
