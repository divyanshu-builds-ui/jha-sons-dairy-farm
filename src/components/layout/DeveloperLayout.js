import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Bug, LogOut, Code, Activity, Radio, BarChart3, UserCheck, Rocket, Megaphone, Database, Flag, ScrollText, ExternalLink, MoreHorizontal, ShieldCheck, Star, Download, HardDrive, Wifi, Clock, GitCompare, BookOpen, FileEdit, Layers, FileText, PackageSearch } from 'lucide-react';
import { useConfirm } from '../../components/ConfirmModal';
import { useBottomSheet } from '../../hooks/useBottomSheet';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { db, doc, getDoc } from '../../services/firebase';
import { APP_CONFIG } from '../../utils/config';

const DEV_SESSION_KEY = 'lg_dev_verified';
const DEV_SESSION_DURATION = 60 * 60 * 1000; // 1 hour

const devLinks = [
  { to: '/dev', label: 'Dev Panel', Icon: Server, end: true },
  { to: '/dev/errors', label: 'Error Logs', Icon: Bug },
  { to: '/dev/sessions', label: 'Sessions', Icon: Radio },
  { to: '/dev/analytics', label: 'Analytics', Icon: BarChart3 },
  { to: '/dev/order-manager', label: 'Order Manager', Icon: PackageSearch },
  { to: '/dev/activity', label: 'Retailer Activity', Icon: UserCheck },
  { to: '/dev/deploy', label: 'Deploy Info', Icon: Rocket },
  { to: '/dev/announce', label: 'Announcements', Icon: Megaphone },
  { to: '/dev/cleanup', label: 'DB Cleanup', Icon: Database },
  { to: '/dev/flags', label: 'Feature Flags', Icon: Flag },
  { to: '/dev/audit', label: 'Audit Log', Icon: ScrollText },
  { to: '/dev/ratings', label: 'App Ratings', Icon: Star },
  { to: '/dev/export', label: 'Data Export', Icon: Download },
  { to: '/dev/backup', label: 'Backup & Restore', Icon: HardDrive },
  { to: '/dev/api-monitor', label: 'API Monitor', Icon: Wifi },
  { to: '/dev/tasks', label: 'Scheduled Tasks', Icon: Clock },
  { to: '/dev/config-diff', label: 'Config Diff', Icon: GitCompare },
  { to: '/dev/editor', label: 'Doc Editor', Icon: FileEdit },
  { to: '/dev/bulk-update', label: 'Bulk Update', Icon: Layers },
  { to: '/dev/report', label: 'Monthly Report', Icon: FileText },
  { to: '/dev/guide', label: 'Dev Guide', Icon: BookOpen },
];

const bottomNavLinks = [
  { to: '/dev', label: 'Health', Icon: Server, end: true },
  { to: '/dev/errors', label: 'Errors', Icon: Bug },
  { to: '/dev/sessions', label: 'Sessions', Icon: Radio },
  { to: '/dev/analytics', label: 'Analytics', Icon: BarChart3 },
];

const moreLinks = [
  { to: '/dev/activity', label: 'Activity', Icon: UserCheck },
  { to: '/dev/order-manager', label: 'Orders', Icon: PackageSearch },
  { to: '/dev/deploy', label: 'Deploy', Icon: Rocket },
  { to: '/dev/announce', label: 'Announce', Icon: Megaphone },
  { to: '/dev/cleanup', label: 'Cleanup', Icon: Database },
  { to: '/dev/flags', label: 'Flags', Icon: Flag },
  { to: '/dev/audit', label: 'Audit', Icon: ScrollText },
  { to: '/dev/ratings', label: 'Ratings', Icon: Star },
  { to: '/dev/export', label: 'Export', Icon: Download },
  { to: '/dev/backup', label: 'Backup', Icon: HardDrive },
  { to: '/dev/api-monitor', label: 'API Mon', Icon: Wifi },
  { to: '/dev/tasks', label: 'Tasks', Icon: Clock },
  { to: '/dev/config-diff', label: 'Config', Icon: GitCompare },
  { to: '/dev/editor', label: 'Editor', Icon: FileEdit },
  { to: '/dev/bulk-update', label: 'Bulk', Icon: Layers },
  { to: '/dev/report', label: 'Report', Icon: FileText },
  { to: '/dev/guide', label: 'Guide', Icon: BookOpen },
];

