import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Check, Download, PackagePlus, Save, Copy, History, CheckCircle2 } from 'lucide-react';
import { db, collection, getDocs, setDoc, doc, getDoc, query, where } from '../../services/firebase';
import { jsPDF } from 'jspdf';
import { TableSkeleton } from '../../components/LoadingSkeleton';
import { useConfirm } from '../../components/ConfirmModal';

export default function CompanyOrder() {
  const [date, setDate] = useState(() => {
    const t = new Date(); t.setDate(t.getDate() + 1);
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  });
  const [products, setProducts] = useState([]);
  const [orderMap, setOrderMap] = useState({});
  const [shopStock, setShopStock] = useState({});
  const [companyOrder, setCompanyOrder] = useState({});
  const [stockReceived, setStockReceived] = useState({});
  const [savedStock, setSavedStock] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [tab, setTab] = useState('order');
  const [historyMonth, setHistoryMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [historyData, setHistoryData] = useState([]);
  const confirm = useConfirm();

  const tomorrowLocal = (() => { const t = new Date(); t.setDate(t.getDate() + 1); return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`; })();

  useEffect(() => { fetchData(); }, [date]);
  useEffect(() => { if (tab === 'history') fetchHistory(); }, [tab, historyMonth]);

  const [groupOrder, setGroupOrder] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const prodSnap = await getDocs(collection(db, 'products'));
      setProducts(prodSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter(p => p.active !== false));
      const groupDoc = await getDoc(doc(db, 'settings', 'productGroups'));
      if (groupDoc.exists() && groupDoc.data().daily) setGroupOrder(groupDoc.data().daily);
      const dateStr = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      const ordSnap = await getDocs(query(collection(db, 'orders'), where('date', '==', dateStr)));
      const ords = ordSnap.docs.map(d => d.data());
      const oMap = {};
      ords.filter(o => o.status !== 'Cancelled' && o.status !== 'Returned').forEach(o => { (o.items || []).forEach(item => { oMap[item.name] = (oMap[item.name] || 0) + (parseFloat(String(item.qty).replace(/[^0-9.]/g, '')) || 0); }); });
      setOrderMap(oMap);
      const stockDocId = date.replace(/-/g, '');
      const coDoc = await getDoc(doc(db, 'company_orders', stockDocId));
      setCompanyOrder(coDoc.exists() ? (coDoc.data().items || {}) : {});
      const stockDoc = await getDoc(doc(db, 'daily_stock', stockDocId));
      if (stockDoc.exists()) { setSavedStock(stockDoc.data().items || {}); setStockReceived(stockDoc.data().items || {}); }
      else { setSavedStock({}); setStockReceived({}); }
    } catch (err) {}
    setLoading(false);
  };

  const fetchHistory = async () => {
    try {
      const snap = await getDocs(collection(db, 'company_orders'));
      const prefix = historyMonth.replace('-', '');
      const all = snap.docs.filter(d => d.id.startsWith(prefix)).map(d => ({ id: d.id, ...d.data() }));
      setHistoryData(all.sort((a, b) => (b.date || '').localeCompare(a.date || '')));
    } catch (err) { setHistoryData([]); }
  };

  const saveOrder = async () => {
    const ok = await confirm({ title: 'Save Company Order', message: 'Save this order to company? You can edit later.', confirmText: 'Save', type: 'warning' });
    if (!ok) return;
    setSaving(true);
    const stockDocId = date.replace(/-/g, '');
    const orderItems = {};
    products.forEach(p => { const t = Math.max(0, (orderMap[p.name] || 0) + (Number(shopStock[p.name]) || 0)); if (t > 0) orderItems[p.name] = t; });
    await setDoc(doc(db, 'company_orders', stockDocId), { items: orderItems, date, updatedAt: new Date().toISOString() });
    setCompanyOrder(orderItems);
    setSaving(false);
    setToast('Order saved!'); setTimeout(() => setToast(''), 2000);
  };

  const saveStock = async () => {
    const ok = await confirm({ title: 'Save Stock Received', message: 'Save the received stock quantities?', confirmText: 'Save', type: 'warning' });
    if (!ok) return;
    setSaving(true);
    const stockDocId = date.replace(/-/g, '');
    await setDoc(doc(db, 'daily_stock', stockDocId), { items: stockReceived, date, updatedAt: new Date().toISOString() });
    setSavedStock({ ...stockReceived });
    setSaving(false);
    setToast('Stock saved!'); setTimeout(() => setToast(''), 2000);
  };

  const sortedProducts = (type) => {
    const list = products.filter(p => p.type === type);
    if (type === 'daily') {
      return [...list].sort((a, b) => {
        const ai = groupOrder.indexOf(a.group); const bi = groupOrder.indexOf(b.group);
        const ao = ai === -1 ? 999 : ai; const bo = bi === -1 ? 999 : bi;
        if (ao !== bo) return ao - bo;
        return a.name.localeCompare(b.name);
      });
    }
    return list;
  };

  const copyWhatsApp = () => {
    const allProducts = [...sortedProducts('daily'), ...sortedProducts('seasonal')];
    let si = 1;
    const lines = allProducts.map(p => { const t = (orderMap[p.name] || 0) + (Number(shopStock[p.name]) || 0); if (t > 0) { return `${si++}. ${p.name} — ${t} ${p.unit || 'pcs'}`; } return null; }).filter(Boolean);
    const dateStr = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    let text = `*Lucy Garden*\n${dateStr}\n\n${lines.join('\n')}`;
    navigator.clipboard?.writeText(text).then(() => { setToast('Copied!'); setTimeout(() => setToast(''), 2000); });
  };

  const downloadPDF = () => {
    const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
    const w = pdf.internal.pageSize.getWidth(); const h = pdf.internal.pageSize.getHeight(); const m = 15;
    const dateStr = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    let y = m;
    pdf.setFont('helvetica', 'bold'); pdf.setFontSize(14); pdf.text('LUCY GARDEN', w / 2, y + 6, { align: 'center' });
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(10); pdf.text(dateStr, w / 2, y + 12, { align: 'center' });
    y += 18; pdf.setDrawColor(0); pdf.setLineWidth(0.3); pdf.line(m, y, w - m, y); y += 4;
    const tW = w - (m * 2); const rowH = 8;
    const colSI = 10; const colProduct = tW - 10 - 25 - 20; const colQty = 25; const colUnit = 20;
    let si = 1;

    const drawTableHeader = () => {
      pdf.setFillColor(30, 41, 59); pdf.rect(m, y, tW, rowH, 'F');
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(255, 255, 255);
      pdf.text('#', m + colSI / 2, y + 5.5, { align: 'center' });
      pdf.text('Product', m + colSI + 3, y + 5.5);
      pdf.text('Qty', m + colSI + colProduct + colQty / 2, y + 5.5, { align: 'center' });
      pdf.text('Unit', m + colSI + colProduct + colQty + colUnit / 2, y + 5.5, { align: 'center' });
      pdf.setTextColor(0, 0, 0); y += rowH;
    };

    drawTableHeader();

    const allProducts = [...sortedProducts('daily'), ...sortedProducts('seasonal')];
    allProducts.forEach(p => {
      const qty = (orderMap[p.name] || 0) + (Number(shopStock[p.name]) || 0);
      if (qty <= 0) return;
      if (y + rowH > h - 15) { pdf.addPage(); y = m; drawTableHeader(); }
      pdf.setDrawColor(220, 220, 220); pdf.setLineWidth(0.1); pdf.rect(m, y, tW, rowH, 'S');
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(9); pdf.text(`${si}`, m + colSI / 2, y + 5.5, { align: 'center' });
      pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.text(p.name, m + colSI + 3, y + 5.5);
      pdf.setFontSize(11); pdf.text(`${qty}`, m + colSI + colProduct + colQty / 2, y + 5.5, { align: 'center' });
      pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.text(p.unit || 'pcs', m + colSI + colProduct + colQty + colUnit / 2, y + 5.5, { align: 'center' });
      y += rowH; si++;
    });

    y += 8;
    if (y + 12 > h - 10) { pdf.addPage(); y = m; }
    pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(130, 130, 130);
    pdf.text(`${si - 1} products`, m, y);
    pdf.text('Lucy Garden', w - m, y, { align: 'right' });
    y += 5;
    pdf.setFontSize(6); pdf.setTextColor(150, 150, 150);
    pdf.text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`, m, y);

    pdf.save(`LG_Order_${dateStr.replace(/[\s,]/g, '')}.pdf`);
  };

  // Dirty state check
  const currentItems = {};
  products.forEach(p => { const t = Math.max(0, (orderMap[p.name] || 0) + (Number(shopStock[p.name]) || 0)); if (t > 0) currentItems[p.name] = t; });
  const hasItems = Object.keys(currentItems).length > 0;
  const isSaved = Object.keys(companyOrder).length > 0;
  const isDirty = JSON.stringify(currentItems) !== JSON.stringify(companyOrder);

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-4">
      <AnimatePresence>{toast && (<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-[4.5rem] left-4 right-4 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:w-auto z-[100] flex items-center justify-center gap-2 px-4 py-3 rounded-2xl shadow-xl bg-mint-50 dark:bg-mint-900/80 border border-mint-200 dark:border-mint-700 text-mint-800 dark:text-mint-200 backdrop-blur-sm"><Check size={14} strokeWidth={3} /><span className="text-sm font-bold">{toast}</span></motion.div>)}</AnimatePresence>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { key: 'order', label: 'Order', icon: Save },
          ...(isSaved ? [{ key: 'stock', label: 'Stock Received', icon: PackagePlus }] : []),
          { key: 'history', label: 'History', icon: History }
        ].map(t => (
          <motion.button key={t.key} whileTap={{ scale: 0.95 }} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${tab === t.key ? 'bg-royal-700 text-white shadow-md' : 'bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] text-gray-600 dark:text-gray-300'}`}>
            <t.icon size={14} /> {t.label}
          </motion.button>
        ))}
      </div>

      {/* Date Picker */}
      {tab !== 'history' && (
        <div className="flex items-center gap-2 bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-xl px-3 py-2 w-fit">
          <Calendar size={14} className="text-gray-400" />
          <input type="date" value={date} onChange={e => setDate(e.target.value)} max={tomorrowLocal} className="text-sm font-bold text-gray-700 dark:text-gray-200 outline-none bg-transparent" />
        </div>
      )}

      {/* ORDER TAB */}
      <AnimatePresence mode="wait">
      {tab === 'order' && (
        <motion.div key="order" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Daily */}
            <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#222222] overflow-hidden">
              <div className="px-3 py-2 bg-[#0f172a]"><p className="text-xs font-bold text-white">Daily Products</p></div>
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 dark:bg-[#1a1a1a]"><th className="px-2 py-2 text-center text-xs w-[30px]">#</th><th className="px-2 py-2 text-left text-xs">Product</th><th className="px-2 py-2 text-center text-xs w-[50px]">Ord</th><th className="px-2 py-2 text-center text-xs w-[60px]">Adjust</th><th className="px-2 py-2 text-center text-xs w-[50px]">Total</th></tr></thead>
                <tbody>
                  {sortedProducts('daily').map((p, idx) => {
                    const oQty = orderMap[p.name] || 0;
                    const adj = Number(shopStock[p.name]) || 0;
                    const total = Math.max(0, oQty + adj);
                    return (
                      <tr key={p.id} className={`border-t border-gray-100 dark:border-[#222222] ${total === 0 && oQty === 0 ? 'opacity-40' : ''}`}>
                        <td className="px-2 py-2 text-center text-xs text-gray-400">{idx + 1}</td>
                        <td className="px-2 py-2 text-sm font-semibold text-gray-800 dark:text-white">{p.name}</td>
                        <td className="px-2 py-2 text-center text-sm font-bold text-royal-700 dark:text-royal-300">{oQty || '—'}</td>
                        <td className="px-2 py-2 text-center"><input type="number" value={shopStock[p.name] || ''} onChange={e => setShopStock(prev => ({ ...prev, [p.name]: e.target.value }))} disabled={isSaved} className={`w-14 text-center text-sm font-bold border rounded-lg py-1 focus:outline-none dark:bg-[#1a1a1a] dark:text-white disabled:opacity-50 disabled:cursor-not-allowed ${Number(shopStock[p.name]) < 0 ? 'border-red-300 text-red-600 focus:border-red-400' : 'border-gray-200 dark:border-[#333333] focus:border-royal-400'}`} placeholder="±0" /></td>
                        <td className={`px-2 py-2 text-center text-sm font-black ${total < oQty ? 'text-red-600' : 'text-gray-800 dark:text-white'}`}>{total || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {/* Seasonal */}
            <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#222222] overflow-hidden">
              <div className="px-3 py-2 bg-amber-500"><p className="text-xs font-bold text-white">Seasonal Products</p></div>
              <table className="w-full text-sm">
                <thead><tr className="bg-gray-50 dark:bg-[#1a1a1a]"><th className="px-2 py-2 text-center text-xs w-[30px]">#</th><th className="px-2 py-2 text-left text-xs">Product</th><th className="px-2 py-2 text-center text-xs w-[50px]">Ord</th><th className="px-2 py-2 text-center text-xs w-[60px]">Adjust</th><th className="px-2 py-2 text-center text-xs w-[50px]">Total</th></tr></thead>
                <tbody>
                  {sortedProducts('seasonal').map((p, idx) => {
                    const oQty = orderMap[p.name] || 0;
                    const adj = Number(shopStock[p.name]) || 0;
                    const total = Math.max(0, oQty + adj);
                    return (
                      <tr key={p.id} className={`border-t border-gray-100 dark:border-[#222222] ${total === 0 && oQty === 0 ? 'opacity-40' : ''}`}>
                        <td className="px-2 py-2 text-center text-xs text-gray-400">{idx + 1}</td>
                        <td className="px-2 py-2 text-sm font-semibold text-gray-800 dark:text-white">{p.name}</td>
                        <td className="px-2 py-2 text-center text-sm font-bold text-royal-700 dark:text-royal-300">{oQty || '—'}</td>
                        <td className="px-2 py-2 text-center"><input type="number" value={shopStock[p.name] || ''} onChange={e => setShopStock(prev => ({ ...prev, [p.name]: e.target.value }))} disabled={isSaved} className={`w-14 text-center text-sm font-bold border rounded-lg py-1 focus:outline-none dark:bg-[#1a1a1a] dark:text-white disabled:opacity-50 disabled:cursor-not-allowed ${Number(shopStock[p.name]) < 0 ? 'border-red-300 text-red-600 focus:border-red-400' : 'border-gray-200 dark:border-[#333333] focus:border-royal-400'}`} placeholder="±0" /></td>
                        <td className={`px-2 py-2 text-center text-sm font-black ${total < oQty ? 'text-red-600' : 'text-gray-800 dark:text-white'}`}>{total || '—'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Buttons */}
          <AnimatePresence mode="wait">
            {!isSaved ? (
              <motion.div key="save" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex justify-center">
                <motion.button whileTap={{ scale: 0.95 }} onClick={saveOrder} disabled={saving || !hasItems} className="bg-mint-600 text-white font-bold py-2.5 px-10 rounded-xl text-sm disabled:opacity-30 shadow-md">
                  {saving ? (<span className="flex items-center gap-2"><motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />Saving...</span>) : 'Save Order'}
                </motion.button>
              </motion.div>
            ) : (
              <motion.div key="actions" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-3">
                <div className="bg-mint-50 dark:bg-mint-900/20 border border-mint-200 dark:border-mint-800 rounded-2xl px-4 py-2.5 text-center">
                  <p className="text-xs font-bold text-mint-700 dark:text-mint-300"><CheckCircle2 size={12} className="inline text-green-500" /> Order saved — send to company</p>
                </div>
                <div className="flex justify-center gap-3">
                  <motion.button whileTap={{ scale: 0.95 }} onClick={copyWhatsApp} className="flex items-center gap-1.5 bg-[#0f172a] text-white font-bold py-2.5 px-6 rounded-xl text-sm shadow-md"><Copy size={14} /> Copy</motion.button>
                  <motion.button whileTap={{ scale: 0.95 }} onClick={downloadPDF} className="flex items-center gap-1.5 bg-royal-700 text-white font-bold py-2.5 px-6 rounded-xl text-sm shadow-md"><Download size={14} /> PDF</motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* STOCK RECEIVED TAB */}
      {tab === 'stock' && isSaved && (
        <motion.div key="stock" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="space-y-4">
          {Object.keys(savedStock).length > 0 ? (
            <>
              <div className="bg-mint-50 dark:bg-mint-900/20 border border-mint-200 dark:border-mint-800 rounded-2xl px-4 py-3 text-center">
                <p className="text-sm font-bold text-mint-700 dark:text-mint-300"><CheckCircle2 size={12} className="inline text-green-500" /> Stock received & saved</p>
                <p className="text-xs text-mint-600 dark:text-mint-400 mt-1">Stock has been recorded. Cannot be edited.</p>
              </div>
              <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#222222] overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 dark:bg-[#1a1a1a]"><th className="px-3 py-2 text-center text-xs w-[40px]">#</th><th className="px-3 py-2 text-left text-xs">Product</th><th className="px-3 py-2 text-center text-xs w-[70px]">Ordered</th><th className="px-3 py-2 text-center text-xs w-[70px]">Received</th><th className="px-3 py-2 text-center text-xs w-[60px]">Diff</th></tr></thead>
                  <tbody>
                    {Object.entries(companyOrder).map(([name, ordered], idx) => {
                      const received = Number(savedStock[name]) || 0;
                      const diff = received - ordered;
                      return (
                        <tr key={name} className={`border-t border-gray-100 dark:border-[#222222] ${diff < 0 ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                          <td className="px-3 py-2 text-center text-xs text-gray-400">{idx + 1}</td>
                          <td className="px-3 py-2 text-sm font-semibold text-gray-800 dark:text-white">{name}</td>
                          <td className="px-3 py-2 text-center text-sm font-bold text-royal-700 dark:text-royal-300">{ordered}</td>
                          <td className="px-3 py-2 text-center text-sm font-bold text-gray-800 dark:text-white">{received}</td>
                          <td className={`px-3 py-2 text-center text-xs font-bold ${diff < 0 ? 'text-red-600' : diff > 0 ? 'text-green-600' : 'text-gray-400'}`}>{diff > 0 ? `+${diff}` : diff === 0 ? <Check size={12} className="inline" /> : diff}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#222222] overflow-hidden">
                <table className="w-full text-sm">
                  <thead><tr className="bg-gray-50 dark:bg-[#1a1a1a]"><th className="px-3 py-2 text-center text-xs w-[40px]">#</th><th className="px-3 py-2 text-left text-xs">Product</th><th className="px-3 py-2 text-center text-xs w-[70px]">Ordered</th><th className="px-3 py-2 text-center text-xs w-[80px]">Received</th><th className="px-3 py-2 text-center text-xs w-[60px]">Diff</th></tr></thead>
                  <tbody>
                    {Object.entries(companyOrder).map(([name, ordered], idx) => {
                      const received = Number(stockReceived[name]) || 0;
                      const diff = received - ordered;
                      return (
                        <tr key={name} className={`border-t border-gray-100 dark:border-[#222222] ${diff < 0 ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                          <td className="px-3 py-2 text-center text-xs text-gray-400">{idx + 1}</td>
                          <td className="px-3 py-2 text-sm font-semibold text-gray-800 dark:text-white">{name}</td>
                          <td className="px-3 py-2 text-center text-sm font-bold text-royal-700 dark:text-royal-300">{ordered}</td>
                          <td className="px-3 py-2 text-center"><input type="number" min="0" value={stockReceived[name] ?? ''} onChange={e => setStockReceived(prev => ({ ...prev, [name]: e.target.value === '' ? 0 : Number(e.target.value) }))} onKeyDown={e => { if (e.key === '-' || e.key === 'e') e.preventDefault(); }} className={`w-16 text-center text-sm font-bold border rounded-lg py-1 focus:outline-none dark:bg-[#1a1a1a] dark:text-white ${diff < 0 ? 'border-red-300 focus:border-red-400' : 'border-gray-200 dark:border-[#333333] focus:border-royal-400'}`} placeholder="0" /></td>
                          <td className={`px-3 py-2 text-center text-xs font-bold ${diff < 0 ? 'text-red-600' : diff > 0 ? 'text-green-600' : 'text-gray-400'}`}>{received > 0 ? (diff > 0 ? `+${diff}` : diff === 0 ? <Check size={12} className="inline" /> : diff) : '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-center">
                <motion.button whileTap={{ scale: 0.95 }} onClick={saveStock} disabled={saving} className="bg-emerald-600 text-white font-bold py-2.5 px-10 rounded-xl text-sm disabled:opacity-30 shadow-md">
                  {saving ? 'Saving...' : 'Save Stock Received'}
                </motion.button>
              </div>
            </>
          )}
        </motion.div>
      )}

      {/* HISTORY TAB */}
      {tab === 'history' && (
        <motion.div key="history" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.2 }} className="space-y-4">
          <input type="month" value={historyMonth} onChange={e => setHistoryMonth(e.target.value)} className="text-sm font-bold bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-xl px-3 py-2.5 outline-none dark:text-white" />
          {historyData.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {historyData.map((order, i) => {
                const dateStr = new Date(order.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
                const items = Object.entries(order.items || {});
                const totalQty = items.reduce((s, [, q]) => s + q, 0);
                return (
                  <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * i }}
                    className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#222222] p-4 cursor-pointer hover:border-royal-300 hover:shadow-md transition-all"
                    onClick={() => { const el = document.getElementById(`hist-${order.id}`); if (el) el.classList.toggle('hidden'); }}>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold text-gray-800 dark:text-white">{dateStr}</p>
                      <span className="text-[10px] font-bold text-royal-600 bg-royal-50 dark:bg-royal-900/20 px-2 py-0.5 rounded-lg">{totalQty} qty</span>
                    </div>
                    <p className="text-[10px] text-gray-400">{items.length} products • tap to view</p>
                    <div id={`hist-${order.id}`} className="hidden mt-3 space-y-1 border-t border-gray-100 dark:border-[#222222] pt-2">
                      {items.map(([name, qty], si) => (
                        <div key={name} className="flex items-center justify-between">
                          <span className="text-xs text-gray-600 dark:text-gray-300"><span className="text-gray-400 mr-1">{si + 1}.</span>{name}</span>
                          <span className="text-xs font-black text-gray-800 dark:text-white">{qty}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <History size={32} className="text-gray-200 dark:text-[#444444] mx-auto mb-3" />
              <p className="text-sm text-gray-400">No orders found for this month</p>
            </div>
          )}
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
