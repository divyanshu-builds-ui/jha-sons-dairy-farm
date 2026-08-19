import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Printer, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { db, collection, getDocs, doc, getDoc, query, where } from '../../services/firebase';
import { formatPrice } from '../../utils/price';
import { jsPDF } from 'jspdf';
import { drawText, registerHindiFont } from '../../utils/pdfHelper';
import { TableSkeleton } from '../../components/LoadingSkeleton';

export default function MyLedger() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [groupOrder, setGroupOrder] = useState([]);
  const [groupCodes, setGroupCodes] = useState({});
  const [ordersDayData, setOrdersDayData] = useState({});
  const [openingBalance, setOpeningBalance] = useState(0);
  const [perPage, setPerPage] = useState(31);
  const [page, setPage] = useState(1);
  const [fromDate, setFromDate] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`; });
  const [toDate, setToDate] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; });

  const user = JSON.parse(localStorage.getItem('lg_user') || '{}');
  const todayStr = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();

  const parseToGrams = (p) => { const lbl = (p.label || p.name || '').toLowerCase(); const num = parseFloat(lbl.replace(/[^0-9.]/g, '')) || 0; if (/kg/.test(lbl)) return num * 1000; if (/ltr|lit|l$/.test(lbl)) return num * 1000; if (/ml/.test(lbl)) return num; if (/g$|gm/.test(lbl)) return num; if (/half|hf/.test(lbl)) return 500; if (/full|fl/.test(lbl)) return 1000; if (/qtr|quarter/.test(lbl)) return 250; return p.price || 0; };

  const allDates = useMemo(() => { const dates = []; const start = new Date(fromDate + 'T00:00:00'); const end = new Date(toDate + 'T00:00:00'); for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) dates.push(new Date(d)); return dates; }, [fromDate, toDate]);

  useEffect(() => { fetchAll(); }, [fromDate, toDate]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [prodSnap, groupDoc] = await Promise.all([getDocs(collection(db, 'products')), getDoc(doc(db, 'settings', 'productGroups'))]);
      const prods = prodSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.active !== false);
      setProducts(prods);
      if (groupDoc.exists() && groupDoc.data().daily) { setGroupOrder(groupDoc.data().daily); setGroupCodes(groupDoc.data().codes || {}); }

      // Opening balance
      const ledgerSnap = await getDocs(query(collection(db, 'ledger'), where('retailerId', '==', user.phone)));
      const start = new Date(fromDate + 'T00:00:00');
      let bal = 0;
      ledgerSnap.docs.forEach(d => { const e = d.data(); let parsed = null; const parts = (e.date || '').match(/(\d+)\s+(\w+)\s+(\d+)/); if (parts) parsed = new Date(`${parts[2]} ${parts[1]}, ${parts[3]}`); if (!parsed || isNaN(parsed.getTime())) parsed = new Date(e.date); if (parsed && !isNaN(parsed.getTime()) && parsed < start) { if (e.type === 'debit') bal += (e.amount || 0); else bal -= (e.amount || 0); } });
      setOpeningBalance(bal);

      // Orders
      const ordSnap = await getDocs(query(collection(db, 'orders'), where('phone', '==', user.phone)));
      const end = new Date(toDate + 'T00:00:00');
      const dayMap = {};
      ordSnap.docs.forEach(d => { const o = d.data(); if (o.status === 'Cancelled' || o.status === 'Returned') return; let orderDate = null; const parts = (o.date || '').match(/(\d+)\s+(\w+)\s+(\d+)/); if (parts) orderDate = new Date(`${parts[2]} ${parts[1]}, ${parts[3]}`); if (!orderDate || isNaN(orderDate.getTime())) orderDate = new Date(o.date); if (!orderDate || isNaN(orderDate.getTime())) return; if (orderDate < start || orderDate > end) return; const key = `${orderDate.getFullYear()}-${String(orderDate.getMonth()+1).padStart(2,'0')}-${String(orderDate.getDate()).padStart(2,'0')}`; if (!dayMap[key]) dayMap[key] = { items: {}, deposit: 0 }; (o.actualItems || o.items || []).forEach(item => { const qty = parseFloat(String(item.qty || item.actual || 0).replace(/[^0-9.]/g, '')) || 0; if (qty > 0 && item.name) dayMap[key].items[item.name] = (dayMap[key].items[item.name] || 0) + qty; }); if (o.paymentReceived > 0) dayMap[key].deposit = (dayMap[key].deposit || 0) + o.paymentReceived; });
      ledgerSnap.docs.forEach(d => { const e = d.data(); if (e.type !== 'credit') return; let parsed = null; const parts = (e.date || '').match(/(\d+)\s+(\w+)\s+(\d+)/); if (parts) parsed = new Date(`${parts[2]} ${parts[1]}, ${parts[3]}`); if (!parsed || isNaN(parsed.getTime())) parsed = new Date(e.date); if (!parsed || isNaN(parsed.getTime())) return; if (parsed < start || parsed > end) return; const key = `${parsed.getFullYear()}-${String(parsed.getMonth()+1).padStart(2,'0')}-${String(parsed.getDate()).padStart(2,'0')}`; if (!dayMap[key]) dayMap[key] = { items: {}, deposit: 0 }; dayMap[key].deposit = (dayMap[key].deposit || 0) + (e.amount || 0); });
      setOrdersDayData(dayMap);
    } catch (err) {}
    setLoading(false);
  };

  const priceMap = useMemo(() => { const m = {}; products.forEach(p => { m[p.name] = p.price || 0; }); return m; }, [products]);
  const PRODUCT_GROUPS = useMemo(() => { const gm = {}; groupOrder.forEach(g => { gm[g] = []; }); products.filter(p => p.group && p.type === 'daily').sort((a, b) => parseToGrams(b) - parseToGrams(a)).forEach(p => { if (!gm[p.group]) gm[p.group] = []; gm[p.group].push({ key: p.name, label: p.label || p.name, price: p.price || 0 }); }); const r = []; groupOrder.forEach(g => { if (gm[g]?.length > 0) r.push({ group: g, items: gm[g] }); }); Object.keys(gm).forEach(g => { if (!groupOrder.includes(g) && gm[g]?.length > 0) r.push({ group: g, items: gm[g] }); }); return r; }, [products, groupOrder]);
  const ALL_DAILY_KEYS = useMemo(() => PRODUCT_GROUPS.flatMap(g => g.items.map(i => i.key)), [PRODUCT_GROUPS]);
  const SEASONAL_GROUPS = useMemo(() => { const sm = {}; const r = []; products.filter(p => p.group && p.type === 'seasonal').sort((a, b) => parseToGrams(b) - parseToGrams(a)).forEach(p => { if (!sm[p.group]) { sm[p.group] = []; r.push({ group: p.group, items: sm[p.group] }); } sm[p.group].push({ key: p.name, label: p.label || p.name, price: p.price || 0 }); }); const ng = products.filter(p => p.type === 'seasonal' && !p.group).sort((a, b) => parseToGrams(b) - parseToGrams(a)); if (ng.length > 0) r.push({ group: 'OTHER', items: ng.map(p => ({ key: p.name, label: p.label || p.name, price: p.price || 0 })) }); return r; }, [products]);
  const ALL_SEASONAL_KEYS = useMemo(() => SEASONAL_GROUPS.flatMap(g => g.items.map(i => i.key)), [SEASONAL_GROUPS]);

  const rowData = useMemo(() => { const rows = []; let prev = openingBalance; allDates.forEach(date => { const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; const dayData = ordersDayData[key] || { items: {}, deposit: 0 }; let dailyAmt = 0, seasonalAmt = 0; Object.entries(dayData.items).forEach(([name, qty]) => { const amt = qty * (priceMap[name] || 0); if (ALL_SEASONAL_KEYS.includes(name)) seasonalAmt += amt; else dailyAmt += amt; }); const deposit = dayData.deposit || 0; const closing = prev + dailyAmt + seasonalAmt - deposit; rows.push({ date, dateStr: `${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')}/${date.getFullYear()}`, items: dayData.items, dailyAmt, seasonalAmt, deposit, closing }); prev = closing; }); return rows; }, [allDates, ordersDayData, openingBalance, priceMap, ALL_SEASONAL_KEYS]);

  const closingBal = rowData.length > 0 ? rowData[rowData.length - 1].closing : openingBalance;
  const totalDaily = rowData.reduce((s, r) => s + r.dailyAmt, 0);
  const totalDeposit = rowData.reduce((s, r) => s + r.deposit, 0);
  const totalSeasonal = rowData.reduce((s, r) => s + r.seasonalAmt, 0);
  const totalPages = Math.ceil(rowData.length / perPage);
  const pagedRows = rowData.slice((page - 1) * perPage, page * perPage);

  const printPDF = () => {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' }); registerHindiFont(pdf);
    const w = pdf.internal.pageSize.getWidth(), h = pdf.internal.pageSize.getHeight(), m = 3;
    const dateW = 22, totalW = 20, depW = 20, closeW = 20;
    const availW = w - m * 2 - dateW - totalW - depW - closeW;
    const qtyW = ALL_DAILY_KEYS.length > 0 ? Math.max(5, Math.floor(availW / ALL_DAILY_KEYS.length)) : 10;
    const qtyFontSize = qtyW < 7 ? 9 : qtyW < 10 ? 11 : 13;
    const rowH = 11, groupH = 8, subH = 8;
    let y = m;

    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(14); pdf.setTextColor(0, 0, 0);
    pdf.text('LUCY GARDEN', m, y + 5);
    drawText(pdf, `${user.name || user.phone}  |  ${fromDate} to ${toDate}`, w - m, y + 5, { size: 10, align: 'right' });
    y += 8; pdf.setDrawColor(0); pdf.setLineWidth(0.3); pdf.line(m, y, w - m, y); y += 2;
    pdf.setFontSize(8); pdf.setTextColor(40, 40, 40);
    drawText(pdf, `Opening: Rs.${openingBalance} | Closing: Rs.${closingBal}`, m, y + 3, { size: 8, color: [40, 40, 40] });
    pdf.setTextColor(0, 0, 0); y += 5;

    const drawHeader = () => {
      pdf.setDrawColor(80, 80, 80); pdf.setLineWidth(0.3); pdf.setFillColor(210, 210, 210); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(0, 0, 0);
      pdf.rect(m, y, dateW, groupH + subH, 'FD'); pdf.setFontSize(9); pdf.text('DATE', m + dateW / 2, y + (groupH + subH) / 2 + 1, { align: 'center' });
      let gx = m + dateW;
      PRODUCT_GROUPS.forEach(g => { const span = g.items.length * qtyW; pdf.setFillColor(210, 210, 210); pdf.rect(gx, y, span, groupH, 'FD'); const lbl = groupCodes[g.group] || g.group; let fs = 10; pdf.setFontSize(fs); while (pdf.getTextWidth(lbl) > span - 2 && fs > 7) { fs -= 0.5; pdf.setFontSize(fs); } pdf.text(lbl, gx + span / 2, y + 5.5, { align: 'center' }); gx += span; });
      pdf.setFillColor(210, 210, 210); pdf.rect(gx, y, totalW, groupH + subH, 'FD'); pdf.setFontSize(9); pdf.text('TOTAL', gx + totalW / 2, y + (groupH + subH) / 2 + 1, { align: 'center' }); gx += totalW;
      pdf.setFillColor(210, 210, 210); pdf.rect(gx, y, depW, groupH + subH, 'FD'); pdf.setFontSize(9); pdf.text('PAID', gx + depW / 2, y + (groupH + subH) / 2 + 1, { align: 'center' }); gx += depW;
      pdf.setFillColor(210, 210, 210); pdf.rect(gx, y, closeW, groupH + subH, 'FD'); pdf.setFontSize(9); pdf.text('DUE', gx + closeW / 2, y + (groupH + subH) / 2 + 1, { align: 'center' });
      const sy = y + groupH; gx = m + dateW;
      PRODUCT_GROUPS.forEach(g => g.items.forEach(item => { pdf.setFillColor(230, 230, 230); pdf.rect(gx, sy, qtyW, subH, 'FD'); pdf.setTextColor(0, 0, 0); const l = item.label; let fs2 = 9; pdf.setFontSize(fs2); while (pdf.getTextWidth(l) > qtyW - 1 && fs2 > 5) { fs2 -= 0.5; pdf.setFontSize(fs2); } pdf.text(l, gx + qtyW / 2, sy + 5, { align: 'center' }); gx += qtyW; }));
      y += groupH + subH;
    };
    drawHeader();

    rowData.forEach(row => {
      if (y + rowH > h - 8) { pdf.addPage(); y = m; drawHeader(); }
      pdf.setDrawColor(100, 100, 100); pdf.setLineWidth(0.3); pdf.setFillColor(255, 255, 255); let rx = m;
      pdf.rect(rx, y, dateW, rowH, 'FD'); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(0, 0, 0); pdf.text(row.dateStr.slice(0, 5), rx + dateW / 2, y + 6.5, { align: 'center' }); rx += dateW;
      ALL_DAILY_KEYS.forEach(key => { pdf.setFillColor(255, 255, 255); pdf.setDrawColor(100, 100, 100); pdf.rect(rx, y, qtyW, rowH, 'FD'); const q = row.items[key] || 0; if (q > 0) { pdf.setFont('helvetica', 'bold'); pdf.setFontSize(qtyFontSize); pdf.setTextColor(0, 0, 0); pdf.text(`${q}`, rx + qtyW / 2, y + 7, { align: 'center' }); } rx += qtyW; });
      pdf.setFillColor(255, 255, 255); pdf.setDrawColor(100, 100, 100); pdf.rect(rx, y, totalW, rowH, 'FD'); if (row.dailyAmt > 0) { pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(0, 0, 0); pdf.text(`${row.dailyAmt}`, rx + totalW / 2, y + 6.5, { align: 'center' }); } rx += totalW;
      pdf.setFillColor(255, 255, 255); pdf.setDrawColor(100, 100, 100); pdf.rect(rx, y, depW, rowH, 'FD'); if (row.deposit > 0) { pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(0, 0, 0); pdf.text(`${row.deposit}`, rx + depW / 2, y + 6.5, { align: 'center' }); } rx += depW;
      pdf.setFillColor(255, 255, 255); pdf.setDrawColor(100, 100, 100); pdf.rect(rx, y, closeW, rowH, 'FD'); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(0, 0, 0); pdf.text(`${row.closing}`, rx + closeW / 2, y + 6.5, { align: 'center' });
      y += rowH;
    });

    if (y + rowH > h - 8) { pdf.addPage(); y = m; drawHeader(); }
    pdf.setDrawColor(50, 50, 50); pdf.setLineWidth(0.4); pdf.line(m, y, w - m, y); y += 1;
    pdf.setDrawColor(100, 100, 100); pdf.setLineWidth(0.3);
    let rx = m;
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(0, 0, 0); pdf.setFillColor(220, 220, 220);
    pdf.rect(rx, y, dateW, rowH, 'FD'); pdf.text('TOTAL', rx + dateW / 2, y + 6.5, { align: 'center' }); rx += dateW;
    ALL_DAILY_KEYS.forEach(key => {
      pdf.setFillColor(220, 220, 220); pdf.setDrawColor(100, 100, 100); pdf.rect(rx, y, qtyW, rowH, 'FD');
      const t = rowData.reduce((s, r) => s + (r.items[key] || 0), 0);
      if (t > 0) { pdf.setFont('helvetica', 'bold'); pdf.setFontSize(t >= 100 ? 8 : 10); pdf.setTextColor(0, 0, 0); pdf.text(`${t}`, rx + qtyW / 2, y + 7, { align: 'center' }); }
      rx += qtyW;
    });
    pdf.setFillColor(220, 220, 220); pdf.setDrawColor(100, 100, 100);
    pdf.rect(rx, y, totalW, rowH, 'FD'); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(0, 0, 0); pdf.text(`${totalDaily}`, rx + totalW / 2, y + 6.5, { align: 'center' }); rx += totalW;
    pdf.setFillColor(220, 220, 220); pdf.setDrawColor(100, 100, 100); pdf.rect(rx, y, depW, rowH, 'FD'); pdf.text(`${totalDeposit}`, rx + depW / 2, y + 6.5, { align: 'center' }); rx += depW;
    pdf.setFillColor(220, 220, 220); pdf.setDrawColor(100, 100, 100); pdf.rect(rx, y, closeW, rowH, 'FD'); pdf.text(`${closingBal}`, rx + closeW / 2, y + 6.5, { align: 'center' });

    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(80, 80, 80);
    drawText(pdf, `Lucy Garden | ${user.name || user.phone} | ${fromDate} to ${toDate}`, w / 2, h - 3, { size: 7, color: [80, 80, 80], align: 'center' });
    pdf.save(`Ledger_${(user.name || user.phone).replace(/\s/g, '_')}_${fromDate}.pdf`);
  };

  if (loading) return <TableSkeleton />;

  return (
    <div className="pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 bg-white dark:bg-[#1a1917] border border-warm-200 dark:border-[#2e2d2b] rounded-md px-2.5 py-2">
          <Calendar size={13} className="text-warm-400 shrink-0" />
          <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} max={toDate} className="text-[11px] text-warm-700 dark:text-warm-200 outline-none bg-transparent flex-1 min-w-0" />
          <span className="text-warm-300 text-[10px] shrink-0">–</span>
          <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} max={todayStr} className="text-[11px] text-warm-700 dark:text-warm-200 outline-none bg-transparent flex-1 min-w-0" />
        </div>
        <motion.button whileTap={{ scale: 0.95 }} onClick={printPDF} className="flex items-center gap-1.5 px-3 py-2 bg-navy-700 text-white text-xs font-semibold rounded-md">
          <Printer size={12} /> PDF
        </motion.button>
      </div>
      <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white dark:bg-[#1a1917] border border-warm-200 dark:border-[#2e2d2b] rounded-md px-3 py-2.5 min-w-0">
            <p className="text-[10px] text-warm-400 uppercase tracking-wide">Daily</p>
            <p className="text-sm font-bold text-warm-800 dark:text-warm-100 mt-0.5 font-mono">{formatPrice(totalDaily)}</p>
          </div>
          <div className="bg-white dark:bg-[#1a1917] border border-warm-200 dark:border-[#2e2d2b] rounded-md px-3 py-2.5 min-w-0">
            <p className="text-[10px] text-warm-400 uppercase tracking-wide">Seasonal</p>
            <p className="text-sm font-bold text-amber-600 mt-0.5 font-mono">{formatPrice(totalSeasonal)}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-white dark:bg-[#1a1917] border border-warm-200 dark:border-[#2e2d2b] rounded-md px-3 py-2.5 min-w-0">
            <p className="text-[10px] text-warm-400 uppercase tracking-wide">Opening</p>
            <p className="text-sm font-bold text-warm-800 dark:text-warm-100 mt-0.5 font-mono">{formatPrice(openingBalance)}</p>
          </div>
          <div className="bg-white dark:bg-[#1a1917] border border-warm-200 dark:border-[#2e2d2b] rounded-md px-3 py-2.5 min-w-0">
            <p className="text-[10px] text-warm-400 uppercase tracking-wide">Paid</p>
            <p className="text-sm font-bold text-green-700 mt-0.5 font-mono">{formatPrice(totalDeposit)}</p>
          </div>
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-md px-3 py-2.5 min-w-0">
            <p className="text-[10px] text-red-500 uppercase tracking-wide">Due</p>
            <p className="text-sm font-bold text-red-600 mt-0.5 font-mono">{formatPrice(closingBal)}</p>
          </div>
        </div>
      </div>
      <div className="flex-1 min-w-0 space-y-4">
        <div className="bg-white dark:bg-[#1a1917] rounded-lg border border-warm-200 dark:border-[#2e2d2b] overflow-hidden max-w-[calc(100vw-2rem)]">
          <div className="overflow-x-auto scrollbar-hide">
            <table className="border-collapse w-full min-w-[700px]">
              <thead className="sticky top-0 z-[15]">
                <tr className="bg-navy-800">
                  <th rowSpan={2} className="sticky left-0 z-20 bg-navy-800 px-2 py-3 text-center text-white font-bold text-xs border-r border-white/10 w-[72px]">Date</th>
                  {PRODUCT_GROUPS.map((g, gi) => <th key={gi} colSpan={g.items.length} className="px-1 py-3 text-center font-extrabold text-white text-xs border-r border-white/10">{groupCodes[g.group] || g.group}</th>)}
                  <th rowSpan={2} className="px-2 py-3 text-center text-white font-bold text-xs border-r border-white/10 w-[70px]">TOTAL</th>
                  <th rowSpan={2} className="px-2 py-3 text-center text-white font-bold text-xs border-r border-white/10 w-[70px]">PAID</th>
                  <th rowSpan={2} className="sticky right-0 z-20 bg-navy-800 px-2 py-3 text-center text-white font-bold text-xs w-[70px] border-l border-white/10">DUE</th>
                </tr>
                <tr className="bg-navy-700">
                  {PRODUCT_GROUPS.flatMap(g => g.items).map(item => <th key={item.key} className="px-1 py-2 text-center font-bold text-gray-300 border-r border-white/5 min-w-[40px] text-[10px]">{item.label}<br/><span className="text-[9px] font-medium text-gray-400">₹{item.price}</span></th>)}
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((row, i) => (
                  <tr key={row.dateStr} className={`${i % 2 === 0 ? 'bg-white dark:bg-[#1a1917]' : 'bg-warm-50/50 dark:bg-[#2e2d2b]/30'} hover:bg-navy-50/20 dark:hover:bg-navy-900/10`}>
                    <td className={`sticky left-0 z-10 ${i % 2 === 0 ? 'bg-white dark:bg-[#1a1917]' : 'bg-warm-50 dark:bg-[#2e2d2b]'} px-2 py-2.5 text-center text-[11px] font-medium text-warm-600 dark:text-warm-400 border-b border-r border-warm-200 dark:border-[#2e2d2b] whitespace-nowrap`}>{row.dateStr}</td>
                    {PRODUCT_GROUPS.flatMap(g => g.items).map(item => { const q = row.items[item.key] || 0; return <td key={item.key} className="px-1 py-2.5 text-center border-b border-r border-warm-100 dark:border-[#2e2d2b]">{q > 0 ? <span className="font-bold text-[13px] text-navy-700 dark:text-navy-300 font-mono">{q}</span> : <span className="text-warm-200 dark:text-warm-700">·</span>}</td>; })}
                    <td className="px-2 py-2.5 text-center border-b border-r border-warm-200 dark:border-[#2e2d2b]">{row.dailyAmt > 0 ? <span className="font-bold text-[12px] text-warm-800 dark:text-warm-100 font-mono">₹{row.dailyAmt}</span> : <span className="text-warm-200">—</span>}</td>
                    <td className="px-2 py-2.5 text-center border-b border-r border-warm-200 dark:border-[#2e2d2b]">{row.deposit > 0 ? <span className="font-bold text-[12px] text-green-700 dark:text-green-400 font-mono">₹{row.deposit}</span> : <span className="text-warm-200">—</span>}</td>
                    <td className={`sticky right-0 z-10 ${i % 2 === 0 ? 'bg-white dark:bg-[#1a1917]' : 'bg-warm-50 dark:bg-[#2e2d2b]'} px-2 py-2.5 text-center border-b border-l border-warm-200 dark:border-[#2e2d2b]`}><span className="font-bold text-[12px] text-warm-800 dark:text-warm-100 font-mono">{row.closing}</span></td>
                  </tr>
                ))}
                <tr className="bg-navy-800">
                  <td className="sticky left-0 z-20 bg-navy-800 px-2 py-2.5 text-center text-xs font-bold text-white border-r border-white/10">TOTAL</td>
                  {PRODUCT_GROUPS.flatMap(g => g.items).map(item => { const t = rowData.reduce((s, r) => s + (r.items[item.key] || 0), 0); return <td key={item.key} className="px-1 py-2.5 text-center text-[12px] font-bold text-amber-300 border-r border-white/5 font-mono">{t > 0 ? t : '·'}</td>; })}
                  <td className="px-2 py-2.5 text-center text-[12px] font-bold text-white border-r border-white/10 font-mono">{totalDaily > 0 ? `₹${totalDaily}` : '—'}</td>
                  <td className="px-2 py-2.5 text-center text-[11px] font-bold text-green-300 border-r border-white/10 font-mono">{totalDeposit > 0 ? `₹${totalDeposit}` : '—'}</td>
                  <td className="sticky right-0 z-20 bg-navy-800 px-2 py-2.5 text-center text-[12px] font-bold text-white border-l border-white/10 font-mono">₹{closingBal}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        {SEASONAL_GROUPS.length > 0 && (
          <div className="bg-white dark:bg-[#1a1917] rounded-lg border border-warm-200 dark:border-[#2e2d2b] overflow-hidden max-w-[calc(100vw-2rem)]">
            <div className="px-4 py-2.5 bg-amber-600"><p className="text-sm font-semibold text-white">Seasonal Products</p></div>
            <div className="overflow-x-auto scrollbar-hide">
              <table className="border-collapse w-full min-w-[500px]">
                <thead className="sticky top-0 z-[15]">
                  <tr className="bg-navy-800">
                    <th rowSpan={2} className="sticky left-0 z-20 bg-navy-800 px-2 py-3 text-center text-white font-bold text-xs border-r border-white/10 w-[72px]">Date</th>
                    {SEASONAL_GROUPS.map((g, gi) => <th key={gi} colSpan={g.items.length} className="px-1 py-3 text-center font-extrabold text-white text-xs border-r border-white/10">{g.group}</th>)}
                    <th rowSpan={2} className="sticky right-0 z-20 bg-navy-800 px-2 py-3 text-center text-white font-bold text-xs w-[70px] border-l border-white/10">TOTAL</th>
                  </tr>
                  <tr className="bg-navy-700">
                    {SEASONAL_GROUPS.flatMap(g => g.items).map(item => <th key={item.key} className="px-1 py-2 text-center font-bold text-gray-300 border-r border-white/5 min-w-[40px] text-[10px]">{item.label}<br/><span className="text-[9px] font-medium text-gray-400">₹{item.price}</span></th>)}
                  </tr>
                </thead>
                <tbody>
                  {pagedRows.map((row, i) => (
                    <tr key={row.dateStr} className={`${i % 2 === 0 ? 'bg-white dark:bg-[#1a1917]' : 'bg-warm-50/50 dark:bg-[#2e2d2b]/30'} hover:bg-navy-50/20 dark:hover:bg-navy-900/10`}>
                      <td className={`sticky left-0 z-10 ${i % 2 === 0 ? 'bg-white dark:bg-[#1a1917]' : 'bg-warm-50 dark:bg-[#2e2d2b]'} px-2 py-2.5 text-center text-[11px] font-medium text-warm-600 dark:text-warm-400 border-b border-r border-warm-200 dark:border-[#2e2d2b] whitespace-nowrap`}>{row.dateStr}</td>
                      {SEASONAL_GROUPS.flatMap(g => g.items).map(item => { const q = row.items[item.key] || 0; return <td key={item.key} className="px-1 py-2.5 text-center border-b border-r border-warm-100 dark:border-[#2e2d2b]">{q > 0 ? <span className="font-bold text-[13px] text-amber-700 dark:text-amber-300 font-mono">{q}</span> : <span className="text-warm-200 dark:text-warm-700">·</span>}</td>; })}
                      <td className={`sticky right-0 z-10 ${i % 2 === 0 ? 'bg-white dark:bg-[#1a1917]' : 'bg-warm-50 dark:bg-[#2e2d2b]'} px-2 py-2.5 text-center border-b border-l border-warm-200 dark:border-[#2e2d2b]`}>{row.seasonalAmt > 0 ? <span className="font-bold text-[12px] text-amber-700 dark:text-amber-300 font-mono">₹{row.seasonalAmt}</span> : <span className="text-warm-200">—</span>}</td>
                    </tr>
                  ))}
                  <tr className="bg-navy-800">
                    <td className="sticky left-0 z-20 bg-navy-800 px-2 py-2.5 text-center text-xs font-bold text-white border-r border-white/10">TOTAL</td>
                    {SEASONAL_GROUPS.flatMap(g => g.items).map(item => { const t = rowData.reduce((s, r) => s + (r.items[item.key] || 0), 0); return <td key={item.key} className="px-1 py-2.5 text-center text-[12px] font-bold text-amber-300 border-r border-white/5 font-mono">{t > 0 ? t : '·'}</td>; })}
                    <td className="sticky right-0 z-20 bg-navy-800 px-2 py-2.5 text-center text-[12px] font-bold text-amber-300 border-l border-white/10 font-mono">{totalSeasonal > 0 ? `₹${totalSeasonal}` : '—'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || totalPages <= 1} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-md bg-warm-100 dark:bg-[#2e2d2b] text-warm-600 dark:text-warm-300 disabled:opacity-30"><ChevronLeft size={13} /> Prev</button>
          <div className="flex items-center gap-2">
            <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }} className="text-xs text-warm-700 dark:text-warm-200 bg-white dark:bg-[#1a1917] border border-warm-200 dark:border-[#2e2d2b] rounded-md px-2 py-1.5 outline-none">
              {[10, 25, 31, 50].map(n => <option key={n} value={n}>{n}/pg</option>)}
            </select>
            <span className="text-[11px] text-warm-400">{totalPages > 1 ? `Page ${page} of ${totalPages}` : `${rowData.length} days`}</span>
          </div>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-md bg-warm-100 dark:bg-[#2e2d2b] text-warm-600 dark:text-warm-300 disabled:opacity-30">Next <ChevronRight size={13} /></button>
        </div>
      </div>
    </div>
  );
}
