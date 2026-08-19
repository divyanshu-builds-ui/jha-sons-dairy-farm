import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Package, Calendar, Download, Clock, CircleCheckBig, TruckIcon, XCircle } from 'lucide-react';
import { db, collection, doc, getDoc, updateDoc, deleteDoc, query, where } from '../../services/firebase';
import { onSnapshot } from 'firebase/firestore';
import { formatPrice } from '../../utils/price';
import { jsPDF } from 'jspdf';
import { registerHindiFont, setFont, hasHindi, drawText } from '../../utils/pdfHelper';
import { TableSkeleton } from '../../components/LoadingSkeleton';
import { useConfirm } from '../../components/ConfirmModal';



function downloadDispatchSlipPDF(order, user, shopPhone) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const w = pdf.internal.pageSize.getWidth();
  const m = 15;
  let y = m;
  const items = order.actualItems || order.items || [];
  const total = order.actualTotal || order.total || 0;

  // Blue header band (royal-700: #0136e4)
  pdf.setFillColor(1, 54, 228); pdf.rect(0, 0, w, 32, 'F');
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(18); pdf.setTextColor(255, 255, 255);
  pdf.text('LUCY GARDEN', w / 2, 12, { align: 'center' });
  pdf.setFontSize(9); pdf.setFont('helvetica', 'normal');
  pdf.text(`Fresh Dairy Supply | Ph: ${shopPhone}`, w / 2, 19, { align: 'center' });
  pdf.setFontSize(11); pdf.setFont('helvetica', 'bold');
  pdf.text('DISPATCH SLIP', w / 2, 28, { align: 'center' });
  y = 40;

  // Status badge
  pdf.setFillColor(238, 242, 255); pdf.roundedRect(w / 2 - 22, y, 44, 8, 2, 2, 'F');
  pdf.setFontSize(8); pdf.setTextColor(1, 54, 228); pdf.setFont('helvetica', 'bold');
  pdf.text('ON THE WAY', w / 2, y + 5.5, { align: 'center' });
  y += 14; pdf.setTextColor(0, 0, 0);

  // Date & time row
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
  pdf.text(`Date: ${order.date}`, m, y); pdf.text(`Time: ${order.time || '-'}`, w - m, y, { align: 'right' }); y += 10;

  // Customer box
  pdf.setDrawColor(1, 54, 228); pdf.setLineWidth(0.4); pdf.roundedRect(m, y, w - m * 2, 20, 2, 2, 'S');
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.text('Deliver To:', m + 4, y + 7);
  drawText(pdf, user.name || '-', m + 30, y + 7, { bold: true, size: 11 });
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9);
  pdf.text(`Ph: ${user.phone || ''}`, m + 4, y + 14);
  if (user.shop) pdf.text(`Shop: ${user.shop}`, m + 70, y + 14);
  y += 26;

  // Items table
  const tW = w - m * 2; const cols = { num: 10, name: tW - 10 - 25 - 30 - 30, qty: 25, rate: 30, amt: 30 }; const rowH = 8;
  pdf.setFillColor(1, 54, 228); pdf.rect(m, y, tW, rowH, 'F');
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(255, 255, 255); let cx = m;
  pdf.text('#', cx + cols.num / 2, y + 5.5, { align: 'center' }); cx += cols.num;
  pdf.text('Item', cx + 4, y + 5.5); cx += cols.name;
  pdf.text('Qty', cx + cols.qty / 2, y + 5.5, { align: 'center' }); cx += cols.qty;
  pdf.text('Rate', cx + cols.rate / 2, y + 5.5, { align: 'center' }); cx += cols.rate;
  pdf.text('Amt', cx + cols.amt / 2, y + 5.5, { align: 'center' }); y += rowH;
  pdf.setTextColor(0, 0, 0);

  items.forEach((item, idx) => {
    if (y + rowH > 270) {
      pdf.addPage(); y = m;
      pdf.setFillColor(1, 54, 228); pdf.rect(m, y, tW, rowH, 'F');
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(255, 255, 255); cx = m;
      pdf.text('#', cx + cols.num / 2, y + 5.5, { align: 'center' }); cx += cols.num;
      pdf.text('Item', cx + 4, y + 5.5); cx += cols.name;
      pdf.text('Qty', cx + cols.qty / 2, y + 5.5, { align: 'center' }); cx += cols.qty;
      pdf.text('Rate', cx + cols.rate / 2, y + 5.5, { align: 'center' }); cx += cols.rate;
      pdf.text('Amt', cx + cols.amt / 2, y + 5.5, { align: 'center' }); y += rowH;
      pdf.setTextColor(0, 0, 0);
    }
    pdf.setFillColor(idx % 2 === 0 ? 238 : 214, idx % 2 === 0 ? 242 : 226, 255);
    pdf.rect(m, y, tW, rowH, 'F'); cx = m;
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8);
    pdf.text(`${idx + 1}`, cx + cols.num / 2, y + 5.5, { align: 'center' }); cx += cols.num;
    drawText(pdf, item.name || '', cx + 4, y + 5.5, { bold: true, size: 9 }); cx += cols.name;
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8);
    const qty = item.actual || item.qty; pdf.text(`${qty}`, cx + cols.qty / 2, y + 5.5, { align: 'center' }); cx += cols.qty;
    const rate = item.unitPrice || 0; pdf.text(rate > 0 ? `${rate.toFixed(2)}` : '-', cx + cols.rate / 2, y + 5.5, { align: 'center' }); cx += cols.rate;
    const amt = (parseFloat(String(qty).replace(/[^0-9.]/g, '')) || 0) * rate;
    pdf.setFont('helvetica', 'bold'); pdf.text(amt > 0 ? `${amt.toFixed(2)}` : '-', cx + cols.amt / 2, y + 5.5, { align: 'center' }); y += rowH;
  });

  // Total row
  if (y + 10 > 270) { pdf.addPage(); y = m; }
  pdf.setFillColor(1, 54, 228); pdf.rect(m, y, tW, 10, 'F');
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.setTextColor(255, 255, 255);
  pdf.text('TOTAL', m + cols.num + 4, y + 7); pdf.text(`Rs. ${total.toFixed(2)}`, m + tW - 4, y + 7, { align: 'right' });
  y += 16; pdf.setTextColor(0);

  // Note
  if (y + 10 > 280) { pdf.addPage(); y = m; }
  pdf.setFontSize(8); pdf.setFont('helvetica', 'italic'); pdf.setTextColor(100);
  pdf.text('* Quantities may be adjusted upon delivery. Final invoice will be generated after delivery.', m, y);
  y += 10;

  // Footer
  const fY = Math.max(y + 5, 275);
  pdf.setFontSize(7); pdf.setTextColor(150);
  pdf.text('Lucy Garden | Fresh Dairy Supply', w / 2, fY, { align: 'center' });
  pdf.setFontSize(6); pdf.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`, w / 2, fY + 5, { align: 'center' });
  pdf.save(`LG_DispatchSlip_${order.date?.replace(/[\s,]/g, '')}_${(user.name || 'order').replace(/\s/g, '_')}.pdf`);
}

function downloadInvoicePDF(order, user, shopPhone) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const w = pdf.internal.pageSize.getWidth();
  const m = 15;
  let y = m;
  const items = order.actualItems || order.items || [];
  const total = order.actualTotal || order.total || 0;

  // Green header band (mint-700: #17a966)
  pdf.setFillColor(23, 169, 102); pdf.rect(0, 0, w, 32, 'F');
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(18); pdf.setTextColor(255, 255, 255);
  pdf.text('LUCY GARDEN', w / 2, 12, { align: 'center' });
  pdf.setFontSize(9); pdf.setFont('helvetica', 'normal');
  pdf.text(`Fresh Dairy Supply | Ph: ${shopPhone}`, w / 2, 19, { align: 'center' });
  pdf.setFontSize(11); pdf.setFont('helvetica', 'bold');
  pdf.text('FINAL INVOICE', w / 2, 28, { align: 'center' });
  y = 40;

  // Delivered badge
  pdf.setFillColor(237, 253, 245); pdf.roundedRect(w / 2 - 20, y, 40, 8, 2, 2, 'F');
  pdf.setFontSize(8); pdf.setTextColor(10, 107, 63); pdf.setFont('helvetica', 'bold');
  pdf.text('DELIVERED', w / 2, y + 5.5, { align: 'center' });
  y += 14; pdf.setTextColor(0, 0, 0);

  // Date, time & delivery time
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
  pdf.text(`Date: ${order.date}`, m, y);
  if (order.deliveredAt) {
    pdf.text(`Delivered: ${new Date(order.deliveredAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`, w - m, y, { align: 'right' });
  } else {
    pdf.text(`Time: ${order.time || '-'}`, w - m, y, { align: 'right' });
  }
  y += 10;

  // Customer box
  pdf.setDrawColor(23, 169, 102); pdf.setLineWidth(0.4); pdf.roundedRect(m, y, w - m * 2, 20, 2, 2, 'S');
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.text('Bill To:', m + 4, y + 7);
  drawText(pdf, user.name || '-', m + 22, y + 7, { bold: true, size: 11 });
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9);
  pdf.text(`Ph: ${user.phone || ''}`, m + 4, y + 14);
  if (user.shop) pdf.text(`Shop: ${user.shop}`, m + 70, y + 14);
  y += 26;

  // Items table
  const tW = w - m * 2; const cols = { num: 10, name: tW - 10 - 25 - 30 - 30, qty: 25, rate: 30, amt: 30 }; const rowH = 8;
  pdf.setFillColor(23, 169, 102); pdf.rect(m, y, tW, rowH, 'F');
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(255, 255, 255); let cx = m;
  pdf.text('#', cx + cols.num / 2, y + 5.5, { align: 'center' }); cx += cols.num;
  pdf.text('Item', cx + 4, y + 5.5); cx += cols.name;
  pdf.text('Qty', cx + cols.qty / 2, y + 5.5, { align: 'center' }); cx += cols.qty;
  pdf.text('Rate', cx + cols.rate / 2, y + 5.5, { align: 'center' }); cx += cols.rate;
  pdf.text('Amt', cx + cols.amt / 2, y + 5.5, { align: 'center' }); y += rowH;
  pdf.setTextColor(0, 0, 0);

  items.forEach((item, idx) => {
    if (y + rowH > 270) {
      pdf.addPage(); y = m;
      pdf.setFillColor(23, 169, 102); pdf.rect(m, y, tW, rowH, 'F');
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(255, 255, 255); cx = m;
      pdf.text('#', cx + cols.num / 2, y + 5.5, { align: 'center' }); cx += cols.num;
      pdf.text('Item', cx + 4, y + 5.5); cx += cols.name;
      pdf.text('Qty', cx + cols.qty / 2, y + 5.5, { align: 'center' }); cx += cols.qty;
      pdf.text('Rate', cx + cols.rate / 2, y + 5.5, { align: 'center' }); cx += cols.rate;
      pdf.text('Amt', cx + cols.amt / 2, y + 5.5, { align: 'center' }); y += rowH;
      pdf.setTextColor(0, 0, 0);
    }
    pdf.setFillColor(idx % 2 === 0 ? 237 : 214, idx % 2 === 0 ? 253 : 250, idx % 2 === 0 ? 245 : 235);
    pdf.rect(m, y, tW, rowH, 'F'); cx = m;
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8);
    pdf.text(`${idx + 1}`, cx + cols.num / 2, y + 5.5, { align: 'center' }); cx += cols.num;
    drawText(pdf, item.name || '', cx + 4, y + 5.5, { bold: true, size: 9 }); cx += cols.name;
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8);
    const qty = item.actual || item.qty; pdf.text(`${qty}`, cx + cols.qty / 2, y + 5.5, { align: 'center' }); cx += cols.qty;
    const rate = item.unitPrice || 0; pdf.text(rate > 0 ? `${rate.toFixed(2)}` : '-', cx + cols.rate / 2, y + 5.5, { align: 'center' }); cx += cols.rate;
    const amt = (parseFloat(String(qty).replace(/[^0-9.]/g, '')) || 0) * rate;
    pdf.setFont('helvetica', 'bold'); pdf.text(amt > 0 ? `${amt.toFixed(2)}` : '-', cx + cols.amt / 2, y + 5.5, { align: 'center' }); y += rowH;
  });

  // Total row
  if (y + 10 > 270) { pdf.addPage(); y = m; }
  pdf.setFillColor(23, 169, 102); pdf.rect(m, y, tW, 10, 'F');
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.setTextColor(255, 255, 255);
  pdf.text('TOTAL', m + cols.num + 4, y + 7); pdf.text(`Rs. ${total.toFixed(2)}`, m + tW - 4, y + 7, { align: 'right' });
  y += 16; pdf.setTextColor(0);

  // Thank you note
  if (y + 10 > 280) { pdf.addPage(); y = m; }
  pdf.setFontSize(9); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(10, 107, 63);
  pdf.text('Thank you for your order!', w / 2, y, { align: 'center' });
  y += 10;

  // Footer
  const fY = Math.max(y + 5, 275);
  pdf.setFontSize(7); pdf.setTextColor(150);
  pdf.text('Lucy Garden | Fresh Dairy Supply', w / 2, fY, { align: 'center' });
  pdf.setFontSize(6); pdf.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`, w / 2, fY + 5, { align: 'center' });
  pdf.save(`LG_Invoice_${order.date?.replace(/[\s,]/g, '')}_${(user.name || 'order').replace(/\s/g, '_')}.pdf`);
}

