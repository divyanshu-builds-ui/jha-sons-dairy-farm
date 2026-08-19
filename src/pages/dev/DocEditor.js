import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Save, Trash2, RefreshCw, Calendar, CheckSquare, Square, AlertTriangle } from 'lucide-react';
import { db, collection, getDocs, doc, getDoc, setDoc, deleteDoc, query, where, orderBy } from '../../services/firebase';
import { useConfirm } from '../../components/ConfirmModal';

const COLLECTIONS = ['orders', 'order_history', 'users', 'products', 'ledger', 'retailer_balances', 'settings', 'support_tickets', 'announcements', 'app_errors', 'app_ratings', 'audit_log', 'company_orders', 'daily_stock', 'scheduled_tasks', 'backups', 'notifications'];

export default function DocEditor() {
  const [selectedCol, setSelectedCol] = useState('');
  const [docId, setDocId] = useState('');
  const [searchField, setSearchField] = useState('');
  const [searchValue, setSearchValue] = useState('');
  const [docData, setDocData] = useState(null);
  const [editData, setEditData] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [docList, setDocList] = useState([]);
  const [showList, setShowList] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [bulkDate, setBulkDate] = useState('');
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });
  const confirm = useConfirm();

  const fetchDoc = async () => {
    if (!selectedCol || !docId) return;
    setLoading(true); setMsg(''); setDocData(null);
    try {
      const snap = await getDoc(doc(db, selectedCol, docId));
      if (snap.exists()) {
        setDocData(snap.data());
        setEditData(JSON.stringify(snap.data(), null, 2));
      } else setMsg('Document not found');
    } catch (e) { setMsg(e.message); }
    setLoading(false);
  };

  const searchDocs = async () => {
    if (!selectedCol || !searchField || !searchValue) return;
    setLoading(true); setMsg(''); setDocList([]); setShowList(true); setSelected(new Set());
    try {
      let val = searchValue;
      if (!isNaN(val) && val.trim() !== '') val = Number(val);
      const snap = await getDocs(query(collection(db, selectedCol), where(searchField, '==', val)));
      if (snap.empty) { setMsg('No docs found'); setDocList([]); }
      else { setDocList(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setMsg(`Found ${snap.size} docs`); }
    } catch (e) { setMsg(e.message); }
    setLoading(false);
  };

  const listAll = async () => {
    if (!selectedCol) return;
    setLoading(true); setMsg(''); setDocList([]); setShowList(true); setSelected(new Set());
    try {
      const snap = await getDocs(collection(db, selectedCol));
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      docs.sort((a, b) => (b.createdAt || b.orderedAt || '').localeCompare(a.createdAt || a.orderedAt || ''));
      setDocList(docs);
      setMsg(`${docs.length} documents`);
    } catch (e) { setMsg(e.message); }
    setLoading(false);
  };

  const fetchByDate = async () => {
    if (!selectedCol || !bulkDate) return;
    setLoading(true); setMsg(''); setDocList([]); setShowList(true); setSelected(new Set());
    try {
      const dateStr = new Date(bulkDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      const snap = await getDocs(query(collection(db, selectedCol), where('date', '==', dateStr)));
      if (snap.empty) { setMsg(`No docs for ${dateStr}`); setDocList([]); }
      else { setDocList(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setMsg(`Found ${snap.size} docs for ${dateStr}`); }
    } catch (e) { setMsg(e.message); }
    setLoading(false);
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === docList.length) setSelected(new Set());
    else setSelected(new Set(docList.map(d => d.id)));
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    const ok = await confirm({ title: 'Bulk Delete', message: `Permanently delete ${selected.size} documents from "${selectedCol}"? This cannot be undone.`, confirmText: `Delete ${selected.size}`, type: 'critical' });
    if (!ok) return;
    setBulkDeleting(true); setBulkProgress({ done: 0, total: selected.size });
    let done = 0;
    for (const id of selected) {
      try { await deleteDoc(doc(db, selectedCol, id)); } catch (e) {}
      done++;
      setBulkProgress({ done, total: selected.size });
    }
    setBulkDeleting(false);
    setMsg(`Deleted ${done} documents`);
    setDocList(prev => prev.filter(d => !selected.has(d.id)));
    setSelected(new Set());
  };

  const deleteSingle = async (id) => {
    const ok = await confirm({ title: 'Delete Document', message: `Delete ${selectedCol}/${id}?`, confirmText: 'Delete', type: 'critical' });
    if (!ok) return;
    try {
      await deleteDoc(doc(db, selectedCol, id));
      setDocList(prev => prev.filter(d => d.id !== id));
      if (docId === id) { setDocData(null); setEditData(''); setDocId(''); }
      setMsg(`Deleted ${id}`);
    } catch (e) { setMsg(e.message); }
  };

  const saveDoc = async () => {
    if (!selectedCol || !docId) return;
    let parsed;
    try { parsed = JSON.parse(editData); } catch { setMsg('Invalid JSON'); return; }
    const ok = await confirm({ title: 'Save Document', message: `Overwrite ${selectedCol}/${docId}?`, confirmText: 'Save', type: 'warning' });
    if (!ok) return;
    setLoading(true);
    try {
      await setDoc(doc(db, selectedCol, docId), parsed);
      setDocData(parsed); setMsg('Saved!');
    } catch (e) { setMsg(`Save failed: ${e.message}`); }
    setLoading(false);
  };

  const selectFromList = (d) => {
    setDocId(d.id);
    const { id, ...rest } = d;
    setDocData(rest);
    setEditData(JSON.stringify(rest, null, 2));
    setMsg('');
  };

  const getPreview = (d) => {
    if (d.name) return d.name;
    if (d.retailer) return `${d.retailer} — ${d.date || ''}`;
    if (d.phone) return d.phone;
    if (d.message) return d.message.slice(0, 50);
    if (d.action) return d.action;
    return JSON.stringify(d).slice(0, 60);
  };

  return (
    <div className="space-y-5 pb-10">
      <div>
        <h2 className="text-base font-extrabold text-white">Database Editor</h2>
        <p className="text-[10px] text-gray-500">Browse, search, edit, delete — single or bulk</p>
      </div>

      {/* Collection Select */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Collection</label>
          <select value={selectedCol} onChange={e => { setSelectedCol(e.target.value); setDocData(null); setEditData(''); setDocId(''); setDocList([]); setShowList(false); setMsg(''); setSelected(new Set()); }}
            className="w-full mt-1 py-2.5 px-3 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-green-500">
            <option value="">Select...</option>
            {COLLECTIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        {selectedCol && (
          <div className="flex items-end gap-2">
            <motion.button whileTap={{ scale: 0.95 }} onClick={listAll} disabled={loading}
              className="flex-1 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-xs font-bold text-gray-300 disabled:opacity-50">
              <RefreshCw size={12} className="inline mr-1" /> Load All
            </motion.button>
          </div>
        )}
      </div>

      {selectedCol && (
        <>
          {/* Search + Date Filter */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Search by Field</p>
                <input value={searchField} onChange={e => setSearchField(e.target.value)} placeholder="Field (e.g. phone)"
                  className="w-full py-2 px-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-blue-500" />
              </div>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Value</p>
                <input value={searchValue} onChange={e => setSearchValue(e.target.value)} placeholder="Value..."
                  className="w-full py-2 px-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-blue-500" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <motion.button whileTap={{ scale: 0.95 }} onClick={searchDocs} disabled={loading || !searchField || !searchValue}
                className="py-2 rounded-xl bg-blue-900/30 border border-blue-800/50 text-xs font-bold text-blue-400 disabled:opacity-50">
                <Search size={12} className="inline mr-1" /> Search
              </motion.button>
              <div className="flex gap-2">
                <input type="date" value={bulkDate} onChange={e => setBulkDate(e.target.value)}
                  className="flex-1 py-2 px-2 bg-gray-800 border border-gray-700 rounded-xl text-xs text-white outline-none" />
                <motion.button whileTap={{ scale: 0.95 }} onClick={fetchByDate} disabled={loading || !bulkDate}
                  className="px-3 py-2 rounded-xl bg-amber-900/30 border border-amber-800/50 text-xs font-bold text-amber-400 disabled:opacity-50">
                  <Calendar size={12} className="inline" />
                </motion.button>
              </div>
            </div>
            {/* Fetch by ID */}
            <div className="flex gap-2">
              <input value={docId} onChange={e => setDocId(e.target.value)} placeholder="Or enter Document ID..."
                className="flex-1 py-2 px-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-green-500" />
              <motion.button whileTap={{ scale: 0.9 }} onClick={fetchDoc} disabled={loading || !docId}
                className="px-4 py-2 bg-green-900/50 border border-green-800 rounded-xl text-xs font-bold text-green-400 disabled:opacity-50">
                <Search size={14} />
              </motion.button>
            </div>
          </div>

          {/* Bulk Actions Bar */}
          {showList && docList.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <motion.button whileTap={{ scale: 0.95 }} onClick={selectAll}
                className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 border border-gray-700 rounded-xl text-[10px] font-bold text-gray-300">
                {selected.size === docList.length ? <CheckSquare size={12} className="text-green-400" /> : <Square size={12} />}
                {selected.size === docList.length ? 'Deselect All' : 'Select All'}
              </motion.button>
              {selected.size > 0 && (
                <motion.button whileTap={{ scale: 0.95 }} onClick={deleteSelected} disabled={bulkDeleting}
                  className="flex items-center gap-1.5 px-3 py-2 bg-red-900/40 border border-red-800 rounded-xl text-[10px] font-bold text-red-400 disabled:opacity-50">
                  <Trash2 size={12} /> Delete {selected.size} selected
                </motion.button>
              )}
              {bulkDeleting && (
                <span className="text-[10px] font-bold text-amber-400">
                  Deleting... {bulkProgress.done}/{bulkProgress.total}
                </span>
              )}
              <span className="text-[10px] text-gray-500 ml-auto">{docList.length} docs</span>
            </div>
          )}

          {/* Doc List */}
          {showList && docList.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden max-h-[50vh] overflow-y-auto">
              {docList.map(d => (
                <div key={d.id} className={`flex items-center gap-2 px-3 py-2.5 border-b border-gray-800 last:border-0 ${selected.has(d.id) ? 'bg-red-900/10' : 'hover:bg-gray-800/50'} transition-colors`}>
                  <button onClick={() => toggleSelect(d.id)} className="shrink-0">
                    {selected.has(d.id) ? <CheckSquare size={14} className="text-red-400" /> : <Square size={14} className="text-gray-600" />}
                  </button>
                  <button onClick={() => selectFromList(d)} className="flex-1 text-left min-w-0">
                    <p className="text-xs font-bold text-white truncate">{d.id}</p>
                    <p className="text-[10px] text-gray-500 truncate">{getPreview(d)}</p>
                  </button>
                  <span className="text-[9px] text-gray-600 shrink-0">{d.status || d.type || d.role || ''}</span>
                  <motion.button whileTap={{ scale: 0.8 }} onClick={() => deleteSingle(d.id)}
                    className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-red-900/20 hover:bg-red-900/40">
                    <Trash2 size={11} className="text-red-400" />
                  </motion.button>
                </div>
              ))}
            </div>
          )}

          {/* Editor */}
          {docData && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-gray-400 font-bold uppercase">Editing: <span className="text-green-400">{selectedCol}/{docId}</span></p>
                <div className="flex gap-2">
                  <motion.button whileTap={{ scale: 0.9 }} onClick={saveDoc} disabled={loading}
                    className="flex items-center gap-1 px-3 py-1.5 bg-green-900/30 border border-green-800/50 rounded-lg text-[10px] font-bold text-green-400 disabled:opacity-50">
                    <Save size={11} /> Save
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => deleteSingle(docId)} disabled={loading}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-900/30 border border-red-800/50 rounded-lg text-[10px] font-bold text-red-400 disabled:opacity-50">
                    <Trash2 size={11} /> Delete
                  </motion.button>
                </div>
              </div>
              <textarea value={editData} onChange={e => setEditData(e.target.value)}
                className="w-full h-72 p-4 bg-gray-950 border border-gray-800 rounded-xl text-xs text-green-300 font-mono outline-none focus:border-green-600 resize-y"
                spellCheck={false} />
            </div>
          )}

          {/* Message */}
          {msg && <p className={`text-xs font-bold ${msg.includes('fail') || msg.includes('not found') || msg.includes('Error') ? 'text-red-400' : msg.includes('Deleted') || msg.includes('Saved') ? 'text-green-400' : 'text-gray-400'}`}>{msg}</p>}
        </>
      )}
    </div>
  );
}
