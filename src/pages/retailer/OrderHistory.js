import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar, Download, Package, ChevronRight, RotateCcw } from 'lucide-react';
import { db, collection, getDocs, doc, query, where, cachedGetDoc } from '../../services/firebase';
import { formatPrice } from '../../utils/price';
import { jsPDF } from 'jspdf';
import { drawText } from '../../utils/pdfHelper';
import { TableSkeleton } from '../../components/LoadingSkeleton';

function downloadInvoicePDF(order, user, shopPhone) {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
  const w = pdf.internal.pageSize.getWidth(), h = pdf.internal.pageSize.getHeight(), m = 15;
  let y = 0;
  const items = ((order.status === 'Delivered' || order.status === 'Dispatched') && order.actualItems) ? order.actualItems : (order.items || []);
  const total = ((order.status === 'Delivered' || order.status === 'Dispatched') && order.actualTotal) ? order.actualTotal : (order.total || 0);
  const tableW = w - m * 2;

  pdf.setFillColor(15, 23, 42); pdf.rect(0, 0, w, 28, 'F');
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(16); pdf.setTextColor(255, 255, 255);
  pdf.text('LUCY GARDEN', m, 12);
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.text(`Fresh Dairy Supply | Ph: ${shopPhone}`, m, 18);
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(13); pdf.text('INVOICE', w - m, 12, { align: 'right' });
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.text(`Date: ${order.date || ''}`, w - m, 18, { align: 'right' });
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.text((order.status || 'Confirmed').toUpperCase(), w - m, 24, { align: 'right' });
  y = 35;

  pdf.setFillColor(248, 250, 252); pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(m, y, tableW / 2 - 3, 24, 2, 2, 'FD');
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(100, 116, 139); pdf.text('BILL TO', m + 4, y + 5);
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.setTextColor(15, 23, 42);
  drawText(pdf, user.name || '-', m + 4, y + 12, { bold: true, size: 11, color: [15, 23, 42] });
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(71, 85, 105);
  pdf.text(`Phone: ${user.phone || ''}`, m + 4, y + 17);
  pdf.text(`Shop: ${user.shop || '-'}  |  Area: ${user.area || '-'}`, m + 4, y + 22);

  const boxX = m + tableW / 2 + 3;
  pdf.setFillColor(248, 250, 252); pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(boxX, y, tableW / 2 - 3, 24, 2, 2, 'FD');
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(100, 116, 139); pdf.text('ORDER DETAILS', boxX + 4, y + 5);
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(15, 23, 42);
  pdf.text(`Date: ${order.date || '-'}`, boxX + 4, y + 12);
  pdf.text(`Time: ${order.time || '-'}`, boxX + 4, y + 17);
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(100, 116, 139); pdf.text('TOTAL AMOUNT', boxX + 4, y + 22);
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(12); pdf.setTextColor(15, 23, 42);
  pdf.text(`Rs. ${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, boxX + 38, y + 22);
  y += 30;

  const rowH = 8, cols = { num: 12, name: tableW - 12 - 22 - 32 - 35, qty: 22, rate: 32, amt: 35 };
  pdf.setFillColor(15, 23, 42); pdf.roundedRect(m, y, tableW, rowH + 1, 1, 1, 'F');
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(255, 255, 255);
  let cx = m;
  pdf.text('#', cx + cols.num / 2, y + 5.5, { align: 'center' }); cx += cols.num;
  pdf.text('Item', cx + 4, y + 5.5); cx += cols.name;
  pdf.text('Qty', cx + cols.qty / 2, y + 5.5, { align: 'center' }); cx += cols.qty;
  pdf.text('Rate', cx + cols.rate / 2, y + 5.5, { align: 'center' }); cx += cols.rate;
  pdf.text('Amount', cx + cols.amt / 2, y + 5.5, { align: 'center' });
  y += rowH + 2;

  items.forEach((item, idx) => {
    if (y + rowH > h - 30) { pdf.addPage(); y = m; }
    if (idx % 2 === 0) { pdf.setFillColor(248, 250, 252); pdf.rect(m, y - 1, tableW, rowH, 'F'); }
    pdf.setDrawColor(230, 230, 230); pdf.setLineWidth(0.1); pdf.line(m, y + rowH - 1.5, m + tableW, y + rowH - 1.5);
    cx = m;
    const qty = item.actual || item.qty, rate = item.unitPrice || 0;
    const amt = (parseFloat(String(qty).replace(/[^0-9.]/g, '')) || 0) * rate;
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(100, 116, 139);
    pdf.text(`${idx + 1}`, cx + cols.num / 2, y + 5.5, { align: 'center' }); cx += cols.num;
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(15, 23, 42);
    drawText(pdf, item.name || '', cx + 4, y + 5.5, { bold: true, size: 9, color: [15, 23, 42] }); cx += cols.name;
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(71, 85, 105);
    pdf.text(`${qty}`, cx + cols.qty / 2, y + 5.5, { align: 'center' }); cx += cols.qty;
    pdf.text(rate > 0 ? `${rate.toFixed(2)}` : '-', cx + cols.rate / 2, y + 5.5, { align: 'center' }); cx += cols.rate;
    pdf.setFont('helvetica', 'bold'); pdf.setTextColor(15, 23, 42);
    pdf.text(amt > 0 ? `${amt.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '-', cx + cols.amt / 2, y + 5.5, { align: 'center' });
    y += rowH;
  });

  y += 2; pdf.setDrawColor(15, 23, 42); pdf.setLineWidth(0.4); pdf.line(m, y, m + tableW, y); y += 1;
  pdf.setFillColor(15, 23, 42); pdf.roundedRect(m, y, tableW, 10, 1, 1, 'F');
  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.setTextColor(255, 255, 255);
  pdf.text('TOTAL', m + 6, y + 7);
  pdf.text(`Rs. ${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, m + tableW - 6, y + 7, { align: 'right' });
  y += 16;
  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(100, 116, 139);
  pdf.text(`Total Items: ${items.length}`, m, y);
  pdf.setFontSize(7); pdf.setTextColor(180, 180, 180);
  pdf.text('Lucy Garden | Fresh Dairy Supply', w / 2, h - 12, { align: 'center' });
  pdf.text('Thank you for your business!', w / 2, h - 8, { align: 'center' });
  pdf.save(`LG_Invoice_${order.date?.replace(/[\s,]/g, '')}_${(user.name || 'order').replace(/\s/g, '_')}.pdf`);
}

const statusColors = {
  'Delivered':  'text-green-700 bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900 dark:text-green-400',
  'Dispatched': 'text-blue-700 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-900 dark:text-blue-400',
  'Pending':    'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900 dark:text-amber-400',
  'Confirmed':  'text-navy-700 bg-navy-50 border-navy-200 dark:bg-navy-950/30 dark:border-navy-900 dark:text-navy-400',
  'Cancelled':  'text-red-700 bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900 dark:text-red-400',
  'Returned':   'text-warm-600 bg-warm-100 border-warm-200 dark:bg-warm-800/20 dark:border-warm-700 dark:text-warm-400',
};

export default function OrderHistory() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shopPhone, setShopPhone] = useState('9939079107');
  const [expanded, setExpanded] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; });
  const user = JSON.parse(localStorage.getItem('lg_user') || '{}');

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      try {
        const appDoc = await cachedGetDoc(doc(db, 'settings', 'app'));
        if (appDoc.exists() && appDoc.data().shopPhone) setShopPhone(appDoc.data().shopPhone);
        const snap = await getDocs(query(collection(db, 'orders'), where('phone', '==', user.phone)));
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        all.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
        setOrders(all);
      } catch {}
      setLoading(false);
    }
    fetch();
  }, [user.phone]);

  const filteredOrders = orders.filter(o => {
    if (!o.date) return false;
    const parsed = new Date(o.date.replace(/^(\d+)\s/, '$1 '));
    if (isNaN(parsed)) return false;
    return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}` === selectedMonth;
  });

  const grouped = {};
  filteredOrders.forEach(o => { const d = o.date || 'Unknown'; if (!grouped[d]) grouped[d] = []; grouped[d].push(o); });
  const monthTotal = filteredOrders.reduce((s, o) => s + (o.actualTotal || o.total || 0), 0);

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-4 pb-24 max-w-3xl mx-auto">
      {/* Month Filter */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <input type="month" value={selectedMonth}
          min={`${new Date().getFullYear() - 1}-${String(new Date().getMonth() + 1).padStart(2, '0')}`}
          max={`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`}
          onChange={e => { setSelectedMonth(e.target.value); setExpanded(null); }}
          className="text-sm font-medium bg-white dark:bg-[#1a1917] border border-warm-200 dark:border-[#2e2d2b] rounded-md px-3 py-2 outline-none dark:text-warm-100" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-warm-400">{filteredOrders.length} orders</span>
          {monthTotal > 0 && <span className="text-xs font-semibold text-navy-700 dark:text-navy-300 bg-navy-50 dark:bg-navy-900/30 px-2.5 py-1 rounded border border-navy-100 dark:border-navy-800 font-mono">{formatPrice(monthTotal)}</span>}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-20">
          <Package size={40} className="text-warm-200 dark:text-warm-700 mx-auto mb-3" />
          <p className="text-base font-medium text-warm-400">No orders this month</p>
          <p className="text-sm text-warm-300 dark:text-warm-600 mt-1">Select a different month</p>
        </div>
      ) : (
        <div className="space-y-2">
          {Object.entries(grouped).map(([date, dateOrders]) => {
            const total = dateOrders.reduce((s, o) => s + (o.actualTotal || o.total || 0), 0);
            const mainOrder = dateOrders[0];
            const isExpanded = expanded === date;
            const items = ((mainOrder.status === 'Delivered' || mainOrder.status === 'Dispatched') && mainOrder.actualItems) ? mainOrder.actualItems : (mainOrder.items || []);

            return (
              <motion.div key={date} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className="card !p-0 overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : date)}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-navy-50 dark:bg-navy-900/30 rounded-md flex items-center justify-center">
                      <Calendar size={14} className="text-navy-700 dark:text-navy-300" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-warm-800 dark:text-warm-100">{date}</p>
                      <p className="text-[10px] text-warm-400 font-mono">{items.length} items · {formatPrice(total)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${statusColors[mainOrder.status] || statusColors['Pending']}`}>
                      {mainOrder.status}
                    </span>
                    <motion.div animate={{ rotate: isExpanded ? 90 : 0 }} transition={{ duration: 0.15 }}>
                      <ChevronRight size={14} className="text-warm-400" />
                    </motion.div>
                  </div>
                </div>

                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="border-t border-warm-100 dark:border-[#2e2d2b]">
                    <div className="divide-y divide-warm-100 dark:divide-[#2e2d2b]">
                      {items.map((item, i) => {
                        const qty = item.actual || item.qty;
                        const amt = (parseFloat(String(qty).replace(/[^0-9.]/g, '')) || 0) * (item.unitPrice || 0);
                        return (
                          <div key={i} className="flex items-center justify-between px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-warm-400 w-4 font-mono">{i + 1}.</span>
                              <span className="text-sm text-warm-700 dark:text-warm-200">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-warm-400 font-mono">×{qty}</span>
                              <span className="text-sm font-semibold text-warm-800 dark:text-warm-100 font-mono">{formatPrice(amt)}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex items-center justify-between px-4 py-2.5 bg-warm-50 dark:bg-[#2e2d2b]">
                      <p className="text-sm font-semibold text-warm-700 dark:text-warm-200 font-mono">Total: {formatPrice(total)}</p>
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); localStorage.setItem('lg_reorder', JSON.stringify(items.map(it => ({ name: it.name, qty: it.actual || it.qty })))); navigate('/order'); }}
                          className="flex items-center gap-1 px-2.5 py-1.5 bg-green-700 text-white text-[10px] font-semibold rounded">
                          <RotateCcw size={10} /> Re-order
                        </button>
                        {(mainOrder.status === 'Delivered' || mainOrder.status === 'Dispatched') && (
                          <button onClick={(e) => { e.stopPropagation(); downloadInvoicePDF(mainOrder, user, shopPhone); }}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-navy-700 text-white text-[10px] font-semibold rounded">
                            <Download size={10} /> Invoice
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
