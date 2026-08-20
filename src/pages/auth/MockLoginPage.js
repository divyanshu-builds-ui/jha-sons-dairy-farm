import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Mail, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import Logo from '../../assets/Logo';
import BRAND from '../../utils/config';

export default function MockLoginPage() {
  const [method, setMethod] = useState(null); // null | 'phone' | 'email'
  const [step, setStep] = useState(1);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [email, setEmail] = useState('');
  const [password, setPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const otpRefs = React.useRef([]);
  const navigate = useNavigate();

  function reset() {
    setMethod(null);
    setStep(1);
    setError('');
    setOtp(['', '', '', '', '', '']);
  }

  function handleOtpChange(val, idx) {
    const next = [...otp];
    next[idx] = val.replace(/\D/g, '').slice(-1);
    setOtp(next);
    if (val && idx < 5) otpRefs.current[idx + 1]?.focus();
  }

  function handleOtpKey(e, idx) {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) otpRefs.current[idx - 1]?.focus();
  }

  function handlePhoneSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (phone.length !== 10) {
      setError('Please enter a valid 10-digit phone number');
      setLoading(false);
      return;
    }

    // Mock OTP send
    setTimeout(() => {
      setStep(2);
      setLoading(false);
    }, 800);
  }

  function handleOtpSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (otp.join('').length !== 6) {
      setError('Please enter the complete OTP');
      setLoading(false);
      return;
    }

    // Mock OTP verify
    setTimeout(() => {
      const isAdmin = phone === BRAND.phone;
      const mockUser = {
        uid: 'mock_user_' + Date.now(),
        phoneNumber: '+91' + phone,
        displayName: isAdmin ? 'Admin' : 'Customer ' + phone.slice(-4),
        role: isAdmin ? 'admin' : 'customer',
      };
      localStorage.setItem('mockUser', JSON.stringify(mockUser));
      navigate(isAdmin ? '/admin' : '/dashboard');
      setLoading(false);
    }, 800);
  }

  function handleEmailSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!email || !password) {
      setError('Please fill all fields');
      setLoading(false);
      return;
    }

    // Mock login/register
    setTimeout(() => {
      const mockUser = {
        uid: 'mock_user_' + Date.now(),
        email: email,
        displayName: email.split('@')[0],
        role: 'customer',
      };
      localStorage.setItem('mockUser', JSON.stringify(mockUser));
      navigate('/dashboard');
      setLoading(false);
    }, 800);
  }

  const inp = 'w-full px-4 py-3 rounded-xl border border-sand-200 bg-white text-sm text-sand-800 placeholder-sand-400 focus:outline-none focus:border-olive-500 focus:ring-2 focus:ring-olive-100 transition';

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0e8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <Link to="/" className="flex items-center gap-1.5 text-xs text-sand-400 hover:text-sand-700 mb-6 transition-colors self-start max-w-sm w-full mx-auto">
        <ArrowLeft size={13} /> Back to website
      </Link>

      <AnimatePresence mode="wait">
        <motion.div key={method + step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.22 }}
          style={{ width: '100%', maxWidth: '400px' }}>

          <div style={{ background: 'white', borderRadius: '20px', padding: '32px', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', border: '1px solid #e8e4dc' }}>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
              <Logo size={40} />
              <div>
                <p style={{ fontWeight: 800, fontSize: '15px', color: '#1c1917', margin: 0 }}>{BRAND.shortName}</p>
                <p style={{ fontSize: '11px', color: '#a8a29e', margin: '2px 0 0' }}>Dairy Farm · {BRAND.city}</p>
              </div>
            </div>

            {method && (
              <button onClick={reset} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#a8a29e', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '16px', padding: 0 }}>
                <ArrowLeft size={13} /> Back
              </button>
            )}

            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '22px', fontWeight: 900, color: '#1c1917', margin: '0 0 4px' }}>
                {!method ? 'Login / Sign Up' :
                 method === 'phone' ? (step === 1 ? 'Phone Number' : 'Enter OTP') :
                 'Email Login'}
              </h1>
              <p style={{ fontSize: '13px', color: '#a8a29e', margin: 0 }}>
                {!method ? 'Apna account access karein' :
                 method === 'phone' && step === 1 ? 'Aapke number pe OTP aayega' :
                 method === 'phone' && step === 2 ? `OTP bheja gaya +91 ${phone} pe` :
                 'Email aur password daalen'}
              </p>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: '#dc2626', marginBottom: '16px' }}>
                {error}
              </div>
            )}

            {!method && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button onClick={() => setMethod('phone')}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', border: '1.5px solid #e8e4dc', background: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#44403c', transition: 'all 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#3d5a3e'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#e8e4dc'}>
                  <Phone size={17} style={{ color: '#3d5a3e', flexShrink: 0 }} />
                  <span style={{ flex: 1, textAlign: 'left' }}>Continue with Phone OTP</span>
                  <ArrowRight size={14} style={{ color: '#c8c4be' }} />
                </button>

                <button onClick={() => setMethod('email')}
                  style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderRadius: '12px', border: '1.5px solid #e8e4dc', background: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#44403c', transition: 'all 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#3d5a3e'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#e8e4dc'}>
                  <Mail size={17} style={{ color: '#3d5a3e', flexShrink: 0 }} />
                  <span style={{ flex: 1, textAlign: 'left' }}>Continue with Email</span>
                  <ArrowRight size={14} style={{ color: '#c8c4be' }} />
                </button>

                <p style={{ textAlign: 'center', fontSize: '11px', color: '#c8c4be', marginTop: '8px' }}>
                  Pehli baar? Account automatically ban jaayega.
                </p>
              </div>
            )}

            {method === 'phone' && step === 1 && (
              <form onSubmit={handlePhoneSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#78716c', display: 'block', marginBottom: '6px' }}>Mobile Number</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ padding: '12px', borderRadius: '12px', border: '1.5px solid #e8e4dc', background: '#fafaf7', fontSize: '13px', fontWeight: 700, color: '#78716c', flexShrink: 0 }}>+91</div>
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit number" required autoFocus className={inp} />
                  </div>
                </div>
                <button type="submit" disabled={loading || phone.length !== 10} className="btn-primary justify-center py-3 disabled:opacity-50">
                  {loading ? 'Sending...' : 'Send OTP'} <ArrowRight size={15} />
                </button>
              </form>
            )}

            {method === 'phone' && step === 2 && (
              <form onSubmit={handleOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#78716c', display: 'block', marginBottom: '12px' }}>6-digit OTP</label>
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
                  {loading ? 'Verifying...' : 'Verify & Login'} <ArrowRight size={15} />
                </button>
                <button type="button" onClick={() => { setStep(1); setOtp(['', '', '', '', '', '']); }}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', color: '#a8a29e' }}>
                  Wrong number? Change it
                </button>
              </form>
            )}

            {method === 'email' && (
              <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#78716c', display: 'block', marginBottom: '6px' }}>Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@example.com" required autoFocus className={inp} />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 600, color: '#78716c', display: 'block', marginBottom: '6px' }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPw(e.target.value)}
                      placeholder="Min. 6 characters" required className={inp} />
                    <button type="button" onClick={() => setShowPw(v => !v)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e' }}>
                      {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary justify-center py-3 disabled:opacity-50">
                  {loading ? 'Please wait...' : 'Continue'} <ArrowRight size={15} />
                </button>
              </form>
            )}
          </div>

          <p style={{ textAlign: 'center', fontSize: '11px', color: '#c8c4be', marginTop: '16px' }}>
            By continuing, you agree to our terms of service.
          </p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
