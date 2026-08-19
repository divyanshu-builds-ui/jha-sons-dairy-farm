import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Wifi, RefreshCw, Zap, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { db, collection, getDocs, doc, getDoc, query, limit } from '../../services/firebase';

const ENDPOINTS = [
  { name: 'users', type: 'collection' },
  { name: 'orders', type: 'collection' },
  { name: 'products', type: 'collection' },
  { name: 'settings/app', type: 'doc' },
  { name: 'settings/featureFlags', type: 'doc' },
  { name: 'announcements', type: 'collection' },
];

export default function ApiResponseMonitor() {
  const [results, setResults] = useState([]);
  const [testing, setTesting] = useState(false);
  const [history, setHistory] = useState([]);

  const runTests = async () => {
    setTesting(true);
    const res = [];
    for (const ep of ENDPOINTS) {
      const start = performance.now();
      let status = 'ok', error = '';
      try {
        if (ep.type === 'doc') {
          const [col, id] = ep.name.split('/');
          await getDoc(doc(db, col, id));
        } else {
          await getDocs(query(collection(db, ep.name), limit(1)));
        }
      } catch (e) { status = 'error'; error = e.message; }
      const time = Math.round(performance.now() - start);
      res.push({ ...ep, time, status, error });
    }
    setResults(res);
    setHistory(h => [{ timestamp: new Date().toISOString(), avg: Math.round(res.reduce((a, r) => a + r.time, 0) / res.length), results: res }, ...h].slice(0, 10));
    setTesting(false);
  };

  useEffect(() => { runTests(); }, []);

  const avg = results.length ? Math.round(results.reduce((a, r) => a + r.time, 0) / results.length) : 0;
  const max = results.length ? Math.max(...results.map(r => r.time)) : 0;
  const errors = results.filter(r => r.status === 'error').length;

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white">API Response Monitor</h2>
          <p className="text-[10px] text-gray-500">Firebase query latency & health</p>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={runTests} disabled={testing} className="flex items-center gap-1.5 px-3 py-2 bg-green-900/30 border border-green-800 rounded-xl text-[10px] font-bold text-green-400">
          <RefreshCw size={11} className={testing ? 'animate-spin' : ''} /> Test All
        </motion.button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
          <p className={`text-lg font-black ${avg < 200 ? 'text-green-400' : avg < 500 ? 'text-amber-400' : 'text-red-400'}`}>{avg}ms</p>
          <p className="text-[9px] text-gray-500 uppercase">Avg Latency</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
          <p className="text-lg font-black text-amber-400">{max}ms</p>
          <p className="text-[9px] text-gray-500 uppercase">Slowest</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3 text-center">
          <p className={`text-lg font-black ${errors ? 'text-red-400' : 'text-green-400'}`}>{errors}</p>
          <p className="text-[9px] text-gray-500 uppercase">Errors</p>
        </div>
      </div>

      {/* Results */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
        <p className="text-xs font-bold text-gray-500 uppercase mb-3"><Zap size={11} className="inline mr-1" />Endpoint Results</p>
        {testing ? (
          <div className="flex justify-center py-6"><div className="w-4 h-4 border-2 border-gray-600 border-t-green-400 rounded-full animate-spin" /></div>
        ) : (
          <div className="space-y-2">
            {results.map((r, i) => (
              <motion.div key={r.name} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between py-2.5 px-3 bg-gray-800/50 rounded-xl">
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-gray-600 bg-gray-800 w-5 h-5 rounded-md flex items-center justify-center shrink-0">{i + 1}</span>
                  {r.status === 'ok' ? <CheckCircle2 size={12} className="text-green-500" /> : <AlertTriangle size={12} className="text-red-500" />}
                  <span className="text-xs text-gray-300 font-mono">{r.name}</span>
                  <span className="text-[9px] text-gray-600">{r.type}</span>
                </div>
                <span className={`text-xs font-bold ${r.time < 200 ? 'text-green-400' : r.time < 500 ? 'text-amber-400' : 'text-red-400'}`}>{r.time}ms</span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* History */}
      {history.length > 1 && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
          <p className="text-xs font-bold text-gray-500 uppercase mb-3"><Clock size={11} className="inline mr-1" />Test History</p>
          <div className="space-y-1.5">
            {history.map((h, i) => (
              <div key={i} className="flex items-center justify-between py-2 px-3 bg-gray-800/50 rounded-lg">
                <span className="text-[10px] text-gray-500">{h.timestamp.slice(11, 19)}</span>
                <span className={`text-[10px] font-bold ${h.avg < 200 ? 'text-green-400' : h.avg < 500 ? 'text-amber-400' : 'text-red-400'}`}>Avg: {h.avg}ms</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
