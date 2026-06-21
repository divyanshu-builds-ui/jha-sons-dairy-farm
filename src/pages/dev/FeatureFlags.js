import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ToggleLeft, ToggleRight, RefreshCw, Save, Info } from 'lucide-react';
import { db, doc, getDoc, setDoc } from '../../services/firebase';
import { useConfirm } from '../../components/ConfirmModal';

const DEFAULT_FLAGS = [
  { key: 'seasonalProducts', label: 'Seasonal Products', description: 'Show seasonal products section in order page', default: true },
  { key: 'supportTickets', label: 'Support Tickets', description: 'Allow retailers to submit support tickets', default: true },
  { key: 'orderHistory', label: 'Order History', description: 'Show order history page for retailers', default: true },
  { key: 'ledgerView', label: 'Retailer Ledger', description: 'Allow retailers to view their ledger', default: true },
  { key: 'darkMode', label: 'Dark Mode', description: 'Allow dark mode toggle in settings', default: true },
  { key: 'pdfInvoice', label: 'PDF Invoice', description: 'Allow retailers to download PDF invoices', default: true },
  { key: 'duplicateOrderCheck', label: 'Duplicate Order Check', description: 'Warn retailers if they already have an order for tomorrow', default: true },
  { key: 'balanceWarning', label: 'Balance Warning', description: 'Show pending due warning on order page', default: true },
  { key: 'companyOrder', label: 'Company Order', description: 'Show company order page for admin', default: true },
  { key: 'bulkPriceUpdate', label: 'Bulk Price Update', description: 'Allow bulk price percentage change in inventory', default: true },
  { key: 'cancelOrder', label: 'Cancel Order', description: 'Allow retailers to cancel orders before dispatch', default: true },
  { key: 'priceList', label: 'Price List', description: 'Show price list page and PDF rate card download', default: true },
  { key: 'pullToRefresh', label: 'Pull to Refresh', description: 'Enable pull-to-refresh gesture on mobile', default: true },
  { key: 'welcomePopup', label: 'Welcome Popup', description: 'Show onboarding popup on first login', default: true },
  { key: 'installPrompt', label: 'Install Prompt', description: 'Show PWA install banner to users', default: true },
  { key: 'orderPlacement', label: 'Order Placement', description: 'Allow new orders — disable to block all ordering', default: true },
  { key: 'rateCard', label: 'Rate Card PDF', description: 'Allow PDF rate card download from price list', default: true },
  { key: 'announcements', label: 'Announcements', description: 'Show announcement banners to users', default: true },
  { key: 'autoCleanup', label: 'Auto Cleanup', description: 'Daily auto-delete of old errors and data', default: true },
  { key: 'usageTracking', label: 'Usage Tracking', description: 'Track Firestore reads/writes — disable to reduce writes', default: true },
];

export default function FeatureFlags() {
  const [flags, setFlags] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changed, setChanged] = useState(false);
  const confirm = useConfirm();

  useEffect(() => { fetchFlags(); }, []);

  const fetchFlags = async () => {
    setLoading(true);
    try {
      const snap = await getDoc(doc(db, 'settings', 'featureFlags'));
      if (snap.exists()) {
        setFlags(snap.data());
      } else {
        const defaults = {};
        DEFAULT_FLAGS.forEach(f => { defaults[f.key] = f.default; });
        setFlags(defaults);
      }
    } catch (e) {}
    setLoading(false);
    setChanged(false);
  };

  const toggle = async (key) => {
    const newVal = !flags[key];
    const ok = await confirm({ title: `${newVal ? 'Enable' : 'Disable'} Feature`, message: `${newVal ? 'Enable' : 'Disable'} "${key}"? This affects all users immediately.`, confirmText: newVal ? 'Enable' : 'Disable', type: 'warning' });
    if (!ok) return;
    const newFlags = { ...flags, [key]: newVal };
    setFlags(newFlags);
    try {
      await setDoc(doc(db, 'settings', 'featureFlags'), { ...newFlags, updatedAt: new Date().toISOString() });
    } catch (e) {}
  };

  const saveFlags = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'featureFlags'), { ...flags, updatedAt: new Date().toISOString() });
      setChanged(false);
    } catch (err) {}
    setSaving(false);
  };

  const enabledCount = Object.values(flags).filter(Boolean).length;
  const disabledCount = DEFAULT_FLAGS.length - enabledCount;

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white">Feature Flags</h2>
          <p className="text-[10px] text-gray-500">Toggle features without redeploying</p>
        </div>
        <div className="flex gap-2">
          <motion.button whileTap={{ scale: 0.9 }} onClick={fetchFlags}
            className="p-2.5 bg-gray-800 border border-gray-700 rounded-xl">
            <RefreshCw size={14} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-green-900/20 border border-green-800/50 rounded-xl p-3 text-center">
          <p className="text-lg font-black text-green-400">{enabledCount}</p>
          <p className="text-[9px] font-bold text-green-500/70 uppercase">Enabled</p>
        </div>
        <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-3 text-center">
          <p className="text-lg font-black text-red-400">{disabledCount}</p>
          <p className="text-[9px] font-bold text-red-500/70 uppercase">Disabled</p>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-900/20 border border-blue-800/50 rounded-2xl p-4 flex items-start gap-3">
        <Info size={14} className="text-blue-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-blue-300/80">Changes take effect immediately after saving. Retailers will see updates on next page load.</p>
      </div>

      {/* Flags List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(i => <div key={i} className="h-16 bg-gray-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {DEFAULT_FLAGS.map((flag, i) => {
            const enabled = flags[flag.key] !== false;
            return (
              <motion.div key={flag.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.03 * i }}
                className={`rounded-2xl border p-4 transition-all ${enabled ? 'bg-gray-900/50 border-gray-800' : 'bg-red-900/10 border-red-900/30'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0 mr-3">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-white">{flag.label}</p>
                      {!enabled && <span className="text-[8px] font-bold bg-red-900/50 text-red-400 px-1.5 py-0.5 rounded border border-red-800">OFF</span>}
                    </div>
                    <p className="text-[10px] text-gray-500 mt-0.5">{flag.description}</p>
                  </div>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => toggle(flag.key)}
                    className={`w-12 h-7 rounded-full p-0.5 transition-colors duration-300 shrink-0 ${enabled ? 'bg-gradient-to-r from-green-500 to-emerald-500' : 'bg-gray-700'}`}>
                    <motion.div className="w-6 h-6 bg-white rounded-full shadow-md"
                      animate={{ x: enabled ? 20 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
                  </motion.button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Save Button */}
      {changed && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-0 right-0 z-40 px-4 lg:pl-[276px]">
          <motion.button whileTap={{ scale: 0.97 }} onClick={saveFlags} disabled={saving}
            className="w-full max-w-md mx-auto py-3.5 rounded-2xl text-sm font-bold bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-xl shadow-green-900/30 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <><Save size={14} /> Save Changes</>}
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
