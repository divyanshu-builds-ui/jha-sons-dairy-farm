import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileJson, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { db, collection, getDocs } from '../../services/firebase';

const COLLECTIONS = ['users', 'orders', 'order_history', 'products', 'ledger', 'retailer_balances', 'settings', 'support_tickets', 'announcements', 'app_errors', 'audit_log', 'app_ratings', 'company_orders', 'daily_stock'];

export default function DataExport() {
  const [selected, setSelected] = useState([]);
  const [exporting, setExporting] = useState(false);
  const [format, setFormat] = useState('json');

  const toggleAll = () => setSelected(selected.length === COLLECTIONS.length ? [] : [...COLLECTIONS]);
  const toggle = (c) => setSelected(s => s.includes(c) ? s.filter(x => x !== c) : [...s, c]);

  const exportData = async () => {
    if (!selected.length) return;
    setExporting(true);
    try {
      const result = {};
      for (const col of selected) {
        const snap = await getDocs(collection(db, col));
        result[col] = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }

      let blob, filename;
      if (format === 'json') {
        blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
        filename = `lucy-garden-export-${new Date().toISOString().split('T')[0]}.json`;
      } else {
        // CSV - flatten each collection
        let csv = '';
        for (const [col, docs] of Object.entries(result)) {
          if (!docs.length) continue;
          const keys = [...new Set(docs.flatMap(d => Object.keys(d)))];
          csv += `\n--- ${col} ---\n`;
          csv += keys.join(',') + '\n';
          docs.forEach(d => { csv += keys.map(k => JSON.stringify(d[k] ?? '')).join(',') + '\n'; });
        }
        blob = new Blob([csv], { type: 'text/csv' });
        filename = `lucy-garden-export-${new Date().toISOString().split('T')[0]}.csv`;
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
    } catch (e) {}
    setExporting(false);
  };

  return (
    <div className="space-y-5 pb-10">
      <div>
        <h2 className="text-base font-extrabold text-white">Data Export</h2>
        <p className="text-[10px] text-gray-500">Download database collections as JSON/CSV</p>
      </div>

      {/* Format */}
      <div className="flex gap-2">
        {[{ v: 'json', Icon: FileJson, label: 'JSON' }, { v: 'csv', Icon: FileSpreadsheet, label: 'CSV' }].map(f => (
          <button key={f.v} onClick={() => setFormat(f.v)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border text-xs font-bold transition-all ${format === f.v ? 'bg-green-900/30 border-green-700 text-green-400' : 'bg-gray-900 border-gray-800 text-gray-500'}`}>
            <f.Icon size={14} /> {f.label}
          </button>
        ))}
      </div>

      {/* Collections */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-gray-500 uppercase">Select Collections</p>
          <button onClick={toggleAll} className="text-[10px] font-bold text-green-400">{selected.length === COLLECTIONS.length ? 'Deselect All' : 'Select All'}</button>
        </div>
        <div className="space-y-1.5">
          {COLLECTIONS.map(c => (
            <button key={c} onClick={() => toggle(c)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all ${selected.includes(c) ? 'bg-green-900/20 border-green-800/50' : 'bg-gray-800/50 border-gray-700/50'}`}>
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${selected.includes(c) ? 'bg-green-600 border-green-600' : 'border-gray-600'}`}>
                {selected.includes(c) && <CheckCircle2 size={12} className="text-white" />}
              </div>
              <span className={`text-xs font-mono ${selected.includes(c) ? 'text-white' : 'text-gray-400'}`}>{c}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Export Button */}
      <motion.button whileTap={{ scale: 0.97 }} onClick={exportData} disabled={exporting || !selected.length}
        className="w-full py-3.5 rounded-2xl text-sm font-bold bg-gradient-to-r from-green-600 to-emerald-600 text-white disabled:opacity-50 flex items-center justify-center gap-2">
        {exporting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Download size={14} /> Export {selected.length} Collection{selected.length !== 1 ? 's' : ''}</>}
      </motion.button>
    </div>
  );
}
