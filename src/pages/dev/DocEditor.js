import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Save, Trash2, Plus, RefreshCw } from 'lucide-react';
import { db, collection, getDocs, doc, getDoc, setDoc, updateDoc, deleteDoc, query, where } from '../../services/firebase';
import { useConfirm } from '../../components/ConfirmModal';

const COLLECTIONS = ['users', 'products', 'orders', 'order_history', 'ledger', 'retailer_balances', 'settings', 'support_tickets', 'announcements', 'app_errors', 'app_ratings', 'audit_log', 'company_orders', 'daily_stock', 'scheduled_tasks', 'backups'];

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
  const confirm = useConfirm();

  // Fetch by ID
  const fetchDoc = async () => {
    if (!selectedCol || !docId) return;
    setLoading(true); setMsg(''); setDocData(null);
    try {
      const snap = await getDoc(doc(db, selectedCol, docId));
      if (snap.exists()) {
        const data = snap.data();
        setDocData(data);
        setEditData(JSON.stringify(data, null, 2));
        setMsg('');
      } else { setMsg('❌ Document not found'); }
    } catch (e) { setMsg(`❌ ${e.message}`); }
    setLoading(false);
  };

  // Search by field
  const searchDocs = async () => {
    if (!selectedCol || !searchField || !searchValue) return;
    setLoading(true); setMsg(''); setDocList([]); setShowList(true);
    try {
      const snap = await getDocs(query(collection(db, selectedCol), where(searchField, '==', searchValue)));
      if (snap.empty) { setMsg('No docs found'); setDocList([]); }
      else { setDocList(snap.docs.map(d => ({ id: d.id, ...d.data() }))); setMsg(`Found ${snap.size} docs`); }
    } catch (e) { setMsg(`❌ ${e.message}`); }
    setLoading(false);
  };

  // List first 20 docs
  const listDocs = async () => {
    if (!selectedCol) return;
    setLoading(true); setMsg(''); setDocList([]); setShowList(true);
    try {
      const snap = await getDocs(collection(db, selectedCol));
      setDocList(snap.docs.slice(0, 20).map(d => ({ id: d.id, ...d.data() })));
      setMsg(`Showing ${Math.min(snap.size, 20)} of ${snap.size} docs`);
    } catch (e) { setMsg(`❌ ${e.message}`); }
    setLoading(false);
  };

  // Save edited doc
  const saveDoc = async () => {
    if (!selectedCol || !docId) return;
    let parsed;
    try { parsed = JSON.parse(editData); } catch { setMsg('❌ Invalid JSON'); return; }
    const ok = await confirm({ title: 'Save Document', message: `Overwrite ${selectedCol}/${docId}?`, confirmText: 'Save', type: 'warning' });
    if (!ok) return;
    setLoading(true);
    try {
      await setDoc(doc(db, selectedCol, docId), parsed);
      setDocData(parsed);
      setMsg('✅ Saved!');
    } catch (e) { setMsg(`❌ Save failed: ${e.message}`); }
    setLoading(false);
  };

  // Delete doc
  const deleteCurrent = async () => {
    if (!selectedCol || !docId) return;
    const ok = await confirm({ title: 'Delete Document', message: `Permanently delete ${selectedCol}/${docId}?`, confirmText: 'Delete', type: 'critical' });
    if (!ok) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, selectedCol, docId));
      setDocData(null); setEditData(''); setMsg('🗑️ Deleted');
    } catch (e) { setMsg(`❌ ${e.message}`); }
    setLoading(false);
  };

  // Select doc from list
  const selectFromList = (d) => {
    setDocId(d.id);
    const { id, ...rest } = d;
    setDocData(rest);
    setEditData(JSON.stringify(rest, null, 2));
    setShowList(false);
    setMsg('');
  };

  return (
    <div className="space-y-5 pb-10">
      <div>
        <h2 className="text-base font-extrabold text-white">Quick Doc Editor</h2>
        <p className="text-[10px] text-gray-500">Read, edit, delete any document in any collection</p>
      </div>

      {/* Collection Select */}
      <div>
        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Collection</label>
        <select value={selectedCol} onChange={e => { setSelectedCol(e.target.value); setDocData(null); setEditData(''); setDocId(''); setDocList([]); setShowList(false); setMsg(''); }}
          className="w-full mt-1 py-2.5 px-3 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-green-500">
          <option value="">Select collection...</option>
          {COLLECTIONS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {selectedCol && (
        <>
          {/* Fetch by ID */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
            <p className="text-[10px] text-gray-400 font-bold uppercase">Fetch by Document ID</p>
            <div className="flex gap-2">
              <input value={docId} onChange={e => setDocId(e.target.value)} placeholder="Document ID..."
                className="flex-1 py-2 px-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-green-500" />
              <motion.button whileTap={{ scale: 0.9 }} onClick={fetchDoc} disabled={loading || !docId}
                className="px-4 py-2 bg-green-900/50 border border-green-800 rounded-xl text-xs font-bold text-green-400 disabled:opacity-50">
                <Search size={14} />
              </motion.button>
            </div>
          </div>

          {/* Search by field */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
            <p className="text-[10px] text-gray-400 font-bold uppercase">Search by Field</p>
            <div className="grid grid-cols-2 gap-2">
              <input value={searchField} onChange={e => setSearchField(e.target.value)} placeholder="Field name (e.g. phone)"
                className="py-2 px-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-blue-500" />
              <input value={searchValue} onChange={e => setSearchValue(e.target.value)} placeholder="Value..."
                className="py-2 px-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-blue-500" />
            </div>
            <div className="flex gap-2">
              <motion.button whileTap={{ scale: 0.95 }} onClick={searchDocs} disabled={loading || !searchField || !searchValue}
                className="flex-1 py-2 rounded-xl bg-blue-900/30 border border-blue-800/50 text-xs font-bold text-blue-400 disabled:opacity-50">
                Search
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={listDocs} disabled={loading}
                className="flex-1 py-2 rounded-xl bg-gray-800 border border-gray-700 text-xs font-bold text-gray-400 disabled:opacity-50">
                List First 20
              </motion.button>
            </div>
          </div>

          {/* Doc List */}
          {showList && docList.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden max-h-60 overflow-y-auto">
              {docList.map((d, i) => (
                <button key={d.id} onClick={() => selectFromList(d)}
                  className="w-full px-4 py-3 text-left border-b border-gray-800 last:border-0 hover:bg-gray-800/50 transition-colors">
                  <p className="text-xs font-bold text-white truncate">{d.id}</p>
                  <p className="text-[10px] text-gray-500 truncate">{d.name || d.phone || d.retailer || d.message || JSON.stringify(d).slice(0, 60)}</p>
                </button>
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
                  <motion.button whileTap={{ scale: 0.9 }} onClick={deleteCurrent} disabled={loading}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-900/30 border border-red-800/50 rounded-lg text-[10px] font-bold text-red-400 disabled:opacity-50">
                    <Trash2 size={11} /> Delete
                  </motion.button>
                </div>
              </div>
              <textarea value={editData} onChange={e => setEditData(e.target.value)}
                className="w-full h-80 p-4 bg-gray-950 border border-gray-800 rounded-xl text-xs text-green-300 font-mono outline-none focus:border-green-600 resize-y"
                spellCheck={false} />
            </div>
          )}

          {/* Message */}
          {msg && <p className={`text-xs font-bold ${msg.includes('❌') ? 'text-red-400' : msg.includes('✅') || msg.includes('Found') ? 'text-green-400' : 'text-gray-400'}`}>{msg}</p>}
        </>
      )}
    </div>
  );
}
