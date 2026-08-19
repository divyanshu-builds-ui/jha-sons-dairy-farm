import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, RefreshCw, Printer, X, Check, Download, Undo2, ChevronLeft, ChevronRight, CheckCircle2, XCircle, RotateCcw, Plus, Trash2 } from 'lucide-react';
import { db, collection, getDocs, setDoc, addDoc, doc, getDoc, updateDoc, query, where, cachedGetDocs, cachedGetDoc } from '../../services/firebase';
import { formatPrice } from '../../utils/price';
import { jsPDF } from 'jspdf';
import { registerHindiFont, setFont, hasHindi, drawText } from '../../utils/pdfHelper';
import { Link } from 'react-router-dom';
import { TableSkeleton } from '../../components/LoadingSkeleton';
import { useConfirm } from '../../components/ConfirmModal';

export default function DailyLedger() {
  const [date, setDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
  });
  const [retailers, setRetailers] = useState([]);
  const [products, setProducts] = useState([]);
  const [groupOrder, setGroupOrder] = useState([]);
  const [groupCodes, setGroupCodes] = useState({});
  const [orders, setOrders] = useState([]);
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState('All');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [stockData, setStockData] = useState(null);
  const [companyOrderData, setCompanyOrderData] = useState(null);
  const [modal, setModal] = useState(null);
  const [modalBalance, setModalBalance] = useState(0);
  const [deliverForm, setDeliverForm] = useState({ items: [], payment: '' });
  const [toast, setToast] = useState('');
  const [delivering, setDelivering] = useState(false);
  const [showDispatchConfirm, setShowDispatchConfirm] = useState(false);
  const [lastReceipt, setLastReceipt] = useState(null);
  const confirm = useConfirm();
  const [page, setPage] = useState(0);
  const [sPage, setSPage] = useState(0);
  const [bulkDispatching, setBulkDispatching] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkItems, setBulkItems] = useState([]);
  const [showExtraPicker, setShowExtraPicker] = useState(false);
  const [extraSearch, setExtraSearch] = useState('');
  const PAGE_SIZE = 15;

  const fallbackCopy = (text) => {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); setToast('Copied!'); setTimeout(() => setToast(''), 2000); } catch (e) { setToast('Copy failed'); }
    document.body.removeChild(ta);
  };

  const now = new Date();
  const todayLocal = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const tomorrowLocal = (() => { const t = new Date(); t.setDate(t.getDate() + 1); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; })();
  const oneYearAgo = (() => { const d = new Date(); d.setFullYear(d.getFullYear() - 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })();
  const isActionable = true; // Admin can update status anytime

  useEffect(() => { fetchData(); setPage(0); }, [date, selectedArea]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const prodSnap = await cachedGetDocs(collection(db, 'products'), 'products_all', 10 * 60 * 1000);
      setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.active !== false));
      const groupDoc = await getDoc(doc(db, 'settings', 'productGroups'));
      if (groupDoc.exists() && groupDoc.data().daily) {
        setGroupOrder(groupDoc.data().daily);
        setGroupCodes(groupDoc.data().codes || {});
      }
      const areasDoc = await getDoc(doc(db, 'settings', 'areas'));
      if (areasDoc.exists()) setAreas(areasDoc.data().list || []);
      let retQuery = selectedArea === 'All'
        ? query(collection(db, 'users'), where('role', '==', 'retailer'))
        : query(collection(db, 'users'), where('role', '==', 'retailer'), where('area', '==', selectedArea));
      const retList = (await getDocs(retQuery)).docs.map(d => ({ phone: d.id, ...d.data() }));
      const dateStr = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      const ordSnap = await getDocs(query(collection(db, 'orders'), where('date', '==', dateStr)));
      let ords = ordSnap.docs.map(d => ({ docId: d.id, ...d.data() }));
      if (selectedArea !== 'All') ords = ords.filter(o => o.area === selectedArea);
      setOrders(ords);
      const retPhones = new Set(retList.map(r => r.phone));
      ords.forEach(o => {
        if (o.phone && !retPhones.has(o.phone)) {
          retList.push({ phone: o.phone, name: o.retailer || o.phone, area: o.area || '' });
          retPhones.add(o.phone);
        }
      });
      retList.sort((a, b) => (a.area || '').localeCompare(b.area || '') || (a.deliveryOrder || 999) - (b.deliveryOrder || 999) || (a.name || '').localeCompare(b.name || ''));
      setRetailers(retList);
      // Fetch stock received & company order for shortage info
      const stockDocId = date.replace(/-/g, '');
      const stockDoc = await getDoc(doc(db, 'daily_stock', stockDocId));
      setStockData(stockDoc.exists() ? (stockDoc.data().items || null) : null);
      const coDoc = await getDoc(doc(db, 'company_orders', stockDocId));
      setCompanyOrderData(coDoc.exists() ? (coDoc.data().items || null) : null);
    } catch (err) {}
    setLoading(false);
  };

  // Build PRODUCT_GROUPS using Firebase group order
  const PRODUCT_GROUPS = [];
  const groupMap = {};
  // First create groups in correct order
  groupOrder.forEach(g => { groupMap[g] = []; });
  // Parse label/name to grams for size-based sorting within group
  const parseToGrams = (p) => {
    const lbl = (p.label || p.name || '').toLowerCase();
    const num = parseFloat(lbl.replace(/[^0-9.]/g, '')) || 0;
    if (/kg/.test(lbl)) return num * 1000;
    if (/ltr|lit|l$/.test(lbl)) return num * 1000;
    if (/ml/.test(lbl)) return num;
    if (/g$|gm/.test(lbl)) return num;
    // Named sizes
    if (/half|hf/.test(lbl)) return 500;
    if (/full|fl/.test(lbl)) return 1000;
    if (/qtr|quarter/.test(lbl)) return 250;
    // Fallback to price
    return p.price || 0;
  };

  products.filter(p => p.group && p.type === 'daily').sort((a, b) => parseToGrams(b) - parseToGrams(a)).forEach(p => {
    const g = p.group;
    if (!groupMap[g]) { groupMap[g] = []; }
    groupMap[g].push({ key: p.name, label: p.label || p.name });
  });
  // Build in order
  groupOrder.forEach(g => { if (groupMap[g] && groupMap[g].length > 0) PRODUCT_GROUPS.push({ group: g, items: groupMap[g] }); });
  // Add any groups not in groupOrder
  Object.keys(groupMap).forEach(g => { if (!groupOrder.includes(g) && groupMap[g].length > 0) PRODUCT_GROUPS.push({ group: g, items: groupMap[g] }); });
  // Add 3 blank columns at end for driver to write extra items
  if (PRODUCT_GROUPS.length > 0) {
    PRODUCT_GROUPS.push({ group: ' ', items: [{ key: '_blank1', label: '' }, { key: '_blank2', label: '' }, { key: '_blank3', label: '' }] });
  }

  // Build SEASONAL_GROUPS dynamically
  const SEASONAL_GROUPS = [];
  const sGroupMap = {};
  products.filter(p => p.group && p.type === 'seasonal').sort((a, b) => parseToGrams(b) - parseToGrams(a)).forEach(p => {
    if (!sGroupMap[p.group]) { sGroupMap[p.group] = []; SEASONAL_GROUPS.push({ group: p.group, items: sGroupMap[p.group] }); }
    sGroupMap[p.group].push({ key: p.name, label: p.label || p.name });
  });
  const noGroupSeasonal = products.filter(p => p.type === 'seasonal' && !p.group).sort((a, b) => parseToGrams(b) - parseToGrams(a));
  if (noGroupSeasonal.length > 0) {
    SEASONAL_GROUPS.push({ group: 'OTHER', items: noGroupSeasonal.map(p => ({ key: p.name, label: p.label || p.name })) });
  }
  const ALL_SEASONAL_KEYS = SEASONAL_GROUPS.flatMap(g => g.items.map(i => i.key));

  const ALL_FIXED_KEYS = PRODUCT_GROUPS.flatMap(g => g.items.map(i => i.key));

  const priceMap = {}; products.forEach(p => { priceMap[p.name] = p.price || 0; });
  const orderMap = {};
  orders.forEach(o => {
    if (o.status === 'Cancelled' || o.status === 'Returned') return;
    const key = o.phone || o.retailerId; if (!key) return;
    if (!orderMap[key]) orderMap[key] = { items: {}, total: 0, payment: o.paymentReceived || 0, status: o.status, docIds: [] };
    (o.items || []).forEach(item => { orderMap[key].items[item.name] = (orderMap[key].items[item.name] || 0) + (parseFloat(String(item.qty).replace(/[^0-9.]/g, '')) || 0); });
    orderMap[key].total += (o.total || 0);
    orderMap[key].docIds.push(o.docId);
  });
  const calcTotal = (oData) => oData ? Object.entries(oData.items).reduce((s, [n, q]) => s + q * (priceMap[n] || 0), 0) : 0;


  const openModal = async (ret) => {
    const oData = orderMap[ret.phone];
    if (!oData || oData.status === 'Delivered') return;
    document.body.style.overflow = 'hidden';
    const isDispatched = oData.status === 'Dispatched';
    if (isDispatched) {
      const orderDoc = await getDoc(doc(db, 'orders', oData.docIds[0]));
      const orderData = orderDoc.data();
      const items = (orderData.actualItems || []).map(i => ({ ...i }));
      setDeliverForm({ items, payment: '' });
      try {
        const balDoc = await getDoc(doc(db, 'retailer_balances', ret.phone));
        setModalBalance(balDoc.exists() ? (balDoc.data().balance || 0) : 0);
      } catch (e) { setModalBalance(0); }
      setModal({ retailer: ret, docIds: oData.docIds, mode: 'deliver', actualTotal: orderData.actualTotal || 0 });
    } else {
      const items = Object.entries(oData.items).map(([name, qty]) => ({ name, ordered: qty, actual: qty, unitPrice: priceMap[name] || 0 }));
      setDeliverForm({ items, payment: '' });
      setModal({ retailer: ret, docIds: oData.docIds, mode: 'dispatch' });
    }
  };

  const updateActual = (idx, val) => {
    const num = parseFloat(val) || 0;
    if (num < 0) return;
    setDeliverForm(prev => {
      const items = [...prev.items];
      items[idx] = { ...items[idx], actual: num };
      return { ...prev, items };
    });
  };

  const formTotal = deliverForm.items.reduce((s, it) => s + it.actual * it.unitPrice, 0);

  const handleUndoDispatch = async (ret) => {
    const oData = orderMap[ret.phone];
    if (!oData || oData.status !== 'Dispatched') return;
    const ok = await confirm({ title: 'Undo Dispatch', message: `Revert "${ret.name}" back to Confirmed? This will remove dispatch data.`, confirmText: 'Undo', type: 'danger' });
    if (!ok) return;
    try {
      for (const docId of oData.docIds) {
        await updateDoc(doc(db, 'orders', docId), { status: 'Confirmed', dispatchedAt: null, actualItems: null, actualTotal: null });
        const hSnap = await getDocs(query(collection(db, 'order_history'), where('orderId', '==', docId)));
        if (!hSnap.empty) await updateDoc(doc(db, 'order_history', hSnap.docs[0].id), { status: 'Confirmed', dispatchedAt: null });
      }
      setToast(`Reverted — ${ret.name}`);
      setTimeout(() => setToast(''), 2500);
      fetchData();
    } catch (err) {}
  };
  const handleCancelOrder = async (ret) => {
    const oData = orderMap[ret.phone];
    if (!oData || (oData.status !== 'Pending' && oData.status !== 'Confirmed')) return;
    const ok = await confirm({ title: 'Cancel Order', message: `Cancel order for "${ret.name}"? This cannot be undone.`, confirmText: 'Cancel', type: 'danger' });
    if (!ok) return;
    try {
      for (const docId of oData.docIds) {
        await updateDoc(doc(db, 'orders', docId), { status: 'Cancelled', cancelledAt: new Date().toISOString(), cancelledBy: 'admin' });
        const hSnap = await getDocs(query(collection(db, 'order_history'), where('orderId', '==', docId)));
        if (!hSnap.empty) await updateDoc(doc(db, 'order_history', hSnap.docs[0].id), { status: 'Cancelled', cancelledAt: new Date().toISOString() });
      }
      setToast(`Cancelled — ${ret.name}`);
      setTimeout(() => setToast(''), 2500);
      fetchData();
    } catch (err) {}
  };

  const handleReturnOrder = async (ret) => {
    const oData = orderMap[ret.phone];
    if (!oData || oData.status !== 'Dispatched') return;
    const ok = await confirm({ title: 'Return Order', message: `Mark "${ret.name}" order as returned? Stock will be considered back.`, confirmText: 'Return', type: 'warning' });
    if (!ok) return;
    try {
      for (const docId of oData.docIds) {
        await updateDoc(doc(db, 'orders', docId), { status: 'Returned', returnedAt: new Date().toISOString() });
        const hSnap = await getDocs(query(collection(db, 'order_history'), where('orderId', '==', docId)));
        if (!hSnap.empty) await updateDoc(doc(db, 'order_history', hSnap.docs[0].id), { status: 'Returned', returnedAt: new Date().toISOString() });
      }
      setToast(`Returned — ${ret.name}`);
      setTimeout(() => setToast(''), 2500);
      fetchData();
    } catch (err) {}
  };

  const handleBulkDispatch = async () => {
    const pendingOrders = retailers.filter(ret => {
      const oData = orderMap[ret.phone];
      return oData && (oData.status === 'Pending' || oData.status === 'Confirmed');
    });
    if (pendingOrders.length === 0) return;

    // Build bulk items for review
    const items = pendingOrders.map(ret => {
      const oData = orderMap[ret.phone];
      const orderItems = Object.entries(oData.items).map(([name, qty]) => ({ name, ordered: qty, actual: qty, unitPrice: priceMap[name] || 0 }));
      return { retailer: ret, docIds: oData.docIds, items: orderItems, edited: false };
    });
    setBulkItems(items);
    setShowBulkModal(true);
    document.body.style.overflow = 'hidden';
  };

  const updateBulkQty = (retailerIdx, itemIdx, val) => {
    const num = parseFloat(val) || 0;
    if (num < 0) return;
    setBulkItems(prev => {
      const updated = [...prev];
      updated[retailerIdx] = { ...updated[retailerIdx], items: [...updated[retailerIdx].items], edited: true };
      updated[retailerIdx].items[itemIdx] = { ...updated[retailerIdx].items[itemIdx], actual: num };
      return updated;
    });
  };

  const confirmBulkDispatch = async () => {
    const ok = await confirm({ title: 'Dispatch All', message: `Dispatch ${bulkItems.length} orders? ${bulkItems.filter(b => b.edited).length} edited.`, confirmText: `Dispatch ${bulkItems.length}`, type: 'warning' });
    if (!ok) return;
    setBulkDispatching(true);
    setBulkProgress({ done: 0, total: bulkItems.length });
    let count = 0;
    for (const bulk of bulkItems) {
      try {
        const actualTotal = bulk.items.reduce((s, i) => s + i.actual * i.unitPrice, 0);
        for (const docId of bulk.docIds) {
          await updateDoc(doc(db, 'orders', docId), {
            status: 'Dispatched', dispatchedAt: new Date().toISOString(),
            actualItems: bulk.items, actualTotal,
          });
          const hSnap = await getDocs(query(collection(db, 'order_history'), where('orderId', '==', docId)));
          if (!hSnap.empty) await updateDoc(doc(db, 'order_history', hSnap.docs[0].id), { status: 'Dispatched', dispatchedAt: new Date().toISOString() });
        }
      } catch (err) {}
      count++;
      setBulkProgress({ done: count, total: bulkItems.length });
    }
    setBulkDispatching(false);
    setShowBulkModal(false);
    document.body.style.overflow = '';
    setToast(`${count} orders dispatched!`);
    setTimeout(() => setToast(''), 3000);
    fetchData();
  };

  const handleDispatch = async () => {
    if (!modal || delivering) return;
    const hasEdits = deliverForm.items.some(i => i.actual !== i.ordered || i.extra);
    if (hasEdits && !showDispatchConfirm) { setShowDispatchConfirm(true); return; }
    setShowDispatchConfirm(false);
    setDelivering(true);
    try {
      for (const docId of modal.docIds) {
        await updateDoc(doc(db, 'orders', docId), {
          status: 'Dispatched', dispatchedAt: new Date().toISOString(),
          actualItems: deliverForm.items, actualTotal: formTotal,
        });
        // Sync to order_history
        const hSnap1 = await getDocs(query(collection(db, 'order_history'), where('orderId', '==', docId)));
        if (!hSnap1.empty) await updateDoc(doc(db, 'order_history', hSnap1.docs[0].id), { status: 'Dispatched', dispatchedAt: new Date().toISOString() });
      }
      setModal(null); setShowDispatchConfirm(false); setShowExtraPicker(false);
      document.body.style.overflow = '';
      setToast(`Dispatched — ${modal.retailer.name}`);
      setTimeout(() => setToast(''), 2500);
      fetchData();
    } catch (err) {}
    setDelivering(false);
  };

  const handleDeliver = async () => {
    if (!modal || delivering) return;
    setDelivering(true);
    try {
      const actualTotal = modal.actualTotal || 0;
      const payment = Number(deliverForm.payment) || 0;
      for (const docId of modal.docIds) {
        await updateDoc(doc(db, 'orders', docId), {
          status: 'Delivered', deliveredAt: new Date().toISOString(),
          paymentReceived: payment,
        });
        // Sync to order_history
        const hSnap2 = await getDocs(query(collection(db, 'order_history'), where('orderId', '==', docId)));
        if (!hSnap2.empty) await updateDoc(doc(db, 'order_history', hSnap2.docs[0].id), { status: 'Delivered', deliveredAt: new Date().toISOString() });
      }
      if (actualTotal > 0) {
        const items = deliverForm.items;
        const fixedItems = items.filter(i => (i.actual || i.qty) > 0 && ALL_FIXED_KEYS.includes(i.name));
        const seasonalItems = items.filter(i => (i.actual || i.qty) > 0 && !ALL_FIXED_KEYS.includes(i.name));
        const fixedAmt = fixedItems.reduce((s, i) => s + (i.actual || i.qty || 0) * (i.unitPrice || 0), 0);
        const seasonalAmt = seasonalItems.reduce((s, i) => s + (i.actual || i.qty || 0) * (i.unitPrice || 0), 0);
        if (fixedAmt > 0) {
          await addDoc(collection(db, 'ledger'), {
            retailerId: modal.retailer.phone, retailer: modal.retailer.name,
            amount: fixedAmt, type: 'debit', note: 'Delivery',
            date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
            createdAt: new Date().toISOString(),
          });
        }
        if (seasonalAmt > 0) {
          await addDoc(collection(db, 'ledger'), {
            retailerId: modal.retailer.phone, retailer: modal.retailer.name,
            amount: seasonalAmt, type: 'debit', note: 'Seasonal',
            date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
            createdAt: new Date().toISOString(),
          });
        }
      }
      if (payment > 0) {
        await addDoc(collection(db, 'ledger'), {
          retailerId: modal.retailer.phone, retailer: modal.retailer.name,
          amount: payment, type: 'credit', note: 'Payment collected on delivery',
          date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
          createdAt: new Date().toISOString(),
        });
      }
      const balRef = doc(db, 'retailer_balances', modal.retailer.phone);
      const balSnap = await getDoc(balRef);
      const curBal = balSnap.exists() ? (balSnap.data().balance || 0) : 0;
      await setDoc(balRef, { balance: curBal + actualTotal - payment, updatedAt: new Date().toISOString() }, { merge: true });
      if (payment > 0) {
        setLastReceipt({ name: modal.retailer.name, phone: modal.retailer.phone, shop: modal.retailer.shop || '', amount: payment, note: 'Payment on delivery', prevDue: curBal + actualTotal, balanceAfter: curBal + actualTotal - payment });
      }
      setModal(null);
      document.body.style.overflow = '';
      setToast(`Delivered — ${modal.retailer.name}`);
      setTimeout(() => setToast(''), 2500);
      fetchData();
    } catch (err) {}
    setDelivering(false);
  };

  // ===== PDF =====
  const printPDF = () => {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
    registerHindiFont(pdf);
    const w = pdf.internal.pageSize.getWidth();
    const h = pdf.internal.pageSize.getHeight();
    const m = 3;
    const dateStr = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const areaName = selectedArea === 'All' ? 'All Areas' : selectedArea;
    const siW = 7; const retW = 40; const totalW = 20; const paidW = 20; const signW = 20;
    const fixedCols = siW + retW + totalW + paidW + signW;
    const availW = w - (m * 2) - fixedCols;
    const qtyW = ALL_FIXED_KEYS.length > 0 ? Math.max(5, Math.floor(availW / ALL_FIXED_KEYS.length)) : 10;
    const qtyFontSize = qtyW < 7 ? 9 : qtyW < 10 ? 11 : 13;
        const rowH = 11; const groupH = 8; const subH = 8;
    let y = m; let pageNum = 1;

    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(14); pdf.setTextColor(0, 0, 0);
    pdf.text('LUCY GARDEN', m, y + 5);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
    drawText(pdf, `${areaName}  |  ${dateStr}`, w - m, y + 5, { size: 10, align: 'right' });
    y += 8; pdf.setDrawColor(0); pdf.setLineWidth(0.3); pdf.line(m, y, w - m, y); y += 2;

    const drawHeader = () => {
      pdf.setDrawColor(100, 100, 100); pdf.setLineWidth(0.3);
      pdf.setFillColor(210, 210, 210);
      pdf.rect(m, y, siW, groupH + subH, 'FD');
      pdf.rect(m + siW, y, retW, groupH + subH, 'FD');
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(0, 0, 0);
      pdf.text('SI', m + siW / 2, y + (groupH + subH) / 2 + 1, { align: 'center' });
      pdf.text('RETAILER', m + siW + 2, y + (groupH + subH) / 2 + 1);
      let gx = m + siW + retW;
      PRODUCT_GROUPS.forEach(g => {
        const span = g.items.length * qtyW;
        pdf.setFillColor(210, 210, 210); pdf.rect(gx, y, span, groupH, 'FD');
        pdf.setFont('helvetica', 'bold');
        const gLabel = groupCodes[g.group] || g.group;
        let gFs = 10; pdf.setFontSize(gFs); while (pdf.getTextWidth(gLabel) > span - 2 && gFs > 7) { gFs -= 0.5; pdf.setFontSize(gFs); } pdf.text(gLabel, gx + span / 2, y + 5.5, { align: 'center' });
        gx += span;
      });
      pdf.setFillColor(210, 210, 210);
      pdf.rect(gx, y, totalW, groupH + subH, 'FD');
      pdf.setFontSize(9); pdf.text('TOTAL', gx + totalW / 2, y + (groupH + subH) / 2 - 1, { align: 'center' });
      pdf.setFontSize(6); pdf.text('(Daily+Seasonal)', gx + totalW / 2, y + (groupH + subH) / 2 + 4, { align: 'center' });
      gx += totalW;
      pdf.setFillColor(210, 210, 210); pdf.rect(gx, y, paidW, groupH + subH, 'FD');
      pdf.text('PAID', gx + paidW / 2, y + (groupH + subH) / 2 + 1, { align: 'center' });
      gx += paidW;
      pdf.setFillColor(210, 210, 210); pdf.rect(gx, y, signW, groupH + subH, 'FD');
      pdf.setFontSize(8); pdf.text('SIGN', gx + signW / 2, y + (groupH + subH) / 2 + 1, { align: 'center' });
      const sy = y + groupH; gx = m + siW + retW;
      PRODUCT_GROUPS.forEach(g => { g.items.forEach(item => {
        pdf.setFillColor(230, 230, 230); pdf.rect(gx, sy, qtyW, subH, 'FD');
        pdf.setFont('helvetica', 'bold'); pdf.setTextColor(0, 0, 0);
        const lbl = item.label || '';
        let lblFs = 9; pdf.setFontSize(lblFs); while (pdf.getTextWidth(lbl) > qtyW - 1 && lblFs > 5) { lblFs -= 0.5; pdf.setFontSize(lblFs); }
        pdf.text(lbl, gx + qtyW / 2, sy + 5, { align: 'center' }); gx += qtyW;
      }); });
      y += groupH + subH;
    };
    drawHeader();

    retailers.forEach((ret, i) => {
      if (y + rowH > h - 8) { pdf.addPage(); pageNum++; y = m; pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6); pdf.setTextColor(130, 130, 130); pdf.text(`Pg ${pageNum}`, w - m, y + 3, { align: 'right' }); pdf.setTextColor(0, 0, 0); y += 4; drawHeader(); }
      const oData = orderMap[ret.phone]; const total = calcTotal(oData);
      pdf.setDrawColor(100, 100, 100); pdf.setLineWidth(0.3); let rx = m;
      pdf.setFillColor(255, 255, 255); pdf.rect(rx, y, siW, rowH, 'FD');
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(0, 0, 0);
      pdf.text(`${i + 1}`, rx + siW / 2, y + 6.5, { align: 'center' }); rx += siW;
      pdf.setFillColor(255, 255, 255); pdf.rect(rx, y, retW, rowH, 'FD');
      const retNamePdf = (ret.name || '-').slice(0, 25);
      drawText(pdf, retNamePdf, rx + 1.5, y + 6.5, { bold: true, size: 10, maxWidth: retW - 3 });
      pdf.setFont('helvetica', 'normal'); pdf.setTextColor(0,0,0);
      rx += retW;
      ALL_FIXED_KEYS.forEach(key => { pdf.setFillColor(255, 255, 255); pdf.rect(rx, y, qtyW, rowH, 'FD'); const qty = oData?.items[key] || 0; if (qty > 0) { pdf.setFont('helvetica', 'bold'); pdf.setFontSize(qtyFontSize); pdf.text(`${qty}`, rx + qtyW / 2, y + 7, { align: 'center' }); } rx += qtyW; });
      pdf.setFillColor(255, 255, 255); pdf.rect(rx, y, totalW, rowH, 'FD');
      if (total > 0 && !ret.hideTotal) { pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.text(`${total.toFixed(2)}`, rx + totalW / 2, y + 5.5, { align: 'center' }); } rx += totalW;
      pdf.setFillColor(255, 255, 255); pdf.rect(rx, y, paidW, rowH, 'FD');
      if (oData?.payment > 0) { pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.text(`${oData.payment.toFixed(0)}`, rx + paidW / 2, y + 5.5, { align: 'center' }); } rx += paidW;
      pdf.setFillColor(255, 255, 255); pdf.rect(rx, y, signW, rowH, 'FD');
      y += rowH;
    });

    // TOTAL ROW
    if (y + rowH > h - 8) { pdf.addPage(); pageNum++; y = m; pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6); pdf.setTextColor(130, 130, 130); pdf.text(`Pg ${pageNum}`, w - m, y + 3, { align: 'right' }); pdf.setTextColor(0, 0, 0); y += 4; drawHeader(); }
    pdf.setDrawColor(50, 50, 50); pdf.setLineWidth(0.4); pdf.line(m, y, m + siW + retW + ALL_FIXED_KEYS.length * qtyW + totalW + paidW + signW, y);
    y += 1;
    pdf.setDrawColor(100, 100, 100); pdf.setLineWidth(0.3); let rx = m;
    pdf.setFillColor(220, 220, 220); pdf.rect(rx, y, siW, rowH, 'FD'); rx += siW;
    pdf.setFillColor(220, 220, 220); pdf.rect(rx, y, retW, rowH, 'FD');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(0, 0, 0);
    pdf.text('TOTAL', rx + 2, y + 6.5); rx += retW;
    ALL_FIXED_KEYS.forEach(key => {
      pdf.setFillColor(220, 220, 220); pdf.rect(rx, y, qtyW, rowH, 'FD');
      const colTotal = retailers.reduce((s, ret) => s + (orderMap[ret.phone]?.items[key] || 0), 0);
      if (colTotal > 0) { pdf.setFont('helvetica', 'bold'); pdf.setFontSize(colTotal >= 1000 ? 8 : colTotal >= 100 ? 10 : qtyFontSize); pdf.text(`${colTotal}`, rx + qtyW / 2, y + 7, { align: 'center' }); }
      rx += qtyW;
    });
    pdf.setFillColor(220, 220, 220); pdf.rect(rx, y, totalW, rowH, 'FD');
    rx += totalW;
    pdf.setFillColor(220, 220, 220); pdf.rect(rx, y, paidW, rowH, 'FD');
    rx += paidW;
    pdf.setFillColor(220, 220, 220); pdf.rect(rx, y, signW, rowH, 'FD');
    y += rowH;

    for (let b = 0; b < 5; b++) {
      if (y + rowH > h - 8) { pdf.addPage(); pageNum++; y = m; pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6); pdf.setTextColor(130, 130, 130); pdf.text(`Pg ${pageNum}`, w - m, y + 3, { align: 'right' }); pdf.setTextColor(0, 0, 0); y += 4; drawHeader(); }
      pdf.setDrawColor(100, 100, 100); pdf.setLineWidth(0.3); let rx = m;
      pdf.setFillColor(255, 255, 255); pdf.rect(rx, y, siW, rowH, 'FD');
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(0, 0, 0);
      pdf.text(`${retailers.length + b + 1}`, rx + siW / 2, y + 5.5, { align: 'center' }); rx += siW;
      pdf.setFillColor(255, 255, 255); pdf.rect(rx, y, retW, rowH, 'FD'); rx += retW;
      ALL_FIXED_KEYS.forEach(() => { pdf.setFillColor(255, 255, 255); pdf.rect(rx, y, qtyW, rowH, 'FD'); rx += qtyW; });
      pdf.setFillColor(255, 255, 255); pdf.rect(rx, y, totalW, rowH, 'FD'); rx += totalW;
      pdf.setFillColor(255, 255, 255); pdf.rect(rx, y, paidW, rowH, 'FD'); rx += paidW;
      pdf.setFillColor(255, 255, 255); pdf.rect(rx, y, signW, rowH, 'FD');
      y += rowH;
    }


    y += 12; if (y > h - 20) { pdf.addPage(); y = m; }
    pdf.setDrawColor(0); pdf.setLineWidth(0.25); pdf.line(m, y, w - m, y); y += 10;
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10);
    pdf.text('Driver Name: ________________________________', m, y);
    pdf.text('Total Collected: Rs. ________________', w / 2 + 10, y);
    y += 12; pdf.text('Driver Sign: ________________________________', m, y);
    y += 8; pdf.setFontSize(7); pdf.setTextColor(80, 80, 80);
    pdf.text(`Lucy Garden | ${areaName} | ${dateStr} | Generated: ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`, w / 2, y, { align: 'center' });
    pdf.save(`LG_${areaName.replace(/\s/g, '_')}_${dateStr.replace(/[\s,]/g, '')}.pdf`);
  };
  // ===== SEASONAL PDF =====
  const hasSeasonalOrders = retailers.some(ret => {
    const oData = orderMap[ret.phone];
    return oData && ALL_SEASONAL_KEYS.some(k => (oData.items[k] || 0) > 0);
  });

  const printSeasonalPDF = () => {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    registerHindiFont(pdf);
    const w = pdf.internal.pageSize.getWidth();
    const h = pdf.internal.pageSize.getHeight();
    const m = 12;
    const dateStr = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    const areaName = selectedArea === 'All' ? 'All Areas' : selectedArea;
    let y = m;

    // Header
    pdf.setFillColor(15, 23, 42); pdf.rect(0, 0, w, 22, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(13); pdf.setTextColor(255, 255, 255);
    pdf.text('LUCY GARDEN', m, 9);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9);
    pdf.text('Seasonal Orders', m, 15);
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10);
    pdf.text(`${areaName}  |  ${dateStr}`, w - m, 9, { align: 'right' });
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8);
    const seasonalRetailers = retailers.filter(ret => {
      const oData = orderMap[ret.phone];
      return oData && ALL_SEASONAL_KEYS.some(k => (oData.items[k] || 0) > 0);
    });
    pdf.text(`${seasonalRetailers.length} retailers`, w - m, 15, { align: 'right' });
    y = 28;

    let grandTotal = 0;

    seasonalRetailers.forEach((ret, i) => {
      const oData = orderMap[ret.phone];
      // Group items by seasonal group
      const groupedItems = [];
      SEASONAL_GROUPS.forEach(g => {
        const items = g.items.filter(item => (oData.items[item.key] || 0) > 0).map(item => ({
          name: item.key, label: item.label, qty: oData.items[item.key], price: priceMap[item.key] || 0
        }));
        if (items.length > 0) groupedItems.push({ group: g.group, items });
      });
      if (groupedItems.length === 0) return;

      const retailerTotal = groupedItems.reduce((s, g) => s + g.items.reduce((t, i) => t + i.qty * i.price, 0), 0);
      grandTotal += retailerTotal;

      // Check space needed (approx)
      const linesNeeded = 10 + groupedItems.length * 6;
      if (y + linesNeeded > h - 15) { pdf.addPage(); y = m; }

      // Retailer header
      pdf.setFillColor(225, 225, 225); pdf.rect(m, y, w - m * 2, 9, 'F');
      const sRetName = `${i + 1}. ${(ret.name || '-').slice(0, 30)}`;
      drawText(pdf, sRetName, m + 3, y + 6, { bold: true, size: 10, color: [15, 23, 42] });
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(50, 50, 50);
      pdf.text(ret.phone || '', w - m - 3, y + 6, { align: 'right' });
      y += 11;

      // Items by group
      groupedItems.forEach(g => {
        const gLabel = g.group;
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(50, 50, 50);
        pdf.text(gLabel, m + 5, y + 3); y += 5;
        g.items.forEach(item => {
          if (y + 5 > h - 15) { pdf.addPage(); y = m; }
          pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(15, 23, 42);
          pdf.text(item.label || item.name, m + 10, y + 3);
          pdf.setFont('helvetica', 'bold');
          pdf.text(`${item.qty}`, m + 80, y + 3);
          pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(50, 50, 50);
          pdf.text(`Rs.${(item.qty * item.price).toFixed(0)}`, w - m - 3, y + 3, { align: 'right' });
          y += 5;
        });
      });

      // Retailer total
      pdf.setDrawColor(100, 100, 100); pdf.setLineWidth(0.3); pdf.line(m + 5, y, w - m - 3, y);
      y += 4;
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(15, 23, 42);
      pdf.text(`Total: Rs.${retailerTotal.toFixed(0)}`, w - m - 3, y, { align: 'right' });
      y += 8;
    });

    // Product-wise Total
    if (y + 20 > h - 15) { pdf.addPage(); y = m; }
    y += 4;
    pdf.setFillColor(215, 215, 215); pdf.rect(m, y, w - m * 2, 8, 'F');
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(15, 23, 42);
    pdf.text('PRODUCT TOTALS', m + 3, y + 5.5);
    y += 10;
    ALL_SEASONAL_KEYS.forEach(key => {
      const total = retailers.reduce((s, ret) => s + (orderMap[ret.phone]?.items[key] || 0), 0);
      if (total > 0) {
        if (y + 5 > h - 15) { pdf.addPage(); y = m; }
        const product = products.find(p => p.name === key);
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(15, 23, 42);
        drawText(pdf, product?.label || key, m + 5, y + 3, { size: 9 });
        pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.setTextColor(15, 23, 42);
        pdf.text(`${total}`, m + 90, y + 3);
        pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(50, 50, 50);
        pdf.text(`Rs.${(total * (priceMap[key] || 0)).toFixed(0)}`, w - m - 3, y + 3, { align: 'right' });
        y += 5;
      }
    });

    // Grand Total
    if (y + 20 > h - 15) { pdf.addPage(); y = m; }
    y += 4;
    pdf.setDrawColor(15, 23, 42); pdf.setLineWidth(0.5); pdf.line(m, y, w - m, y);
    y += 7;
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.setTextColor(15, 23, 42);
    pdf.text(`GRAND TOTAL: Rs.${grandTotal.toFixed(0)}`, m, y);
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.setTextColor(50, 50, 50);
    pdf.text(`${seasonalRetailers.length} retailers  |  ${ALL_SEASONAL_KEYS.reduce((s, k) => s + retailers.reduce((t, r) => t + (orderMap[r.phone]?.items[k] || 0), 0), 0)} total items`, w - m, y, { align: 'right' });

    // Footer
    y = h - 8;
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(80, 80, 80);
    pdf.text(`Lucy Garden | Seasonal | ${areaName} | ${dateStr} | Generated: ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`, w / 2, y, { align: 'center' });
    pdf.save(`LG_Seasonal_${areaName.replace(/\s/g, '_')}_${dateStr.replace(/[\s,]/g, '')}.pdf`);
  };


  if (loading) return <TableSkeleton />;

  return (
    <>
      <div className="space-y-4 overflow-hidden">
      <AnimatePresence>{toast && (<motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="fixed top-[4.5rem] left-4 right-4 sm:left-auto sm:right-6 sm:w-auto z-[100] flex items-center gap-2 px-4 py-2.5 rounded-md shadow-md bg-[#1e3a5f] text-white"><Check size={13} strokeWidth={3} /><span className="text-sm font-semibold">{toast}</span></motion.div>)}</AnimatePresence>

      {/* Controls */}
      <div className="bg-white dark:bg-[#111111] border border-[#e2e0db] dark:border-[#222] rounded-lg shadow-sm p-3 space-y-2">

        {/* Row 1 — date + area + search(desktop) + refresh */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 border border-[#e2e0db] dark:border-[#2a2a2a] rounded-md px-2.5 py-1.5 bg-[#f8f7f4] dark:bg-[#1a1a1a] shrink-0">
            <Calendar size={12} className="text-[#9c9890] shrink-0" />
            <input type="date" value={date} onChange={e => setDate(e.target.value)} min={oneYearAgo} max={tomorrowLocal}
              className="text-sm font-medium text-[#1a1917] dark:text-[#e5e3df] outline-none bg-transparent w-[118px]" />
          </div>
          <select value={selectedArea} onChange={e => setSelectedArea(e.target.value)}
            className="text-sm font-medium text-[#1a1917] dark:text-[#e5e3df] bg-[#f8f7f4] dark:bg-[#1a1a1a] border border-[#e2e0db] dark:border-[#2a2a2a] rounded-md px-2.5 py-1.5 outline-none shrink-0">
            <option value="All">All Areas</option>
            {areas.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
          {/* Search — desktop only */}
          <div className="relative flex-1 hidden sm:block">
            <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9c9890]" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <input type="text" placeholder="Search retailer..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full text-sm bg-[#f8f7f4] dark:bg-[#1a1a1a] border border-[#e2e0db] dark:border-[#2a2a2a] rounded-md pl-7 pr-7 py-1.5 outline-none focus:border-[#1e3a5f] dark:text-[#e5e3df] placeholder:text-[#9c9890]" />
            {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#e2e0db] dark:bg-[#333] rounded-sm flex items-center justify-center"><X size={8} className="text-[#6b6860]" /></button>}
          </div>
          <button onClick={fetchData} title="Refresh"
            className="p-1.5 bg-[#f8f7f4] dark:bg-[#1a1a1a] border border-[#e2e0db] dark:border-[#2a2a2a] rounded-md hover:bg-[#f0ede8] dark:hover:bg-[#222] shrink-0">
            <RefreshCw size={13} className="text-[#6b6860]" />
          </button>
        </div>

        {/* Row 2 — search mobile only */}
        <div className="relative sm:hidden">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9c9890]" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input type="text" placeholder="Search retailer..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full text-sm bg-[#f8f7f4] dark:bg-[#1a1a1a] border border-[#e2e0db] dark:border-[#2a2a2a] rounded-md pl-7 pr-7 py-1.5 outline-none focus:border-[#1e3a5f] dark:text-[#e5e3df] placeholder:text-[#9c9890]" />
          {search && <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-[#e2e0db] dark:bg-[#333] rounded-sm flex items-center justify-center"><X size={8} className="text-[#6b6860]" /></button>}
        </div>

        {/* Row 3 — actions only */}
        <div className="flex items-center justify-between gap-2">
          {/* PDF + Excel — left */}
          <div className="flex items-center gap-1.5">
            <motion.button whileTap={{ scale: 0.96 }} onClick={printPDF} title="Daily PDF"
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#1e3a5f] hover:bg-[#162d4a] text-white text-xs font-semibold rounded-md transition-colors">
              <Printer size={12} /> PDF
            </motion.button>
            {hasSeasonalOrders && (
              <motion.button whileTap={{ scale: 0.96 }} onClick={printSeasonalPDF} title="Seasonal PDF"
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#92400e] hover:bg-[#78350f] text-white text-xs font-semibold rounded-md transition-colors">
                <Printer size={12} /> Seasonal
                <span className="bg-white/20 px-1 py-0.5 rounded text-[9px] font-bold">{retailers.filter(ret => { const o = orderMap[ret.phone]; return o && ALL_SEASONAL_KEYS.some(k => (o.items[k] || 0) > 0); }).length}</span>
              </motion.button>
            )}
            <motion.button whileTap={{ scale: 0.96 }} title="Export Excel" onClick={() => {
              const dailyKeys = ALL_FIXED_KEYS.filter(k => !k.startsWith('_'));
              const seasonalKeys = ALL_SEASONAL_KEYS;
              const headers = ['SI', 'Retailer', ...dailyKeys, ...seasonalKeys, 'Daily Total', 'Seasonal Total', 'Grand Total'];
              const rows = retailers.map((ret, i) => { const oData = orderMap[ret.phone]; const dTotal = oData ? dailyKeys.reduce((s, k) => s + (oData.items[k] || 0) * (priceMap[k] || 0), 0) : 0; const sTotal = oData ? seasonalKeys.reduce((s, k) => s + (oData.items[k] || 0) * (priceMap[k] || 0), 0) : 0; return [i + 1, `"${ret.name}"`, ...dailyKeys.map(k => oData?.items[k] || 0), ...seasonalKeys.map(k => oData?.items[k] || 0), dTotal.toFixed(2), sTotal.toFixed(2), (dTotal + sTotal).toFixed(2)]; });
              const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
              const blob = new Blob([csv], { type: 'text/csv' }); const url = URL.createObjectURL(blob);
              const a = document.createElement('a'); a.href = url; a.download = `DailySheet_${date}.csv`; a.click();
            }} className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#166534] hover:bg-[#14532d] text-white text-xs font-semibold rounded-md transition-colors">
              <Download size={12} /> Excel
            </motion.button>
          </div>
          {/* Bulk Dispatch — right */}
          <div>
            {isActionable && (() => {
              const pendingCount = retailers.filter(ret => { const o = orderMap[ret.phone]; return o && (o.status === 'Pending' || o.status === 'Confirmed'); }).length;
              return pendingCount > 0 ? (
                <motion.button whileTap={{ scale: 0.96 }} onClick={handleBulkDispatch} disabled={bulkDispatching}
                  className="flex items-center gap-1.5 bg-[#166534] hover:bg-[#14532d] text-white px-2.5 py-1.5 rounded-md text-xs font-semibold disabled:opacity-50 transition-colors">
                  {bulkDispatching
                    ? <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full" />
                    : <><Check size={11} /> Dispatch All <span className="font-mono">({pendingCount})</span></>}
                </motion.button>
              ) : null;
            })()}
          </div>
        </div>

      </div>

      {/* Stats line — outside card, above table */}
      <div className="flex items-center px-0.5">
        <p className="text-xs text-[#9c9890] dark:text-[#6b6860]">
          <span className="font-mono font-semibold text-[#1a1917] dark:text-[#e5e3df]">{retailers.length}</span> retailers
          <span className="mx-1.5">&middot;</span>
          <span className="font-mono font-semibold text-[#92400e]">{orders.length}</span> orders
          {(() => { const p = retailers.filter(ret => { const o = orderMap[ret.phone]; return o && (o.status === 'Pending' || o.status === 'Confirmed'); }).length; return p > 0 ? <><span className="mx-1.5">&middot;</span><span className="font-mono font-semibold text-[#991b1b]">{p}</span> pending</> : null; })()}
        </p>
      </div>

      {/* Stock Status Banner */}
      {stockData && companyOrderData && (() => {
        const shortages = Object.entries(companyOrderData).filter(([name, ordered]) => (stockData[name] || 0) < ordered).map(([name, ordered]) => ({ name, ordered, received: stockData[name] || 0, short: ordered - (stockData[name] || 0) }));
        const excess = Object.entries(companyOrderData).filter(([name, ordered]) => (stockData[name] || 0) > ordered).map(([name, ordered]) => ({ name, ordered, received: stockData[name] || 0, extra: (stockData[name] || 0) - ordered }));
        if (shortages.length === 0 && excess.length === 0) return (
          <div className="flex items-center gap-2 bg-[#f0fdf4] dark:bg-[#0a1f0f] border border-[#bbf7d0] dark:border-[#166534]/40 rounded-md px-3 py-2">
            <CheckCircle2 size={13} className="text-[#166534] shrink-0" />
            <span className="text-xs font-medium text-[#166534] dark:text-[#4ade80]">Stock received — all matched</span>
          </div>
        );
        return (
          <div className="bg-[#fffbeb] dark:bg-[#1a1200] border border-[#fde68a] dark:border-[#78350f]/40 rounded-md px-3 py-2.5">
            <div className="flex items-center gap-1.5 mb-2">
              <XCircle size={13} className="text-[#92400e] shrink-0" />
              <span className="text-xs font-semibold text-[#92400e] dark:text-[#fbbf24]">
                Stock mismatch — {shortages.length > 0 && `${shortages.length} short`}{shortages.length > 0 && excess.length > 0 && ', '}{excess.length > 0 && `${excess.length} extra`}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {shortages.map(s => (
                <span key={s.name} className="font-mono text-[10px] font-semibold bg-[#fef2f2] dark:bg-[#1f0a0a] text-[#991b1b] dark:text-[#fca5a5] border border-[#fecaca] dark:border-[#991b1b]/40 px-2 py-0.5 rounded">
                  {s.name} {s.received}/{s.ordered} <span className="opacity-80">-{s.short}</span>
                </span>
              ))}
              {excess.map(s => (
                <span key={s.name} className="font-mono text-[10px] font-semibold bg-[#f0fdf4] dark:bg-[#0a1f0f] text-[#166534] dark:text-[#4ade80] border border-[#bbf7d0] dark:border-[#166534]/40 px-2 py-0.5 rounded">
                  {s.name} {s.received}/{s.ordered} <span className="opacity-80">+{s.extra}</span>
                </span>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Table */}
      <div className="bg-white dark:bg-[#111111] rounded-lg border border-[#e2e0db] dark:border-[#222] overflow-hidden">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="border-collapse w-full" style={{minWidth:'700px'}}>
            <thead className="sticky top-0 z-30">
              <tr className="bg-[#1e3a5f]">
                <th rowSpan={2} className="sticky left-0 z-20 bg-[#1e3a5f] px-1 py-3 text-center text-white font-semibold text-xs border-r border-white/10" style={{width:'26px',minWidth:'26px'}}>SI</th>
                <th rowSpan={2} className="sticky left-[26px] z-20 bg-[#1e3a5f] px-2 py-3 text-left text-white font-semibold text-xs border-r border-white/10" style={{width:'95px',minWidth:'95px'}}>Retailer</th>
                {PRODUCT_GROUPS.map((g, gi) => (<th key={gi} colSpan={g.items.length} className="px-1 py-3 text-center font-bold text-white text-xs border-r border-white/10 tracking-wide">{g.group}{groupCodes[g.group] ? ` (${groupCodes[g.group]})` : ''}</th>))}
                <th rowSpan={2} className="px-1 py-3 text-center text-white font-semibold text-xs border-r border-white/10" style={{width:'60px',minWidth:'60px'}}>TOTAL<br/><span className="text-[9px] font-normal text-white/50">D+S</span></th>
                <th rowSpan={2} className="px-1 py-3 text-center text-white font-semibold text-xs border-r border-white/10" style={{width:'46px',minWidth:'46px'}}>PAID</th>
                <th rowSpan={2} className="sticky right-0 z-20 bg-[#1e3a5f] px-1 py-3 text-center text-white font-semibold text-xs border-l border-white/10" style={{width:'66px',minWidth:'66px'}}>ACTION</th>
              </tr>
              <tr className="bg-[#162d4a]">
                {PRODUCT_GROUPS.flatMap(g => g.items).map(item => (<th key={item.key} className="px-1 py-2 text-center font-medium text-white/70 border-r border-white/10 text-[11px]">{item.label}<br/><span className="font-mono text-[10px] text-white/40">{priceMap[item.key] ? `₹${priceMap[item.key]}` : ''}</span></th>))}
              </tr>
            </thead>
            <tbody>
              {(() => {
                const filteredRetailers = retailers.filter(ret => {
                  if (!search) return true;
                  const s = search.toLowerCase();
                  return ret.name?.toLowerCase().includes(s) || ret.phone?.slice(-4).includes(s) || ret.phone?.includes(s) || ret.area?.toLowerCase().includes(s);
                });
                const pagedRetailers = filteredRetailers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
                return pagedRetailers.map((ret, i) => {
                  const oData = orderMap[ret.phone];
                  const hasOrder = !!oData;
                  const total = calcTotal(oData);
                  const isDelivered = oData?.status === 'Delivered';
                  const si = page * PAGE_SIZE + i + 1;
                  const bg = isDelivered ? '#f0fdf4' : hasOrder ? '#f4fbf4' : i % 2 === 0 ? '#ffffff' : '#f8f7f4';
                  const bgDark = isDelivered ? '#0d200f' : hasOrder ? '#0d1a0d' : i % 2 === 0 ? '#111111' : '#141414';
                  return (
                    <tr key={ret.phone} className="hover:bg-[#eef3fa] dark:hover:bg-[#1a2a3a] transition-colors" style={{backgroundColor: bg}}>
                      <td className="sticky left-0 z-10 px-1 py-2.5 text-center font-mono text-xs text-[#9c9890] border-b border-r border-[#e2e0db] dark:border-[#222]" style={{backgroundColor: bg, minWidth:'26px', width:'26px'}}>{si}</td>
                      <td className="sticky left-[26px] z-10 px-2 py-2.5 border-b border-r border-[#e2e0db] dark:border-[#222]" style={{backgroundColor: bg, minWidth:'95px', width:'95px'}}>
                        <div className="flex items-center gap-1">
                          {selectedArea !== 'All' && <input key={ret.phone} type="number" min="1" className="w-6 h-6 text-[10px] font-mono font-semibold text-center bg-[#f8f7f4] dark:bg-[#1a1a1a] border border-[#e2e0db] dark:border-[#333] rounded text-[#1e3a5f] dark:text-[#7aaacb] outline-none focus:border-[#1e3a5f] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" defaultValue={ret.deliveryOrder && ret.deliveryOrder !== 999 ? ret.deliveryOrder : ''} placeholder="#" onBlur={async (e) => { const val = Number(e.target.value) || 999; const oldVal = ret.deliveryOrder || 999; if (val === oldVal) return; const ok = await confirm({ title: 'Update Route Order', message: `Set ${ret.name}'s delivery order to #${val === 999 ? 'none' : val}?`, confirmText: 'Save', type: 'warning' }); if (ok) { try { await updateDoc(doc(db, 'users', ret.phone), { deliveryOrder: val }); ret.deliveryOrder = val; } catch(err){} } else { e.target.value = oldVal !== 999 ? oldVal : ''; } }} />}
                          <div className="min-w-0">
                            <p className="font-semibold text-[12px] text-[#1a1917] dark:text-white truncate">{ret.name}</p>
                            <p className="font-mono text-[10px] text-[#9c9890]">{ret.phone}</p>
                          </div>
                        </div>
                      </td>
                      {ALL_FIXED_KEYS.map(key => {
                        const qty = oData?.items[key] || 0;
                        return (<td key={key} className="px-1 py-2.5 text-center border-b border-r border-[#e2e0db]/60 dark:border-[#1e1e1e]">{qty > 0 ? <span className="font-mono font-bold text-[14px] text-[#1e3a5f] dark:text-[#7aaacb]">{qty}</span> : <span className="text-[#c8c5be] dark:text-[#333]">·</span>}</td>);
                      })}
                      <td className="px-1 py-2.5 text-center border-b border-r border-[#e2e0db] dark:border-[#222]">{total > 0 ? <span className="font-mono font-semibold text-[12px] text-[#1a1917] dark:text-white">₹{total.toFixed(0)}</span> : <span className="text-[#c8c5be] dark:text-[#333]">—</span>}</td>
                      <td className="px-1 py-2.5 text-center border-b border-r border-[#e2e0db] dark:border-[#222]">{oData?.payment > 0 ? <span className="font-mono font-semibold text-[12px] text-[#166534] dark:text-[#4ade80]">₹{oData.payment.toFixed(0)}</span> : <span className="text-[#c8c5be] dark:text-[#333]">—</span>}</td>
                      <td className="sticky right-0 z-10 px-1 py-2.5 text-center border-b border-l border-[#e2e0db] dark:border-[#222]" style={{backgroundColor: bg, minWidth:'66px', width:'66px'}}>
                        {hasOrder && isActionable && (oData?.status === 'Pending' || oData?.status === 'Confirmed') ? (
                          <div className="flex flex-col items-center gap-1">
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => openModal(ret)} className="w-full px-1 py-1.5 bg-[#1e3a5f] hover:bg-[#162d4a] text-white text-[10px] font-semibold rounded transition-colors">Dispatch</motion.button>
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleCancelOrder(ret)} className="w-full px-1 py-1 bg-[#fef2f2] dark:bg-[#1f0a0a] rounded text-[9px] font-semibold text-[#991b1b] flex items-center justify-center gap-0.5"><XCircle size={9} /> Cancel</motion.button>
                          </div>
                        ) : hasOrder && isActionable && oData?.status === 'Dispatched' ? (
                          <div className="flex flex-col items-center gap-1">
                            <motion.button whileTap={{ scale: 0.95 }} onClick={() => openModal(ret)} className="w-full px-1 py-1.5 bg-[#1e40af] hover:bg-[#1e3a8a] text-white text-[10px] font-semibold rounded transition-colors">Deliver</motion.button>
                            <div className="flex gap-0.5 w-full">
                              <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleReturnOrder(ret)} className="flex-1 px-0.5 py-1 bg-[#fffbeb] dark:bg-[#1a1200] rounded text-[9px] font-semibold text-[#92400e] flex items-center justify-center" title="Return"><RotateCcw size={9} /></motion.button>
                              <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleUndoDispatch(ret)} className="flex-1 px-0.5 py-1 bg-[#f8f7f4] dark:bg-[#1a1a1a] rounded text-[9px] font-semibold text-[#6b6860] flex items-center justify-center" title="Undo"><Undo2 size={9} /></motion.button>
                            </div>
                          </div>
                        ) : oData?.status === 'Cancelled' ? (
                          <span className="text-[9px] font-semibold text-[#991b1b]">Cancelled</span>
                        ) : oData?.status === 'Returned' ? (
                          <span className="text-[9px] font-semibold text-[#92400e]">Returned</span>
                        ) : isDelivered ? (
                          <span className="text-[9px] font-semibold text-[#166534] flex items-center justify-center gap-0.5"><Check size={10} /> Done</span>
                        ) : null}
                      </td>
                    </tr>
                  );
                });
              })()}
              <tr className="bg-[#1e3a5f]">
                <td className="sticky left-0 z-10 bg-[#1e3a5f] px-1 py-2.5 text-center border-r border-white/10" style={{minWidth:'26px',width:'26px'}}></td>
                <td className="sticky left-[26px] z-10 bg-[#1e3a5f] px-2 py-2.5 border-r border-white/10 text-xs font-semibold text-white" style={{minWidth:'95px',width:'95px'}}>TOTAL</td>
                {ALL_FIXED_KEYS.map(key => {
                  const colTotal = retailers.reduce((s, ret) => s + (orderMap[ret.phone]?.items[key] || 0), 0);
                  return <td key={key} className="px-1 py-2.5 text-center border-r border-white/10">{colTotal > 0 ? <span className="font-mono font-bold text-[13px] text-white">{colTotal}</span> : <span className="text-white/20">·</span>}</td>;
                })}
                <td className="px-1 py-2.5 text-center border-r border-white/10"><span className="font-mono font-bold text-[12px] text-white">₹{retailers.reduce((s, ret) => s + calcTotal(orderMap[ret.phone]), 0).toFixed(0)}</span></td>
                <td className="px-1 py-2.5 text-center border-r border-white/10"><span className="font-mono font-semibold text-[11px] text-white/70">₹{retailers.reduce((s, ret) => s + (orderMap[ret.phone]?.payment || 0), 0).toFixed(0)}</span></td>
                <td className="sticky right-0 z-10 bg-[#1e3a5f] px-1 py-2.5 text-center border-l border-white/10" style={{minWidth:'66px',width:'66px'}}></td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        {(() => {
          const filteredRetailers = retailers.filter(ret => {
            if (!search) return true;
            const s = search.toLowerCase();
            return ret.name?.toLowerCase().includes(s) || ret.phone?.slice(-4).includes(s) || ret.phone?.includes(s) || ret.area?.toLowerCase().includes(s);
          });
          const totalPages = Math.ceil(filteredRetailers.length / PAGE_SIZE);
          if (totalPages <= 1) return null;
          return (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-[#222222]">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-300 disabled:opacity-30"><ChevronLeft size={14} /> Prev</button>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Page {page + 1} of {totalPages} <span className="text-gray-400 font-normal">({filteredRetailers.length} retailers)</span></span>
              <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-300 disabled:opacity-30">Next <ChevronRight size={14} /></button>
            </div>
          );
        })()}
      </div>

      {/* Seasonal Orders Table */}
      {SEASONAL_GROUPS.length > 0 && (
        <div className="bg-white dark:bg-[#111111] rounded-lg border border-[#e2e0db] dark:border-[#222] overflow-hidden">
          <div className="px-4 py-2.5 bg-[#92400e]">
            <p className="text-xs font-semibold text-white tracking-wide">Seasonal Sheet</p>
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <table className="border-collapse w-full min-w-[500px]">
              <thead className="sticky top-0 z-30">
                <tr className="bg-[#1e3a5f]">
                  <th rowSpan={2} className="sticky left-0 z-20 bg-[#1e3a5f] px-2 py-3 text-center text-white font-semibold text-xs border-r border-white/10 w-[36px]">SI</th>
                  <th rowSpan={2} className="sticky left-[36px] z-20 bg-[#1e3a5f] px-2 py-3 text-left text-white font-semibold text-xs border-r border-white/10 w-[110px]">Retailer</th>
                  {SEASONAL_GROUPS.map((g, gi) => (<th key={gi} colSpan={g.items.length} className="px-1 py-3 text-center font-bold text-white text-xs border-r border-white/10 tracking-wide">{g.group}</th>))}
                  <th rowSpan={2} className="px-2 py-3 text-center text-white font-semibold text-xs w-[90px]">TOTAL</th>
                </tr>
                <tr className="bg-[#162d4a]">
                  {SEASONAL_GROUPS.flatMap(g => g.items).map(item => (<th key={item.key} className="px-1 py-2 text-center font-medium text-white/70 border-r border-white/10 text-[11px]">{item.label}<br/><span className="font-mono text-[10px] text-white/40">{priceMap[item.key] ? `₹${priceMap[item.key]}` : ''}</span></th>))}
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const filteredRetailers = retailers.filter(ret => {
                    if (!search) return true;
                    const s = search.toLowerCase();
                    return ret.name?.toLowerCase().includes(s) || ret.phone?.slice(-4).includes(s) || ret.phone?.includes(s);
                  });
                  const totalPages = Math.ceil(filteredRetailers.length / PAGE_SIZE);
                  const pagedRetailers = filteredRetailers.slice(sPage * PAGE_SIZE, (sPage + 1) * PAGE_SIZE);
                  return pagedRetailers.map((ret, i) => {
                    const oData = orderMap[ret.phone];
                    const sTotal = oData ? ALL_SEASONAL_KEYS.reduce((s, k) => s + (oData.items[k] || 0) * (priceMap[k] || 0), 0) : 0;
                    const si = sPage * PAGE_SIZE + i + 1;
                    const sRowBg = i % 2 === 0 ? 'bg-white dark:bg-[#111]' : 'bg-[#f8f7f4] dark:bg-[#141414]';
                    return (
                      <tr key={ret.phone} className={`${sRowBg} hover:bg-[#e8eef5]/60 dark:hover:bg-[#1e3a5f]/10 transition-colors`}>
                        <td className={`sticky left-0 z-10 ${sRowBg} px-2 py-2.5 text-center font-mono text-xs text-[#9c9890] border-b border-r border-[#e2e0db] dark:border-[#222]`}>{si}</td>
                        <td className={`sticky left-[36px] z-10 ${sRowBg} px-2 py-2.5 border-b border-r border-[#e2e0db] dark:border-[#222]`}>
                          <p className="font-semibold text-[12px] text-[#1a1917] dark:text-white truncate">{ret.name}</p>
                          <p className="font-mono text-[10px] text-[#9c9890]">{ret.phone}</p>
                        </td>
                        {ALL_SEASONAL_KEYS.map(key => {
                          const qty = oData?.items[key] || 0;
                          return (<td key={key} className="px-1 py-2.5 text-center border-b border-r border-[#e2e0db]/60 dark:border-[#1e1e1e]">{qty > 0 ? <span className="font-mono font-bold text-[14px] text-[#92400e] dark:text-[#fbbf24]">{qty}</span> : <span className="text-[#c8c5be] dark:text-[#333]">·</span>}</td>);
                        })}
                        <td className="px-2 py-2.5 text-center border-b border-[#e2e0db] dark:border-[#222]">{sTotal > 0 ? <span className="font-mono font-semibold text-[13px] text-[#1a1917] dark:text-white">₹{sTotal.toFixed(0)}</span> : <span className="text-[#c8c5be] dark:text-[#333]">—</span>}</td>
                      </tr>
                    );
                  });
                })()}
                <tr className="bg-[#1e3a5f]">
                  <td className="sticky left-0 z-10 bg-[#1e3a5f] px-2 py-2.5 text-center border-r border-white/10"></td>
                  <td className="sticky left-[36px] z-10 bg-[#1e3a5f] px-3 py-2.5 border-r border-white/10 text-xs font-semibold text-white tracking-wide">TOTAL</td>
                  {ALL_SEASONAL_KEYS.map(key => {
                    const colTotal = retailers.reduce((s, ret) => s + (orderMap[ret.phone]?.items[key] || 0), 0);
                    return <td key={key} className="px-1 py-2.5 text-center border-r border-white/10">{colTotal > 0 ? <span className="font-mono font-bold text-[13px] text-white">{colTotal}</span> : <span className="text-white/20">·</span>}</td>;
                  })}
                  <td className="px-2 py-2.5 text-center"><span className="font-mono font-bold text-[13px] text-white">₹{retailers.reduce((s, ret) => { const oData = orderMap[ret.phone]; return s + (oData ? ALL_SEASONAL_KEYS.reduce((t, k) => t + (oData.items[k] || 0) * (priceMap[k] || 0), 0) : 0); }, 0).toFixed(0)}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
          {/* Seasonal Pagination */}
          {(() => {
            const filteredRetailers = retailers.filter(ret => {
              if (!search) return true;
              const s = search.toLowerCase();
              return ret.name?.toLowerCase().includes(s) || ret.phone?.slice(-4).includes(s) || ret.phone?.includes(s);
            });
            const totalPages = Math.ceil(filteredRetailers.length / PAGE_SIZE);
            if (totalPages <= 1) return null;
            return (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-[#222222]">
                <button onClick={() => setSPage(p => Math.max(0, p - 1))} disabled={sPage === 0} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-300 disabled:opacity-30"><ChevronLeft size={14} /> Prev</button>
                <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Page {sPage + 1} of {totalPages}</span>
                <button onClick={() => setSPage(p => Math.min(totalPages - 1, p + 1))} disabled={sPage >= totalPages - 1} className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-300 disabled:opacity-30">Next <ChevronRight size={14} /></button>
              </div>
            );
          })()}
        </div>
      )}
      {/* Bulk Dispatch Review Modal */}
      {ReactDOM.createPortal(
      <AnimatePresence>
        {showBulkModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/70 flex items-end sm:items-center justify-center sm:p-4"
            onClick={() => { if (!bulkDispatching) { setShowBulkModal(false); document.body.style.overflow = ''; } }}>
            <motion.div initial={{ y: 32, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 32, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="bg-white dark:bg-[#111] rounded-t-lg sm:rounded-lg w-full sm:max-w-lg shadow-md max-h-[90vh] sm:max-h-[85vh] flex flex-col"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#e2e0db] dark:border-[#1e1e1e] shrink-0">
                <div>
                  <p className="font-semibold text-[#1a1917] dark:text-white text-sm">Review & Dispatch All</p>
                  <p className="text-xs text-[#9c9890] mt-0.5">{bulkItems.length} orders &bull; {bulkItems.filter(b => b.edited).length} edited</p>
                </div>
                {!bulkDispatching && (
                  <button onClick={() => { setShowBulkModal(false); document.body.style.overflow = ''; }}
                    className="w-7 h-7 bg-[#f0ede8] dark:bg-[#1a1a1a] rounded-md flex items-center justify-center text-[#6b6860] hover:bg-[#e2e0db] transition-colors">
                    <X size={13} />
                  </button>
                )}
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                {bulkItems.map((bulk, ri) => (
                  <div key={bulk.retailer.phone}
                    className={`rounded-md border overflow-hidden ${
                      bulk.edited ? 'border-[#fde68a] dark:border-[#78350f]/50' : 'border-[#e2e0db] dark:border-[#1e1e1e]'
                    }`}>
                    <div className={`flex items-center justify-between px-3 py-2 ${
                      bulk.edited ? 'bg-[#fffbeb] dark:bg-[#1a1200]' : 'bg-[#f8f7f4] dark:bg-[#1a1a1a]'
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-semibold text-[#9c9890] w-4">{ri + 1}</span>
                        <div>
                          <p className="text-sm font-semibold text-[#1a1917] dark:text-white">{bulk.retailer.name}</p>
                          <p className="text-[10px] text-[#9c9890]">{bulk.retailer.area} &bull; &bull;&bull;&bull;&bull;{bulk.retailer.phone.slice(-4)}</p>
                        </div>
                      </div>
                      {bulk.edited && <span className="text-[9px] font-semibold text-[#92400e] bg-[#fde68a]/60 px-1.5 py-0.5 rounded">Edited</span>}
                    </div>
                    <div className="px-3 py-2 space-y-1.5 bg-white dark:bg-[#111]">
                      {bulk.items.map((item, ii) => (
                        <div key={ii} className="flex items-center gap-2">
                          <span className="text-xs text-[#6b6860] dark:text-[#9c9890] flex-1 truncate">{item.name}</span>
                          <input type="number" min="0" value={item.actual}
                            onChange={e => updateBulkQty(ri, ii, e.target.value)}
                            onKeyDown={e => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                            className={`w-14 h-7 text-center font-mono text-xs font-semibold rounded border outline-none transition-colors ${
                              item.actual !== item.ordered
                                ? 'border-[#fde68a] bg-[#fffbeb] dark:bg-[#1a1200] dark:border-[#78350f] text-[#92400e] dark:text-[#fbbf24]'
                                : 'border-[#e2e0db] dark:border-[#2a2a2a] dark:bg-[#1a1a1a] dark:text-white'
                            }`} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <div className="shrink-0 px-4 pb-4 pt-3 border-t border-[#e2e0db] dark:border-[#1e1e1e]">
                {bulkDispatching ? (
                  <div className="space-y-1.5">
                    <div className="w-full h-1 bg-[#e2e0db] dark:bg-[#1a1a1a] rounded-full overflow-hidden">
                      <motion.div className="h-full bg-[#1e3a5f] rounded-full"
                        animate={{ width: `${(bulkProgress.done / bulkProgress.total) * 100}%` }}
                        transition={{ duration: 0.3 }} />
                    </div>
                    <p className="text-xs text-[#6b6860] text-center">{bulkProgress.done} / {bulkProgress.total} dispatched</p>
                  </div>
                ) : (
                  <motion.button whileTap={{ scale: 0.98 }} onClick={confirmBulkDispatch}
                    className="w-full bg-[#1e3a5f] hover:bg-[#162d4a] text-white font-semibold py-3 rounded-md text-sm transition-colors">
                    Confirm & Dispatch All ({bulkItems.length})
                  </motion.button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      , document.body)}

      {/* Dispatch / Deliver Modal */}
      {ReactDOM.createPortal(
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/70 flex items-end sm:items-center justify-center sm:p-4"
            onClick={() => { setModal(null); document.body.style.overflow = ''; }}>
            <motion.div initial={{ y: 32, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 32, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="bg-white dark:bg-[#111] rounded-t-lg sm:rounded-lg w-full sm:max-w-md shadow-md max-h-[92vh] sm:max-h-[85vh] flex flex-col"
              onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-[#e2e0db] dark:border-[#1e1e1e] shrink-0">
                <div>
                  <p className="font-semibold text-[#1a1917] dark:text-white text-sm">{modal.mode === 'dispatch' ? 'Dispatch Order' : 'Deliver & Collect'}</p>
                  <p className="text-xs text-[#9c9890] mt-0.5">{modal.retailer.name} &bull; {modal.retailer.phone}</p>
                </div>
                <button onClick={() => { setModal(null); document.body.style.overflow = ''; }}
                  className="w-7 h-7 bg-[#f0ede8] dark:bg-[#1a1a1a] rounded-md flex items-center justify-center text-[#6b6860] hover:bg-[#e2e0db] transition-colors">
                  <X size={13} />
                </button>
              </div>

              <div className="px-4 pt-3 pb-4 flex flex-col flex-1 min-h-0">
              {modal.mode === 'dispatch' ? (
                <>
                  <div className="space-y-2 mb-3 flex flex-col min-h-0">
                    <div className="grid grid-cols-12 text-[10px] font-bold text-gray-400 uppercase px-1 shrink-0">
                      <span className="col-span-5">Product</span>
                      <span className="col-span-2 text-center">Ordered</span>
                      <span className="col-span-3 text-center">Actual</span>
                      <span className="col-span-2 text-right">Amt</span>
                    </div>
                    <div className="overflow-y-auto max-h-[40vh] space-y-1">
                    {deliverForm.items.filter(i => ALL_FIXED_KEYS.includes(i.name)).length > 0 && (
                      <p className="text-[10px] font-semibold text-[#1e3a5f] dark:text-[#7aaacb] uppercase tracking-wider pt-1">Daily</p>
                    )}
                    {deliverForm.items.filter(i => ALL_FIXED_KEYS.includes(i.name)).map((item, idx) => {
                      const realIdx = deliverForm.items.indexOf(item);
                      return (
                        <div key={realIdx} className="grid grid-cols-12 items-center bg-[#f8f7f4] dark:bg-[#1a1a1a] rounded px-3 py-2">
                          <span className="col-span-5 text-sm font-medium text-[#1a1917] dark:text-[#e5e3df]">{item.name}</span>
                          <span className="col-span-2 text-center font-mono text-sm text-[#9c9890]">{item.ordered}</span>
                          <div className="col-span-3 flex justify-center">
                            <input type="number" min="0" value={item.actual} onChange={e => updateActual(realIdx, e.target.value)} onKeyDown={e => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }} className="w-14 text-center font-mono text-sm font-semibold border border-[#e2e0db] dark:border-[#2a2a2a] dark:bg-[#111] dark:text-white rounded py-1 focus:border-[#1e3a5f] focus:outline-none" />
                          </div>
                          <span className="col-span-2 text-right font-mono text-sm font-semibold text-[#1a1917] dark:text-white">₹{(item.actual * item.unitPrice).toFixed(0)}</span>
                        </div>
                      );
                    })}
                    {deliverForm.items.filter(i => !ALL_FIXED_KEYS.includes(i.name) && !i.extra).length > 0 && (
                      <p className="text-[10px] font-semibold text-[#92400e] dark:text-[#fbbf24] uppercase tracking-wider pt-2">Seasonal</p>
                    )}
                    {deliverForm.items.filter(i => !ALL_FIXED_KEYS.includes(i.name) && !i.extra).map((item, idx) => {
                      const realIdx = deliverForm.items.indexOf(item);
                      return (
                        <div key={realIdx} className="grid grid-cols-12 items-center bg-[#fffbeb] dark:bg-[#1a1200] rounded px-3 py-2">
                          <span className="col-span-5 text-sm font-medium text-[#1a1917] dark:text-[#e5e3df]">{item.name}</span>
                          <span className="col-span-2 text-center font-mono text-sm text-[#9c9890]">{item.ordered}</span>
                          <div className="col-span-3 flex justify-center">
                            <input type="number" min="0" value={item.actual} onChange={e => updateActual(realIdx, e.target.value)} onKeyDown={e => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }} className="w-14 text-center font-mono text-sm font-semibold border border-[#fde68a] dark:border-[#78350f] dark:bg-[#111] dark:text-white rounded py-1 focus:border-[#92400e] focus:outline-none" />
                          </div>
                          <span className="col-span-2 text-right font-mono text-sm font-semibold text-[#1a1917] dark:text-white">₹{(item.actual * item.unitPrice).toFixed(0)}</span>
                        </div>
                      );
                    })}
                    {deliverForm.items.filter(i => i.extra).length > 0 && (
                      <p className="text-[10px] font-semibold text-[#166534] dark:text-[#4ade80] uppercase tracking-wider pt-2">Extra (On-spot)</p>
                    )}
                    {deliverForm.items.filter(i => i.extra).map((item) => {
                      const realIdx = deliverForm.items.indexOf(item);
                      return (
                        <div key={realIdx} className="grid grid-cols-12 items-center bg-[#f0fdf4] dark:bg-[#0a1f0f] rounded px-3 py-2 border border-[#bbf7d0] dark:border-[#166534]/40">
                          <span className="col-span-4 text-sm font-medium text-[#1a1917] dark:text-[#e5e3df] truncate">{item.name}</span>
                          <span className="col-span-2 text-center text-[10px] text-[#166534] dark:text-[#4ade80] font-semibold">EXTRA</span>
                          <div className="col-span-3 flex justify-center">
                            <input type="number" min="1" value={item.actual} onChange={e => updateActual(realIdx, e.target.value)} onKeyDown={e => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }} className="w-14 text-center font-mono text-sm font-semibold border border-[#bbf7d0] dark:border-[#166534]/50 dark:bg-[#111] dark:text-white rounded py-1 focus:border-[#166534] focus:outline-none" />
                          </div>
                          <span className="col-span-2 text-right font-mono text-sm font-semibold text-[#1a1917] dark:text-white">₹{(item.actual * item.unitPrice).toFixed(0)}</span>
                          <button onClick={() => setDeliverForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== realIdx) }))} className="col-span-1 flex justify-end"><Trash2 size={12} className="text-[#991b1b]" /></button>
                        </div>
                      );
                    })}
                    {/* Add Extra Item Button & Picker */}
                    {!showExtraPicker ? (
                      <button onClick={() => { setShowExtraPicker(true); setExtraSearch(''); }} className="flex items-center gap-1.5 px-3 py-2 mt-1 text-xs font-semibold text-[#166534] dark:text-[#4ade80] bg-[#f0fdf4] dark:bg-[#0a1f0f] border border-dashed border-[#bbf7d0] dark:border-[#166534]/40 rounded hover:bg-[#dcfce7] dark:hover:bg-[#0f2d18] transition-colors w-full justify-center">
                        <Plus size={12} /> Add Extra Item
                      </button>
                    ) : (
                      <div className="mt-1 border border-[#e2e0db] dark:border-[#2a2a2a] rounded overflow-hidden bg-white dark:bg-[#111]">
                        <div className="flex items-center gap-2 px-3 py-2 border-b border-[#f0ede8] dark:border-[#1e1e1e]">
                          <input type="text" placeholder="Search product..." value={extraSearch} onChange={e => setExtraSearch(e.target.value)} autoFocus className="flex-1 text-sm outline-none bg-transparent dark:text-white placeholder:text-[#9c9890]" />
                          <button onClick={() => setShowExtraPicker(false)} className="w-5 h-5 bg-[#f0ede8] dark:bg-[#1a1a1a] rounded flex items-center justify-center"><X size={9} className="text-[#6b6860]" /></button>
                        </div>
                        <div className="max-h-[140px] overflow-y-auto">
                          {products.filter(p => { const alreadyIn = deliverForm.items.some(i => i.name === p.name); const matchSearch = !extraSearch || p.name.toLowerCase().includes(extraSearch.toLowerCase()); return !alreadyIn && matchSearch; }).map(p => (
                            <button key={p.id} onClick={() => { setDeliverForm(prev => ({ ...prev, items: [...prev.items, { name: p.name, ordered: 0, actual: 1, unitPrice: p.price || 0, extra: true }] })); setShowExtraPicker(false); }} className="w-full flex items-center justify-between px-3 py-2 hover:bg-[#f8f7f4] dark:hover:bg-[#1a1a1a] text-left border-b border-[#f0ede8] dark:border-[#1e1e1e] last:border-0">
                              <span className="text-xs font-medium text-[#1a1917] dark:text-[#e5e3df]">{p.name}</span>
                              <span className="font-mono text-[10px] text-[#9c9890]">₹{p.price}/{p.unit}</span>
                            </button>
                          ))}
                          {products.filter(p => !deliverForm.items.some(i => i.name === p.name) && (!extraSearch || p.name.toLowerCase().includes(extraSearch.toLowerCase()))).length === 0 && (
                            <p className="text-xs text-[#9c9890] text-center py-3">No products found</p>
                          )}
                        </div>
                      </div>
                    )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-[#f8f7f4] dark:bg-[#1a1a1a] border border-[#e2e0db] dark:border-[#2a2a2a] rounded px-4 py-2.5 shrink-0">
                    <span className="text-sm font-medium text-[#6b6860] dark:text-[#9c9890]">Actual Total</span>
                    <span className="font-mono text-base font-bold text-[#1a1917] dark:text-white">₹{formTotal.toFixed(2)}</span>
                  </div>
                  {showDispatchConfirm && (
                    <div className="mt-2 bg-[#fffbeb] dark:bg-[#1a1200] border border-[#fde68a] dark:border-[#78350f]/40 rounded p-3">
                      <p className="text-xs font-semibold text-[#92400e] dark:text-[#fbbf24]">Quantity changed — confirm?</p>
                      <div className="mt-1.5 space-y-0.5">
                        {deliverForm.items.filter(i => i.actual !== i.ordered && !i.extra).map((i, idx) => (
                          <p key={idx} className="font-mono text-xs text-[#6b6860] dark:text-[#9c9890]"><span className="font-semibold text-[#1a1917] dark:text-white">{i.name}</span>: {i.ordered} → {i.actual}</p>
                        ))}
                        {deliverForm.items.filter(i => i.extra).map((i, idx) => (
                          <p key={idx} className="font-mono text-xs text-[#166534] dark:text-[#4ade80]"><span className="font-semibold">{i.name}</span>: +{i.actual} extra</p>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="space-y-2 mb-3">
                    <div className="grid grid-cols-12 text-[10px] font-bold text-gray-400 uppercase px-1 shrink-0">
                      <span className="col-span-6">Product</span>
                      <span className="col-span-3 text-center">Qty</span>
                      <span className="col-span-3 text-right">Amt</span>
                    </div>
                    <div className="overflow-y-auto max-h-[30vh] space-y-1">
                    {deliverForm.items.filter(i => !i.extra).map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 items-center bg-[#f8f7f4] dark:bg-[#1a1a1a] rounded px-3 py-2">
                        <span className="col-span-6 text-sm font-medium text-[#1a1917] dark:text-[#e5e3df]">{item.name}</span>
                        <span className="col-span-3 text-center font-mono text-sm font-semibold text-[#1a1917] dark:text-white">{item.actual || item.qty}</span>
                        <span className="col-span-3 text-right font-mono text-sm font-semibold text-[#1a1917] dark:text-white">₹{((item.actual || item.qty || 0) * (item.unitPrice || 0)).toFixed(0)}</span>
                      </div>
                    ))}
                    {deliverForm.items.filter(i => i.extra).length > 0 && (
                      <p className="text-[10px] font-semibold text-[#166534] dark:text-[#4ade80] uppercase tracking-wider pt-2">Extra (On-spot)</p>
                    )}
                    {deliverForm.items.filter(i => i.extra).map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 items-center bg-[#f0fdf4] dark:bg-[#0a1f0f] rounded px-3 py-2 border border-[#bbf7d0] dark:border-[#166534]/40">
                        <span className="col-span-6 text-sm font-medium text-[#1a1917] dark:text-[#e5e3df]">{item.name}</span>
                        <span className="col-span-3 text-center font-mono text-sm font-semibold text-[#166534] dark:text-[#4ade80]">{item.actual || item.qty}</span>
                        <span className="col-span-3 text-right font-mono text-sm font-semibold text-[#1a1917] dark:text-white">₹{((item.actual || item.qty || 0) * (item.unitPrice || 0)).toFixed(0)}</span>
                      </div>
                    ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-[#f8f7f4] dark:bg-[#1a1a1a] border border-[#e2e0db] dark:border-[#2a2a2a] rounded px-4 py-2.5 mb-3">
                    <span className="text-sm font-medium text-[#6b6860] dark:text-[#9c9890]">Actual Total</span>
                    <span className="font-mono text-base font-bold text-[#1a1917] dark:text-white">₹{(modal.actualTotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="mb-4">
                    <label className="text-xs font-semibold text-[#6b6860] dark:text-[#9c9890] mb-1.5 block uppercase tracking-wide">Payment Collected (₹)</label>
                    <div className="border border-[#e2e0db] dark:border-[#2a2a2a] rounded overflow-hidden">
                      <div className="flex items-center justify-between bg-[#f8f7f4] dark:bg-[#1a1a1a] px-3 py-2 border-b border-[#e2e0db] dark:border-[#2a2a2a]">
                        <span className="text-xs text-[#9c9890]">Due: <span className="font-mono font-semibold text-[#991b1b]">{formatPrice(modalBalance)}</span></span>
                        <span className="text-xs text-[#9c9890]">Today: <span className="font-mono font-semibold text-[#1a1917] dark:text-white">{formatPrice(modal.actualTotal || 0)}</span></span>
                        <span className="text-xs text-[#9c9890]">Total: <span className="font-mono font-bold text-[#991b1b]">{formatPrice(modalBalance + (modal.actualTotal || 0))}</span></span>
                      </div>
                      <input type="number" min="0" placeholder="0" value={deliverForm.payment}
                        onFocus={e => { if (e.target.value === '0') setDeliverForm(f => ({ ...f, payment: '' })); }}
                        onChange={e => { const val = Number(e.target.value) || 0; if (val > modalBalance + (modal.actualTotal || 0)) return; setDeliverForm(f => ({ ...f, payment: e.target.value })); }}
                        onKeyDown={e => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                        className="w-full py-3 px-4 font-mono text-xl font-bold text-center bg-white dark:bg-[#111] dark:text-white focus:outline-none focus:border-[#1e3a5f]" />
                    </div>
                    {Number(deliverForm.payment) > 0 && <p className="font-mono text-[11px] text-[#166534] dark:text-[#4ade80] font-semibold mt-1">Remaining: {formatPrice(modalBalance + (modal.actualTotal || 0) - (Number(deliverForm.payment) || 0))}</p>}
                  </div>
                </>
              )}
              </div>
              {/* Sticky Footer Button */}
              <div className="shrink-0 px-4 pb-4 pt-3 border-t border-[#e2e0db] dark:border-[#1e1e1e]">
                {modal.mode === 'dispatch' ? (
                  showDispatchConfirm ? (
                    <div className="flex gap-2">
                      <button onClick={() => setShowDispatchConfirm(false)} className="flex-1 py-2.5 rounded-md font-semibold text-sm bg-[#f0ede8] dark:bg-[#1a1a1a] text-[#6b6860] dark:text-[#9c9890] hover:bg-[#e2e0db] transition-colors">Back</button>
                      <motion.button whileTap={{ scale: 0.98 }} onClick={handleDispatch} disabled={delivering} className="flex-1 py-2.5 rounded-md font-semibold text-sm text-white bg-[#1e3a5f] hover:bg-[#162d4a] disabled:opacity-50 transition-colors">
                        {delivering ? 'Processing...' : 'Confirm Dispatch'}
                      </motion.button>
                    </div>
                  ) : (
                    <motion.button whileTap={{ scale: 0.98 }} onClick={() => setShowDispatchConfirm(true)} className="w-full bg-[#1e3a5f] hover:bg-[#162d4a] text-white font-semibold py-3 rounded-md text-sm transition-colors">
                      Dispatch
                    </motion.button>
                  )
                ) : (
                  <motion.button whileTap={{ scale: 0.98 }} onClick={handleDeliver} disabled={delivering} className="w-full bg-[#1e40af] hover:bg-[#1e3a8a] text-white font-semibold py-3 rounded-md text-sm disabled:opacity-50 transition-colors">
                    {delivering ? <span className="flex items-center justify-center gap-2"><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />Processing...</span> : 'Deliver & Collect'}
                  </motion.button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      , document.body)}

      {/* Receipt Popup */}
      {ReactDOM.createPortal(
      <AnimatePresence>
        {lastReceipt && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4"
            onClick={() => { setLastReceipt(null); document.body.style.overflow = ''; }}>
            <motion.div initial={{ scale: 0.95, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 12 }}
              className="bg-white dark:bg-[#111] rounded-lg p-5 w-full max-w-xs shadow-md text-center"
              onClick={e => e.stopPropagation()}>
              <div className="w-10 h-10 bg-[#f0fdf4] dark:bg-[#0a1f0f] rounded-md flex items-center justify-center mx-auto mb-3">
                <Check size={18} className="text-[#166534]" />
              </div>
              <p className="font-semibold text-[#1a1917] dark:text-white text-sm">Payment Collected</p>
              <p className="font-mono text-2xl font-bold text-[#166534] mt-1.5">₹{lastReceipt.amount.toLocaleString('en-IN')}</p>
              <p className="text-xs text-[#6b6860] mt-1">from {lastReceipt.name}</p>
              <p className="font-mono text-xs text-[#9c9890] mt-0.5">Balance: ₹{lastReceipt.balanceAfter.toLocaleString('en-IN')}</p>
              <div className="flex gap-2 mt-4">
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => { setLastReceipt(null); document.body.style.overflow = ''; }}
                  className="flex-1 py-2.5 rounded-md font-semibold text-sm text-[#6b6860] dark:text-[#9c9890] bg-[#f0ede8] dark:bg-[#1a1a1a] hover:bg-[#e2e0db] transition-colors">Close</motion.button>
                <motion.button whileTap={{ scale: 0.96 }} onClick={() => {
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
                  receiptPdf.text(`Phone: ${r.phone}`, rm, ry); ry += 5;
                  receiptPdf.setTextColor(0); receiptPdf.setDrawColor(180); receiptPdf.setLineDashPattern([1, 1], 0); receiptPdf.line(rm, ry, rw - rm, ry); receiptPdf.setLineDashPattern([], 0); ry += 5;
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
                }} className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md font-semibold text-sm text-white bg-[#1e3a5f] hover:bg-[#162d4a] transition-colors">
                  <Download size={12} /> Receipt
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      , document.body)}

    </div>
    </>
  );
}


