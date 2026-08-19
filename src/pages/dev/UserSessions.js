import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, RefreshCw, LogOut, Smartphone, Clock, Wifi, WifiOff, Shield, AlertTriangle } from 'lucide-react';
import { db, collection, getDocs, doc, updateDoc, query, where } from '../../services/firebase';
import { useConfirm } from '../../components/ConfirmModal';

export default function UserSessions() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [killing, setKilling] = useState('');
  const confirm = useConfirm();

  useEffect(() => { fetchSessions(); }, []);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'retailer')));
      const list = snap.docs.map(d => ({ phone: d.id, ...d.data() }));
      // Also get admin
      const adminSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'admin')));
      adminSnap.docs.forEach(d => list.push({ phone: d.id, ...d.data() }));
      
      list.sort((a, b) => {
        const aActive = a.activeSession && a.sessionExpiry && new Date(a.sessionExpiry) > new Date();
        const bActive = b.activeSession && b.sessionExpiry && new Date(b.sessionExpiry) > new Date();
        if (aActive && !bActive) return -1;
        if (!aActive && bActive) return 1;
        return (b.lastLogin || '').localeCompare(a.lastLogin || '');
      });
      setSessions(list);
    } catch (err) {}
    setLoading(false);
  };

  const forceLogout = async (phone) => {
    const ok = await confirm({ title: 'Force Logout', message: `Force logout ${phone}? Their session will be terminated immediately.`, confirmText: 'Logout', type: 'danger' });
    if (!ok) return;
    setKilling(phone);
    try {
      await updateDoc(doc(db, 'users', phone), { activeSession: '', sessionExpiry: '', sessions: [] });
      setSessions(prev => prev.map(s => s.phone === phone ? { ...s, activeSession: '', sessionExpiry: '', sessions: [] } : s));
    } catch (err) {}
    setKilling('');
  };

  const endSingleSession = async (phone, sessionId) => {
    const ok = await confirm({ title: 'End Session', message: `End this specific session for ${phone}?`, confirmText: 'End', type: 'warning' });
    if (!ok) return;
    try {
      const userDoc = await getDocs(query(collection(db, 'users'), where('__name__', '==', phone)));
      if (!userDoc.empty) {
        const data = userDoc.docs[0].data();
        const sessions = (data.sessions || []).filter(s => s.sessionId !== sessionId);
        await updateDoc(doc(db, 'users', phone), { sessions });
        setSessions(prev => prev.map(s => s.phone === phone ? { ...s, sessions } : s));
      }
    } catch (e) {}
  };

  const isActive = (s) => {
    // Admin with sessions array
    if (s.role === 'admin' && s.sessions?.length > 0) {
      return s.sessions.some(sess => new Date(sess.expiresAt) > new Date());
    }
    return s.activeSession && s.sessionExpiry && new Date(s.sessionExpiry) > new Date();
  };

  const getAdminSessionCount = (s) => {
    if (s.role !== 'admin' || !s.sessions?.length) return 0;
    return s.sessions.filter(sess => new Date(sess.expiresAt) > new Date()).length;
  };

  const activeCount = sessions.filter(isActive).length;
  const timeAgo = (dateStr) => {
    if (!dateStr) return 'Never';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const parseDevice = (ua) => {
    if (!ua) return 'Unknown';
    if (ua.includes('iPhone')) return 'iPhone';
    if (ua.includes('iPad')) return 'iPad';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('Windows')) return 'Windows PC';
    if (ua.includes('Mac')) return 'Mac';
    if (ua.includes('Linux')) return 'Linux';
    return 'Unknown';
  };

  const parseBrowser = (ua) => {
    if (!ua) return 'Unknown';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Edg')) return 'Edge';
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Safari')) return 'Safari';
    return 'Browser';
  };

  const parseOS = (ua) => {
    if (!ua) return 'Unknown';
    if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('Windows')) return 'Windows';
    if (ua.includes('Mac')) return 'macOS';
    if (ua.includes('Linux')) return 'Linux';
    return 'Unknown';
  };

  const getDevice = (ua) => parseDevice(ua);

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-extrabold text-white">User Sessions</h2>
          <p className="text-[10px] text-gray-500">{activeCount} active now • {sessions.length} total users</p>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={fetchSessions}
          className="p-2.5 bg-gray-800 border border-gray-700 rounded-xl">
          <RefreshCw size={14} className={`text-gray-400 ${loading ? 'animate-spin' : ''}`} />
        </motion.button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-green-900/20 border border-green-800/50 rounded-xl p-3 text-center">
          <p className="text-lg font-black text-green-400">{activeCount}</p>
          <p className="text-[9px] font-bold text-green-500/70 uppercase">Active</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 text-center">
          <p className="text-lg font-black text-gray-300">{sessions.filter(s => !isActive(s) && s.lastLogin).length}</p>
          <p className="text-[9px] font-bold text-gray-500 uppercase">Inactive</p>
        </div>
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 text-center">
          <p className="text-lg font-black text-gray-300">{sessions.filter(s => !s.lastLogin).length}</p>
          <p className="text-[9px] font-bold text-gray-500 uppercase">Never Logged</p>
        </div>
      </div>

      {/* Session List */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4].map(i => <div key={i} className="h-20 bg-gray-800 rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((s, i) => {
            const active = isActive(s);
            return (
              <motion.div key={s.phone} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.02 * i }}
                className={`rounded-2xl border p-4 ${active ? 'bg-green-900/10 border-green-800/50' : 'bg-gray-900/50 border-gray-800'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="text-[9px] font-bold text-gray-600 bg-gray-800 w-5 h-5 rounded-md flex items-center justify-center shrink-0">{i + 1}</span>
                    {/* Status dot */}
                    <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${active ? 'bg-green-400 animate-pulse' : 'bg-gray-600'}`} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-white truncate">{s.name || 'Unknown'}</p>
                        {s.role === 'admin' && <span className="text-[8px] font-bold bg-amber-900/50 text-amber-400 px-1.5 py-0.5 rounded border border-amber-700">ADMIN</span>}
                        {s.role === 'admin' && getAdminSessionCount(s) > 1 && <span className="text-[8px] font-bold bg-blue-900/50 text-blue-400 px-1.5 py-0.5 rounded border border-blue-700">{getAdminSessionCount(s)} devices</span>}
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5">{s.phone} • {s.area || 'No area'}</p>
                    </div>
                  </div>

                  {/* Force logout button */}
                  {active && (
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => forceLogout(s.phone)} disabled={killing === s.phone}
                      className="p-2 bg-red-900/30 border border-red-800 rounded-lg disabled:opacity-50 shrink-0 ml-2">
                      {killing === s.phone ? (
                        <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-3.5 h-3.5 border-2 border-red-300 border-t-red-600 rounded-full" />
                      ) : (
                        <LogOut size={12} className="text-red-400" />
                      )}
                    </motion.button>
                  )}
                </div>

                {/* Details row */}
                <div className="flex items-center gap-4 mt-2.5 text-[10px] text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock size={10} />
                    {timeAgo(s.lastLogin)}
                  </span>
                  <span className="flex items-center gap-1">
                    <Smartphone size={10} />
                    {getDevice(s.deviceInfo || s.lastDevice)}
                  </span>
                  {active && s.sessionExpiry && (
                    <span className="flex items-center gap-1 text-green-500">
                      <Wifi size={10} />
                      Expires {timeAgo(new Date(Date.now() - (new Date(s.sessionExpiry).getTime() - Date.now())).toISOString()).replace(' ago', '')}
                    </span>
                  )}
                </div>

                {/* Admin multi-session details */}
                {s.role === 'admin' && s.sessions?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {s.sessions.filter(sess => new Date(sess.expiresAt) > new Date()).map((sess, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[9px] text-gray-500 bg-gray-800/50 border border-gray-700/50 rounded-lg px-2 py-1.5">
                        <Smartphone size={9} className="text-green-500" />
                        <span className="text-gray-400 flex-1">{sess.browser} · {sess.os} · {sess.device}</span>
                        <span className="text-gray-600">{new Date(sess.loginAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        <button onClick={() => endSingleSession(s.phone, sess.sessionId)}
                          className="ml-1 px-1.5 py-0.5 text-[8px] font-bold text-red-400 bg-red-900/30 border border-red-800/50 rounded hover:bg-red-900/60 transition-colors">
                          End
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {/* Full device details */}
                {(s.deviceInfo || s.lastLoginDevice) && (
                  <div className="flex flex-wrap items-center gap-2 mt-2 text-[9px] text-gray-600">
                    {s.lastLoginDevice && <span className="bg-gray-800 border border-gray-700 px-1.5 py-0.5 rounded">{s.lastLoginDevice}</span>}
                    {s.deviceInfo && <span className="bg-gray-800 border border-gray-700 px-1.5 py-0.5 rounded">{parseBrowser(s.deviceInfo)}</span>}
                    {s.deviceInfo && <span className="bg-gray-800 border border-gray-700 px-1.5 py-0.5 rounded">{parseOS(s.deviceInfo)}</span>}
                  </div>
                )}
                {s.lastLogin && (
                  <p className="text-[9px] text-gray-600 mt-1.5">Login: {new Date(s.lastLogin).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}</p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Force Logout All */}
      {activeCount > 1 && (
        <motion.button whileTap={{ scale: 0.97 }} onClick={async () => {
          const ok = await confirm({ title: 'Force Logout All', message: `Terminate all ${activeCount} active sessions? Every online user will be kicked out immediately.`, confirmText: 'Logout All', type: 'critical' });
          if (!ok) return;
          setKilling('all');
          for (const s of sessions.filter(isActive)) {
            await updateDoc(doc(db, 'users', s.phone), { activeSession: '', sessionExpiry: '', sessions: [] });
          }
          fetchSessions();
          setKilling('');
        }} disabled={killing === 'all'}
          className="w-full py-3 rounded-xl text-xs font-bold text-red-400 bg-red-900/20 border border-red-800 disabled:opacity-50">
          {killing === 'all' ? 'Logging out everyone...' : <><AlertTriangle size={12} className="inline text-red-500" /> Force Logout All ({activeCount} users)</>}
        </motion.button>
      )}
    </div>
  );
}
