import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, Smartphone, ChevronRight, X, Check, AlertCircle, Monitor, Heart, MapPin, Info, Shield, FileText, Share2, Trash2, Download, Star, Sparkles } from 'lucide-react';
import { db, collection, addDoc, getDocs, query, where } from '../../services/firebase';
import useDarkMode from '../../hooks/useDarkMode';
import { useFontSize } from '../../hooks/useFontSize';
import { APP_CONFIG } from '../../utils/config';

const fadeUp = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } };

function Toast({ message, type = 'success', onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 2500); return () => clearTimeout(t); }, [onClose]);
  return (
    <motion.div initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`fixed top-[4.5rem] left-4 right-4 lg:left-[calc(260px+1rem)] lg:right-4 z-[100] flex items-center gap-2.5 px-4 py-3.5 rounded-2xl shadow-xl border backdrop-blur-sm ${
        type === 'success' ? 'bg-mint-50/95 border-mint-200 text-mint-800 dark:bg-mint-900/90 dark:border-mint-700 dark:text-mint-200' : 'bg-red-50/95 border-red-200 text-red-700 dark:bg-red-900/90 dark:border-red-700 dark:text-red-200'
      }`}>
      {type === 'success' ? <Check size={16} strokeWidth={3} /> : <AlertCircle size={16} />}
      <span className="text-[13px] font-semibold">{message}</span>
    </motion.div>
  );
}

