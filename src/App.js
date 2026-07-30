import React, { useState, useEffect, useMemo, useCallback, lazy } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import TopProgressBar from './components/TopProgressBar';
import { AppErrorBoundary, DevErrorBoundary } from './components/ErrorBoundary';
import { db, doc, getDoc, updateDoc, cachedGetDoc } from './services/firebase';
import { ConfirmProvider } from './components/ConfirmModal';
import { FeatureFlagProvider } from './context/FeatureFlags';
import { initErrorTracking } from './services/errorLogger';
import { runAutoCleanup } from './utils/autoCleanup';
import { initUsageTracking } from './utils/usageTracker';
import SplashScreen from './components/SplashScreen';
import InstallPrompt from './components/InstallPrompt';
import OfflineBanner from './components/OfflineBanner';
import WelcomePopup from './components/WelcomePopup';
import PaymentBlock from './components/PaymentBlock';

import Login from './pages/Login';

// Login success animation overlay
function LoginSuccess({ name, role }) {
  return (
    <div className="fixed inset-0 z-[999] bg-[#0f172a] flex flex-col items-center justify-center">
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        className="flex flex-col items-center gap-8">
        {/* Check circle */}
        <div className="relative">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.15, 1] }}
            transition={{ duration: 0.5, times: [0, 0.7, 1] }}
            className="w-24 h-24 rounded-full bg-royal-600 flex items-center justify-center shadow-2xl shadow-royal-600/40">
            <motion.svg
              width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <motion.path d="M5 13l4 4L19 7"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.3, duration: 0.4 }} />
            </motion.svg>
          </motion.div>
          {/* Ripple */}
          <motion.div
            initial={{ scale: 1, opacity: 0.4 }}
            animate={{ scale: 2.4, opacity: 0 }}
            transition={{ delay: 0.2, duration: 0.9 }}
            className="absolute inset-0 rounded-full bg-royal-500" />
        </div>
        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center px-8">
          <p className="text-white font-black text-2xl leading-snug">
            {name ? `Welcome, ${name}` : 'Welcome back'}
          </p>
          <p className="text-white/30 text-sm mt-3">
            {role === 'admin' ? 'Admin Panel' : 'Signing you in...'}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

// Lazy load pages for faster initial load
const RetailerHome = lazy(() => import('./pages/retailer/Home'));
const PlaceOrder = lazy(() => import('./pages/retailer/PlaceOrder'));
const Checkout = lazy(() => import('./pages/retailer/Checkout'));
const TrackOrder = lazy(() => import('./pages/retailer/TrackOrder'));
const OrderHistory = lazy(() => import('./pages/retailer/OrderHistory'));
const MyLedger = lazy(() => import('./pages/retailer/MyLedger'));
const RetailerProfile = lazy(() => import('./pages/retailer/Profile'));
const Support = lazy(() => import('./pages/retailer/Support'));
const Settings = lazy(() => import('./pages/retailer/Settings'));
const PriceList = lazy(() => import('./pages/retailer/PriceList'));
const About = lazy(() => import('./pages/retailer/About'));
const PrivacyPolicy = lazy(() => import('./pages/retailer/PrivacyPolicy'));
const Terms = lazy(() => import('./pages/retailer/Terms'));
const Guide = lazy(() => import('./pages/retailer/Guide'));
const Blocked = lazy(() => import('./pages/retailer/Blocked'));

const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const AdminRetailers = lazy(() => import('./pages/admin/Retailers'));
const OrderDetail = lazy(() => import('./pages/admin/OrderDetail'));
const AdminInventory = lazy(() => import('./pages/admin/Inventory'));
const AdminLedger = lazy(() => import('./pages/admin/Ledger'));
const AdminSettings = lazy(() => import('./pages/admin/Settings'));

