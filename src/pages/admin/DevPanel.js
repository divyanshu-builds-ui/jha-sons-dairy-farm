import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Database, Users, ShoppingCart, Package, Headphones, RefreshCw, Trash2, Wifi, WifiOff, Clock, AlertTriangle, CheckCircle2, Server, KeyRound } from 'lucide-react';
import { db, collection, getDocs, doc, getDoc, setDoc, query, where } from '../../services/firebase';
import { APP_CONFIG } from '../../utils/config';
import { useConfirm } from '../../components/ConfirmModal';

const APP_VERSION = APP_CONFIG.version;

export default function DevPanel() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [online, setOnline] = useState(navigator.onLine);
  const [logs, setLogs] = useState([]);
  const [actionLoading, setActionLoading] = useState('');
  const confirm = useConfirm();

  useEffect(() => {
    fetchStats();
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  const addLog = (msg) => setLogs(prev => [{ time: new Date().toLocaleTimeString(), msg }, ...prev].slice(0, 50));

  const fetchStats = async () => {
    setLoading(true);
    const start = Date.now();
    try {
      const [usersSnap, ordersSnap, productsSnap, ticketsSnap, ledgerSnap] = await Promise.all([
        getDocs(query(collection(db, 'users'), where('role', '==', 'retailer'))),
        getDocs(collection(db, 'orders')),
        getDocs(collection(db, 'products')),
        getDocs(collection(db, 'support_tickets')),
        getDocs(collection(db, 'ledger')),
      ]);
      const orders = ordersSnap.docs.map(d => d.data());
      const tickets = ticketsSnap.docs.map(d => d.data());
      const today = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
      const appDoc = await getDoc(doc(db, 'settings', 'app'));
      const appSettings = appDoc.exists() ? appDoc.data() : {};
      setStats({
        retailers: usersSnap.size, orders: ordersSnap.size,
        ordersToday: orders.filter(o => o.date === today).length,
        ordersPending: orders.filter(o => o.status === 'Pending' || o.status === 'Confirmed').length,
        products: productsSnap.size, tickets: ticketsSnap.size,
        ticketsOpen: tickets.filter(t => t.status === 'Open').length,
        ledgerEntries: ledgerSnap.size, maintenance: appSettings.maintenance || false,
        responseTime: Date.now() - start,
      });
      addLog(`Stats fetched in ${Date.now() - start}ms`);
    } catch (err) { addLog(`ERROR: ${err.message}`); }
    setLoading(false);
  };

  const toggleMaintenance = async () => {
    const current = stats?.maintenance || false;
    const ok = await confirm({ title: current ? 'Disable Maintenance' : 'Enable Maintenance', message: current ? 'Bring the app back online for all users?' : 'Take the app offline? All retailers will see maintenance page.', confirmText: current ? 'Bring Online' : 'Take Offline', type: current ? 'warning' : 'critical' });
    if (!ok) return;
    setActionLoading('maintenance');
    try {
      await setDoc(doc(db, 'settings', 'app'), { maintenance: !current }, { merge: true });
      setStats(prev => ({ ...prev, maintenance: !current }));
      addLog(`Maintenance mode ${!current ? 'ON' : 'OFF'}`);
    } catch (err) { addLog(`ERROR: ${err.message}`); }
    setActionLoading('');
  };

  const clearLocalStorage = async () => {
    const ok = await confirm({ title: 'Clear Cache', message: 'Clear all cached data? Your session will be preserved.', confirmText: 'Clear', type: 'warning' });
    if (!ok) return;
    const u = localStorage.getItem('lg_user');
    const phone = sessionStorage.getItem('lg_active_phone');
    const perUser = phone ? localStorage.getItem(`lg_user_${phone}`) : null;
    localStorage.clear();
    if (u) localStorage.setItem('lg_user', u);
    if (phone && perUser) { localStorage.setItem(`lg_user_${phone}`, perUser); localStorage.setItem('lg_last_login', phone); }
    addLog('LocalStorage cleared (kept session)');
  };

  const forceReload = () => { addLog('Force reloading...'); setTimeout(() => window.location.reload(true), 500); };

  const StatCard = ({ icon: Icon, label, value, sub }) => (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={14} className="text-gray-500" />
        <span className="text-[10px] font-bold text-gray-500 uppercase">{label}</span>
      </div>
      <p className="text-2xl font-black text-white">{value}</p>
      {sub && <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white">App Health</h2>
          <p className="text-[10px] text-gray-500 flex items-center gap-1">v{APP_VERSION} • <span className={`w-2 h-2 rounded-full inline-block ${online ? 'bg-green-500' : 'bg-red-500'}`} /> {online ? 'Online' : 'Offline'}</p>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={fetchStats}
          className="p-2.5 bg-gray-800 border border-gray-700 rounded-xl">
          <RefreshCw size={14} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>

      {/* System Status */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
        <p className="text-xs font-bold text-gray-500 uppercase mb-3">System Status</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Firebase</span>
            {stats ? (
              <span className="flex items-center gap-1.5 text-xs font-bold text-green-400"><CheckCircle2 size={12} /> Connected ({stats.responseTime}ms)</span>
            ) : loading ? (
              <span className="text-xs text-gray-500">Checking...</span>
            ) : (
              <span className="flex items-center gap-1.5 text-xs font-bold text-red-400"><AlertTriangle size={12} /> Error</span>
            )}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Network</span>
            <span className={`flex items-center gap-1.5 text-xs font-bold ${online ? 'text-green-400' : 'text-red-400'}`}>
              {online ? <><Wifi size={12} /> Online</> : <><WifiOff size={12} /> Offline</>}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-300">Maintenance</span>
            <span className={`text-xs font-bold ${stats?.maintenance ? 'text-red-400' : 'text-green-400'}`}>
              {stats?.maintenance ? <><span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> ON</> : <><span className="w-2 h-2 rounded-full bg-green-500 inline-block" /> OFF</>}
            </span>
          </div>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 gap-3">
          <StatCard icon={Users} label="Retailers" value={stats.retailers} />
          <StatCard icon={ShoppingCart} label="Orders" value={stats.orders} sub={`${stats.ordersToday} today • ${stats.ordersPending} pending`} />
          <StatCard icon={Package} label="Products" value={stats.products} />
          <StatCard icon={Headphones} label="Tickets" value={stats.tickets} sub={`${stats.ticketsOpen} open`} />
          <StatCard icon={Database} label="Ledger" value={stats.ledgerEntries} sub="entries" />
          <StatCard icon={Clock} label="Response" value={`${stats.responseTime}ms`} sub="firebase latency" />
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
        <p className="text-xs font-bold text-gray-500 uppercase mb-3">Quick Actions</p>
        <div className="grid grid-cols-2 gap-2">
          <motion.button whileTap={{ scale: 0.95 }} onClick={toggleMaintenance} disabled={actionLoading === 'maintenance'}
            className={`py-3 px-3 rounded-xl text-xs font-bold border transition-all ${stats?.maintenance ? 'bg-red-900/30 text-red-400 border-red-800' : 'bg-gray-800 text-gray-300 border-gray-700'} disabled:opacity-50`}>
            {actionLoading === 'maintenance' ? '...' : stats?.maintenance ? 'Disable Maintenance' : 'Enable Maintenance'}
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={forceReload}
            className="py-3 px-3 rounded-xl text-xs font-bold bg-gray-800 text-gray-300 border border-gray-700">
            <RefreshCw size={11} className="inline mr-1" /> Force Reload
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={clearLocalStorage}
            className="py-3 px-3 rounded-xl text-xs font-bold bg-gray-800 text-gray-300 border border-gray-700">
            <Trash2 size={11} className="inline mr-1" /> Clear Cache
          </motion.button>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => addLog('Manual ping OK')}
            className="py-3 px-3 rounded-xl text-xs font-bold bg-gray-800 text-gray-300 border border-gray-700">
            📡 Ping
          </motion.button>
        </div>
      </div>

      {/* Logs */}
      <div className="bg-black rounded-2xl p-4 border border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-gray-500 uppercase">Console</p>
          <button onClick={() => setLogs([])} className="text-[10px] text-gray-600 hover:text-gray-400">Clear</button>
        </div>
        <div className="space-y-1 max-h-[200px] overflow-y-auto font-mono">
          {logs.length > 0 ? logs.map((l, i) => (
            <p key={i} className={`text-[11px] ${l.msg.includes('ERROR') ? 'text-red-400' : 'text-green-400'}`}>
              <span className="text-gray-600">[{l.time}]</span> {l.msg}
            </p>
          )) : (
            <p className="text-[11px] text-gray-700">No logs yet.</p>
          )}
        </div>
      </div>

      {/* App Info */}
      <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
        <p className="text-xs font-bold text-gray-500 uppercase mb-3">App Info</p>
        <div className="space-y-1.5 text-xs text-gray-400">
          <p>Version: <span className="font-bold text-white">{APP_VERSION}</span></p>
          <p>Build: <span className="font-bold text-white">React {React.version}</span></p>
          <p>Screen: <span className="font-bold text-white">{window.innerWidth}x{window.innerHeight}</span></p>
          <p>Memory: <span className="font-bold text-white">{navigator.deviceMemory ? `${navigator.deviceMemory}GB` : 'N/A'}</span></p>
        </div>
      </div>

      {/* Change Dev Access PIN */}
      <DevPinChanger />
    </div>
  );
}

function DevPinChanger() {
  const [newPin, setNewPin] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const confirm = useConfirm();

  const handleSave = async () => {
    if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) { setStatus('PIN must be 4 digits'); return; }
    const ok = await confirm({ title: 'Change Dev PIN', message: `Change developer access PIN to ${newPin}? You will need this PIN next time you enter Dev Console.`, confirmText: 'Change PIN', type: 'warning' });
    if (!ok) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'devAccess'), { pin: newPin }, { merge: true });
      setStatus('Done — Dev PIN updated!'); setNewPin('');
      // Clear current session so new PIN takes effect next time
      sessionStorage.removeItem('lg_dev_verified');
    } catch (e) { setStatus('❌ Failed to update'); }
    setSaving(false);
    setTimeout(() => setStatus(''), 3000);
  };

  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 p-4">
      <div className="flex items-center gap-2 mb-3">
        <KeyRound size={14} className="text-green-400" />
        <p className="text-xs font-bold text-gray-500 uppercase">Dev Access PIN</p>
      </div>
      <p className="text-[10px] text-gray-600 mb-3">Change the PIN required to enter Developer Console</p>
      <div className="flex gap-2">
        <input type="tel" maxLength={4} value={newPin} onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
          placeholder="New 4-digit PIN" className="flex-1 py-2 px-3 text-sm bg-black border border-gray-700 rounded-xl text-white font-mono tracking-widest focus:outline-none focus:border-green-600" />
        <motion.button whileTap={{ scale: 0.95 }} onClick={handleSave} disabled={saving || newPin.length !== 4}
          className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-xl disabled:opacity-40">
          {saving ? '...' : 'Save'}
        </motion.button>
      </div>
      {status && <p className="text-[10px] mt-2 font-semibold text-green-400">{status}</p>}
    </div>
  );
}
