import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, Plus, Minus, X, Check, Users, MapPin, ClipboardList, ArrowRight, AlertTriangle, RotateCcw, Trash2, Calendar, Edit3 } from 'lucide-react';
import { db, doc, getDoc, collection, getDocs, addDoc, updateDoc, query, where } from '../../services/firebase';
import { formatPrice } from '../../utils/price';
import { useConfirm } from '../../components/ConfirmModal';

export default function AdminPlaceOrder() {
  const confirm = useConfirm();
  const [retailers, setRetailers] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState('All');
  const [selectedRetailer, setSelectedRetailer] = useState(null);
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [search, setSearch] = useState('');
  const [retailerSearch, setRetailerSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [toast, setToast] = useState(null);
  const [duplicateOrder, setDuplicateOrder] = useState(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [balances, setBalances] = useState({});
  const [lastOrder, setLastOrder] = useState(null);
  const [orderDate, setOrderDate] = useState('tomorrow');
  const [editingOrder, setEditingOrder] = useState(false); // true when editing existing order

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const [retailerSnap, prodSnap, areasDoc, ledgerSnap] = await Promise.all([
          getDocs(query(collection(db, 'users'), where('role', '==', 'retailer'))),
          getDocs(collection(db, 'products')),
          getDoc(doc(db, 'settings', 'areas')),
          getDocs(collection(db, 'ledger'))
        ]);
        setRetailers(retailerSnap.docs.map(d => ({ phone: d.id, ...d.data() })));
        setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.active !== false));
        if (areasDoc.exists()) setAreas(areasDoc.data().list || []);
        // Calculate balances
        const balMap = {};
        ledgerSnap.docs.forEach(d => {
          const e = d.data();
          const rid = e.retailerId;
          if (!rid) return;
          if (!balMap[rid]) balMap[rid] = 0;
          if (e.type === 'debit') balMap[rid] += (e.amount || 0);
          else balMap[rid] -= (e.amount || 0);
        });
        setBalances(balMap);
      } catch (err) {}
      setLoading(false);
    }
    fetchData();
  }, []);

  const getOrderDateObj = () => {
    if (orderDate === 'tomorrow') {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d;
    }
    return new Date(orderDate + 'T00:00:00');
  };

  const getOrderDateStr = () => {
    return getOrderDateObj().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getMinDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  };

  // Check duplicate order + fetch last order when retailer is selected
  useEffect(() => {
    if (!selectedRetailer) { setDuplicateOrder(null); setLastOrder(null); setEditingOrder(false); return; }
    const checkDuplicate = async () => {
      setCheckingDuplicate(true);
      setEditingOrder(false);
      try {
        const dateStr = getOrderDateStr();
        const snap = await getDocs(query(collection(db, 'orders'), where('phone', '==', selectedRetailer.phone), where('date', '==', dateStr)));
        const existing = snap.docs.find(d => {
          const s = d.data().status;
          return s !== 'Cancelled' && s !== 'Returned';
        });
        setDuplicateOrder(existing ? { id: existing.id, ...existing.data() } : null);

        // Fetch last order for re-order
        const historySnap = await getDocs(query(collection(db, 'orders'), where('phone', '==', selectedRetailer.phone)));
        const orders = historySnap.docs.map(d => d.data()).filter(o => o.status !== 'Cancelled' && o.status !== 'Returned');
        orders.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setLastOrder(orders[0] || null);
      } catch (err) { setDuplicateOrder(null); setLastOrder(null); }
      setCheckingDuplicate(false);
    };
    checkDuplicate();
  }, [selectedRetailer?.phone, orderDate]);

  const increment = (id) => setQuantities(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  const decrement = (id) => setQuantities(prev => {
    const val = (prev[id] || 0) - 1;
    if (val <= 0) { const n = { ...prev }; delete n[id]; return n; }
    return { ...prev, [id]: val };
  });
  const setQty = (id, val) => {
    const num = parseInt(val) || 0;
    setQuantities(prev => {
      if (num <= 0) { const n = { ...prev }; delete n[id]; return n; }
      return { ...prev, [id]: num };
    });
  };

  const cartItems = products.filter(p => quantities[p.id] > 0).map(p => ({ ...p, qty: quantities[p.id] }));
  const cartTotal = cartItems.reduce((s, i) => s + (i.price || 0) * i.qty, 0);

  const filteredRetailers = useMemo(() => {
    return retailers.filter(r => {
      const matchArea = selectedArea === 'All' || r.area === selectedArea;
      const q = retailerSearch.toLowerCase().trim();
      const matchSearch = !q || r.name?.toLowerCase().includes(q) || r.phone?.includes(q) || r.shop?.toLowerCase().includes(q) || r.area?.toLowerCase().includes(q);
      return matchArea && matchSearch;
    }).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [retailers, selectedArea, retailerSearch]);

  const filteredProducts = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return products;
    return products.filter(p => p.name.toLowerCase().includes(q) || String(p.price).includes(q));
  }, [products, search]);

  const dailyProducts = filteredProducts.filter(p => p.type === 'daily');
  const seasonalProducts = filteredProducts.filter(p => p.type === 'seasonal');

  const placeOrder = async () => {
    if (!selectedRetailer || cartItems.length === 0) return;
    const isEdit = editingOrder && duplicateOrder;
    const ok = await confirm({ title: isEdit ? 'Update Order' : 'Place Order', message: isEdit ? `Update existing order to ${cartItems.length} items (${formatPrice(cartTotal)}) for ${selectedRetailer.name}?` : `Place order of ${cartItems.length} items (${formatPrice(cartTotal)}) for ${selectedRetailer.name}?`, confirmText: isEdit ? 'Update' : 'Place Order', type: 'warning' });
    if (!ok) return;
    setPlacing(true);
    try {
      const orderItems = cartItems.map(i => ({ name: i.name, qty: `${i.qty} ${i.unit}`, price: (i.price || 0) * i.qty, unitPrice: i.price || 0 }));

      if (isEdit) {
        // Update existing order
        await updateDoc(doc(db, 'orders', duplicateOrder.id), { items: orderItems, total: cartTotal, modified: true, modifiedAt: new Date().toISOString(), modifiedBy: 'admin' });
        // Sync to order_history
        const hSnap = await getDocs(query(collection(db, 'order_history'), where('orderId', '==', duplicateOrder.id)));
        if (!hSnap.empty) await updateDoc(doc(db, 'order_history', hSnap.docs[0].id), { items: orderItems, total: cartTotal, modified: true, modifiedAt: new Date().toISOString() });
      } else {
        // Create new order
        const orderData = {
          retailerId: selectedRetailer.phone,
          retailer: selectedRetailer.name,
          phone: selectedRetailer.phone,
          area: selectedRetailer.area || '',
          items: orderItems,
          total: cartTotal,
          status: 'Confirmed',
          date: getOrderDateStr(),
          time: new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }),
          orderedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          placedBy: 'admin',
        };
        const orderRef = await addDoc(collection(db, 'orders'), orderData);
        await addDoc(collection(db, 'order_history'), { ...orderData, orderId: orderRef.id, historyCreatedAt: new Date().toISOString() });
      }

      setSuccess(true);
      setQuantities({});
      setEditingOrder(false);
      setTimeout(() => { setSuccess(false); setSelectedRetailer(null); }, 2500);
    } catch (err) {
      showToast('Order failed! Check internet and try again.', 'error');
    }
    setPlacing(false);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[50vh]"><div className="w-6 h-6 border-2 border-royal-200 border-t-royal-600 rounded-full animate-spin" /></div>;

  // Success overlay — Admin-style with order details
  if (success) return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 bg-[#0f172a] flex flex-col items-center justify-center text-center p-6 overflow-hidden">
      {/* Background animated circles */}
      <motion.div animate={{ scale: [1, 1.5, 1], opacity: [0.05, 0.1, 0.05] }} transition={{ duration: 3, repeat: Infinity }} className="absolute w-[500px] h-[500px] bg-mint-500 rounded-full blur-3xl" />
      <motion.div animate={{ scale: [1.2, 1, 1.2], opacity: [0.03, 0.08, 0.03] }} transition={{ duration: 4, repeat: Infinity, delay: 1 }} className="absolute w-[400px] h-[400px] bg-royal-400 rounded-full blur-3xl translate-x-32 translate-y-20" />

      {/* Animated rings */}
      <motion.div animate={{ scale: [1, 2.5], opacity: [0.4, 0] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }}
        className="absolute w-24 h-24 rounded-full border-2 border-mint-400/40" />
      <motion.div animate={{ scale: [1, 3], opacity: [0.2, 0] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5, delay: 0.3 }}
        className="absolute w-24 h-24 rounded-full border border-mint-400/20" />

      {/* Icon */}
      <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}
        className="relative w-24 h-24 bg-gradient-to-br from-mint-500/20 to-mint-600/10 rounded-3xl flex items-center justify-center mb-6 border border-mint-400/30 backdrop-blur-sm shadow-2xl shadow-mint-500/20">
        <motion.div initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.3, duration: 0.5 }}>
          <Check size={48} className="text-mint-400" strokeWidth={3} />
        </motion.div>
      </motion.div>

      {/* Text */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="relative z-10">
        <h2 className="text-2xl font-black text-white mb-1">Order Confirmed!</h2>
        <p className="text-royal-300 text-sm">Placed by Admin on behalf of</p>
      </motion.div>

      {/* Retailer card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="relative z-10 mt-5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-4 min-w-[200px]">
        <p className="text-lg font-black text-white">{selectedRetailer?.name}</p>
        <p className="text-xs text-royal-300 mt-0.5">{selectedRetailer?.area} • {selectedRetailer?.phone}</p>
        <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-center gap-2">
          <span className="text-mint-400 font-black text-lg">{formatPrice(cartTotal)}</span>
          <span className="text-[10px] text-royal-400 bg-white/5 px-2 py-0.5 rounded-full">Admin Order</span>
        </div>
      </motion.div>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
        className="text-[11px] text-royal-400 mt-6 relative z-10">Redirecting back...</motion.p>
    </motion.div>
  );

  // Product card renderer
  const renderProducts = (list, title, gradient) => (
    list.length > 0 && (
      <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#222222] overflow-hidden shadow-sm">
        <div className={`px-4 py-2.5 bg-gradient-to-r ${gradient}`}>
          <p className="text-sm font-bold text-white">{title}</p>
          <p className="text-[10px] text-gray-300">{list.length} items</p>
        </div>
        {list.map((p, i) => {
          const qty = quantities[p.id] || 0;
          return (
            <div key={p.id} className={`flex items-center justify-between py-3 px-4 border-b border-gray-100 dark:border-[#222222] last:border-0 ${qty > 0 ? 'bg-royal-50/30 dark:bg-royal-900/10' : ''}`}>
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <span className="text-[11px] font-mono text-gray-400 w-4 shrink-0">{i + 1}</span>
                <div className="min-w-0">
                  <p className="font-bold text-sm text-gray-800 dark:text-white truncate">{p.name}</p>
                  <p className="text-[11px] text-gray-400">{formatPrice(p.price)}/{p.unit}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {qty > 0 && <button onClick={() => decrement(p.id)} className="w-8 h-8 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center border border-red-100 dark:border-red-800 active:scale-90 transition-transform"><Minus size={13} className="text-red-500" /></button>}
                <input type="tel" inputMode="numeric" value={qty || ''} onChange={e => setQty(p.id, e.target.value.replace(/\D/g, ''))} placeholder="0"
                  className={`w-12 h-8 text-center text-sm font-bold rounded-lg outline-none transition-colors ${qty > 0 ? 'bg-royal-600 text-white' : 'bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333333] text-gray-800 dark:text-white'}`} />
                <button onClick={() => increment(p.id)} className="w-8 h-8 bg-royal-50 dark:bg-royal-900/30 rounded-lg flex items-center justify-center border border-royal-100 dark:border-royal-800 active:scale-90 transition-transform"><Plus size={13} className="text-royal-600 dark:text-royal-300" /></button>
              </div>
            </div>
          );
        })}
      </div>
    )
  );

  // DESKTOP: side-by-side layout | MOBILE: step-based
  return (
    <div className="pb-28 lg:pb-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-[4.5rem] left-4 right-4 lg:left-1/2 lg:-translate-x-1/2 lg:w-auto lg:right-auto z-[100] flex items-center justify-center gap-2 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-sm ${toast.type === 'error' ? 'bg-red-50/95 border-red-200 text-red-700 dark:bg-red-900/90 dark:border-red-700 dark:text-red-200' : 'bg-mint-50/95 border-mint-200 text-mint-800 dark:bg-mint-900/90 dark:border-mint-700 dark:text-mint-200'}`}>
            {toast.type === 'error' ? <AlertTriangle size={14} /> : <Check size={14} strokeWidth={3} />}
            <span className="text-xs font-bold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Desktop Layout */}
      <div className="hidden lg:grid lg:grid-cols-[340px_1fr] lg:gap-6 lg:items-start">
        {/* Left: Retailer Selection */}
        <div className="sticky top-20 space-y-3">
          <h2 className="text-lg font-extrabold text-gray-800 dark:text-white">Place Order</h2>

          {/* Area Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {['All', ...areas].map(area => (
              <button key={area} onClick={() => { setSelectedArea(area); setSelectedRetailer(null); setQuantities({}); }}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${selectedArea === area ? 'bg-royal-700 text-white shadow' : 'bg-white dark:bg-[#111111] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#222222] hover:border-royal-300'}`}>
                {area}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
            <input className="w-full pl-9 pr-8 py-2.5 text-sm bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-xl focus:outline-none focus:border-royal-400 dark:text-white"
              placeholder="Name, phone, shop..." value={retailerSearch} onChange={e => setRetailerSearch(e.target.value)} />
            {retailerSearch && <button onClick={() => setRetailerSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-200 dark:bg-[#333] rounded-full flex items-center justify-center"><X size={8} className="text-gray-500" /></button>}
          </div>

          {/* Retailer List */}
          <div className="max-h-[60vh] overflow-y-auto space-y-1.5 pr-1">
            {filteredRetailers.map(r => (
              <button key={r.phone} onClick={() => { setSelectedRetailer(r); setQuantities({}); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left transition-all ${selectedRetailer?.phone === r.phone ? 'bg-royal-50 dark:bg-royal-900/20 border-royal-200 dark:border-royal-800 border' : 'bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#222222] hover:border-royal-200 dark:hover:border-royal-800'}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${selectedRetailer?.phone === r.phone ? 'bg-royal-600 text-white' : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400'}`}>
                  {r.name?.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-[13px] text-gray-800 dark:text-white truncate">{r.name}</p>
                  <p className="text-[10px] text-gray-400 truncate">{r.phone} • {r.area}</p>
                </div>
                {(balances[r.phone] || 0) > 0 && (
                  <span className="text-[9px] font-extrabold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-md border border-red-100 dark:border-red-800 shrink-0">{formatPrice(balances[r.phone])}</span>
                )}
              </button>
            ))}
            {filteredRetailers.length === 0 && <p className="text-center text-xs text-gray-400 py-6">No retailer found</p>}
          </div>
        </div>

        {/* Right: Products */}
        <div className="space-y-4">
          {selectedRetailer ? (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-extrabold text-gray-800 dark:text-white">Ordering for: {selectedRetailer.name}</p>
                  <p className="text-[11px] text-gray-400">{selectedRetailer.phone} • {selectedRetailer.area}</p>
                </div>
                {cartItems.length > 0 && (!duplicateOrder || editingOrder) && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => setQuantities({})} className="px-3 py-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-500 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                      <Trash2 size={14} />
                    </button>
                    <button onClick={placeOrder} disabled={placing || checkingDuplicate}
                      className="px-5 py-2.5 bg-gradient-to-r from-royal-700 to-mint-700 text-white text-sm font-bold rounded-xl shadow-lg disabled:opacity-50">
                      {placing ? 'Saving...' : editingOrder ? `Update Order • ${formatPrice(cartTotal)}` : `Place Order • ${formatPrice(cartTotal)}`}
                    </button>
                  </div>
                )}
              </div>

              {/* Date Picker */}
              <div className="flex items-center gap-2">
                <button onClick={() => setOrderDate('tomorrow')}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${orderDate === 'tomorrow' ? 'bg-royal-700 text-white shadow' : 'bg-white dark:bg-[#111111] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#222222]'}`}>
                  Tomorrow
                </button>
                <div className="relative">
                  <Calendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input type="date" min={getMinDate()} max={getMaxDate()}
                    value={orderDate === 'tomorrow' ? '' : orderDate}
                    onChange={e => setOrderDate(e.target.value || 'tomorrow')}
                    className={`pl-8 pr-3 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${orderDate !== 'tomorrow' ? 'bg-royal-700 text-white border-royal-700' : 'bg-white dark:bg-[#111111] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-[#222222]'}`} />
                </div>
                <span className="text-[10px] text-gray-400 font-medium">Delivery: {getOrderDateStr()}</span>
              </div>

              {/* Duplicate Order Warning + Edit */}
              {duplicateOrder && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3.5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={18} className="text-amber-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Order exists for {getOrderDateStr()}</p>
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                        {duplicateOrder.items?.length} items • {formatPrice(duplicateOrder.total)} • Status: {duplicateOrder.status}
                      </p>
                    </div>
                  </div>
                  {!editingOrder && (duplicateOrder.status === 'Confirmed' || duplicateOrder.status === 'Pending') && (
                    <button onClick={() => {
                      const qtyMap = {};
                      (duplicateOrder.items || []).forEach(item => {
                        const match = products.find(p => p.name === item.name);
                        if (match) {
                          const num = parseInt(item.qty) || 0;
                          if (num > 0) qtyMap[match.id] = num;
                        }
                      });
                      setQuantities(qtyMap);
                      setEditingOrder(true);
                    }}
                      className="mt-3 flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#111111] border border-amber-300 dark:border-amber-700 rounded-xl hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-colors w-full justify-center">
                      <Edit3 size={14} className="text-amber-600" />
                      <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Edit Existing Order</span>
                    </button>
                  )}
                  {editingOrder && (
                    <p className="mt-2 text-[10px] font-bold text-royal-600 dark:text-royal-400 bg-royal-50 dark:bg-royal-900/20 px-3 py-1.5 rounded-lg text-center">Editing mode — modify items below and save</p>
                  )}
                </div>
              )}

              {/* Quick Re-order */}
              {lastOrder && !duplicateOrder && Object.keys(quantities).length === 0 && (
                <button onClick={() => {
                  const qtyMap = {};
                  (lastOrder.items || []).forEach(item => {
                    const match = products.find(p => p.name === item.name);
                    if (match) {
                      const num = parseInt(item.qty) || 0;
                      if (num > 0) qtyMap[match.id] = num;
                    }
                  });
                  if (Object.keys(qtyMap).length > 0) setQuantities(qtyMap);
                }}
                  className="flex items-center gap-2.5 px-4 py-3 bg-royal-50 dark:bg-royal-900/20 border border-royal-200 dark:border-royal-800 rounded-xl hover:bg-royal-100 dark:hover:bg-royal-900/30 transition-colors w-fit">
                  <RotateCcw size={14} className="text-royal-600 dark:text-royal-400" />
                  <div className="text-left">
                    <p className="text-xs font-bold text-royal-700 dark:text-royal-300">Repeat Last Order</p>
                    <p className="text-[10px] text-royal-500 dark:text-royal-400">{lastOrder.items?.length} items • {formatPrice(lastOrder.total)} • {lastOrder.date}</p>
                  </div>
                </button>
              )}

              <div className="relative max-w-sm">
                <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
                <input className="w-full pl-9 pr-8 py-2.5 text-sm bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-xl focus:outline-none focus:border-royal-400 dark:text-white"
                  placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
                {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-200 dark:bg-[#333] rounded-full flex items-center justify-center"><X size={8} className="text-gray-500" /></button>}
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {renderProducts(dailyProducts, 'Daily Products', 'from-[#0f172a] to-[#1e293b]')}
                {renderProducts(seasonalProducts, 'Seasonal Products', 'from-amber-500 to-amber-600')}
              </div>

              {/* Cart Summary */}
              <AnimatePresence>
                {cartItems.length > 0 && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-2xl p-4">
                    <p className="text-xs font-bold text-gray-500 mb-2">Cart ({cartItems.length} items)</p>
                    <div className="flex flex-wrap gap-2">
                      {cartItems.map(i => (
                        <span key={i.id} className="text-[11px] font-semibold bg-royal-50 dark:bg-royal-900/20 text-royal-700 dark:text-royal-300 px-2.5 py-1 rounded-lg border border-royal-100 dark:border-royal-800">
                          {i.name} × {i.qty}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="relative">
                {/* Decorative bg */}
                <div className="absolute inset-0 w-40 h-40 mx-auto bg-royal-100/50 dark:bg-royal-900/10 rounded-full blur-2xl" />
                <div className="relative w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-[#1a1a1a] dark:to-[#111111] rounded-3xl flex items-center justify-center mx-auto mb-5 border border-gray-200 dark:border-[#222222] shadow-sm">
                  <ClipboardList size={32} className="text-gray-400 dark:text-gray-600" />
                </div>
                <h3 className="text-base font-extrabold text-gray-800 dark:text-gray-300 mb-1.5">Select a Retailer</h3>
                <p className="text-[13px] text-gray-500 dark:text-gray-500 max-w-[240px] mx-auto leading-relaxed">Choose a retailer from the left panel to place order on their behalf</p>
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
                  className="mt-5 flex items-center justify-center gap-2 text-royal-600 dark:text-royal-400">
                  <ArrowRight size={14} className="rotate-180" />
                  <span className="text-xs font-bold">Pick from {retailers.length} retailers</span>
                </motion.div>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="lg:hidden space-y-4">
        {!selectedRetailer ? (
          <>
            <h2 className="text-lg font-extrabold text-gray-800 dark:text-white">Place Order</h2>

            {/* Area Tabs */}
            <div className="overflow-x-auto no-scrollbar">
              <div className="flex gap-1.5 pb-1">
                {['All', ...areas].map(area => {
                  const count = area === 'All' ? retailers.length : retailers.filter(r => r.area === area).length;
                  return (
                    <button key={area} onClick={() => { setSelectedArea(area); setSelectedRetailer(null); setQuantities({}); }}
                      className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${selectedArea === area ? 'bg-royal-700 text-white shadow' : 'bg-white dark:bg-[#111111] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#222222]'}`}>
                      {area} <span className={`text-[9px] ${selectedArea === area ? 'text-white/60' : 'text-gray-400'}`}>({count})</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-3 text-gray-400" />
              <input className="w-full pl-10 pr-9 py-3 text-[16px] bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-2xl focus:outline-none focus:border-royal-400 dark:text-white shadow-sm"
                placeholder="Search name, phone, shop..." value={retailerSearch} onChange={e => setRetailerSearch(e.target.value)} />
              {retailerSearch && <button onClick={() => setRetailerSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-200 dark:bg-[#222] rounded-full flex items-center justify-center"><X size={10} className="text-gray-500" /></button>}
            </div>

            <p className="text-[11px] font-bold text-gray-400">{filteredRetailers.length} retailers</p>

            {/* Retailer List */}
            <div className="space-y-2">
              {filteredRetailers.map(r => (
                <button key={r.phone} onClick={() => { setSelectedRetailer(r); setQuantities({}); }}
                  className="w-full flex items-center gap-3 p-3.5 bg-white dark:bg-[#111111] border border-gray-100 dark:border-[#222222] rounded-2xl hover:border-royal-200 dark:hover:border-royal-800 transition-all text-left active:scale-[0.98]">
                  <div className="w-10 h-10 bg-royal-50 dark:bg-royal-900/30 rounded-xl flex items-center justify-center text-xs font-bold text-royal-600 dark:text-royal-300">
                    {r.name?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-800 dark:text-white truncate">{r.name}</p>
                    <p className="text-[11px] text-gray-400 truncate flex items-center gap-1"><MapPin size={9} />{r.area} • {r.phone}</p>
                  </div>
                  {(balances[r.phone] || 0) > 0 && (
                    <span className="text-[10px] font-extrabold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-lg border border-red-100 dark:border-red-800 shrink-0">{formatPrice(balances[r.phone])}</span>
                  )}
                </button>
              ))}
              {filteredRetailers.length === 0 && <p className="text-center text-sm text-gray-400 py-8">No retailer found</p>}
            </div>
          </>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center gap-3">
              <button onClick={() => setSelectedRetailer(null)} className="w-9 h-9 bg-gray-100 dark:bg-[#111111] rounded-xl flex items-center justify-center active:scale-90 transition-transform"><X size={16} className="text-gray-500" /></button>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-extrabold text-gray-800 dark:text-white truncate">{selectedRetailer.name}</p>
                <p className="text-[11px] text-gray-400">{selectedRetailer.phone} • {selectedRetailer.area}</p>
              </div>
            </div>

            {/* Duplicate Warning Mobile */}
            {duplicateOrder && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-300">Order exists for {getOrderDateStr()}</p>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">{duplicateOrder.items?.length} items • {formatPrice(duplicateOrder.total)} • {duplicateOrder.status}</p>
                  </div>
                </div>
                {!editingOrder && (duplicateOrder.status === 'Confirmed' || duplicateOrder.status === 'Pending') && (
                  <button onClick={() => {
                    const qtyMap = {};
                    (duplicateOrder.items || []).forEach(item => {
                      const match = products.find(p => p.name === item.name);
                      if (match) {
                        const num = parseInt(item.qty) || 0;
                        if (num > 0) qtyMap[match.id] = num;
                      }
                    });
                    setQuantities(qtyMap);
                    setEditingOrder(true);
                  }}
                    className="mt-2.5 flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#111111] border border-amber-300 dark:border-amber-700 rounded-xl w-full justify-center active:scale-[0.98]">
                    <Edit3 size={13} className="text-amber-600" />
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-300">Edit Existing Order</span>
                  </button>
                )}
                {editingOrder && (
                  <p className="mt-2 text-[10px] font-bold text-royal-600 dark:text-royal-400 bg-royal-50 dark:bg-royal-900/20 px-3 py-1.5 rounded-lg text-center">Editing mode — modify items and save</p>
                )}
              </div>
            )}

            {/* Quick Re-order Mobile */}
            {lastOrder && !duplicateOrder && Object.keys(quantities).length === 0 && (
              <button onClick={() => {
                const qtyMap = {};
                (lastOrder.items || []).forEach(item => {
                  const match = products.find(p => p.name === item.name);
                  if (match) {
                    const num = parseInt(item.qty) || 0;
                    if (num > 0) qtyMap[match.id] = num;
                  }
                });
                if (Object.keys(qtyMap).length > 0) setQuantities(qtyMap);
              }}
                className="flex items-center gap-2.5 px-4 py-3 bg-royal-50 dark:bg-royal-900/20 border border-royal-200 dark:border-royal-800 rounded-xl active:scale-[0.98] transition-transform w-full">
                <RotateCcw size={14} className="text-royal-600 dark:text-royal-400" />
                <div className="text-left">
                  <p className="text-xs font-bold text-royal-700 dark:text-royal-300">Repeat Last Order</p>
                  <p className="text-[10px] text-royal-500 dark:text-royal-400">{lastOrder.items?.length} items • {formatPrice(lastOrder.total)} • {lastOrder.date}</p>
                </div>
              </button>
            )}

            {/* Date Picker Mobile */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              <button onClick={() => setOrderDate('tomorrow')}
                className={`shrink-0 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${orderDate === 'tomorrow' ? 'bg-royal-700 text-white shadow' : 'bg-white dark:bg-[#111111] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#222222]'}`}>
                Tomorrow
              </button>
              <div className="relative shrink-0">
                <Calendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input type="date" min={getMinDate()} max={getMaxDate()}
                  value={orderDate === 'tomorrow' ? '' : orderDate}
                  onChange={e => setOrderDate(e.target.value || 'tomorrow')}
                  className={`pl-8 pr-3 py-2 text-xs font-bold rounded-xl border transition-all ${orderDate !== 'tomorrow' ? 'bg-royal-700 text-white border-royal-700' : 'bg-white dark:bg-[#111111] text-gray-500 dark:text-gray-400 border-gray-200 dark:border-[#222222]'}`} />
              </div>
              <span className="shrink-0 text-[10px] text-gray-400 font-medium">Delivery: {getOrderDateStr()}</span>
            </div>

            {/* Product Search */}
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-3 text-gray-400" />
              <input className="w-full pl-10 pr-9 py-3 text-[16px] bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-2xl focus:outline-none focus:border-royal-400 dark:text-white shadow-sm"
                placeholder="Search products..." value={search} onChange={e => setSearch(e.target.value)} />
              {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-200 dark:bg-[#222] rounded-full flex items-center justify-center"><X size={10} className="text-gray-500" /></button>}
            </div>

            {/* Products */}
            <div className="space-y-4">
              {renderProducts(dailyProducts, 'Daily Products', 'from-[#0f172a] to-[#1e293b]')}
              {renderProducts(seasonalProducts, 'Seasonal Products', 'from-amber-500 to-amber-600')}
            </div>

            {/* Cart Bar */}
            <AnimatePresence>
              {cartItems.length > 0 && (
                <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
                  className="fixed bottom-[5.5rem] left-0 right-0 z-40 px-4">
                  <button onClick={placeOrder} disabled={placing}
                    className="w-full max-w-2xl mx-auto flex items-center justify-between py-3.5 px-5 rounded-2xl shadow-float bg-gradient-to-r from-royal-700 via-royal-600 to-mint-700 text-white disabled:opacity-50">
                    <span className="flex items-center gap-2.5">
                      <ShoppingCart size={18} />
                      <span className="bg-white/20 px-2.5 py-1 rounded-lg text-sm font-bold">{cartItems.length}</span>
                      <span className="font-extrabold">{formatPrice(cartTotal)}</span>
                    </span>
                    <div className="flex items-center gap-2">
                      <button onClick={(e) => { e.stopPropagation(); setQuantities({}); }} className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20">
                        <Trash2 size={13} />
                      </button>
                    <span className="text-sm font-bold bg-white/15 px-3.5 py-1.5 rounded-lg">{placing ? 'Saving...' : editingOrder ? 'Update Order' : duplicateOrder ? 'Place Anyway' : 'Place Order'}</span>
                    </div>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
}
