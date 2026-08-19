import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, RefreshCw, LogOut, Smartphone, Clock, Wifi, Shield, Search, X, Check } from 'lucide-react';
import { db, collection, getDocs, doc, updateDoc, query, where } from '../../services/firebase';
import { useConfirm } from '../../components/ConfirmModal';

function parseDevice(ua) {
  if (!ua) return 'Unknown';
  if (ua.includes('iPhone')) return 'iPhone';
  if (ua.includes('iPad')) return 'iPad';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('Windows')) return 'Windows PC';
  if (ua.includes('Mac')) return 'Mac';
  if (ua.includes('Linux')) return 'Linux';
  return 'Unknown';
}

function parseBrowser(ua) {
  if (!ua) return '';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Edg')) return 'Edge';
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Safari')) return 'Safari';
  return '';
}

function timeAgo(dateStr) {
  if (!dateStr) return 'Never';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function Sessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [killing, setKilling] = useState('');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const confirm = useConfirm();

  useEffect(() => { fetchSessions(); }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const retSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'retailer')));
      const list = retSnap.docs.map(d => ({ phone: d.id, ...d.data() }));
      const adminSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'admin')));
      adminSnap.docs.forEach(d => list.push({ phone: d.id, ...d.data() }));

      list.sort((a, b) => {
        const aActive = isActive(a);
        const bActive = isActive(b);
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;
        return (b.lastLogin || '').localeCompare(a.lastLogin || '');
      });
      setSessions(list);
    } catch (err) {}
    setLoading(false);
  };

  const isActive = (s) => s.activeSession && s.sessionExpiry && new Date(s.sessionExpiry) > new Date();

  const forceLogout = async (phone, name) => {
    const ok = await confirm({ title: 'Force Logout', message: `Terminate session for "${name || phone}"? They will need to login again.`, confirmText: 'Logout', type: 'danger' });
    if (!ok) return;
    setKilling(phone);
    try {
      await updateDoc(doc(db, 'users', phone), { activeSession: '', sessionExpiry: '' });
      setSessions(prev => prev.map(s => s.phone === phone ? { ...s, activeSession: '', sessionExpiry: '' } : s));
      setToast(`${name || phone} logged out`);
      setTimeout(() => setToast(''), 2500);
    } catch (err) {}
    setKilling('');
  };

  const handleUnblock = async (phone, name) => {
    const ok = await confirm({ title: 'Unblock Account', message: `Unblock "${name || phone}"? They will be able to login again.`, confirmText: 'Unblock', type: 'warning' });
    if (!ok) return;
    setKilling(phone);
    try {
      await updateDoc(doc(db, 'users', phone), { blocked: false, blockedAt: null, blockReason: null, loginAttempts: 0, lockUntil: null, lockTier: 0 });
      setSessions(prev => prev.map(s => s.phone === phone ? { ...s, blocked: false } : s));
      setToast(`${name || phone} unblocked`);
      setTimeout(() => setToast(''), 2500);
    } catch (err) {}
    setKilling('');
  };

  const handleResetPin = async (phone, name) => {
    const ok = await confirm({ title: 'Reset PIN', message: `Reset PIN for "${name || phone}" to default 1234?`, confirmText: 'Reset', type: 'warning' });
    if (!ok) return;
    setKilling(phone);
    try {
      await updateDoc(doc(db, 'users', phone), { pin: '1234', loginAttempts: 0, lockUntil: null, lockTier: 0 });
      setToast(`PIN reset to 1234 for ${name || phone}`);
      setTimeout(() => setToast(''), 2500);
    } catch (err) {}
    setKilling('');
  };

  const activeCount = sessions.filter(isActive).length;
  const filtered = sessions.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return s.name?.toLowerCase().includes(q) || s.phone?.includes(q) || s.area?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <AnimatePresence>{toast && (<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-[4.5rem] left-4 right-4 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:w-auto z-[100] flex items-center justify-center gap-2 px-4 py-3 rounded-2xl shadow-xl bg-mint-50 dark:bg-mint-900/80 border border-mint-200 dark:border-mint-700 text-mint-800 dark:text-mint-200 backdrop-blur-sm"><Check size={14} strokeWidth={3} /><span className="text-sm font-bold">{toast}</span></motion.div>)}</AnimatePresence>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-green-600">{activeCount}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Active Now</p>
        </div>
        <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-gray-700 dark:text-gray-200">{sessions.filter(s => !isActive(s) && s.lastLogin).length}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Inactive</p>
        </div>
        <div className="bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-2xl p-4 text-center">
          <p className="text-2xl font-black text-gray-400">{sessions.filter(s => !s.lastLogin).length}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">Never Logged</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Search name, phone..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 text-sm bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-xl outline-none focus:border-royal-300 dark:text-white" />
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 bg-gray-200 dark:bg-[#222222] rounded-full flex items-center justify-center"><X size={10} className="text-gray-500" /></button>}
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={fetchSessions}
          className="p-2.5 bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-xl hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
          <RefreshCw size={14} className={`text-gray-500 ${loading ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>

      {/* Session List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-100 dark:bg-[#111111] rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((s, i) => {
            const active = isActive(s);
            const device = s.lastLoginDevice || parseDevice(s.deviceInfo || s.lastDevice);
            const browser = parseBrowser(s.deviceInfo || s.lastDevice);
            return (
              <motion.div key={s.phone} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 * i }}
                className={`bg-white dark:bg-[#111111] rounded-2xl border p-4 ${active ? 'border-green-200 dark:border-green-800/50' : 'border-gray-200 dark:border-[#222222]'}`}>
                {/* Top row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {/* Status dot */}
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.blocked ? 'bg-red-500' : active ? 'bg-green-500 animate-pulse' : 'bg-gray-300 dark:bg-[#222222]'}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-bold text-gray-800 dark:text-white truncate">{s.name || 'Unknown'}</p>
                        {s.role === 'admin' && <span className="text-[8px] font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">ADMIN</span>}
                        {s.blocked && <span className="text-[8px] font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800">BLOCKED</span>}
                        {!s.blocked && active && <span className="text-[8px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded border border-green-200 dark:border-green-800">ONLINE</span>}
                      </div>
                      <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{s.phone} • {s.area || 'No area'}</p>
                    </div>
                  </div>

                  {/* Force logout */}
                  {active && !s.blocked && (
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => forceLogout(s.phone, s.name)} disabled={killing === s.phone}
                      className="px-3 py-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg disabled:opacity-50 shrink-0 flex items-center gap-1.5">
                      {killing === s.phone ? (
                        <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-3 h-3 border-2 border-red-300 border-t-red-600 rounded-full" />
                      ) : (
                        <><LogOut size={11} className="text-red-500" /><span className="text-[10px] font-bold text-red-500 hidden sm:inline">Logout</span></>
                      )}
                    </motion.button>
                  )}
                  {s.blocked && (
                    <div className="flex items-center gap-1.5">
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleResetPin(s.phone, s.name)} disabled={killing === s.phone}
                        className="px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg disabled:opacity-50 shrink-0 flex items-center gap-1.5">
                        <Shield size={11} className="text-amber-600" /><span className="text-[10px] font-bold text-amber-600 hidden sm:inline">Reset PIN</span>
                      </motion.button>
                      <motion.button whileTap={{ scale: 0.9 }} onClick={() => handleUnblock(s.phone, s.name)} disabled={killing === s.phone}
                        className="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg disabled:opacity-50 shrink-0 flex items-center gap-1.5">
                        <Shield size={11} className="text-green-600" /><span className="text-[10px] font-bold text-green-600 hidden sm:inline">Unblock</span>
                      </motion.button>
                    </div>
                  )}
                </div>

                {/* Details row */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2.5 text-[10px] text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {timeAgo(s.lastLogin)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Smartphone size={10} />
                    {device}{browser ? ` • ${browser}` : ''}
                  </span>
                  {active && s.sessionExpiry && (
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <Wifi size={10} />
                      Expires {timeAgo(new Date(Date.now() - (new Date(s.sessionExpiry).getTime() - Date.now())).toISOString()).replace(' ago', '')}
                    </span>
                  )}
                </div>

                {/* Login timestamp */}
                {s.lastLogin && (
                  <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-1.5">
                    Last: {new Date(s.lastLogin).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Force Logout All */}
      {activeCount > 1 && (
        <motion.button whileTap={{ scale: 0.97 }} onClick={async () => {
          const ok = await confirm({ title: 'Logout All Users', message: `Force logout all ${activeCount} active users? Everyone will need to login again.`, confirmText: 'Logout All', type: 'danger' });
          if (!ok) return;
          setKilling('all');
          for (const s of sessions.filter(isActive)) {
            await updateDoc(doc(db, 'users', s.phone), { activeSession: '', sessionExpiry: '' });
          }
          fetchSessions();
          setKilling('');
          setToast('All users logged out');
          setTimeout(() => setToast(''), 2500);
        }} disabled={killing === 'all'}
          className="w-full py-3 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 disabled:opacity-50">
          {killing === 'all' ? 'Logging out everyone...' : `Force Logout All (${activeCount} active)`}
        </motion.button>
      )}

      {filtered.length === 0 && !loading && (
        <div className="text-center py-12">
          <Users size={32} className="text-gray-200 dark:text-[#444444] mx-auto mb-3" />
          <p className="text-sm text-gray-400">No users found</p>
        </div>
      )}
    </div>
  );
}