// Animated Progress Timeline
function OrderTimeline({ status, deliveryWindow }) {
  const steps = ['Confirmed', 'Dispatched', 'Delivered'];
  const currentIdx = steps.indexOf(status === 'In Transit' ? 'Dispatched' : status === 'Pending' ? 'Confirmed' : status);
  const icons = [CircleCheckBig, TruckIcon, CircleCheckBig];
  const labels = ['Order Confirmed', 'Dispatched', 'Delivered'];

  return (
    <div className="card !p-5">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order Progress</p>
        {status === 'Dispatched' && (
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">
            <TruckIcon size={11} className="inline" /> Est. delivery: {deliveryWindow.start === -1 ? 'Anytime' : `${deliveryWindow.start > 12 ? deliveryWindow.start - 12 : deliveryWindow.start} ${deliveryWindow.start >= 12 ? 'PM' : 'AM'} - ${deliveryWindow.end > 12 ? deliveryWindow.end - 12 : deliveryWindow.end} ${deliveryWindow.end >= 12 ? 'PM' : 'AM'}`}
          </span>
        )}
        {(status === 'Confirmed' || status === 'Pending') && (
          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">
            <Clock size={11} className="inline" /> Preparing...
          </span>
        )}
      </div>
      <div className="relative mt-4">
        <div className="absolute top-4 left-6 right-6 h-1 bg-gray-200 dark:bg-[#1a1a1a] rounded-full" />
        <motion.div
          className="absolute top-4 left-6 h-1 bg-gradient-to-r from-royal-600 to-mint-500 rounded-full"
          initial={{ width: '0%' }}
          animate={{ width: `${Math.max(0, (currentIdx / (steps.length - 1)) * 100)}%` }}
          transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
          style={{ maxWidth: 'calc(100% - 48px)' }}
        />
        <div className="relative flex justify-between">
          {steps.map((step, i) => {
            const Icon = icons[i];
            const isActive = i <= currentIdx;
            const isCurrent = i === currentIdx;
            return (
              <div key={step} className="flex flex-col items-center gap-1.5">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: isCurrent ? [1, 1.15, 1] : 1 }}
                  transition={isCurrent ? { duration: 0.5, repeat: Infinity, repeatDelay: 2 } : {}}
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                    isActive
                      ? 'bg-gradient-to-br from-royal-600 to-mint-600 border-royal-600 text-white shadow-md'
                      : 'bg-white dark:bg-[#111111] border-gray-300 dark:border-[#333333] text-gray-400'
                  }`}>
                  <Icon size={14} strokeWidth={2.5} />
                </motion.div>
                <span className={`text-[9px] font-bold ${isActive ? 'text-royal-700 dark:text-royal-300' : 'text-gray-400 dark:text-gray-500'}`}>
                  {labels[i]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shopPhone, setShopPhone] = useState('9939079107');
  const [deliveryWindow, setDeliveryWindow] = useState({ start: 6, end: 12 });
  const user = JSON.parse(localStorage.getItem('lg_user') || '{}');
  const confirm = useConfirm();
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (orders.length === 0) return;
    const ok = await confirm({ title: 'Cancel Order', message: 'Are you sure you want to cancel this order? This cannot be undone.', confirmText: 'Cancel Order', type: 'danger' });
    if (!ok) return;
    setCancelling(true);
    try {
      for (const order of orders) {
        await updateDoc(doc(db, 'orders', order.id), { status: 'Cancelled', cancelledAt: new Date().toISOString(), cancelledBy: 'retailer' });
      }
    } catch (e) {}
    setCancelling(false);
  };

  useEffect(() => { fetchShopPhone(); }, []);

  const fetchShopPhone = async () => {
    try {
      const appDoc = await getDoc(doc(db, 'settings', 'app'));
      if (appDoc.exists()) {
        const d = appDoc.data();
        if (d.shopPhone) setShopPhone(d.shopPhone);
        if (d.deliveryStart !== undefined) setDeliveryWindow({ start: d.deliveryStart ?? 6, end: d.deliveryEnd ?? 12 });
      }
    } catch (e) {}
  };

  // Real-time listener for latest orders
  useEffect(() => {
    if (!user.phone) return;
    const q = query(collection(db, 'orders'), where('phone', '==', user.phone));
    const unsub = onSnapshot(q, (snap) => {
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      all.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      if (all.length > 0) {
        const latestDate = all[0].date;
        const dateOrders = all.filter(o => o.date === latestDate);
        // Prefer active (non-cancelled/returned) order over cancelled ones
        const active = dateOrders.filter(o => o.status !== 'Cancelled' && o.status !== 'Returned');
        setOrders(active.length > 0 ? [active[0]] : [dateOrders[0]]);
      } else {
        setOrders([]);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [user.phone]);

  const dayTotal = orders.reduce((sum, o) => sum + (((o.status === 'Delivered' || o.status === 'Dispatched') && o.actualTotal) ? o.actualTotal : (o.total || 0)), 0);

  const isDelivered = orders.length > 0 && orders.every(o => o.status === 'Delivered');
  const isDispatched = orders.length > 0 && orders.some(o => o.status === 'Dispatched');
  const status = orders.length === 0 ? 'No Order' : orders[0]?.status || 'Confirmed';

  const statusConfig = {
    'Pending': { icon: CircleCheckBig, color: 'text-royal-600', bg: 'bg-royal-50 border-royal-200' },
    'Confirmed': { icon: CircleCheckBig, color: 'text-royal-600', bg: 'bg-royal-50 border-royal-200' },
    'Dispatched': { icon: TruckIcon, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
    'In Transit': { icon: TruckIcon, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
    'Delivered': { icon: CircleCheckBig, color: 'text-mint-600', bg: 'bg-mint-50 border-mint-200' },
    'Cancelled': { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
    'Returned': { icon: XCircle, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200' },
  };

  if (loading) return <TableSkeleton />;

  const orderedItems = orders.flatMap(o => {
    const items = ((o.status === 'Delivered' || o.status === 'Dispatched') && o.actualItems) ? o.actualItems : (o.items || []);
    return items;
  });

  return (
    <div className="space-y-5 pb-24 max-w-3xl mx-auto">

      {/* Status + Date */}
      <div className="flex items-center gap-3 flex-wrap">
        {orders.length > 0 && (
          <div className="flex items-center gap-2 bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-2xl px-4 py-2.5 shadow-sm">
            <Calendar size={16} className="text-royal-600" />
            <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{orders[0].date}</span>
          </div>
        )}
        {orders.length > 0 && (() => {
          const config = statusConfig[status] || statusConfig['Pending'];
          const StatusIcon = config.icon;
          return (
            <motion.span initial={{ scale: 0.9 }} animate={{ scale: 1 }}
              className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border ${config.bg} ${config.color}`}>
              <StatusIcon size={13} /> {status}
            </motion.span>
          );
        })()}
        {isDelivered && orders[0]?.deliveredAt && (
          <span className="text-[10px] font-bold text-mint-600 dark:text-mint-400 bg-mint-50 dark:bg-mint-900/20 px-2.5 py-1.5 rounded-lg">
            Delivered at {new Date(orders[0].deliveredAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
        {isDispatched && !isDelivered && (
          <motion.button whileTap={{ scale: 0.93 }} onClick={() => downloadDispatchSlipPDF(orders[0], user, shopPhone)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-blue-700 to-blue-600 text-white text-xs font-bold rounded-xl ml-auto shadow-md shadow-blue-600/20">
            <Download size={14} /> Dispatch Slip
          </motion.button>
        )}
        {isDelivered && (
          <motion.button whileTap={{ scale: 0.93 }} onClick={() => downloadInvoicePDF(orders[0], user, shopPhone)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-mint-700 to-mint-600 text-white text-xs font-bold rounded-xl ml-auto shadow-md shadow-mint-600/20">
            <Download size={14} /> Invoice
          </motion.button>
        )}
        {orders.length > 0 && (status === 'Pending' || status === 'Confirmed') && (
          <motion.button whileTap={{ scale: 0.93 }} onClick={handleCancel} disabled={cancelling}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-red-500 text-white text-xs font-bold rounded-xl ml-auto shadow-md disabled:opacity-50">
            <XCircle size={14} /> {cancelling ? 'Cancelling...' : 'Cancel Order'}
          </motion.button>
        )}
      </div>

      {/* Cancelled Banner */}
      {orders.length > 0 && status === 'Cancelled' && (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-2xl p-4 text-center">
          <XCircle size={24} className="text-red-500 mx-auto mb-1" />
          <p className="text-sm font-bold text-red-700 dark:text-red-400">Order Cancelled</p>
          {orders[0]?.cancelledAt && <p className="text-[10px] text-red-500 mt-1">Cancelled at {new Date(orders[0].cancelledAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</p>}
        </motion.div>
      )}

      {/* Order Progress Timeline */}
      {orders.length > 0 && status !== 'Cancelled' && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <OrderTimeline status={status} deliveryWindow={deliveryWindow} />
        </motion.div>
      )}

      {/* Order Summary Card */}
      {orders.length > 0 ? (
        <>
          {/* Total Card */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="card !p-5 flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase">Order Total</p>
              <p className="text-2xl font-black text-gray-800 dark:text-white mt-1">{formatPrice(dayTotal)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase">Items</p>
              <p className="text-2xl font-black text-royal-600 dark:text-royal-300 mt-1">{orderedItems.length}</p>
            </div>
          </motion.div>

          {/* Delivered celebration */}
          {isDelivered && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="bg-mint-50 dark:bg-mint-900/10 border border-mint-200 dark:border-mint-800 rounded-2xl p-4 text-center">
              <motion.span animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1, repeat: Infinity, repeatDelay: 3 }}
                className="inline-block"><CircleCheckBig size={28} className="text-mint-600" /></motion.span>
              <p className="text-sm font-bold text-mint-700 dark:text-mint-400 mt-1">Delivered successfully!</p>
            </motion.div>
          )}

          {/* Products Grid */}
          {/* Order Items */}
          <div className="card !p-0 overflow-hidden">
            <div className="px-5 py-3 bg-gradient-to-r from-[#0f172a] to-[#1e293b] flex items-center justify-between">
              <p className="text-sm font-bold text-white">Order Items</p>
              <p className="text-xs text-gray-400">{orderedItems.length} items</p>
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {orderedItems.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.03 * i }}
                  className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-7 h-7 bg-royal-50 dark:bg-royal-900/30 rounded-lg flex items-center justify-center text-[10px] font-bold text-royal-600 dark:text-royal-300 shrink-0">
                      {i + 1}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{item.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{item.actual || item.qty} × {formatPrice(item.unitPrice || 0)}</p>
                    </div>
                  </div>
                  <p className="text-sm font-extrabold text-gray-800 dark:text-white shrink-0 ml-3">
                    {formatPrice((item.actual || parseFloat(String(item.qty).replace(/[^0-9.]/g, '')) || 0) * (item.unitPrice || 0))}
                  </p>
                </motion.div>
              ))}
              <div className="flex items-center justify-between px-5 py-4 bg-gray-50 dark:bg-[#1a1a1a]/50">
                <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Total</p>
                <p className="text-lg font-black text-royal-800 dark:text-royal-300">{formatPrice(dayTotal)}</p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="text-center py-20">
          <Package size={48} className="text-gray-200 dark:text-[#444444] mx-auto mb-4" />
          <p className="text-lg font-bold text-gray-400 dark:text-gray-500">No recent order</p>
          <p className="text-sm text-gray-300 dark:text-gray-600 mt-1">Place an order to track it here</p>
        </motion.div>
      )}

      {/* Link to Order History */}
      {orders.length > 0 && (
        <div className="text-center">
          <a href="/history" className="text-xs font-bold text-royal-600 dark:text-royal-400 hover:underline">View Past Orders →</a>
        </div>
      )}
    </div>
  );
}
