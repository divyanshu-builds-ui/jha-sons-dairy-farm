import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Printer, ChevronLeft, ChevronRight } from 'lucide-react';
import { db, collection, getDocs, query, where } from '../../services/firebase';
import { formatPrice } from '../../utils/price';
import { jsPDF } from 'jspdf';
import { drawText } from '../../utils/pdfHelper';
import { TableSkeleton } from '../../components/LoadingSkeleton';

export default function MyLedger() {
  const [allEntries, setAllEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
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

  const user = JSON.parse(localStorage.getItem('lg_user') || '{}');

  useEffect(() => { fetchLedger(); }, [fromDate, toDate]);

  const fetchLedger = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'ledger'), where('retailerId', '==', user.phone)));
      setAllEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {}
    setLoading(false);
  };

  // Opening balance
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

  // Search
  const filteredRows = dailyRows.filter(r => !search || r.dateStr.includes(search));

  // Pagination
  const totalPages = Math.ceil(filteredRows.length / perPage);
  const paginatedRows = filteredRows.slice((page - 1) * perPage, page * perPage);
  const showingFrom = filteredRows.length === 0 ? 0 : (page - 1) * perPage + 1;
  const showingTo = Math.min(page * perPage, filteredRows.length);

  // Print PDF
  const printPDF = () => {
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
    drawText(pdf, user.name || '', m + 4, y + 11, { bold: true, size: 10, color: [15, 23, 42] });
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(71, 85, 105);
    pdf.text(`Phone: ${user.phone || ''}  |  Shop: ${user.shop || '-'}  |  Area: ${user.area || '-'}`, m + 4, y + 17);

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
    pdf.setFillColor(15, 23, 42);
    pdf.roundedRect(m, y, tableW, rowH + 1, 1, 1, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7.5); pdf.setTextColor(255, 255, 255);
    let cx = m;
    const headers = ['#', 'Date', 'Opening (Rs)', 'Daily (Rs)', 'Seasonal (Rs)', 'Total (Rs)', 'Deposit (Rs)', 'Closing (Rs)'];
    headers.forEach((hdr, i) => { pdf.text(hdr, cx + cols[i] / 2, y + 5, { align: 'center' }); cx += cols[i]; });
    y += rowH + 2;

    // --- Table Rows ---
    dailyRows.forEach((row, i) => {
      if (y + rowH > h - 18) {
        pdf.setFontSize(7); pdf.setTextColor(150, 150, 150); pdf.setFont('helvetica', 'normal');
        pdf.text(`Lucy Garden Ledger - ${user.name || ''}`, m, h - 6);
        pdf.text(`Page ${pdf.getNumberOfPages()}`, w - m, h - 6, { align: 'right' });
        pdf.addPage(); y = m + 5;
      }
      if (i % 2 === 0) { pdf.setFillColor(248, 250, 252); pdf.rect(m, y - 1, tableW, rowH, 'F'); }
      pdf.setDrawColor(230, 230, 230); pdf.setLineWidth(0.1); pdf.line(m, y + rowH - 1.5, m + tableW, y + rowH - 1.5);
      const hasActivity = row.productAmt > 0 || row.seasonalAmt > 0 || row.deposit > 0;
      pdf.setFont('helvetica', hasActivity ? 'bold' : 'normal'); pdf.setFontSize(7.5); pdf.setTextColor(30, 41, 59);
      cx = m;
      const vals = [
        `${i + 1}`, row.dateStr,
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

    // --- Summary ---
    y += 3;
    pdf.setDrawColor(15, 23, 42); pdf.setLineWidth(0.4); pdf.line(m, y, m + tableW, y); y += 5;
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(15, 23, 42);
    pdf.text(`Opening Balance: Rs. ${openingBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, m, y);
    pdf.text(`Closing Balance: Rs. ${closingBal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, w - m, y, { align: 'right' });

    // --- Footer ---
    pdf.setFontSize(7); pdf.setTextColor(150, 150, 150); pdf.setFont('helvetica', 'normal');
    pdf.text(`Lucy Garden Ledger - ${user.name || ''}`, m, h - 6);
    pdf.text(`Page ${pdf.getNumberOfPages()}`, w - m, h - 6, { align: 'right' });

    pdf.save(`LG_Ledger_${user.name?.replace(/\s/g, '_')}_${fromDate}_to_${toDate}.pdf`);
  };

  if (loading) return <TableSkeleton />;

  return (
    <div className="pb-24 space-y-4 max-w-3xl mx-auto">
      <h2 className="text-2xl font-extrabold text-gray-800 dark:text-white sr-only">My Ledger</h2>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-2xl px-4 py-2.5 shadow-sm">
          <Calendar size={14} className="text-gray-400" />
          <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} max={toDate} className="text-sm font-bold text-gray-700 dark:text-gray-200 outline-none bg-transparent" />
          <span className="text-gray-400 text-xs">to</span>
          <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} max={(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })()} className="text-sm font-bold text-gray-700 dark:text-gray-200 outline-none bg-transparent" />
        </div>
        <motion.button whileTap={{ scale: 0.93 }} onClick={printPDF} className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-[#0f172a] to-[#1e293b] text-white text-xs font-bold rounded-2xl ml-auto shadow-md"><Printer size={13} /> Print</motion.button>
      </div>

      {/* Per page + Search */}
      <div className="flex items-center justify-between gap-3">
        <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }} className="text-sm font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-lg px-2 py-1.5 outline-none">
          {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n} per page</option>)}
        </select>
        <div className="relative">
          <input type="text" placeholder="Search date..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="text-sm bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-xl px-3 py-2 pl-8 outline-none focus:border-royal-300 w-[150px] dark:text-white" />
          <svg className="absolute left-2.5 top-2.5 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#222222] p-4 text-center shadow-sm"><p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">Opening</p>
          <p className="text-xl font-black text-gray-800 dark:text-white">-{formatPrice(openingBalance)}</p>
        </div>
        <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#222222] p-4 text-center shadow-sm"><p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase">Closing</p>
          <p className={`text-lg font-black ${dailyRows.length > 0 && dailyRows[dailyRows.length - 1].closing > 0 ? 'text-red-600' : 'text-mint-700'}`}>
            -{formatPrice(dailyRows.length > 0 ? dailyRows[dailyRows.length - 1].closing : openingBalance)}
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#222222] overflow-hidden shadow-sm max-w-[calc(100vw-2rem)] lg:max-w-none">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[550px]">
            <thead>
              <tr className="bg-[#0f172a] text-white">
                <th className="px-2 py-3 text-center text-xs font-bold w-[35px]">SI</th>
                <th className="px-2 py-3 text-center text-xs font-bold w-[75px]">Date</th>
                <th className="px-2 py-3 text-center text-xs font-bold">Opening</th>
                <th className="px-2 py-3 text-center text-xs font-bold">Daily</th>
                <th className="px-2 py-3 text-center text-xs font-bold">Seasonal</th>
                <th className="px-2 py-3 text-center text-xs font-bold">Total</th>
                <th className="px-2 py-3 text-center text-xs font-bold">Deposit</th>
                <th className="px-2 py-3 text-center text-xs font-bold">Closing</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRows.map((row, i) => (
                <tr key={row.dateStr} className={`${row.productAmt > 0 || row.deposit > 0 ? 'bg-white dark:bg-[#111111]' : 'bg-gray-50/30 dark:bg-[#111111]/50'} border-b border-gray-100 dark:border-[#222222]`}>
                  <td className="px-2 py-2.5 text-center text-xs text-gray-400 dark:text-gray-500">{showingFrom + i}</td>
                  <td className="px-2 py-2.5 text-center text-xs font-bold text-gray-800 dark:text-white">{row.dateStr}</td>
                  <td className="px-2 py-2.5 text-center text-xs text-gray-600 dark:text-gray-300">-{formatPrice(row.opening)}</td>
                  <td className="px-2 py-2.5 text-center text-xs font-bold text-red-600">{row.productAmt > 0 ? formatPrice(row.productAmt) : '—'}</td>
                  <td className="px-2 py-2.5 text-center text-xs font-bold text-amber-600">{row.seasonalAmt > 0 ? formatPrice(row.seasonalAmt) : '—'}</td>
                  <td className="px-2 py-2.5 text-center text-xs font-black text-royal-700 dark:text-royal-300">{(row.productAmt + row.seasonalAmt) > 0 ? formatPrice(row.productAmt + row.seasonalAmt) : '—'}</td>
                  <td className="px-2 py-2.5 text-center text-xs font-bold text-mint-700">{row.deposit > 0 ? formatPrice(row.deposit) : '—'}</td>
                  <td className="px-2 py-2.5 text-center text-xs font-black text-gray-800 dark:text-white">-{formatPrice(row.closing)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-gray-500 dark:text-gray-400">Showing {showingFrom} to {showingTo} of {filteredRows.length} entries</p>
        <div className="flex items-center gap-2">
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className={`p-2 rounded-lg border ${page === 1 ? 'border-gray-100 dark:border-[#222222] text-gray-300 dark:text-gray-600' : 'border-gray-200 dark:border-[#222222] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'}`}>
            <ChevronLeft size={16} />
          </motion.button>
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Page {page}/{totalPages || 1}</span>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
            className={`p-2 rounded-lg border ${page >= totalPages ? 'border-gray-100 dark:border-[#222222] text-gray-300 dark:text-gray-600' : 'border-gray-200 dark:border-[#222222] text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-[#1a1a1a]'}`}>
            <ChevronRight size={16} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
