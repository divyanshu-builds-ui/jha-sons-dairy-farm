import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Printer, Calendar, ChevronLeft, ChevronRight, IndianRupee, Check, X, AlertTriangle, BookOpen, Download, Info } from 'lucide-react';
import { db, collection, getDocs, addDoc, doc, getDoc, setDoc, query, where } from '../../services/firebase';
import { formatPrice } from '../../utils/price';
import { jsPDF } from 'jspdf';
import { TableSkeleton } from '../../components/LoadingSkeleton';


export default function Ledger() {
  const [retailers, setRetailers] = useState([]);
  const [selectedRetailer, setSelectedRetailer] = useState('');
  const [entries, setEntries] = useState([]);
  const [allEntries, setAllEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState('All');
  const [search, setSearch] = useState({ retailerInput: '', showList: false, dateSearch: '' });
  const [perPage, setPerPage] = useState(25);
  const [page, setPage] = useState(1);
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setDate(1);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [toDate, setToDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });

  const [showPayModal, setShowPayModal] = useState(false);
  const [showBalModal, setShowBalModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('Payment collected');
  const [balAmount, setBalAmount] = useState('');
  const [paying, setPaying] = useState(false);
  const [toast, setToast] = useState('');
  const [balConfirmStep, setBalConfirmStep] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);
  const [dueList, setDueList] = useState([]);

  useEffect(() => { fetchRetailers(); }, []);
  useEffect(() => { if (selectedRetailer) fetchLedger(); }, [selectedRetailer, fromDate, toDate]);

  const fetchRetailers = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'retailer')));
      const list = snap.docs.map(d => ({ phone: d.id, ...d.data() }));
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setRetailers(list);
      const areasDoc = await getDoc(doc(db, 'settings', 'areas'));
      if (areasDoc.exists()) setAreas(areasDoc.data().list || []);
      // Fetch balances for dues overview
      const balSnap = await getDocs(collection(db, 'retailer_balances'));
      const dues = balSnap.docs.filter(d => (d.data().balance || 0) > 0).map(d => {
        const ret = list.find(r => r.phone === d.id);
        return { phone: d.id, name: ret?.name || d.id, area: ret?.area || '', balance: d.data().balance };
      }).sort((a, b) => b.balance - a.balance);
      setDueList(dues);
    } catch (err) {}
    setLoading(false);
  };

  const fetchLedger = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'ledger'), where('retailerId', '==', selectedRetailer)));
      setAllEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {}
  };

  // Opening balance (before fromDate)
  const openingBalance = (() => {
    const from = new Date(fromDate + 'T00:00:00');
    let bal = 0;
    allEntries.forEach(e => {
      if (new Date(e.createdAt) < from) {
        if (e.type === 'debit') bal += (e.amount || 0);
        else bal -= (e.amount || 0);
      }
    });
    return bal;
  })();

  // Build daily rows
  const dailyRows = (() => {
    const from = new Date(fromDate + 'T00:00:00');
    const to = new Date(toDate + 'T00:00:00');
    const rows = [];
    let prevClosing = openingBalance;

    // Generate all dates between from and to (inclusive)
    const totalDays = Math.round((to - from) / (1000 * 60 * 60 * 24)) + 1;
    for (let i = 0; i < totalDays; i++) {
      const current = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
      const dateStr = `${String(current.getDate()).padStart(2, '0')}/${String(current.getMonth() + 1).padStart(2, '0')}/${current.getFullYear()}`;
      const dateMatch = current.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      const dayEntries = allEntries.filter(e => e.date === dateMatch);

      let productAmt = 0;
      let seasonalAmt = 0;
      let deposit = 0;
      let openingBalAdj = 0;

      dayEntries.forEach(e => {
        if (e.type === 'debit') {
          if (e.note?.toLowerCase().includes('opening balance')) openingBalAdj += (e.amount || 0);
          else if (e.note?.toLowerCase().includes('seasonal')) seasonalAmt += (e.amount || 0);
          else productAmt += (e.amount || 0);
        } else {
          deposit += (e.amount || 0);
        }
      });

      const opening = prevClosing + openingBalAdj;
      const closing = opening + productAmt + seasonalAmt - deposit;
      rows.push({ dateStr, opening, productAmt, seasonalAmt, deposit, closing });
      prevClosing = closing;
    }
    return rows;
  })();

  // Search filter
  const filteredRows = dailyRows.filter(r => {
    if (!search.dateSearch) return true;
    return r.dateStr.includes(search.dateSearch);
  });

  // Pagination
  const totalPages = Math.ceil(filteredRows.length / perPage);
  const paginatedRows = filteredRows.slice((page - 1) * perPage, page * perPage);
  const showingFrom = filteredRows.length === 0 ? 0 : (page - 1) * perPage + 1;
  const showingTo = Math.min(page * perPage, filteredRows.length);

  const retailerName = retailers.find(r => r.phone === selectedRetailer)?.name || '';

  // Print PDF
  const printPDF = () => {
    const retailer = retailers.find(r => r.phone === selectedRetailer);
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
    const w = pdf.internal.pageSize.getWidth();
    const h = pdf.internal.pageSize.getHeight();
    const m = 12;
    let y = m;
    const tableW = w - (m * 2);
    const fromStr = new Date(fromDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const toStr = new Date(toDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const closingBal = dailyRows.length > 0 ? dailyRows[dailyRows.length - 1].closing : openingBalance;

    // --- Header ---
    pdf.setFillColor(15, 23, 42); pdf.rect(0, 0, w, 22, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(14); pdf.setTextColor(255, 255, 255);
    pdf.text('LUCY GARDEN', m, 10);
    pdf.setFontSize(8); pdf.setFont('helvetica', 'normal');
    pdf.text('Fresh Dairy Supply', m, 15);
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11);
    pdf.text('LEDGER STATEMENT', w - m, 10, { align: 'right' });
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8);
    pdf.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`, w - m, 15, { align: 'right' });
    y = 28;

    // --- Retailer Details Box ---
    pdf.setFillColor(248, 250, 252); pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(m, y, tableW / 2 - 3, 22, 2, 2, 'FD');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(100, 116, 139);
    pdf.text('RETAILER DETAILS', m + 4, y + 5);
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.setTextColor(15, 23, 42);
    pdf.text(retailer?.name || '', m + 4, y + 11);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(71, 85, 105);
    pdf.text(`Phone: ${retailer?.phone || ''}  |  Shop: ${retailer?.shop || '-'}  |  Area: ${retailer?.area || '-'}`, m + 4, y + 17);

    // --- Period & Balance Box ---
    const boxX = m + tableW / 2 + 3;
    pdf.setFillColor(248, 250, 252); pdf.setDrawColor(226, 232, 240);
    pdf.roundedRect(boxX, y, tableW / 2 - 3, 22, 2, 2, 'FD');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(100, 116, 139);
    pdf.text('STATEMENT PERIOD', boxX + 4, y + 5);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(15, 23, 42);
    pdf.text(`${fromStr}  to  ${toStr}`, boxX + 4, y + 11);
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(100, 116, 139);
    pdf.text('CLOSING BALANCE', boxX + 4, y + 16);
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.setTextColor(220, 38, 38);
    pdf.text(`Rs. ${closingBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, boxX + 4, y + 21);

    y += 28;

    // --- Table Header ---
    const rowH = 7;
    const cols = [14, 32, 38, 34, 34, 38, 34, 38];
    pdf.setFillColor(15, 23, 42); pdf.setDrawColor(15, 23, 42); pdf.setLineWidth(0.1);
    pdf.roundedRect(m, y, tableW, rowH + 1, 1, 1, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7.5); pdf.setTextColor(255, 255, 255);
    let cx = m;
    const headers = ['#', 'Date', 'Opening (Rs)', 'Daily (Rs)', 'Seasonal (Rs)', 'Total (Rs)', 'Deposit (Rs)', 'Closing (Rs)'];
    headers.forEach((hdr, i) => { pdf.text(hdr, cx + cols[i] / 2, y + 5, { align: 'center' }); cx += cols[i]; });
    y += rowH + 2;

    // --- Table Rows ---
    dailyRows.forEach((row, i) => {
      if (y + rowH > h - 18) {
        // Footer on current page
        pdf.setFontSize(7); pdf.setTextColor(150, 150, 150); pdf.setFont('helvetica', 'normal');
        pdf.text(`Lucy Garden Ledger - ${retailer?.name || ''}`, m, h - 6);
        pdf.text(`Page ${pdf.getNumberOfPages()}`, w - m, h - 6, { align: 'right' });
        pdf.addPage(); y = m + 5;
      }
      const isEven = i % 2 === 0;
      if (isEven) { pdf.setFillColor(248, 250, 252); pdf.rect(m, y - 1, tableW, rowH, 'F'); }
      const hasActivity = row.productAmt > 0 || row.seasonalAmt > 0 || row.deposit > 0;
      pdf.setDrawColor(230, 230, 230); pdf.setLineWidth(0.1); pdf.line(m, y + rowH - 1.5, m + tableW, y + rowH - 1.5);
      pdf.setFont('helvetica', hasActivity ? 'bold' : 'normal'); pdf.setFontSize(7.5); pdf.setTextColor(30, 41, 59);
      cx = m;
      const vals = [
        `${i + 1}`,
        row.dateStr,
        row.opening.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
        row.productAmt > 0 ? row.productAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-',
        row.seasonalAmt > 0 ? row.seasonalAmt.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-',
        (row.productAmt + row.seasonalAmt) > 0 ? (row.productAmt + row.seasonalAmt).toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-',
        row.deposit > 0 ? row.deposit.toLocaleString('en-IN', { minimumFractionDigits: 2 }) : '-',
        row.closing.toLocaleString('en-IN', { minimumFractionDigits: 2 }),
      ];
      vals.forEach((v, vi) => {
        if (vi === 7) { pdf.setFont('helvetica', 'bold'); pdf.setTextColor(220, 38, 38); }
        else if (vi === 5 && (row.productAmt + row.seasonalAmt) > 0) { pdf.setFont('helvetica', 'bold'); pdf.setTextColor(30, 41, 139); }
        else if (vi === 6 && row.deposit > 0) { pdf.setTextColor(5, 150, 105); }
        else { pdf.setTextColor(30, 41, 59); }
        pdf.text(v, cx + cols[vi] / 2, y + 4, { align: 'center' }); cx += cols[vi];
      });
      y += rowH;
    });

    // --- Summary Row ---
    y += 3;
    pdf.setDrawColor(15, 23, 42); pdf.setLineWidth(0.4); pdf.line(m, y, m + tableW, y); y += 5;
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(15, 23, 42);
    pdf.text(`Opening Balance: Rs. ${openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, m, y);
    pdf.text(`Closing Balance: Rs. ${closingBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, w - m, y, { align: 'right' });

    // --- Footer ---
    pdf.setFontSize(7); pdf.setTextColor(150, 150, 150); pdf.setFont('helvetica', 'normal');
    pdf.text(`Lucy Garden Ledger - ${retailer?.name || ''}`, m, h - 6);
    pdf.text(`Page ${pdf.getNumberOfPages()}`, w - m, h - 6, { align: 'right' });

    pdf.save(`LG_Ledger_${retailerName.replace(/\s/g, '_')}_${fromDate}_to_${toDate}.pdf`);
  };

  // Collect Payment
  const handleCollectPayment = async () => {
    if (!selectedRetailer || paying) return;
    const amt = Number(payAmount) || 0;
    if (amt <= 0) return;
    setPaying(true);
    try {
      await addDoc(collection(db, 'ledger'), {
        retailerId: selectedRetailer, retailer: retailerName,
        amount: amt, type: 'credit', note: payNote || 'Payment collected',
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
        createdAt: new Date().toISOString(),
      });
      const balRef = doc(db, 'retailer_balances', selectedRetailer);
      const balSnap = await getDoc(balRef);
      const curBal = balSnap.exists() ? (balSnap.data().balance || 0) : 0;
      await setDoc(balRef, { balance: curBal - amt, updatedAt: new Date().toISOString() }, { merge: true });
      setShowPayModal(false);
      setPayAmount('');
      setPayNote('Payment collected');
      setLastReceipt({ name: retailerName, phone: selectedRetailer, shop: retailers.find(r => r.phone === selectedRetailer)?.shop || '', amount: amt, note: payNote || 'Payment collected', prevDue: curBal, balanceAfter: curBal - amt });
      setToast(`₹${amt} collected from ${retailerName}`);
      setTimeout(() => setToast(''), 2500);
      fetchLedger();
    } catch (err) { setToast("Payment failed! Check internet."); setTimeout(() => setToast(""), 3000); }
    setPaying(false);
  };

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-4">
      <AnimatePresence>{toast && (<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-[4.5rem] left-4 right-4 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:w-auto z-[100] flex items-center justify-center gap-2 px-4 py-3 rounded-2xl shadow-xl bg-mint-50 dark:bg-mint-900/80 border border-mint-200 dark:border-mint-700 text-mint-800 dark:text-mint-200 backdrop-blur-sm"><Check size={14} strokeWidth={3} /><span className="text-sm font-bold">{toast}</span></motion.div>)}</AnimatePresence>

      {/* Area Tabs */}
      <div className="overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
        <div className="flex gap-1.5 w-max">
          <button onClick={() => setSelectedArea('All')} className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all whitespace-nowrap ${selectedArea === 'All' ? 'bg-royal-700 text-white shadow-sm' : 'bg-gray-100 dark:bg-[#111111] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#222222]'}`}>All Areas {!selectedRetailer && dueList.length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full">{dueList.length}</span>}</button>
          {areas.map(a => (
            <button key={a} onClick={() => setSelectedArea(a)} className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold transition-all whitespace-nowrap ${selectedArea === a ? 'bg-royal-700 text-white shadow-sm' : 'bg-gray-100 dark:bg-[#111111] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#222222]'}`}>{a} {!selectedRetailer && dueList.filter(d => d.area === a).length > 0 && <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full">{dueList.filter(d => d.area === a).length}</span>}</button>
          ))}
        </div>
      </div>

      {/* Retailer Chips */}
      <div className="overflow-x-auto scrollbar-hide -mx-1 px-1 pb-1">
        <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto scrollbar-hide">
          {retailers.filter(r => selectedArea === 'All' || r.area === selectedArea).map(r => (
            <motion.button key={r.phone} whileTap={{ scale: 0.95 }} onClick={() => { setSelectedRetailer(r.phone); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${r.phone === selectedRetailer ? 'bg-royal-600 text-white shadow-md ring-2 ring-royal-300 dark:ring-royal-700' : 'bg-white dark:bg-[#111111] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#222222] hover:border-royal-300'}`}>
              {r.name} <span className="text-[9px] opacity-50 ml-0.5">{r.phone.slice(-4)}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Controls — Date + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <div className="flex items-center gap-2 bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-xl px-3 py-2 shadow-sm flex-1 min-w-0">
          <Calendar size={13} className="text-gray-400 shrink-0" />
          <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} max={toDate} className="text-xs font-bold text-gray-700 dark:text-gray-200 outline-none bg-transparent w-[105px] min-w-0" />
          <span className="text-gray-400 text-[10px]">to</span>
          <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} max={(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })()} className="text-xs font-bold text-gray-700 dark:text-gray-200 outline-none bg-transparent w-[105px] min-w-0" />
        </div>
        <div className="flex gap-1.5 shrink-0">
          <motion.button whileTap={{ scale: 0.93 }} onClick={() => setShowPayModal(true)} disabled={!selectedRetailer} className="flex items-center gap-1 px-3 py-2 bg-mint-600 text-white text-[11px] font-bold rounded-xl shadow-sm disabled:opacity-40"><IndianRupee size={11} /> Collect</motion.button>
          <motion.button whileTap={{ scale: 0.93 }} onClick={() => setShowBalModal(true)} disabled={!selectedRetailer} className="flex items-center gap-1 px-3 py-2 bg-amber-500 text-white text-[11px] font-bold rounded-xl shadow-sm disabled:opacity-40"><IndianRupee size={11} /> Set Bal</motion.button>
          <motion.button whileTap={{ scale: 0.93 }} onClick={printPDF} disabled={!selectedRetailer} className="flex items-center gap-1 px-3 py-2 bg-[#0f172a] text-white text-[11px] font-bold rounded-xl shadow-sm disabled:opacity-40"><Printer size={11} /> PDF</motion.button>
        </div>
      </div>

      {/* Controls Row 2 — Per page + Search */}
      {selectedRetailer && (
        <div className="flex items-center justify-between gap-3">
          <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }} className="text-xs font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-lg px-2 py-1.5 outline-none">
            {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n}/page</option>)}
          </select>
          <div className="relative">
            <input type="text" placeholder="Search date..." value={search.dateSearch} onChange={e => { setSearch(prev => ({ ...prev, dateSearch: e.target.value })); setPage(1); }} className="text-xs bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-xl px-3 py-2 pl-7 pr-8 outline-none focus:border-royal-300 w-[140px] dark:text-white" />
            <svg className="absolute left-2 top-2.5 text-gray-400" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            {search.dateSearch && <button onClick={() => { setSearch(prev => ({ ...prev, dateSearch: '' })); setPage(1); }} className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-200 dark:bg-[#222222] rounded-full flex items-center justify-center hover:bg-gray-300"><X size={8} className="text-gray-500" /></button>}
          </div>
        </div>
      )}

      {/* Selected Retailer Info + Balance */}
      {selectedRetailer && (
        <div className="flex items-center justify-between bg-royal-50 dark:bg-royal-900/20 border border-royal-200 dark:border-royal-800 rounded-xl px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-royal-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">{retailerName?.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
            <div>
              <p className="text-sm font-bold text-gray-800 dark:text-white leading-tight">{retailerName}</p>
              <p className="text-[10px] text-gray-400">{selectedRetailer} • {retailers.find(r => r.phone === selectedRetailer)?.area || ''}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-red-400 font-bold uppercase tracking-wide">Due</p>
            <p className="text-lg font-black text-red-600 dark:text-red-400 leading-tight">₹{(dailyRows.length > 0 ? dailyRows[dailyRows.length - 1].closing : openingBalance).toLocaleString('en-IN')}</p>
          </div>
        </div>
      )}

      {/* Dues Overview when no retailer selected */}
      {!selectedRetailer && (
        <div className="space-y-4">
          {dueList.length > 0 ? (
            <>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 text-center">
                <p className="text-xs text-red-400 font-bold uppercase">Total Pending Dues</p>
                <p className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">{formatPrice(dueList.filter(d => selectedArea === 'All' || d.area === selectedArea).reduce((s, d) => s + d.balance, 0))}</p>
                <p className="text-xs text-red-400 mt-1">{dueList.filter(d => selectedArea === 'All' || d.area === selectedArea).length} retailers with pending balance</p>
              </div>
              <div className="card !p-0 overflow-hidden">
                <div className="px-4 py-3 bg-gradient-to-r from-[#0f172a] to-[#1e293b] flex items-center justify-between">
                  <p className="text-sm font-bold text-white">Pending Dues {selectedArea !== 'All' && `• ${selectedArea}`}</p>
                  <p className="text-xs text-gray-400">{dueList.filter(d => selectedArea === 'All' || d.area === selectedArea).length} retailers</p>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[400px] overflow-y-auto">
                  {dueList.filter(d => selectedArea === 'All' || d.area === selectedArea).map((d, i) => (
                    <motion.div key={d.phone} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.02 * i }}
                      onClick={() => { setSelectedRetailer(d.phone); setPage(1); }}
                      className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-red-50/50 dark:hover:bg-red-900/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center text-red-500 font-bold text-[10px]">{i + 1}</div>
                        <div>
                          <p className="text-sm font-bold text-gray-800 dark:text-white">{d.name}</p>
                          <p className="text-[10px] text-gray-400">{d.area}</p>
                        </div>
                      </div>
                      <p className="text-sm font-extrabold text-red-600">{formatPrice(d.balance)}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <BookOpen size={32} className="text-gray-200 dark:text-[#444444] mx-auto mb-3" />
              <p className="text-sm font-bold text-gray-400 dark:text-gray-500">No pending dues</p>
              <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">All retailers are clear. Select one above to view ledger.</p>
            </div>
          )}
        </div>
      )}

      {selectedRetailer && (<>
      {/* Summary */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-lg px-3 py-2 text-center">
          <p className="text-[9px] text-gray-400 font-bold uppercase">Opening</p>
          <p className="text-sm font-bold text-gray-700 dark:text-gray-200">₹{openingBalance.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-royal-50 dark:bg-royal-900/30 border border-royal-100 dark:border-royal-800 rounded-lg px-3 py-2 text-center">
          <p className="text-[9px] text-royal-500 font-bold uppercase">Closing</p>
          <p className="text-sm font-bold text-royal-700 dark:text-royal-300">₹{(dailyRows.length > 0 ? dailyRows[dailyRows.length - 1].closing : openingBalance).toLocaleString('en-IN')}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#222222] overflow-hidden max-w-[calc(100vw-2rem)] lg:max-w-none">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[580px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#0f172a] text-white">
                <th className="px-2 py-3 text-center text-[11px] font-bold w-[30px]">SI</th>
                <th className="px-2 py-3 text-center text-[11px] font-bold w-[70px]">Date</th>
                <th className="px-2 py-3 text-center text-[11px] font-bold">Opening</th>
                <th className="px-2 py-3 text-center text-[11px] font-bold">Daily</th>
                <th className="px-2 py-3 text-center text-[11px] font-bold">Seasonal</th>
                <th className="px-2 py-3 text-center text-[11px] font-bold">Total</th>
                <th className="px-2 py-3 text-center text-[11px] font-bold">Deposit</th>
                <th className="px-2 py-3 text-center text-[11px] font-bold">Closing</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, i) => (
                <tr key={row.dateStr} className={`${row.productAmt > 0 || row.deposit > 0 ? 'bg-white dark:bg-[#111111]' : 'bg-gray-50/30 dark:bg-[#1a1a1a]/30'} border-b border-gray-100 dark:border-[#222222] hover:bg-royal-50/20 dark:hover:bg-[#1a1a1a]/50`}>
                  <td className="px-2 py-2.5 text-center text-sm text-gray-400 dark:text-gray-500">{showingFrom + i}</td>
                  <td className="px-2 py-2.5 text-center text-xs font-bold text-gray-800 dark:text-white">{row.dateStr}</td>
                  <td className="px-2 py-2.5 text-center text-xs text-gray-600 dark:text-gray-300">{formatPrice(row.opening)}</td>
                  <td className="px-2 py-2.5 text-center text-xs font-bold text-red-600">{row.productAmt > 0 ? formatPrice(row.productAmt) : '—'}</td>
                  <td className="px-2 py-2.5 text-center text-xs font-bold text-amber-600">{row.seasonalAmt > 0 ? formatPrice(row.seasonalAmt) : '—'}</td>
                  <td className="px-2 py-2.5 text-center text-xs font-black text-royal-700 dark:text-royal-300">{(row.productAmt + row.seasonalAmt) > 0 ? formatPrice(row.productAmt + row.seasonalAmt) : '—'}</td>
                  <td className="px-2 py-2.5 text-center text-xs font-bold text-mint-700">{row.deposit > 0 ? formatPrice(row.deposit) : '—'}</td>
                  <td className="px-2 py-2.5 text-center text-xs font-black text-gray-800 dark:text-white">{formatPrice(row.closing)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">Showing {showingFrom} to {showingTo} of {filteredRows.length} entries</p>
        <div className="flex items-center gap-2">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className={`p-2 rounded-lg border ${page === 1 ? 'border-gray-100 text-gray-300' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            <ChevronLeft size={16} />
          </motion.button>
          <span className="text-sm font-bold text-gray-700">Page {page} of {totalPages || 1}</span>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className={`p-2 rounded-lg border ${page >= totalPages ? 'border-gray-100 text-gray-300' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            <ChevronRight size={16} />
          </motion.button>
        </div>
      </div>

      </>)}

      {/* Collect Payment Modal */}
      <AnimatePresence>
        {showPayModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowPayModal(false)}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }} className="bg-white dark:bg-[#111111] rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-extrabold text-gray-800 dark:text-white text-lg">Collect Payment</h3>
                  <p className="text-sm text-gray-400">{retailerName}</p>
                </div>
                <button onClick={() => setShowPayModal(false)} className="w-8 h-8 bg-gray-100 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center text-gray-400"><X size={14} /></button>
              </div>

              {/* Current Balance */}
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 mb-4 text-center">
                <p className="text-[10px] text-red-400 font-bold uppercase">Current Due</p>
                <p className="text-xl font-black text-red-600">{formatPrice(dailyRows.length > 0 ? dailyRows[dailyRows.length - 1].closing : openingBalance)}</p>
              </div>

              {/* Amount */}
              <div className="mb-4">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1.5 block">Amount (₹)</label>
                <input type="number" min="0" placeholder="Enter amount" value={payAmount}
                  onChange={e => {
                    const val = Number(e.target.value) || 0;
                    const currentDue = dailyRows.length > 0 ? dailyRows[dailyRows.length - 1].closing : openingBalance;
                    if (val > currentDue) return;
                    setPayAmount(e.target.value);
                  }}
                  onKeyDown={e => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                  className="w-full py-3.5 px-4 text-xl font-bold text-center border border-gray-200 dark:border-[#333333] rounded-xl focus:border-royal-400 focus:outline-none bg-white dark:bg-[#1a1a1a] dark:text-white" />
                {Number(payAmount) > 0 && Number(payAmount) === (dailyRows.length > 0 ? dailyRows[dailyRows.length - 1].closing : openingBalance) && (
                  <p className="text-[10px] text-amber-600 font-bold mt-1 text-center"><AlertTriangle size={12} className="inline text-amber-500" /> Full due amount — balance will become zero</p>
                )}
              </div>

              {/* Note */}
              <div className="mb-5">
                <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1.5 block">Note</label>
                <input type="text" value={payNote} onChange={e => setPayNote(e.target.value)}
                  className="w-full py-2.5 px-4 text-sm border border-gray-200 dark:border-[#333333] rounded-xl focus:border-royal-400 focus:outline-none bg-white dark:bg-[#1a1a1a] dark:text-white" />
              </div>

              {Number(payAmount) > 0 && (
                <p className="text-[11px] text-mint-600 font-bold mb-4 text-center">Balance after payment: {formatPrice((dailyRows.length > 0 ? dailyRows[dailyRows.length - 1].closing : openingBalance) - (Number(payAmount) || 0))}</p>
              )}

              <motion.button whileTap={{ scale: 0.97 }} onClick={handleCollectPayment} disabled={paying || !(Number(payAmount) > 0)} className="w-full bg-mint-600 text-white font-bold py-3.5 rounded-xl shadow-md text-sm disabled:opacity-50">
                {paying ? <span className="flex items-center justify-center gap-2"><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />Processing...</span> : 'Collect Payment'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Set Opening Balance Modal */}
      <AnimatePresence>
        {showBalModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => { setShowBalModal(false); setBalConfirmStep(false); }}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }} className="bg-white dark:bg-[#111111] rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="font-extrabold text-gray-800 dark:text-white text-lg">Set Opening Balance</h3>
                  <p className="text-sm text-gray-400">{retailerName}</p>
                </div>
                <button onClick={() => { setShowBalModal(false); setBalConfirmStep(false); }} className="w-8 h-8 bg-gray-100 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center text-gray-400"><X size={14} /></button>
              </div>

              {!balConfirmStep ? (<>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 mb-4">
                  <p className="text-[10px] text-amber-600 font-bold"><AlertTriangle size={12} className="inline text-amber-500" /> One-time use: Set previous pending amount from offline records. This directly overwrites the current balance.</p>
                </div>

                <div className="bg-gray-50 dark:bg-[#1a1a1a]/50 rounded-xl px-4 py-2 mb-3 text-center">
                  <p className="text-[10px] text-gray-400">Current Balance</p>
                  <p className="text-base font-black text-red-600">{formatPrice(dailyRows.length > 0 ? dailyRows[dailyRows.length - 1].closing : openingBalance)}</p>
                </div>

                <div className="mb-5">
                  <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1.5 block">Pending Amount (₹)</label>
                  <input type="number" min="0" placeholder="Enter due amount" value={balAmount}
                    onChange={e => setBalAmount(e.target.value)}
                    onKeyDown={e => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                    className="w-full py-3.5 px-4 text-xl font-bold text-center border border-gray-200 dark:border-[#333333] rounded-xl focus:border-amber-400 focus:outline-none bg-white dark:bg-[#1a1a1a] dark:text-white" />
                </div>

                <motion.button whileTap={{ scale: 0.97 }} onClick={() => {
                  const amt = Number(balAmount) || 0;
                  if (amt < 0) return;
                  setBalConfirmStep(true);
                }} disabled={!(Number(balAmount) >= 0)} className="w-full bg-amber-500 text-white font-bold py-3.5 rounded-xl shadow-md text-sm disabled:opacity-50">
                  Set Balance
                </motion.button>
              </>) : (
                /* Inline Confirmation Step */
                <div>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 bg-amber-50 dark:bg-amber-900/30 rounded-xl flex items-center justify-center shrink-0">
                      <AlertTriangle size={18} className="text-amber-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800 dark:text-white">Are you sure?</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Set {retailerName}'s balance to ₹{Number(balAmount) || 0}? This will overwrite the current balance.</p>
                    </div>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-3 py-2.5 mb-4">
                    <p className="text-[10px] text-blue-600 dark:text-blue-400 font-bold"><Info size={12} className="inline text-blue-500" /> This amount will reflect as today's opening balance entry. It won't appear under Product or Seasonal columns.</p>
                  </div>
                  <div className="flex gap-3">
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => setBalConfirmStep(false)}
                      className="flex-1 py-3 rounded-xl font-bold text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#1a1a1a]">
                      Back
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={async () => {
                      const amt = Number(balAmount) || 0;
                      setPaying(true);
                      const balRef = doc(db, 'retailer_balances', selectedRetailer);
                      await setDoc(balRef, { balance: amt, updatedAt: new Date().toISOString() }, { merge: true });
                      if (amt > 0) {
                        await addDoc(collection(db, 'ledger'), {
                          retailerId: selectedRetailer, retailer: retailerName,
                          amount: amt, type: 'debit', note: 'Opening balance (offline transfer)',
                          date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                          createdAt: new Date().toISOString(),
                        });
                      }
                      setShowBalModal(false); setBalAmount(''); setBalConfirmStep(false);
                      setToast(`Balance set: ₹${amt} for ${retailerName}`);
                      setTimeout(() => setToast(''), 2500);
                      fetchLedger();
                      setPaying(false);
                    }} disabled={paying} className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-amber-500 shadow-md disabled:opacity-50">
                      {paying ? 'Setting...' : 'Confirm'}
                    </motion.button>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Receipt Download Popup */}
      <AnimatePresence>
        {lastReceipt && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setLastReceipt(null)}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }} className="bg-white dark:bg-[#111111] rounded-3xl p-6 w-full max-w-xs shadow-2xl text-center" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-12 bg-mint-50 dark:bg-mint-900/30 rounded-full flex items-center justify-center mx-auto mb-3">
                <Check size={22} className="text-mint-600" />
              </div>
              <h3 className="font-extrabold text-gray-800 dark:text-white text-lg">Payment Collected!</h3>
              <p className="text-2xl font-black text-mint-600 mt-2">Rs. {lastReceipt.amount.toLocaleString('en-IN')}</p>
              <p className="text-sm text-gray-500 mt-1">from {lastReceipt.name}</p>
              <p className="text-xs text-gray-400 mt-1">Balance: Rs. {lastReceipt.balanceAfter.toLocaleString('en-IN')}</p>
              <div className="flex gap-2 mt-5">
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => setLastReceipt(null)} className="flex-1 py-2.5 rounded-xl font-bold text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#1a1a1a]">Close</motion.button>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => {
                  const r = lastReceipt;
                  const receiptPdf = new jsPDF({ unit: 'mm', format: [80, 150], orientation: 'portrait' });
                  const rw = 80; const rm = 4; let ry = 6;
                  const recDate = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                  const recTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
                  receiptPdf.setFont('helvetica', 'bold'); receiptPdf.setFontSize(10); receiptPdf.setTextColor(0);
                  receiptPdf.text('LUCY GARDEN', rw / 2, ry, { align: 'center' });
                  receiptPdf.setFont('helvetica', 'normal'); receiptPdf.setFontSize(7);
                  receiptPdf.text('Fresh Dairy Supply | Ph: 9939079107', rw / 2, ry + 4, { align: 'center' });
                  ry += 8; receiptPdf.setDrawColor(0); receiptPdf.setLineWidth(0.3); receiptPdf.line(rm, ry, rw - rm, ry); ry += 4;
                  receiptPdf.setFont('helvetica', 'bold'); receiptPdf.setFontSize(9);
                  receiptPdf.text('PAYMENT RECEIPT', rw / 2, ry, { align: 'center' }); ry += 6;
                  receiptPdf.setFont('helvetica', 'normal'); receiptPdf.setFontSize(8);
                  receiptPdf.text(`Date: ${recDate}`, rm, ry); receiptPdf.text(recTime, rw - rm, ry, { align: 'right' }); ry += 5;
                  receiptPdf.setDrawColor(180); receiptPdf.setLineDashPattern([1, 1], 0); receiptPdf.line(rm, ry, rw - rm, ry); receiptPdf.setLineDashPattern([], 0); ry += 4;
                  receiptPdf.setFont('helvetica', 'bold'); receiptPdf.setFontSize(8);
                  receiptPdf.text('Received From:', rm, ry); ry += 4;
                  receiptPdf.setFontSize(10); receiptPdf.text(r.name, rm, ry); ry += 4;
                  receiptPdf.setFont('helvetica', 'normal'); receiptPdf.setFontSize(7); receiptPdf.setTextColor(80);
                  receiptPdf.text(`Phone: ${r.phone}`, rm, ry);
                  if (r.shop) receiptPdf.text(r.shop, rw - rm, ry, { align: 'right' });
                  ry += 5; receiptPdf.setTextColor(0); receiptPdf.setDrawColor(180); receiptPdf.setLineDashPattern([1, 1], 0); receiptPdf.line(rm, ry, rw - rm, ry); receiptPdf.setLineDashPattern([], 0); ry += 5;
                  receiptPdf.setFont('helvetica', 'bold'); receiptPdf.setFontSize(8);
                  receiptPdf.text('Amount Received:', rm, ry); ry += 6;
                  receiptPdf.setFontSize(16);
                  receiptPdf.text(`Rs. ${r.amount.toLocaleString('en-IN')}`, rw / 2, ry, { align: 'center' }); ry += 7;
                  receiptPdf.setFont('helvetica', 'normal'); receiptPdf.setFontSize(7); receiptPdf.setTextColor(80);
                  receiptPdf.text(`Note: ${r.note}`, rm, ry); ry += 5;
                  receiptPdf.setTextColor(0); receiptPdf.setDrawColor(180); receiptPdf.setLineDashPattern([1, 1], 0); receiptPdf.line(rm, ry, rw - rm, ry); receiptPdf.setLineDashPattern([], 0); ry += 4;
                  receiptPdf.setFont('helvetica', 'normal'); receiptPdf.setFontSize(7);
                  receiptPdf.text(`Previous Due: Rs. ${r.prevDue.toLocaleString('en-IN')}`, rm, ry); ry += 4;
                  receiptPdf.setFont('helvetica', 'bold');
                  receiptPdf.text(`Balance After: Rs. ${r.balanceAfter.toLocaleString('en-IN')}`, rm, ry); ry += 6;
                  receiptPdf.setDrawColor(0); receiptPdf.setLineWidth(0.3); receiptPdf.line(rm, ry, rw - rm, ry); ry += 4;
                  receiptPdf.setFont('helvetica', 'normal'); receiptPdf.setFontSize(6); receiptPdf.setTextColor(120);
                  receiptPdf.text('Thank you for your payment!', rw / 2, ry, { align: 'center' }); ry += 3;
                  receiptPdf.text(`Generated: ${recDate} at ${recTime}`, rw / 2, ry, { align: 'center' });
                  receiptPdf.save(`LG_Receipt_${r.name.replace(/\s/g, '_')}_${recDate.replace(/[\s,]/g, '')}.pdf`);
                  setLastReceipt(null);
                }} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm text-white bg-[#0f172a] shadow-md">
                  <Download size={13} /> Receipt
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
