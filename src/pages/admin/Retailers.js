import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Phone, MapPin, Store, X, Check, AlertCircle, User, Plus, UserPlus, TrendingUp, Trash2, KeyRound, ShieldOff, Printer, AlertTriangle, Info, Ban, Edit3, Settings2 } from 'lucide-react';
import { db, collection, getDocs, doc, getDoc, setDoc, deleteDoc, updateDoc, query, where } from '../../services/firebase';
import { formatPrice } from '../../utils/price';
import { CardsSkeleton } from '../../components/LoadingSkeleton';
import { useConfirm } from '../../components/ConfirmModal';

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 2500); return () => clearTimeout(t); }, [onClose]);
  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className={`fixed top-[4.5rem] left-4 right-4 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:w-auto z-[100] flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl shadow-xl border backdrop-blur-sm ${
        type === 'success' ? 'bg-mint-50/95 border-mint-200 text-mint-800 dark:bg-mint-900/90 dark:border-mint-700 dark:text-mint-200' : 'bg-red-50/95 border-red-200 text-red-700 dark:bg-red-900/90 dark:border-red-700 dark:text-red-200'
      }`}>
      {type === 'success' ? <Check size={16} strokeWidth={3} /> : <AlertCircle size={16} />}
      <span className="text-[13px] font-semibold">{message}</span>
    </motion.div>
  );
}

