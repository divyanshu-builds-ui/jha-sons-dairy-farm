import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, AlertTriangle, Clock, Plus, Minus, X, Package, ChevronUp, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { db, doc, collection, getDocs, query, where, cachedGetDoc, cachedGetDocs } from '../../services/firebase';
import { formatPrice } from '../../utils/price';
import { OrderSkeleton } from '../../components/LoadingSkeleton';
import { useFlags } from '../../context/FeatureFlags';

const fmtHour = (h) => h === 0 ? '12 AM' : h < 12 ? `${h} AM` : h === 12 ? '12 PM' : `${h - 12} PM`;

// ── Product Row — outside component to prevent remount ───────────────────────
const ProductRow = ({ p, i, qty, inCart, changedId, onIncrement, onDecrement, onSetQty }) => (
  <div className={`px-4 py-3 border-b border-warm-100 dark:border-[#2e2d2b] last:border-0 transition-colors ${inCart ? 'bg-navy-50/70 dark:bg-navy-900/20' : ''}`}>
    <div className="flex items-center gap-3">

      <span className="text-[10px] text-warm-300 dark:text-warm-600 w-5 shrink-0 text-right font-mono">{i + 1}</span>

      {/* Name + price */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-tight ${inCart ? 'text-navy-700 dark:text-navy-300' : 'text-warm-800 dark:text-warm-100'}`}
          style={{ overflowWrap: 'anywhere' }}>
          {p.name}
        </p>
        <p className="text-[11px] text-warm-400 font-mono mt-0.5">
          {formatPrice(p.price)}<span className="text-warm-300 dark:text-warm-600">/{p.unit}</span>
        </p>
      </div>

      {/* Subtotal — desktop only */}
      <div className="hidden lg:block w-24 text-right shrink-0">
        {inCart && (
          <motion.p key={qty} initial={{ opacity: 0, y: -3 }} animate={{ opacity: 1, y: 0 }}
            className="text-sm font-bold text-navy-700 dark:text-navy-300 font-mono">
            {formatPrice(p.price * qty)}
          </motion.p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1 shrink-0">
        <button onClick={() => onDecrement(p.id)}
          className={`w-9 h-9 rounded-lg flex items-center justify-center active:scale-95 transition-all border ${
            inCart
              ? 'bg-warm-100 dark:bg-[#2e2d2b] border-warm-200 dark:border-[#4a4845]'
              : 'bg-warm-50 dark:bg-[#1a1917] border-warm-100 dark:border-[#2e2d2b] opacity-25 pointer-events-none'
          }`}>
          <Minus size={13} className="text-warm-600 dark:text-warm-300" />
        </button>

        <motion.input
          animate={changedId === p.id ? { scale: [1, 1.12, 1] } : {}}
          transition={{ duration: 0.15 }}
          type="tel" inputMode="numeric" pattern="[0-9]*"
          value={qty || ''}
          onChange={e => onSetQty(p.id, e.target.value.replace(/\D/g, ''))}
          placeholder="0"
          className={`w-11 h-9 text-center text-sm font-bold rounded-lg outline-none font-mono transition-colors ${
            inCart
              ? 'bg-navy-700 dark:bg-navy-600 text-white'
              : 'bg-warm-50 dark:bg-[#2e2d2b] border border-warm-200 dark:border-[#4a4845] text-warm-400 dark:text-warm-500'
          }`}
        />

        <button onClick={() => onIncrement(p.id)}
          className={`w-9 h-9 rounded-lg flex items-center justify-center active:scale-95 transition-all border ${
            inCart
              ? 'bg-navy-700 dark:bg-navy-600 border-navy-600 dark:border-navy-500'
              : 'bg-warm-50 dark:bg-[#2e2d2b] border-warm-200 dark:border-[#4a4845]'
          }`}>
          <Plus size={13} className={inCart ? 'text-white' : 'text-warm-600 dark:text-warm-300'} />
        </button>
      </div>

      {/* Mobile subtotal inline */}
      {inCart && (
        <motion.span key={qty} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="lg:hidden text-xs font-bold text-navy-700 dark:text-navy-300 font-mono shrink-0">
          {formatPrice(p.price * qty)}
        </motion.span>
      )}
    </div>
  </div>
);

const ColHeader = () => (
  <div className="flex items-center gap-3 px-4 py-2 bg-warm-50 dark:bg-[#222] border-b border-warm-100 dark:border-[#2e2d2b]">
    <span className="w-5 shrink-0" />
    <p className="flex-1 text-[10px] font-bold text-warm-400 uppercase tracking-wide">Product</p>
    <p className="hidden lg:block w-24 text-right text-[10px] font-bold text-warm-400 uppercase tracking-wide shrink-0">Total</p>
    <p className="w-[116px] text-center text-[10px] font-bold text-warm-400 uppercase tracking-wide shrink-0">Qty</p>
  </div>
);

// ── Main component ───────────────────────────────────────────────────────────
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
  const [cartOpen, setCartOpen] = useState(false);
  const [changedId, setChangedId] = useState(null);
  const user = JSON.parse(localStorage.getItem('lg_user') || '{}');

  useEffect(() => {
    async function fetchAll() {
      try {
        const ledgerSnap = await getDocs(query(collection(db, 'ledger'), where('retailerId', '==', user.phone)));
        const entries = ledgerSnap.docs.map(d => d.data());
        setBalance(entries.reduce((sum, e) => e.type === 'debit' ? sum + (e.amount || 0) : sum - (e.amount || 0), 0));

        const prodSnap = await cachedGetDocs(collection(db, 'products'), 'products_all', 10 * 60 * 1000);
        const prods = prodSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.active !== false);
        setProducts(prods);

        const reorder = localStorage.getItem('lg_reorder');
        if (reorder) {
          try {
            const items = JSON.parse(reorder);
            const qtyMap = {};
            items.forEach(item => { const match = prods.find(p => p.name === item.name); if (match) qtyMap[match.id] = Number(item.qty) || 0; });
            setQuantities(prev => ({ ...prev, ...qtyMap }));
          } catch {}
          localStorage.removeItem('lg_reorder');
        }

        const appSnap = await cachedGetDoc(doc(db, 'settings', 'app'), 5 * 60 * 1000);
        if (appSnap.exists()) {
          const d = appSnap.data();
          const start = d.orderStart ?? 12, end = d.orderEnd ?? 16;
          setOrderWindow({ start, end });
          if (d.maxOrderItems) setMaxOrderItems(d.maxOrderItems);
          if (start === -1 || end === -1) setCutoffPassed(false);
          else {
            const hour = new Date().getHours();
            setCutoffPassed(end <= start ? !(hour >= start || hour < end) : (hour < start || hour >= end));
          }
        }
      } catch {}
      setPageLoading(false);
    }
    fetchAll();
  }, [user.phone]);

  const showToast = useCallback((msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); }, []);

  const increment = useCallback((id) => {
    setQuantities(prev => {
      const currentCount = Object.keys(prev).filter(k => prev[k] > 0).length;
      const isNew = !prev[id] || prev[id] === 0;
      if (isNew && maxOrderItems > 0 && currentCount >= maxOrderItems) {
        showToast(`Max ${maxOrderItems} items allowed`); return prev;
      }
      return { ...prev, [id]: (prev[id] || 0) + 1 };
    });
    setChangedId(id); setTimeout(() => setChangedId(null), 200);
  }, [maxOrderItems, showToast]);

  const decrement = useCallback((id) => {
    setQuantities(prev => {
      const val = (prev[id] || 0) - 1;
      if (val <= 0) { const n = { ...prev }; delete n[id]; return n; }
      return { ...prev, [id]: val };
    });
    setChangedId(id); setTimeout(() => setChangedId(null), 200);
  }, []);

  const setQty = useCallback((id, val) => {
    const num = parseInt(val) || 0;
    setQuantities(prev => {
      if (num < 0) return prev;
      if (num === 0) { const n = { ...prev }; delete n[id]; return n; }
      return { ...prev, [id]: num };
    });
  }, []);

  const clearAll = () => { setQuantities({}); setCartOpen(false); };

  const cartItems = products.filter(p => quantities[p.id] > 0).map(p => ({ ...p, qty: quantities[p.id] }));
  const cartCount = cartItems.length;
  const cartTotal = cartItems.reduce((s, i) => s + (i.price || 0) * i.qty, 0);
  const dailyProducts = products.filter(p => p.type === 'daily');
  const seasonalProducts = flags.seasonalProducts !== false ? products.filter(p => p.type === 'seasonal') : [];
  const filterList = (list) => list.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) || String(p.price).includes(search)
  );

  const handleOrder = () => {
    if (cartItems.length === 0 || cutoffPassed) return;
    localStorage.setItem('lg_cart', JSON.stringify(cartItems));
    navigate('/checkout');
  };

  if (pageLoading) return <OrderSkeleton />;

  return (
    <div className="pb-32 max-w-5xl mx-auto">

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}
            className="fixed top-16 left-4 right-4 z-[100] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/80 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 shadow-md">
            <Clock size={13} className="shrink-0" />
            <span className="text-xs font-semibold">{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order Window Closed */}
      {cutoffPassed && (
        <div className="text-center py-16 space-y-3">
          <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/30 rounded-xl flex items-center justify-center mx-auto border border-amber-100 dark:border-amber-900/50">
            <Clock size={22} className="text-amber-600" />
          </div>
          <div>
            <h3 className="text-base font-bold text-warm-800 dark:text-warm-100">Order Window Closed</h3>
            <p className="text-sm text-warm-500 mt-1">Orders accepted {fmtHour(orderWindow.start)} – {fmtHour(orderWindow.end)} only.</p>
            <p className="text-xs text-warm-400 mt-0.5">You can still browse product prices.</p>
          </div>
          <button onClick={() => navigate('/prices')} className="btn-primary">View Price List</button>
        </div>
      )}

      {!cutoffPassed && (
        <div className="space-y-4">

          {/* Balance Warning */}
          {flags.balanceWarning !== false && balance > 0 && (
            <div className="flex items-center gap-3 px-4 py-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl">
              <AlertTriangle size={14} className="text-red-500 shrink-0" />
              <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                Previous due: <span className="font-bold font-mono">{formatPrice(balance)}</span>
              </p>
            </div>
          )}

          {/* Search + Clear */}
          <div className="flex items-center gap-2 lg:max-w-sm">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warm-400" />
              <input
                className="input-field pl-9 pr-8 rounded-xl w-full"
                placeholder="Search products..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 bg-warm-200 dark:bg-[#4a4845] rounded-full flex items-center justify-center">
                  <X size={9} className="text-warm-600" />
                </button>
              )}
            </div>
            {cartCount > 0 && (
              <button onClick={clearAll}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 text-red-600 text-xs font-semibold shrink-0">
                <Trash2 size={13} /> Clear
              </button>
            )}
          </div>

          {/* Price notice */}
          <p className="text-[11px] text-warm-400 flex items-center gap-1.5">
            <AlertTriangle size={10} className="text-amber-400 shrink-0" />
            Prices may change without prior notice.
          </p>

          {/* Product Lists */}
          <div className={`grid grid-cols-1 gap-4 ${filterList(seasonalProducts).length > 0 ? 'lg:grid-cols-2' : 'lg:grid-cols-1 lg:max-w-2xl'}`}>

            {/* Daily */}
            <div className="bg-white dark:bg-[#1a1917] border border-warm-200 dark:border-[#2e2d2b] rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-navy-700 dark:bg-navy-800 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Daily Products</p>
                  <p className="text-[10px] text-white/40 mt-0.5">{filterList(dailyProducts).length} items</p>
                </div>
                {dailyProducts.filter(p => quantities[p.id] > 0).length > 0 && (
                  <span className="text-[10px] font-bold bg-white/15 text-white px-2.5 py-1 rounded-lg">
                    {dailyProducts.filter(p => quantities[p.id] > 0).length} selected
                  </span>
                )}
              </div>
              <ColHeader />
              {filterList(dailyProducts).length > 0
                ? filterList(dailyProducts).map((p, i) => (
                  <ProductRow key={p.id} p={p} i={i}
                    qty={quantities[p.id] || 0}
                    inCart={(quantities[p.id] || 0) > 0}
                    changedId={changedId}
                    onIncrement={increment}
                    onDecrement={decrement}
                    onSetQty={setQty}
                  />
                ))
                : <div className="py-8 text-center"><Package size={18} className="text-warm-300 mx-auto mb-2" /><p className="text-sm text-warm-400">No products found</p></div>
              }
            </div>

            {/* Seasonal */}
            {filterList(seasonalProducts).length > 0 && (
              <div className="bg-white dark:bg-[#1a1917] border border-warm-200 dark:border-[#2e2d2b] rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-amber-600 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-bold text-white">Seasonal Products</p>
                    <p className="text-[10px] text-white/50 mt-0.5">{filterList(seasonalProducts).length} items</p>
                  </div>
                  {seasonalProducts.filter(p => quantities[p.id] > 0).length > 0 && (
                    <span className="text-[10px] font-bold bg-white/15 text-white px-2.5 py-1 rounded-lg">
                      {seasonalProducts.filter(p => quantities[p.id] > 0).length} selected
                    </span>
                  )}
                </div>
                <ColHeader />
                {filterList(seasonalProducts).map((p, i) => (
                  <ProductRow key={p.id} p={p} i={i}
                    qty={quantities[p.id] || 0}
                    inCart={(quantities[p.id] || 0) > 0}
                    changedId={changedId}
                    onIncrement={increment}
                    onDecrement={decrement}
                    onSetQty={setQty}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Cart Bar ── */}
      <AnimatePresence>
        {cartCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-[5rem] lg:bottom-6 left-0 lg:left-auto right-0 lg:right-6 z-40 px-3 lg:px-0 lg:w-[520px]">

            <div className="w-full max-w-2xl mx-auto bg-navy-700 dark:bg-navy-800 rounded-xl shadow-xl overflow-hidden border border-navy-600 dark:border-navy-700">

              {/* Expandable items */}
              <AnimatePresence>
                {cartOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden">
                    <div className="max-h-52 overflow-y-auto divide-y divide-white/10 bg-navy-800 dark:bg-navy-900">
                      {cartItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between px-4 py-2.5">
                          <p className="text-sm text-white/80 truncate flex-1">{item.name}</p>
                          <div className="flex items-center gap-3 shrink-0 ml-3">
                            <span className="text-xs text-white/40 font-mono">×{item.qty}</span>
                            <span className="text-sm font-bold text-white font-mono">{formatPrice(item.price * item.qty)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between px-4 py-2 bg-navy-900/60 border-t border-white/10">
                      <p className="text-xs text-white/40">{cartCount} items total</p>
                      <p className="text-sm font-bold text-white font-mono">{formatPrice(cartTotal)}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main bar */}
              <div className="flex items-center gap-3 px-4 py-3">
                <button onClick={() => setCartOpen(o => !o)} className="flex items-center gap-2 flex-1 min-w-0">
                  <ShoppingCart size={18} className="text-white shrink-0" />
                  <span className="bg-white/15 px-2.5 py-1 rounded-lg text-sm font-bold text-white font-mono shrink-0">{cartCount}</span>
                  <span className="text-white/50 text-sm truncate">items</span>
                  <motion.div animate={{ rotate: cartOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <ChevronUp size={15} className="text-white/40 shrink-0" />
                  </motion.div>
                </button>
                <p className="text-lg font-bold text-white font-mono shrink-0">{formatPrice(cartTotal)}</p>
                <button onClick={handleOrder}
                  className="px-4 py-2 bg-white text-navy-700 text-sm font-bold rounded-lg hover:bg-warm-100 transition-colors active:scale-95 shrink-0">
                  Checkout →
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