const DailyLedger = lazy(() => import('./pages/admin/DailyLedger'));
const CompanyOrder = lazy(() => import('./pages/admin/CompanyOrder'));
const SupportTickets = lazy(() => import('./pages/admin/SupportTickets'));
const AdminSessions = lazy(() => import('./pages/admin/Sessions'));
const AdminAnnouncements = lazy(() => import('./pages/admin/Announcements'));
const AdminPlaceOrder = lazy(() => import('./pages/admin/PlaceOrder'));
const DevPanel = lazy(() => import('./pages/admin/DevPanel'));
const ErrorLogs = lazy(() => import('./pages/dev/ErrorLogs'));
const UserSessions = lazy(() => import('./pages/dev/UserSessions'));
const OrderAnalytics = lazy(() => import('./pages/dev/OrderAnalytics'));
const OrderManager = lazy(() => import('./pages/dev/OrderManager'));
const RetailerActivity = lazy(() => import('./pages/dev/RetailerActivity'));
const DeployInfo = lazy(() => import('./pages/dev/DeployInfo'));
const Announcements = lazy(() => import('./pages/dev/Announcements'));
const DatabaseCleanup = lazy(() => import('./pages/dev/DatabaseCleanup'));
const FeatureFlags = lazy(() => import('./pages/dev/FeatureFlags'));
const AuditLog = lazy(() => import('./pages/dev/AuditLog'));
const AppRatings = lazy(() => import('./pages/dev/AppRatings'));
const DataExport = lazy(() => import('./pages/dev/DataExport'));
const BackupRestore = lazy(() => import('./pages/dev/BackupRestore'));
const ApiResponseMonitor = lazy(() => import('./pages/dev/ApiResponseMonitor'));
const ScheduledTasks = lazy(() => import('./pages/dev/ScheduledTasks'));
const ConfigDiff = lazy(() => import('./pages/dev/ConfigDiff'));
const DocEditor = lazy(() => import('./pages/dev/DocEditor'));
const BulkUpdate = lazy(() => import('./pages/dev/BulkUpdate'));
const MonthlyReport = lazy(() => import('./pages/dev/MonthlyReport'));
const DevGuide = lazy(() => import('./pages/dev/DevGuide'));
const NotFound = lazy(() => import('./pages/NotFound'));

import RetailerLayout from './components/layout/RetailerLayout';
import AdminLayout from './components/layout/AdminLayout';
import DeveloperLayout from './components/layout/DeveloperLayout';

import { LazyMotion, domAnimation, m, motion } from 'framer-motion';

// Init global error tracking
initErrorTracking();
runAutoCleanup();
initUsageTracking();

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

function MaintenancePage() {
  return (
    <LazyMotion features={domAnimation}>
    <div className="min-h-screen bg-gradient-to-br from-royal-950 via-royal-900 to-royal-800 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background orbs */}
      <m.div animate={{ scale: [1, 1.3, 1], opacity: [0.08, 0.15, 0.08] }} transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-0 left-0 w-80 h-80 bg-mint-500 rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3" />
      <m.div animate={{ scale: [1, 1.2, 1], opacity: [0.06, 0.12, 0.06] }} transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        className="absolute bottom-0 right-0 w-96 h-96 bg-royal-400 rounded-full blur-3xl translate-x-1/4 translate-y-1/4" />
      <m.div animate={{ scale: [1, 1.15, 1], x: [0, 30, 0], y: [0, -20, 0] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1/3 right-1/4 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />

      {/* Floating particles */}
      {[...Array(6)].map((_, i) => (
        <m.div key={i}
          animate={{ y: [0, -30, 0], opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.5 }}
          className="absolute w-1.5 h-1.5 bg-mint-400/40 rounded-full"
          style={{ left: `${15 + i * 15}%`, top: `${20 + (i % 3) * 25}%` }} />
      ))}

      <div className="max-w-sm w-full text-center relative z-10">
        {/* Animated gear icon */}
        <m.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 150, damping: 15 }}
          className="relative mx-auto mb-8">
          <m.div animate={{ rotate: 360 }} transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            className="w-24 h-24 mx-auto rounded-3xl bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </m.div>
          <m.div animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }} transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 w-24 h-24 mx-auto rounded-3xl border border-amber-400/30" />
        </m.div>

        {/* Text with stagger animation */}
        <m.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="text-3xl font-black text-white mb-3">Under Maintenance</m.h1>
        <m.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="text-base text-royal-200 mb-4">We're making things better for you.</m.p>

        {/* Animated progress bar */}
        <m.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          className="w-48 h-1.5 bg-white/10 rounded-full mx-auto mb-8 overflow-hidden">
          <m.div animate={{ x: ['-100%', '100%'] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-1/2 h-full bg-gradient-to-r from-transparent via-mint-400 to-transparent rounded-full" />
        </m.div>

        {/* Contact card */}
        <m.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
          className="bg-white/5 backdrop-blur-sm rounded-2xl px-5 py-4 border border-white/10">
          <p className="text-sm text-royal-300">For urgent queries contact</p>
          <a href="tel:+919939079107" className="text-lg font-bold text-white mt-1 block">+91 99390 79107</a>
        </m.div>

        <m.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
          className="text-xs text-royal-400/50 mt-8">Lucy Garden • Fresh Dairy Supply</m.p>
      </div>
    </div>
    </LazyMotion>
  );
}

