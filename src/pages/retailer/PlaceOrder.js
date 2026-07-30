import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, AlertTriangle, Clock, Plus, Minus, X, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db, doc, getDoc, collection, getDocs, query, where, cachedGetDoc, cachedGetDocs } from '../../services/firebase';
import { formatPrice } from '../../utils/price';
import { OrderSkeleton } from '../../components/LoadingSkeleton';
import { useFlags } from '../../context/FeatureFlags';

export default function PlaceOrder() {
  const navigate = useNavigate();
  const flags = useFlags();
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [search, setSearch] = useState('');
  const [balance, setBalance] = useState(0);
  const [pageLoading, setPageLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [cutoffPassed, setCutoffPassed] = useState(false);
  const [orderWindow, setOrderWindow] = useState({ start: 12, end: 16 });
  const [maxOrderItems, setMaxOrderItems] = useState(0);
  const [cartPulse, setCartPulse] = useState(false);
  const [showSparkle, setShowSparkle] = useState(false);
  const [changedId, setChangedId] = useState(null);
  const prevCartCount = useRef(0);

  const user = JSON.parse(localStorage.getItem('lg_user') || '{}');

  useEffect(() => {
    async function fetchAll() {
      try {
        // Calculate due from ledger (source of truth)
        const ledgerSnap = await getDocs(query(collection(db, 'ledger'), where('retailerId', '==', user.phone)));
        const entries = ledgerSnap.docs.map(d => d.data());
        const due = entries.reduce((sum, e) => e.type === 'debit' ? sum + (e.amount || 0) : sum - (e.amount || 0), 0);
        setBalance(due);

        // Products — fresh every page load (no cache, prices must be latest)
        const prodSnap = await cachedGetDocs(collection(db, 'products'), 'products_all', 10 * 60 * 1000);
        const prods = prodSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.active !== false);
        setProducts(prods);

        // Handle re-order pre-fill
        const reorder = localStorage.getItem('lg_reorder');
        if (reorder) {
          try {
            const items = JSON.parse(reorder);
            const qtyMap = {};
            items.forEach(item => {
              const match = prods.find(p => p.name === item.name);
              if (match) qtyMap[match.id] = Number(item.qty) || 0;
            });
            setQuantities(prev => ({ ...prev, ...qtyMap }));
          } catch (e) {}
          localStorage.removeItem('lg_reorder');
        }

        // Order window settings — cached 2 min
        const appSnap = await cachedGetDoc(doc(db, 'settings', 'app'), 5 * 60 * 1000);
        if (appSnap.exists()) {
          const d = appSnap.data();
          const start = d.orderStart ?? 12;
          const end = d.orderEnd ?? 16;
          setOrderWindow({ start, end });
          if (d.maxOrderItems) setMaxOrderItems(d.maxOrderItems);
          if (start === -1 || end === -1) { setCutoffPassed(false); }
          else {
            const hour = new Date().getHours();
            // Handle overnight window (e.g. start=12, end=0 means 12PM to 12AM)
            if (end <= start) {
              // Overnight: open if hour >= start OR hour < end
              setCutoffPassed(!(hour >= start || hour < end));
            } else {
              // Normal: open if hour >= start AND hour < end
              setCutoffPassed(hour < start || hour >= end);
            }
          }
        }
      } catch (err) {}
      setPageLoading(false);
    }
    fetchAll();
  }, [user.phone]);

  const triggerCartPulse = (id) => {
    setChangedId(id);
    setCartPulse(true);
    setTimeout(() => { setCartPulse(false); setChangedId(null); }, 300);
  };

  const setQty = (id, val) => {
    const num = parseInt(val) || 0;
    setQuantities(prev => {
      if (num < 0) return prev;
      if (num === 0) { const n = { ...prev }; delete n[id]; return n; }
      return { ...prev, [id]: num };
    });
    triggerCartPulse(id);
  };

  const increment = (id) => {
    setQuantities(prev => {
      const currentCount = Object.keys(prev).filter(k => prev[k] > 0).length;
      const isNew = !prev[id] || prev[id] === 0;
      // Max items check
      if (isNew && maxOrderItems > 0 && currentCount >= maxOrderItems) {
        setToast(`Max ${maxOrderItems} items allowed per order`);
        setTimeout(() => setToast(''), 2500);
        return prev;
      }
      const newVal = (prev[id] || 0) + 1;
      if (currentCount === 0 && newVal === 1) {
        setShowSparkle(true);
        setTimeout(() => setShowSparkle(false), 1200);
      }
      return { ...prev, [id]: newVal };
    });
    triggerCartPulse(id);
  };

  const decrement = (id) => {
    setQuantities(prev => {
      const val = (prev[id] || 0) - 1;
      if (val <= 0) { const n = { ...prev }; delete n[id]; return n; }
      return { ...prev, [id]: val };
    });
    triggerCartPulse(id);
  };

  const cartItems = products.filter(p => quantities[p.id] > 0).map(p => ({ ...p, qty: quantities[p.id] }));
  const cartCount = cartItems.length;
  const cartTotal = cartItems.reduce((s, i) => s + (i.price || 0) * i.qty, 0);

  const dailyProducts = products.filter(p => p.type === 'daily');
  const seasonalProducts = flags.seasonalProducts !== false ? products.filter(p => p.type === 'seasonal') : [];

  const filterList = (list) => list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || String(p.price).includes(search));

  const handleOrder = () => {
    if (cartItems.length === 0 || cutoffPassed) return;
    localStorage.setItem('lg_cart', JSON.stringify(cartItems));
    navigate('/checkout');
  };

  if (pageLoading) return <OrderSkeleton />;

  return (
    <div className="pb-28 space-y-4 max-w-5xl mx-auto">

      {/* First Item Sparkle */}
      <AnimatePresence>
        {showSparkle && (
          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
            className="fixed top-[4.5rem] left-4 right-4 z-[100] flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-royal-600 to-mint-600 text-white shadow-float">
            <Sparkles size={16} className="text-yellow-300" />
            <span className="text-xs font-bold">First item added! 🎉</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order Window Closed - Full Block */}
      {cutoffPassed && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="text-center py-12">
          <div className="w-14 h-14 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock size={24} className="text-amber-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Order Window Closed</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
            Orders are accepted between {orderWindow.start === 0 ? '12 AM' : orderWindow.start < 12 ? `${orderWindow.start} AM` : orderWindow.start === 12 ? '12 PM' : `${orderWindow.start-12} PM`} - {orderWindow.end === 0 ? '12 AM' : orderWindow.end < 12 ? `${orderWindow.end} AM` : orderWindow.end === 12 ? '12 PM' : `${orderWindow.end-12} PM`} only.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mb-6">You can still view product prices.</p>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => navigate('/prices')}
            className="px-6 py-3 bg-royal-700 text-white font-bold text-sm rounded-xl shadow-md">
            View Price List
          </motion.button>
        </motion.div>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-16 left-4 right-4 z-[100] flex items-center justify-center gap-2 px-4 py-3 rounded-2xl shadow-float bg-amber-50 border border-amber-200 text-amber-800">
            <Clock size={14} className="shrink-0" />
            <span className="text-xs font-bold">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {flags.balanceWarning !== false && balance > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="px-4 py-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-500 shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400 font-semibold">Previous due: <span className="font-black">{formatPrice(balance)}</span></p>
        </motion.div>
      )}

      {!cutoffPassed && <>
      {/* Search */}
      <div className="relative lg:max-w-md">
        <Search size={16} className="absolute left-4 top-3.5 text-gray-400" />
        <input className="w-full pl-11 pr-9 py-3 text-[16px] sm:text-base bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#333333] rounded-2xl focus:outline-none focus:border-royal-400 focus:ring-2 focus:ring-royal-100 dark:text-white shadow-sm"
          placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-200 dark:bg-[#222222] rounded-full flex items-center justify-center hover:bg-gray-300"><X size={10} className="text-gray-500" /></button>}
      </div>

      {/* Products */}
      <p className="text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2 text-center flex items-center justify-center gap-1.5"><AlertTriangle size={13} className="text-amber-500 shrink-0" /> Prices may change without prior notice. Confirm latest rates for bulk orders.</p>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Daily Products */}
        <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#222222] overflow-hidden shadow-sm">
          <div className="px-4 py-3 bg-gradient-to-r from-[#0f172a] to-[#1e293b]">
            <p className="text-sm font-bold text-white">Daily Products</p>
            <p className="text-[10px] text-gray-400">{filterList(dailyProducts).length} items</p>
          </div>
          {filterList(dailyProducts).map((p, i) => {
            const qty = quantities[p.id] || 0;
            return (
              <div key={p.id} className={`flex items-center justify-between py-3.5 px-4 border-b border-gray-100 dark:border-[#222222] last:border-0 ${qty > 0 ? 'bg-royal-50/30 dark:bg-royal-900/10' : ''}`}>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-xs font-mono text-gray-400 dark:text-gray-500 w-5 shrink-0">{i + 1}</span>
                  <div className="min-w-0">
                    <p className="font-bold text-[15px] text-gray-800 dark:text-white truncate">{p.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{formatPrice(p.price)}/{p.unit}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {qty > 0 && <motion.button whileTap={{ scale: 0.8 }} onClick={() => decrement(p.id)} className="w-9 h-9 bg-red-50 dark:bg-red-900/30 rounded-xl flex items-center justify-center border border-red-100 dark:border-red-800 active:scale-90 transition-transform"><Minus size={14} className="text-red-500" /></motion.button>}
                  <motion.div animate={changedId === p.id ? { scale: [1, 1.2, 1] } : {}} transition={{ duration: 0.2 }}>
                    <input type="tel" inputMode="numeric" pattern="[0-9]*" value={qty || ''}
                      onChange={e => setQty(p.id, e.target.value.replace(/\D/g, ''))}
                      placeholder="0"
                      className={`w-14 h-9 text-center text-base font-bold rounded-xl outline-none transition-colors ${qty > 0 ? 'bg-royal-600 text-white border-royal-600' : 'bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333333] text-gray-800 dark:text-white'}`} />
                  </motion.div>
                  <motion.button whileTap={{ scale: 0.8 }} onClick={() => increment(p.id)} className="w-9 h-9 bg-royal-50 dark:bg-royal-900/30 rounded-xl flex items-center justify-center border border-royal-100 dark:border-royal-800 active:scale-90 transition-transform"><Plus size={14} className="text-royal-600 dark:text-royal-300" /></motion.button>
                </div>
              </div>
            );
          })}
          {filterList(dailyProducts).length === 0 && <p className="text-center py-6 text-sm text-gray-400">No products found</p>}
        </div>

        {/* Seasonal Products */}
        {filterList(seasonalProducts).length > 0 && (
          <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#222222] overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600">
              <p className="text-sm font-bold text-white">Seasonal Products</p>
              <p className="text-[10px] text-amber-100">{filterList(seasonalProducts).length} items</p>
            </div>
            {filterList(seasonalProducts).map((p, i) => {
              const qty = quantities[p.id] || 0;
              return (
                <div key={p.id} className={`flex items-center justify-between py-3.5 px-4 border-b border-gray-100 dark:border-[#222222] last:border-0 ${qty > 0 ? 'bg-royal-50/30 dark:bg-royal-900/10' : ''}`}>
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-xs font-mono text-gray-400 dark:text-gray-500 w-5 shrink-0">{i + 1}</span>
                    <div className="min-w-0">
                      <p className="font-bold text-[15px] text-gray-800 dark:text-white truncate">{p.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{formatPrice(p.price)}/{p.unit}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {qty > 0 && <motion.button whileTap={{ scale: 0.8 }} onClick={() => decrement(p.id)} className="w-9 h-9 bg-red-50 dark:bg-red-900/30 rounded-xl flex items-center justify-center border border-red-100 dark:border-red-800 active:scale-90 transition-transform"><Minus size={14} className="text-red-500" /></motion.button>}
                    <motion.div animate={changedId === p.id ? { scale: [1, 1.2, 1] } : {}} transition={{ duration: 0.2 }}>
                      <input type="tel" inputMode="numeric" pattern="[0-9]*" value={qty || ''}
                        onChange={e => setQty(p.id, e.target.value.replace(/\D/g, ''))}
                        placeholder="0"
                        className={`w-14 h-9 text-center text-base font-bold rounded-xl outline-none transition-colors ${qty > 0 ? 'bg-royal-600 text-white border-royal-600' : 'bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333333] text-gray-800 dark:text-white'}`} />
                    </motion.div>
                    <motion.button whileTap={{ scale: 0.8 }} onClick={() => increment(p.id)} className="w-9 h-9 bg-royal-50 dark:bg-royal-900/30 rounded-xl flex items-center justify-center border border-royal-100 dark:border-royal-800 active:scale-90 transition-transform"><Plus size={14} className="text-royal-600 dark:text-royal-300" /></motion.button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cart Bar */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-[5.5rem] lg:bottom-6 left-0 right-0 z-40 px-4">
            <motion.button
              whileTap={{ scale: cutoffPassed ? 1 : 0.98 }}
              animate={cartPulse ? { scale: [1, 1.02, 1] } : {}}
              transition={{ duration: 0.2 }}
              onClick={handleOrder}
              className={`w-full max-w-2xl mx-auto flex items-center justify-between py-4 px-6 rounded-2xl shadow-float ${cutoffPassed ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-royal-700 via-royal-600 to-mint-700 shadow-royal-600/30'} text-white`}>
              <span className="flex items-center gap-3">
                <ShoppingCart size={20} />
                <motion.span key={cartCount} initial={{ scale: 1.3 }} animate={{ scale: 1 }} className="bg-white/20 px-3 py-1.5 rounded-xl text-sm font-bold">{cartCount} items</motion.span>
                <span className="font-extrabold text-lg">{formatPrice(cartTotal)}</span>
              </span>
              <span className="text-sm font-bold bg-white/15 px-4 py-2 rounded-xl">Checkout →</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
      </>}
    </div>
  );
}

