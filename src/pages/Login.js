import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Lock, ArrowRight, AlertCircle, AlertTriangle } from 'lucide-react';
import { db, doc, getDoc, updateDoc, arrayUnion } from '../services/firebase';
import { APP_CONFIG } from '../utils/config';
import logo from '../assets/logo.png';

const generateSessionId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
const DEV_PHONE = '8051725780';

const MAX_ATTEMPTS = 5;
// Progressive lockout: 60s → 5min → 30min → permanent
const LOCKOUT_TIERS = [60, 300, 1800, -1]; // -1 = permanent

export default function Login({ onLogin }) {
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionConflict, setSessionConflict] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [attempts, setAttempts] = useState(0);
  const [lockTier, setLockTier] = useState(0);
  const [lockUntil, setLockUntil] = useState(0);
  const [countdown, setCountdown] = useState(0);
  const [blocked, setBlocked] = useState(false);
  const [phoneAttempts, setPhoneAttempts] = useState(0);
  const [phoneLockUntil, setPhoneLockUntil] = useState(0);
  const [phoneCountdown, setPhoneCountdown] = useState(0);
  const [phoneLockTier, setPhoneLockTier] = useState(0);
  const pinRef = useRef(null);

  // Focus hidden input when on PIN step
  useEffect(() => {
    if (step === 'pin' && pinRef.current) pinRef.current.focus();
  }, [step]);

  // Restore PIN lockout state from Firebase when entering PIN step
  useEffect(() => {
    if (phone.length === 10 && step === 'pin') {
      (async () => {
        try {
          const snap = await getDoc(doc(db, 'users', phone));
          if (snap.exists()) {
            const d = snap.data();
            if (d.blocked) { /* allow login - blocked page will show after */ }
            if (d.lockUntil) {
              const until = new Date(d.lockUntil).getTime();
              if (until > Date.now()) { setLockUntil(until); }
            }
            setAttempts(d.loginAttempts || 0);
            setLockTier(d.lockTier || 0);
          }
        } catch (e) {}
      })();
    }
  }, [phone, step]);

  // Countdown timer for PIN lockout
  useEffect(() => {
    if (blocked || lockUntil <= Date.now()) { setCountdown(0); return; }
    const tick = () => {
      const remaining = Math.ceil((lockUntil - Date.now()) / 1000);
      if (remaining <= 0) { setCountdown(0); setLockUntil(0); setAttempts(0); setError(''); }
      else setCountdown(remaining);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lockUntil, blocked]);

  // Phone step rate limit - restore
  useEffect(() => {
    const stored = localStorage.getItem('lg_phone_lock');
    if (stored) {
      const { until, count, tier } = JSON.parse(stored);
      if (until === -1) { setPhoneLockUntil(-1); setPhoneAttempts(count); setPhoneLockTier(tier || 0); } // permanent
      else if (until > Date.now()) { setPhoneLockUntil(until); setPhoneAttempts(count); setPhoneLockTier(tier || 0); }
      else { localStorage.removeItem('lg_phone_lock'); setPhoneAttempts(0); setPhoneLockTier(stored.tier || 0); }
    }
  }, []);

  // Countdown for phone lock
  useEffect(() => {
    if (phoneLockUntil === -1 || phoneLockUntil <= Date.now()) { if (phoneLockUntil !== -1) setPhoneCountdown(0); return; }
    const tick = () => {
      const remaining = Math.ceil((phoneLockUntil - Date.now()) / 1000);
      if (remaining <= 0) { setPhoneCountdown(0); setPhoneLockUntil(0); setPhoneAttempts(0); setError(''); localStorage.removeItem('lg_phone_lock'); }
      else setPhoneCountdown(remaining);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [phoneLockUntil]);

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    if (phone.length !== 10) { setError('Enter valid 10 digit number'); return; }
    // Check lock BEFORE any Firebase call
    if (phoneLockUntil === -1) { setError('Device blocked. Too many failed attempts. Clear browser data or contact admin.'); return; }
    if (phoneLockUntil > Date.now()) { setError(`Too many requests. Wait ${Math.ceil((phoneLockUntil - Date.now()) / 1000)}s`); return; }
    setLoading(true);
    setError('');
    // Count attempt BEFORE Firebase call
    const newCount = phoneAttempts + 1;
    setPhoneAttempts(newCount);
    // Progressive: 5 attempts → 5min, 5 more → 30min, 5 more → permanent device block
    if (newCount >= 5) {
      const newTier = phoneLockTier + 1;
      setPhoneLockTier(newTier);
      const durations = [300, 1800, -1]; // 5min, 30min, permanent
      const duration = durations[Math.min(newTier - 1, durations.length - 1)];
      if (duration === -1) {
        setPhoneLockUntil(-1);
        localStorage.setItem('lg_phone_lock', JSON.stringify({ until: -1, count: newCount, tier: newTier }));
        setError('Device blocked permanently. Too many failed attempts.'); setLoading(false); return;
      } else {
        const until = Date.now() + duration * 1000;
        setPhoneLockUntil(until);
        setPhoneAttempts(0);
        localStorage.setItem('lg_phone_lock', JSON.stringify({ until, count: 0, tier: newTier }));
        const label = duration >= 60 ? `${Math.floor(duration / 60)} min` : `${duration}s`;
        setError(`Too many attempts. Locked for ${label}.`); setLoading(false); return;
      }
    }
    try {
      const userDoc = await getDoc(doc(db, 'users', phone));
      if (!userDoc.exists() && phone !== DEV_PHONE) {
        // Generic error — don't reveal if number exists or not
        setError('Unable to verify. Check number & try again.'); setLoading(false); return;
      }
      if (userDoc.exists() && userDoc.data().blocked) { setStep('pin'); setLoading(false); return; }
      setStep('pin');
    } catch (err) {
      console.error('PHONE SUBMIT ERROR:', err);
      setError('Network error. Try again.');
    }
    setLoading(false);
  };

  const handlePinSubmit = async (e) => {
    if (e) e.preventDefault();
    if (pin.length < 4) return;
    if (blocked) { /* allow PIN submit for blocked users - they'll see Blocked page after login */ }
    if (lockUntil > Date.now()) { setError(`Too many attempts. Wait ${Math.ceil((lockUntil - Date.now()) / 1000)}s`); setPin(''); return; }
    setLoading(true);
    setError('');
    try {
      const userDoc = await getDoc(doc(db, 'users', phone));
      
      // Developer bypass - if doc doesn't exist but it's dev phone
      if (!userDoc.exists() && phone === DEV_PHONE) {
        if (pin !== '0000') { handleWrongPin(); return; }
        resetAttempts();
        const devUser = { phone: DEV_PHONE, name: 'Developer', role: 'admin' };
        await createSession(devUser);
        return;
      }

      const data = userDoc.data();
      // Check blocked from Firebase — allow login but pass blocked flag
      if (data.blocked && pin !== data.pin) { handleWrongPin(); return; }
      if (data.blocked && pin === data.pin) {
        resetAttempts();
        await createSession({ ...data, phone, blocked: true });
        return;
      }
      if (pin !== data.pin) { handleWrongPin(); return; }

      // Correct PIN — reset attempts
      resetAttempts();

      // Admin: multi-device allowed, skip session conflict
      if (data.role === 'admin') {
        await createSession({ ...data, phone });
        return;
      }

      if (data.activeSession && data.sessionExpiry) {
        const expiry = new Date(data.sessionExpiry);
        if (expiry > new Date()) {
          setPendingUser({ ...data, phone });
          setSessionConflict(true);
          setLoading(false);
          return;
        }
      }

      await createSession({ ...data, phone });
    } catch (err) {
      console.error('PIN SUBMIT ERROR:', err);
      setError('Network error. Try again.');
      setLoading(false);
    }
  };

  const handleWrongPin = async () => {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);
    setPin('');
    setLoading(false);
    if (newAttempts >= MAX_ATTEMPTS) {
      const newTier = lockTier + 1;
      setLockTier(newTier);
      const tierIndex = Math.min(newTier - 1, LOCKOUT_TIERS.length - 1);
      const duration = LOCKOUT_TIERS[tierIndex];
      if (duration === -1) {
        // Permanent block — save to Firebase
        setBlocked(true);
        try { await updateDoc(doc(db, 'users', phone), { blocked: true, blockedAt: new Date().toISOString(), blockReason: 'Too many wrong PIN attempts', loginAttempts: 0, lockTier: newTier }); } catch (e) {}
        setError('Account permanently blocked. Contact admin to unlock.');
      } else {
        const until = Date.now() + duration * 1000;
        setLockUntil(until);
        setAttempts(0);
        // Save lock state to Firebase — hacker can't bypass by clearing localStorage
        try { await updateDoc(doc(db, 'users', phone), { loginAttempts: 0, lockUntil: new Date(until).toISOString(), lockTier: newTier }); } catch (e) {}
        const label = duration >= 60 ? `${Math.floor(duration / 60)} min` : `${duration}s`;
        setError(`Locked for ${label}. Too many wrong attempts.`);
      }
    } else {
      // Save attempt count to Firebase
      try { await updateDoc(doc(db, 'users', phone), { loginAttempts: newAttempts, lockTier }); } catch (e) {}
      setError(`Incorrect PIN (${MAX_ATTEMPTS - newAttempts} attempts left)`);
    }
  };

  const resetAttempts = async () => {
    setAttempts(0); setLockUntil(0); setLockTier(0); setBlocked(false);
    try { await updateDoc(doc(db, 'users', phone), { loginAttempts: 0, lockUntil: null, lockTier: 0 }); } catch (e) {}
  };

  const saveRecentPhone = (ph, name) => {
    try {
      const stored = JSON.parse(localStorage.getItem('lg_recent_phones') || '[]');
      const filtered = stored.filter(r => r.phone !== ph);
      filtered.unshift({ phone: ph, name: name || '' });
      localStorage.setItem('lg_recent_phones', JSON.stringify(filtered.slice(0, 3)));
    } catch (e) {}
  };

  const getRecentPhones = () => {
    try { return JSON.parse(localStorage.getItem('lg_recent_phones') || '[]'); }
    catch (e) { return []; }
  };

  const createSession = async (userData) => {
    const sessionId = generateSessionId();
    const isDev = userData.phone === DEV_PHONE;
    // Fetch session timeout from settings (default 24h)
    let timeoutHours = 24;
    try {
      const settingsDoc = await getDoc(doc(db, 'settings', 'app'));
      if (settingsDoc.exists() && settingsDoc.data().sessionTimeout) timeoutHours = settingsDoc.data().sessionTimeout;
    } catch (e) {}
    const sessionExpiry = new Date(Date.now() + (isDev ? 4 : timeoutHours) * 60 * 60 * 1000).toISOString();
    saveRecentPhone(userData.phone, userData.name);

    // Only update Firestore if user doc exists (skip for dev bypass)
    try {
      const userRef = doc(db, 'users', userData.phone);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const ua = navigator.userAgent || '';
        const updateData = {
          activeSession: sessionId,
          sessionExpiry,
          lastLogin: new Date().toISOString(),
          lastDevice: ua.slice(0, 100),
        };
        // For admin: also push to sessions array for multi-device tracking
        if (userSnap.data().role === 'admin') {
          const device = ua.includes('iPhone') ? 'iPhone' : ua.includes('Android') ? 'Android' : ua.includes('Windows') ? 'Windows PC' : ua.includes('Mac') ? 'Mac' : 'Unknown';
          const browser = ua.includes('Firefox') ? 'Firefox' : ua.includes('Edg') ? 'Edge' : ua.includes('Chrome') ? 'Chrome' : ua.includes('Safari') ? 'Safari' : 'Other';
          const os = ua.includes('Android') ? 'Android' : ua.includes('iPhone') ? 'iOS' : ua.includes('Windows') ? 'Windows' : ua.includes('Mac') ? 'macOS' : ua.includes('Linux') ? 'Linux' : 'Unknown';
          updateData.sessions = arrayUnion({ sessionId, device, browser, os, loginAt: new Date().toISOString(), expiresAt: sessionExpiry });
        }
        await updateDoc(userRef, updateData);
      }
    } catch (e) {}

    const sessionData = { ...userData, sessionId, sessionExpiry };
    localStorage.setItem(`lg_user_${userData.phone}`, JSON.stringify(sessionData));
    localStorage.setItem('lg_user', JSON.stringify(sessionData)); // backward compat for other pages
    localStorage.setItem('lg_last_login', userData.phone);
    sessionStorage.setItem('lg_active_phone', userData.phone);
    onLogin(sessionData);
  };

  const terminateAndLogin = async () => {
    setLoading(true);
    await createSession(pendingUser);
    setSessionConflict(false);
    setLoading(false);
  };

  // Auto-submit when 4 digits entered
  useEffect(() => {
    if (pin.length === 4 && step === 'pin' && !loading && lockUntil <= Date.now()) handlePinSubmit();
  }, [pin]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-royal-950 via-royal-900 to-royal-800 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-mint-500/8 rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-royal-400/8 rounded-full blur-3xl translate-x-1/4 translate-y-1/4" />
      <motion.div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-mint-500/3 rounded-full blur-3xl"
        animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 6, repeat: Infinity }} />

      {/* Logo */}
      <motion.div initial={{ opacity: 0, y: -30, scale: 0.8 }} animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }} className="text-center mb-8 relative z-10">
        <motion.div
          animate={{ boxShadow: ['0 0 0px rgba(51,222,146,0)', '0 0 30px rgba(51,222,146,0.2)', '0 0 0px rgba(51,222,146,0)'] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="inline-block rounded-3xl">
          <img src={logo} alt="Lucy Garden" className="w-24 h-24 rounded-3xl object-cover shadow-2xl border-2 border-white/15" />
        </motion.div>
        <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
          className="text-3xl font-black text-white mt-5 tracking-tight">Lucy Garden</motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
          className="text-mint-400 text-xs font-bold tracking-[0.2em] uppercase mt-1.5">Fresh Dairy Supply</motion.p>
      </motion.div>

      {/* Card */}
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 150 }} className="w-full max-w-sm relative z-10">
        <div className="bg-white dark:bg-[#111111] rounded-3xl p-7 shadow-2xl border border-white/10">
          <AnimatePresence mode="wait">
            {/* Session Conflict */}
            {sessionConflict ? (
              <motion.div key="conflict" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                <div className="text-center mb-5">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.1 }}
                    className="w-16 h-16 bg-gradient-to-br from-amber-100 to-amber-50 dark:from-amber-900/30 dark:to-amber-900/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200 dark:border-amber-800">
                    <AlertTriangle size={28} className="text-amber-600" />
                  </motion.div>
                  <h2 className="font-extrabold text-gray-800 dark:text-white text-lg">Active Session Detected</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">This account is logged in on another device. Terminate that session to continue here.</p>
                </div>
                <div className="flex gap-3">
                  <motion.button whileTap={{ scale: 0.97 }} onClick={() => { setSessionConflict(false); setPin(''); setStep('phone'); }}
                    className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#1a1a1a]">
                    Cancel
                  </motion.button>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={terminateAndLogin} disabled={loading}
                    className="flex-1 py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-red-600 to-red-500 shadow-lg shadow-red-500/25">
                    {loading ? 'Please wait...' : 'Terminate & Login'}
                  </motion.button>
                </div>
              </motion.div>

            ) : step === 'phone' ? (
              <motion.div key="phone" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="mb-6">
                  <h2 className="font-extrabold text-gray-800 dark:text-white text-xl">Welcome Back</h2>
                  <p className="text-sm text-gray-400 dark:text-gray-500 font-medium mt-1">Enter your registered mobile number</p>
                </div>
                <form onSubmit={handlePhoneSubmit}>
                  {/* Recent numbers */}
                  {!phone && getRecentPhones().length > 0 && (
                    <div className="mb-4">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">Recent</p>
                      <div className="flex flex-wrap gap-2">
                        {getRecentPhones().map(r => (
                          <motion.button key={r.phone} type="button" whileTap={{ scale: 0.95 }}
                            onClick={() => { setPhone(r.phone); setError(''); }}
                            className="flex items-center gap-2 px-3 py-2 bg-royal-50 dark:bg-royal-900/20 border border-royal-100 dark:border-royal-800 rounded-xl hover:bg-royal-100 dark:hover:bg-royal-900/40 transition-colors">
                            <div className="w-6 h-6 bg-royal-100 dark:bg-royal-800 rounded-full flex items-center justify-center">
                              <Phone size={10} className="text-royal-600 dark:text-royal-400" />
                            </div>
                            <div className="text-left">
                              {r.name && <p className="text-[10px] font-bold text-gray-700 dark:text-gray-200 leading-tight">{r.name}</p>}
                              <p className="text-[11px] font-mono text-royal-600 dark:text-royal-400">•••••{r.phone.slice(-5)}</p>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="relative mb-5">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-gray-500">
                      <Phone size={16} className="text-royal-500" />
                      <span className="text-sm font-bold">+91</span>
                      <div className="w-px h-5 bg-gray-200 dark:bg-[#222222]" />
                    </div>
                    <input type="tel" maxLength={10} value={phone} onChange={e => { setPhone(e.target.value.replace(/\D/g, '')); setError(''); }}
                      placeholder="Mobile Number"
                      className="w-full pl-[88px] pr-4 py-4 text-lg font-bold bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333333] rounded-2xl outline-none focus:border-royal-400 focus:ring-2 focus:ring-royal-100 dark:text-white tracking-wider"
                      autoFocus />
                  </div>
                  <AnimatePresence>{error && (
                    <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="text-sm text-red-500 font-semibold mb-4 flex items-center gap-1.5">
                      <AlertCircle size={14} /> {error}
                    </motion.p>
                  )}</AnimatePresence>
                  {phoneCountdown > 0 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="mb-4 py-2.5 px-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-center">
                      <p className="text-xs font-bold text-red-600 dark:text-red-400"><Lock size={12} className="inline" /> Too many requests — wait <span className="text-base">{phoneCountdown >= 60 ? `${Math.floor(phoneCountdown/60)}m ${phoneCountdown%60}s` : `${phoneCountdown}s`}</span></p>
                    </motion.div>
                  )}
                  {phoneLockUntil === -1 && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="mb-4 py-3 px-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-center">
                      <p className="text-xs font-bold text-red-600 dark:text-red-400"><Lock size={12} className="inline" /> Device permanently blocked</p>
                      <p className="text-[10px] text-red-500/70 mt-0.5">Clear browser data or contact admin</p>
                    </motion.div>
                  )}
                  <motion.button whileTap={{ scale: 0.97 }} type="submit" disabled={loading || phone.length < 10 || phoneLockUntil === -1 || phoneLockUntil > Date.now()}
                    className={`w-full font-bold py-4 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 text-base ${phone.length === 10 ? 'bg-gradient-to-r from-royal-700 via-royal-600 to-mint-700 text-white shadow-royal-600/25' : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-400'}`}>
                    {loading ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full" /> : <>Continue <ArrowRight size={18} /></>}
                  </motion.button>
                </form>
              </motion.div>

            ) : (
              <motion.div key="pin" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <div className="mb-2">
                  <h2 className="font-extrabold text-gray-800 dark:text-white text-xl">Enter PIN</h2>
                  <p className="text-sm text-gray-400 dark:text-gray-500 font-medium mt-1">+91 {phone}</p>
                </div>
                <button onClick={() => { setStep('phone'); setPin(''); setError(''); }}
                  className="text-xs text-royal-600 dark:text-royal-400 font-bold mb-6 hover:underline">← Change number</button>

                {/* Hidden input for keyboard support - desktop only */}
                <input ref={pinRef} type="tel" maxLength={4} value={pin}
                  onChange={e => { const v = e.target.value.replace(/\D/g, ''); setPin(v); setError(''); }}
                  className="absolute opacity-0 w-0 h-0 hidden lg:block" autoFocus />

                {/* PIN Dots */}
                <div className="flex justify-center gap-5 mb-6">
                  {[0, 1, 2, 3].map(i => (
                    <motion.div key={i}
                      animate={{ scale: pin.length > i ? [1, 1.3, 1] : 1 }}
                      transition={{ duration: 0.2 }}
                      className={`w-5 h-5 rounded-full transition-all duration-200 ${pin.length > i ? 'bg-gradient-to-br from-royal-600 to-mint-600 shadow-md shadow-royal-500/30' : 'bg-gray-200 dark:bg-[#222222]'}`} />
                  ))}
                </div>

                <AnimatePresence>{error && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-sm text-red-500 font-semibold mb-4 text-center flex items-center justify-center gap-1.5">
                    <AlertCircle size={14} /> {error}
                  </motion.p>
                )}</AnimatePresence>

                {/* Lockout countdown */}
                {countdown > 0 && !blocked && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="mb-4 py-3 px-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-center">
                    <p className="text-xs font-bold text-red-600 dark:text-red-400"><Lock size={12} className="inline" /> Locked — try again in <span className="text-base">{countdown >= 60 ? `${Math.floor(countdown/60)}m ${countdown%60}s` : `${countdown}s`}</span></p>
                  </motion.div>
                )}

                {/* Permanent block */}
                {blocked && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="mb-4 py-4 px-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl text-center">
                    <p className="text-sm font-bold text-red-600 dark:text-red-400"><Lock size={12} className="inline" /> Account Permanently Blocked</p>
                    <p className="text-[11px] text-red-500/70 dark:text-red-400/70 mt-1">Contact admin to unlock your account</p>
                  </motion.div>
                )}

                {/* PIN Pad */}
                <div className="grid grid-cols-3 gap-2.5 mb-5">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((num, i) => (
                    <motion.button key={i} type="button" whileTap={{ scale: 0.8 }}
                      onClick={() => {
                        if (num === '⌫') setPin(p => p.slice(0, -1));
                        else if (num !== '' && pin.length < 4) setPin(p => p + num);
                        setError('');
                      }}
                      className={`h-16 rounded-2xl font-bold text-2xl transition-all ${num === '' ? 'invisible' : num === '⌫' ? 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-300 text-lg hover:bg-gray-200 dark:hover:bg-[#222222]' : 'bg-gray-50 dark:bg-[#1a1a1a] text-gray-800 dark:text-white hover:bg-royal-50 dark:hover:bg-royal-900/30 active:bg-royal-100'}`}>
                      {num}
                    </motion.button>
                  ))}
                </div>

                {/* Loading indicator when auto-submitting */}
                {loading && (
                  <div className="flex items-center justify-center gap-2 py-3">
                    <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-5 h-5 border-2 border-royal-200 border-t-royal-600 rounded-full" />
                    <span className="text-sm text-gray-500 font-medium">Verifying...</span>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
        className="mt-10 relative z-10 text-[11px] text-white/40 font-medium">
        Developed by <a href="https://portfolio-divyanshu-git.vercel.app" target="_blank" rel="noreferrer" className="text-white/60 font-semibold hover:text-mint-400 transition-colors">Divyanshu Gupta</a>
      </motion.p>
    </div>
  );
}
