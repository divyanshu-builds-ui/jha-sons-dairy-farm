import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mail, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  RecaptchaVerifier, signInWithPhoneNumber,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../../services/firebase';
import Logo from '../../assets/Logo';
import BRAND from '../../utils/config';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}

async function ensureUserDoc(firebaseUser) {
  const ref  = doc(db, 'users', firebaseUser.uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      uid: firebaseUser.uid,
      name: firebaseUser.displayName || '',
      email: firebaseUser.email || '',
      phone: firebaseUser.phoneNumber || '',
      photoURL: firebaseUser.photoURL || '',
      role: 'customer',
      createdAt: new Date().toISOString(),
      subscription: { milkType: null, qty: 0, status: 'inactive' },
    });
  }
}

export default function LoginPage() {
  const { t } = useTranslation();
  const [method, setMethod] = useState(null); // null | 'google' | 'phone' | 'email'
  const [step, setStep]     = useState(1);
  const [phone, setPhone]   = useState('');
  const [otp, setOtp]       = useState(['', '', '', '', '', '']);
  const [email, setEmail]   = useState('');
  const [password, setPw]   = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState('');
  const confirmRef = useRef(null);
  const otpRefs    = useRef([]);
  const navigate   = useNavigate();

  function reset() { setMethod(null); setStep(1); setError(''); setOtp(['','','','','','']); }

  function handleOtpChange(val, idx) {
    const next = [...otp]; next[idx] = val.replace(/\D/g, '').slice(-1); setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  }
  function handleOtpKey(e, idx) {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  }

  async function handleGoogle() {
    setLoading(true); setError('');
    try {
      const r = await signInWithPopup(auth, googleProvider);
      await ensureUserDoc(r.user);
      navigate('/dashboard');
    } catch { setError(t('login.errGoogle')); }
    setLoading(false);
  }

  async function handleSendOtp(e) {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const num = phone.startsWith('+') ? phone : `+91${phone}`;
      if (!window.recaptchaVerifier)
        window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      confirmRef.current = await signInWithPhoneNumber(auth, num, window.recaptchaVerifier);
      setStep(2);
    } catch {
      setError(t('login.errOtp'));
      window.recaptchaVerifier = null;
    }
    setLoading(false);
  }

  async function handleVerifyOtp(e) {
    e.preventDefault(); setLoading(true); setError('');
    try {
      const r = await confirmRef.current.confirm(otp.join(''));
      await ensureUserDoc(r.user);
      navigate('/dashboard');
    } catch { setError(t('login.errVerify')); }
    setLoading(false);
  }

  async function handleEmail(e) {
    e.preventDefault(); setLoading(true); setError('');
    try {
      let r;
      try { r = await signInWithEmailAndPassword(auth, email, password); }
      catch { r = await createUserWithEmailAndPassword(auth, email, password); }
      await ensureUserDoc(r.user);
      navigate('/dashboard');
    } catch { setError(t('login.errEmail')); }
    setLoading(false);
  }

  const inp = 'w-full px-4 py-3 rounded-xl border border-sand-200 bg-white text-sm text-sand-800 placeholder-sand-400 focus:outline-none focus:border-olive-500 focus:ring-2 focus:ring-olive-100 transition';

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0e8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div id="recaptcha-container" />

      {/* Back to site */}
      <Link to="/" className="flex items-center gap-1.5 text-xs text-sand-400 hover:text-sand-700 mb-6 transition-colors self-start max-w-sm w-full mx-auto">
        <ArrowLeft size={13} /> {t('login.backSite')}
      </Link>

      <AnimatePresence mode="wait">
        <motion.div key={method + step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
          style={{ width: '100%', maxWidth: '400px' }}>

          {/* Card */}
          <div style={{ background: 'white', borderRadius: '20px', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', border: '1px solid #e8e4dc' }}>

            {/* Logo + brand */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
              <Logo size={40} />
              <div>
                <p style={{ fontWeight: 800, fontSize: '15px', color: '#1c1917', margin: 0 }}>{BRAND.shortName}</p>
                <p style={{ fontSize: '11px', color: '#a8a29e', margin: '2px 0 0' }}>Dairy Farm · {BRAND.city}</p>
              </div>
            </div>

            {/* Back inside card */}
            {method && (
              <button onClick={reset} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#a8a29e', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '16px', padding: 0 }}>
                <ArrowLeft size={13} /> {t('login.back')}
              </button>
            )}

            {/* Title */}
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#1c1917', margin: '0 0 4px' }}>
                {!method ? t('login.title') :
                 method === 'phone' ? (step === 1 ? t('login.phoneTitle') : t('login.otpTitle')) :
                 t('login.emailTitle')}
              </h1>
              <p style={{ fontSize: '13px', color: '#a8a29e', margin: 0 }}>
                {!method ? t('login.sub') :
                 method === 'phone' && step === 1 ? t('login.phoneSub') :
                 method === 'phone' && step === 2 ? t('login.otpSub', { phone }) :
                 t('login.emailSub')}
              </p>
            </div>

            {/* Error */}
            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: '#dc2626', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            {/* ── Method selection ── */}
            {!method && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Google */}
                <button onClick={handleGoogle} disabled={loading}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', border: '1.5px solid #e8e4dc', background: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#44403c', transition: 'all 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#3d5a3e'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#e8e4dc'}>
                  <GoogleIcon />
                  <span style={{ flex: 1, textAlign: 'left' }}>{t('login.google')}</span>
                  <ArrowRight size={14} style={{ color: '#c8c4be' }} />
                </button>

                {/* Phone */}
                <button onClick={() => setMethod('phone')}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', border: '1.5px solid #e8e4dc', background: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#44403c', transition: 'all 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#3d5a3e'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#e8e4dc'}>
                  <Phone size={17} style={{ color: '#3d5a3e', flexShrink: 0 }} />
                  <span style={{ flex: 1, textAlign: 'left' }}>{t('login.phone')}</span>
                  <ArrowRight size={14} style={{ color: '#c8c4be' }} />
                </button>

                {/* Email */}
                <button onClick={() => setMethod('email')}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', border: '1.5px solid #e8e4dc', background: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#44403c', transition: 'all 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#3d5a3e'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#e8e4dc'}>
                  <Mail size={17} style={{ color: '#3d5a3e', flexShrink: 0 }} />
                  <span style={{ flex: 1, textAlign: 'left' }}>{t('login.email')}</span>
                  <ArrowRight size={14} style={{ color: '#c8c4be' }} />
                </button>

                <p style={{ textAlign: 'center', fontSize: '11px', color: '#c8c4be', marginTop: '8px' }}>
                  {t('login.newUser')}
                </p>
              </div>
            )}

            {/* ── Phone Step 1 ── */}
            {method === 'phone' && step === 1 && (
              <form onSubmit={handleSendOtp} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#78716c', display: 'block', marginBottom: '6px' }}>{t('login.mobileLabel')}</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ padding: '12px', borderRadius: '12px', border: '1.5px solid #e8e4dc', background: '#fafaf7', fontSize: '13px', fontWeight: 700, color: '#78716c', flexShrink: 0 }}>+91</div>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder={t('login.mobilePlaceholder')} required autoFocus className={inp} />
                  </div>
                </div>
                <button type="submit" disabled={loading || phone.length !== 10} className="btn-primary justify-center py-3 disabled:opacity-50">
                  {loading ? t('login.sending') : t('login.sendOtp')} <ArrowRight size={15} />
                </button>
              </form>
            )}

            {/* ── Phone Step 2 ── */}
            {method === 'phone' && step === 2 && (
              <form onSubmit={handleVerifyOtp} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#78716c', display: 'block', marginBottom: '12px' }}>{t('login.otpLabel')}</label>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between' }}>
                    {otp.map((val, idx) => (
                      <input key={idx} ref={el => otpRefs.current[idx] = el}
                        type="text" inputMode="numeric" maxLength={1} value={val}
                        onChange={e => handleOtpChange(e.target.value, idx)}
                        onKeyDown={e => handleOtpKey(e, idx)}
                        style={{ width: '44px', height: '52px', textAlign: 'center', fontSize: '20px', fontWeight: 900, borderRadius: '12px', border: val ? '2px solid #3d5a3e' : '1.5px solid #e8e4dc', background: val ? '#f2f7f2' : 'white', outline: 'none', transition: 'all 0.15s' }}
                      />
                    ))}
                  </div>
                </div>
                <button type="submit" disabled={loading || otp.join('').length !== 6} className="btn-primary justify-center py-3 disabled:opacity-50">
                  {loading ? t('login.verifying') : t('login.verify')} <ArrowRight size={15} />
                </button>
                <button type="button" onClick={() => { setStep(1); setOtp(['','','','','','']); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#a8a29e' }}>
                  {t('login.wrongNumber')}
                </button>
              </form>
            )}

            {/* ── Email ── */}
            {method === 'email' && (
              <form onSubmit={handleEmail} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#78716c', display: 'block', marginBottom: '6px' }}>{t('login.emailLabel')}</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" required autoFocus className={inp} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#78716c', display: 'block', marginBottom: '6px' }}>{t('login.passwordLabel')}</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPw(e.target.value)}
                      placeholder={t('login.passwordPlaceholder')} required className={inp} />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e' }}>
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary justify-center py-3 disabled:opacity-50">
                  {loading ? t('login.waiting') : t('login.continue')} <ArrowRight size={15} />
                </button>
              </form>
            )}
          </div>

          <p style={{ textAlign: 'center', fontSize: '11px', color: '#c8c4be', marginTop: '16px' }}>
            {t('login.terms')}
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
