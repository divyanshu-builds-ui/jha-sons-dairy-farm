import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ShoppingCart, BookOpen, AlertTriangle, Truck, Clock, Package, CheckCircle2, Flame, Lightbulb, IndianRupee, Info } from 'lucide-react';
import { db, doc, getDoc, collection, query, where, orderBy, getDocs, limit, cachedGetDoc } from '../../services/firebase';
import { formatPrice } from '../../utils/price';
import { DashboardSkeleton } from '../../components/LoadingSkeleton';

const GREETINGS = [
  'Your orders, delivered fresh daily.',
  'Quality dairy at your doorstep.',
  'Fresh stock ready for tomorrow.',
  'Trusted supply, every single day.',
  'Your daily dairy partner.',
  'Freshness guaranteed, always.',
  'Reliable delivery, rain or shine.',
  'Quality you can count on.',
  'Fresh from farm to your shop.',
  'Your business, our priority.',
  'Consistent quality, daily delivery.',
  'Built on trust, delivered with care.',
  'Fresh products, happy customers.',
  'Your growth is our success.',
  'Premium dairy, affordable prices.',
  'Order today, deliver tomorrow.',
  'Simplifying your daily supply.',
  'Where freshness meets reliability.',
  'Your trusted dairy supply chain.',
  'Quality products, on time delivery.',
  'Making dairy supply effortless.',
  'Fresh every morning, guaranteed.',
  'Partnering for your success.',
  'Dairy done right, every day.',
  'Supply you can depend on.',
  'New features added — check User Guide!',
  'Install the app for the best experience.',
  'We value your feedback — rate us anytime.',
];

const DAILY_TIPS = [
  'Place orders between the order window for next-day delivery.',
  'Track your order status in real-time from the Track page.',
  'You can cancel your order from Track page — only before dispatch.',
  'Download invoices from Order History for your records.',
  'Check My Ledger to see your complete payment history.',
  'Your closing balance carries forward to the next day.',
  'Payments collected are instantly reflected in your ledger.',
  'Use the Support page to raise any delivery issues.',
  'Seasonal products are available for limited periods only.',
  'Your order is confirmed instantly — no waiting needed.',
  'Dispatched status means your order is on the way.',
  'Once dispatched, order cannot be cancelled — contact admin.',
  'Check Price List page for latest product rates anytime.',
  'Download PDF Rate Card from Price List page for reference.',
  'Dark mode is available in Settings for night use.',
  'Install the app on your home screen for quick access.',
  'Your balance updates automatically after every delivery.',
  'Order history is stored for 12 months — download PDFs for backup.',
  'Each invoice shows item-wise breakdown with rates.',
  'Internet connection is required for placing orders and tracking.',
  'Delivery time and order window are shown on home page.',
  'Contact support directly via WhatsApp from the app.',
  'Your PIN keeps your account secure — change it in Settings.',
  'Product prices are updated by admin — always current.',
  'Duplicate orders for the same day are automatically warned.',
  'Ledger shows opening balance, daily orders, and deposits.',
  'All your data is securely stored in the cloud.',
  'Check the User Guide in menu to learn all features.',
  'Install the app from Settings for faster access.',
  'Re-order previous orders with one tap from History page.',
  'Font size can be changed from Settings — Small, Normal, Large.',
];

const GRADIENTS = [
  'from-royal-800 via-royal-700 to-royal-600',
  'from-[#1e3a5f] via-[#2d5a87] to-[#1a4971]',
  'from-[#2d1b69] via-[#3d2b7a] to-[#4a3580]',
  'from-[#1a3c34] via-[#2d5a4e] to-[#1e4d42]',
  'from-[#3b1f2b] via-[#5a2d3f] to-[#4a2535]',
  'from-[#1a1a2e] via-[#16213e] to-[#0f3460]',
  'from-[#2c3e50] via-[#34495e] to-[#2c3e50]',
  'from-[#1b2838] via-[#2a4158] to-[#1b3a4b]',
  'from-[#2d2d44] via-[#3d3d5c] to-[#2d2d44]',
  'from-[#1a2332] via-[#243447] to-[#1a2f3f]',
  'from-[#1f1c2c] via-[#2e2942] to-[#3a3557]',
  'from-[#0f2027] via-[#203a43] to-[#2c5364]',
  'from-[#1d2b3a] via-[#2b4257] to-[#1d3a4f]',
  'from-[#232526] via-[#2c3e50] to-[#232526]',
  'from-[#1a1a2e] via-[#2d2d5e] to-[#1a1a3e]',
];

