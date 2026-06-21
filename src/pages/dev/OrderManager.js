import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, RefreshCw, Package, ArrowRight, Eye, XCircle, RotateCcw, CheckCircle2 } from 'lucide-react';
import { db, collection, getDocs, updateDoc, doc, query, where } from '../../services/firebase';
import { useConfirm } from '../../components/ConfirmModal';

export default function OrderManager() {
  const [phone, setPhone] = useState('');
  const [dateVal, setDateVal] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [rawModal, setRawModal] = useState(null);
  const [toast, setToast] = useState('');
  const confirm = useConfirm();

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  const search = async () => {
    setLoading(true);
    try {
      let snap;
      if (phone && dateVal) {
        const dateStr = new Date(dateVal + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        snap = await getDocs(query(collection(db, 'orders'), where('phone', '==', phone), where('date', '==', dateStr)));
      } else if (phone) {
        snap = await getDocs(query(collection(db, 'orders'), where('phone', '==', phone)));
      } else if (dateVal) {
        const dateStr = new Date(dateVal + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        snap = await getDocs(query(collection(db, 'orders'), where('date', '==', dateStr)));
      } else {
        flash('Enter phone or date'); setLoading(false); return;
      }
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setOrders(list);
    } catch (e) { flash('Error: ' + e.message); }
    setLoading(false);
  };

  const searchByStatus = async (status) => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'orders'), where('status', '==', status)));
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setOrders(list);
    } catch (e) { flash('Error: ' + e.message); }
    setLoading(false);
  };

  const changeStatus = async (orderId, newStatus, cleanup = {}) => {
    const ok = await confirm({ title: `Change to ${newStatus}`, message: `Set order status to "${newStatus}"?`, confirmText: 'Confirm', type: newStatus === 'Cancelled' ? 'danger' : 'warning' });
    if (!ok) return;
    try {
      const update = { status: newStatus, ...cleanup };
      await updateDoc(doc(db, 'orders', orderId), update);
      const hSnap = await getDocs(query(collection(db, 'order_history'), where('orderId', '==', orderId)));
      if (!hSnap.empty) await updateDoc(doc(db, 'order_history', hSnap.docs[0].id), update);
      flash(`→ ${newStatus}`);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (e) { flash('Failed: ' + e.message); }
  };

  const statusColor = { Pending: 'amber', Confirmed: 'blue', Dispatched: 'royal', Delivered: 'mint', Cancelled: 'red', Returned: 'amber' };

  return (
    <div className="space-y-4 pb-10">
      {toast && <div className="fixed top-20 left-4 right-4 lg:left-1/2 lg:-translate-x-1/2 lg:w-auto z-[100] px-4 py-2.5 rounded-xl bg-green-900/80 border border-green-700 text-green-200 text-sm font-bold text-center">{toast}</div>}

      <div className="flex items-center justify-between">
        <h2 className="text-base font-extrabold text-white">Order Manager</h2>
      </div>

      {/* Search */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number..."
            className="py-2.5 px-3 text-sm bg-black border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-600" />
          <input type="date" value={dateVal} onChange={e => setDateVal(e.target.value)}
            className="py-2.5 px-3 text-sm bg-black border border-gray-700 rounded-xl text-white focus:outline-none focus:border-green-600" />
        </div>
        <div className="flex gap-2">
          <motion.button whileTap={{ scale: 0.95 }} onClick={search}
            className="flex-1 py-2.5 bg-green-600 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
            <Search size={13} /> Search
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => searchByStatus('Pending')}
            className="px-3 py-2.5 bg-amber-900/30 border border-amber-700/40 text-amber-400 text-xs font-bold rounded-xl">Pending</motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => searchByStatus('Cancelled')}
            className="px-3 py-2.5 bg-red-900/30 border border-red-700/40 text-red-400 text-xs font-bold rounded-xl">Cancelled</motion.button>
        </div>
      </div>

      {/* Results */}
      {loading && <div className="text-center py-8 text-gray-500 text-sm">Loading...</div>}

      {!loading && orders.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-bold text-gray-500">{orders.length} orders found</p>
          {orders.map(o => {
            const color = statusColor[o.status] || 'blue';
            const items = (o.items || []).map(i => `${i.name} x${i.qty}`).join(', ');
            return (
              <div key={o.id} className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-sm font-bold text-white">{o.retailer || o.phone}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md bg-${color}-900/30 text-${color}-400 border border-${color}-700/30`}>{o.status}</span>
                  <span className="text-[10px] text-gray-500 ml-auto">{o.date}</span>
                </div>
                <p className="text-xs text-gray-400 mb-1">{o.phone} • ₹{(o.total || 0).toFixed(2)}</p>
                <p className="text-[11px] text-gray-600 mb-3 truncate">{items}</p>

                <div className="flex flex-wrap gap-1.5">
                  {o.status === 'Cancelled' && (
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => changeStatus(o.id, 'Confirmed', { cancelledAt: null, cancelledBy: null })}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-green-900/30 border border-green-700/40 text-green-400 text-[10px] font-bold rounded-lg">
                      <CheckCircle2 size={11} /> → Confirmed
                    </motion.button>
                  )}
                  {(o.status === 'Pending' || o.status === 'Confirmed') && (
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => changeStatus(o.id, 'Cancelled', { cancelledAt: new Date().toISOString(), cancelledBy: 'developer' })}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-red-900/30 border border-red-700/40 text-red-400 text-[10px] font-bold rounded-lg">
                      <XCircle size={11} /> Cancel
                    </motion.button>
                  )}
                  {o.status === 'Dispatched' && (
                    <>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => changeStatus(o.id, 'Confirmed', { dispatchedAt: null, actualItems: null, actualTotal: null })}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-800 border border-gray-700 text-gray-300 text-[10px] font-bold rounded-lg">
                        <RotateCcw size={11} /> Undo → Confirmed
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => changeStatus(o.id, 'Returned', { returnedAt: new Date().toISOString() })}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-900/30 border border-amber-700/40 text-amber-400 text-[10px] font-bold rounded-lg">
                        <RotateCcw size={11} /> Return
                      </motion.button>
                    </>
                  )}
                  {o.status === 'Returned' && (
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => changeStatus(o.id, 'Dispatched', { returnedAt: null })}
                      className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-900/30 border border-blue-700/40 text-blue-400 text-[10px] font-bold rounded-lg">
                      <ArrowRight size={11} /> → Dispatched
                    </motion.button>
                  )}
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setRawModal(o)}
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-gray-800 border border-gray-700 text-gray-400 text-[10px] font-bold rounded-lg">
                    <Eye size={11} /> Raw
                  </motion.button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!loading && orders.length === 0 && phone === '' && dateVal === '' && (
        <div className="text-center py-12 text-gray-600 text-sm">Search by phone, date, or status</div>
      )}

      {/* Raw JSON Modal */}
      {rawModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4" onClick={() => setRawModal(null)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-5 w-full max-w-lg max-h-[70vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white">Order: {rawModal.id}</h3>
              <button onClick={() => setRawModal(null)} className="text-gray-500 hover:text-white text-xs">Close</button>
            </div>
            <pre className="text-[10px] text-green-400 font-mono bg-black rounded-xl p-3 overflow-auto whitespace-pre-wrap">
              {JSON.stringify(rawModal, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
