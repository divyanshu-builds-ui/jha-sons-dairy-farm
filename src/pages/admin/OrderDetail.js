import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Clock, Phone, MapPin, User, Download, FileText, AlertTriangle } from 'lucide-react';
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

        // Fetch retailer balance
        if (orderData.retailerId) {
          const balDoc = await getDoc(doc(db, 'retailer_balances', orderData.retailerId));
          if (balDoc.exists()) setBalance(balDoc.data().balance || 0);
        }
      } catch (err) {}
      setLoading(false);
    }
    fetchOrder();
  }, [id, navigate]);

  const markDelivered = async () => {
    try {
      await updateDoc(doc(db, 'orders', id), { status: 'Delivered', deliveredAt: new Date().toISOString() });
      setOrder(prev => ({ ...prev, status: 'Delivered' }));
    } catch (err) {}
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
        order.status === 'Delivered' ? 'bg-mint-50 text-mint-700 border border-mint-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
      }`}>
        {order.status === 'Delivered' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
        {order.status}
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
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#1a1a1a]">
          <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Order Items</h3>
        </div>
        <div className="grid grid-cols-12 px-5 py-2.5 border-b border-gray-100 text-[10px] font-bold text-gray-400 uppercase">
          <span className="col-span-1">#</span>
          <span className="col-span-5">Item</span>
          <span className="col-span-2 text-center">Rate</span>
          <span className="col-span-2 text-center">Qty</span>
          <span className="col-span-2 text-right">Amount</span>
        </div>
        <div className="divide-y divide-gray-50">
          {order.items?.map((item, i) => (
            <div key={i} className="grid grid-cols-12 items-center px-5 py-3.5">
              <span className="col-span-1 text-sm text-gray-400">{i + 1}</span>
              <span className="col-span-5 text-sm font-semibold text-gray-800">{item.name}</span>
              <span className="col-span-2 text-center text-sm text-gray-500">₹{item.unitPrice || 0}</span>
              <span className="col-span-2 text-center text-sm font-bold text-royal-700">{item.qty}</span>
              <span className="col-span-2 text-right text-sm font-black text-gray-800">₹{(item.price || 0).toLocaleString()}</span>
            </div>
          ))}
        </div>
        {/* Total */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#0f172a] to-[#1e293b] flex justify-between items-center">
          <span className="text-sm text-gray-300 font-semibold">Total Amount</span>
          <span className="text-xl font-black text-white">₹{(order.total || 0).toLocaleString()}</span>
        </div>
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
