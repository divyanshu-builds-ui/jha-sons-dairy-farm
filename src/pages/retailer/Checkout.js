import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, AlertTriangle, Check, ShoppingBag, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatPrice } from '../../utils/price';
import { db, doc, getDoc, collection, addDoc, getDocs, query, where, updateDoc, cachedGetDoc } from '../../services/firebase';
import { useConfirm } from '../../components/ConfirmModal';

// Confetti particle component
function Confetti() {
  const particles = Array.from({ length: 24 }, (_, i) => ({
    id: i,
    x: Math.random() * 300 - 150,
    y: -(Math.random() * 200 + 100),
    rotate: Math.random() * 720 - 360,
    scale: Math.random() * 0.5 + 0.5,
    color: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][i % 6],
    delay: Math.random() * 0.3,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map(p => (
        <motion.div key={p.id}
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1, scale: 0 }}
          animate={{ x: p.x, y: p.y, rotate: p.rotate, opacity: 0, scale: p.scale }}
          transition={{ duration: 1.5, delay: p.delay, ease: 'easeOut' }}
          className="absolute left-1/2 top-1/2 w-3 h-3 rounded-sm"
          style={{ backgroundColor: p.color }}
        />
      ))}
    </div>
  );
}

export default function Checkout() {
  const navigate = useNavigate();
  const confirm = useConfirm();
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(true);
  const [shopPhone, setShopPhone] = useState('9939079107');
  const [monthOrderCount, setMonthOrderCount] = useState(0);
  const [orderClosed, setOrderClosed] = useState(false);
  const [minOrderAmount, setMinOrderAmount] = useState(0);
  const [allowModify, setAllowModify] = useState(true);

  const user = JSON.parse(localStorage.getItem('lg_user') || '{}');
  const cartItems = JSON.parse(localStorage.getItem('lg_cart') || '[]');
  const cartTotal = cartItems.reduce((s, i) => s + (i.price || 0) * i.qty, 0);

  useEffect(() => {
    async function fetchBalance() {
      try {
        // Calculate due from ledger (source of truth)
        const ledgerSnap = await getDocs(query(collection(db, 'ledger'), where('retailerId', '==', user.phone)));
        const entries = ledgerSnap.docs.map(d => d.data());
        const due = entries.reduce((sum, e) => e.type === 'debit' ? sum + (e.amount || 0) : sum - (e.amount || 0), 0);
        setBalance(due);

        const appDoc = await cachedGetDoc(doc(db, 'settings', 'app'), 5 * 60 * 1000);
        if (appDoc.exists()) {
          if (appDoc.data().shopPhone) setShopPhone(appDoc.data().shopPhone);
          if (appDoc.data().minOrderAmount) setMinOrderAmount(appDoc.data().minOrderAmount);
          if (appDoc.data().allowModify !== undefined) setAllowModify(appDoc.data().allowModify);
          const start = appDoc.data().orderStart ?? 12;
          const end = appDoc.data().orderEnd ?? 16;
          if (start !== -1 && end !== -1) {
            const hour = new Date().getHours();
            if (end <= start) {
              setOrderClosed(!(hour >= start || hour < end));
            } else {
              if (hour < start || hour >= end) setOrderClosed(true);
            }
          }
        }
        // Check duplicate order
        const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = tomorrow.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        const dupSnap = await getDocs(query(collection(db, 'orders'), where('phone', '==', user.phone), where('date', '==', tomorrowStr)));
        const existingDocs = dupSnap.docs;
        if (existingDocs.length > 0) {
          const existData = existingDocs[0].data();
          if (existData.status === 'Dispatched' || existData.status === 'Delivered') {
            setDuplicateWarning('dispatched');
          } else if (existData.status === 'Cancelled') {
            setDuplicateWarning('cancelled');
          } else if (existData.status === 'Returned') {
            setDuplicateWarning('returned');
          } else {
            setDuplicateWarning('pending');
          }
        }
      } catch (err) {}
      setCheckingDuplicate(false);
    }
    fetchBalance();
  }, [user.phone]);

  const confirmOrder = async () => {
    if (orderClosed || checkingDuplicate || duplicateWarning) return;
    if (minOrderAmount > 0 && cartTotal < minOrderAmount) return;
    const ok = await confirm({ title: 'Place Order', message: `Confirm order of ${cartItems.length} items for ₹${cartTotal.toLocaleString()}?`, confirmText: 'Place Order', type: 'warning' });
    if (!ok) return;
    setLoading(true);
    try {
      const orderItems = cartItems.map(i => ({ name: i.name, qty: `${i.qty} ${i.unit}`, price: (i.price || 0) * i.qty, unitPrice: i.price || 0 }));

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const orderData = {
        retailerId: user.phone,
        retailer: user.name,
        phone: user.phone,
        area: user.area || '',
        items: orderItems,
        total: cartTotal,
        status: 'Confirmed',
        date: tomorrow.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        time: new Date().toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }),
        orderedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      // Save to active orders
      const orderRef = await addDoc(collection(db, 'orders'), orderData);

      // Save permanent snapshot to order_history
      await addDoc(collection(db, 'order_history'), {
        ...orderData,
        orderId: orderRef.id,
        historyCreatedAt: new Date().toISOString(),
      });

      localStorage.removeItem('lg_cart');
      setSuccess(true);
      setTimeout(() => navigate('/track'), 3000);
    } catch (err) {
      setError('Order failed! Check your internet and try again.');
      setLoading(false);
      return;
    }
    setLoading(false);
  };

  if (cartItems.length === 0 && !success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
        <ShoppingBag size={48} className="text-gray-200 dark:text-[#444444] mb-4" />
        <p className="text-lg font-bold text-gray-500 dark:text-gray-400">No items in cart</p>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Add products to place an order</p>
        <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/order')}
          className="mt-6 px-8 py-3 bg-royal-700 text-white text-sm font-bold rounded-2xl shadow-md">
          ← Go to Order Page
        </motion.button>
      </div>
    );
  }

  return (
    <div className="pb-28 max-w-3xl mx-auto space-y-5">
      {/* Success */}
      <AnimatePresence>
        {success && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 bg-gradient-to-br from-royal-900 via-royal-800 to-royal-700 flex flex-col items-center justify-center text-center p-6">
            {/* Confetti */}
            <Confetti />

            {/* Pulse rings */}
            <motion.div className="absolute w-40 h-40 rounded-full border-2 border-mint-400/30"
              animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5 }} />
            <motion.div className="absolute w-40 h-40 rounded-full border-2 border-mint-400/20"
              animate={{ scale: [1, 3], opacity: [0.3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 0.5, delay: 0.3 }} />

            <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', delay: 0.2, stiffness: 200 }}
              className="relative w-24 h-24 bg-mint-500/20 rounded-3xl flex items-center justify-center mb-6 border border-mint-400/30">
              <Check size={48} className="text-mint-400" strokeWidth={3} />
            </motion.div>
            <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="text-3xl font-black text-white relative z-10">Order Placed!</motion.h2>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
              className="text-base text-royal-200 mt-3 relative z-10">Your order has been sent to Lucy Garden</motion.p>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
              className="text-sm text-royal-300 mt-1 relative z-10">Delivery tomorrow morning</motion.p>
            {monthOrderCount > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}
                className="mt-5 px-4 py-2 bg-white/10 rounded-xl border border-white/20 relative z-10">
                <p className="text-sm font-bold text-white/80">Order #{monthOrderCount + 1} this month! Keep going</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center gap-3">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate('/order')}
          className="w-10 h-10 bg-gray-100 dark:bg-[#111111] rounded-xl flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#1a1a1a]">
          <ArrowLeft size={18} className="text-gray-600 dark:text-gray-300" />
        </motion.button>
        <div>
          <h2 className="text-xl font-extrabold text-gray-800 dark:text-white">Checkout</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500">Review your order before placing</p>
        </div>
      </div>

      {/* Items List */}
      <div className="card !p-0 overflow-hidden">
        <div className="px-5 py-3 bg-gradient-to-r from-[#0f172a] to-[#1e293b] flex items-center justify-between">
          <p className="text-sm font-bold text-white">Order Items</p>
          <p className="text-xs text-gray-400">{cartItems.length} items</p>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {cartItems.map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}
              className="px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-8 h-8 bg-royal-50 dark:bg-royal-900/30 rounded-lg flex items-center justify-center text-xs font-bold text-royal-600 dark:text-royal-300 shrink-0">
                  {i + 1}
                </div>
                <div className="min-w-0">
                  <p className="text-[15px] font-bold text-gray-800 dark:text-white truncate">{item.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{formatPrice(item.price)} × {item.qty}</p>
                </div>
              </div>
              <p className="text-base font-extrabold text-gray-800 dark:text-white shrink-0 ml-3">{formatPrice(item.price * item.qty)}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bill Summary */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="card">
        <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Bill Summary</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600 dark:text-gray-300">Order Total ({cartItems.length} items)</span>
            <span className="text-base font-bold text-gray-800 dark:text-white">{formatPrice(cartTotal)}</span>
          </div>
          {balance > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-red-500">Previous Due</span>
              <span className="text-base font-bold text-red-500">+ {formatPrice(balance)}</span>
            </div>
          )}
          {balance === 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500 dark:text-gray-400">Previous Due</span>
              <span className="text-sm font-bold text-mint-600">₹0</span>
            </div>
          )}
          <div className="border-t border-dashed border-gray-200 dark:border-[#333333] my-3"></div>
          <div className="flex justify-between items-center bg-gray-50 dark:bg-[#1a1a1a]/50 -mx-5 px-5 py-4 -mb-5 rounded-b-2xl">
            <span className="text-base font-extrabold text-gray-800 dark:text-white">Total Due</span>
            <span className={`text-2xl font-black ${balance > 0 ? 'text-red-600' : 'text-gray-800 dark:text-white'}`}>{formatPrice(cartTotal + balance)}</span>
          </div>
        </div>
      </motion.div>

      {/* Duplicate Order Warning */}
      {duplicateWarning && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className={"rounded-2xl p-5 text-center border " + (duplicateWarning === 'pending' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800')}>
          <AlertTriangle size={28} className={duplicateWarning === 'pending' ? 'text-amber-500 mx-auto mb-3' : 'text-red-500 mx-auto mb-3'} />
          {duplicateWarning === 'dispatched' && (
            <>
              <p className="text-sm font-bold text-red-700 dark:text-red-400">Order already dispatched</p>
              <p className="text-[11px] text-gray-500 mt-2">Cannot modify. Contact admin for changes.</p>
              <a href={`tel:+91${shopPhone}`} className="inline-block mt-4 px-5 py-2.5 bg-gray-200 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl">Call Lucy Garden</a>
            </>
          )}

          {duplicateWarning === 'pending' && (
            <>
              <p className="text-sm font-bold text-amber-700 dark:text-amber-400">You already have an order for tomorrow</p>
              {allowModify ? (
                <>
                  <div className="mt-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3 py-2">
                    <p className="text-xs font-bold text-red-700 dark:text-red-400"><AlertTriangle size={12} className="inline text-amber-500" /> Your previous order will be completely removed and replaced with this new order. You will need to add ALL items again.</p>
                  </div>
                  <div className="flex gap-2 justify-center mt-4">
                <motion.button whileTap={{ scale: 0.95 }} onClick={async () => {
                  const ok = await confirm({ title: 'Replace Order', message: 'This will REPLACE your existing order with these new items. Old items will be removed.', confirmText: 'Replace Order', type: 'warning' });
                  if (!ok) return;
                  setLoading(true);
                  try {
                    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
                    const tomorrowStr = tomorrow.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                    const ordSnap = await getDocs(query(collection(db, 'orders'), where('phone', '==', user.phone), where('date', '==', tomorrowStr)));
                    const existingDoc = ordSnap.docs.find(d => d.data().status !== 'Cancelled' && d.data().status !== 'Returned');
                    if (existingDoc) {
                      const newItems = cartItems.map(i => ({ name: i.name, qty: `${i.qty} ${i.unit}`, price: (i.price || 0) * i.qty, unitPrice: i.price || 0 }));
                      await updateDoc(doc(db, 'orders', existingDoc.id), { items: newItems, total: cartTotal, modified: true, modifiedAt: new Date().toISOString() });
                      // Sync to order_history
                      const hSnap = await getDocs(query(collection(db, 'order_history'), where('orderId', '==', existingDoc.id)));
                      if (!hSnap.empty) await updateDoc(doc(db, 'order_history', hSnap.docs[0].id), { items: newItems, total: cartTotal, modified: true, modifiedAt: new Date().toISOString() });
                      localStorage.removeItem('lg_cart');
                      setSuccess(true);
                      setTimeout(() => navigate('/track'), 3000);
                    }
                  } catch (err) {}
                  setLoading(false);
                }} disabled={loading} className="px-5 py-2.5 bg-amber-600 text-white text-xs font-bold rounded-xl shadow-md disabled:opacity-50">
                  {loading ? 'Replacing...' : 'Replace Order'}
                </motion.button>
                <a href={`tel:+91${shopPhone}`} className="px-5 py-2.5 bg-gray-200 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl">Call Admin</a>
              </div>
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-500 mt-3">Order modification is disabled. Contact admin for changes.</p>
                  <a href={`tel:+91${shopPhone}`} className="inline-block mt-3 px-5 py-2.5 bg-gray-200 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl">Call Lucy Garden</a>
                </>
              )}
            </>
          )}
          {duplicateWarning === 'cancelled' && (
            <>
              <p className="text-sm font-bold text-red-700 dark:text-red-400">Order was cancelled</p>
              <p className="text-[11px] text-gray-500 mt-2">Your order for tomorrow has been cancelled. You cannot place a new order for the same date. Contact admin if needed.</p>
              <a href={`tel:+91${shopPhone}`} className="inline-block mt-4 px-5 py-2.5 bg-gray-200 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl">Call Lucy Garden</a>
            </>
          )}
          {duplicateWarning === 'returned' && (
            <>
              <p className="text-sm font-bold text-red-700 dark:text-red-400">Order was returned</p>
              <p className="text-[11px] text-gray-500 mt-2">Your order for tomorrow was marked as returned. Contact admin if you need to place a new order.</p>
              <a href={`tel:+91${shopPhone}`} className="inline-block mt-4 px-5 py-2.5 bg-gray-200 dark:bg-[#1a1a1a] text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl">Call Lucy Garden</a>
            </>
          )}
        </motion.div>
      )}

      {/* Due Warning */}
      {balance > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 dark:text-red-400">You have {formatPrice(balance)} pending. Please clear your dues soon.</p>
        </motion.div>
      )}

      {/* Min Order Amount Warning */}
      {minOrderAmount > 0 && cartTotal < minOrderAmount && !duplicateWarning && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3 text-center">
          <p className="text-sm font-bold text-amber-700 dark:text-amber-300">Minimum order amount is {formatPrice(minOrderAmount)}</p>
          <p className="text-xs text-amber-500 dark:text-amber-400 mt-1">Add {formatPrice(minOrderAmount - cartTotal)} more to place order</p>
        </motion.div>
      )}

      {/* Place Order Button */}
      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium text-center flex items-center justify-center gap-1"><AlertTriangle size={12} className="text-amber-500" /> Prices may change without notice</p>
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl px-4 py-3 text-center mb-3">
          <p className="text-sm font-bold text-red-700 dark:text-red-300">{error}</p>
          <button onClick={() => setError('')} className="text-xs text-red-500 underline mt-1">Dismiss</button>
        </div>
      )}
      {orderClosed && !duplicateWarning && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl px-4 py-3 text-center mb-3">
          <p className="text-sm font-bold text-red-700 dark:text-red-300"><Clock size={12} className="inline" /> Order window closed</p>
          <p className="text-xs text-red-500 dark:text-red-400 mt-1">You cannot place orders at this time.</p>
        </div>
      )}
      {!duplicateWarning && (
      <motion.button whileTap={{ scale: 0.97 }} onClick={confirmOrder} disabled={loading || orderClosed || checkingDuplicate || (minOrderAmount > 0 && cartTotal < minOrderAmount)}
        className="w-full py-4.5 rounded-2xl text-lg font-bold bg-gradient-to-r from-royal-700 via-royal-600 to-mint-700 text-white shadow-xl shadow-royal-600/25 disabled:opacity-50 active:shadow-md transition-shadow"
        style={{ paddingTop: '18px', paddingBottom: '18px' }}>
        {loading ? (
          <span className="flex items-center justify-center gap-3">
            <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
            Placing Order...
          </span>
        ) : (
          <span className="flex items-center justify-center gap-2">
            Place Order • {formatPrice(cartTotal)}
          </span>
        )}
      </motion.button>
      )}
    </div>
  );
}
