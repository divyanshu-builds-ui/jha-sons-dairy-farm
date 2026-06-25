import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Edit3, Trash2, X, Check, Percent, Layers, ArrowUp, ArrowDown, Eye, EyeOff, RotateCcw, Printer, Info, AlertTriangle } from 'lucide-react';
import { db, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, setDoc, cachedGetDoc } from '../../services/firebase';
import { formatPrice } from '../../utils/price';
import { TableSkeleton } from '../../components/LoadingSkeleton';
import { useConfirm } from '../../components/ConfirmModal';
import { jsPDF } from 'jspdf';
import { drawText } from '../../utils/pdfHelper';


export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [groupOptions, setGroupOptions] = useState({ daily: [], seasonal: [] });
  const [showGroups, setShowGroups] = useState(false);
  const [newGroup, setNewGroup] = useState('');
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState({ name: '', price: '', unit: 'pkt', type: 'daily', group: '', label: '' });
  const [loading, setLoading] = useState(true);
  const confirm = useConfirm();
  const [toast, setToast] = useState('');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkPercent, setBulkPercent] = useState('');
  const [bulkGroup, setBulkGroup] = useState('ALL');
  const [bulkProcessing, setBulkProcessing] = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });
  const [showHidden, setShowHidden] = useState(false);
  const [hiddenProducts, setHiddenProducts] = useState([]);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const snap = await getDocs(collection(db, 'products'));
      const all = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setProducts(all.filter(p => p.active !== false));
      setHiddenProducts(all.filter(p => p.active === false));
      const groupDoc = await cachedGetDoc(doc(db, 'settings', 'productGroups'));
      if (groupDoc.exists() && groupDoc.data().daily) {
        setGroupOptions({ daily: groupDoc.data().daily || [], seasonal: groupDoc.data().seasonal || [], codes: groupDoc.data().codes || {} });
      } else {
        const defaults = { daily: ['TM', 'SM', 'LITE DAHI', 'PREMIUM DAHI', 'PANEER', 'GHEE'], seasonal: ['SWEETS', 'DRINKS', 'OTHER'], codes: {} };
        setGroupOptions(defaults);
        await setDoc(doc(db, 'settings', 'productGroups'), defaults, { merge: true });
      }
    } catch (err) {}
    setLoading(false);
  };

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

  const sortByGroupOrder = (list, type) => {
    const order = groupOptions[type] || [];
    return [...list].sort((a, b) => {
      const ai = order.indexOf(a.group); const bi = order.indexOf(b.group);
      const ao = ai === -1 ? 999 : ai; const bo = bi === -1 ? 999 : bi;
      if (ao !== bo) return ao - bo;
      return parseToGrams(a) - parseToGrams(b);
    });
  };

  const dailyProducts = useMemo(() => sortByGroupOrder(products.filter(p => p.type === 'daily'), 'daily'), [products, groupOptions]);
  const seasonalProducts = useMemo(() => sortByGroupOrder(products.filter(p => p.type === 'seasonal'), 'seasonal'), [products, groupOptions]);

  const filtered = (list) => list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  const openAdd = () => { setForm({ name: '', price: '', unit: 'pkt', type: 'daily', group: '', label: '' }); setEditProduct(null); setShowForm(true); };
  const openEdit = (p) => {
    setForm({ name: p.name, price: p.price || '', unit: p.unit, type: p.type || 'daily', group: p.group || '', label: p.label || '' });
    setEditProduct(p);
    setShowForm(true);
  };

  const [confirmPrice, setConfirmPrice] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!editProduct && !form.name.trim()) { showToastMsg('Product name is required', 'error'); return; }
    if (!form.price || Number(form.price) <= 0) { showToastMsg('Price is required', 'error'); return; }
    if (!form.unit) { showToastMsg('Unit is required', 'error'); return; }
    if (!form.group) { showToastMsg('Group is required', 'error'); return; }
    if (!editProduct && !form.label.trim()) { showToastMsg('Label is required', 'error'); return; }
    if (!editProduct && form.type === 'daily' && products.filter(p => p.type === 'daily').length >= 20) { showToastMsg('Daily products limit reached (max 20)', 'error'); return; }

    if (editProduct && !confirmPrice && editProduct.price !== (Number(form.price) || 0)) { setConfirmPrice(true); return; }
    if (!editProduct) {
      const exists = products.find(p => p.name.toLowerCase() === form.name.trim().toLowerCase());
      if (exists) { showToastMsg(`${form.name} already exists!`, 'error'); return; }
    }
    setSaving(true);
    try {
      if (editProduct) {
        const updateData = { name: form.name.trim(), price: Number(form.price) || 0, unit: form.unit, type: form.type };
        if (form.group) updateData.group = form.group;
        else updateData.group = '';
        if (form.label) updateData.label = form.label;
        else updateData.label = '';
        await updateDoc(doc(db, 'products', editProduct.id), updateData);
        showToastMsg('Product updated');
      } else {
        const newProduct = { name: form.name.trim(), price: Number(form.price) || 0, unit: form.unit, type: form.type, createdAt: new Date().toISOString() };
        if (form.group) { newProduct.group = form.group; newProduct.label = form.label.trim() || form.name.trim(); }
        await addDoc(collection(db, 'products'), newProduct);
        showToastMsg('Product added');
      }
      setShowForm(false); setConfirmPrice(false); fetchData();
    } catch (err) {}
    setSaving(false);
  };

  const handleDelete = async (id) => {
    const ok = await confirm({ title: 'Hide Product', message: "This will hide the product. Old orders won't be affected.", confirmText: 'Hide', type: 'danger' });
    if (!ok) return;
  };

  const handleRestore = async (id) => {
  };


  const handleBulkUpdate = async () => {
    const pct = Number(bulkPercent) || 0;
    if (pct === 0) return;
    if (!bulkConfirm) { setBulkConfirm(true); return; }
    setBulkConfirm(false);
    const toUpdate = products.filter(p => bulkGroup === 'ALL' || p.group === bulkGroup);
    setBulkProcessing(true);
    setBulkProgress({ done: 0, total: toUpdate.length });
    let count = 0;
    for (const p of toUpdate) {
      const newPrice = Math.round(p.price * (1 + pct / 100) * 100) / 100;
      await updateDoc(doc(db, 'products', p.id), { price: newPrice });
      count++;
      setBulkProgress({ done: count, total: toUpdate.length });
    }
    setBulkProcessing(false);
    showToastMsg(`Updated ${count} products by ${pct}%`);
    setShowBulkModal(false); setBulkPercent(''); setBulkGroup('ALL'); setBulkConfirm(false);
    fetchData();
  };

  const showToastMsg = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(''), 2500); };

  const [newGroupCode, setNewGroupCode] = useState('');
  const [codeManual, setCodeManual] = useState(false);
  const [editingCode, setEditingCode] = useState(null);
  const [editCodeVal, setEditCodeVal] = useState('');
  const suggestCode = (name) => {
    if (!name) return '';
    const words = name.trim().split(/\s+/);
    if (name.length <= 5) return name;
    if (words.length > 1) {
      const initials = words.map(w => w[0]).join('');
      return initials.length >= 2 ? initials.slice(0, 5) : name.slice(0, 5);
    }
    // Single long word — take consonants priority
    const consonants = name.replace(/[AEIOU]/g, '');
    return (consonants.length >= 2 ? consonants : name).slice(0, 5);
  };
  const saveGroupCode = (g) => {
    const code = editCodeVal.trim().toUpperCase();
    if (code && code.length < 2) { showToastMsg('Min 2 chars', 'error'); return; }
    if (code && Object.entries(groupOptions.codes || {}).some(([k, v]) => v === code && k !== g)) { showToastMsg('Code already used', 'error'); return; }
    const newCodes = { ...(groupOptions.codes || {}) };
    if (code) newCodes[g] = code; else delete newCodes[g];
    saveGroups({ ...groupOptions, codes: newCodes }, code ? 'Code saved' : 'Code removed');
    setEditingCode(null);
  };
  const [groupSaving, setGroupSaving] = useState(false);
  const saveGroups = async (newObj, msg) => {
    setGroupSaving(true);
    setGroupOptions(newObj);
    try {
      await setDoc(doc(db, 'settings', 'productGroups'), newObj, { merge: true });
      if (msg) showToastMsg(msg);
    } catch(e) { showToastMsg('Failed to save', 'error'); }
    setGroupSaving(false);
  };
  const [newGroupType, setNewGroupType] = useState('daily');
  const addGroup = () => {
    const name = newGroup.trim().toUpperCase();
    const code = newGroupCode.trim().toUpperCase();
    if (!name || groupOptions[newGroupType].includes(name)) { showToastMsg('Group already exists or empty', 'error'); return; }
    if (code && code.length < 2) { showToastMsg('PDF Code must be 2-5 chars', 'error'); return; }
    if (code && Object.values(groupOptions.codes || {}).includes(code)) { showToastMsg('Code already used', 'error'); return; }
    const newCodes = { ...groupOptions.codes };
    if (code) newCodes[name] = code;
    saveGroups({ ...groupOptions, [newGroupType]: [...groupOptions[newGroupType], name], codes: newCodes }, 'Group added');
    setNewGroup(''); setNewGroupCode(''); setCodeManual(false);
  };
  const removeGroup = async (g, type) => {
    const used = products.some(p => p.group === g);
    if (used) { showToastMsg('Cannot delete — products using this group', 'error'); return; }
    const ok = await confirm({ title: 'Delete Group', message: 'Delete group "' + g + '"? This will affect PDF column order.', confirmText: 'Delete', type: 'danger' });
    if (!ok) return;
    const codes = { ...(groupOptions.codes || {}) }; delete codes[g];
    saveGroups({ ...groupOptions, [type]: groupOptions[type].filter(x => x !== g), codes }, 'Group deleted');
  };
  const moveGroup = (idx, dir, type) => {
    const arr = [...groupOptions[type]];
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= arr.length) return;
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    saveGroups({ ...groupOptions, [type]: arr }, 'Order updated');
  };

  const ProductTable = ({ title, list, startSI }) => (
    <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#222222] overflow-hidden shadow-sm"><div className="px-4 py-3 bg-gray-50 dark:bg-[#1a1a1a] border-b border-gray-200 dark:border-[#333333]">
        <p className="text-sm font-bold text-gray-700 dark:text-gray-200">{title} <span className="text-gray-400 dark:text-gray-500 font-normal">({list.length})</span></p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[580px]">
          <thead>
            <tr className="bg-[#0f172a] text-white">
              <th className="px-2 py-2.5 text-center text-[11px] font-bold w-9">SI</th>
              <th className="px-2 py-2.5 text-left text-[11px] font-bold">Product</th>
              <th className="px-2 py-2.5 text-center text-[11px] font-bold w-16">Group</th>
              <th className="px-2 py-2.5 text-center text-[11px] font-bold w-14">Label</th>
              <th className="px-2 py-2.5 text-center text-[11px] font-bold w-16">Price</th>
              <th className="px-2 py-2.5 text-center text-[11px] font-bold w-12">Unit</th>
              <th className="px-2 py-2.5 text-center text-[11px] font-bold w-16">Action</th>
            </tr>
          </thead>
          <tbody>
            {list.map((p, i) => (
              <tr key={p.id} className={`${i % 2 === 0 ? 'bg-white dark:bg-[#111111]' : 'bg-gray-50/50 dark:bg-[#1a1a1a]/30'} border-b border-gray-100 dark:border-[#222222]`}>
                <td className="px-2 py-2 text-center text-xs text-gray-400">{startSI + i}</td>
                <td className="px-2 py-2 text-xs font-bold text-gray-800 dark:text-white">{p.name}</td>
                <td className="px-2 py-2 text-center text-[10px] font-bold text-royal-600 dark:text-royal-300">{p.group || '—'}{p.type === 'daily' && groupOptions.codes?.[p.group] ? <span className="text-gray-400 font-normal"> ({groupOptions.codes[p.group]})</span> : ''}</td>
                <td className="px-2 py-2 text-center text-[10px] text-gray-500">{p.label || '—'}</td>
                <td className="px-2 py-2 text-center text-xs font-bold text-royal-700 dark:text-royal-300">{p.price > 0 ? formatPrice(p.price) : <span className="text-red-400">—</span>}</td>
                <td className="px-2 py-2 text-center text-[10px] text-gray-500">{p.unit}</td>
                <td className="px-2 py-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => openEdit(p)} className="w-6 h-6 bg-royal-50 dark:bg-royal-900/30 rounded-lg flex items-center justify-center"><Edit3 size={11} className="text-royal-600" /></button>
                    <button onClick={() => handleDelete(p.id)} className="w-6 h-6 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center"><Trash2 size={11} className="text-red-500" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {list.length === 0 && <div className="text-center py-8"><p className="text-sm text-gray-400">No products</p></div>}
    </div>
  );

  if (loading) return <TableSkeleton />;

  return (
    <div className="space-y-5">
      <AnimatePresence>{toast && (<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`fixed top-[4.5rem] left-4 right-4 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:w-auto z-[100] flex items-center justify-center gap-2 px-4 py-3 rounded-2xl shadow-xl backdrop-blur-sm ${toast.type === 'error' ? 'bg-red-50 dark:bg-red-900/80 border border-red-200 dark:border-red-700 text-red-800 dark:text-red-200' : 'bg-mint-50 dark:bg-mint-900/80 border border-mint-200 dark:border-mint-700 text-mint-800 dark:text-mint-200'}`}>{toast.type === 'error' ? <X size={14} strokeWidth={3} /> : <Check size={14} strokeWidth={3} />}<span className="text-sm font-bold">{toast.msg}</span></motion.div>)}</AnimatePresence>

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
            <input type="text" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="text-sm bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-2xl px-3 py-2.5 pl-9 pr-9 outline-none focus:border-royal-300 w-full sm:w-[180px] dark:text-white shadow-sm" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-200 dark:bg-[#222222] rounded-full flex items-center justify-center hover:bg-gray-300"><X size={10} className="text-gray-500" /></button>}
          </div>
          <span className="text-xs font-bold text-gray-400">{products.filter(p => p.type === "daily").length}/20 daily • {products.filter(p => p.type === "seasonal").length} seasonal</span>
        </div>
        <div className="flex items-center gap-2">
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => {
            const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
            const w = pdf.internal.pageSize.getWidth();
            const h = pdf.internal.pageSize.getHeight();
            const m = 12; let y = 0;
            const tableW = w - (m * 2);
            const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
            const allProds = [...dailyProducts, ...seasonalProducts];
            // Header
            pdf.setFillColor(15, 23, 42); pdf.rect(0, 0, w, 24, 'F');
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(14); pdf.setTextColor(255, 255, 255);
            pdf.text('LUCY GARDEN', m, 10);
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.text('Fresh Dairy Supply', m, 16);
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11);
            pdf.text('PRODUCT RATE CARD', w - m, 10, { align: 'right' });
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8);
            pdf.text(`${allProds.length} products | ${today}`, w - m, 16, { align: 'right' });
            y = 28;
            // Disclaimer
            pdf.setFont('helvetica', 'italic'); pdf.setFontSize(7); pdf.setTextColor(150, 100, 0);
            pdf.text('* Prices may change without prior notice.', m, y + 3);
            y += 7;
            // Group-wise sections
            const printGrouped = (title, list, groups, showCode) => {
              if (list.length === 0) return;
              if (y + 12 > h - 12) { pdf.addPage(); y = 10; }
              pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11); pdf.setTextColor(15, 23, 42);
              pdf.text(title, m, y + 4); y += 9;
              const usedGroups = [...new Set(list.map(p => p.group || 'OTHER'))];
              const orderedGroups = (groups || []).filter(g => usedGroups.includes(g));
              usedGroups.forEach(g => { if (!orderedGroups.includes(g)) orderedGroups.push(g); });
              orderedGroups.forEach(g => {
                const gProducts = list.filter(p => (p.group || 'OTHER') === g);
                if (gProducts.length === 0) return;
                if (y + 14 > h - 12) { pdf.addPage(); y = 10; }
                // Group header bar
                pdf.setDrawColor(0); pdf.setLineWidth(0.3);
                pdf.rect(m, y, tableW, 6.5, 'D');
                const gCode = showCode ? groupOptions.codes?.[g] : null;
                const gTitle = gCode ? `${g} (${gCode})` : g;
                pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8.5); pdf.setTextColor(0, 0, 0);
                pdf.text(gTitle, m + 3, y + 4.5);
                pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7); pdf.setTextColor(80, 80, 80);
                pdf.text(`${gProducts.length} items`, m + tableW - 3, y + 4.5, { align: 'right' });
                y += 8;
                // Products in this group
                gProducts.forEach((p, i) => {
                  if (y + 6.5 > h - 12) { pdf.addPage(); y = 10; }
                  if (i % 2 === 0) { pdf.setFillColor(252, 252, 253); pdf.rect(m, y - 1, tableW, 6.5, 'F'); }
                  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.setTextColor(15, 23, 42);
                  drawText(pdf, (p.name || '').slice(0, 35), m + 5, y + 3, { bold: true, size: 8, color: [15, 23, 42] });
                  pdf.setFont('helvetica', 'normal'); pdf.setFontSize(7.5); pdf.setTextColor(100, 116, 139);
                  pdf.text(p.unit ? p.unit.toUpperCase() : '', m + 105, y + 3);
                  pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9.5); pdf.setTextColor(15, 23, 42);
                  pdf.text(p.price > 0 ? `Rs. ${p.price.toLocaleString('en-IN')}` : '-', m + tableW - 3, y + 3, { align: 'right' });
                  y += 6.5;
                });
                y += 3;
              });
            };
            printGrouped('Daily Products', dailyProducts, groupOptions.daily, true);
            printGrouped('Seasonal Products', seasonalProducts, groupOptions.seasonal, false);
            // Footer
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6); pdf.setTextColor(150, 150, 150);
            pdf.text(`Generated: ${today} at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} | Lucy Garden`, w / 2, h - 5, { align: 'center' });
            pdf.save(`LG_RateCard_${today.replace(/[\s,]/g, '')}.pdf`);
          }} className="flex items-center gap-1.5 text-xs font-bold bg-[#0f172a] text-white px-3 py-2.5 rounded-2xl shadow-sm">
            <Printer size={13} /> Rate Card
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowGroups(true)} className="flex items-center gap-1.5 text-xs font-bold bg-gray-700 text-white px-3 py-2.5 rounded-2xl shadow-sm">
            <Layers size={13} /> Groups
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowBulkModal(true)} className="flex items-center gap-1.5 text-xs font-bold bg-amber-500 text-white px-3 py-2.5 rounded-2xl shadow-sm">
            <Percent size={13} /> Bulk Price
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={openAdd} className="flex items-center gap-1.5 text-sm font-bold bg-gradient-to-r from-royal-700 to-royal-600 text-white px-4 py-2.5 rounded-2xl shadow-md shadow-royal-600/20">
            <Plus size={15} /> Add Product
          </motion.button>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProductTable title="Daily Products" list={filtered(dailyProducts)} startSI={1} />
        <ProductTable title="Seasonal Products" list={filtered(seasonalProducts)} startSI={dailyProducts.length + 1} />
      </div>

      {/* Show Hidden Toggle */}
      <div className="flex items-center gap-2">
        <motion.button whileTap={{ scale: 0.95 }} onClick={() => setShowHidden(h => !h)} className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border ${showHidden ? 'bg-gray-800 text-white border-gray-800' : 'bg-white dark:bg-[#111111] text-gray-600 dark:text-gray-300 border-gray-200 dark:border-[#222222]'}`}>
          {showHidden ? <EyeOff size={13} /> : <Eye size={13} />} {showHidden ? 'Hide' : 'Show'} Hidden ({hiddenProducts.length})
        </motion.button>
      </div>

      {showHidden && hiddenProducts.length > 0 && (
        <div className="bg-white dark:bg-[#111111] rounded-2xl border border-red-200 dark:border-red-900 overflow-hidden shadow-sm">
          <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
            <p className="text-sm font-bold text-red-700 dark:text-red-300">Hidden Products <span className="text-red-400 font-normal">({hiddenProducts.length})</span></p>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {hiddenProducts.map(p => (
              <div key={p.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-bold text-gray-600 dark:text-gray-300">{p.name}</p>
                  <p className="text-[10px] text-gray-400">{p.type} • {p.group || 'No group'} • {formatPrice(p.price)}</p>
                </div>
                <motion.button whileTap={{ scale: 0.95 }} onClick={() => handleRestore(p.id)} className="flex items-center gap-1 text-xs font-bold text-green-700 bg-green-50 dark:bg-green-900/30 dark:text-green-300 px-3 py-1.5 rounded-lg">
                  <RotateCcw size={11} /> Restore
                </motion.button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => { setShowForm(false); setConfirmPrice(false); }}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }} className="bg-white dark:bg-[#111111] rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-extrabold text-gray-800 dark:text-white text-lg">{editProduct ? 'Edit Product' : 'Add Product'}</h3>
                <button onClick={() => { setShowForm(false); setConfirmPrice(false); }} className="w-8 h-8 bg-gray-100 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center text-gray-400"><X size={14} /></button>
              </div>

              {confirmPrice ? (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
                    <p className="text-sm font-bold text-amber-800">Confirm Update</p>
                    <p className="text-lg font-black text-gray-800 mt-2">{editProduct.name}</p>
                    <p className="text-sm text-gray-500 mt-1">Price: {formatPrice(editProduct.price)} → {formatPrice(Number(form.price) || 0)}</p>
                    {form.group && <p className="text-xs text-gray-500 mt-1">Group: {form.group} | Label: {form.label}</p>}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setConfirmPrice(false)} className="flex-1 py-3 rounded-xl font-bold text-sm text-gray-600 bg-gray-100">Cancel</button>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-royal-700 shadow-md disabled:opacity-50">{saving ? "Saving..." : "Confirm"}</motion.button>
                  </div>
                </div>
              ) : editProduct ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1.5 block">Product Name</label>
                    <input className="w-full py-2.5 px-3 text-sm font-bold border border-gray-200 dark:border-[#333333] rounded-xl bg-gray-100 dark:bg-[#222222] dark:text-gray-300 cursor-not-allowed" value={form.name} disabled />
                    <p className="text-[10px] font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-2 py-1 mt-1.5"><Info size={12} className="inline text-blue-500" /> Name cannot be changed. To rename: hide this product and add new one.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1.5 block">Price (₹)</label>
                      <input className="w-full py-2.5 px-3 text-sm font-bold border border-gray-200 dark:border-[#333333] rounded-xl focus:outline-none focus:border-royal-300 dark:bg-[#1a1a1a] dark:text-white" type="number" placeholder="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1.5 block">Unit</label>
                      <select className="w-full py-2.5 px-3 text-sm border border-gray-200 dark:border-[#333333] rounded-xl focus:outline-none focus:border-royal-300 bg-white dark:bg-[#1a1a1a] dark:text-white" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                        <option value="pkt">PKT (Packet / Pouch)</option>
                        <option value="jar">JAR (Jar)</option>
                        <option value="bkt">BKT (Bucket)</option>
                        <option value="tin">TIN (Tin)</option>
                        <option value="pcs">PCS (Piece)</option>
                        <option value="kg">KG (Kilogram)</option>
                        <option value="ltr">LTR (Litre)</option>
                        <option value="box">BOX (Box / Carton)</option>
                        <option value="cup">CUP (Cup)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1.5 block">Type</label>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setForm(f => ({ ...f, type: 'daily', group: '' }))} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${form.type === 'daily' ? 'bg-royal-700 text-white' : 'bg-gray-50 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#333333]'}`}>Daily</button>
                      <button type="button" onClick={() => setForm(f => ({ ...f, type: 'seasonal', group: '' }))} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${form.type === 'seasonal' ? 'bg-amber-500 text-white' : 'bg-gray-50 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#333333]'}`}>Seasonal</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1.5 block">Group</label>
                      <select className="w-full py-2.5 px-3 text-sm border border-gray-200 dark:border-[#333333] rounded-xl focus:outline-none focus:border-royal-300 bg-white dark:bg-[#1a1a1a] dark:text-white" value={form.group} onChange={e => { const g = e.target.value; const matchType = groupOptions.daily.includes(g) ? 'daily' : groupOptions.seasonal.includes(g) ? 'seasonal' : form.type; setForm(f => ({ ...f, group: g, type: matchType })); }}>
                        <option value="">None</option>
                        {(groupOptions[form.type] || []).map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1.5 block">Label</label>
                      <input className="w-full py-2.5 px-3 text-sm border border-gray-200 dark:border-[#333333] rounded-xl focus:outline-none focus:border-royal-300 dark:bg-[#1a1a1a] dark:text-white" placeholder="e.g. 1L, Half" maxLength={4} value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
                      <p className={"text-[10px] mt-1 " + (form.label.length >= 4 ? "text-red-500 font-bold" : "text-gray-400")}>PDF column header • {form.label.length}/4</p>
                    </div>
                  </div>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving} className="w-full bg-royal-700 text-white font-bold py-3.5 rounded-xl shadow-md text-sm disabled:opacity-50">{saving ? "Saving..." : "Update Product"}</motion.button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1.5 block">Product Name *</label>
                    <input className="w-full py-2.5 px-3 text-sm border border-gray-200 dark:border-[#333333] rounded-xl focus:outline-none focus:border-royal-300 dark:bg-[#1a1a1a] dark:text-white" placeholder="e.g. Dahi 5kg, Ghee 1kg, TM Half" value={form.name} onChange={e => { const v = e.target.value; setForm(f => ({ ...f, name: v.charAt(0).toUpperCase() + v.slice(1) })); }} />
                    
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1.5 block">Price (₹)</label>
                      <input className="w-full py-2.5 px-3 text-sm border border-gray-200 dark:border-[#333333] rounded-xl focus:outline-none focus:border-royal-300 dark:bg-[#1a1a1a] dark:text-white" type="number" placeholder="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1.5 block">Unit</label>
                      <select className="w-full py-2.5 px-3 text-sm border border-gray-200 dark:border-[#333333] rounded-xl focus:outline-none focus:border-royal-300 bg-white dark:bg-[#1a1a1a] dark:text-white" value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}>
                        <option value="pkt">PKT (Packet / Pouch)</option>
                        <option value="jar">JAR (Jar)</option>
                        <option value="bkt">BKT (Bucket)</option>
                        <option value="tin">TIN (Tin)</option>
                        <option value="pcs">PCS (Piece)</option>
                        <option value="kg">KG (Kilogram)</option>
                        <option value="ltr">LTR (Litre)</option>
                        <option value="box">BOX (Box / Carton)</option>
                        <option value="cup">CUP (Cup)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1.5 block">Type</label>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setForm(f => ({ ...f, type: 'daily', group: '' }))} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${form.type === 'daily' ? 'bg-royal-700 text-white' : 'bg-gray-50 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#333333]'}`}>Daily</button>
                      <button type="button" onClick={() => setForm(f => ({ ...f, type: 'seasonal', group: '' }))} className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${form.type === 'seasonal' ? 'bg-amber-500 text-white' : 'bg-gray-50 dark:bg-[#1a1a1a] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#333333]'}`}>Seasonal</button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1.5 block">Group</label>
                      <select className="w-full py-2.5 px-3 text-sm border border-gray-200 dark:border-[#333333] rounded-xl focus:outline-none focus:border-royal-300 bg-white dark:bg-[#1a1a1a] dark:text-white" value={form.group} onChange={e => { const g = e.target.value; const matchType = groupOptions.daily.includes(g) ? 'daily' : groupOptions.seasonal.includes(g) ? 'seasonal' : form.type; setForm(f => ({ ...f, group: g, type: matchType })); }}>
                        <option value="">Select Group</option>
                        {(groupOptions[form.type] || []).map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1.5 block">Label</label>
                      <input className="w-full py-2.5 px-3 text-sm border border-gray-200 dark:border-[#333333] rounded-xl focus:outline-none focus:border-royal-300 dark:bg-[#1a1a1a] dark:text-white" placeholder="e.g. 1L, Half" maxLength={4} value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))} />
                      <p className={"text-[10px] mt-1 " + (form.label.length >= 4 ? "text-red-500 font-bold" : "text-gray-400")}>PDF column header • {form.label.length}/4</p>
                    </div>
                  </div>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={handleSave} disabled={saving} className="w-full bg-royal-700 text-white font-bold py-3.5 rounded-xl shadow-md text-sm disabled:opacity-50">{saving ? "Adding..." : "Add Product"}</motion.button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


      {/* Manage Groups Modal */}
      <AnimatePresence>
        {showGroups && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowGroups(false)}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }} className="bg-white dark:bg-[#111111] rounded-3xl w-full max-w-sm shadow-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
              <div className="p-6 pb-3 shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-extrabold text-gray-800 dark:text-white text-lg">Manage Groups</h3>
                  <button onClick={() => setShowGroups(false)} className="w-8 h-8 bg-gray-100 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center text-gray-400"><X size={14} /></button>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl px-3 py-2.5">
                  <p className="text-xs font-medium text-blue-700 dark:text-blue-300"><Info size={13} className="inline text-blue-500 mr-1" />Groups = product categories. Order here = column order in PDF.</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">Tap the code badge on any group to set/edit its PDF short name.</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-6 pb-3">
              <div className="space-y-2 mb-4">
                {['daily', 'seasonal'].map(type => (
                  <div key={type} className="mb-4">
                    <div className={"px-3 py-2 rounded-xl mb-2 " + (type === 'daily' ? 'bg-[#0f172a] text-white' : 'bg-amber-500 text-white')}><p className="text-[11px] font-bold uppercase tracking-wider">{type === 'daily' ? 'Daily Groups' : 'Seasonal Groups'}</p></div>
                    <div className="space-y-1.5">
                      {(groupOptions[type] || []).map((g, i) => (
                        <div key={g} className="flex items-center gap-2 bg-gray-50 dark:bg-[#1a1a1a] rounded-xl px-3 py-2.5">
                          <span className="text-[10px] font-mono text-gray-400 w-5">{i+1}</span><span className="flex-1 text-sm font-bold text-gray-800 dark:text-white truncate">{g}</span>
                          {type === 'daily' && (editingCode === g ? (
                            <input autoFocus value={editCodeVal} onChange={e => setEditCodeVal(e.target.value.toUpperCase())} onBlur={() => saveGroupCode(g)} onKeyDown={e => { if (e.key === 'Enter') saveGroupCode(g); if (e.key === 'Escape') setEditingCode(null); }} maxLength={5} className="w-12 text-[10px] text-center font-bold border border-royal-400 rounded px-1 py-0.5 bg-white dark:bg-[#222222] dark:text-white outline-none" />
                          ) : (
                            <button onClick={() => { setEditingCode(g); setEditCodeVal(groupOptions.codes?.[g] || ''); }} className={"text-[9px] px-1.5 py-0.5 rounded font-bold " + (groupOptions.codes?.[g] ? 'bg-royal-100 dark:bg-royal-900/30 text-royal-600 dark:text-royal-300' : 'bg-gray-200 dark:bg-[#222222] text-gray-400 dark:text-gray-400 border border-dashed border-gray-300 dark:border-[#333333]')}>{groupOptions.codes?.[g] || '+'}</button>
                          ))}
                          <span className="text-[10px] text-gray-400">{products.filter(p => p.group === g).length}</span>
                          <button onClick={() => moveGroup(i, -1, type)} disabled={i === 0 || groupSaving} className="w-6 h-6 bg-white dark:bg-[#222222] rounded-lg flex items-center justify-center disabled:opacity-30"><ArrowUp size={11} className="text-gray-600 dark:text-gray-300" /></button>
                          <button onClick={() => moveGroup(i, 1, type)} disabled={i === (groupOptions[type] || []).length - 1 || groupSaving} className="w-6 h-6 bg-white dark:bg-[#222222] rounded-lg flex items-center justify-center disabled:opacity-30"><ArrowDown size={11} className="text-gray-600 dark:text-gray-300" /></button>
                          <button onClick={() => removeGroup(g, type)} disabled={groupSaving} className="w-6 h-6 bg-red-50 dark:bg-red-900/30 rounded-lg flex items-center justify-center"><Trash2 size={11} className="text-red-500" /></button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              </div>
              <div className="p-6 pt-3 border-t border-gray-100 dark:border-[#222222] shrink-0">
                <p className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-1">Add New Group</p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-2.5">Name = full name (app mein dikhega) • Code = short name (PDF header, optional)</p>
                <div className="flex gap-2 mb-2">
                  <button onClick={() => setNewGroupType('daily')} className={"flex-1 py-2 rounded-lg text-xs font-bold border " + (newGroupType === 'daily' ? 'bg-royal-600 text-white border-royal-600' : 'bg-white dark:bg-[#1a1a1a] text-gray-500 border-gray-200 dark:border-[#333333]')}>Daily</button>
                  <button onClick={() => setNewGroupType('seasonal')} className={"flex-1 py-2 rounded-lg text-xs font-bold border " + (newGroupType === 'seasonal' ? 'bg-amber-500 text-white border-amber-500' : 'bg-white dark:bg-[#1a1a1a] text-gray-500 border-gray-200 dark:border-[#333333]')}>Seasonal</button>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <input value={newGroup} onChange={e => { const v = e.target.value.toUpperCase(); setNewGroup(v); if (!codeManual) setNewGroupCode(suggestCode(v)); }} placeholder="Group name" maxLength={20} className="w-full py-2.5 px-3 text-sm border border-gray-200 dark:border-[#333333] rounded-xl bg-white dark:bg-[#1a1a1a] dark:text-white outline-none focus:border-royal-400" onKeyDown={e => e.key === 'Enter' && addGroup()} />
                    <p className={"text-[10px] mt-0.5 " + (newGroup.length >= 20 ? "text-red-500 font-bold" : "text-gray-400")}>{newGroup.length}/20</p>
                  </div>
                  {newGroupType === 'daily' && <div className="w-[70px]">
                    <input value={newGroupCode} onChange={e => { setNewGroupCode(e.target.value.toUpperCase()); setCodeManual(true); }} placeholder="Code" maxLength={5} className="w-full py-2.5 px-2 text-sm text-center border border-gray-200 dark:border-[#333333] rounded-xl bg-white dark:bg-[#1a1a1a] dark:text-white outline-none focus:border-royal-400" onKeyDown={e => e.key === 'Enter' && addGroup()} />
                    <p className={"text-[10px] mt-0.5 text-center " + (newGroupCode.length >= 5 ? "text-red-500 font-bold" : "text-gray-400")}>{newGroupCode.length}/5</p>
                  </div>}
                  <motion.button whileTap={{ scale: 0.95 }} onClick={addGroup} disabled={groupSaving} className="px-4 py-2.5 bg-royal-600 text-white text-xs font-bold rounded-xl disabled:opacity-50 self-start">Add</motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk Price Modal */}
      <AnimatePresence>
        {showBulkModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setShowBulkModal(false)}>
            <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }} className="bg-white dark:bg-[#111111] rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-extrabold text-gray-800 dark:text-white text-lg">Bulk Price Update</h3>
                <button onClick={() => setShowBulkModal(false)} className="w-8 h-8 bg-gray-100 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center text-gray-400"><X size={14} /></button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1.5 block">Apply to Group</label>
                  <select className="w-full py-2.5 px-3 text-sm border border-gray-200 dark:border-[#333333] rounded-xl focus:outline-none focus:border-royal-300 bg-white dark:bg-[#1a1a1a] dark:text-white" value={bulkGroup} onChange={e => setBulkGroup(e.target.value)}>
                    <option value="ALL">All Products</option>
                    {groupOptions.daily && <optgroup label="Daily">{groupOptions.daily.map(g => <option key={g} value={g}>{g}</option>)}</optgroup>}
                    {groupOptions.seasonal && <optgroup label="Seasonal">{groupOptions.seasonal.map(g => <option key={g} value={g}>{g}</option>)}</optgroup>}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1.5 block">Percentage Change (%)</label>
                  <input type="number" placeholder="e.g. 5 for +5%, -3 for -3%" value={bulkPercent} onChange={e => setBulkPercent(e.target.value)} className="w-full py-3 px-4 text-lg font-bold text-center border border-gray-200 dark:border-[#333333] rounded-xl focus:outline-none focus:border-royal-300 dark:bg-[#1a1a1a] dark:text-white" />
                  <p className="text-[10px] font-medium text-amber-600 dark:text-amber-400 mt-1 text-center"><AlertTriangle size={12} className="inline text-amber-500" /> Positive = increase, Negative = decrease</p>
                </div>
                {bulkConfirm && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-3 text-center">
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-300">Confirm: {Number(bulkPercent) > 0 ? '+' : ''}{bulkPercent}% for {bulkGroup === 'ALL' ? 'all products' : bulkGroup}</p>
                    <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1">{products.filter(p => bulkGroup === 'ALL' || p.group === bulkGroup).length} products will be affected</p>
                  </div>
                )}
                <motion.button whileTap={{ scale: 0.97 }} onClick={handleBulkUpdate} disabled={!bulkPercent || bulkProcessing} className={"w-full font-bold py-3.5 rounded-xl shadow-md text-sm disabled:opacity-50 " + (bulkConfirm ? 'bg-red-500 text-white' : 'bg-amber-500 text-white')}>
                  {bulkProcessing ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
                      Updating {bulkProgress.done}/{bulkProgress.total}...
                    </span>
                  ) : bulkConfirm ? 'Yes, Update Now' : 'Update Prices'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
