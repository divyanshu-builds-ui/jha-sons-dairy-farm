import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Clock, Phone, MapPin, User, Download, FileText, AlertTriangle, Edit3, Trash2, Save, X, Truck, Package } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, doc, getDoc, updateDoc, collection, query, where, getDocs } from '../../services/firebase';
import { TableSkeleton } from '../../components/LoadingSkeleton';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [retailer, setRetailer] = useState(null);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      try {
        const orderDoc = await getDoc(doc(db, 'orders', id));
        if (!orderDoc.exists()) { navigate('/admin/orders'); return; }
        const orderData = { docId: orderDoc.id, ...orderDoc.data() };
        setOrder(orderData);

        // Fetch retailer details
        if (orderData.phone) {
          const retDoc = await getDoc(doc(db, 'users', orderData.phone));
          if (retDoc.exists()) setRetailer(retDoc.data());
        }

        // Calculate retailer due from ledger (source of truth)
        if (orderData.retailerId) {
          const ledgerSnap = await getDocs(query(collection(db, 'ledger'), where('retailerId', '==', orderData.retailerId)));
          const due = ledgerSnap.docs.reduce((sum, d) => {
            const e = d.data();
            return e.type === 'debit' ? sum + (e.amount || 0) : sum - (e.amount || 0);
          }, 0);
          setBalance(due);
        }
      } catch (err) {}
      setLoading(false);
    }
    fetchOrder();
  }, [id, navigate]);

  const [editMode, setEditMode] = useState(false);
  const [editItems, setEditItems] = useState([]);
  const [saving, setSaving] = useState(false);

  const markDelivered = async () => {
    try {
      await updateDoc(doc(db, 'orders', id), { status: 'Delivered', deliveredAt: new Date().toISOString() });
      setOrder(prev => ({ ...prev, status: 'Delivered' }));
    } catch (err) {}
  };

  const startEdit = () => {
    setEditItems((order.items || []).map(i => ({ ...i })));
    setEditMode(true);
  };

  const updateItemQty = (idx, val) => {
    const num = parseInt(val) || 0;
    setEditItems(prev => {
      const items = [...prev];
      items[idx] = { ...items[idx], qty: `${num} ${items[idx].qty.replace(/[0-9.\s]/g, '').trim()}`, price: num * (items[idx].unitPrice || 0) };
      return items;
    });
  };

  const removeItem = (idx) => {
    setEditItems(prev => prev.filter((_, i) => i !== idx));
  };

  const saveEdit = async () => {
    if (editItems.length === 0) return;
    setSaving(true);
    try {
      const newTotal = editItems.reduce((s, i) => s + (i.price || 0), 0);
      await updateDoc(doc(db, 'orders', id), { items: editItems, total: newTotal, modified: true, modifiedAt: new Date().toISOString(), modifiedBy: 'admin' });
      // Sync to order_history
      const hSnap = await getDocs(query(collection(db, 'order_history'), where('orderId', '==', id)));
      if (!hSnap.empty) await updateDoc(doc(db, 'order_history', hSnap.docs[0].id), { items: editItems, total: newTotal, modified: true, modifiedAt: new Date().toISOString() });
      setOrder(prev => ({ ...prev, items: editItems, total: newTotal, modified: true }));
      setEditMode(false);
    } catch (err) {}
    setSaving(false);
  };

  const downloadInvoice = () => {
    if (!order) return;
  };

  if (loading) return <TableSkeleton />;

  if (!order) return null;

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate('/admin/orders')} className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center hover:bg-gray-200">
          <ArrowLeft size={18} className="text-gray-600" />
        </button>
        <div>
          <p className="text-sm text-gray-400">{order.date} • {order.time}</p>
        </div>
      </div>

      {/* Status Badge */}
      <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${
        order.status === 'Delivered' ? 'bg-mint-50 text-mint-700 border border-mint-200 dark:bg-mint-900/20 dark:text-mint-300 dark:border-mint-800' :
        order.status === 'Dispatched' ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800' :
        order.status === 'Cancelled' ? 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800' :
        'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-800'
      }`}>
        {order.status === 'Delivered' ? <CheckCircle2 size={16} /> : order.status === 'Dispatched' ? <Truck size={16} /> : <Clock size={16} />}
        {order.status}
      </div>

      {/* Order Timeline */}
      <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#222222] p-5">
        <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Order Journey</h3>
        <div className="relative pl-6">
          {/* Vertical line */}
          <div className="absolute left-[9px] top-2 bottom-2 w-0.5 bg-gray-200 dark:bg-[#222222]" />

          {/* Placed */}
          <div className="relative flex items-start gap-3 pb-5">
            <div className="absolute left-[-15px] w-5 h-5 rounded-full bg-royal-600 border-2 border-white dark:border-[#111111] flex items-center justify-center shadow-sm z-10">
              <Package size={10} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-white">Order Placed</p>
              <p className="text-[11px] text-gray-400">{order.time} • {order.date}</p>
              {order.placedBy === 'admin' && <span className="text-[9px] font-bold text-royal-500 bg-royal-50 dark:bg-royal-900/20 px-1.5 py-0.5 rounded mt-0.5 inline-block">By Admin</span>}
            </div>
          </div>

          {/* Confirmed */}
          <div className="relative flex items-start gap-3 pb-5">
            <div className={`absolute left-[-15px] w-5 h-5 rounded-full border-2 border-white dark:border-[#111111] flex items-center justify-center shadow-sm z-10 ${order.status !== 'Cancelled' ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
              <CheckCircle2 size={10} className="text-white" />
            </div>
            <div>
              <p className={`text-sm font-bold ${order.status !== 'Cancelled' ? 'text-gray-800 dark:text-white' : 'text-gray-400'}`}>Confirmed</p>
              <p className="text-[11px] text-gray-400">{order.createdAt ? new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }) : ''}</p>
            </div>
          </div>

          {/* Dispatched */}
          <div className="relative flex items-start gap-3 pb-5">
            <div className={`absolute left-[-15px] w-5 h-5 rounded-full border-2 border-white dark:border-[#111111] flex items-center justify-center shadow-sm z-10 ${order.dispatchedAt || order.status === 'Delivered' ? 'bg-blue-500' : 'bg-gray-200 dark:bg-[#333333]'}`}>
              <Truck size={10} className={order.dispatchedAt || order.status === 'Delivered' ? 'text-white' : 'text-gray-400'} />
            </div>
            <div>
              <p className={`text-sm font-bold ${order.dispatchedAt || order.status === 'Delivered' ? 'text-gray-800 dark:text-white' : 'text-gray-300 dark:text-gray-600'}`}>Dispatched</p>
              {order.dispatchedAt && <p className="text-[11px] text-gray-400">{new Date(order.dispatchedAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}</p>}
              {!order.dispatchedAt && order.status !== 'Delivered' && order.status !== 'Cancelled' && <p className="text-[11px] text-gray-300 dark:text-gray-600">Pending</p>}
            </div>
          </div>

          {/* Delivered */}
          <div className="relative flex items-start gap-3">
            <div className={`absolute left-[-15px] w-5 h-5 rounded-full border-2 border-white dark:border-[#111111] flex items-center justify-center shadow-sm z-10 ${order.status === 'Delivered' ? 'bg-mint-500' : 'bg-gray-200 dark:bg-[#333333]'}`}>
              <CheckCircle2 size={10} className={order.status === 'Delivered' ? 'text-white' : 'text-gray-400'} />
            </div>
            <div>
              <p className={`text-sm font-bold ${order.status === 'Delivered' ? 'text-gray-800 dark:text-white' : 'text-gray-300 dark:text-gray-600'}`}>Delivered</p>
              {order.deliveredAt && <p className="text-[11px] text-gray-400">{new Date(order.deliveredAt).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}</p>}
              {order.status === 'Cancelled' && <p className="text-[11px] text-red-500 font-bold">Order Cancelled</p>}
              {order.status !== 'Delivered' && order.status !== 'Cancelled' && <p className="text-[11px] text-gray-300 dark:text-gray-600">Pending</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Retailer Info */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Retailer Details</h3>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-[#0f172a] to-[#334155] rounded-2xl flex items-center justify-center text-white font-black text-lg">
            {order.retailer?.split(' ').map(n => n[0]).join('')}
          </div>
          <div>
            <p className="font-extrabold text-lg text-gray-800">{order.retailer}</p>
            <p className="text-sm text-gray-400">{retailer?.shop || order.area}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Phone size={14} className="text-gray-400" />
            <div>
              <p className="text-[10px] text-gray-400">Phone</p>
              <p className="text-sm font-semibold text-gray-800">+91 {order.phone}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-gray-400" />
            <div>
              <p className="text-[10px] text-gray-400">Area</p>
              <p className="text-sm font-semibold text-gray-800">{order.area || retailer?.area || '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <User size={14} className="text-gray-400" />
            <div>
              <p className="text-[10px] text-gray-400">Shop</p>
              <p className="text-sm font-semibold text-gray-800">{retailer?.shop || '-'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-gray-400" />
            <div>
              <p className="text-[10px] text-gray-400">Retailer ID</p>
              <p className="text-sm font-semibold text-gray-800">{retailer?.id || '-'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Due Info */}
      {balance > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5 flex items-start gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <AlertTriangle size={18} className="text-red-500" />
          </div>
          <div>
            <p className="text-sm font-bold text-red-700">Outstanding Due</p>
            <p className="text-2xl font-black text-red-600 mt-1">₹{balance.toLocaleString()}</p>
            <p className="text-xs text-red-500 mt-1">This retailer has pending payment</p>
          </div>
        </div>
      )}

      {/* Order Items Table */}
      <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#222222] overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#222222] flex items-center justify-between">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Order Items</h3>
          {!editMode && order.status !== 'Delivered' && order.status !== 'Cancelled' && (
            <button onClick={startEdit} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-royal-600 dark:text-royal-400 bg-royal-50 dark:bg-royal-900/20 rounded-lg border border-royal-100 dark:border-royal-800 hover:bg-royal-100 dark:hover:bg-royal-900/30 transition-colors">
              <Edit3 size={12} /> Edit
            </button>
          )}
        </div>

        {editMode ? (
          <>
            <div className="divide-y divide-gray-100 dark:divide-[#222222]">
              {editItems.map((item, i) => {
                const qty = parseInt(item.qty) || 0;
                return (
                  <div key={i} className="flex items-center gap-3 px-5 py-3">
                    <span className="text-xs text-gray-400 w-5 shrink-0">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white truncate">{item.name}</p>
                      <p className="text-[11px] text-gray-400">₹{item.unitPrice || 0}/unit</p>
                    </div>
                    <input type="number" min="0" value={qty} onChange={e => updateItemQty(i, e.target.value)}
                      className="w-16 h-9 text-center text-sm font-bold border border-gray-200 dark:border-[#333333] dark:bg-[#1a1a1a] dark:text-white rounded-lg focus:border-royal-400 focus:outline-none" />
                    <span className="text-sm font-bold text-gray-700 dark:text-gray-200 w-16 text-right">₹{(qty * (item.unitPrice || 0)).toLocaleString()}</span>
                    <button onClick={() => removeItem(i)} className="w-8 h-8 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/30"><Trash2 size={13} className="text-red-500" /></button>
                  </div>
                );
              })}
            </div>
            <div className="px-5 py-4 bg-gray-50 dark:bg-[#1a1a1a] border-t border-gray-200 dark:border-[#222222] flex items-center justify-between">
              <span className="text-sm font-bold text-gray-600 dark:text-gray-300">New Total: <span className="font-black text-gray-800 dark:text-white">₹{editItems.reduce((s, i) => s + (parseInt(i.qty) || 0) * (i.unitPrice || 0), 0).toLocaleString()}</span></span>
              <div className="flex gap-2">
                <button onClick={() => setEditMode(false)} className="px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#333333] rounded-lg"><X size={12} className="inline mr-1" />Cancel</button>
                <button onClick={saveEdit} disabled={saving || editItems.length === 0} className="px-4 py-2 text-xs font-bold text-white bg-royal-600 rounded-lg shadow disabled:opacity-50"><Save size={12} className="inline mr-1" />{saving ? 'Saving...' : 'Save'}</button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-12 px-5 py-2.5 border-b border-gray-100 dark:border-[#222222] text-[10px] font-bold text-gray-400 uppercase">
              <span className="col-span-1">#</span>
              <span className="col-span-5">Item</span>
              <span className="col-span-2 text-center">Rate</span>
              <span className="col-span-2 text-center">Qty</span>
              <span className="col-span-2 text-right">Amount</span>
            </div>
            <div className="divide-y divide-gray-50 dark:divide-[#1a1a1a]">
              {order.items?.map((item, i) => (
                <div key={i} className="grid grid-cols-12 items-center px-5 py-3.5">
                  <span className="col-span-1 text-sm text-gray-400">{i + 1}</span>
                  <span className="col-span-5 text-sm font-semibold text-gray-800 dark:text-white">{item.name}</span>
                  <span className="col-span-2 text-center text-sm text-gray-500">₹{item.unitPrice || 0}</span>
                  <span className="col-span-2 text-center text-sm font-bold text-royal-700 dark:text-royal-300">{item.qty}</span>
                  <span className="col-span-2 text-right text-sm font-black text-gray-800 dark:text-white">₹{(item.price || 0).toLocaleString()}</span>
                </div>
              ))}
            </div>
            {/* Total */}
            <div className="px-5 py-4 bg-gradient-to-r from-[#0f172a] to-[#1e293b] flex justify-between items-center">
              <div>
                <span className="text-sm text-gray-300 font-semibold">Total Amount</span>
                {order.modified && <span className="ml-2 text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">Modified</span>}
              </div>
              <span className="text-xl font-black text-white">₹{(order.total || 0).toLocaleString()}</span>
            </div>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {order.status === 'Pending' && (
          <motion.button whileTap={{ scale: 0.97 }} onClick={markDelivered}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-mint-600 to-mint-700 shadow-md flex items-center justify-center gap-2">
            <CheckCircle2 size={16} /> Mark as Delivered
          </motion.button>
        )}

        {order.status === 'Delivered' && (
          <motion.button whileTap={{ scale: 0.97 }} onClick={downloadInvoice}
            className="w-full py-3.5 rounded-xl font-bold text-sm text-royal-700 bg-royal-50 border border-royal-200 flex items-center justify-center gap-2 hover:bg-royal-100">
            <Download size={16} /> Download Invoice (PDF)
          </motion.button>
        )}
      </div>
    </div>
  );
}
