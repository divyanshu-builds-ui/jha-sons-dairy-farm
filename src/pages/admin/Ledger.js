import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Check, X, ChevronLeft, ChevronRight, RefreshCw, Printer, Download, IndianRupee, AlertTriangle, Edit3, Trash2 } from 'lucide-react';
import { db, collection, getDocs, addDoc, deleteDoc, updateDoc, doc, getDoc, setDoc, query, where, cachedGetDocs } from '../../services/firebase';
import { formatPrice } from '../../utils/price';
import { TableSkeleton } from '../../components/LoadingSkeleton';
import { useConfirm } from '../../components/ConfirmModal';
import { jsPDF } from 'jspdf';
import { drawText, registerHindiFont } from '../../utils/pdfHelper';

export default function Ledger() {
  const confirm = useConfirm();
  const [retailers, setRetailers] = useState([]);
  const [products, setProducts] = useState([]);
  const [viewMode, setViewMode] = useState('summary');
  const [allLedgerEntries, setAllLedgerEntries] = useState([]);
  const [editEntry, setEditEntry] = useState(null);
  const [editAmount, setEditAmount] = useState('');
  const [editNote, setEditNote] = useState('');
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState('All');
  const [selectedRetailer, setSelectedRetailer] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState('');
  const [fromDate, setFromDate] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`; });
  const [toDate, setToDate] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; });
  const [perPage, setPerPage] = useState(31);
  const [page, setPage] = useState(1);
  const [ordersDayData, setOrdersDayData] = useState({});
  const [openingBalance, setOpeningBalance] = useState(0);
  const [groupOrder, setGroupOrder] = useState([]);
  const [groupCodes, setGroupCodes] = useState({});
  const [dueList, setDueList] = useState([]);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showBalModal, setShowBalModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [payNote, setPayNote] = useState('Payment collected');
  const [paying, setPaying] = useState(false);
  const [balAmount, setBalAmount] = useState('');
  const [balConfirmStep, setBalConfirmStep] = useState(false);
  const [payDate, setPayDate] = useState(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; });
  const [balDate, setBalDate] = useState(() => { const d = new Date(); d.setDate(0); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; });

  const retailerName = retailers.find(r => r.phone === selectedRetailer)?.name || '';

  // Lock body scroll when any modal is open
  useEffect(() => {
    const open = showPayModal || showBalModal || !!editEntry;
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showPayModal, showBalModal, editEntry]);

  const parseToGrams = (p) => {
    const lbl = (p.label || p.name || '').toLowerCase();
    const num = parseFloat(lbl.replace(/[^0-9.]/g, '')) || 0;
    if (/kg/.test(lbl)) return num * 1000;
    if (/ltr|lit|l$/.test(lbl)) return num * 1000;
    if (/ml/.test(lbl)) return num;
    if (/g$|gm/.test(lbl)) return num;
    if (/half|hf/.test(lbl)) return 500;
    if (/full|fl/.test(lbl)) return 1000;
    if (/qtr|quarter/.test(lbl)) return 250;
    return p.price || 0;
  };

  // Generate all dates between from and to
  const allDates = useMemo(() => {
    const dates = [];
    const start = new Date(fromDate + 'T00:00:00');
    const end = new Date(toDate + 'T00:00:00');
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }
    return dates;
  }, [fromDate, toDate]);

  useEffect(() => { fetchBase(); }, []);
  useEffect(() => { if (selectedRetailer) fetchAll(); }, [selectedRetailer, fromDate, toDate]);

  const fetchBase = async () => {
    try {
      const [retSnap, prodSnap, areasDoc, groupDoc, ledgerSnap] = await Promise.all([
        getDocs(query(collection(db, 'users'), where('role', '==', 'retailer'))),
        cachedGetDocs(collection(db, 'products'), 'products_all', 10 * 60 * 1000),
        getDoc(doc(db, 'settings', 'areas')),
        getDoc(doc(db, 'settings', 'productGroups')),
        getDocs(collection(db, 'ledger'))
      ]);
      const retList = retSnap.docs.map(d => ({ phone: d.id, ...d.data() })).sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      setRetailers(retList);
      setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.active !== false));
      if (areasDoc.exists()) setAreas(areasDoc.data().list || []);
      if (groupDoc.exists() && groupDoc.data().daily) { setGroupOrder(groupDoc.data().daily); setGroupCodes(groupDoc.data().codes || {}); }
      const dueByRetailer = {};
      ledgerSnap.docs.forEach(d => { const e = d.data(); if (!e.retailerId) return; if (!dueByRetailer[e.retailerId]) dueByRetailer[e.retailerId] = 0; if (e.type === 'debit') dueByRetailer[e.retailerId] += (e.amount || 0); else dueByRetailer[e.retailerId] -= (e.amount || 0); });
      setDueList(Object.entries(dueByRetailer).filter(([, bal]) => bal > 0).map(([phone, balance]) => { const ret = retList.find(r => r.phone === phone); return { phone, name: ret?.name || phone, area: ret?.area || '', balance }; }).sort((a, b) => b.balance - a.balance));
    } catch (err) {}
    setLoading(false);
  };

  const fetchAll = async () => { setSyncing(true); await Promise.all([fetchOrders(), fetchOpening(), fetchLedgerEntries()]); setSyncing(false); };

  const fetchLedgerEntries = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'ledger'), where('retailerId', '==', selectedRetailer)));
      setAllLedgerEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) { setAllLedgerEntries([]); }
  };

  const fetchOpening = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'ledger'), where('retailerId', '==', selectedRetailer)));
      const start = new Date(fromDate + 'T00:00:00');
      let bal = 0;
      snap.docs.forEach(d => { const e = d.data(); let parsed = null; const parts = (e.date || '').match(/(\d+)\s+(\w+)\s+(\d+)/); if (parts) parsed = new Date(`${parts[2]} ${parts[1]}, ${parts[3]}`); if (!parsed || isNaN(parsed.getTime())) parsed = new Date(e.date); if (parsed && !isNaN(parsed.getTime()) && parsed < start) { if (e.type === 'debit') bal += (e.amount || 0); else bal -= (e.amount || 0); } });
      setOpeningBalance(bal);
    } catch (err) { setOpeningBalance(0); }
  };

  const fetchOrders = async () => {
    try {
      const ordSnap = await getDocs(query(collection(db, 'orders'), where('phone', '==', selectedRetailer)));
      const start = new Date(fromDate + 'T00:00:00'), end = new Date(toDate + 'T00:00:00');
      const dayMap = {};
      ordSnap.docs.forEach(d => {
        const o = d.data();
        if (o.status === 'Cancelled' || o.status === 'Returned') return;
        let orderDate = null; const parts = (o.date || '').match(/(\d+)\s+(\w+)\s+(\d+)/); if (parts) orderDate = new Date(`${parts[2]} ${parts[1]}, ${parts[3]}`); if (!orderDate || isNaN(orderDate.getTime())) orderDate = new Date(o.date); if (!orderDate || isNaN(orderDate.getTime())) return;
        if (orderDate < start || orderDate > end) return;
        const key = `${orderDate.getFullYear()}-${String(orderDate.getMonth()+1).padStart(2,'0')}-${String(orderDate.getDate()).padStart(2,'0')}`;
        if (!dayMap[key]) dayMap[key] = { items: {}, deposit: 0 };
        (o.actualItems || o.items || []).forEach(item => { const qty = parseFloat(String(item.qty || item.actual || 0).replace(/[^0-9.]/g, '')) || 0; if (qty > 0 && item.name) dayMap[key].items[item.name] = (dayMap[key].items[item.name] || 0) + qty; });
        if (o.paymentReceived > 0) dayMap[key].deposit = (dayMap[key].deposit || 0) + o.paymentReceived;
      });
      const ledgerSnap = await getDocs(query(collection(db, 'ledger'), where('retailerId', '==', selectedRetailer)));
      ledgerSnap.docs.forEach(d => { const e = d.data(); if (e.type !== 'credit') return; let parsed = null; const parts = (e.date || '').match(/(\d+)\s+(\w+)\s+(\d+)/); if (parts) parsed = new Date(`${parts[2]} ${parts[1]}, ${parts[3]}`); if (!parsed || isNaN(parsed.getTime())) parsed = new Date(e.date); if (!parsed || isNaN(parsed.getTime())) return; if (parsed < start || parsed > end) return; const key = `${parsed.getFullYear()}-${String(parsed.getMonth()+1).padStart(2,'0')}-${String(parsed.getDate()).padStart(2,'0')}`; if (!dayMap[key]) dayMap[key] = { items: {}, deposit: 0 }; dayMap[key].deposit = (dayMap[key].deposit || 0) + (e.amount || 0); });
      setOrdersDayData(dayMap);
    } catch (err) { setOrdersDayData({}); }
  };

  const priceMap = useMemo(() => { const m = {}; products.forEach(p => { m[p.name] = p.price || 0; }); return m; }, [products]);
  const PRODUCT_GROUPS = useMemo(() => { const gm = {}; groupOrder.forEach(g => { gm[g] = []; }); products.filter(p => p.group && p.type === 'daily').sort((a, b) => parseToGrams(b) - parseToGrams(a)).forEach(p => { if (!gm[p.group]) gm[p.group] = []; gm[p.group].push({ key: p.name, label: p.label || p.name, price: p.price || 0 }); }); const r = []; groupOrder.forEach(g => { if (gm[g]?.length > 0) r.push({ group: g, items: gm[g] }); }); Object.keys(gm).forEach(g => { if (!groupOrder.includes(g) && gm[g]?.length > 0) r.push({ group: g, items: gm[g] }); }); return r; }, [products, groupOrder]);
  const SEASONAL_GROUPS = useMemo(() => { const sm = {}; const r = []; products.filter(p => p.group && p.type === 'seasonal').sort((a, b) => parseToGrams(b) - parseToGrams(a)).forEach(p => { if (!sm[p.group]) { sm[p.group] = []; r.push({ group: p.group, items: sm[p.group] }); } sm[p.group].push({ key: p.name, label: p.label || p.name, price: p.price || 0 }); }); const ng = products.filter(p => p.type === 'seasonal' && !p.group).sort((a, b) => parseToGrams(b) - parseToGrams(a)); if (ng.length > 0) r.push({ group: 'OTHER', items: ng.map(p => ({ key: p.name, label: p.label || p.name, price: p.price || 0 })) }); return r; }, [products]);
  const ALL_DAILY_KEYS = useMemo(() => PRODUCT_GROUPS.flatMap(g => g.items.map(i => i.key)), [PRODUCT_GROUPS]);
  const ALL_SEASONAL_KEYS = useMemo(() => SEASONAL_GROUPS.flatMap(g => g.items.map(i => i.key)), [SEASONAL_GROUPS]);

  const rowData = useMemo(() => {
    const rows = []; let prev = openingBalance;
    allDates.forEach(date => {
      const key = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
      const dayData = ordersDayData[key] || { items: {}, deposit: 0 };
      let dailyAmt = 0, seasonalAmt = 0;
      Object.entries(dayData.items).forEach(([name, qty]) => { const amt = qty * (priceMap[name] || 0); if (ALL_SEASONAL_KEYS.includes(name)) seasonalAmt += amt; else dailyAmt += amt; });
      const deposit = dayData.deposit || 0;
      const closing = prev + dailyAmt + seasonalAmt - deposit;
      rows.push({ date, dateStr: `${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')}/${date.getFullYear()}`, items: dayData.items, dailyAmt, seasonalAmt, deposit, closing });
      prev = closing;
    });
    return rows;
  }, [allDates, ordersDayData, openingBalance, priceMap, ALL_SEASONAL_KEYS]);

  const closingBal = rowData.length > 0 ? rowData[rowData.length - 1].closing : openingBalance;
  const totalDaily = rowData.reduce((s, r) => s + r.dailyAmt, 0);
  const totalSeasonal = rowData.reduce((s, r) => s + r.seasonalAmt, 0);
  const totalDeposit = rowData.reduce((s, r) => s + r.deposit, 0);

  // Pagination
  const totalPages = Math.ceil(rowData.length / perPage);
  const pagedRows = rowData.slice((page - 1) * perPage, page * perPage);
  const showFrom = rowData.length === 0 ? 0 : (page - 1) * perPage + 1;
  const showTo = Math.min(page * perPage, rowData.length);

  const handleCollectPayment = async () => {
    if (!selectedRetailer || paying) return; const amt = Number(payAmount) || 0; if (amt <= 0) return; setPaying(true);
    try { await addDoc(collection(db, 'ledger'), { retailerId: selectedRetailer, retailer: retailerName, amount: amt, type: 'credit', note: payNote || 'Payment collected', date: new Date(payDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), createdAt: new Date().toISOString() }); const balRef = doc(db, 'retailer_balances', selectedRetailer); const balSnap = await getDoc(balRef); const curBal = balSnap.exists() ? (balSnap.data().balance || 0) : 0; await setDoc(balRef, { balance: curBal - amt, updatedAt: new Date().toISOString() }, { merge: true }); setShowPayModal(false); setPayAmount(''); setPayNote('Payment collected'); setToast(`₹${amt} collected`); setTimeout(() => setToast(''), 2500); fetchAll(); fetchBase(); } catch (err) { setToast('Failed!'); setTimeout(() => setToast(''), 2500); } setPaying(false);
  };
  const handleSetBalance = async () => {
    const amt = Number(balAmount) || 0; if (amt < 0) return; setPaying(true);
    try { const balRef = doc(db, 'retailer_balances', selectedRetailer); await setDoc(balRef, { balance: amt, updatedAt: new Date().toISOString() }, { merge: true }); if (amt > 0) { await addDoc(collection(db, 'ledger'), { retailerId: selectedRetailer, retailer: retailerName, amount: amt, type: 'debit', note: 'Opening balance (offline transfer)', date: new Date(balDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }), createdAt: new Date().toISOString() }); } setShowBalModal(false); setBalAmount(''); setBalConfirmStep(false); setToast(`Balance set: ₹${amt}`); setTimeout(() => setToast(''), 2500); fetchAll(); fetchBase(); } catch (err) { setToast('Failed!'); setTimeout(() => setToast(''), 2500); } setPaying(false);
  };

  const printDailyPDF = () => {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' }); registerHindiFont(pdf);
    const w = pdf.internal.pageSize.getWidth(), h = pdf.internal.pageSize.getHeight(), m = 3;
    const dateW = 22, totalW = 20, depW = 20, closeW = 20;
    const fixedCols = dateW + totalW + depW + closeW;
    const availW = w - (m * 2) - fixedCols;
    const qtyW = ALL_DAILY_KEYS.length > 0 ? Math.max(5, Math.floor(availW / ALL_DAILY_KEYS.length)) : 10;
    const qtyFontSize = qtyW < 7 ? 9 : qtyW < 10 ? 11 : 13;
    const rowH = 11, groupH = 8, subH = 8;
    let y = m, pageNum = 1;

    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(14); pdf.setTextColor(0, 0, 0);
    pdf.text('LUCY GARDEN', m, y + 5);
    drawText(pdf, `${retailerName}  |  ${fromDate} to ${toDate}`, w - m, y + 5, { size: 10, align: 'right' });
    y += 8; pdf.setDrawColor(0); pdf.setLineWidth(0.3); pdf.line(m, y, w - m, y); y += 2;
    pdf.setFontSize(8); pdf.setTextColor(40, 40, 40);
    drawText(pdf, `Opening: Rs.${openingBalance} | Closing: Rs.${closingBal}`, m, y + 3, { size: 8, color: [80, 80, 80] });
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

    rowData.forEach((row) => {
      if (y + rowH > h - 8) { pdf.addPage(); pageNum++; y = m; pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6); pdf.setTextColor(130, 130, 130); pdf.text(`Pg ${pageNum}`, w - m, y + 3, { align: 'right' }); pdf.setTextColor(0, 0, 0); y += 4; drawHeader(); }
      pdf.setDrawColor(80, 80, 80); pdf.setLineWidth(0.3); pdf.setFillColor(255, 255, 255); let rx = m;
      pdf.rect(rx, y, dateW, rowH, 'FD'); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(0, 0, 0); pdf.text(row.dateStr.slice(0, 5), rx + dateW / 2, y + 6.5, { align: 'center' }); rx += dateW;
      ALL_DAILY_KEYS.forEach(key => { pdf.setFillColor(255, 255, 255); pdf.setDrawColor(80, 80, 80); pdf.rect(rx, y, qtyW, rowH, 'FD'); const q = row.items[key] || 0; if (q > 0) { pdf.setFont('helvetica', 'bold'); pdf.setFontSize(qtyFontSize); pdf.setTextColor(0, 0, 0); pdf.text(`${q}`, rx + qtyW / 2, y + 7, { align: 'center' }); } rx += qtyW; });
      pdf.setFillColor(255, 255, 255); pdf.setDrawColor(80, 80, 80); pdf.rect(rx, y, totalW, rowH, 'FD'); if (row.dailyAmt > 0) { pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(0, 0, 0); pdf.text(`${row.dailyAmt}`, rx + totalW / 2, y + 6.5, { align: 'center' }); } rx += totalW;
      pdf.setFillColor(255, 255, 255); pdf.setDrawColor(80, 80, 80); pdf.rect(rx, y, depW, rowH, 'FD'); if (row.deposit > 0) { pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(0, 0, 0); pdf.text(`${row.deposit}`, rx + depW / 2, y + 6.5, { align: 'center' }); } rx += depW;
      pdf.setFillColor(255, 255, 255); pdf.setDrawColor(80, 80, 80); pdf.rect(rx, y, closeW, rowH, 'FD'); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(0, 0, 0); pdf.text(`${row.closing}`, rx + closeW / 2, y + 6.5, { align: 'center' });
      y += rowH;
    });

    // Total row
    if (y + rowH > h - 8) { pdf.addPage(); pageNum++; y = m; drawHeader(); }
    pdf.setDrawColor(50, 50, 50); pdf.setLineWidth(0.4); pdf.line(m, y, w - m, y); y += 1;
    pdf.setDrawColor(80, 80, 80); pdf.setLineWidth(0.3);
    let rx = m;
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(0, 0, 0); pdf.setFillColor(220, 220, 220);
    pdf.rect(rx, y, dateW, rowH, 'FD'); pdf.text('TOTAL', rx + dateW / 2, y + 6.5, { align: 'center' }); rx += dateW;
    ALL_DAILY_KEYS.forEach(key => {
      pdf.setFillColor(220, 220, 220); pdf.setDrawColor(80, 80, 80);
      pdf.rect(rx, y, qtyW, rowH, 'FD');
      const t = rowData.reduce((s, r) => s + (r.items[key] || 0), 0);
      if (t > 0) { pdf.setFont('helvetica', 'bold'); pdf.setFontSize(t >= 100 ? 8 : 10); pdf.setTextColor(0, 0, 0); pdf.text(`${t}`, rx + qtyW / 2, y + 7, { align: 'center' }); }
      rx += qtyW;
    });
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(0, 0, 0);
    pdf.setFillColor(220, 220, 220); pdf.setDrawColor(80, 80, 80); pdf.rect(rx, y, totalW, rowH, 'FD'); pdf.text(`${totalDaily}`, rx + totalW / 2, y + 6.5, { align: 'center' }); rx += totalW;
    pdf.setFillColor(220, 220, 220); pdf.setDrawColor(80, 80, 80); pdf.rect(rx, y, depW, rowH, 'FD'); pdf.text(`${totalDeposit}`, rx + depW / 2, y + 6.5, { align: 'center' }); rx += depW;
    pdf.setFillColor(220, 220, 220); pdf.setDrawColor(80, 80, 80); pdf.rect(rx, y, closeW, rowH, 'FD'); pdf.text(`${closingBal}`, rx + closeW / 2, y + 6.5, { align: 'center' });

    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(80, 80, 80);
    drawText(pdf, `Lucy Garden | ${retailerName} | ${fromDate} to ${toDate} | Generated: ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`, w / 2, h - 3, { size: 7, color: [150, 150, 150], align: 'center' });
    pdf.save(`LG_Summary_${retailerName.replace(/\s/g, '_')}_${fromDate}.pdf`);
  };

  const printSeasonalPDF = () => {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' }); registerHindiFont(pdf);
    const w = pdf.internal.pageSize.getWidth(), h = pdf.internal.pageSize.getHeight(), m = 3;
    const dateW = 22, totalW = 20; const availW = w - m * 2 - dateW - totalW;
    const qtyW = ALL_SEASONAL_KEYS.length > 0 ? Math.max(6, Math.floor(availW / ALL_SEASONAL_KEYS.length)) : 10;
    const qtyFontSize = qtyW < 7 ? 9 : qtyW < 10 ? 11 : 13;
    const rowH = 11, groupH = 8, subH = 8;
    let y = m, pageNum = 1;

    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(14); pdf.setTextColor(0, 0, 0);
    pdf.text('LUCY GARDEN - Seasonal', m, y + 5);
    drawText(pdf, `${retailerName}  |  ${fromDate} to ${toDate}`, w - m, y + 5, { size: 10, align: 'right' });
    y += 8; pdf.setDrawColor(0); pdf.setLineWidth(0.3); pdf.line(m, y, w - m, y); y += 2;

    const drawHeader = () => {
      pdf.setDrawColor(80, 80, 80); pdf.setLineWidth(0.3); pdf.setFillColor(210, 210, 210); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(0, 0, 0);
      pdf.rect(m, y, dateW, groupH + subH, 'FD'); pdf.setFontSize(9); pdf.text('DATE', m + dateW / 2, y + (groupH + subH) / 2 + 1, { align: 'center' });
      let gx = m + dateW;
      SEASONAL_GROUPS.forEach(g => { const span = g.items.length * qtyW; pdf.setFillColor(210, 210, 210); pdf.rect(gx, y, span, groupH, 'FD'); let fs = 10; pdf.setFontSize(fs); while (pdf.getTextWidth(g.group) > span - 2 && fs > 7) { fs -= 0.5; pdf.setFontSize(fs); } pdf.text(g.group, gx + span / 2, y + 5.5, { align: 'center' }); gx += span; });
      pdf.setFillColor(210, 210, 210); pdf.rect(gx, y, totalW, groupH + subH, 'FD'); pdf.setFontSize(9); pdf.text('TOTAL', gx + totalW / 2, y + (groupH + subH) / 2 + 1, { align: 'center' });
      const sy = y + groupH; gx = m + dateW;
      SEASONAL_GROUPS.forEach(g => g.items.forEach(item => { pdf.setFillColor(230, 230, 230); pdf.rect(gx, sy, qtyW, subH, 'FD'); pdf.setTextColor(0, 0, 0); const l = item.label; let fs2 = 9; pdf.setFontSize(fs2); while (pdf.getTextWidth(l) > qtyW - 1 && fs2 > 5) { fs2 -= 0.5; pdf.setFontSize(fs2); } pdf.text(l, gx + qtyW / 2, sy + 5, { align: 'center' }); gx += qtyW; }));
      y += groupH + subH;
    };
    drawHeader();

    rowData.forEach((row) => {
      if (y + rowH > h - 8) { pdf.addPage(); pageNum++; y = m; pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6); pdf.setTextColor(130, 130, 130); pdf.text(`Pg ${pageNum}`, w - m, y + 3, { align: 'right' }); pdf.setTextColor(0, 0, 0); y += 4; drawHeader(); }
      pdf.setDrawColor(80, 80, 80); pdf.setLineWidth(0.3); let rx = m;
      pdf.setFillColor(255, 255, 255); pdf.rect(rx, y, dateW, rowH, 'FD'); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(0, 0, 0); pdf.text(row.dateStr.slice(0, 5), rx + dateW / 2, y + 6.5, { align: 'center' }); rx += dateW;
      ALL_SEASONAL_KEYS.forEach(key => { pdf.setFillColor(255, 255, 255); pdf.rect(rx, y, qtyW, rowH, 'FD'); const q = row.items[key] || 0; if (q > 0) { pdf.setFont('helvetica', 'bold'); pdf.setFontSize(qtyFontSize); pdf.setTextColor(0, 0, 0); pdf.text(`${q}`, rx + qtyW / 2, y + 7, { align: 'center' }); } rx += qtyW; });
      pdf.setFillColor(255, 255, 255); pdf.rect(rx, y, totalW, rowH, 'FD'); if (row.seasonalAmt > 0) { pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(0, 0, 0); pdf.text(`${row.seasonalAmt}`, rx + totalW / 2, y + 6.5, { align: 'center' }); }
      y += rowH;
    });

    if (y + rowH > h - 8) { pdf.addPage(); y = m; drawHeader(); }
    pdf.setDrawColor(50, 50, 50); pdf.setLineWidth(0.4); pdf.line(m, y, w - m, y); y += 1;
    pdf.setDrawColor(80, 80, 80); pdf.setLineWidth(0.3);
    let rx2 = m; pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(0, 0, 0);
    pdf.setFillColor(220, 220, 220); pdf.rect(rx2, y, dateW, rowH, 'FD'); pdf.text('TOTAL', rx2 + dateW / 2, y + 6.5, { align: 'center' }); rx2 += dateW;
    ALL_SEASONAL_KEYS.forEach(key => { pdf.setFillColor(220, 220, 220); pdf.rect(rx2, y, qtyW, rowH, 'FD'); const t = rowData.reduce((s, r) => s + (r.items[key] || 0), 0); if (t > 0) { pdf.setFont('helvetica', 'bold'); pdf.setFontSize(t >= 100 ? 8 : 10); pdf.text(`${t}`, rx2 + qtyW / 2, y + 7, { align: 'center' }); pdf.setFontSize(8); } rx2 += qtyW; });
    pdf.setFillColor(220, 220, 220); pdf.rect(rx2, y, totalW, rowH, 'FD'); pdf.text(`${totalSeasonal}`, rx2 + totalW / 2, y + 6.5, { align: 'center' });

    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(80, 80, 80);
    drawText(pdf, `Lucy Garden | Seasonal | ${retailerName} | ${fromDate} to ${toDate}`, w / 2, h - 3, { size: 7, color: [150, 150, 150], align: 'center' });
    pdf.save(`LG_Seasonal_${retailerName.replace(/\s/g, '_')}_${fromDate}.pdf`);
  };

  const exportCSV = () => {
    const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
    // Group header row
    const groupRow = ['', ...PRODUCT_GROUPS.flatMap(g => [esc(groupCodes[g.group] || g.group), ...Array(g.items.length - 1).fill('')]), ...SEASONAL_GROUPS.flatMap(g => [esc(g.group), ...Array(g.items.length - 1).fill('')]), '', '', '', ''];
    // Product header row
    const headers = [esc('Date'), ...ALL_DAILY_KEYS.map(k => esc(k)), ...ALL_SEASONAL_KEYS.map(k => esc(k)), esc('Daily Total'), esc('Seasonal Total'), esc('Paid'), esc('Due')];
    // Info rows
    const infoRows = [
      [esc('Retailer'), esc(retailerName), '', esc('Phone'), esc(selectedRetailer)].join(','),
      [esc('Period'), esc(`${fromDate} to ${toDate}`), '', esc('Opening'), openingBalance, '', esc('Closing'), closingBal].join(','),
      ''
    ];
    // Data rows
    const dataRows = rowData.map(r => [
      esc(r.dateStr),
      ...ALL_DAILY_KEYS.map(k => r.items[k] || ''),
      ...ALL_SEASONAL_KEYS.map(k => r.items[k] || ''),
      r.dailyAmt || '',
      r.seasonalAmt || '',
      r.deposit || '',
      r.closing
    ].join(','));
    // Total row
    const totalRow = [
      esc('TOTAL'),
      ...ALL_DAILY_KEYS.map(k => rowData.reduce((s, r) => s + (r.items[k] || 0), 0) || ''),
      ...ALL_SEASONAL_KEYS.map(k => rowData.reduce((s, r) => s + (r.items[k] || 0), 0) || ''),
      totalDaily,
      totalSeasonal,
      totalDeposit,
      closingBal
    ].join(',');
    const csv = [...infoRows, groupRow.join(','), headers.join(','), ...dataRows, totalRow].join('\n');
    const bom = '\uFEFF';
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([bom + csv], { type: 'text/csv;charset=utf-8' })); a.download = `Summary_${retailerName.replace(/\s/g, '_')}_${fromDate}_to_${toDate}.csv`; a.click();
  };

  if (loading) return <TableSkeleton />;
  const filteredRetailers = retailers.filter(r => { if (selectedArea !== 'All' && r.area !== selectedArea) return false; if (search) { const s = search.toLowerCase(); return r.name?.toLowerCase().includes(s) || r.phone?.includes(s); } return true; });
  const filteredDues = dueList.filter(d => selectedArea === 'All' || d.area === selectedArea);
  const todayStr = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; })();

  return (
    <div className="space-y-3">
      <AnimatePresence>{toast && (<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-[4.5rem] left-4 right-4 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:w-auto z-[100] flex items-center justify-center gap-2 px-4 py-3 rounded-2xl shadow-xl bg-mint-50 border border-mint-200 text-mint-800 backdrop-blur-sm"><Check size={14} strokeWidth={3} /><span className="text-sm font-bold">{toast}</span></motion.div>)}</AnimatePresence>

      {/* Area Tabs */}
      <div className="overflow-x-auto pb-1">
        <div className="flex gap-1.5 w-max">
          {['All', ...areas].map(a => { const cnt = dueList.filter(d => a === 'All' ? true : d.area === a).length; return <button key={a} onClick={() => { setSelectedArea(a); setSelectedRetailer(''); }} className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap ${selectedArea === a ? 'bg-royal-700 text-white shadow-sm' : 'bg-gray-100 dark:bg-[#111] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#222]'}`}>{a} {cnt > 0 && <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full">{cnt}</span>}</button>; })}
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <input type="text" placeholder="Search retailer..." value={search} onChange={e => setSearch(e.target.value)} className="text-[13px] bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl px-3 py-2 pl-8 pr-9 outline-none w-full dark:text-white" />
        <svg className="absolute left-2.5 top-2.5 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-200 dark:bg-[#222] rounded-full flex items-center justify-center"><X size={10} className="text-gray-500" /></button>}
      </div>

      {/* Retailer Chips */}
      <div className="pb-1">
        <div className="flex flex-wrap gap-1.5 max-h-[100px] overflow-y-auto">
          {filteredRetailers.map(r => { const due = dueList.find(d => d.phone === r.phone); return (
            <button key={r.phone} onClick={() => { setSelectedRetailer(r.phone); setPage(1); }} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap ${r.phone === selectedRetailer ? 'bg-royal-600 text-white shadow-md ring-2 ring-royal-300' : 'bg-white dark:bg-[#111] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#222]'}`}>
              {r.name}{due && due.balance > 0 && <span className="ml-1 px-1 py-0.5 bg-red-500 text-white text-[8px] font-bold rounded-full">{due.balance >= 1000 ? `${(due.balance/1000).toFixed(1)}k` : due.balance}</span>}
            </button>); })}
        </div>
      </div>

      {!selectedRetailer ? (
        filteredDues.length > 0 ? (
          <div className="space-y-3">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 text-center">
              <p className="text-xs text-red-400 font-bold uppercase">Total Pending Dues</p>
              <p className="text-2xl font-black text-red-600 mt-1">{formatPrice(filteredDues.reduce((s, d) => s + d.balance, 0))}</p>
              <p className="text-xs text-red-400 mt-1">{filteredDues.length} retailers</p>
            </div>
            <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-[#0f172a] to-[#1e293b] flex items-center justify-between"><p className="text-sm font-bold text-white">Pending Dues</p><p className="text-xs text-gray-400">{filteredDues.length}</p></div>
              <div className="divide-y divide-gray-100 dark:divide-[#222] max-h-[400px] overflow-y-auto">
                {filteredDues.map((d, i) => (<div key={d.phone} onClick={() => { setSelectedRetailer(d.phone); setPage(1); }} className="px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-red-50/50"><div className="flex items-center gap-3"><div className="w-7 h-7 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center text-red-500 font-bold text-[10px]">{i+1}</div><div><p className="text-sm font-bold text-gray-800 dark:text-white">{d.name}</p><p className="text-[10px] text-gray-400">{d.area}</p></div></div><p className="text-sm font-extrabold text-red-600">{formatPrice(d.balance)}</p></div>))}
              </div>
            </div>
          </div>
        ) : (<div className="text-center py-16"><Calendar size={32} className="text-gray-200 mx-auto mb-3" /><p className="text-sm font-bold text-gray-400">No pending dues. Select a retailer.</p></div>)
      ) : (<>

        {/* Date Range + Buttons */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-xl px-2 py-1.5">
            <Calendar size={12} className="text-gray-400 shrink-0" />
            <input type="date" value={fromDate} onChange={e => { setFromDate(e.target.value); setPage(1); }} max={toDate} className="text-[11px] font-bold text-gray-700 dark:text-gray-200 outline-none bg-transparent flex-1 min-w-0" />
            <span className="text-gray-300 text-[9px]">→</span>
            <input type="date" value={toDate} onChange={e => { setToDate(e.target.value); setPage(1); }} max={todayStr} className="text-[11px] font-bold text-gray-700 dark:text-gray-200 outline-none bg-transparent flex-1 min-w-0" />
          </div>
          <div className="grid grid-cols-3 gap-1">
            <motion.button whileTap={{ scale: 0.93 }} onClick={printDailyPDF} className="flex items-center justify-center gap-1 py-1.5 bg-[#0f172a] text-white text-[10px] font-bold rounded-lg"><Printer size={10} />Daily</motion.button>
            <motion.button whileTap={{ scale: 0.93 }} onClick={exportCSV} className="flex items-center justify-center gap-1 py-1.5 bg-mint-600 text-white text-[10px] font-bold rounded-lg"><Download size={10} />Excel</motion.button>
            {ALL_SEASONAL_KEYS.length > 0 ? <motion.button whileTap={{ scale: 0.93 }} onClick={printSeasonalPDF} className="flex items-center justify-center gap-1 py-1.5 bg-amber-600 text-white text-[10px] font-bold rounded-lg"><Printer size={10} />Seasonal</motion.button> : <div />}
          </div>
          <div className="grid grid-cols-2 gap-1">
            <motion.button whileTap={{ scale: 0.93 }} onClick={() => setShowPayModal(true)} className="flex items-center justify-center gap-1 py-2 text-[11px] font-bold rounded-lg bg-green-600 text-white"><IndianRupee size={10} />Collect</motion.button>
            <motion.button whileTap={{ scale: 0.93 }} onClick={() => setShowBalModal(true)} className="flex items-center justify-center gap-1 py-2 text-[11px] font-bold rounded-lg bg-amber-500 text-white"><IndianRupee size={10} />Set Bal</motion.button>
          </div>
        </div>

        {/* Stats + Per Page */}
        <div className="flex flex-wrap items-center gap-1 text-[10px]">
          <span className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-md px-1.5 py-1 font-bold text-gray-600 dark:text-gray-300">{rowData.length}d</span>
          <span className="bg-amber-50 border border-amber-100 rounded-md px-1.5 py-1 font-bold text-amber-700">Op:{formatPrice(openingBalance)}</span>
          <span className="bg-red-50 border border-red-100 rounded-md px-1.5 py-1 font-bold text-red-700">Due:{formatPrice(closingBal)}</span>
          <select value={perPage} onChange={e => { setPerPage(Number(e.target.value)); setPage(1); }} className="ml-auto text-[10px] font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-md px-1 py-1 outline-none">
            {[10, 25, 31, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>

        {/* Retailer Info */}
        <div className="flex items-center gap-2 bg-royal-50 dark:bg-royal-900/20 border border-royal-200 dark:border-royal-800 rounded-xl px-3 py-2">
          <div className="w-7 h-7 bg-royal-600 rounded-md flex items-center justify-center text-white font-bold text-[9px] shrink-0">{retailerName?.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-bold text-gray-800 dark:text-white truncate">{retailerName}</p>
            <p className="text-[9px] text-gray-400">{selectedRetailer}</p>
          </div>
          <p className="text-sm font-black text-red-600 shrink-0">{formatPrice(closingBal)}</p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1.5">
          <button onClick={() => setViewMode('summary')} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${viewMode === 'summary' ? 'bg-royal-700 text-white shadow' : 'bg-white dark:bg-[#111] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#222]'}`}>Summary</button>
          <button onClick={() => setViewMode('entries')} className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${viewMode === 'entries' ? 'bg-royal-700 text-white shadow' : 'bg-white dark:bg-[#111] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-[#222]'}`}>All Entries</button>
        </div>

        {viewMode === 'summary' ? (<>
        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-1.5">
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-lg px-1.5 py-2 text-center"><p className="text-[8px] text-gray-400 font-bold">DAILY</p><p className="text-[11px] font-black text-gray-800 dark:text-white">{formatPrice(totalDaily)}</p></div>
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-lg px-1.5 py-2 text-center"><p className="text-[8px] text-gray-400 font-bold">SEASONAL</p><p className="text-[11px] font-black text-amber-600">{formatPrice(totalSeasonal)}</p></div>
          <div className="bg-white dark:bg-[#111] border border-gray-200 dark:border-[#222] rounded-lg px-1.5 py-2 text-center"><p className="text-[8px] text-gray-400 font-bold">PAID</p><p className="text-[11px] font-black text-mint-600">{formatPrice(totalDeposit)}</p></div>
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-1.5 py-2 text-center"><p className="text-[8px] text-red-400 font-bold">DUE</p><p className="text-[11px] font-black text-red-600">{formatPrice(closingBal)}</p></div>
        </div>

        {/* Daily Table */}
        {PRODUCT_GROUPS.length > 0 && (
        <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-[#0f172a] to-[#1e293b]"><p className="text-sm font-bold text-white">Daily Products</p></div>
          <div className="overflow-x-auto">
            <table className="border-collapse w-full min-w-[900px]">
              <thead className="sticky top-0 z-30">
                <tr className="bg-[#0f172a]">
                  <th rowSpan={2} className="sticky left-0 z-20 bg-[#0f172a] px-2 py-3 text-center text-white font-bold text-xs border-r border-white/10 w-[72px]">Date</th>
                  {PRODUCT_GROUPS.map((g, gi) => <th key={gi} colSpan={g.items.length} className="px-1 py-3 text-center font-extrabold text-white text-xs border-r border-white/10">{groupCodes[g.group] || g.group}</th>)}
                  <th rowSpan={2} className="px-2 py-3 text-center text-white font-bold text-xs border-r border-white/10 w-[80px]">TOTAL</th>
                  <th rowSpan={2} className="px-2 py-3 text-center text-white font-bold text-xs border-r border-white/10 w-[80px]">PAID</th>
                  <th rowSpan={2} className="sticky right-0 z-20 bg-[#0f172a] px-2 py-3 text-center text-white font-bold text-xs w-[80px] border-l border-white/10">DUE</th>
                </tr>
                <tr className="bg-[#1e293b]">
                  {PRODUCT_GROUPS.flatMap(g => g.items).map(item => <th key={item.key} className="px-1 py-2 text-center font-bold text-gray-300 border-r border-white/5 min-w-[42px] text-[11px]">{item.label}<br/><span className="text-[11px] font-medium text-gray-400">₹{item.price}</span></th>)}
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((row, i) => (
                  <tr key={row.dateStr} className={`${row.dailyAmt > 0 || row.deposit > 0 ? 'bg-white dark:bg-[#111]' : i % 2 === 0 ? 'bg-white dark:bg-[#111]' : 'bg-gray-50/50 dark:bg-[#1a1a1a]/30'} hover:bg-royal-50/30 dark:hover:bg-royal-900/20 transition-colors`}>
                    <td className="sticky left-0 z-10 bg-inherit px-2 py-2.5 text-center text-[11px] font-bold text-gray-600 dark:text-gray-400 border-b border-r border-gray-200 dark:border-[#222] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)] whitespace-nowrap">{row.dateStr}</td>
                    {PRODUCT_GROUPS.flatMap(g => g.items).map(item => { const q = row.items[item.key] || 0; return <td key={item.key} className="px-1 py-2.5 text-center border-b border-r border-gray-100 dark:border-[#222]">{q > 0 ? <span className="font-black text-[14px] text-royal-700 dark:text-royal-300">{q}</span> : <span className="text-gray-200 dark:text-gray-600">·</span>}</td>; })}
                    <td className="px-2 py-2.5 text-center border-b border-r border-gray-200 dark:border-[#222]">{row.dailyAmt > 0 ? <span className="font-black text-[13px] text-gray-800 dark:text-white">₹{row.dailyAmt}</span> : <span className="text-gray-200 dark:text-gray-600">—</span>}</td>
                    <td className="px-2 py-2.5 text-center border-b border-r border-gray-200 dark:border-[#222]">{row.deposit > 0 ? <span className="font-bold text-[13px] text-mint-700 dark:text-mint-400">₹{row.deposit}</span> : <span className="text-gray-200 dark:text-gray-600">—</span>}</td>
                    <td className="sticky right-0 z-10 bg-inherit px-2 py-2.5 text-center border-b border-l border-gray-200 dark:border-[#222] shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.05)]">{<span className="font-black text-[13px] text-gray-800 dark:text-white">{row.closing}</span>}</td>
                  </tr>
                ))}
                <tr className="bg-[#0f172a]">
                  <td className="sticky left-0 z-20 bg-[#0f172a] px-2 py-2.5 text-center text-xs font-bold text-white border-r border-white/10">TOTAL</td>
                  {PRODUCT_GROUPS.flatMap(g => g.items).map(item => { const t = rowData.reduce((s, r) => s + (r.items[item.key] || 0), 0); return <td key={item.key} className="px-1 py-2.5 text-center text-[13px] font-black text-amber-300 border-r border-white/5">{t > 0 ? t : '·'}</td>; })}
                  <td className="px-2 py-2.5 text-center text-[13px] font-black text-white border-r border-white/10">{totalDaily > 0 ? `₹${totalDaily}` : '—'}</td>
                  <td className="px-2 py-2.5 text-center text-[12px] font-bold text-mint-300 border-r border-white/10">{totalDeposit > 0 ? `₹${totalDeposit}` : '—'}</td>
                  <td className="sticky right-0 z-20 bg-[#0f172a] px-2 py-2.5 text-center text-[13px] font-black text-white border-l border-white/10">₹{closingBal}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>)}

        {/* Seasonal Table */}
        {SEASONAL_GROUPS.length > 0 && (
        <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600"><p className="text-sm font-bold text-white">Seasonal Products</p></div>
          <div className="overflow-x-auto">
            <table className="border-collapse w-full min-w-[600px]">
              <thead className="sticky top-0 z-30">
                <tr className="bg-[#0f172a]">
                  <th rowSpan={2} className="sticky left-0 z-20 bg-[#0f172a] px-2 py-3 text-center text-white font-bold text-xs border-r border-white/10 w-[72px]">Date</th>
                  {SEASONAL_GROUPS.map((g, gi) => <th key={gi} colSpan={g.items.length} className="px-1 py-3 text-center font-extrabold text-white text-xs border-r border-white/10">{g.group}</th>)}
                  <th rowSpan={2} className="sticky right-0 z-20 bg-[#0f172a] px-2 py-3 text-center text-white font-bold text-xs w-[80px] border-l border-white/10">TOTAL</th>
                </tr>
                <tr className="bg-[#1e293b]">
                  {SEASONAL_GROUPS.flatMap(g => g.items).map(item => <th key={item.key} className="px-1 py-2 text-center font-bold text-gray-300 border-r border-white/5 min-w-[42px] text-[11px]">{item.label}<br/><span className="text-[11px] font-medium text-gray-400">₹{item.price}</span></th>)}
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((row, i) => (
                  <tr key={row.dateStr} className={`${row.seasonalAmt > 0 ? 'bg-white dark:bg-[#111]' : i % 2 === 0 ? 'bg-white dark:bg-[#111]' : 'bg-gray-50/50 dark:bg-[#1a1a1a]/30'} hover:bg-royal-50/30 dark:hover:bg-royal-900/20 transition-colors`}>
                    <td className="sticky left-0 z-10 bg-inherit px-2 py-2.5 text-center text-[11px] font-bold text-gray-600 dark:text-gray-400 border-b border-r border-gray-200 dark:border-[#222] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)] whitespace-nowrap">{row.dateStr}</td>
                    {SEASONAL_GROUPS.flatMap(g => g.items).map(item => { const q = row.items[item.key] || 0; return <td key={item.key} className="px-1 py-2.5 text-center border-b border-r border-gray-100 dark:border-[#222]">{q > 0 ? <span className="font-black text-[14px] text-amber-700 dark:text-amber-300">{q}</span> : <span className="text-gray-200 dark:text-gray-600">·</span>}</td>; })}
                    <td className="sticky right-0 z-10 bg-inherit px-2 py-2.5 text-center border-b border-l border-gray-200 dark:border-[#222] shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.05)]">{row.seasonalAmt > 0 ? <span className="font-black text-[13px] text-amber-700 dark:text-amber-300">₹{row.seasonalAmt}</span> : <span className="text-gray-200 dark:text-gray-600">—</span>}</td>
                  </tr>
                ))}
                <tr className="bg-[#0f172a]">
                  <td className="sticky left-0 z-20 bg-[#0f172a] px-2 py-2.5 text-center text-xs font-bold text-white border-r border-white/10">TOTAL</td>
                  {SEASONAL_GROUPS.flatMap(g => g.items).map(item => { const t = rowData.reduce((s, r) => s + (r.items[item.key] || 0), 0); return <td key={item.key} className="px-1 py-2.5 text-center text-[13px] font-black text-amber-300 border-r border-white/5">{t > 0 ? t : '·'}</td>; })}
                  <td className="sticky right-0 z-20 bg-[#0f172a] px-2 py-2.5 text-center text-[13px] font-black text-amber-300 border-l border-white/10">{totalSeasonal > 0 ? `₹${totalSeasonal}` : '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>)}

        {/* Pagination */}
        {totalPages > 1 && (
        <div className="flex items-center justify-between px-1">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-300 disabled:opacity-30"><ChevronLeft size={14} /> Prev</button>
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Page {page} of {totalPages} <span className="text-gray-400 font-normal">({rowData.length} days)</span></span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-300 disabled:opacity-30">Next <ChevronRight size={14} /></button>
        </div>)}
        </>) : (
        /* All Entries View */
        <div className="bg-white dark:bg-[#111] rounded-2xl border border-gray-200 dark:border-[#222] overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-[#0f172a] to-[#1e293b] flex items-center justify-between">
            <p className="text-sm font-bold text-white">Ledger Entries</p>
            <p className="text-xs text-gray-400">{allLedgerEntries.length} entries</p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-[#222] max-h-[60vh] overflow-y-auto">
            {allLedgerEntries.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')).map((entry) => (
              <div key={entry.id} className={`px-4 py-3 flex items-center gap-3 ${entry.type === 'credit' ? 'bg-mint-50/30 dark:bg-mint-900/5' : ''}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${entry.type === 'credit' ? 'bg-mint-100 dark:bg-mint-900/30' : 'bg-red-50 dark:bg-red-900/20'}`}>
                  <IndianRupee size={13} className={entry.type === 'credit' ? 'text-mint-600' : 'text-red-500'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-black ${entry.type === 'credit' ? 'text-mint-600' : 'text-red-600'}`}>{entry.type === 'credit' ? '-' : '+'}{formatPrice(entry.amount)}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${entry.type === 'credit' ? 'bg-mint-100 dark:bg-mint-900/30 text-mint-700' : 'bg-red-50 dark:bg-red-900/20 text-red-600'}`}>{entry.type === 'credit' ? 'CREDIT' : 'DEBIT'}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 truncate">{entry.note || 'No note'} | {entry.date}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => { setEditEntry(entry); setEditAmount(String(entry.amount)); setEditNote(entry.note || ''); }} className="w-7 h-7 bg-gray-100 dark:bg-[#1a1a1a] rounded-lg flex items-center justify-center"><Edit3 size={11} className="text-royal-600" /></button>
                  <button onClick={async () => { const ok = await confirm({ title: 'Delete Entry', message: `Delete ${entry.type} of ${formatPrice(entry.amount)}?`, confirmText: 'Delete', type: 'danger' }); if (!ok) return; try { await deleteDoc(doc(db, 'ledger', entry.id)); setToast('Deleted'); setTimeout(() => setToast(''), 2500); fetchAll(); fetchBase(); } catch (err) { setToast('Failed'); setTimeout(() => setToast(''), 2500); } }} className="w-7 h-7 bg-gray-100 dark:bg-[#1a1a1a] rounded-lg flex items-center justify-center"><Trash2 size={11} className="text-red-500" /></button>
                </div>
              </div>
            ))}
            {allLedgerEntries.length === 0 && <p className="text-center text-sm text-gray-400 py-8">No entries found</p>}
          </div>
        </div>
        )}

        {/* Edit Entry Modal */}
        <AnimatePresence>{editEntry && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setEditEntry(null)}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }} className="bg-white dark:bg-[#111] rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4"><h3 className="font-extrabold text-gray-800 dark:text-white text-lg">Edit Entry</h3><button onClick={() => setEditEntry(null)} className="w-8 h-8 bg-gray-100 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center text-gray-400"><X size={14} /></button></div>
              <div className="space-y-3">
                <div><label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1.5 block">Amount</label><input type="number" min="0" value={editAmount} onChange={e => setEditAmount(e.target.value)} onKeyDown={e => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }} className="w-full py-3 px-4 text-lg font-bold text-center border border-gray-200 dark:border-[#333] rounded-xl focus:outline-none bg-white dark:bg-[#1a1a1a] dark:text-white" /></div>
                <div><label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1.5 block">Note</label><input type="text" value={editNote} onChange={e => setEditNote(e.target.value)} className="w-full py-2.5 px-4 text-sm border border-gray-200 dark:border-[#333] rounded-xl focus:outline-none bg-white dark:bg-[#1a1a1a] dark:text-white" /></div>
                <div><label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1.5 block">Type</label><div className="flex gap-2"><button onClick={() => setEditEntry(prev => ({ ...prev, type: 'debit' }))} className={`flex-1 py-2.5 rounded-xl text-xs font-bold ${editEntry.type === 'debit' ? 'bg-red-600 text-white' : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-500 border border-gray-200 dark:border-[#333]'}`}>Debit</button><button onClick={() => setEditEntry(prev => ({ ...prev, type: 'credit' }))} className={`flex-1 py-2.5 rounded-xl text-xs font-bold ${editEntry.type === 'credit' ? 'bg-mint-600 text-white' : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-500 border border-gray-200 dark:border-[#333]'}`}>Credit</button></div></div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={async () => { const amt = Number(editAmount) || 0; if (amt <= 0) return; try { await updateDoc(doc(db, 'ledger', editEntry.id), { amount: amt, note: editNote, type: editEntry.type }); setEditEntry(null); setToast('Updated'); setTimeout(() => setToast(''), 2500); fetchAll(); fetchBase(); } catch (err) { setToast('Failed'); setTimeout(() => setToast(''), 2500); } }} disabled={!(Number(editAmount) > 0)} className="w-full bg-royal-600 text-white font-bold py-3.5 rounded-xl shadow-md text-sm disabled:opacity-50">Save Changes</motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}</AnimatePresence>

        {/* Collect Payment Modal */}
        <AnimatePresence>{showPayModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowPayModal(false)}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }} className="bg-white dark:bg-[#111] rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4"><div><h3 className="font-extrabold text-gray-800 dark:text-white text-lg">Collect Payment</h3><p className="text-sm text-gray-400">{retailerName}</p></div><button onClick={() => setShowPayModal(false)} className="w-8 h-8 bg-gray-100 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center text-gray-400"><X size={14} /></button></div>
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 mb-4 text-center"><p className="text-[10px] text-red-400 font-bold uppercase">Current Due</p><p className="text-xl font-black text-red-600">{formatPrice(closingBal)}</p></div>
              <div className="mb-3"><label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1.5 block">Amount (₹)</label><input type="number" min="0" placeholder="Enter amount" value={payAmount} onChange={e => { if (Number(e.target.value) <= closingBal) setPayAmount(e.target.value); }} onKeyDown={e => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }} className="w-full py-3.5 px-4 text-xl font-bold text-center border border-gray-200 dark:border-[#333] rounded-xl focus:outline-none bg-white dark:bg-[#1a1a1a] dark:text-white" /></div>
              <div className="mb-3"><label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1.5 block">Note</label><input type="text" value={payNote} onChange={e => setPayNote(e.target.value)} className="w-full py-2.5 px-4 text-sm border border-gray-200 dark:border-[#333] rounded-xl focus:outline-none bg-white dark:bg-[#1a1a1a] dark:text-white" /></div>
              <div className="mb-4"><label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1.5 block">Date</label><input type="date" value={payDate} onChange={e => setPayDate(e.target.value)} max={todayStr} className="w-full py-2.5 px-4 text-sm font-bold border border-gray-200 dark:border-[#333] rounded-xl focus:outline-none bg-white dark:bg-[#1a1a1a] dark:text-white" /></div>
              {Number(payAmount) > 0 && <p className="text-[11px] text-mint-600 font-bold mb-4 text-center">Balance after: {formatPrice(closingBal - (Number(payAmount) || 0))}</p>}
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleCollectPayment} disabled={paying || !(Number(payAmount) > 0)} className="w-full bg-green-600 text-white font-bold py-3.5 rounded-xl shadow-md text-sm disabled:opacity-50">{paying ? 'Processing...' : 'Collect Payment'}</motion.button>
            </motion.div>
          </motion.div>
        )}</AnimatePresence>

        {/* Set Balance Modal */}
        <AnimatePresence>{showBalModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => { setShowBalModal(false); setBalConfirmStep(false); }}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }} className="bg-white dark:bg-[#111] rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4"><div><h3 className="font-extrabold text-gray-800 dark:text-white text-lg">Set Opening Balance</h3><p className="text-sm text-gray-400">{retailerName}</p></div><button onClick={() => { setShowBalModal(false); setBalConfirmStep(false); }} className="w-8 h-8 bg-gray-100 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center text-gray-400"><X size={14} /></button></div>
              {!balConfirmStep ? (<>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 mb-4"><p className="text-[10px] text-amber-600 font-bold"><AlertTriangle size={12} className="inline" /> Set previous pending amount from offline records.</p></div>
                <div className="mb-3"><label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1.5 block">Pending Amount (₹)</label><input type="number" min="0" placeholder="Enter due" value={balAmount} onChange={e => setBalAmount(e.target.value)} onKeyDown={e => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }} className="w-full py-3.5 px-4 text-xl font-bold text-center border border-gray-200 dark:border-[#333] rounded-xl focus:outline-none bg-white dark:bg-[#1a1a1a] dark:text-white" /></div>
                <div className="mb-4"><label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1.5 block">Entry Date</label><input type="date" value={balDate} onChange={e => setBalDate(e.target.value)} max={todayStr} className="w-full py-2.5 px-4 text-sm font-bold border border-gray-200 dark:border-[#333] rounded-xl focus:outline-none bg-white dark:bg-[#1a1a1a] dark:text-white" /></div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setBalConfirmStep(true)} disabled={!(Number(balAmount) >= 0)} className="w-full bg-amber-500 text-white font-bold py-3.5 rounded-xl shadow-md text-sm disabled:opacity-50">Set Balance</motion.button>
              </>) : (<div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Set {retailerName}'s balance to <span className="font-black">₹{Number(balAmount) || 0}</span>?</p>
                <div className="flex gap-3"><button onClick={() => setBalConfirmStep(false)} className="flex-1 py-3 rounded-xl font-bold text-sm text-gray-600 bg-gray-100 dark:bg-[#1a1a1a] dark:text-gray-300">Back</button><motion.button whileTap={{ scale: 0.97 }} onClick={handleSetBalance} disabled={paying} className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-amber-500 shadow-md disabled:opacity-50">{paying ? 'Setting...' : 'Confirm'}</motion.button></div>
              </div>)}
            </motion.div>
          </motion.div>
        )}</AnimatePresence>

      </>)}
    </div>
  );
}




