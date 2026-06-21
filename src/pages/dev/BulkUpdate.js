import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, RefreshCw, Edit3, CheckCircle2 } from 'lucide-react';
import { db, collection, getDocs, doc, updateDoc, query, where } from '../../services/firebase';
import { useConfirm } from '../../components/ConfirmModal';

const COLLECTIONS = ['orders', 'order_history', 'users', 'products', 'ledger', 'retailer_balances', 'support_tickets', 'company_orders', 'daily_stock'];

export default function BulkUpdate() {
  const [selectedCol, setSelectedCol] = useState('');
  const [filterField, setFilterField] = useState('');
  const [filterValue, setFilterValue] = useState('');
  const [updateField, setUpdateField] = useState('');
  const [updateValue, setUpdateValue] = useState('');
  const [isJsonValue, setIsJsonValue] = useState(false);
  const [matchedDocs, setMatchedDocs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [msg, setMsg] = useState('');
  const [progress, setProgress] = useState(null);
  const confirm = useConfirm();

  // Find matching docs
  const findDocs = async () => {
    if (!selectedCol || !filterField || !filterValue) return;
    setLoading(true); setMsg(''); setMatchedDocs([]);
    try {
      const snap = await getDocs(query(collection(db, selectedCol), where(filterField, '==', filterValue)));
      if (snap.empty) { setMsg('No documents found'); setMatchedDocs([]); }
      else {
        const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setMatchedDocs(docs);
        setMsg(`Found ${docs.length} documents`);
      }
    } catch (e) { setMsg(`❌ ${e.message}`); }
    setLoading(false);
  };

  // Also support fetching ALL docs in collection
  const findAll = async () => {
    if (!selectedCol) return;
    setLoading(true); setMsg(''); setMatchedDocs([]);
    try {
      const snap = await getDocs(collection(db, selectedCol));
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setMatchedDocs(docs);
      setMsg(`All ${docs.length} documents loaded`);
    } catch (e) { setMsg(`❌ ${e.message}`); }
    setLoading(false);
  };

  // Bulk update
  const executeBulkUpdate = async () => {
    if (!updateField || !updateValue || matchedDocs.length === 0) return;

    let parsedValue;
    if (isJsonValue) {
      try { parsedValue = JSON.parse(updateValue); }
      catch { setMsg('❌ Invalid JSON value'); return; }
    } else {
      // Auto-detect type
      if (updateValue === 'true') parsedValue = true;
      else if (updateValue === 'false') parsedValue = false;
      else if (!isNaN(updateValue) && updateValue.trim() !== '') parsedValue = Number(updateValue);
      else parsedValue = updateValue;
    }

    const ok = await confirm({
      title: 'Bulk Update',
      message: `Update "${updateField}" to "${JSON.stringify(parsedValue).slice(0, 50)}" in ${matchedDocs.length} documents of ${selectedCol}?`,
      confirmText: `Update ${matchedDocs.length} docs`,
      type: 'warning'
    });
    if (!ok) return;

    setUpdating(true); setProgress({ done: 0, total: matchedDocs.length });
    let done = 0, errors = 0;
    for (const d of matchedDocs) {
      try {
        await updateDoc(doc(db, selectedCol, d.id), { [updateField]: parsedValue });
      } catch { errors++; }
      done++;
      if (done % 5 === 0 || done === matchedDocs.length) setProgress({ done, total: matchedDocs.length });
    }
    setUpdating(false); setProgress(null);
    setMsg(errors === 0 ? `✅ Updated ${done} documents!` : `⚠️ ${done - errors} updated, ${errors} failed`);
  };

  // Preview what value currently looks like in first doc
  const previewCurrentValue = () => {
    if (!updateField || matchedDocs.length === 0) return null;
    const first = matchedDocs[0];
    const val = first[updateField];
    if (val === undefined) return 'field does not exist';
    return JSON.stringify(val).slice(0, 100);
  };

  return (
    <div className="space-y-5 pb-10">
      <div>
        <h2 className="text-base font-extrabold text-white">Bulk Update</h2>
        <p className="text-[10px] text-gray-500">Find docs by filter → update a field in all matched docs</p>
      </div>

      {/* Step 1: Collection */}
      <div>
        <label className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">1. Collection</label>
        <select value={selectedCol} onChange={e => { setSelectedCol(e.target.value); setMatchedDocs([]); setMsg(''); }}
          className="w-full mt-1 py-2.5 px-3 bg-gray-900 border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-green-500">
          <option value="">Select...</option>
          {COLLECTIONS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {selectedCol && (
        <>
          {/* Step 2: Filter */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-3">
            <label className="text-[10px] text-gray-400 font-bold uppercase">2. Find Documents</label>
            <div className="grid grid-cols-2 gap-2">
              <input value={filterField} onChange={e => setFilterField(e.target.value)} placeholder="Field (e.g. phone, date)"
                className="py-2 px-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-green-500" />
              <input value={filterValue} onChange={e => setFilterValue(e.target.value)} placeholder="Value (e.g. 9876543210)"
                className="py-2 px-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-green-500" />
            </div>
            <div className="flex gap-2">
              <motion.button whileTap={{ scale: 0.95 }} onClick={findDocs} disabled={loading || !filterField || !filterValue}
                className="flex-1 py-2.5 rounded-xl bg-green-900/30 border border-green-800/50 text-xs font-bold text-green-400 flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <RefreshCw size={12} className="animate-spin" /> : <><Search size={12} /> Find</>}
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={findAll} disabled={loading}
                className="py-2.5 px-4 rounded-xl bg-gray-800 border border-gray-700 text-xs font-bold text-gray-400 disabled:opacity-50">
                All Docs
              </motion.button>
            </div>
          </div>

          {/* Matched count */}
          {matchedDocs.length > 0 && (
            <div className="bg-green-900/20 border border-green-800/50 rounded-xl px-4 py-3">
              <p className="text-xs font-bold text-green-400">{matchedDocs.length} documents matched</p>
              <p className="text-[10px] text-gray-500 mt-1">IDs: {matchedDocs.slice(0, 5).map(d => d.id).join(', ')}{matchedDocs.length > 5 ? ` +${matchedDocs.length - 5} more` : ''}</p>
            </div>
          )}

          {/* Step 3: Update */}
          {matchedDocs.length > 0 && (
            <div className="bg-gray-900 border border-amber-900/50 rounded-2xl p-4 space-y-3">
              <label className="text-[10px] text-amber-400 font-bold uppercase">3. Update Field</label>
              <div className="space-y-2">
                <input value={updateField} onChange={e => setUpdateField(e.target.value)} placeholder="Field to update (e.g. name, price, unit)"
                  className="w-full py-2 px-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-amber-500" />
                {updateField && previewCurrentValue() && (
                  <p className="text-[10px] text-gray-500">Current value in first doc: <span className="text-amber-400 font-mono">{previewCurrentValue()}</span></p>
                )}
                <input value={updateValue} onChange={e => setUpdateValue(e.target.value)} placeholder="New value"
                  className="w-full py-2 px-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white outline-none focus:border-amber-500" />
                <label className="flex items-center gap-2 text-[10px] text-gray-400 cursor-pointer">
                  <input type="checkbox" checked={isJsonValue} onChange={e => setIsJsonValue(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-gray-600 bg-gray-800 text-green-500 focus:ring-0" />
                  Value is JSON (array/object)
                </label>
              </div>
              <motion.button whileTap={{ scale: 0.95 }} onClick={executeBulkUpdate} disabled={updating || !updateField || !updateValue}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 text-white text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                {updating ? <RefreshCw size={12} className="animate-spin" /> : <><Edit3 size={12} /> Update {matchedDocs.length} Documents</>}
              </motion.button>
            </div>
          )}

          {/* Progress */}
          {progress && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-gray-400">Updating...</span>
                <span className="text-[10px] font-bold text-white">{progress.done}/{progress.total}</span>
              </div>
              <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <motion.div className="h-full bg-amber-500 rounded-full" animate={{ width: `${(progress.done / Math.max(progress.total, 1)) * 100}%` }} />
              </div>
            </div>
          )}

          {/* Message */}
          {msg && <p className={`text-xs font-bold ${msg.includes('❌') ? 'text-red-400' : msg.includes('✅') ? 'text-green-400' : msg.includes('⚠️') ? 'text-amber-400' : 'text-gray-400'}`}>{msg}</p>}
        </>
      )}
    </div>
  );
}