function Toggle({ enabled, onToggle }) {
  return (
    <motion.button whileTap={{ scale: 0.9 }} onClick={onToggle}
      className={`w-11 h-6 rounded-full p-0.5 transition-colors duration-300 ${enabled ? 'bg-gradient-to-r from-royal-600 to-mint-500' : 'bg-gray-200 dark:bg-[#333333]'}`}>
      <motion.div className="w-5 h-5 bg-white rounded-full shadow-md"
        animate={{ x: enabled ? 20 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
    </motion.button>
  );
}

function PinModal({ isOpen, onClose, onSuccess, onError }) {
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

  // Restore lock state
  useEffect(() => {
    const stored = localStorage.getItem('lg_changepin_lock');
    if (stored) {
      const { until, count, tier } = JSON.parse(stored);
      if (until > Date.now()) { setPinLockUntil(until); setPinAttempts(count); setPinLockTier(tier || 0); }
      else { localStorage.removeItem('lg_changepin_lock'); setPinLockTier(JSON.parse(stored).tier || 0); }
    }
  }, []);

  // Countdown
  useEffect(() => {
    if (pinLockUntil <= Date.now()) { setPinCountdown(0); return; }
    const tick = () => {
      const remaining = Math.ceil((pinLockUntil - Date.now()) / 1000);
      if (remaining <= 0) { setPinCountdown(0); setPinLockUntil(0); setPinAttempts(0); setError(''); localStorage.removeItem('lg_changepin_lock'); }
      else setPinCountdown(remaining);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [pinLockUntil]);

  const reset = () => { setStep('current'); setCurrentPin(''); setNewPin(''); setConfirmPin(''); setError(''); setSaving(false); setOldPinFromDb(''); };

  const handleDigit = (digit) => {
    setError('');
    if (step === 'current' && currentPin.length < 4) {
      const val = currentPin + digit;
      setCurrentPin(val);
      if (val.length === 4) setTimeout(() => verifyCurrentPin(val), 200);
    } else if (step === 'new' && newPin.length < 4) {
      const val = newPin + digit;
      setNewPin(val);
      if (val.length === 4) setTimeout(() => validateNewPin(val), 200);
    } else if (step === 'confirm' && confirmPin.length < 4) {
      const val = confirmPin + digit;
      setConfirmPin(val);
      if (val.length === 4) setTimeout(() => confirmAndSave(val), 200);
    }
  };

  const handleDelete = () => {
    setError('');
    if (step === 'current') setCurrentPin(p => p.slice(0, -1));
    else if (step === 'new') setNewPin(p => p.slice(0, -1));
    else setConfirmPin(p => p.slice(0, -1));
  };

  const verifyCurrentPin = async (pin) => {
    // Check lock first
    if (pinLockUntil > Date.now()) { setError(`Locked. Wait ${Math.ceil((pinLockUntil - Date.now()) / 1000)}s`); setCurrentPin(''); return; }
    try {
      const user = JSON.parse(localStorage.getItem('lg_user') || '{}');
      const { db, doc } = await import('../../services/firebase');
      const { getDoc } = await import('firebase/firestore');
      const snap = await getDoc(doc(db, 'users', user.phone));
      const firebasePin = snap.exists() ? snap.data().pin : '1234';
      setOldPinFromDb(firebasePin);
      if (pin === firebasePin) {
        setStep('new');
        // Reset on success
        setPinAttempts(0); localStorage.removeItem('lg_changepin_lock');
      } else {
        const newCount = pinAttempts + 1;
        setPinAttempts(newCount);
        setCurrentPin('');
        // Progressive: 3 wrong → 60s, 3 more → 5min, 3 more → force logout
        if (newCount >= 3) {
          const newTier = pinLockTier + 1;
          setPinLockTier(newTier);
          const durations = [60, 300, -1]; // 60s, 5min, force logout
          const duration = durations[Math.min(newTier - 1, durations.length - 1)];
          if (duration === -1) {
            // Force logout — suspicious activity
            localStorage.removeItem('lg_changepin_lock');
            const ph = sessionStorage.getItem('lg_active_phone'); if (ph) localStorage.removeItem(`lg_user_${ph}`); localStorage.removeItem('lg_user'); sessionStorage.removeItem('lg_active_phone');
            window.location.reload();
            return;
          }
          const until = Date.now() + duration * 1000;
          setPinLockUntil(until); setPinAttempts(0);
          localStorage.setItem('lg_changepin_lock', JSON.stringify({ until, count: 0, tier: newTier }));
          const label = duration >= 60 ? `${Math.floor(duration / 60)} min` : `${duration}s`;
          setError(`Too many wrong attempts. Locked for ${label}.`);
        } else {
          localStorage.setItem('lg_changepin_lock', JSON.stringify({ until: 0, count: newCount, tier: pinLockTier }));
          setError(`Incorrect PIN (${3 - newCount} attempts left)`);
        }
      }
    } catch (err) {
      setError('Network error, try again'); setCurrentPin('');
    }
  };

  const validateNewPin = (pin) => {
    if (pin === oldPinFromDb) { setError('New PIN cannot be same as old PIN'); setNewPin(''); return; }
    if (/^(\d)\1{3}$/.test(pin)) { setError('PIN too simple (e.g. 1111)'); setNewPin(''); return; }
    if ('0123456789'.includes(pin) || '9876543210'.includes(pin)) { setError('PIN too simple (e.g. 1234)'); setNewPin(''); return; }
    setStep('confirm');
  };

  const confirmAndSave = async (pin) => {
    if (pin !== newPin) { setError('PINs do not match'); setConfirmPin(''); return; }
    setSaving(true);
    try {
      const user = JSON.parse(localStorage.getItem('lg_user') || '{}');
      if (user.phone) {
        const { db, doc } = await import('../../services/firebase');
        const { updateDoc } = await import('firebase/firestore');
        await updateDoc(doc(db, 'users', user.phone), { pin: newPin });
        user.pin = newPin;
        localStorage.setItem('lg_user', JSON.stringify(user));
        if (user.phone) localStorage.setItem(`lg_user_${user.phone}`, JSON.stringify(user));
      }
      localStorage.setItem('lg_pin', newPin);
      onSuccess(); onClose(); reset();
    } catch (err) {
      setSaving(false);
      onError && onError();
      onClose(); reset();
    }
  };

  const titles = { current: 'Enter Current PIN', new: 'Create New PIN', confirm: 'Confirm New PIN' };
  const subtitles = { current: 'Verify your identity', new: 'Choose a strong 4-digit PIN', confirm: 'Re-enter to confirm' };
  const value = step === 'current' ? currentPin : step === 'new' ? newPin : confirmPin;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center" onClick={() => { onClose(); reset(); }}>
      <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 250 }}
        className="bg-white dark:bg-[#111111] rounded-t-3xl sm:rounded-3xl p-6 pt-5 w-full sm:max-w-xs shadow-2xl" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div>
            <motion.h3 key={step} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="text-[16px] font-bold text-gray-800 dark:text-white">{titles[step]}</motion.h3>
            <motion.p key={step + 'sub'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">{subtitles[step]}</motion.p>
          </div>
          <button onClick={() => { onClose(); reset(); }} className="w-8 h-8 bg-gray-100 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-200 dark:hover:bg-[#222222]">
            <X size={15} />
          </button>
        </div>

        {/* Step dots */}
        <div className="flex justify-center gap-2 my-4">
          {['current', 'new', 'confirm'].map((s, i) => (
            <div key={s} className={`h-1 rounded-full transition-all duration-300 ${
              step === s ? 'w-6 bg-royal-600' : i < ['current', 'new', 'confirm'].indexOf(step) ? 'w-4 bg-mint-500' : 'w-4 bg-gray-200 dark:bg-[#222222]'
            }`} />
          ))}
        </div>

        {/* PIN dots display */}
        <div className="flex justify-center gap-4 my-6">
          {[0, 1, 2, 3].map((i) => (
            <motion.div key={i} animate={{ scale: value.length === i ? 1.2 : 1 }} transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                i < value.length ? 'bg-royal-600 border-royal-600 scale-100' : value.length === i ? 'border-royal-400 bg-transparent' : 'border-gray-200 dark:border-[#333333] bg-transparent'
              }`} />
          ))}
        </div>

        {/* Error */}
        {error && <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="text-[11px] text-red-500 font-semibold text-center mb-3">{error}</motion.p>}

        {/* Lockout countdown */}
        {pinCountdown > 0 && step === 'current' && (
          <div className="mb-3 py-2 px-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-center">
            <p className="text-[10px] font-bold text-red-600 dark:text-red-400">Locked — {pinCountdown >= 60 ? `${Math.floor(pinCountdown/60)}m ${pinCountdown%60}s` : `${pinCountdown}s`}</p>
          </div>
        )}

        {/* Saving indicator */}
        {saving && <div className="flex justify-center mb-3"><div className="w-5 h-5 border-2 border-royal-200 border-t-royal-600 rounded-full animate-spin" /></div>}

        {/* Numpad */}
        <div className="grid grid-cols-3 gap-2.5 mt-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((num, i) => (
            <motion.button key={i} whileTap={num !== '' ? { scale: 0.85 } : {}}
              onClick={() => { if (num === '⌫') handleDelete(); else if (num !== '') handleDigit(String(num)); }}
              disabled={saving}
              className={`h-14 rounded-2xl font-bold text-xl transition-all ${
                num === '' ? 'invisible' : num === '⌫' ? 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400 text-base' : 'bg-gray-50 dark:bg-[#1a1a1a] text-gray-800 dark:text-white active:bg-royal-100 dark:active:bg-gray-600'
              } ${saving ? 'opacity-50' : ''}`}>
              {num}
            </motion.button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

function RateApp({ showToast }) {
  const [rating, setRating] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(false);
  const user = JSON.parse(localStorage.getItem('lg_user') || '{}');

  useEffect(() => {
    if (!user.phone) return;
    (async () => {
      try {
        const q2 = query(collection(db, 'app_ratings'), where('phone', '==', user.phone));
        const snap = await getDocs(q2);
        if (!snap.empty) setExisting(snap.docs[0].data());
      } catch (e) {}
    })();
  }, [user.phone]);

  const submitRating = async () => {
    if (rating === 0 || loading) return;
    setLoading(true);
    try {
      // Check if already rated (prevent duplicates)
      const q2 = query(collection(db, 'app_ratings'), where('phone', '==', user.phone));
      const existSnap = await getDocs(q2);
      if (!existSnap.empty) {
        setExisting(existSnap.docs[0].data());
        showToast('You have already rated!', 'error');
        setLoading(false);
        return;
      }
      await addDoc(collection(db, 'app_ratings'), {
        phone: user.phone || '',
        name: user.name || '',
        rating,
        createdAt: new Date(),
        device: navigator.userAgent?.slice(0, 100) || '',
      });
      setSubmitted(true);
      setExisting({ rating });
      showToast('Thank you for rating! ⭐');
    } catch (err) {
      showToast('Failed to submit rating', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div {...fadeUp} transition={{ delay: 0.16 }}>
      <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1 mb-2">Feedback</p>
      <div className="card !p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl flex items-center justify-center border border-amber-100/30 dark:border-amber-800/30">
            <Star size={16} className="text-amber-500" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-gray-800 dark:text-white">Rate Lucy Garden</p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">
              {existing ? `You rated ${existing.rating}/5 ⭐` : 'Your feedback helps us improve'}
            </p>
          </div>
        </div>
        {!existing && !submitted ? (
          <div className="flex flex-col items-center gap-3 pt-2">
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(i => (
                <motion.button key={i} whileTap={{ scale: 0.8 }} onClick={() => setRating(i)} className="p-0.5">
                  <Star size={30} fill={i <= rating ? '#f59e0b' : 'none'}
                    className={`transition-colors ${i <= rating ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'}`}
                    strokeWidth={i <= rating ? 0 : 1.5} />
                </motion.button>
              ))}
            </div>
            {rating > 0 && (
              <motion.button initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.95 }} onClick={submitRating} disabled={loading}
                className={`px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md ${loading ? 'opacity-60' : ''}`}>
                {loading ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Sparkles size={13} />}
                {loading ? 'Submitting...' : 'Submit Rating'}
              </motion.button>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center gap-1 pt-1">
            {[1, 2, 3, 4, 5].map(i => (
              <Star key={i} size={22} fill={i <= (existing?.rating || rating) ? '#f59e0b' : 'none'}
                className={i <= (existing?.rating || rating) ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'}
                strokeWidth={i <= (existing?.rating || rating) ? 0 : 1.5} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const [isDark, toggleDark] = useDarkMode();
  const { size: fontSize, setSize: setFontSize, SIZES, LABELS } = useFontSize();
  const [toast, setToast] = useState(null);
  const [pinModal, setPinModal] = useState(false);

  const showToast = (msg, type = 'success') => setToast({ message: msg, type });

  return (
    <div className="pb-24 space-y-5 max-w-3xl mx-auto">
      <AnimatePresence>
        {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <motion.h2 initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-xl font-extrabold text-gray-800 dark:text-white sr-only">Settings</motion.h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

      {/* Appearance */}
      <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1 mb-2">Appearance</p>
        <div className="card !p-0 overflow-hidden divide-y divide-gray-50 dark:divide-gray-700">
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 }}
            className="flex items-center justify-between py-4 px-5">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 bg-gradient-to-br from-royal-50 to-mint-50 dark:from-[#1a1a1a] dark:to-[#222222] rounded-xl flex items-center justify-center border border-royal-100/30 dark:border-[#333333]">
                {isDark ? <Moon size={16} className="text-royal-600 dark:text-royal-300" /> : <Sun size={16} className="text-royal-600 dark:text-royal-300" />}
              </div>
              <div>
                <p className="text-[13px] font-semibold text-gray-800 dark:text-white">Dark Mode</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">{isDark ? 'On' : 'Off'}</p>
              </div>
            </div>
            <Toggle enabled={isDark} onToggle={() => { toggleDark(); showToast('Setting updated'); }} />
          </motion.div>
        </div>
      </motion.div>

      {/* Font Size */}
      <motion.div {...fadeUp} transition={{ delay: 0.12 }}>
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1 mb-2">Display</p>
        <div className="card !p-0 overflow-hidden">
          <div className="flex items-center justify-between py-4 px-5">
            <div>
              <p className="text-[13px] font-semibold text-gray-800 dark:text-white">Font Size</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">Adjust text size</p>
            </div>
            <div className="flex gap-1">
              {SIZES.map((s, i) => (
                <button key={s} onClick={() => { setFontSize(s); showToast('Font size updated'); }}
                  className={"px-3 py-1.5 rounded-lg text-xs font-bold transition-all " + (fontSize === s ? 'bg-royal-600 text-white' : 'bg-gray-100 dark:bg-[#1a1a1a] text-gray-500 dark:text-gray-400')}>
                  {LABELS[i]}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Security */}
      <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1 mb-2">Security</p>
        <div className="card !p-0 overflow-hidden">
          <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
            onClick={() => setPinModal(true)}
            className="flex items-center justify-between py-4 px-5 cursor-pointer hover:bg-royal-50/20 dark:hover:bg-[#1a1a1a]/50 transition-colors">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 bg-gradient-to-br from-royal-50 to-mint-50 dark:from-[#1a1a1a] dark:to-[#222222] rounded-xl flex items-center justify-center border border-royal-100/30 dark:border-[#333333]">
                <Smartphone size={16} className="text-royal-600 dark:text-royal-300" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-gray-800 dark:text-white">Change PIN</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">Update your login PIN</p>
              </div>
            </div>
            <ChevronRight size={16} className="text-gray-400" />
          </motion.div>
        </div>
      </motion.div>

      {/* Rate App */}
      <RateApp showToast={showToast} />
      </div>

      {/* Install App */}
      {!window.matchMedia('(display-mode: standalone)').matches && (
      <motion.div {...fadeUp} transition={{ delay: 0.18 }}>
        <motion.button whileTap={{ scale: 0.97 }} onClick={async () => {
          if (window.__lgInstallPrompt) {
            window.__lgInstallPrompt.prompt();
            const { outcome } = await window.__lgInstallPrompt.userChoice;
            if (outcome === 'accepted') showToast('App installed! 🎉');
            window.__lgInstallPrompt = null;
          } else {
            showToast('Tap 3-dot menu (⋮) → Add to Home Screen', 'error');
          }
        }} className="w-full card !p-4 flex items-center gap-4 border border-royal-100 dark:border-royal-900/50 bg-gradient-to-r from-royal-50 to-mint-50 dark:from-royal-900/20 dark:to-mint-900/20">
          <div className="w-11 h-11 bg-gradient-to-br from-royal-600 to-mint-600 rounded-2xl flex items-center justify-center shadow-lg shrink-0">
            <Download size={20} className="text-white" />
          </div>
          <div className="text-left flex-1">
            <p className="text-sm font-bold text-gray-800 dark:text-white">Install App</p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">Add to Home Screen for quick access</p>
          </div>
          <ChevronRight size={16} className="text-gray-400" />
        </motion.button>
      </motion.div>
      )}

      {/* About */}
      <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1 mb-2">About</p>
        <a href={APP_CONFIG.developer.portfolio} target="_blank" rel="noreferrer"
          className="card !p-5 flex items-center justify-between group cursor-pointer hover:border-royal-200 dark:hover:border-royal-800 transition-all">
          <div>
            <p className="text-sm font-bold text-gray-800 dark:text-white group-hover:text-royal-600 dark:group-hover:text-royal-400 transition-colors">{APP_CONFIG.developer.name}</p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">Design & Development &middot; v{APP_CONFIG.version}</p>
          </div>
          <div className="px-3 py-1.5 bg-gradient-to-r from-royal-600 to-mint-600 rounded-lg text-[10px] font-bold text-white shadow-sm group-hover:shadow-md transition-shadow shrink-0">
            Portfolio
          </div>
        </a>
      </motion.div>

      {/* More */}
      <motion.div {...fadeUp} transition={{ delay: 0.25 }}>
        <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-1 mb-2">More</p>
        <div className="card !p-0 overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            <button onClick={() => navigate('/about')} className="w-full flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3"><Info size={16} className="text-blue-400" /><p className="text-sm font-medium text-gray-600 dark:text-gray-300">About Lucy Garden</p></div>
              <ChevronRight size={14} className="text-gray-300" />
            </button>
            <button onClick={() => navigate('/privacy')} className="w-full flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3"><Shield size={16} className="text-green-500" /><p className="text-sm font-medium text-gray-600 dark:text-gray-300">Privacy Policy</p></div>
              <ChevronRight size={14} className="text-gray-300" />
            </button>
            <button onClick={() => navigate('/terms')} className="w-full flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3"><FileText size={16} className="text-gray-400" /><p className="text-sm font-medium text-gray-600 dark:text-gray-300">Terms & Conditions</p></div>
              <ChevronRight size={14} className="text-gray-300" />
            </button>
            <button onClick={() => { const url = window.location.origin; if (navigator.share) { navigator.share({ title: 'Lucy Garden', text: 'Fresh dairy supply app', url }); } else { const t = document.createElement('textarea'); t.value = url; document.body.appendChild(t); t.select(); document.execCommand('copy'); document.body.removeChild(t); showToast('Link copied!'); } }} className="w-full flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3"><Share2 size={16} className="text-royal-500" /><p className="text-sm font-medium text-gray-600 dark:text-gray-300">Share App</p></div>
              <ChevronRight size={14} className="text-gray-300" />
            </button>
            <button onClick={() => { localStorage.removeItem('lg_banner_dismissed'); localStorage.removeItem('lg_reorder'); showToast('Cache cleared!'); }} className="w-full flex items-center justify-between px-5 py-3.5">
              <div className="flex items-center gap-3"><Trash2 size={16} className="text-amber-500" /><p className="text-sm font-medium text-gray-600 dark:text-gray-300">Clear Cache</p></div>
              <ChevronRight size={14} className="text-gray-300" />
            </button>
          </div>
        </div>
      </motion.div>

      {pinModal && <PinModal isOpen={pinModal} onClose={() => setPinModal(false)} onSuccess={() => showToast('PIN changed!')} onError={() => showToast('Something went wrong, try again', 'error')} />}
    </div>
  );
}