function AppContent() {
  const DEV_PHONE = '8051725780';
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [splashDone, setSplashDone] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(null); // { name, role }
  const [maintenance, setMaintenance] = useState(false);
  const [siteBlock, setSiteBlock] = useState(null);

  // Minimum splash duration — longer during launch week for premium feel
  useEffect(() => {
    const launch = new Date('2026-06-01T00:00:00');
    const diff = (new Date() - launch) / (1000 * 60 * 60 * 24);
    const isLaunch = diff >= 0 && diff <= 7;
    const timer = setTimeout(() => setSplashDone(true), isLaunch ? 3200 : 1500);
    return () => clearTimeout(timer);
  }, []);

  // Check maintenance mode & site block
  useEffect(() => {
    const checkSettings = async () => {
      try {
        const snap = await cachedGetDoc(doc(db, 'settings', 'app'), 5 * 60 * 1000);
        if (snap.exists()) {
          const data = snap.data();
          setMaintenance(data.maintenance || false);
          setSiteBlock(data.siteBlock?.enabled ? data.siteBlock : null);
        }
      } catch {}
    };
    checkSettings();
  }, []);

  const verifyUser = useCallback(async () => {
    // Per-tab session isolation: use sessionStorage to know which phone is active in THIS tab
    const activePhone = sessionStorage.getItem('lg_active_phone');
    const saved = activePhone
      ? localStorage.getItem(`lg_user_${activePhone}`)
      : localStorage.getItem('lg_last_login') ? localStorage.getItem(`lg_user_${localStorage.getItem('lg_last_login')}`) : null;
    
    // Backward compat: if no per-user key found, try old key and migrate
    const finalSaved = saved || localStorage.getItem('lg_user');
    if (!finalSaved) { setLoading(false); return; }

    try {
      const parsed = JSON.parse(finalSaved);
      if (!parsed.phone) { setLoading(false); return; }

      // Dev bypass - skip Firestore verification
      if (parsed.phone === DEV_PHONE) {
        if (parsed.sessionExpiry && new Date(parsed.sessionExpiry) < new Date()) {
          localStorage.removeItem(`lg_user_${parsed.phone}`); localStorage.removeItem('lg_user'); sessionStorage.removeItem('lg_active_phone'); setLoading(false); return;
        }
        sessionStorage.setItem('lg_active_phone', parsed.phone);
        localStorage.setItem('lg_user', JSON.stringify(parsed)); // backward compat
        setUser(parsed); setLoading(false); return;
      }

      // Session verify cache - 1 hour tak no DB call (saves reads on rapid login/logout)
      const lastVerify = parseInt(localStorage.getItem('lg_last_verify_' + parsed.phone) || '0');
      const VERIFY_TTL = 60 * 60 * 1000; // 1 hour
      if (Date.now() - lastVerify < VERIFY_TTL && parsed.sessionExpiry && new Date(parsed.sessionExpiry) > new Date()) {
        sessionStorage.setItem('lg_active_phone', parsed.phone);
        setUser(parsed); setLoading(false); return;
      }
      const userDoc = await getDoc(doc(db, 'users', parsed.phone));
      if (!userDoc.exists()) { localStorage.removeItem(`lg_user_${parsed.phone}`); localStorage.removeItem('lg_user'); sessionStorage.removeItem('lg_active_phone'); setLoading(false); return; }

      const firestoreData = userDoc.data();

      // Session validation (skip for admin — multi-device allowed)
      if (firestoreData.role !== 'admin' && parsed.sessionId && firestoreData.activeSession !== parsed.sessionId) {
        // Session terminated from another device
        localStorage.removeItem(`lg_user_${parsed.phone}`);
        localStorage.removeItem('lg_user');
        sessionStorage.removeItem('lg_active_phone');
        setLoading(false);
        return;
      }

      // Session expiry check
      if (parsed.sessionExpiry && new Date(parsed.sessionExpiry) < new Date()) {
        localStorage.removeItem(`lg_user_${parsed.phone}`);
        localStorage.removeItem('lg_user');
        sessionStorage.removeItem('lg_active_phone');
        setLoading(false);
        return;
      }

      const verifiedUser = { ...firestoreData, phone: parsed.phone, sessionId: parsed.sessionId, sessionExpiry: parsed.sessionExpiry, blocked: firestoreData.blocked || false };
      localStorage.setItem(`lg_user_${parsed.phone}`, JSON.stringify(verifiedUser));
      localStorage.setItem('lg_user', JSON.stringify(verifiedUser)); // backward compat for other pages
      localStorage.setItem('lg_last_login', parsed.phone);
      sessionStorage.setItem('lg_active_phone', parsed.phone);
      setUser(verifiedUser);

      // Update last login info on session restore too
      try {
        const ua = navigator.userAgent || '';
        await updateDoc(doc(db, 'users', parsed.phone), {
          lastLogin: new Date().toISOString(),
          deviceInfo: ua.slice(0, 200),
          lastLoginDevice: parseDevice(ua),
        });
      } catch (e) {}
    } catch (err) {
      try {
        const parsed = JSON.parse(saved);
        // Offline — check expiry locally
        if (parsed.sessionExpiry && new Date(parsed.sessionExpiry) < new Date()) {
          localStorage.removeItem(`lg_user_${parsed.phone}`);
          sessionStorage.removeItem('lg_active_phone');
        } else {
          sessionStorage.setItem('lg_active_phone', parsed.phone);
          setUser(parsed);
        }
      } catch (e) {
        // corrupted data
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { verifyUser(); }, [verifyUser]);

  // Session monitoring - periodic check instead of real-time onSnapshot
  // onSnapshot was causing continuous reads even when idle
  useEffect(() => {
    if (!user?.phone || !user?.sessionId) return;
    if (user.phone === DEV_PHONE) return;
    if (user.role === 'admin') return;

    const checkSession = async () => {
      try {
        const snap = await getDoc(doc(db, 'users', user.phone));
        if (!snap.exists()) { localStorage.removeItem(`lg_user_${user.phone}`); localStorage.removeItem('lg_user'); sessionStorage.removeItem('lg_active_phone'); window.location.reload(); return; }
        const data = snap.data();
        if (data.activeSession && data.activeSession !== user.sessionId) {
          localStorage.removeItem(`lg_user_${user.phone}`);
          localStorage.removeItem('lg_user');
          sessionStorage.removeItem('lg_active_phone');
          window.location.reload();
        }
      } catch (e) {} // offline — skip
    };

    // Check immediately, then every 2 minutes (was real-time onSnapshot)
    checkSession();
    const id = setInterval(checkSession, 2 * 60 * 1000);
    return () => clearInterval(id);
  }, [user?.phone, user?.sessionId]);

  // Periodic session expiry check (every 5 min)
  useEffect(() => {
    if (!user) return;
    const check = () => {
      const phone = sessionStorage.getItem('lg_active_phone');
      if (!phone) return;
      const saved = localStorage.getItem(`lg_user_${phone}`);
      if (!saved) return;
      const { sessionExpiry } = JSON.parse(saved);
      if (sessionExpiry && new Date(sessionExpiry) < new Date()) {
        localStorage.removeItem(`lg_user_${phone}`);
        localStorage.removeItem('lg_user');
        sessionStorage.removeItem('lg_active_phone');
        window.location.reload();
      }
    };
    const id = setInterval(check, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [user]);

  const handleLogin = useCallback(async (u) => { const lastLoginTime = parseInt(sessionStorage.getItem('lg_last_login_time') || '0'); if (Date.now() - lastLoginTime < 3000) return; sessionStorage.setItem('lg_last_login_time', String(Date.now()));
    // Show success animation first, then set user
    setLoginSuccess({ name: u.name || '', role: u.role || 'retailer' });
    setTimeout(() => {
      setLoginSuccess(null);
      setUser(u);
    }, 1800);
    // Save device info on login
    try {
      if (u.phone) {
        const ua = navigator.userAgent || '';
        await updateDoc(doc(db, 'users', u.phone), {
          lastLogin: new Date().toISOString(),
          deviceInfo: ua.slice(0, 200),
          lastLoginDevice: parseDevice(ua),
        });
      }
    } catch (e) {}
  }, []);

  const router = useMemo(() => {
    if (!user) return null;
    const role = user.role;
    const isDev = user.phone === '8051725780';

    const homeRedirect = isDev ? '/dev' : role === 'admin' ? '/admin' : '/';

    return createBrowserRouter([
      {
        path: '/',
        element: role === 'retailer' ? <AppErrorBoundary><RetailerLayout /></AppErrorBoundary> : <Navigate to={homeRedirect} replace />,
        children: role === 'retailer' ? [
          { index: true, element: <RetailerHome /> },
          { path: 'order', element: <PlaceOrder /> },
          { path: 'checkout', element: <Checkout /> },
          { path: 'track', element: <TrackOrder /> },
          { path: 'history', element: <OrderHistory /> },
          { path: 'my-ledger', element: <MyLedger /> },
          { path: 'profile', element: <RetailerProfile /> },
          { path: 'support', element: <Support /> },
          { path: 'settings', element: <Settings /> },
          { path: 'prices', element: <PriceList /> },
          { path: 'about', element: <About /> },
          { path: 'privacy', element: <PrivacyPolicy /> },
          { path: 'terms', element: <Terms /> },
          { path: 'guide', element: <Guide /> },
          ] : [],
      },
      {
        path: '/admin',
        element: (role === 'admin' || isDev) ? <AppErrorBoundary><AdminLayout /></AppErrorBoundary> : <Navigate to={homeRedirect} replace />,
        children: (role === 'admin' || isDev) ? [
          { index: true, element: <AdminDashboard /> },
          { path: 'retailers', element: <AdminRetailers /> },
          { path: 'orders/:id', element: <OrderDetail /> },
          { path: 'inventory', element: <AdminInventory /> },
          { path: 'ledger', element: <AdminLedger /> },
          { path: 'settings', element: <AdminSettings /> },

          { path: 'daily-ledger', element: <DailyLedger /> },
          { path: 'company-order', element: <CompanyOrder /> },
          { path: 'support', element: <SupportTickets /> },
          { path: 'sessions', element: <AdminSessions /> },
          { path: 'announcements', element: <AdminAnnouncements /> },
          { path: 'place-order', element: <AdminPlaceOrder /> },
          ] : [],
      },
      {
        path: '/dev',
        element: isDev ? <DevErrorBoundary><DeveloperLayout /></DevErrorBoundary> : <Navigate to={homeRedirect} replace />,
        children: isDev ? [
          { index: true, element: <DevPanel /> },
          { path: 'errors', element: <ErrorLogs /> },
          { path: 'sessions', element: <UserSessions /> },
          { path: 'analytics', element: <OrderAnalytics /> },
          { path: 'order-manager', element: <OrderManager /> },
          { path: 'activity', element: <RetailerActivity /> },
          { path: 'deploy', element: <DeployInfo /> },
          { path: 'announce', element: <Announcements /> },
          { path: 'cleanup', element: <DatabaseCleanup /> },
          { path: 'flags', element: <FeatureFlags /> },
          { path: 'audit', element: <AuditLog /> },
          { path: 'ratings', element: <AppRatings /> },
          { path: 'export', element: <DataExport /> },
          { path: 'backup', element: <BackupRestore /> },
          { path: 'api-monitor', element: <ApiResponseMonitor /> },
          { path: 'tasks', element: <ScheduledTasks /> },
          { path: 'config-diff', element: <ConfigDiff /> },
          { path: 'editor', element: <DocEditor /> },
          { path: 'bulk-update', element: <BulkUpdate /> },
          { path: 'report', element: <MonthlyReport /> },
          { path: 'guide', element: <DevGuide /> },
          ] : [],
      },
      { path: '*', element: <NotFound /> },
    ]);
  // eslint-disable-next-line
  }, [user?.role, user?.phone]);

  if (loading || !splashDone) return <SplashScreen />;

  if (!user) {
    return <><Login onLogin={handleLogin} />{loginSuccess && <LoginSuccess name={loginSuccess.name} role={loginSuccess.role} />}<InstallPrompt /><OfflineBanner /></>;
  }

  // Site block — only developer can bypass, others see block page after login
  if (siteBlock && user.phone !== DEV_PHONE) return <PaymentBlock config={siteBlock} userRole={user.role} />;

  if (maintenance && user.role === 'retailer' && user.phone !== DEV_PHONE) return <MaintenancePage />;

  // Blocked retailer — only Blocked page + Support
  if (user.role === 'retailer' && user.blocked && user.phone !== DEV_PHONE) {
    const blockedRouter = createBrowserRouter([
      {
        path: '/',
        element: <AppErrorBoundary><RetailerLayout /></AppErrorBoundary>,
        children: [
          { index: true, element: <Blocked /> },
          { path: 'support', element: <Support /> },
          { path: '*', element: <Navigate to="/" replace /> },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ]);
    return (
      <>
        <TopProgressBar />
        <RouterProvider router={blockedRouter} />
        <OfflineBanner />
      </>
    );
  }

  return (
    <>
      <TopProgressBar />
      <RouterProvider router={router} />
      <InstallPrompt />
      <OfflineBanner />
      {user.role === 'retailer' && <WelcomePopup />}
    </>
  );
}

export default function App() {
  return <ConfirmProvider><FeatureFlagProvider><AppContent /></FeatureFlagProvider></ConfirmProvider>;
}



