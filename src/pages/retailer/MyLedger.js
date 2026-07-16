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
  const ALL_SEASONAL_KEYS = useMemo(() => { const sm = []; products.filter(p => p.type === 'seasonal').forEach(p => sm.push(p.name)); return sm; }, [products]);

  const rowData = useMemo(() => { const rows = []; let prev = openingBalance; allDates.forEach(date => { const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`; const dayData = ordersDayData[key] || { items: {}, deposit: 0 }; let dailyAmt = 0, seasonalAmt = 0; Object.entries(dayData.items).forEach(([name, qty]) => { const amt = qty * (priceMap[name] || 0); if (ALL_SEASONAL_KEYS.includes(name)) seasonalAmt += amt; else dailyAmt += amt; }); const deposit = dayData.deposit || 0; const closing = prev + dailyAmt + seasonalAmt - deposit; rows.push({ date, dateStr: `${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')}/${date.getFullYear()}`, items: dayData.items, dailyAmt, seasonalAmt, deposit, closing }); prev = closing; }); return rows; }, [allDates, ordersDayData, openingBalance, priceMap, ALL_SEASONAL_KEYS]);

  const closingBal = rowData.length > 0 ? rowData[rowData.length - 1].closing : openingBalance;
  const totalDaily = rowData.reduce((s, r) => s + r.dailyAmt, 0);
  const totalDeposit = rowData.reduce((s, r) => s + r.deposit, 0);
  const totalPages = Math.ceil(rowData.length / perPage);
  const pagedRows = rowData.slice((page - 1) * perPage, page * perPage);

  if (loading) return <TableSkeleton />;

  return (
    <div className="pb-24 space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl px-3 py-2">
          <Calendar size={14} className="text-gray-400" />
          <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} max={toDate} className="text-sm font-bold text-gray-700 dark:text-gray-200 outline-none bg-transparent w-[120px]" />
          <span className="text-gray-400 text-[10px]">to</span>
          <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} max={todayStr} className="text-sm font-bold text-gray-700 dark:text-gray-200 outline-none bg-transparent w-[120px]" />
        </div>
        <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }} className="ml-auto text-xs font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-lg px-2 py-1.5 outline-none">
          {[10, 25, 31, 50].map(n => <option key={n} value={n}>{n}/page</option>)}
        </select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl px-2 py-2.5 text-center"><p className="text-[9px] text-gray-400 font-bold uppercase">Opening</p><p className="text-sm font-black text-gray-800 dark:text-white mt-0.5">{formatPrice(openingBalance)}</p></div>
        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl px-2 py-2.5 text-center"><p className="text-[9px] text-gray-400 font-bold uppercase">Daily</p><p className="text-sm font-black text-gray-800 dark:text-white mt-0.5">{formatPrice(totalDaily)}</p></div>
        <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl px-2 py-2.5 text-center"><p className="text-[9px] text-gray-400 font-bold uppercase">Paid</p><p className="text-sm font-black text-mint-600 mt-0.5">{formatPrice(totalDeposit)}</p></div>
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-2 py-2.5 text-center"><p className="text-[9px] text-red-400 font-bold uppercase">Due</p><p className="text-sm font-black text-red-600 mt-0.5">{formatPrice(closingBal)}</p></div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] overflow-hidden max-w-[calc(100vw-2rem)]">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="border-collapse w-full min-w-[700px]">
            <thead className="sticky top-0 z-30">
              <tr className="bg-[#0f172a]">
                <th rowSpan={2} className="sticky left-0 z-20 bg-[#0f172a] px-2 py-3 text-center text-white font-bold text-xs border-r border-white/10 w-[72px]">Date</th>
                {PRODUCT_GROUPS.map((g, gi) => <th key={gi} colSpan={g.items.length} className="px-1 py-3 text-center font-extrabold text-white text-xs border-r border-white/10">{groupCodes[g.group] || g.group}</th>)}
                <th rowSpan={2} className="px-2 py-3 text-center text-white font-bold text-xs border-r border-white/10 w-[70px]">TOTAL</th>
                <th rowSpan={2} className="px-2 py-3 text-center text-white font-bold text-xs border-r border-white/10 w-[70px]">PAID</th>
                <th rowSpan={2} className="sticky right-0 z-20 bg-[#0f172a] px-2 py-3 text-center text-white font-bold text-xs w-[70px] border-l border-white/10">DUE</th>
              </tr>
              <tr className="bg-[#1e293b]">
                {PRODUCT_GROUPS.flatMap(g => g.items).map(item => <th key={item.key} className="px-1 py-2 text-center font-bold text-gray-300 border-r border-white/5 min-w-[40px] text-[10px]">{item.label}<br/><span className="text-[9px] font-medium text-gray-400">₹{item.price}</span></th>)}
              </tr>
            </thead>
            <tbody>
              {pagedRows.map((row, i) => (
                <tr key={row.dateStr} className={`${row.dailyAmt > 0 || row.deposit > 0 ? 'bg-white dark:bg-[#111]' : i % 2 === 0 ? 'bg-white dark:bg-[#111]' : 'bg-gray-50/50 dark:bg-[#1a1a1a]/30'} hover:bg-royal-50/30 dark:hover:bg-royal-900/20`}>
                  <td className="sticky left-0 z-10 bg-inherit px-2 py-2.5 text-center text-[11px] font-bold text-gray-600 dark:text-gray-400 border-b border-r border-gray-200 dark:border-[#222] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)] whitespace-nowrap">{row.dateStr}</td>
                  {PRODUCT_GROUPS.flatMap(g => g.items).map(item => { const q = row.items[item.key] || 0; return <td key={item.key} className="px-1 py-2.5 text-center border-b border-r border-gray-100 dark:border-[#222]">{q > 0 ? <span className="font-black text-[13px] text-royal-700 dark:text-royal-300">{q}</span> : <span className="text-gray-200 dark:text-gray-600">·</span>}</td>; })}
                  <td className="px-2 py-2.5 text-center border-b border-r border-gray-200 dark:border-[#222]">{row.dailyAmt > 0 ? <span className="font-black text-[12px] text-gray-800 dark:text-white">₹{row.dailyAmt}</span> : <span className="text-gray-200">—</span>}</td>
                  <td className="px-2 py-2.5 text-center border-b border-r border-gray-200 dark:border-[#222]">{row.deposit > 0 ? <span className="font-bold text-[12px] text-mint-700 dark:text-mint-400">₹{row.deposit}</span> : <span className="text-gray-200">—</span>}</td>
                  <td className="sticky right-0 z-10 bg-inherit px-2 py-2.5 text-center border-b border-l border-gray-200 dark:border-[#222] shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.05)]"><span className="font-black text-[12px] text-gray-800 dark:text-white">{row.closing}</span></td>
                </tr>
              ))}
              <tr className="bg-[#0f172a]">
                <td className="sticky left-0 z-20 bg-[#0f172a] px-2 py-2.5 text-center text-xs font-bold text-white border-r border-white/10">TOTAL</td>
                {PRODUCT_GROUPS.flatMap(g => g.items).map(item => { const t = rowData.reduce((s, r) => s + (r.items[item.key] || 0), 0); return <td key={item.key} className="px-1 py-2.5 text-center text-[12px] font-black text-amber-300 border-r border-white/5">{t > 0 ? t : '·'}</td>; })}
                <td className="px-2 py-2.5 text-center text-[12px] font-black text-white border-r border-white/10">{totalDaily > 0 ? `₹${totalDaily}` : '—'}</td>
                <td className="px-2 py-2.5 text-center text-[11px] font-bold text-mint-300 border-r border-white/10">{totalDeposit > 0 ? `₹${totalDeposit}` : '—'}</td>
                <td className="sticky right-0 z-20 bg-[#0f172a] px-2 py-2.5 text-center text-[12px] font-black text-white border-l border-white/10">₹{closingBal}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
      <div className="flex items-center justify-between px-1">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-300 disabled:opacity-30"><ChevronLeft size={14} /> Prev</button>
        <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Page {page} of {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-300 disabled:opacity-30">Next <ChevronRight size={14} /></button>
      </div>)}
    </div>
  );
}