// Deterministic daily index based on date
const getDayIndex = (arrLength) => {
  const d = new Date();
  const seed = d.getFullYear() * 1000 + d.getMonth() * 32 + d.getDate();
  return seed % arrLength;
};

const stagger = { animate: { transition: { staggerChildren: 0.08 } } };
const fadeUp = { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

export default function Home() {
  const [balance, setBalance] = useState(0);
  const [lastPayment, setLastPayment] = useState(null);
  const [todayOrder, setTodayOrder] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [monthStats, setMonthStats] = useState({ orders: 0, amount: 0, payments: 0 });
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [timing, setTiming] = useState({ orderStart: 12, orderEnd: 16, deliveryStart: 6, deliveryEnd: 12 });

  const user = JSON.parse(localStorage.getItem('lg_user') || '{}');

  const dailyGreeting = useMemo(() => GREETINGS[getDayIndex(GREETINGS.length)], []);
  const dailyTip = useMemo(() => DAILY_TIPS[getDayIndex(DAILY_TIPS.length)], []);
  const dailyGradient = useMemo(() => GRADIENTS[getDayIndex(GRADIENTS.length)], []);

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch timing settings (cached)
        const appDoc = await cachedGetDoc(doc(db, 'settings', 'app'));
        if (appDoc.exists()) {
          const ad = appDoc.data();
          setTiming({ orderStart: ad.orderStart || 12, orderEnd: ad.orderEnd || 16, deliveryStart: ad.deliveryStart || 6, deliveryEnd: ad.deliveryEnd || 12 });
        }

        const balDoc = await getDoc(doc(db, 'retailer_balances', user.phone));
        if (balDoc.exists()) {
          const d = balDoc.data();
          setBalance(d.balance || 0);
          if (d.lastPaymentDate) setLastPayment({ date: d.lastPaymentDate, amount: d.lastPaymentAmount });
        }

        const ordersSnap = await getDocs(query(collection(db, 'orders'), where('phone', '==', user.phone), orderBy('createdAt', 'desc'), limit(30)));
        const allOrders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Today's order
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const todayStr = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const todayOrd = allOrders.find(o => (o.date === todayStr || o.date === tomorrowStr) && o.status !== 'Cancelled');
        setTodayOrder(todayOrd || null);

        setRecentOrders(allOrders.slice(0, 4));

        // Streak calculation
        let streakCount = 0;
        const today = new Date();
        for (let i = 0; i < 30; i++) {
          const checkDate = new Date(today);
          checkDate.setDate(checkDate.getDate() - i);
          const dateStr = checkDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
          if (allOrders.some(o => o.date === dateStr && o.status !== 'Cancelled')) {
            streakCount++;
          } else if (i > 0) break; // Don't break on today if no order yet
        }
        setStreak(streakCount);

        // This month stats
        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthOrders = allOrders.filter(o => new Date(o.createdAt) >= monthStart && o.status !== 'Cancelled' && o.status !== 'Returned');
        const monthAmount = monthOrders.reduce((s, o) => s + (o.actualTotal || o.total || 0), 0);

        const ledgerSnap = await getDocs(query(collection(db, 'ledger'), where('retailerId', '==', user.phone)));
        const ledgerEntries = ledgerSnap.docs.map(d => d.data());
        const monthPayments = ledgerEntries.filter(e => e.type === 'credit' && new Date(e.createdAt) >= monthStart)
          .reduce((s, e) => s + (e.amount || 0), 0);

        setMonthStats({ orders: monthOrders.length, amount: monthAmount, payments: monthPayments });
      } catch (err) {
      }
      setLoading(false);
    }
    fetchData();
  }, [user.phone]);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const statusConfig = {
    'Pending': { color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-200 dark:border-amber-800', icon: Clock },
    'Confirmed': { color: 'text-royal-700 dark:text-royal-300', bg: 'bg-royal-50 dark:bg-royal-900/30', border: 'border-royal-200 dark:border-royal-800', icon: CheckCircle2 },
    'Dispatched': { color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-800', icon: Truck },
    'In Transit': { color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-800', icon: Truck },
    'Delivered': { color: 'text-mint-700 dark:text-mint-300', bg: 'bg-mint-50 dark:bg-mint-900/30', border: 'border-mint-200 dark:border-mint-800', icon: CheckCircle2 },
    'Cancelled': { color: 'text-red-700 dark:text-red-300', bg: 'bg-red-50 dark:bg-red-900/30', border: 'border-red-200 dark:border-red-800', icon: Clock },
    'Returned': { color: 'text-gray-700 dark:text-gray-300', bg: 'bg-gray-50 dark:bg-[#0a0a0a]/30', border: 'border-gray-200 dark:border-[#222222]', icon: Clock },
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <motion.div className="space-y-5 pb-24" variants={stagger} initial="initial" animate="animate">
      {/* Welcome Card */}
      <motion.div variants={fadeUp}
        initial={{ opacity: 0, y: 40, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 80, damping: 12, delay: 0.15 }}
        className={`relative bg-gradient-to-br ${dailyGradient} rounded-3xl p-6 text-white shadow-float overflow-hidden`}>
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 bg-white/10 rounded-full blur-2xl" />

        <div className="relative z-10">
          <div className="mb-5">
            <p className="text-white/60 text-sm font-semibold">{getGreeting()},</p>
            <h2 className="text-[26px] font-extrabold tracking-tight leading-tight">{user.name || 'User'}</h2>
            <p className="text-white/50 text-xs font-medium mt-1">{dailyGreeting}</p>
          </div>

          {/* Streak Badge */}
          {streak >= 2 && (
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3, type: 'spring' }}
              className="inline-flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1.5 mb-4 border border-white/20">
              <Flame size={14} className="text-orange-300" />
              <span className="text-xs font-bold text-white/90">{streak} day streak</span>
            </motion.div>
          )}

          {balance > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="bg-red-500/20 rounded-2xl px-5 py-4 flex items-center justify-between border border-red-400/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <AlertTriangle size={20} className="text-red-300" />
                </div>
                <div>
                  <p className="text-[10px] text-red-200 font-semibold uppercase tracking-wider">Due Amount</p>
                  <p className="font-extrabold text-2xl text-red-100">₹{balance.toLocaleString()}</p>
                </div>
              </div>
              <Link to="/my-ledger">
                <motion.button whileTap={{ scale: 0.9 }}
                  className="px-3 py-2 bg-red-500 text-white text-[10px] font-bold rounded-lg shadow-md">
                  View Ledger
                </motion.button>
              </Link>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Daily Tip */}
      <motion.div variants={fadeUp}
        className="flex items-center gap-3 px-4 py-3 bg-amber-50/80 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/30">
        <Lightbulb size={16} className="text-amber-500 shrink-0" />
        <p className="text-xs font-medium text-amber-700 dark:text-amber-400">{dailyTip}</p>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-2.5">
        <Link to="/order">
          <motion.div whileTap={{ scale: 0.95 }}
            className="card !p-4 flex flex-col items-center gap-2 cursor-pointer hover:shadow-card-hover border border-royal-200/50 dark:border-royal-800/50">
            <div className="w-11 h-11 bg-gradient-to-br from-royal-100 to-royal-50 dark:from-royal-900/40 dark:to-royal-800/30 rounded-xl flex items-center justify-center border border-royal-200/50 dark:border-royal-700/50">
              <ShoppingCart size={20} className="text-royal-600" />
            </div>
            <p className="font-bold text-xs text-gray-800 dark:text-white">New Order</p>
          </motion.div>
        </Link>
        <Link to="/my-ledger">
          <motion.div whileTap={{ scale: 0.95 }}
            className="card !p-4 flex flex-col items-center gap-2 cursor-pointer hover:shadow-card-hover border border-red-200/50 dark:border-red-800/50">
            <div className="w-11 h-11 bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/40 dark:to-red-800/30 rounded-xl flex items-center justify-center border border-red-200/50 dark:border-red-700/50">
              <BookOpen size={20} className="text-red-500" />
            </div>
            <p className="font-bold text-xs text-gray-800 dark:text-white">Ledger</p>
          </motion.div>
        </Link>
        <Link to="/prices">
          <motion.div whileTap={{ scale: 0.95 }}
            className="card !p-4 flex flex-col items-center gap-2 cursor-pointer hover:shadow-card-hover border border-mint-200/50 dark:border-mint-800/50">
            <div className="w-11 h-11 bg-gradient-to-br from-mint-100 to-mint-50 dark:from-mint-900/40 dark:to-mint-800/30 rounded-xl flex items-center justify-center border border-mint-200/50 dark:border-mint-700/50">
              <IndianRupee size={20} className="text-mint-600" />
            </div>
            <p className="font-bold text-xs text-gray-800 dark:text-white">Prices</p>
          </motion.div>
        </Link>
      </motion.div>

      {/* Today's Order Status */}
      <motion.div variants={fadeUp}>
        <h3 className="font-bold text-gray-800 dark:text-white text-base mb-3">Today's Order</h3>
        {todayOrder ? (() => {
          const config = statusConfig[todayOrder.status] || statusConfig['Pending'];
          const StatusIcon = config.icon;
          return (
            <Link to="/track">
              <div className="card !p-0 overflow-hidden border border-gray-100 dark:border-[#222222]">
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 dark:border-[#222222]">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 ${config.bg} rounded-lg flex items-center justify-center`}>
                      <StatusIcon size={14} className={config.color} />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-gray-800 dark:text-white">{todayOrder.status}</p>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">{todayOrder.date} • {todayOrder.time}</p>
                    </div>
                  </div>
                  <p className="font-extrabold text-[15px] text-gray-800 dark:text-white">{formatPrice(todayOrder.total)}</p>
                </div>
                <div className="px-5 py-3 flex flex-wrap gap-2">
                  {todayOrder.items?.slice(0, 4).map((item, i) => (
                    <span key={i} className="text-[10px] font-semibold bg-gray-50 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-lg border border-gray-100 dark:border-[#333333]">
                      {item.name} × {String(item.qty).replace(/[^0-9.]/g, '')}
                    </span>
                  ))}
                  {todayOrder.items?.length > 4 && (
                    <span className="text-[10px] font-bold text-royal-600 dark:text-royal-300 px-2.5 py-1">+{todayOrder.items.length - 4} more</span>
                  )}
                </div>
              </div>
            </Link>
          );
        })() : (
          <Link to="/order">
            <div className="card !p-5 text-center border border-dashed border-gray-200 dark:border-[#222222] hover:border-royal-300 transition-colors">
              <Package size={28} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-400 dark:text-gray-500">No order placed yet</p>
              <p className="text-[10px] text-royal-600 dark:text-royal-400 font-bold mt-1">Tap to place order →</p>
            </div>
          </Link>
        )}
      </motion.div>

      {/* Monthly Summary */}
      <motion.div variants={fadeUp}>
        <h3 className="font-bold text-gray-800 dark:text-white text-base mb-3">This Month</h3>
        <div className="grid grid-cols-3 gap-3">
          <Link to="/track">
            <motion.div whileTap={{ scale: 0.97 }} className="card !p-4 text-center bg-gradient-to-br from-white to-royal-50/30 dark:from-[#111111] dark:to-royal-900/10">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">Orders</p>
              <p className="font-black text-xl text-gray-800 dark:text-white mt-1">{monthStats.orders}</p>
            </motion.div>
          </Link>
          <Link to="/my-ledger">
            <motion.div whileTap={{ scale: 0.97 }} className="card !p-4 text-center bg-gradient-to-br from-white to-red-50/30 dark:from-[#111111] dark:to-red-900/10">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">Purchased</p>
              <p className="font-black text-lg text-red-500 mt-1 truncate">{formatPrice(monthStats.amount)}</p>
            </motion.div>
          </Link>
          <Link to="/my-ledger">
            <motion.div whileTap={{ scale: 0.97 }} className="card !p-4 text-center bg-gradient-to-br from-white to-mint-50/30 dark:from-[#111111] dark:to-mint-900/10">
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">Paid</p>
              <p className="font-black text-lg text-mint-600 mt-1 truncate">{formatPrice(monthStats.payments)}</p>
            </motion.div>
          </Link>
        </div>
      </motion.div>

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <motion.div variants={fadeUp}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800 dark:text-white text-base">Recent Orders</h3>
            <Link to="/history" className="text-[10px] font-bold text-royal-600 dark:text-royal-300">View All →</Link>
          </div>
          <div className="card !p-0 overflow-hidden divide-y divide-gray-50 dark:divide-gray-700">
            {recentOrders.map((order, i) => {
              const config = statusConfig[order.status] || statusConfig['Pending'];
              return (
                <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/50 dark:hover:bg-[#1a1a1a]/30 transition-colors cursor-pointer"
                  onClick={() => window.location.href = '/track'}>
                  <div>
                    <p className="text-sm font-bold text-gray-800 dark:text-white">{order.date}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{order.items?.length} items</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-extrabold text-gray-800 dark:text-white">{formatPrice(order.total)}</p>
                    <span className={`text-[9px] font-bold px-2.5 py-1 rounded-full border ${config.bg} ${config.color} ${config.border}`}>
                      {order.status}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Delivery Schedule */}
      <motion.div variants={fadeUp}>
        <Link to="/order">
          <div className="card bg-gradient-to-r from-royal-50 to-mint-50 dark:from-[#111111] dark:to-[#111111] border-royal-100/50 dark:border-[#222222]">
            <div className="flex items-center gap-2 mb-3">
              <Truck size={16} className="text-royal-600 dark:text-royal-400" />
              <h4 className="font-bold text-sm text-royal-800 dark:text-royal-300">Delivery Schedule</h4>
            </div>
            <div className="space-y-2 text-xs text-gray-600 dark:text-gray-300">
              {timing.deliveryStart !== -1 && timing.deliveryEnd !== -1 && (
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-mint-500 rounded-full" />
                  <p>Delivery: <span className="font-bold text-gray-800 dark:text-white">{timing.deliveryStart === 0 ? '12 AM' : timing.deliveryStart < 12 ? `${timing.deliveryStart} AM` : timing.deliveryStart === 12 ? '12 PM' : `${timing.deliveryStart-12} PM`} - {timing.deliveryEnd === 0 ? '12 AM' : timing.deliveryEnd < 12 ? `${timing.deliveryEnd} AM` : timing.deliveryEnd === 12 ? '12 PM' : `${timing.deliveryEnd-12} PM`}</span></p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-royal-500 rounded-full" />
                <p>Order Time: <span className="font-bold text-gray-800 dark:text-white">{timing.orderStart === -1 || timing.orderEnd === -1 ? 'Anytime' : `${timing.orderStart === 0 ? '12 AM' : timing.orderStart < 12 ? `${timing.orderStart} AM` : timing.orderStart === 12 ? '12 PM' : `${timing.orderStart-12} PM`} - ${timing.orderEnd === 0 ? '12 AM' : timing.orderEnd < 12 ? `${timing.orderEnd} AM` : timing.orderEnd === 12 ? '12 PM' : `${timing.orderEnd-12} PM`}`}</span></p>
              </div>
              <p className="text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-2 py-1 mt-2"><Info size={12} className="inline text-blue-500" /> Place order today, get delivery tomorrow morning</p>
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Balance Card */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 gap-3">
        <Link to="/my-ledger">
          <div className="card !p-5 text-center border border-red-100 dark:border-red-900/30">
            <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase">Udhaar</p>
            <p className={`font-black text-xl mt-1 ${balance > 0 ? 'text-red-500' : 'text-mint-600'}`}>
              {balance > 0 ? formatPrice(balance) : '₹0'}
            </p>
          </div>
        </Link>
        <Link to="/my-ledger">
          <div className="card !p-5 text-center border border-mint-100 dark:border-mint-900/30">
            <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase">Last Payment</p>
            <p className="font-black text-xl mt-1 text-mint-600">
              {lastPayment ? `₹${lastPayment.amount?.toLocaleString()}` : '—'}
            </p>
            {lastPayment && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{lastPayment.date}</p>}
          </div>
        </Link>
      </motion.div>
    </motion.div>
  );
}
