import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Check, AlertCircle, Monitor, Smartphone, ChevronRight, X, Shield, Clock, Phone, Truck, Heart, MapPin, Lock, Radio, Users, Save, LogOut, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import useDarkMode from '../../hooks/useDarkMode';
import { useFontSize } from '../../hooks/useFontSize';
import { db, doc, getDoc, updateDoc, setDoc } from '../../services/firebase';
import { APP_CONFIG } from '../../utils/config';
import { useConfirm } from '../../components/ConfirmModal';

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 2500); return () => clearTimeout(t); }, [onClose]);
  return (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
      className={`fixed top-[4.5rem] left-4 right-4 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:w-auto z-[100] flex items-center justify-center gap-2 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-sm ${
        type === 'success' ? 'bg-mint-50 dark:bg-mint-900/80 border-mint-200 dark:border-mint-700 text-mint-800 dark:text-mint-200' : 'bg-red-50 dark:bg-red-900/80 border-red-200 dark:border-red-700 text-red-700 dark:text-red-200'
      }`}>
      {type === 'success' ? <Check size={14} strokeWidth={3} /> : <AlertCircle size={14} />}
      <span className="text-sm font-bold">{message}</span>
    </motion.div>
  );
}

function Toggle({ enabled, onToggle }) {
  return (
    <motion.button whileTap={{ scale: 0.9 }} onClick={onToggle}
      className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-300 ${enabled ? 'bg-gradient-to-r from-royal-600 to-mint-500' : 'bg-gray-200 dark:bg-[#222222]'}`}>
      <motion.div className="w-5 h-5 bg-white rounded-full shadow-md"
        animate={{ x: enabled ? 20 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
    </motion.button>
  );
}

function PinModal({ onClose, onSuccess, onError }) {
  const [step, setStep] = useState('current');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [oldPinFromDb, setOldPinFromDb] = useState('');
  const [pinAttempts, setPinAttempts] = useState(0);
  const [pinLockUntil, setPinLockUntil] = useState(0);
  const [pinCountdown, setPinCountdown] = useState(0);
  const [pinLockTier, setPinLockTier] = useState(0);

  useEffect(() => {
    const stored = localStorage.getItem('lg_changepin_lock');
    if (stored) {
      const { until, count, tier } = JSON.parse(stored);
      if (until > Date.now()) { setPinLockUntil(until); setPinAttempts(count); setPinLockTier(tier || 0); }
      else { localStorage.removeItem('lg_changepin_lock'); setPinLockTier(JSON.parse(stored).tier || 0); }
    }
  }, []);

  useEffect(() => {
    if (pinLockUntil <= Date.now()) { setPinCountdown(0); return; }
    const tick = () => {
      const remaining = Math.ceil((pinLockUntil - Date.now()) / 1000);
      if (remaining <= 0) { setPinCountdown(0); setPinLockUntil(0); setPinAttempts(0); setError(''); localStorage.removeItem('lg_changepin_lock'); }
      else setPinCountdown(remaining);
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, [pinLockUntil]);

  const reset = () => { setStep('current'); setCurrentPin(''); setNewPin(''); setConfirmPin(''); setError(''); setSaving(false); };

  const handleDigit = (digit) => {
    setError('');
    if (step === 'current' && currentPin.length < 4) { const v = currentPin + digit; setCurrentPin(v); if (v.length === 4) setTimeout(() => verifyCurrentPin(v), 200); }
    else if (step === 'new' && newPin.length < 4) { const v = newPin + digit; setNewPin(v); if (v.length === 4) setTimeout(() => validateNewPin(v), 200); }
    else if (step === 'confirm' && confirmPin.length < 4) { const v = confirmPin + digit; setConfirmPin(v); if (v.length === 4) setTimeout(() => confirmAndSave(v), 200); }
  };

  const handleDelete = () => { setError(''); if (step === 'current') setCurrentPin(p => p.slice(0, -1)); else if (step === 'new') setNewPin(p => p.slice(0, -1)); else setConfirmPin(p => p.slice(0, -1)); };

  const verifyCurrentPin = async (pin) => {
    if (pinLockUntil > Date.now()) { setError(`Locked. Wait ${Math.ceil((pinLockUntil - Date.now()) / 1000)}s`); setCurrentPin(''); return; }
    try {
      const user = JSON.parse(localStorage.getItem('lg_user') || '{}');
      const snap = await getDoc(doc(db, 'users', user.phone));
      const firebasePin = snap.exists() ? snap.data().pin : '1234';
      setOldPinFromDb(firebasePin);
      if (pin === firebasePin) { setStep('new'); setPinAttempts(0); localStorage.removeItem('lg_changepin_lock'); }
      else {
        const newCount = pinAttempts + 1; setPinAttempts(newCount); setCurrentPin('');
        if (newCount >= 3) {
          const newTier = pinLockTier + 1; setPinLockTier(newTier);
          const durations = [60, 300, -1]; const duration = durations[Math.min(newTier - 1, durations.length - 1)];
          if (duration === -1) { localStorage.removeItem('lg_changepin_lock'); const phone = sessionStorage.getItem('lg_active_phone'); if (phone) localStorage.removeItem(`lg_user_${phone}`); localStorage.removeItem('lg_user'); sessionStorage.removeItem('lg_active_phone'); window.location.reload(); return; }
          const until = Date.now() + duration * 1000; setPinLockUntil(until); setPinAttempts(0);
          localStorage.setItem('lg_changepin_lock', JSON.stringify({ until, count: 0, tier: newTier }));
          setError(`Too many attempts. Locked for ${duration >= 60 ? `${Math.floor(duration / 60)} min` : `${duration}s`}.`);
        } else { localStorage.setItem('lg_changepin_lock', JSON.stringify({ until: 0, count: newCount, tier: pinLockTier })); setError(`Incorrect PIN (${3 - newCount} left)`); }
      }
    } catch (err) { setError('Network error'); setCurrentPin(''); }
  };

  const validateNewPin = (pin) => {
    if (pin === oldPinFromDb) { setError('Same as old PIN'); setNewPin(''); return; }
    if (/^(\d)\1{3}$/.test(pin) || '0123456789'.includes(pin) || '9876543210'.includes(pin)) { setError('PIN too simple'); setNewPin(''); return; }
    setStep('confirm');
  };

  const confirmAndSave = async (pin) => {
    if (pin !== newPin) { setError('PINs do not match'); setConfirmPin(''); return; }
    setSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem('lg_user') || '{}');
      if (user.phone) { await updateDoc(doc(db, 'users', user.phone), { pin: newPin }); user.pin = newPin; localStorage.setItem('lg_user', JSON.stringify(user)); localStorage.setItem(`lg_user_${user.phone}`, JSON.stringify(user)); }
      onSuccess(); onClose(); reset();
    } catch (err) { setSaving(false); onError?.(); onClose(); reset(); }
  };

  const titles = { current: 'Enter Current PIN', new: 'Create New PIN', confirm: 'Confirm New PIN' };
  const value = step === 'current' ? currentPin : step === 'new' ? newPin : confirmPin;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => { onClose(); reset(); }}>
      <motion.div initial={{ scale: 0.92, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 20 }}
        className="bg-white dark:bg-[#111111] rounded-3xl p-6 w-full max-w-xs shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-gray-800 dark:text-white">{titles[step]}</h3>
          <button onClick={() => { onClose(); reset(); }} className="w-7 h-7 bg-gray-100 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center text-gray-400"><X size={14} /></button>
        </div>
        <div className="flex justify-center gap-2 mb-4">
          {['current', 'new', 'confirm'].map((s, i) => (<div key={s} className={`h-1 rounded-full transition-all ${step === s ? 'w-6 bg-royal-600' : i < ['current', 'new', 'confirm'].indexOf(step) ? 'w-4 bg-mint-500' : 'w-4 bg-gray-200 dark:bg-[#222222]'}`} />))}
        </div>
        <div className="flex justify-center gap-4 my-5">
          {[0,1,2,3].map(i => (<div key={i} className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${i < value.length ? 'bg-royal-600 border-royal-600' : 'border-gray-200 dark:border-[#333333]'}`} />))}
        </div>
        {error && <p className="text-[11px] text-red-500 font-semibold text-center mb-3">{error}</p>}
        {pinCountdown > 0 && <div className="mb-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-center"><p className="text-[10px] font-bold text-red-600"><Lock size={10} className="inline" /> {pinCountdown}s</p></div>}
        {saving && <div className="flex justify-center mb-3"><div className="w-5 h-5 border-2 border-royal-200 border-t-royal-600 rounded-full animate-spin" /></div>}
        <div className="grid grid-cols-3 gap-2">
          {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((num, i) => (
            <motion.button key={i} whileTap={num !== '' ? { scale: 0.85 } : {}} onClick={() => { if (num === '⌫') handleDelete(); else if (num !== '') handleDigit(String(num)); }} disabled={saving}
              className={`h-12 rounded-xl font-bold text-lg transition-all ${num === '' ? 'invisible' : num === '⌫' ? 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-500 text-sm' : 'bg-gray-50 dark:bg-[#1a1a1a] text-gray-800 dark:text-white active:bg-royal-100'} ${saving ? 'opacity-50' : ''}`}>
              {num}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- Row component for consistent styling ---
function SettingRow({ icon: Icon, iconColor = 'text-gray-500', label, description, children, onClick }) {
  return (
    <div onClick={onClick} className={`flex items-center justify-between py-3.5 px-4 ${onClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-[#1a1a1a]/50 transition-colors' : ''}`}>
      <div className="flex items-center gap-3 min-w-0">
        <Icon size={18} className={iconColor} />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 dark:text-white">{label}</p>
          {description && <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="shrink-0 ml-3">{children}</div>
    </div>
  );
}

function SessionCard({ current, session, onLogout }) {
  const DeviceIcon = session.device === 'Android' || session.device === 'iPhone' ? Smartphone : Monitor;
  const formatTime = (iso) => {
    if (!iso) return '—';
    const d = new Date(iso);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };
  return (
    <div className={`px-4 py-3 ${current ? 'bg-green-50/50 dark:bg-green-900/10' : ''}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${current ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-[#1a1a1a]'}`}>
            <DeviceIcon size={15} className={current ? 'text-green-600 dark:text-green-400' : 'text-gray-500'} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-xs font-bold text-gray-800 dark:text-white">{session.browser} · {session.os}</p>
              {current && <span className="text-[9px] font-bold bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400 px-1.5 py-0.5 rounded-full">This Device</span>}
              {current && <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />}
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{session.device} · Login: {formatTime(session.loginAt)}</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">Expires: {formatTime(session.expiresAt)}</p>
          </div>
        </div>
        <button onClick={onLogout} className="shrink-0 flex items-center gap-1 text-[10px] font-bold text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 px-2 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-800/50 transition-colors">
          <LogOut size={10} /> {current ? 'Logout' : 'End'}
        </button>
      </div>
    </div>
  );
}

export default function AdminSettings() {
  const navigate = useNavigate();
  const [isDark, toggleDark] = useDarkMode();
  const { size: fontSize, setSize: setFontSize, SIZES, LABELS } = useFontSize();
  const confirm = useConfirm();
  const [toast, setToast] = useState(null);
  const [pinModal, setPinModal] = useState(false);
  const [maintenance, setMaintenance] = useState(false);
  const [orderStart, setOrderStart] = useState(12);
  const [orderEnd, setOrderEnd] = useState(16);
  const [deliveryStart, setDeliveryStart] = useState(6);
  const [deliveryEnd, setDeliveryEnd] = useState(12);
  const [shopPhone, setShopPhone] = useState('9939079107');
  const [sessionTimeout, setSessionTimeout] = useState(24);
  const [minOrderAmount, setMinOrderAmount] = useState(0);
  const [defaultPin, setDefaultPin] = useState('1234');
  const [allowModify, setAllowModify] = useState(true);
  const [maxOrderItems, setMaxOrderItems] = useState(0);
  const [saving, setSaving] = useState(false);
  const [activeSessionCount, setActiveSessionCount] = useState(0);
  const [adminSessions, setAdminSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const mDoc = await getDoc(doc(db, 'settings', 'app'));
        if (mDoc.exists()) {
          const d = mDoc.data();
          setMaintenance(d.maintenance || false);
          if (d.orderStart !== undefined) setOrderStart(d.orderStart);
          if (d.orderEnd !== undefined) setOrderEnd(d.orderEnd);
          if (d.deliveryStart !== undefined) setDeliveryStart(d.deliveryStart);
          if (d.deliveryEnd !== undefined) setDeliveryEnd(d.deliveryEnd);
          if (d.shopPhone) setShopPhone(d.shopPhone);
          if (d.sessionTimeout) setSessionTimeout(d.sessionTimeout);
          if (d.minOrderAmount !== undefined) setMinOrderAmount(d.minOrderAmount);
          if (d.defaultPin) setDefaultPin(d.defaultPin);
          if (d.allowModify !== undefined) setAllowModify(d.allowModify);
          if (d.maxOrderItems !== undefined) setMaxOrderItems(d.maxOrderItems);
        }
      } catch (e) {}
      // Session count
      try {
        const { getDocs, query, where, collection } = await import('../../services/firebase');
        const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'retailer')));
        setActiveSessionCount(snap.docs.filter(d => { const x = d.data(); return x.activeSession && x.sessionExpiry && new Date(x.sessionExpiry) > new Date(); }).length);
      } catch (e) {}
      // Load admin sessions
      try {
        const user = JSON.parse(localStorage.getItem('lg_user') || '{}');
        if (user.phone) {
          const userDoc = await getDoc(doc(db, 'users', user.phone));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const sessions = (data.sessions || []).filter(s => new Date(s.expiresAt) > new Date());
            setAdminSessions(sessions);
          }
        }
      } catch (e) {}
      setSessionsLoading(false);
    })();
  }, []);

  const saveSettings = async () => {
    const ok = await confirm({ title: 'Save Settings', message: 'Save all changes? This will affect order timing, delivery window, and session timeout for all users.', confirmText: 'Save', type: 'info' });
    if (!ok) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'app'), { orderStart, orderEnd, deliveryStart, deliveryEnd, shopPhone, sessionTimeout, minOrderAmount: Number(minOrderAmount) || 0, defaultPin, allowModify, maxOrderItems: Number(maxOrderItems) || 0 }, { merge: true });
      setToast({ message: 'Settings saved', type: 'success' });
    } catch (e) { setToast({ message: 'Failed to save', type: 'error' }); }
    setSaving(false);
  };

  const toggleMaintenance = async () => {
    const ok = await confirm({ title: maintenance ? 'Go Live' : 'Enable Maintenance', message: maintenance ? 'Make site live for all retailers?' : 'Block all retailers from accessing the site?', confirmText: maintenance ? 'Go Live' : 'Enable', type: maintenance ? 'success' : 'warning' });
    if (!ok) return;
    const newVal = !maintenance;
    try { await setDoc(doc(db, 'settings', 'app'), { maintenance: newVal }, { merge: true }); setMaintenance(newVal); setToast({ message: newVal ? 'Maintenance ON' : 'Site is live', type: 'success' }); } catch (e) {}
  };

  const getCurrentSessionFallback = () => {
    const user = JSON.parse(localStorage.getItem('lg_user') || '{}');
    const ua = navigator.userAgent || '';
    return {
      sessionId: user.sessionId || 'current',
      device: ua.includes('iPhone') ? 'iPhone' : ua.includes('Android') ? 'Android' : ua.includes('Windows') ? 'Windows PC' : ua.includes('Mac') ? 'Mac' : 'Linux',
      browser: ua.includes('Firefox') ? 'Firefox' : ua.includes('Edg') ? 'Edge' : ua.includes('Chrome') ? 'Chrome' : ua.includes('Safari') ? 'Safari' : 'Other',
      os: ua.includes('Android') ? 'Android' : ua.includes('iPhone') ? 'iOS' : ua.includes('Windows') ? 'Windows' : ua.includes('Mac') ? 'macOS' : ua.includes('Linux') ? 'Linux' : 'Unknown',
      loginAt: user.sessionExpiry ? new Date(new Date(user.sessionExpiry).getTime() - sessionTimeout * 60 * 60 * 1000).toISOString() : new Date().toISOString(),
      expiresAt: user.sessionExpiry || new Date(Date.now() + sessionTimeout * 60 * 60 * 1000).toISOString(),
    };
  };

  const endSession = async (sessionId) => {
    const ok = await confirm({ title: 'End Session', message: 'End this session? The device will be logged out.', confirmText: 'End Session', type: 'warning' });
    if (!ok) return;
    try {
      const user = JSON.parse(localStorage.getItem('lg_user') || '{}');
      const userDoc = await getDoc(doc(db, 'users', user.phone));
      if (userDoc.exists()) {
        const sessions = (userDoc.data().sessions || []).filter(s => s.sessionId !== sessionId);
        await updateDoc(doc(db, 'users', user.phone), { sessions });
        setAdminSessions(sessions.filter(s => new Date(s.expiresAt) > new Date()));
        setToast({ message: 'Session ended', type: 'success' });
      }
    } catch (e) { setToast({ message: 'Failed to end session', type: 'error' }); }
  };

  const logoutThisDevice = async () => {
    const ok = await confirm({ title: 'Logout', message: 'Logout from this device?', confirmText: 'Logout', type: 'danger' });
    if (!ok) return;
    try {
      const user = JSON.parse(localStorage.getItem('lg_user') || '{}');
      if (user.phone) {
        const userDoc = await getDoc(doc(db, 'users', user.phone));
        if (userDoc.exists()) {
          const sessions = (userDoc.data().sessions || []).filter(s => s.sessionId !== user.sessionId);
          await updateDoc(doc(db, 'users', user.phone), { sessions });
        }
      }
    } catch (e) {}
    const phone = sessionStorage.getItem('lg_active_phone'); if (phone) localStorage.removeItem(`lg_user_${phone}`); localStorage.removeItem('lg_user'); sessionStorage.removeItem('lg_active_phone');
    window.location.href = '/';
  };

  const logoutAllDevices = async () => {
    const ok = await confirm({ title: 'Logout All Devices', message: 'This will end ALL sessions including this one. You will be logged out.', confirmText: 'Logout All', type: 'critical' });
    if (!ok) return;
    try {
      const user = JSON.parse(localStorage.getItem('lg_user') || '{}');
      if (user.phone) {
        await updateDoc(doc(db, 'users', user.phone), { sessions: [], activeSession: '', sessionExpiry: '' });
      }
    } catch (e) {}
    const phone = sessionStorage.getItem('lg_active_phone'); if (phone) localStorage.removeItem(`lg_user_${phone}`); localStorage.removeItem('lg_user'); sessionStorage.removeItem('lg_active_phone');
    window.location.href = '/';
  };

  const TimeSelect = ({ value, onChange }) => (
    <select value={value} onChange={e => onChange(Number(e.target.value))} className="text-xs font-bold bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333333] rounded-lg px-2 py-1.5 dark:text-white outline-none">
      <option value={-1}>Any</option>
      {Array.from({length: 24}, (_, i) => <option key={i} value={i}>{i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i-12} PM`}</option>)}
    </select>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <AnimatePresence>{toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}</AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* LEFT — Business Configuration */}
        <div className="space-y-5">
          {/* Order & Delivery Card */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1 mb-2">Order & Delivery</p>
            <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#222222] divide-y divide-gray-100 dark:divide-[#1a1a1a] overflow-hidden">
              <SettingRow icon={Clock} iconColor="text-royal-500" label="Order Window" description="When retailers can place orders">
                <div className="flex items-center gap-1.5">
                  <TimeSelect value={orderStart} onChange={setOrderStart} />
                  <span className="text-[10px] text-gray-400">to</span>
                  <TimeSelect value={orderEnd} onChange={setOrderEnd} />
                </div>
              </SettingRow>
              <SettingRow icon={Truck} iconColor="text-mint-500" label="Delivery Window" description="When deliveries happen">
                <div className="flex items-center gap-1.5">
                  <TimeSelect value={deliveryStart} onChange={setDeliveryStart} />
                  <span className="text-[10px] text-gray-400">to</span>
                  <TimeSelect value={deliveryEnd} onChange={setDeliveryEnd} />
                </div>
              </SettingRow>
              <SettingRow icon={Phone} iconColor="text-green-500" label="Business Phone" description="Shown to retailers">
                <input type="tel" maxLength={10} value={shopPhone} onChange={e => setShopPhone(e.target.value.replace(/\D/g, ''))}
                  className="text-sm font-bold text-right bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333333] rounded-lg px-2.5 py-1.5 w-[110px] dark:text-white outline-none focus:border-royal-400" />
              </SettingRow>
            </div>
          </motion.div>

          {/* Order Rules Card */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1 mb-2">Order Rules</p>
            <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#222222] divide-y divide-gray-100 dark:divide-[#1a1a1a] overflow-hidden">
              <SettingRow icon={Shield} iconColor="text-amber-500" label="Min Order Amount" description="0 = no minimum">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-400">₹</span>
                  <input type="number" min="0" value={minOrderAmount} onChange={e => setMinOrderAmount(e.target.value)}
                    className="text-sm font-bold text-right bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333333] rounded-lg px-2 py-1.5 w-[70px] dark:text-white outline-none focus:border-royal-400" />
                </div>
              </SettingRow>
              <SettingRow icon={Shield} iconColor="text-royal-500" label="Max Items per Order" description="0 = unlimited">
                <input type="number" min="0" value={maxOrderItems} onChange={e => setMaxOrderItems(e.target.value)}
                  className="text-sm font-bold text-right bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333333] rounded-lg px-2 py-1.5 w-[60px] dark:text-white outline-none focus:border-royal-400" />
              </SettingRow>
              <SettingRow icon={Shield} iconColor="text-mint-500" label="Allow Order Modify" description="Retailer can edit before dispatch">
                <Toggle enabled={allowModify} onToggle={() => setAllowModify(!allowModify)} />
              </SettingRow>
              <SettingRow icon={Lock} iconColor="text-gray-500" label="Default Retailer PIN" description="Assigned to new accounts">
                <input type="text" maxLength={4} value={defaultPin} onChange={e => setDefaultPin(e.target.value.replace(/\D/g, ''))}
                  className="text-sm font-bold text-center bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333333] rounded-lg px-2 py-1.5 w-[60px] dark:text-white outline-none focus:border-royal-400 tracking-widest" />
              </SettingRow>
            </div>
          </motion.div>

          {/* Save Button */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <motion.button whileTap={{ scale: 0.97 }} onClick={saveSettings} disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-royal-700 to-royal-600 text-white font-bold py-3.5 rounded-2xl text-sm shadow-lg shadow-royal-600/20 disabled:opacity-50">
              {saving ? <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }} className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <><Save size={15} /> Save All Settings</>}
            </motion.button>
          </motion.div>
        </div>

        {/* RIGHT — Security & System */}
        <div className="space-y-5">
          {/* Preferences Card */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1 mb-2">Preferences</p>
            <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#222222] divide-y divide-gray-100 dark:divide-[#1a1a1a] overflow-hidden">
              <SettingRow icon={isDark ? Moon : Sun} iconColor={isDark ? 'text-royal-400' : 'text-amber-500'} label="Dark Mode" description={isDark ? 'Dark theme active' : 'Light theme active'}>
                <Toggle enabled={isDark} onToggle={() => { toggleDark(); setToast({ message: 'Theme updated', type: 'success' }); }} />
              </SettingRow>
              <SettingRow icon={Monitor} iconColor="text-royal-500" label="Font Size">
                <div className="flex gap-1">
                  {SIZES.map((s, i) => (
                    <button key={s} onClick={() => { setFontSize(s); setToast({ message: 'Font updated', type: 'success' }); }}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold ${fontSize === s ? 'bg-royal-600 text-white' : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-500'}`}>
                      {LABELS[i]}
                    </button>
                  ))}
                </div>
              </SettingRow>
              <SettingRow icon={Lock} iconColor="text-royal-500" label="Change Admin PIN" description="Update your login PIN" onClick={() => setPinModal(true)}>
                <ChevronRight size={16} className="text-gray-300" />
              </SettingRow>
            </div>
          </motion.div>

          {/* Session Security Card */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1 mb-2">Session & Security</p>
            <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#222222] overflow-hidden">
              <SettingRow icon={Shield} iconColor="text-royal-500" label="Session Timeout" description="Auto-logout after inactivity">
                <select value={sessionTimeout} onChange={e => setSessionTimeout(Number(e.target.value))}
                  className="text-xs font-bold bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333333] rounded-lg px-2 py-1.5 dark:text-white outline-none">
                  <option value={4}>4 Hours</option><option value={8}>8 Hours</option><option value={12}>12 Hours</option>
                  <option value={24}>24 Hours</option><option value={48}>48 Hours</option><option value={72}>3 Days</option>
                </select>
              </SettingRow>
              <div className="border-t border-gray-100 dark:border-[#1a1a1a]">
                <div className="px-4 py-3 bg-royal-50 dark:bg-royal-900/10">
                  <div className="flex items-center gap-2">
                    <Shield size={14} className="text-royal-600 dark:text-royal-400" />
                    <span className="text-[11px] font-bold text-royal-700 dark:text-royal-300">
                      {adminSessions.length || 1} active device{(adminSessions.length || 1) !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-gray-100 dark:divide-[#1a1a1a]">
                {sessionsLoading ? (
                  <div className="px-4 py-6 flex justify-center"><div className="w-5 h-5 border-2 border-royal-200 border-t-royal-600 rounded-full animate-spin" /></div>
                ) : adminSessions.length === 0 ? (
                  <SessionCard current={true} session={getCurrentSessionFallback()} onLogout={logoutThisDevice} />
                ) : (
                  adminSessions.map(s => {
                    const currentUser = JSON.parse(localStorage.getItem('lg_user') || '{}');
                    const isCurrent = s.sessionId === currentUser.sessionId;
                    return <SessionCard key={s.sessionId} current={isCurrent} session={s} onLogout={isCurrent ? logoutThisDevice : () => endSession(s.sessionId)} />;
                  })
                )}
              </div>
              {adminSessions.length > 1 && (
                <div className="px-4 py-3 border-t border-gray-100 dark:border-[#1a1a1a]">
                  <button onClick={logoutAllDevices}
                    className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                    <Trash2 size={13} /> Logout all devices
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Critical Zone */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <p className="text-[11px] font-bold text-red-500 uppercase tracking-wider px-1 mb-2">Critical Zone</p>
            <div className="bg-white dark:bg-[#111111] rounded-2xl border border-red-200 dark:border-red-900/50 overflow-hidden">
              <SettingRow icon={Shield} iconColor={maintenance ? 'text-red-500' : 'text-green-500'} label="Maintenance Mode" description={maintenance ? 'All retailers are blocked' : 'Site is live for everyone'}>
                <Toggle enabled={maintenance} onToggle={toggleMaintenance} />
              </SettingRow>
              <div className="border-t border-red-100 dark:border-red-900/30">
                <SettingRow icon={Radio} iconColor="text-amber-500" label="Retailer Sessions" description={`${activeSessionCount} active now`} onClick={() => navigate('/admin/sessions')}>
                  <ChevronRight size={16} className="text-gray-300" />
                </SettingRow>
              </div>
            </div>
          </motion.div>

          {/* About */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1 mb-2">About</p>
            <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#222222] divide-y divide-gray-100 dark:divide-[#1a1a1a] overflow-hidden">
              <SettingRow icon={Monitor} iconColor="text-gray-400" label="Version">
                <span className="text-sm font-bold text-gray-700 dark:text-gray-200">{APP_CONFIG.version}</span>
              </SettingRow>
              <SettingRow icon={Heart} iconColor="text-red-400" label="Developer">
                <a href={APP_CONFIG.developer.portfolio} target="_blank" rel="noreferrer" className="text-sm font-bold text-royal-600 dark:text-royal-400">{APP_CONFIG.developer.name}</a>
              </SettingRow>
            </div>
          </motion.div>
        </div>

      </div>

      <AnimatePresence>{pinModal && <PinModal onClose={() => setPinModal(false)} onSuccess={() => setToast({ message: 'PIN changed!', type: 'success' })} onError={() => setToast({ message: 'Failed, try again', type: 'error' })} />}</AnimatePresence>
    </div>
  );
}
