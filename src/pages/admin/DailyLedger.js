import React, { useState, useEffect } from 'react';
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
    <div className="space-y-4 overflow-hidden">
      <AnimatePresence>{toast && (<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-[4.5rem] left-4 right-4 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:w-auto z-[100] flex items-center justify-center gap-2 px-4 py-3 rounded-2xl shadow-xl bg-mint-50 dark:bg-mint-900/80 border border-mint-200 dark:border-mint-700 text-mint-800 dark:text-mint-200 backdrop-blur-sm"><Check size={14} strokeWidth={3} /><span className="text-sm font-bold">{toast}</span></motion.div>)}</AnimatePresence>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        <div className="flex items-center gap-2 bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-xl px-3 py-2">
          <Calendar size={14} className="text-gray-400" />
          <input type="date" value={date} onChange={e => setDate(e.target.value)} min={oneYearAgo} max={tomorrowLocal} className="text-sm font-bold text-gray-700 dark:text-gray-200 outline-none bg-transparent w-[120px]" />
        </div>
        <select value={selectedArea} onChange={e => setSelectedArea(e.target.value)} className="text-sm font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-xl px-3 py-2.5 outline-none max-w-[130px]">
          <option value="All">All Areas</option>
          {areas.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <div className="relative flex-1 min-w-[120px] max-w-[180px]">
          <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="text-sm bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-xl px-3 py-2 pl-8 pr-9 outline-none focus:border-royal-300 w-full dark:text-white" />
          <svg className="absolute left-2.5 top-2.5 text-gray-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-200 dark:bg-[#222222] rounded-full flex items-center justify-center hover:bg-gray-300"><X size={10} className="text-gray-500" /></button>}
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={fetchData} className="p-2.5 bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-xl hover:bg-gray-50 dark:hover:bg-[#1a1a1a] shrink-0"><RefreshCw size={14} className="text-gray-500" /></motion.button>
        <motion.button whileTap={{ scale: 0.93 }} onClick={printPDF} className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 bg-[#0f172a] text-white text-xs font-bold rounded-xl shrink-0"><Printer size={13} /> <span className="hidden sm:inline">Daily PDF</span></motion.button>
        {hasSeasonalOrders && <motion.button whileTap={{ scale: 0.93 }} onClick={printSeasonalPDF} className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 bg-amber-600 text-white text-xs font-bold rounded-xl shrink-0"><Printer size={13} /> <span className="hidden sm:inline">Seasonal PDF</span><span className="ml-1 bg-white/20 px-1.5 py-0.5 rounded-md text-[9px]">{retailers.filter(ret => { const o = orderMap[ret.phone]; return o && ALL_SEASONAL_KEYS.some(k => (o.items[k] || 0) > 0); }).length}</span></motion.button>}
        <motion.button whileTap={{ scale: 0.93 }} onClick={() => {
          const dailyKeys = ALL_FIXED_KEYS.filter(k => !k.startsWith('_'));
          const seasonalKeys = ALL_SEASONAL_KEYS;
          const headers = ['SI', 'Retailer', ...dailyKeys, ...seasonalKeys, 'Daily Total', 'Seasonal Total', 'Grand Total'];
          const rows = retailers.map((ret, i) => {
            const oData = orderMap[ret.phone];
            const dTotal = oData ? dailyKeys.reduce((s, k) => s + (oData.items[k] || 0) * (priceMap[k] || 0), 0) : 0;
            const sTotal = oData ? seasonalKeys.reduce((s, k) => s + (oData.items[k] || 0) * (priceMap[k] || 0), 0) : 0;
            return [i + 1, `"${ret.name}"`, ...dailyKeys.map(k => oData?.items[k] || 0), ...seasonalKeys.map(k => oData?.items[k] || 0), dTotal.toFixed(2), sTotal.toFixed(2), (dTotal + sTotal).toFixed(2)];
          });
          const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a'); a.href = url; a.download = `DailySheet_${date}.csv`; a.click();
        }} className="flex items-center gap-1.5 px-3 sm:px-4 py-2.5 bg-mint-600 text-white text-xs font-bold rounded-xl shrink-0"><Download size={13} /> <span className="hidden sm:inline">Excel</span></motion.button>

      </div>

      <div className="flex flex-wrap items-center gap-3 text-xs">
        <span className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-lg px-3 py-1.5 font-bold text-gray-600 dark:text-gray-300">{retailers.length} Retailers</span>
        <span className="bg-amber-50 border border-amber-100 rounded-lg px-3 py-1.5 font-bold text-amber-700">{orders.length} Orders</span>
        {!isActionable && <span className="bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333333] rounded-lg px-3 py-1.5 font-bold text-gray-500 dark:text-gray-400">Read-only (past date)</span>}
        {isActionable && (() => {
          const pendingCount = retailers.filter(ret => { const o = orderMap[ret.phone]; return o && (o.status === 'Pending' || o.status === 'Confirmed'); }).length;
          return pendingCount > 0 ? (
            <motion.button whileTap={{ scale: 0.95 }} onClick={handleBulkDispatch} disabled={bulkDispatching}
              className="flex items-center gap-1.5 bg-mint-600 text-white px-3 py-1.5 rounded-lg font-bold disabled:opacity-50 ml-auto">
              {bulkDispatching ? <><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full" /> {bulkProgress.done}/{bulkProgress.total}</> : `Dispatch All (${pendingCount})`}
            </motion.button>
          ) : null;
        })()}
      </div>

      {/* Stock Status Banner */}
      {stockData && companyOrderData && (() => {
        const shortages = Object.entries(companyOrderData).filter(([name, ordered]) => {
          const received = stockData[name] || 0;
          return received < ordered;
        }).map(([name, ordered]) => ({ name, ordered, received: stockData[name] || 0, short: ordered - (stockData[name] || 0) }));
        const excess = Object.entries(companyOrderData).filter(([name, ordered]) => {
          const received = stockData[name] || 0;
          return received > ordered;
        }).map(([name, ordered]) => ({ name, ordered, received: stockData[name] || 0, extra: (stockData[name] || 0) - ordered }));
        if (shortages.length === 0 && excess.length === 0) return (
          <div className="bg-mint-50 dark:bg-mint-900/20 border border-mint-200 dark:border-mint-800 rounded-2xl px-4 py-2.5 flex items-center gap-2">
            <CheckCircle2 size={14} className="inline text-green-500" />
            <p className="text-xs font-bold text-mint-700 dark:text-mint-300">Stock received — all matched</p>
          </div>
        );
        return (
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3">
            <p className="text-xs font-bold text-gray-700 dark:text-gray-200 mb-2">Stock Received — {shortages.length > 0 && `${shortages.length} short`}{shortages.length > 0 && excess.length > 0 && ', '}{excess.length > 0 && `${excess.length} extra`}</p>
            <div className="flex flex-wrap gap-2">
              {shortages.map(s => (
                <span key={s.name} className="text-[10px] font-bold bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-2 py-1 rounded-lg">
                  {s.name}: {s.received}/{s.ordered} <span className="text-red-500">(-{s.short})</span>
                </span>
              ))}
              {excess.map(s => (
                <span key={s.name} className="text-[10px] font-bold bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 px-2 py-1 rounded-lg">
                  {s.name}: {s.received}/{s.ordered} <span className="text-green-600">(+{s.extra})</span>
                </span>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Table */}
      <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#222222] overflow-hidden max-w-[calc(100vw-2rem)] lg:max-w-none">
        <div className="overflow-x-auto scrollbar-hide">
          <table className="border-collapse w-full min-w-[900px]">
            <thead className="sticky top-0 z-30">
              <tr className="bg-[#0f172a]">
                <th rowSpan={2} className="sticky left-0 z-20 bg-[#0f172a] px-2 py-3 text-center text-white font-bold text-xs border-r border-white/10 w-[40px]">SI</th>
                <th rowSpan={2} className="sticky left-[40px] z-20 bg-[#0f172a] px-2 py-3 text-left text-white font-bold text-xs border-r border-white/10 w-[140px]">Retailer</th>
                {PRODUCT_GROUPS.map((g, gi) => (<th key={gi} colSpan={g.items.length} className="px-1 py-3 text-center font-extrabold text-white text-xs border-r border-white/10">{g.group}{groupCodes[g.group] ? ` (${groupCodes[g.group]})` : ''}</th>))}
                <th rowSpan={2} className="px-2 py-3 text-center text-white font-bold text-xs border-r border-white/10 w-[90px]">TOTAL<br/><span className="text-[11px] font-normal text-gray-400">(Daily+Seasonal)</span></th>
                <th rowSpan={2} className="px-2 py-3 text-center text-white font-bold text-xs border-r border-white/10 w-[80px]">PAID</th>
                <th rowSpan={2} className="sticky right-0 z-20 bg-[#0f172a] px-2 py-3 text-center text-white font-bold text-xs w-[85px] border-l border-white/10">ACTION</th>
              </tr>
              <tr className="bg-[#1e293b]">
                {PRODUCT_GROUPS.flatMap(g => g.items).map(item => (<th key={item.key} className="px-1 py-2 text-center font-bold text-gray-300 border-r border-white/5 text-[11px]">{item.label}<br/><span className="text-[11px] font-medium text-gray-400">{priceMap[item.key] ? `₹${priceMap[item.key]}` : ''}</span></th>))}
              </tr>
            </thead>
            <tbody>
              {(() => {
                const filteredRetailers = retailers.filter(ret => {
                  if (!search) return true;
                  const s = search.toLowerCase();
                  return ret.name?.toLowerCase().includes(s) || ret.phone?.slice(-4).includes(s) || ret.phone?.includes(s) || ret.area?.toLowerCase().includes(s);
                });
                const totalPages = Math.ceil(filteredRetailers.length / PAGE_SIZE);
                const pagedRetailers = filteredRetailers.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
                return pagedRetailers.map((ret, i) => {
                  const oData = orderMap[ret.phone];
                  const hasOrder = !!oData;
                  const total = calcTotal(oData);
                  const isDelivered = oData?.status === 'Delivered';
                  const si = page * PAGE_SIZE + i + 1;
                  return (
                    <tr key={ret.phone} className={`${isDelivered ? 'bg-mint-50/30 dark:bg-mint-900/10' : hasOrder ? 'bg-green-50 dark:bg-green-900/10' : i % 2 === 0 ? 'bg-white dark:bg-[#111111]' : 'bg-gray-50/50 dark:bg-[#1a1a1a]/30'} hover:bg-royal-50/30 dark:hover:bg-royal-900/20 transition-colors`}>
                      <td className="sticky left-0 z-10 bg-inherit px-2 py-2.5 text-center text-xs text-gray-500 font-mono border-b border-r border-gray-200 dark:border-[#222222] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)]">{si}</td>
                      <td className="sticky left-[40px] z-10 bg-inherit px-3 py-2.5 border-b border-r border-gray-200 dark:border-[#222222] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.05)]">
                        <div className="flex items-center gap-1.5">
                          {selectedArea !== 'All' && <input key={ret.phone} type="number" min="1" className="w-7 h-6 text-[10px] font-bold text-center bg-gray-100 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333333] rounded text-royal-600 dark:text-royal-300 outline-none focus:border-royal-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" defaultValue={ret.deliveryOrder && ret.deliveryOrder !== 999 ? ret.deliveryOrder : ''} placeholder="#" onBlur={async (e) => { const val = Number(e.target.value) || 999; const oldVal = ret.deliveryOrder || 999; if (val === oldVal) return; const ok = await confirm({ title: 'Update Route Order', message: `Set ${ret.name}'s delivery order to #${val === 999 ? 'none' : val}?`, confirmText: 'Save', type: 'warning' }); if (ok) { try { await updateDoc(doc(db, 'users', ret.phone), { deliveryOrder: val }); ret.deliveryOrder = val; } catch(err){} } else { e.target.value = oldVal !== 999 ? oldVal : ''; } }} />}
                          <div className="min-w-0"><p className="font-bold text-[13px] text-gray-800 dark:text-white truncate">{ret.name}</p><p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{ret.phone}</p></div>
                        </div>
                      </td>
                      {ALL_FIXED_KEYS.map(key => {
                        const qty = oData?.items[key] || 0;
                        return (<td key={key} className="px-1 py-2.5 text-center border-b border-r border-gray-100 dark:border-[#1a1a1a] dark:border-[#222222]">{qty > 0 ? <span className="font-black text-[14px] text-royal-700">{qty}</span> : <span className="text-gray-200 dark:text-gray-600">·</span>}</td>);
                      })}
                      <td className="px-2 py-2.5 text-center border-b border-r border-gray-200 dark:border-[#222222]">{total > 0 ? <span className="font-black text-[13px] text-gray-800 dark:text-white">₹{total.toFixed(2)}</span> : <span className="text-gray-200 dark:text-gray-600">—</span>}</td>
                      <td className="px-2 py-2.5 text-center border-b border-r border-gray-200 dark:border-[#222222]">{oData?.payment > 0 ? <span className="font-bold text-[13px] text-mint-700">₹{oData.payment.toFixed(0)}</span> : <span className="text-gray-200 dark:text-gray-600">—</span>}</td>
                      <td className="sticky right-0 z-10 bg-inherit px-2 py-2.5 text-center border-b border-l border-gray-200 dark:border-[#222222] shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.05)]">
                        {hasOrder && isActionable && (oData?.status === 'Pending' || oData?.status === 'Confirmed') ? (
                          <div className="flex flex-col items-center gap-1">
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => openModal(ret)} className="w-full px-2 py-1.5 bg-mint-600 text-white text-[10px] font-bold rounded-lg">Dispatch</motion.button>
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleCancelOrder(ret)} className="w-full px-2 py-1 bg-red-50 dark:bg-red-900/30 rounded-lg text-[9px] font-bold text-red-500 flex items-center justify-center gap-0.5"><XCircle size={10} /> Cancel</motion.button>
                          </div>
                        ) : hasOrder && isActionable && oData?.status === 'Dispatched' ? (
                          <div className="flex flex-col items-center gap-1">
                            <motion.button whileTap={{ scale: 0.9 }} onClick={() => openModal(ret)} className="w-full px-2 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-lg">Deliver</motion.button>
                            <div className="flex gap-1 w-full">
                              <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleReturnOrder(ret)} className="flex-1 px-1 py-1 bg-amber-50 dark:bg-amber-900/30 rounded-lg text-[9px] font-bold text-amber-600 flex items-center justify-center gap-0.5" title="Return"><RotateCcw size={9} /> Ret</motion.button>
                              <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleUndoDispatch(ret)} className="flex-1 px-1 py-1 bg-gray-100 dark:bg-[#1a1a1a] rounded-lg text-[9px] font-bold text-gray-500 flex items-center justify-center gap-0.5" title="Undo"><Undo2 size={9} /> Undo</motion.button>
                            </div>
                          </div>
                        ) : oData?.status === 'Cancelled' ? (
                          <span className="text-[10px] font-bold text-red-500 flex items-center gap-0.5"><XCircle size={11} /> Cancelled</span>
                        ) : oData?.status === 'Returned' ? (
                          <span className="text-[10px] font-bold text-amber-600 flex items-center gap-0.5"><RotateCcw size={11} /> Returned</span>
                        ) : isDelivered ? (
                          <span className="text-[10px] font-bold text-mint-600 flex items-center gap-0.5"><Check size={12} className="inline" /> Done</span>
                        ) : null}
                      </td>
                    </tr>
                  );
                });
              })()}
              {/* Column Total Row */}
              <tr className="bg-[#0f172a]">
                <td className="sticky left-0 z-10 bg-[#0f172a] px-2 py-2.5 text-center border-r border-white/10"></td>
                <td className="sticky left-[40px] z-10 bg-[#0f172a] px-3 py-2.5 border-r border-white/10 text-xs font-bold text-white">TOTAL</td>
                {ALL_FIXED_KEYS.map(key => {
                  const colTotal = retailers.reduce((s, ret) => s + (orderMap[ret.phone]?.items[key] || 0), 0);
                  return <td key={key} className="px-1 py-2.5 text-center border-r border-white/10">{colTotal > 0 ? <span className="font-black text-[13px] text-amber-300">{colTotal}</span> : <span className="text-white/20">·</span>}</td>;
                })}
                <td className="px-2 py-2.5 text-center border-r border-white/10"><span className="font-black text-[13px] text-white">₹{retailers.reduce((s, ret) => s + calcTotal(orderMap[ret.phone]), 0).toFixed(2)}</span></td>
                <td className="px-2 py-2.5 text-center border-r border-white/10"><span className="font-bold text-[12px] text-mint-300">₹{retailers.reduce((s, ret) => s + (orderMap[ret.phone]?.payment || 0), 0).toFixed(0)}</span></td>
                <td className="sticky right-0 z-10 bg-[#0f172a] px-2 py-2.5 text-center border-l border-white/10"></td>
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
        <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#222222] overflow-hidden max-w-[calc(100vw-2rem)] lg:max-w-none">
          <div className="px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600">
            <p className="text-sm font-bold text-white">Seasonal Sheet</p>
          </div>
          <div className="overflow-x-auto scrollbar-hide">
            <table className="border-collapse w-full min-w-[600px]">
              <thead className="sticky top-0 z-30">
                <tr className="bg-[#0f172a]">
                  <th rowSpan={2} className="sticky left-0 z-20 bg-[#0f172a] px-2 py-3 text-center text-white font-bold text-xs border-r border-white/10 w-[40px]">SI</th>
                  <th rowSpan={2} className="sticky left-[40px] z-20 bg-[#0f172a] px-2 py-3 text-left text-white font-bold text-xs border-r border-white/10 w-[140px]">Retailer</th>
                  {SEASONAL_GROUPS.map((g, gi) => (<th key={gi} colSpan={g.items.length} className="px-1 py-3 text-center font-extrabold text-white text-xs border-r border-white/10">{g.group}</th>))}
                  <th rowSpan={2} className="px-2 py-3 text-center text-white font-bold text-xs w-[90px]">TOTAL</th>
                </tr>
                <tr className="bg-[#1e293b]">
                  {SEASONAL_GROUPS.flatMap(g => g.items).map(item => (<th key={item.key} className="px-1 py-2 text-center font-bold text-gray-300 border-r border-white/5 text-[11px]">{item.label}<br/><span className="text-[11px] font-medium text-gray-400">{priceMap[item.key] ? `₹${priceMap[item.key]}` : ''}</span></th>))}
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
                    return (
                      <tr key={ret.phone} className={`${i % 2 === 0 ? 'bg-white dark:bg-[#111111]' : 'bg-gray-50/50 dark:bg-[#1a1a1a]/30'} hover:bg-royal-50/30 dark:hover:bg-royal-900/20 transition-colors`}>
                        <td className="sticky left-0 z-10 bg-inherit px-2 py-2.5 text-center text-xs text-gray-500 font-mono border-b border-r border-gray-200 dark:border-[#222222]">{si}</td>
                        <td className="sticky left-[40px] z-10 bg-inherit px-3 py-2.5 border-b border-r border-gray-200 dark:border-[#222222]">
                          <p className="font-bold text-[13px] text-gray-800 dark:text-white truncate">{ret.name}</p><p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">{ret.phone}</p>
                        </td>
                        {ALL_SEASONAL_KEYS.map(key => {
                          const qty = oData?.items[key] || 0;
                          return (<td key={key} className="px-1 py-2.5 text-center border-b border-r border-gray-100 dark:border-[#1a1a1a] dark:border-[#222222]">{qty > 0 ? <span className="font-black text-[14px] text-amber-700">{qty}</span> : <span className="text-gray-200 dark:text-gray-600">·</span>}</td>);
                        })}
                        <td className="px-2 py-2.5 text-center border-b border-gray-200 dark:border-[#1a1a1a]">{sTotal > 0 ? <span className="font-black text-[13px] text-gray-800 dark:text-white">₹{sTotal.toFixed(2)}</span> : <span className="text-gray-200 dark:text-gray-600">—</span>}</td>
                      </tr>
                    );
                  });
                })()}
                {/* Seasonal Total Row */}
                <tr className="bg-[#0f172a]">
                  <td className="sticky left-0 z-10 bg-[#0f172a] px-2 py-2.5 text-center border-r border-white/10"></td>
                  <td className="sticky left-[40px] z-10 bg-[#0f172a] px-3 py-2.5 border-r border-white/10 text-xs font-bold text-white">TOTAL</td>
                  {ALL_SEASONAL_KEYS.map(key => {
                    const colTotal = retailers.reduce((s, ret) => s + (orderMap[ret.phone]?.items[key] || 0), 0);
                    return <td key={key} className="px-1 py-2.5 text-center border-r border-white/10">{colTotal > 0 ? <span className="font-black text-[13px] text-amber-300">{colTotal}</span> : <span className="text-white/20">·</span>}</td>;
                  })}
                  <td className="px-2 py-2.5 text-center border-r border-white/10"><span className="font-black text-[13px] text-white">₹{retailers.reduce((s, ret) => { const oData = orderMap[ret.phone]; return s + (oData ? ALL_SEASONAL_KEYS.reduce((t, k) => t + (oData.items[k] || 0) * (priceMap[k] || 0), 0) : 0); }, 0).toFixed(2)}</span></td>
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
      <AnimatePresence>
        {showBulkModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => { if (!bulkDispatching) { setShowBulkModal(false); document.body.style.overflow = ''; } }}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }} className="bg-white dark:bg-[#111111] rounded-3xl w-full max-w-lg shadow-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-5 pb-3 border-b border-gray-100 dark:border-[#222222] shrink-0">
                <div>
                  <h3 className="font-extrabold text-gray-800 dark:text-white text-lg">Review & Dispatch All</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{bulkItems.length} orders | {bulkItems.filter(b => b.edited).length} edited</p>
                </div>
                {!bulkDispatching && <button onClick={() => { setShowBulkModal(false); document.body.style.overflow = ''; }} className="w-8 h-8 bg-gray-100 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center text-gray-400"><X size={14} /></button>}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {bulkItems.map((bulk, ri) => (
                  <div key={bulk.retailer.phone} className={`rounded-xl border ${bulk.edited ? 'border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-900/5' : 'border-gray-100 dark:border-[#222222] bg-white dark:bg-[#111111]'} overflow-hidden`}>
                    <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-[#1a1a1a]">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-gray-400 w-5">{ri + 1}</span>
                        <div>
                          <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{bulk.retailer.name}</p>
                          <p className="text-[10px] text-gray-400">{bulk.retailer.area} | {bulk.retailer.phone.slice(-4)}</p>
                        </div>
                      </div>
                      {bulk.edited && <span className="text-[9px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded">Edited</span>}
                    </div>
                    <div className="px-3 py-2 space-y-1">
                      {bulk.items.map((item, ii) => (
                        <div key={ii} className="flex items-center justify-between gap-2">
                          <span className="text-xs text-gray-600 dark:text-gray-300 flex-1 truncate">{item.name}</span>
                          <input type="number" min="0" value={item.actual}
                            onChange={e => updateBulkQty(ri, ii, e.target.value)}
                            onKeyDown={e => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                            className={`w-14 h-7 text-center text-xs font-bold rounded-lg border outline-none ${item.actual !== item.ordered ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 text-amber-700 dark:text-amber-300' : 'border-gray-200 dark:border-[#333333] dark:bg-[#1a1a1a] dark:text-white'}`} />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="shrink-0 p-4 pt-3 border-t border-gray-100 dark:border-[#222222]">
                {bulkDispatching ? (
                  <div className="text-center">
                    <div className="w-full h-2 bg-gray-100 dark:bg-[#1a1a1a] rounded-full overflow-hidden mb-2">
                      <div className="h-full bg-mint-500 rounded-full transition-all" style={{ width: `${(bulkProgress.done / bulkProgress.total) * 100}%` }} />
                    </div>
                    <p className="text-xs font-bold text-gray-500">{bulkProgress.done}/{bulkProgress.total} dispatched</p>
                  </div>
                ) : (
                  <motion.button whileTap={{ scale: 0.97 }} onClick={confirmBulkDispatch}
                    className="w-full bg-mint-600 text-white font-bold py-3.5 rounded-xl shadow-md text-sm">
                    Confirm & Dispatch All ({bulkItems.length})
                  </motion.button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dispatch / Deliver Modal */}
      <AnimatePresence>
        {modal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => { setModal(null); document.body.style.overflow = ''; }}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }} className="bg-white dark:bg-[#111111] rounded-3xl w-full max-w-md shadow-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between p-6 pb-4 shrink-0">
                <div>
                  <h3 className="font-extrabold text-gray-800 dark:text-white text-lg">{modal.mode === 'dispatch' ? 'Dispatch Order' : 'Deliver & Collect'}</h3>
                  <p className="text-sm text-gray-400">{modal.retailer.name} • {modal.retailer.phone}</p>
                </div>
                <button onClick={() => { setModal(null); document.body.style.overflow = ''; }} className="w-8 h-8 bg-gray-100 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center text-gray-400"><X size={14} /></button>
              </div>

              <div className="px-6 pb-6 flex flex-col flex-1 min-h-0">
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
                    {/* Daily Items */}
                    {deliverForm.items.filter(i => ALL_FIXED_KEYS.includes(i.name)).length > 0 && (
                      <p className="text-[10px] font-bold text-royal-600 uppercase tracking-wider pt-1">Daily</p>
                    )}
                    {deliverForm.items.filter(i => ALL_FIXED_KEYS.includes(i.name)).map((item, idx) => {
                      const realIdx = deliverForm.items.indexOf(item);
                      return (
                        <div key={realIdx} className="grid grid-cols-12 items-center bg-gray-50 dark:bg-[#1a1a1a] rounded-xl px-3 py-2">
                          <span className="col-span-5 text-sm font-semibold text-gray-700">{item.name}</span>
                          <span className="col-span-2 text-center text-sm text-gray-400">{item.ordered}</span>
                          <div className="col-span-3 flex justify-center">
                            <input type="number" min="0" value={item.actual} onChange={e => updateActual(realIdx, e.target.value)} onKeyDown={e => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }} className="w-14 text-center text-sm font-bold border border-gray-200 dark:border-[#333333] dark:bg-[#1a1a1a] dark:text-white rounded-lg py-1 focus:border-royal-400 focus:outline-none" />
                          </div>
                          <span className="col-span-2 text-right text-sm font-bold text-gray-800">₹{(item.actual * item.unitPrice).toFixed(2)}</span>
                        </div>
                      );
                    })}
                    {/* Seasonal Items */}
                    {deliverForm.items.filter(i => !ALL_FIXED_KEYS.includes(i.name) && !i.extra).length > 0 && (
                      <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider pt-2">Seasonal</p>
                    )}
                    {deliverForm.items.filter(i => !ALL_FIXED_KEYS.includes(i.name) && !i.extra).map((item, idx) => {
                      const realIdx = deliverForm.items.indexOf(item);
                      return (
                        <div key={realIdx} className="grid grid-cols-12 items-center bg-amber-50 rounded-xl px-3 py-2">
                          <span className="col-span-5 text-sm font-semibold text-gray-700">{item.name}</span>
                          <span className="col-span-2 text-center text-sm text-gray-400">{item.ordered}</span>
                          <div className="col-span-3 flex justify-center">
                            <input type="number" min="0" value={item.actual} onChange={e => updateActual(realIdx, e.target.value)} onKeyDown={e => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }} className="w-14 text-center text-sm font-bold border border-amber-200 rounded-lg py-1 focus:border-amber-400 focus:outline-none" />
                          </div>
                          <span className="col-span-2 text-right text-sm font-bold text-gray-800">₹{(item.actual * item.unitPrice).toFixed(2)}</span>
                        </div>
                      );
                    })}
                    {/* Extra Items (not in original order) */}
                    {deliverForm.items.filter(i => i.extra).length > 0 && (
                      <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider pt-2">Extra (On-spot)</p>
                    )}
                    {deliverForm.items.filter(i => i.extra).map((item) => {
                      const realIdx = deliverForm.items.indexOf(item);
                      return (
                        <div key={realIdx} className="grid grid-cols-12 items-center bg-green-50 dark:bg-green-900/20 rounded-xl px-3 py-2 border border-green-200 dark:border-green-800">
                          <span className="col-span-4 text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">{item.name}</span>
                          <span className="col-span-2 text-center text-[10px] text-green-600 font-bold">EXTRA</span>
                          <div className="col-span-3 flex justify-center">
                            <input type="number" min="1" value={item.actual} onChange={e => updateActual(realIdx, e.target.value)} onKeyDown={e => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }} className="w-14 text-center text-sm font-bold border border-green-200 dark:border-green-700 dark:bg-[#1a1a1a] dark:text-white rounded-lg py-1 focus:border-green-400 focus:outline-none" />
                          </div>
                          <span className="col-span-2 text-right text-sm font-bold text-gray-800 dark:text-gray-200">₹{(item.actual * item.unitPrice).toFixed(0)}</span>
                          <button onClick={() => setDeliverForm(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== realIdx) }))} className="col-span-1 flex justify-end"><Trash2 size={13} className="text-red-400" /></button>
                        </div>
                      );
                    })}
                    {/* Add Extra Item Button & Picker */}
                    {!showExtraPicker ? (
                      <button onClick={() => { setShowExtraPicker(true); setExtraSearch(''); }} className="flex items-center gap-1.5 px-3 py-2 mt-2 text-xs font-bold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-dashed border-green-300 dark:border-green-700 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors w-full justify-center">
                        <Plus size={13} /> Add Extra Item
                      </button>
                    ) : (
                      <div className="mt-2 border border-green-200 dark:border-green-800 rounded-xl overflow-hidden bg-white dark:bg-[#111111]">
                        <div className="flex items-center gap-2 px-3 py-2 border-b border-green-100 dark:border-green-900">
                          <input type="text" placeholder="Search product..." value={extraSearch} onChange={e => setExtraSearch(e.target.value)} autoFocus className="flex-1 text-sm outline-none bg-transparent dark:text-white" />
                          <button onClick={() => setShowExtraPicker(false)} className="w-6 h-6 bg-gray-100 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center"><X size={10} className="text-gray-500" /></button>
                        </div>
                        <div className="max-h-[150px] overflow-y-auto">
                          {products.filter(p => {
                            const alreadyIn = deliverForm.items.some(i => i.name === p.name);
                            const matchSearch = !extraSearch || p.name.toLowerCase().includes(extraSearch.toLowerCase());
                            return !alreadyIn && matchSearch;
                          }).map(p => (
                            <button key={p.id} onClick={() => {
                              setDeliverForm(prev => ({ ...prev, items: [...prev.items, { name: p.name, ordered: 0, actual: 1, unitPrice: p.price || 0, extra: true }] }));
                              setShowExtraPicker(false);
                            }} className="w-full flex items-center justify-between px-3 py-2 hover:bg-green-50 dark:hover:bg-green-900/20 text-left border-b border-gray-50 dark:border-[#222222] last:border-0">
                              <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">{p.name}</span>
                              <span className="text-[10px] text-gray-400">₹{p.price}/{p.unit}</span>
                            </button>
                          ))}
                          {products.filter(p => !deliverForm.items.some(i => i.name === p.name) && (!extraSearch || p.name.toLowerCase().includes(extraSearch.toLowerCase()))).length === 0 && (
                            <p className="text-xs text-gray-400 text-center py-3">No products available</p>
                          )}
                        </div>
                      </div>
                    )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-royal-50 rounded-xl px-4 py-3 shrink-0">
                    <span className="text-sm font-bold text-gray-700">Actual Total</span>
                    <span className="text-lg font-black text-royal-800">₹{formTotal.toFixed(2)}</span>
                  </div>
                  {showDispatchConfirm && (
                    <div className="mt-3">
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                        <p className="text-sm font-bold text-amber-800">Quantity Changed!</p>
                        <p className="text-xs text-amber-600 mt-1">Some items have different actual qty than ordered.</p>
                        <div className="mt-3 space-y-1">
                          {deliverForm.items.filter(i => i.actual !== i.ordered && !i.extra).map((i, idx) => (
                            <p key={idx} className="text-xs text-gray-700"><span className="font-bold">{i.name}</span>: {i.ordered} → {i.actual}</p>
                          ))}
                          {deliverForm.items.filter(i => i.extra).map((i, idx) => (
                            <p key={idx} className="text-xs text-green-700"><span className="font-bold">{i.name}</span>: +{i.actual} (extra)</p>
                          ))}
                        </div>
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
                      <div key={idx} className="grid grid-cols-12 items-center bg-gray-50 dark:bg-[#1a1a1a] rounded-xl px-3 py-2">
                        <span className="col-span-6 text-sm font-semibold text-gray-700 dark:text-gray-200">{item.name}</span>
                        <span className="col-span-3 text-center text-sm font-bold text-gray-800 dark:text-white">{item.actual || item.qty}</span>
                        <span className="col-span-3 text-right text-sm font-bold text-gray-800 dark:text-white">₹{((item.actual || item.qty || 0) * (item.unitPrice || 0)).toFixed(2)}</span>
                      </div>
                    ))}
                    {deliverForm.items.filter(i => i.extra).length > 0 && (
                      <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider pt-2">Extra (On-spot)</p>
                    )}
                    {deliverForm.items.filter(i => i.extra).map((item, idx) => (
                      <div key={idx} className="grid grid-cols-12 items-center bg-green-50 dark:bg-green-900/20 rounded-xl px-3 py-2 border border-green-200 dark:border-green-800">
                        <span className="col-span-6 text-sm font-semibold text-gray-700 dark:text-gray-200">{item.name}</span>
                        <span className="col-span-3 text-center text-sm font-bold text-green-700 dark:text-green-300">{item.actual || item.qty}</span>
                        <span className="col-span-3 text-right text-sm font-bold text-gray-800 dark:text-white">₹{((item.actual || item.qty || 0) * (item.unitPrice || 0)).toFixed(2)}</span>
                      </div>
                    ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center bg-royal-50 rounded-xl px-4 py-3 mb-4">
                    <span className="text-sm font-bold text-gray-700">Actual Total</span>
                    <span className="text-lg font-black text-royal-800">₹{(modal.actualTotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="mb-5">
                    <label className="text-sm font-bold text-gray-600 mb-1.5 block">Payment Collected (₹)</label>
                    <div className="relative">
                      <div className="flex items-center justify-between bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#222222] rounded-t-xl px-4 py-2">
                        <span className="text-xs text-gray-500">Due: <span className="font-bold text-red-600">{formatPrice(modalBalance)}</span></span>
                        <span className="text-xs text-gray-500">Today: <span className="font-bold text-gray-800">{formatPrice(modal.actualTotal || 0)}</span></span>
                        <span className="text-xs text-gray-500">Total: <span className="font-black text-red-600">{formatPrice(modalBalance + (modal.actualTotal || 0))}</span></span>
                      </div>
                      <input type="number" min="0" placeholder="Enter amount" value={deliverForm.payment}
                        onFocus={e => { if (e.target.value === '0') setDeliverForm(f => ({ ...f, payment: '' })); }}
                        onChange={e => {
                          const val = Number(e.target.value) || 0;
                          if (val > modalBalance + (modal.actualTotal || 0)) return;
                          setDeliverForm(f => ({ ...f, payment: e.target.value }));
                        }}
                        onKeyDown={e => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }}
                        className="w-full py-3.5 px-4 text-xl font-bold text-center border border-t-0 border-gray-200 dark:border-[#333333] dark:bg-[#1a1a1a] dark:text-white rounded-b-xl focus:border-royal-400 focus:outline-none" />
                    </div>
                    {Number(deliverForm.payment) > 0 && <p className="text-[11px] text-mint-600 font-bold mt-1.5">Remaining due after payment: {formatPrice(modalBalance + (modal.actualTotal || 0) - (Number(deliverForm.payment) || 0))}</p>}
                  </div>
                </>
              )}
              </div>
              {/* Sticky Footer Button */}
              <div className="shrink-0 px-6 pb-5 pt-3">
                {modal.mode === 'dispatch' ? (
                  showDispatchConfirm ? (
                    <div className="flex gap-2">
                      <button onClick={() => setShowDispatchConfirm(false)} className="flex-1 py-3 rounded-xl font-bold text-sm bg-gray-100 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-300">Cancel</button>
                      <motion.button whileTap={{ scale: 0.97 }} onClick={handleDispatch} disabled={delivering} className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-mint-600 shadow-md disabled:opacity-50">
                        {delivering ? 'Processing...' : 'Confirm & Dispatch'}
                      </motion.button>
                    </div>
                  ) : (
                    <motion.button whileTap={{ scale: 0.97 }} onClick={() => setShowDispatchConfirm(true)} className="w-full bg-mint-600 text-white font-bold py-3.5 rounded-xl shadow-md text-sm">
                      Dispatch
                    </motion.button>
                  )
                ) : (
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleDeliver} disabled={delivering} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl shadow-md text-sm disabled:opacity-50">
                    {delivering ? <span className="flex items-center justify-center gap-2"><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />Processing...</span> : 'Deliver & Collect'}
                  </motion.button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Receipt Popup */}
      <AnimatePresence>
        {lastReceipt && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => { setLastReceipt(null); document.body.style.overflow = ''; }}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }} className="bg-white dark:bg-[#111111] rounded-3xl p-6 w-full max-w-xs shadow-2xl text-center" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-12 bg-mint-50 dark:bg-mint-900/30 rounded-full flex items-center justify-center mx-auto mb-3"><Check size={22} className="text-mint-600" /></div>
              <h3 className="font-extrabold text-gray-800 dark:text-white text-lg">Payment Collected!</h3>
              <p className="text-2xl font-black text-mint-600 mt-2">Rs. {lastReceipt.amount.toLocaleString('en-IN')}</p>
              <p className="text-sm text-gray-500 mt-1">from {lastReceipt.name}</p>
              <p className="text-xs text-gray-400 mt-1">Balance: Rs. {lastReceipt.balanceAfter.toLocaleString('en-IN')}</p>
              <div className="flex gap-2 mt-5">
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setLastReceipt(null); document.body.style.overflow = ''; }} className="flex-1 py-2.5 rounded-xl font-bold text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#1a1a1a]">Close</motion.button>
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