export default function Retailers() {
  const parseDeviceName = (ua) => {
    if (!ua) return '';
    if (ua.includes('iPhone')) return 'iPhone';
    if (ua.includes('iPad')) return 'iPad';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('Windows')) return 'Windows PC';
    if (ua.includes('Mac')) return 'Mac';
    if (ua.includes('Linux')) return 'Linux';
    return '';
  };
  const [retailers, setRetailers] = useState([]);
  const [balances, setBalances] = useState({});
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState('All');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [defaultPin, setDefaultPin] = useState('1234');
  const [selectedRetailer, setSelectedRetailer] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: '', phone: '', shop: '', area: '', address: '', pin: '', deliveryOrder: '' });
  const [toast, setToast] = useState(null);
  const [orderHistory, setOrderHistory] = useState([]);
  const confirm = useConfirm();
  const [saving, setSaving] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [confirmStep, setConfirmStep] = useState(false);
  const [performanceScore, setPerformanceScore] = useState(null);
  // Area management
  const [showAreaModal, setShowAreaModal] = useState(false);
  const [newArea, setNewArea] = useState('');
  const [editArea, setEditArea] = useState(null);
  const [editAreaValue, setEditAreaValue] = useState('');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'retailer')));
      setRetailers(snap.docs.map(d => ({ phone: d.id, ...d.data() })));
      const areasDoc = await getDoc(doc(db, 'settings', 'areas'));
      if (areasDoc.exists()) setAreas(areasDoc.data().list || []);
      const appDoc = await getDoc(doc(db, 'settings', 'app'));
      if (appDoc.exists() && appDoc.data().defaultPin) setDefaultPin(appDoc.data().defaultPin);
      // Calculate balances from ledger (source of truth) — includes opening balance
      const allLedgerSnap = await getDocs(collection(db, 'ledger'));
      const balMap = {};
      allLedgerSnap.docs.forEach(d => {
        const e = d.data();
        const rid = e.retailerId;
        if (!rid) return;
        if (!balMap[rid]) balMap[rid] = 0;
        if (e.type === 'debit' || e.type === 'opening') balMap[rid] += (e.amount || 0);
        else balMap[rid] -= (e.amount || 0);
      });
      setBalances(balMap);
    } catch (err) {}
    setLoading(false);
  };

  const filtered = retailers.filter(r => {
    const matchArea = selectedArea === 'All' || r.area === selectedArea;
    const matchSearch = !search || r.name?.toLowerCase().includes(search.toLowerCase()) || r.phone?.includes(search) || r.area?.toLowerCase().includes(search.toLowerCase()) || r.shop?.toLowerCase().includes(search.toLowerCase());
    return matchArea && matchSearch;
  }).sort((a, b) => (a.area || '').localeCompare(b.area || '') || (a.deliveryOrder || 999) - (b.deliveryOrder || 999) || (a.name || '').localeCompare(b.name || ''));

  const openDetail = async (r) => {
    setSelectedRetailer(r); setEditMode(false); setEditForm({ ...r });
    document.body.style.overflow = 'hidden';
    try {
      const snap = await getDocs(query(collection(db, 'orders'), where('phone', '==', r.phone)));
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const allOrders = snap.docs.map(d => d.data());
      const orders = allOrders.filter(o => new Date(o.createdAt) >= thirtyDaysAgo);
      orders.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setOrderHistory(orders);

      // Calculate performance score
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      const recent = allOrders.filter(o => new Date(o.createdAt) >= ninetyDaysAgo);
      const totalOrders = recent.length;
      const cancelled = recent.filter(o => o.status === 'Cancelled').length;
      const delivered = recent.filter(o => o.status === 'Delivered').length;
      const returned = recent.filter(o => o.status === 'Returned').length;

      // Frequency score (max 40) — based on orders per month
      const ordersPerMonth = totalOrders / 3;
      const freqScore = Math.min(40, Math.round((ordersPerMonth / 20) * 40));

      // Reliability score (max 35) — low cancellation & return rate
      const badRate = totalOrders > 0 ? (cancelled + returned) / totalOrders : 0;
      const reliabilityScore = Math.round((1 - badRate) * 35);

      // Payment score (max 25) — based on due amount
      const due = balances[r.phone] || 0;
      const payScore = due <= 0 ? 25 : due < 2000 ? 20 : due < 5000 ? 12 : due < 10000 ? 5 : 0;

      const total = freqScore + reliabilityScore + payScore;
      setPerformanceScore({ total, freq: freqScore, reliability: reliabilityScore, payment: payScore, ordersPerMonth: ordersPerMonth.toFixed(1), cancelRate: totalOrders > 0 ? Math.round(badRate * 100) : 0, totalOrders });
    } catch (err) { setOrderHistory([]); setPerformanceScore(null); }
  };

  const saveEdit = async () => {
    if (saving) return;
    if (!editForm.name?.trim()) { showToast('Name is required', 'error'); return; }
    if (!editForm.phone || !/^\d{10}$/.test(editForm.phone)) { showToast('Phone must be 10 digits', 'error'); return; }
    if (!editForm.area) { showToast('Area is required', 'error'); return; }
    if (editForm.pin && editForm.pin.length !== 4) { showToast('PIN must be 4 digits', 'error'); return; }
    const hasPhoneChange = editForm.phone !== selectedRetailer.phone;
    const hasNameChange = editForm.name?.trim() !== selectedRetailer.name;
    if ((hasPhoneChange || hasNameChange) && !confirmStep) { setConfirmStep(true); return; }
    setConfirmStep(false);
    setSaving('save');
    try {
      if (hasPhoneChange) {
        const exists = await getDoc(doc(db, 'users', editForm.phone));
        if (exists.exists()) { showToast('This phone already registered!', 'error'); setSaving(false); return; }
        const oldPhone = selectedRetailer.phone;
        const newPhone = editForm.phone;
        await setDoc(doc(db, 'users', newPhone), { ...editForm, role: 'retailer' });
        const balDoc = await getDoc(doc(db, 'retailer_balances', oldPhone));
        if (balDoc.exists()) {
          await setDoc(doc(db, 'retailer_balances', newPhone), balDoc.data());
          await deleteDoc(doc(db, 'retailer_balances', oldPhone));
        }
        const ordersSnap = await getDocs(query(collection(db, 'orders'), where('phone', '==', oldPhone)));
        for (const o of ordersSnap.docs) { await updateDoc(doc(db, 'orders', o.id), { phone: newPhone, retailer: editForm.name }); }
        const ledgerSnap = await getDocs(query(collection(db, 'ledger'), where('retailerId', '==', oldPhone)));
        for (const l of ledgerSnap.docs) { await updateDoc(doc(db, 'ledger', l.id), { retailerId: newPhone, retailer: editForm.name }); }
        const historySnap = await getDocs(query(collection(db, 'order_history'), where('phone', '==', oldPhone))).catch(() => ({ docs: [] }));
        for (const h of historySnap.docs) { await updateDoc(doc(db, 'order_history', h.id), { phone: newPhone, retailer: editForm.name }); }
        const ticketSnap = await getDocs(query(collection(db, 'support_tickets'), where('phone', '==', oldPhone))).catch(() => ({ docs: [] }));
        for (const t of ticketSnap.docs) { await updateDoc(doc(db, 'support_tickets', t.id), { phone: newPhone }); }
        await deleteDoc(doc(db, 'users', oldPhone));
      } else {
        await setDoc(doc(db, 'users', editForm.phone), { ...editForm, role: 'retailer' }, { merge: true });
        if (editForm.name !== selectedRetailer.name) {
          const ordersSnap = await getDocs(query(collection(db, 'orders'), where('phone', '==', editForm.phone)));
          for (const o of ordersSnap.docs) { await updateDoc(doc(db, 'orders', o.id), { retailer: editForm.name }); }
          const ledgerSnap = await getDocs(query(collection(db, 'ledger'), where('retailerId', '==', editForm.phone)));
          for (const l of ledgerSnap.docs) { await updateDoc(doc(db, 'ledger', l.id), { retailer: editForm.name }); }
        }
      }
      setSelectedRetailer(null); setEditMode(false);
      document.body.style.overflow = '';
      showToast('Retailer updated successfully'); fetchData();
    } catch (err) {
      console.error('Save error:', err);
      showToast('Failed to save changes, try again', 'error');
    }
    setSaving(false);
  };

  const deleteRetailer = async (phone, name) => {
    const ok = await confirm({ title: 'Delete Retailer', message: `Permanently delete "${name}" (${phone})? This cannot be undone.`, confirmText: 'Delete', type: 'danger' });
    if (!ok) return;
    setSaving('delete');
    try {
      await deleteDoc(doc(db, 'users', phone));
      setSelectedRetailer(null);
      document.body.style.overflow = '';
      showToast('Retailer deleted successfully'); fetchData();
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Failed to delete retailer', 'error');
    }
    setSaving(false);
  };

  const addRetailer = async () => {
    if (!addForm.name?.trim()) { showToast('Name is required', 'error'); return; }
    if (!addForm.phone || !/^\d{10}$/.test(addForm.phone)) { showToast('Phone must be exactly 10 digits', 'error'); return; }
    if (!addForm.area) { showToast('Area is required', 'error'); return; }
    if (addForm.pin && addForm.pin.length !== 4) { showToast('PIN must be 4 digits', 'error'); return; }
    setSaving('add');
    try {
      const exists = await getDoc(doc(db, 'users', addForm.phone));
      if (exists.exists()) { showToast('This phone number is already registered!', 'error'); setSaving(false); return; }
      await setDoc(doc(db, 'users', addForm.phone), {
        name: addForm.name.trim(), phone: addForm.phone, shop: addForm.shop?.trim() || '',
        area: addForm.area, address: addForm.address?.trim() || '', pin: addForm.pin || defaultPin,
        deliveryOrder: addForm.deliveryOrder ? parseInt(addForm.deliveryOrder) : null,
        role: 'retailer', createdAt: new Date().toISOString(),
      });
      setShowAdd(false); setAddForm({ name: '', phone: '', shop: '', area: '', address: '', pin: '', deliveryOrder: '' });
      document.body.style.overflow = '';
      showToast('Retailer added successfully'); fetchData();
    } catch (err) {
      console.error('Add error:', err);
      showToast('Failed to add retailer, try again', 'error');
    }
    setSaving(false);
  };

  // Area management functions
  const addAreaFn = async () => {
    if (!newArea.trim()) return;
    if (areas.some(a => a.toLowerCase() === newArea.trim().toLowerCase())) { showToast('Area already exists', 'error'); return; }
    setSaving('area');
    try {
      const updated = [...areas, newArea.trim()];
      await updateDoc(doc(db, 'settings', 'areas'), { list: updated, updatedAt: new Date().toISOString() });
      setAreas(updated); setNewArea(''); showToast('Area added');
    } catch (err) { showToast('Failed to add area', 'error'); }
    setSaving(false);
  };

  const removeAreaFn = async (area) => {
    const count = retailers.filter(r => r.area === area).length;
    const msg = count > 0 ? `Remove "${area}"? ${count} retailer(s) will become unassigned.` : `Remove "${area}"?`;
    const ok = await confirm({ title: 'Remove Area', message: msg, confirmText: 'Remove', type: 'danger' });
    if (!ok) return;
    setSaving('area');
    try {
      const updated = areas.filter(a => a !== area);
      await updateDoc(doc(db, 'settings', 'areas'), { list: updated, updatedAt: new Date().toISOString() });
      setAreas(updated);
      if (selectedArea === area) setSelectedArea('All');
      showToast('Area removed');
    } catch (err) { showToast('Failed to remove area', 'error'); }
    setSaving(false);
  };

  const renameAreaFn = async () => {
    if (!editAreaValue.trim() || editAreaValue.trim() === editArea) { setEditArea(null); return; }
    if (areas.some(a => a.toLowerCase() === editAreaValue.trim().toLowerCase() && a !== editArea)) { showToast('Area name already exists', 'error'); return; }
    setSaving('area');
    try {
      const updated = areas.map(a => a === editArea ? editAreaValue.trim() : a);
      await updateDoc(doc(db, 'settings', 'areas'), { list: updated, updatedAt: new Date().toISOString() });
      const affected = retailers.filter(r => r.area === editArea);
      for (const r of affected) { await updateDoc(doc(db, 'users', r.phone), { area: editAreaValue.trim() }); }
      setAreas(updated); setEditArea(null);
      if (selectedArea === editArea) setSelectedArea(editAreaValue.trim());
      showToast(`Area renamed (${affected.length} retailers updated)`); fetchData();
    } catch (err) { showToast('Failed to rename area', 'error'); }
    setSaving(false);
  };

  const showToast = (message, type = 'success') => setToast({ message, type });

  if (loading) return <CardsSkeleton />;

  return (
    <div className="space-y-4 max-w-[calc(100vw-2rem)] lg:max-w-none">
      <AnimatePresence>{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>

      {/* Area Filter Tabs */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 min-w-0">
        <div className="flex-1 min-w-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 pb-1">
            {['All', ...areas].map(area => {
              const count = area === 'All' ? retailers.length : retailers.filter(r => r.area === area).length;
              return (
                <button key={area} onClick={() => setSelectedArea(area)}
                  className={`shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${selectedArea === area ? 'bg-royal-700 text-white shadow-md' : 'bg-white dark:bg-[#111111] text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-[#222222] hover:border-royal-300'}`}>
                  {area} <span className={`ml-1 text-[10px] ${selectedArea === area ? 'text-white/70' : 'text-gray-400'}`}>({count})</span>
                </button>
              );
            })}
          </div>
        </div>
        <motion.button whileTap={{ scale: 0.93 }} onClick={() => { setShowAreaModal(true); document.body.style.overflow = 'hidden'; }}
          className="shrink-0 w-10 h-10 bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-xl flex items-center justify-center hover:border-royal-300 transition-colors">
          <Settings2 size={16} className="text-gray-500 dark:text-gray-400" />
        </motion.button>
      </motion.div>

      {/* Search + Add */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="flex items-center gap-2">
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input className="w-full pl-10 pr-9 py-3 text-[16px] bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-2xl focus:outline-none focus:border-royal-300 focus:ring-2 focus:ring-royal-100 transition-all dark:text-white shadow-sm" placeholder="Search name, phone, shop..." value={search} onChange={e => setSearch(e.target.value)} />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-200 dark:bg-[#222222] rounded-full flex items-center justify-center hover:bg-gray-300"><X size={10} className="text-gray-500" /></button>}
        </div>
        <motion.button whileTap={{ scale: 0.93 }} onClick={async () => {
          const { jsPDF } = await import('jspdf');
          const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
          const w = pdf.internal.pageSize.getWidth();
          const h = pdf.internal.pageSize.getHeight();
          const m = 12; let y = 0;
          const tableW = w - (m * 2);
          const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
          pdf.setFillColor(15, 23, 42); pdf.rect(0, 0, w, 24, 'F');
          pdf.setFont('helvetica', 'bold'); pdf.setFontSize(14); pdf.setTextColor(255, 255, 255);
          pdf.text('LUCY GARDEN', m, 10);
          pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.text('Fresh Dairy Supply', m, 16);
          pdf.setFont('helvetica', 'bold'); pdf.setFontSize(11);
          pdf.text('RETAILER DIRECTORY', w - m, 10, { align: 'right' });
          pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8);
          pdf.text(`Total: ${retailers.length} retailers | ${today}`, w - m, 16, { align: 'right' });
          y = 30;
          const cols = [10, 45, 30, 40, 40];
          pdf.setFillColor(15, 23, 42); pdf.roundedRect(m, y, tableW, 8, 1, 1, 'F');
          pdf.setFont('helvetica', 'bold'); pdf.setFontSize(8); pdf.setTextColor(255, 255, 255);
          let cx = m;
          ['#', 'Name', 'Phone', 'Shop', 'Area'].forEach((hdr, i) => { pdf.text(hdr, cx + 3, y + 5.5); cx += cols[i]; });
          y += 10;
          const sortedRetailers = [...retailers].sort((a, b) => (a.area || '').localeCompare(b.area || '') || (a.deliveryOrder || 999) - (b.deliveryOrder || 999) || (a.name || '').localeCompare(b.name || ''));
          sortedRetailers.forEach((r, i) => {
            if (y + 7 > h - 15) {
              pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6); pdf.setTextColor(150, 150, 150);
              pdf.text(`Page ${pdf.getNumberOfPages()}`, w - m, h - 5, { align: 'right' });
              pdf.addPage(); y = 10;
            }
            if (i % 2 === 0) { pdf.setFillColor(248, 250, 252); pdf.rect(m, y - 1.5, tableW, 7, 'F'); }
            pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.setTextColor(71, 85, 105);
            cx = m;
            pdf.text(`${i + 1}`, cx + 3, y + 3.5); cx += cols[0];
            pdf.setFont('helvetica', 'bold'); pdf.setTextColor(15, 23, 42);
            pdf.text((r.name || '-').slice(0, 22), cx + 3, y + 3.5); cx += cols[1];
            pdf.setFont('helvetica', 'normal'); pdf.setTextColor(71, 85, 105);
            pdf.text(r.phone || '', cx + 3, y + 3.5); cx += cols[2];
            pdf.text((r.shop || '-').slice(0, 20), cx + 3, y + 3.5); cx += cols[3];
            pdf.setFont('helvetica', 'bold'); pdf.setFontSize(7); pdf.setTextColor(100, 116, 139);
            pdf.text(r.area || '-', cx + 3, y + 3.5);
            y += 7;
          });
          pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6); pdf.setTextColor(150, 150, 150);
          pdf.text(`Generated: ${today} at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} | Lucy Garden`, w / 2, h - 5, { align: 'center' });
          pdf.save(`LG_Retailers_${today.replace(/[\s,]/g, '')}.pdf`);
        }} className="flex items-center gap-1.5 text-sm font-bold bg-[#0f172a] text-white px-3 py-3 rounded-2xl shadow-sm shrink-0">
          <Printer size={14} />
        </motion.button>
        <motion.button whileTap={{ scale: 0.93 }} onClick={() => { setShowAdd(true); document.body.style.overflow = 'hidden'; }}
          className="flex items-center gap-1.5 text-sm font-bold bg-gradient-to-r from-royal-700 via-royal-600 to-mint-700 text-white px-4 py-3 rounded-2xl shadow-lg shadow-royal-600/20 shrink-0">
          <Plus size={15} />
        </motion.button>
      </motion.div>

      {/* Count badge */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-gray-400">{filtered.length} of {retailers.length} retailers</span>
      </div>

      {/* Grid */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.map((r, i) => {
          const bal = balances[r.phone] || 0;
          return (
            <motion.div key={r.phone} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.015 * i }}
              onClick={() => openDetail(r)}
              className="group bg-white dark:bg-[#111111] rounded-2xl p-4 border border-gray-100 dark:border-[#222222] cursor-pointer hover:border-royal-200 dark:hover:border-royal-800 hover:shadow-xl hover:shadow-royal-100/50 dark:hover:shadow-none hover:scale-[1.01] active:scale-[0.98] transition-all duration-200 flex items-center gap-3.5">
              <div className="w-11 h-11 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[#1a1a1a] dark:to-[#222222] rounded-xl flex items-center justify-center text-xs font-bold text-gray-500 dark:text-gray-300 border border-gray-200 dark:border-[#333333] group-hover:border-royal-200 group-hover:from-royal-50 group-hover:to-royal-100 group-hover:text-royal-600 transition-all shrink-0">
                {r.deliveryOrder || r.phone?.slice(-4)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-bold text-[15px] text-gray-800 dark:text-white truncate leading-tight">{r.name}</p>
                  {r.blocked && <Ban size={12} className="text-red-500 shrink-0" />}
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{r.shop ? `${r.shop} • ` : ''}{r.area}</p>
                {(r.lastLogin) && <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-0.5">{new Date(r.lastLogin).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}{(r.lastLoginDevice || parseDeviceName(r.lastDevice)) ? ` • ${r.lastLoginDevice || parseDeviceName(r.lastDevice)}` : ''}</p>}
              </div>
              <div className="text-right shrink-0">
                {bal > 0 ? (
                  <span className="text-xs font-extrabold text-red-500 bg-red-50 dark:bg-red-900/20 px-2.5 py-1.5 rounded-lg border border-red-100 dark:border-red-800">{formatPrice(bal)}</span>
                ) : (
                  <span className="text-xs font-bold text-mint-600 bg-mint-50 dark:bg-mint-900/20 px-2.5 py-1.5 rounded-lg border border-mint-100 dark:border-mint-800">Clear</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {filtered.length === 0 && (<div className="text-center py-16"><User size={28} className="text-gray-200 mx-auto mb-2" /><p className="text-sm text-gray-400">No retailers found</p></div>)}

      {/* Manage Areas Modal */}
      <AnimatePresence>
        {showAreaModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => { setShowAreaModal(false); document.body.style.overflow = ''; }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="bg-white dark:bg-[#111111] w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl max-h-[80vh] flex flex-col"
              onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="p-6 pb-4 border-b border-gray-100 dark:border-[#222222] shrink-0">
                <div className="w-10 h-1 bg-gray-200 dark:bg-[#1a1a1a] rounded-full mx-auto mb-4 sm:hidden" />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-royal-50 dark:bg-royal-900/30 rounded-xl flex items-center justify-center">
                      <MapPin size={16} className="text-royal-600 dark:text-royal-300" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-gray-800 dark:text-white text-[15px]">Manage Areas</h3>
                      <p className="text-[10px] text-gray-400">{areas.length} areas • {retailers.length} retailers</p>
                    </div>
                  </div>
                  <button onClick={() => { setShowAreaModal(false); document.body.style.overflow = ''; }} className="w-8 h-8 bg-gray-100 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center text-gray-400"><X size={14} /></button>
                </div>
              </div>
              {/* Area List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {areas.map(area => {
                  const count = retailers.filter(r => r.area === area).length;
                  return (
                    <div key={area} className="flex items-center justify-between bg-gray-50 dark:bg-[#1a1a1a]/50 rounded-xl px-3.5 py-3">
                      {editArea === area ? (
                        <div className="flex items-center gap-2 flex-1 mr-2">
                          <input className="flex-1 py-1.5 px-2 text-sm border border-gray-200 dark:border-[#333333] rounded-lg bg-white dark:bg-[#1a1a1a] dark:text-white focus:outline-none focus:border-royal-300" value={editAreaValue}
                            onChange={e => setEditAreaValue(e.target.value)} maxLength={20}
                            onKeyDown={e => { if (e.key === 'Enter') renameAreaFn(); if (e.key === 'Escape') setEditArea(null); }}
                            autoFocus />
                          <button onClick={renameAreaFn} className="text-mint-600 hover:text-mint-700"><Check size={16} /></button>
                          <button onClick={() => setEditArea(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center gap-2.5 min-w-0">
                            <MapPin size={13} className="text-royal-500 shrink-0" />
                            <span className="text-sm font-bold text-gray-800 dark:text-white truncate">{area}</span>
                            <span className="text-[10px] text-gray-400 shrink-0">({count})</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 ml-2">
                            <button onClick={() => { setEditArea(area); setEditAreaValue(area); }}
                              className="w-7 h-7 bg-white dark:bg-[#222222] rounded-lg flex items-center justify-center hover:bg-royal-50 dark:hover:bg-[#333333] border border-gray-200 dark:border-[#333333]">
                              <Edit3 size={11} className="text-royal-600 dark:text-royal-300" />
                            </button>
                            <button onClick={() => removeAreaFn(area)}
                              className="w-7 h-7 bg-white dark:bg-[#222222] rounded-lg flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/30 border border-gray-200 dark:border-[#333333]">
                              <Trash2 size={11} className="text-red-500" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
                {areas.length === 0 && <p className="text-center text-sm text-gray-400 py-6">No areas yet. Add your first area below.</p>}
              </div>
              {/* Add Area */}
              <div className="p-4 pt-3 border-t border-gray-100 dark:border-[#222222] shrink-0">
                <div className="flex gap-2">
                  <input className="flex-1 py-2.5 px-3 text-sm border border-gray-200 dark:border-[#333333] rounded-xl bg-white dark:bg-[#1a1a1a] dark:text-white focus:outline-none focus:border-royal-300" placeholder="New area name..." maxLength={20}
                    value={newArea} onChange={e => setNewArea(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addAreaFn()} />
                  <motion.button whileTap={{ scale: 0.95 }} onClick={addAreaFn} disabled={saving === 'area' || !newArea.trim()}
                    className="px-4 py-2.5 bg-royal-700 text-white font-bold rounded-xl text-sm disabled:opacity-50 flex items-center gap-1.5">
                    <Plus size={14} /> Add
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail/Edit Modal */}
      <AnimatePresence>
        {selectedRetailer && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={() => { setSelectedRetailer(null); document.body.style.overflow = ''; }}>
            <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="bg-white dark:bg-[#111111] w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="w-10 h-1 bg-gray-200 dark:bg-[#333333] rounded-full mx-auto mb-5 sm:hidden" />

              {/* Modal Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-gradient-to-br from-royal-600 to-royal-800 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg">
                    {editForm.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-gray-800 dark:text-white text-[15px]">{editForm.name}</h3>
                    <p className="text-[10px] text-gray-400 font-mono">{editForm.phone}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  {!editMode && <button onClick={() => setEditMode(true)} className="text-[10px] font-bold text-royal-600 dark:text-royal-400 bg-royal-50 dark:bg-royal-900/30 px-3 py-1.5 rounded-lg border border-royal-100 dark:border-royal-800 hover:bg-royal-100 dark:hover:bg-royal-900/50 transition-colors">Edit</button>}
                  <button onClick={() => { setSelectedRetailer(null); document.body.style.overflow = ''; }} className="w-8 h-8 bg-gray-100 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-200 dark:hover:bg-[#222222] transition-colors"><X size={14} /></button>
                </div>
              </div>

              {/* Blocked Banner + Unblock */}
              {selectedRetailer.blocked && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <ShieldOff size={14} className="text-red-500" />
                      <span className="text-xs font-bold text-red-600 dark:text-red-400">Account Blocked</span>
                    </div>
                    {selectedRetailer.blockReason && <p className="text-[10px] text-red-500 mt-1 ml-5">{selectedRetailer.blockReason}</p>}
                  </div>
                  <motion.button whileTap={{ scale: 0.95 }} disabled={!!saving}
                    onClick={async () => {
                      setSaving('unblock');
                      try {
                        await updateDoc(doc(db, 'users', selectedRetailer.phone), { blocked: false, blockedAt: null, blockReason: null, loginAttempts: 0, lockUntil: null, lockTier: 0 });
                        setSelectedRetailer({ ...selectedRetailer, blocked: false });
                        showToast('Account unblocked'); fetchData();
                      } catch (err) { showToast('Failed to unblock', 'error'); }
                      setSaving(false);
                    }}
                    className="text-[10px] font-bold text-white bg-gradient-to-r from-mint-600 to-mint-500 px-3 py-1.5 rounded-lg shadow-sm disabled:opacity-50 shrink-0">
                    {saving === 'unblock' ? '...' : 'Unblock'}
                  </motion.button>
                </motion.div>
              )}

              {/* Block Section */}
              {!selectedRetailer.blocked && !editMode && !showBlockModal && (
                <motion.button whileTap={{ scale: 0.95 }} disabled={!!saving}
                  onClick={() => { setBlockReason(""); setShowBlockModal(true); }}
                  className="w-full mb-4 py-2.5 rounded-xl font-bold text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50">
                  <ShieldOff size={13} /> Block{(balances[selectedRetailer.phone] || 0) > 0 ? ` — Due ${formatPrice(balances[selectedRetailer.phone])}` : ""}
                </motion.button>
              )}
              <AnimatePresence>
                {showBlockModal && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    className="mb-4 overflow-hidden">
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldOff size={14} className="text-red-500" />
                          <p className="text-xs font-bold text-red-700 dark:text-red-400">Block {selectedRetailer.name}?</p>
                        </div>
                        <button onClick={() => setShowBlockModal(false)} className="w-6 h-6 bg-white dark:bg-[#1a1a1a] rounded-full flex items-center justify-center">
                          <X size={10} className="text-gray-500" />
                        </button>
                      </div>
                      {(balances[selectedRetailer.phone] || 0) > 0 && (
                        <p className="text-[11px] font-bold text-red-600 bg-red-100 dark:bg-red-900/20 px-3 py-1.5 rounded-lg inline-block">Due: {formatPrice(balances[selectedRetailer.phone])}</p>
                      )}
                      <div>
                        <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Reason</label>
                        <select value={blockReason} onChange={e => setBlockReason(e.target.value)}
                          className="w-full py-2 px-3 text-xs border border-red-200 dark:border-red-700 rounded-xl bg-white dark:bg-[#111111] dark:text-white focus:outline-none">
                          <option value="">Select reason</option>
                          <option value="Pending dues not cleared">Pending dues not cleared</option>
                          <option value="Repeated order cancellations">Repeated order cancellations</option>
                          <option value="Payment disputes">Payment disputes</option>
                          <option value="Inactive account">Inactive account</option>
                          <option value="Violation of terms">Violation of terms</option>
                          <option value="Temporary suspension">Temporary suspension</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Note (optional)</label>
                        <input id="blockNote" placeholder="Additional note..." maxLength={80}
                          className="w-full py-2 px-3 text-xs border border-red-200 dark:border-red-700 rounded-xl bg-white dark:bg-[#111111] dark:text-white focus:outline-none" />
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => setShowBlockModal(false)}
                          className="flex-1 py-2.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333333]">Cancel</button>
                        <motion.button whileTap={{ scale: 0.95 }} disabled={!!saving}
                          onClick={async () => {
                            setSaving("block");
                            try {
                              const bal = balances[selectedRetailer.phone] || 0;
                              const note = document.getElementById("blockNote")?.value?.trim() || "";
                              let reason = blockReason || (bal > 0 ? `Pending dues: ₹${bal.toLocaleString()}` : "Blocked by admin");
                              if (note) reason += ` — ${note}`;
                              await updateDoc(doc(db, "users", selectedRetailer.phone), { blocked: true, blockedAt: new Date().toISOString(), blockReason: reason, activeSession: "", sessionExpiry: "" });
                              setSelectedRetailer({ ...selectedRetailer, blocked: true, blockReason: reason });
                              setShowBlockModal(false);
                              showToast("Retailer blocked"); fetchData();
                            } catch (err) { showToast("Failed to block", "error"); }
                            setSaving(false);
                          }}
                          className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600 disabled:opacity-50">
                          {saving === "block" ? "..." : "Confirm Block"}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Fields */}
              <div className="space-y-3">
                {[
                  { key: 'name', label: 'Name', icon: User },
                  { key: 'phone', label: 'Phone', icon: Phone },
                  { key: 'shop', label: 'Shop Name', icon: Store },
                  { key: 'area', label: 'Area', icon: MapPin, type: 'select' },
                  { key: 'address', label: 'Address', icon: MapPin },
                  { key: 'pin', label: 'Login PIN', icon: KeyRound },
                ].map(field => (
                  <div key={field.key}>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">{field.label}</label>
                    {editMode && !field.disabled ? (
                      field.type === 'select' ? (
                        <select className="w-full py-2.5 px-3 text-sm border border-gray-200 dark:border-[#333333] rounded-xl focus:outline-none focus:border-royal-300 focus:ring-2 focus:ring-royal-100 bg-white dark:bg-[#1a1a1a] dark:text-white" value={editForm[field.key] || ''} onChange={e => setEditForm(f => ({ ...f, [field.key]: e.target.value }))}>
                          <option value="">Select</option>
                          {areas.map(a => <option key={a} value={a}>{a}</option>)}
                        </select>
                      ) : (
                        <input className="w-full py-2.5 px-3 text-sm border border-gray-200 dark:border-[#333333] rounded-xl focus:outline-none focus:border-royal-300 focus:ring-2 focus:ring-royal-100 bg-white dark:bg-[#1a1a1a] dark:text-white" value={editForm[field.key] || ''} maxLength={field.key === 'phone' ? 10 : field.key === 'pin' ? 4 : field.key === 'name' ? 25 : field.key === 'shop' ? 30 : undefined} onChange={e => setEditForm(f => ({ ...f, [field.key]: field.key === 'phone' ? e.target.value.replace(/\D/g, '') : e.target.value }))} />
                      )
                    ) : (
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 py-2.5 px-3 bg-gray-50 dark:bg-[#1a1a1a]/50 rounded-xl border border-gray-100 dark:border-[#333333]">{editForm[field.key] || '-'}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Hide Total Toggle */}
              {editMode && (
                <div className="flex items-center justify-between mt-4 px-1">
                  <div>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-200">Hide Total in PDF</p>
                    <p className="text-[10px] text-gray-400">Total column will be blank in daily sheet PDF</p>
                  </div>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setEditForm(f => ({ ...f, hideTotal: !f.hideTotal }))}
                    className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-300 ${editForm.hideTotal ? 'bg-gradient-to-r from-red-500 to-red-400' : 'bg-gray-200 dark:bg-[#222222]'}`}>
                    <motion.div className="w-5 h-5 bg-white rounded-full shadow-md" animate={{ x: editForm.hideTotal ? 20 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
                  </motion.button>
                </div>
              )}

              {editMode && !confirmStep && (
                <div className="flex gap-3 mt-6">
                  <button onClick={() => { setEditMode(false); setEditForm({ ...selectedRetailer }); }} disabled={!!saving} className="flex-1 py-3 rounded-xl font-bold text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#1a1a1a] hover:bg-gray-200 dark:hover:bg-[#222222] transition-colors disabled:opacity-50">Cancel</button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={saveEdit} disabled={!!saving} className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-royal-700 to-royal-600 shadow-lg disabled:opacity-50">
                    {saving === 'save' ? <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : 'Save'}
                  </motion.button>
                </div>
              )}

              {editMode && confirmStep && (
                <div className="mt-4 space-y-3">
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl p-4">
                    <p className="text-sm font-bold text-amber-800 dark:text-amber-200 mb-2">Confirm Changes</p>
                    {editForm.phone !== selectedRetailer.phone && (
                      <div className="space-y-1 mb-2">
                        <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold"><AlertTriangle size={12} className="inline text-amber-500" /> Phone: {selectedRetailer.phone} → {editForm.phone}</p>
                        <p className="text-[10px] text-amber-600 dark:text-amber-400">All data will transfer: orders, ledger, balance (₹{balances[selectedRetailer.phone] || 0}), tickets, history. Old number stops working.</p>
                      </div>
                    )}
                    {editForm.name?.trim() !== selectedRetailer.name && (
                      <p className="text-xs text-blue-700 dark:text-blue-300 font-semibold"><Info size={12} className="inline text-blue-500" /> Name: {selectedRetailer.name} → {editForm.name}</p>
                    )}
                    {editForm.area !== selectedRetailer.area && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">Area: {selectedRetailer.area} → {editForm.area}</p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setConfirmStep(false)} className="flex-1 py-3 rounded-xl font-bold text-sm text-gray-600 bg-gray-100 dark:bg-[#1a1a1a] dark:text-gray-300">Go Back</button>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={saveEdit} disabled={!!saving} className="flex-1 py-3 rounded-xl font-bold text-sm text-white bg-red-600 shadow-lg disabled:opacity-50">
                      {saving === 'save' ? <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : 'Confirm & Save'}
                    </motion.button>
                  </div>
                </div>
              )}

              {/* Delete Button */}
              {editMode && (
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => deleteRetailer(selectedRetailer.phone, selectedRetailer.name)} disabled={!!saving}
                  className="w-full mt-3 py-3 rounded-xl font-bold text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50">
                  {saving === 'delete' ? <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-4 h-4 border-2 border-red-200 border-t-red-600 rounded-full" /> : <><Trash2 size={13} /> Delete Retailer</>}
                </motion.button>
              )}

              {/* Performance Score */}
              {!editMode && performanceScore && (
                <div className="mt-6 mb-2">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={14} className="text-royal-600" />
                    <h4 className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Performance Score</h4>
                    <span className={`ml-auto text-lg font-black ${performanceScore.total >= 75 ? 'text-mint-600' : performanceScore.total >= 50 ? 'text-amber-600' : 'text-red-500'}`}>{performanceScore.total}<span className="text-xs text-gray-400 font-bold">/100</span></span>
                  </div>
                  {/* Score bar */}
                  <div className="w-full h-2.5 bg-gray-100 dark:bg-[#1a1a1a] rounded-full overflow-hidden mb-3">
                    <div className={`h-full rounded-full transition-all ${performanceScore.total >= 75 ? 'bg-mint-500' : performanceScore.total >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${performanceScore.total}%` }} />
                  </div>
                  {/* Breakdown */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-50 dark:bg-[#1a1a1a]/50 rounded-xl px-3 py-2 text-center">
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Frequency</p>
                      <p className="text-sm font-black text-gray-800 dark:text-white">{performanceScore.freq}<span className="text-[9px] text-gray-400">/40</span></p>
                      <p className="text-[9px] text-gray-400">{performanceScore.ordersPerMonth}/mo</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-[#1a1a1a]/50 rounded-xl px-3 py-2 text-center">
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Reliability</p>
                      <p className="text-sm font-black text-gray-800 dark:text-white">{performanceScore.reliability}<span className="text-[9px] text-gray-400">/35</span></p>
                      <p className="text-[9px] text-gray-400">{performanceScore.cancelRate}% cancel</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-[#1a1a1a]/50 rounded-xl px-3 py-2 text-center">
                      <p className="text-[9px] font-bold text-gray-400 uppercase">Payment</p>
                      <p className="text-sm font-black text-gray-800 dark:text-white">{performanceScore.payment}<span className="text-[9px] text-gray-400">/25</span></p>
                      <p className="text-[9px] text-gray-400">{(balances[selectedRetailer?.phone] || 0) > 0 ? formatPrice(balances[selectedRetailer.phone]) + ' due' : 'Clear'}</p>
                    </div>
                  </div>
                  <p className={`text-[10px] font-bold mt-2 text-center px-3 py-1.5 rounded-lg ${performanceScore.total >= 75 ? 'bg-mint-50 dark:bg-mint-900/20 text-mint-700 dark:text-mint-300' : performanceScore.total >= 50 ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300'}`}>
                    {performanceScore.total >= 75 ? '⭐ Excellent Retailer' : performanceScore.total >= 50 ? '👍 Good Retailer' : '⚠️ Needs Attention'}
                  </p>
                </div>
              )}

              {/* Order History */}
              {!editMode && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp size={14} className="text-royal-600" />
                      <h4 className="text-xs font-bold text-gray-600 dark:text-gray-300 uppercase">Last 30 Days ({orderHistory.length} orders)</h4>
                    </div>
                    {orderHistory.length > 0 && (
                      <span className="text-xs font-black text-royal-700 dark:text-royal-300">{formatPrice(orderHistory.reduce((s, o) => s + (o.total || 0), 0))}</span>
                    )}
                  </div>
                  {orderHistory.length > 0 ? (
                    <div className="space-y-2">
                      {orderHistory.slice(0, 5).map((o, i) => (
                        <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-[#1a1a1a]/50 rounded-xl px-3 py-2">
                          <div>
                            <p className="text-xs font-bold text-gray-700 dark:text-gray-200">{o.date}</p>
                            <p className="text-[10px] text-gray-400">{o.items?.length || 0} items</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-gray-800 dark:text-white">{formatPrice(o.total || 0)}</p>
                            <span className={`text-[9px] font-bold ${o.status === 'Delivered' ? 'text-mint-600' : o.status === 'Dispatched' ? 'text-blue-600' : o.status === 'Cancelled' ? 'text-red-600' : o.status === 'Returned' ? 'text-gray-500' : 'text-amber-600'}`}>{o.status}</span>
                          </div>
                        </div>
                      ))}
                      {orderHistory.length > 5 && (
                        <p className="text-[10px] text-center text-gray-400 dark:text-gray-500 pt-1">+{orderHistory.length - 5} more orders</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 text-center py-4">No orders in last 30 days</p>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Retailer Modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => { setShowAdd(false); document.body.style.overflow = ''; }}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="bg-white dark:bg-[#111111] rounded-3xl p-6 w-full max-w-sm shadow-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 bg-gradient-to-br from-royal-600 to-mint-500 rounded-xl flex items-center justify-center shadow-md">
                    <UserPlus size={16} className="text-white" />
                  </div>
                  <h3 className="font-extrabold text-gray-800 dark:text-white text-[16px]">Add Retailer</h3>
                </div>
                <button onClick={() => { setShowAdd(false); document.body.style.overflow = ''; }} className="w-8 h-8 bg-gray-100 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-200 dark:hover:bg-[#222222] transition-colors"><X size={14} /></button>
              </div>
              <div className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">Full Name *</label>
                  <input className="w-full py-2.5 px-3 text-sm border border-gray-200 dark:border-[#333333] rounded-xl focus:outline-none focus:border-royal-300 focus:ring-2 focus:ring-royal-100 bg-white dark:bg-[#1a1a1a] dark:text-white" placeholder="e.g. Ramesh Kumar" maxLength={25} value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))} />
                  <p className={(addForm.name.length >= 25 ? "text-red-500 font-bold" : "text-gray-400") + " text-[10px] mt-1"}>{addForm.name.length}/25</p>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">Phone (10 digit) *</label>
                  <input className="w-full py-2.5 px-3 text-sm border border-gray-200 dark:border-[#333333] rounded-xl focus:outline-none focus:border-royal-300 focus:ring-2 focus:ring-royal-100 bg-white dark:bg-[#1a1a1a] dark:text-white" type="tel" maxLength={10} placeholder="Mobile number" value={addForm.phone} onChange={e => setAddForm(f => ({ ...f, phone: e.target.value.replace(/\D/g, '') }))} />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">Shop Name</label>
                  <input className="w-full py-2.5 px-3 text-sm border border-gray-200 dark:border-[#333333] rounded-xl focus:outline-none focus:border-royal-300 focus:ring-2 focus:ring-royal-100 bg-white dark:bg-[#1a1a1a] dark:text-white" placeholder="e.g. Ramesh Dairy Store (optional)" value={addForm.shop} onChange={e => setAddForm(f => ({ ...f, shop: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">Area *</label>
                  <select className="w-full py-2.5 px-3 text-sm border border-gray-200 dark:border-[#333333] rounded-xl focus:outline-none focus:border-royal-300 focus:ring-2 focus:ring-royal-100 bg-white dark:bg-[#1a1a1a] dark:text-white" value={addForm.area} onChange={e => setAddForm(f => ({ ...f, area: e.target.value }))}>
                    <option value="">Select Area</option>
                    {areas.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">Address</label>
                  <input className="w-full py-2.5 px-3 text-sm border border-gray-200 dark:border-[#333333] rounded-xl focus:outline-none focus:border-royal-300 focus:ring-2 focus:ring-royal-100 bg-white dark:bg-[#1a1a1a] dark:text-white" placeholder="Shop address (optional)" value={addForm.address} onChange={e => setAddForm(f => ({ ...f, address: e.target.value }))} />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">Delivery Order</label>
                  <input className="w-full py-2.5 px-3 text-sm border border-gray-200 dark:border-[#333333] rounded-xl focus:outline-none focus:border-royal-300 focus:ring-2 focus:ring-royal-100 bg-white dark:bg-[#1a1a1a] dark:text-white" type="tel" maxLength={3} placeholder="Route sequence (optional)" value={addForm.deliveryOrder} onChange={e => setAddForm(f => ({ ...f, deliveryOrder: e.target.value.replace(/\D/g, '') }))} />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1.5 block">Login PIN (4 digits)</label>
                  <input className="w-full py-2.5 px-3 text-sm border border-gray-200 dark:border-[#333333] rounded-xl focus:outline-none focus:border-royal-300 focus:ring-2 focus:ring-royal-100 bg-white dark:bg-[#1a1a1a] dark:text-white" maxLength={4} placeholder={`Default: ${defaultPin}`} value={addForm.pin} onChange={e => setAddForm(f => ({ ...f, pin: e.target.value.replace(/\D/g, '') }))} />
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={addRetailer} disabled={!!saving}
                  className="w-full bg-gradient-to-r from-royal-700 to-royal-600 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-royal-200 text-sm mt-1 disabled:opacity-50">
                  {saving === 'add' ? <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : 'Add Retailer'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