const devShimmer = {animation:'shimmer 1.2s ease-in-out infinite',background:'linear-gradient(110deg,#111827 25%,#1f2937 50%,#111827 75%)',backgroundSize:'200% 100%'};
function DevPageSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="h-5 w-36 rounded-lg" style={devShimmer} />
        <div className="h-9 w-9 rounded-xl" style={devShimmer} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 rounded-2xl" style={devShimmer} />
        <div className="h-24 rounded-2xl" style={{...devShimmer,animationDelay:'0.1s'}} />
      </div>
      <div className="h-40 rounded-2xl" style={{...devShimmer,animationDelay:'0.15s'}} />
      <div className="space-y-2">
        <div className="h-20 rounded-2xl" style={{...devShimmer,animationDelay:'0.2s'}} />
        <div className="h-20 rounded-2xl" style={{...devShimmer,animationDelay:'0.25s'}} />
      </div>
    </div>
  );
}

export default function DeveloperLayout() {
  const [devVerified, setDevVerified] = useState(false);
  const [devPin, setDevPin] = useState('');
  const [devError, setDevError] = useState('');
  const [devAttempts, setDevAttempts] = useState(0);
  const [correctPin, setCorrectPin] = useState(null); // loaded from Firebase

  // Check if dev session is still valid
  useEffect(() => {
    const stored = sessionStorage.getItem(DEV_SESSION_KEY);
    if (stored) {
      const { expiry } = JSON.parse(stored);
      if (expiry > Date.now()) { setDevVerified(true); return; }
      sessionStorage.removeItem(DEV_SESSION_KEY);
    }
    // Load dev PIN from Firebase
    (async () => {
      try {
        const snap = await getDoc(doc(db, 'settings', 'devAccess'));
        if (snap.exists() && snap.data().pin) setCorrectPin(snap.data().pin);
        else setCorrectPin('0000'); // fallback
      } catch (e) { setCorrectPin('0000'); }
    })();
  }, []);

  const verifyDevPin = useCallback(() => {
    if (!correctPin) return; // still loading
    if (devPin === correctPin) {
      sessionStorage.setItem(DEV_SESSION_KEY, JSON.stringify({ expiry: Date.now() + DEV_SESSION_DURATION }));
      setDevVerified(true); setDevPin(''); setDevError('');
    } else {
      const newAttempts = devAttempts + 1;
      setDevAttempts(newAttempts);
      setDevPin('');
      if (newAttempts >= 5) {
        localStorage.clear(); sessionStorage.clear();
        window.location.reload();
      } else {
        setDevError(`Wrong PIN (${5 - newAttempts} left)`);
      }
    }
  }, [devPin, devAttempts, correctPin]);

  useEffect(() => {
    if (devPin.length === 4) verifyDevPin();
  }, [devPin, verifyDevPin]);

  // Dev PIN Gate
  if (!devVerified) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-xs bg-[#141414] border border-green-900/30 rounded-3xl p-6 shadow-2xl">
          <div className="text-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-900/30">
              <ShieldCheck size={24} className="text-white" />
            </div>
            <h2 className="text-lg font-black text-white">Dev Access</h2>
            <p className="text-xs text-gray-500 mt-1">Enter developer PIN to continue</p>
          </div>
          {/* PIN Dots */}
          <div className="flex justify-center gap-4 mb-5">
            {[0, 1, 2, 3].map(i => (
              <motion.div key={i} animate={{ scale: devPin.length > i ? [1, 1.3, 1] : 1 }}
                className={`w-4 h-4 rounded-full ${devPin.length > i ? 'bg-green-500 shadow-md shadow-green-500/40' : 'bg-gray-700'}`} />
            ))}
          </div>
          {devError && <p className="text-[11px] text-red-400 font-semibold text-center mb-3">{devError}</p>}
          {/* Numpad */}
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((num, i) => (
              <motion.button key={i} type="button" whileTap={{ scale: 0.8 }}
                onClick={() => {
                  if (num === '⌫') setDevPin(p => p.slice(0, -1));
                  else if (num !== '' && devPin.length < 4) setDevPin(p => p + num);
                  setDevError('');
                }}
                className={`h-14 rounded-xl font-bold text-xl transition-all ${num === '' ? 'invisible' : num === '⌫' ? 'bg-gray-800 text-gray-400 text-base' : 'bg-[#1a1a1a] text-white border border-gray-800 hover:border-green-800 hover:bg-green-900/20'}`}>
                {num}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return <DevLayoutInner />;
}

function DevLayoutInner() {
  const [moreOpen, setMoreOpen] = useState(false);
  const { sheetRef, handleProps, close } = useBottomSheet(() => setMoreOpen(false));
  const [scrolled, setScrolled] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const { pulling, pullDistance, threshold } = usePullToRefresh();

  useEffect(() => { setMoreOpen(false); }, [location.pathname]);

  useEffect(() => {
    let lastY = 0;
    const h = () => { const y = window.scrollY; setScrolled(y > 10); setNavHidden(y > lastY && y > 60); lastY = y; };
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  const handleLogout = async () => {
    setMoreOpen(false);
    const ok = await confirm({ title: 'Logout', message: 'Logout from developer panel?', confirmText: 'Logout', type: 'logout' });
    if (ok) { localStorage.clear(); window.location.reload(); }
  };

  return (
    <div className="min-h-screen flex bg-[#0a0a0a]">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-full w-[260px] z-50 flex-col bg-gradient-to-b from-[#0f0f0f] via-[#141414] to-[#0a0a0a] border-r border-green-900/30">
        <div className="p-6 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-700 rounded-2xl flex items-center justify-center shadow-xl shadow-green-900/30 border border-green-500/20"><Code size={22} className="text-white" /></div>
            <div><h1 className="font-black text-white text-[17px] tracking-tight">Lucy Garden</h1><p className="text-[9px] text-green-400 font-bold tracking-[0.15em] uppercase">Developer Mode</p></div>
          </div>
        </div>
        <nav className="px-3 space-y-0.5 flex-1 overflow-y-auto">
          <p className="text-[9px] font-bold text-green-500/50 uppercase tracking-wider px-4 py-2">Developer Tools</p>
          {devLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end}
              className={({ isActive }) => `group flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-green-600/90 to-emerald-700/90 text-white shadow-lg shadow-green-900/30' : 'text-gray-400 hover:text-green-300 hover:bg-green-500/10'}`}>
              {({ isActive }) => (<><link.Icon size={17} strokeWidth={isActive ? 2.3 : 1.7} className={isActive ? 'text-green-200' : 'text-green-600 group-hover:text-green-400'} /><span>{link.label}</span></>)}
            </NavLink>
          ))}
          <div className="my-3 mx-4 border-t border-green-900/30" />
          <button onClick={() => { window.location.href = '/admin'; }} className="flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-bold bg-royal-900/30 border border-royal-700/40 text-royal-300 hover:bg-royal-800/40 transition-all"><ExternalLink size={15} className="text-royal-400" /><span>Open Admin Panel</span></button>
        </nav>
        <div className="p-4 mx-3 mb-3 rounded-2xl bg-green-500/5 border border-green-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-black text-sm shadow-lg">D</div>
            <div className="flex-1"><p className="text-sm font-bold text-white">Divyanshu Gupta</p><p className="text-[10px] text-green-400 font-medium">Developer • Lucy Garden</p></div>
          </div>
          <button onClick={handleLogout} className="w-full mt-3 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-500/10 text-red-400 text-[10px] font-bold hover:bg-red-500/20 transition-all"><LogOut size={12} /> Logout</button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 lg:ml-[260px] flex flex-col min-h-screen bg-[#0a0a0a]">
        {/* Mobile Header */}
        <motion.header initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className={`sticky top-0 z-30 lg:hidden transition-all duration-300 ${scrolled ? 'pt-0' : 'pt-2 px-3'}`}>
          <div className={`flex items-center justify-between px-4 py-3 transition-all duration-300 ${scrolled ? 'bg-[#0a0a0a]/90 backdrop-blur-xl border-b border-green-900/20 shadow-lg shadow-black/30' : 'bg-[#111111]/90 backdrop-blur-xl rounded-2xl border border-green-900/30 shadow-xl shadow-black/30'}`}>
            <div className="flex items-center gap-2.5">
              <motion.div whileTap={{ scale: 0.9, rotate: -5 }} className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-700 rounded-xl flex items-center justify-center shadow-md shadow-green-900/30"><Code size={16} className="text-white" /></motion.div>
              <div>
                <h1 className="font-extrabold text-[13px] text-white leading-tight">Dev Console</h1>
                <p className="text-[8px] text-green-400 font-bold tracking-wider uppercase">Developer</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-green-500/10 border border-green-500/20">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-bold text-green-400">Live</span>
              </div>
            </div>
          </div>
        </motion.header>
        {/* Desktop Header */}
        <header className={`sticky top-0 z-30 hidden lg:block transition-all duration-300 bg-[#0a0a0a] ${scrolled ? 'shadow-md shadow-black/30' : ''} border-b border-green-900/20`}>
          <div className="flex items-center justify-between px-6 py-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-700 rounded-lg flex items-center justify-center shadow-md shadow-green-900/30"><Code size={15} className="text-white" /></div>
              <div><div className="flex items-center gap-1.5"><Activity size={12} className="text-green-500" /><h2 className="text-[13px] font-extrabold text-white">Developer Console</h2></div></div>
            </div>
            <div className="flex items-center gap-2.5">
              <span className="text-[10px] font-mono text-green-500/60">v{APP_CONFIG.version}</span>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-500/10 border border-green-500/20"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /><span className="text-[9px] font-bold text-green-400">Live</span></div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 overscroll-y-contain dev-content">
          {pulling && (
            <div className="flex justify-center pb-2 -mt-2 transition-all" style={{ height: pullDistance }}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${pullDistance >= threshold ? 'border-green-500 bg-green-900/30' : 'border-gray-600'}`}
                style={{ transform: `rotate(${pullDistance * 3}deg)`, opacity: Math.min(pullDistance / threshold, 1) }}>
                <svg className={`w-4 h-4 ${pullDistance >= threshold ? 'text-green-400' : 'text-gray-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>
          )}
          <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-green-900 border-t-green-400 rounded-full animate-spin" /></div>}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      {/* More Bottom Sheet */}
      {moreOpen && (
        <>
            <div className="fixed inset-0 bg-black/60 z-50 lg:hidden" onClick={close} />
            <div ref={sheetRef} className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-[#141414] rounded-t-3xl shadow-2xl max-h-[70vh] overflow-hidden border-t border-green-900/30">
              <div {...handleProps} className="flex justify-center pt-4 pb-3 cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1.5 bg-white/20 rounded-full" />
              </div>
              <div className="px-5 pt-2 pb-1 flex items-center justify-between">
                <h3 className="text-[15px] font-extrabold text-white">More Tools</h3>
                <div className="flex items-center gap-2">
                  <button onClick={() => { close(); setTimeout(() => { window.location.href = '/admin'; }, 280); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-royal-900/30 border border-royal-700/40 text-royal-300 text-[10px] font-bold">
                    <ExternalLink size={12} /> Admin
                  </button>
                  <button onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-900/20 border border-red-800/40 text-red-400 text-[10px] font-bold">
                    <LogOut size={12} /> Logout
                  </button>
                </div>
              </div>
              <div className="px-3 pb-4 overflow-y-auto max-h-[calc(70vh-80px)]">
                <div className="grid grid-cols-3 gap-2 p-2">
                  {moreLinks.map((link, i) => (
                    <button key={link.to} onClick={() => { close(); setTimeout(() => navigate(link.to), 280); }}
                      className={`w-full flex flex-col items-center gap-2 py-4 px-2 rounded-2xl transition-colors touch-manipulation ${location.pathname === link.to ? 'bg-green-900/30 border border-green-700/50' : 'bg-[#1a1a1a] border border-gray-800'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${location.pathname === link.to ? 'bg-green-900/50' : 'bg-gray-800'}`}>
                        <link.Icon size={20} strokeWidth={1.7} className={location.pathname === link.to ? 'text-green-400' : 'text-gray-500'} />
                      </div>
                      <span className={`text-[10px] font-semibold text-center leading-tight ${location.pathname === link.to ? 'text-green-300' : 'text-gray-400'}`}>{link.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
        </>
      )}

      {/* Bottom Nav (Mobile) */}
      <nav className={`fixed bottom-0 left-0 right-0 z-30 lg:hidden transition-all duration-300 ${navHidden ? 'translate-y-full' : 'translate-y-0'} px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]`}>
        <div className="bg-[#111111]/95 backdrop-blur-xl rounded-2xl border border-green-900/30 shadow-xl shadow-black/30 mb-1">
          <div className="flex items-center justify-around py-2 px-1 max-w-md mx-auto">
          {bottomNavLinks.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end} className="relative flex-1 flex justify-center">
              {({ isActive }) => (
                <motion.div className={`flex flex-col items-center gap-[2px] py-1.5 px-2 rounded-2xl relative ${isActive ? 'text-green-400' : 'text-gray-600'}`} whileTap={{ scale: 0.85 }}>
                  {isActive && <motion.div layoutId="devBottomPill" className="absolute inset-0 bg-green-500/10 rounded-2xl border border-green-500/20" transition={{ type: 'spring', stiffness: 350, damping: 30 }} />}
                  <motion.div className="relative z-10" animate={{ y: isActive ? -1 : 0, scale: isActive ? 1.15 : 1 }}><item.Icon size={19} strokeWidth={isActive ? 2.5 : 1.6} /></motion.div>
                  <span className={`relative z-10 font-bold ${isActive ? 'text-[9px]' : 'text-[8px]'}`}>{item.label}</span>
                </motion.div>
              )}
            </NavLink>
          ))}
          <button onClick={() => moreOpen ? close() : setMoreOpen(true)} className="relative flex-1 flex justify-center">
            <motion.div className={`flex flex-col items-center gap-[2px] py-1.5 px-2 rounded-2xl relative ${moreOpen ? 'text-green-400' : 'text-gray-600'}`} whileTap={{ scale: 0.85 }}>
              {moreOpen && <motion.div layoutId="devBottomPill" className="absolute inset-0 bg-green-500/10 rounded-2xl border border-green-500/20" transition={{ type: 'spring', stiffness: 350, damping: 30 }} />}
              <motion.div className="relative z-10" animate={{ y: moreOpen ? -1 : 0, scale: moreOpen ? 1.15 : 1 }}><MoreHorizontal size={19} strokeWidth={moreOpen ? 2.5 : 1.6} /></motion.div>
              <span className={`relative z-10 font-bold ${moreOpen ? 'text-[9px]' : 'text-[8px]'}`}>More</span>
            </motion.div>
          </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
