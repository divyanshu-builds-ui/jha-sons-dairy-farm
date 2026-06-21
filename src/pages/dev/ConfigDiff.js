import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GitCompare, RefreshCw, Copy, CheckCircle2 } from 'lucide-react';
import { db, doc, getDoc } from '../../services/firebase';

const DEFAULT_CONFIG = {
  maintenance: false,
  orderStart: 12,
  orderEnd: 16,
  sessionTimeout: 24,
  minOrderAmount: 100,
  maxOrderItems: 50,
  allowModify: true,
  defaultPin: '1234',
};

const DEFAULT_FLAGS = {
  seasonalProducts: true,
  supportTickets: true,
  orderHistory: true,
  ledgerView: true,
  darkMode: true,
  pdfInvoice: true,
  duplicateOrderCheck: true,
  balanceWarning: true,
  companyOrder: true,
  bulkPriceUpdate: true,
};

export default function ConfigDiff() {
  const [appConfig, setAppConfig] = useState(null);
  const [flags, setFlags] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => { fetchConfig(); }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const [appSnap, flagSnap] = await Promise.all([
        getDoc(doc(db, 'settings', 'app')),
        getDoc(doc(db, 'settings', 'featureFlags')),
      ]);
      setAppConfig(appSnap.exists() ? appSnap.data() : {});
      setFlags(flagSnap.exists() ? flagSnap.data() : {});
    } catch (e) {}
    setLoading(false);
  };

  const getDiffs = (current, defaults) => {
    if (!current) return [];
    const diffs = [];
    for (const [key, defaultVal] of Object.entries(defaults)) {
      const currentVal = current[key];
      if (JSON.stringify(currentVal) !== JSON.stringify(defaultVal)) {
        diffs.push({ key, default: defaultVal, current: currentVal ?? 'undefined' });
      }
    }
    return diffs;
  };

  const appDiffs = getDiffs(appConfig, DEFAULT_CONFIG);
  const flagDiffs = getDiffs(flags, DEFAULT_FLAGS);
  const totalDiffs = appDiffs.length + flagDiffs.length;

  const copyConfig = () => {
    const data = { app: appConfig, featureFlags: flags };
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const DiffRow = ({ d }) => (
    <div className="flex items-center justify-between py-2.5 px-3 bg-gray-800/50 rounded-xl">
      <span className="text-xs text-gray-300 font-mono">{d.key}</span>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-red-400 line-through">{JSON.stringify(d.default)}</span>
        <span className="text-[10px] text-green-400 font-bold">{JSON.stringify(d.current)}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white">Config Diff</h2>
          <p className="text-[10px] text-gray-500">Compare live config vs defaults</p>
        </div>
        <div className="flex gap-2">
          <motion.button whileTap={{ scale: 0.9 }} onClick={copyConfig} className="p-2.5 bg-gray-800 border border-gray-700 rounded-xl">
            {copied ? <CheckCircle2 size={14} className="text-green-400" /> : <Copy size={14} className="text-gray-400" />}
          </motion.button>
          <motion.button whileTap={{ scale: 0.9 }} onClick={fetchConfig} className="p-2.5 bg-gray-800 border border-gray-700 rounded-xl">
            <RefreshCw size={14} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </div>

      {/* Summary */}
      <div className={`rounded-xl p-3 text-center border ${totalDiffs === 0 ? 'bg-green-900/20 border-green-800/50' : 'bg-amber-900/20 border-amber-800/50'}`}>
        <p className={`text-lg font-black ${totalDiffs === 0 ? 'text-green-400' : 'text-amber-400'}`}>{totalDiffs}</p>
        <p className="text-[9px] text-gray-500 uppercase">{totalDiffs === 0 ? 'All defaults — no changes' : 'Config differences from defaults'}</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="w-4 h-4 border-2 border-gray-600 border-t-green-400 rounded-full animate-spin" /></div>
      ) : (
        <>
          {/* App Config Diffs */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <p className="text-xs font-bold text-gray-500 uppercase mb-3"><GitCompare size={11} className="inline mr-1" />App Settings ({appDiffs.length} changes)</p>
            {appDiffs.length === 0 ? (
              <p className="text-[10px] text-gray-600 text-center py-3">All at defaults</p>
            ) : (
              <div className="space-y-1.5">{appDiffs.map(d => <DiffRow key={d.key} d={d} />)}</div>
            )}
          </div>

          {/* Feature Flags Diffs */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <p className="text-xs font-bold text-gray-500 uppercase mb-3"><GitCompare size={11} className="inline mr-1" />Feature Flags ({flagDiffs.length} changes)</p>
            {flagDiffs.length === 0 ? (
              <p className="text-[10px] text-gray-600 text-center py-3">All at defaults</p>
            ) : (
              <div className="space-y-1.5">{flagDiffs.map(d => <DiffRow key={d.key} d={d} />)}</div>
            )}
          </div>

          {/* Full Current Config */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4">
            <p className="text-xs font-bold text-gray-500 uppercase mb-3">Live Config (Raw)</p>
            <pre className="text-[10px] text-gray-400 font-mono overflow-x-auto max-h-48 overflow-y-auto bg-gray-800/50 rounded-xl p-3">
              {JSON.stringify({ app: appConfig, featureFlags: flags }, null, 2)}
            </pre>
          </div>
        </>
      )}
    </div>
  );
}
