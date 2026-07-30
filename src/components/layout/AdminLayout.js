import React, { useState, useEffect, Suspense } from 'react';
import { Outlet, NavLink, useLocation, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, ShoppingBag, Warehouse, BookOpen, X, LogOut, Settings, Headphones, Truck, Megaphone, Code, MoreHorizontal, Moon, Sun, Type, AlertCircle, AlertTriangle, CheckCircle2, Info, ClipboardList } from 'lucide-react';
import { useConfirm } from '../../components/ConfirmModal';
import AppFooter from '../../components/AppFooter';
import { db, doc, cachedGetDoc } from '../../services/firebase';
import logo from '../../assets/logo.png';
import { useBottomSheet } from '../../hooks/useBottomSheet';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';

import useDarkMode from '../../hooks/useDarkMode';
import { useFontSize } from '../../hooks/useFontSize';

const sidebarLinks = [
  { to: '/admin', label: 'Dashboard', Icon: LayoutDashboard, end: true },
  { to: '/admin/retailers', label: 'Retailers', Icon: Users },
  { to: '/admin/daily-ledger', label: 'Daily Sheet', Icon: ShoppingBag },
  { to: '/admin/company-order', label: 'Company Order', Icon: Truck },
  { to: '/admin/inventory', label: 'Inventory', Icon: Warehouse },
  { to: '/admin/ledger', label: 'Ledger', Icon: BookOpen },
  { to: '/admin/support', label: 'Tickets', Icon: Headphones },
  { to: '/admin/place-order', label: 'Place Order', Icon: ClipboardList },
  { to: '/admin/announcements', label: 'Announcements', Icon: Megaphone },
  { to: '/admin/settings', label: 'Settings', Icon: Settings },
];

const bottomNavLinks = [
  { to: '/admin', label: 'Home', Icon: LayoutDashboard, end: true },
  { to: '/admin/daily-ledger', label: 'Daily', Icon: ShoppingBag },
  { to: '/admin/company-order', label: 'Company', Icon: Truck },
  { to: '/admin/ledger', label: 'Ledger', Icon: BookOpen },
];

const moreLinks = [
  { to: '/admin/retailers', label: 'Retailers', Icon: Users },
  { to: '/admin/place-order', label: 'Place Order', Icon: ClipboardList },
  { to: '/admin/inventory', label: 'Inventory', Icon: Warehouse },
  { to: '/admin/support', label: 'Tickets', Icon: Headphones },
  { to: '/admin/announcements', label: 'Announce', Icon: Megaphone },
  { to: '/admin/settings', label: 'Settings', Icon: Settings },
];

export default function AdminLayout() {
  const [moreOpen, setMoreOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const { sheetRef, handleProps, close } = useBottomSheet(() => setMoreOpen(false));
  const [scrolled, setScrolled] = useState(false);
  const [navHidden, setNavHidden] = useState(false);
  const [banner, setBanner] = useState(null);
  const [bannerDismissed, setBannerDismissed] = useState(localStorage.getItem('lg_banner_dismissed') || '');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    import('../TopProgressBar').then(m => { m.triggerProgress(); setTimeout(m.stopProgress, 300); });
  }, [location.pathname]);
  const confirm = useConfirm();
  const isDev = JSON.parse(localStorage.getItem('lg_user') || '{}').phone === '8051725780';
  const { pulling, pullDistance, threshold } = usePullToRefresh();
  const [isDark, toggleDark] = useDarkMode();
  const { size: fontSize, setSize: setFontSize, SIZES, LABELS } = useFontSize();

  // If dev accessing admin without PIN verification, redirect to /dev first
  useEffect(() => {
    if (isDev) {
      const stored = sessionStorage.getItem('lg_dev_verified');
      if (!stored || JSON.parse(stored).expiry <= Date.now()) {
        window.location.href = '/dev';
      }
    }
  }, [isDev]);

  useEffect(() => { setMoreOpen(false); }, [location.pathname]);

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const snap = await cachedGetDoc(doc(db, 'settings', 'banner'), 10 * 60 * 1000);
        if (snap.exists()) {
          const data = snap.data();
          if (data.active && data.message && (!data.expiresAt || new Date(data.expiresAt) > new Date())) {
            if (data.target === 'all' || data.target === 'admin') {
              if (bannerDismissed === data.createdAt) setBanner(null);
              else setBanner(data);
            } else setBanner(null);
          } else setBanner(null);
        } else setBanner(null);
      } catch {}
    };
    fetchBanner();
  }, [bannerDismissed]);

  useEffect(() => {
    let lastY = 0;
    const h = () => { const y = window.scrollY; setScrolled(y > 10); setNavHidden(y > lastY && y > 60); lastY = y; };
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  const handleLogout = async () => {
    setMoreOpen(false);
    await new Promise(r => setTimeout(r, 300)); // Wait for bottom sheet close animation
    const ok = await confirm({ title: 'Logout', message: 'Are you sure you want to logout from admin panel?', confirmText: 'Logout', type: 'logout' });
    if (ok) { const phone = sessionStorage.getItem('lg_active_phone'); if (phone) { localStorage.removeItem(`lg_user_${phone}`); localStorage.removeItem(`lg_last_verify_${phone}`); } localStorage.removeItem('lg_user'); sessionStorage.removeItem('lg_active_phone'); window.location.reload(); }
  };

  const pageTitle = () => {
    const path = location.pathname;
    if (path === '/admin') return 'Dashboard';
    if (path === '/admin/daily-ledger') return 'Daily Sheet';
    if (path.startsWith('/admin/orders/')) return 'Order Detail';
    const segment = path.split('/').pop();
    return segment.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  const pageSubtitle = () => {
    const path = location.pathname;
    const map = {
      '/admin': 'Overview & insights',
      '/admin/retailers': 'Manage all retailers & areas',
      '/admin/daily-ledger': 'Orders, dispatch & delivery',
      '/admin/company-order': 'Company-level order summary',
      '/admin/inventory': 'Products & pricing',
      '/admin/ledger': 'Retailer summary & payments',
      '/admin/settings': 'App configuration',
      '/admin/support': 'Customer support tickets',
      '/admin/sessions': 'Active sessions & security',
      '/admin/announcements': 'Send banners to users',
    };
    return map[path] || '';
  };

  return (
    <div className="min-h-screen flex bg-[#f1f5f9] dark:bg-[#000000]">
      {/* Desktop Sidebar */}
      <aside
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
        className={`hidden lg:flex fixed top-0 left-0 h-full z-50 flex-col bg-gradient-to-b from-[#0f172a] via-[#1e293b] to-[#0f172a] dark:from-[#000000] dark:via-[#0a0a0a] dark:to-[#000000] dark:border-r dark:border-[#1a1a1a] transition-all duration-300 ${sidebarExpanded ? 'w-[260px]' : 'w-[68px]'}`}>
        <div className="p-4 pb-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Lucy Garden" className="w-10 h-10 rounded-xl object-cover shadow-xl border border-white/10 shrink-0" loading="eager" decoding="async" />
            {sidebarExpanded && (
              <div className="overflow-hidden">
                <h1 className="font-black text-white text-[15px] tracking-tight whitespace-nowrap">Lucy Garden</h1>
                <p className="text-[8px] text-blue-400 font-bold tracking-[0.15em] uppercase">Admin Console</p>
              </div>
            )}
          </div>
        </div>
        <nav className="px-2 space-y-0.5 flex-1 overflow-y-auto">
          {sidebarLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end}
              title={link.label}
              className={({ isActive }) => `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-royal-600/90 to-royal-700/90 text-white shadow-lg shadow-royal-900/30' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
              {({ isActive }) => (<><link.Icon size={18} strokeWidth={isActive ? 2.3 : 1.7} className={`shrink-0 ${isActive ? 'text-mint-300' : 'text-gray-500 group-hover:text-gray-300'}`} />{sidebarExpanded && <span className="whitespace-nowrap">{link.label}</span>}{sidebarExpanded && isActive && <motion.div layoutId="adminSidebarDot" className="ml-auto w-1.5 h-1.5 bg-mint-400 rounded-full shadow-glow" />}</>)}
            </NavLink>
          ))}
        </nav>
        {isDev && sidebarExpanded && (<button onClick={() => { window.location.href = '/dev'; }} className="flex items-center gap-2.5 mx-2 mb-2 px-3 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-all"><Code size={15} /><span className="text-[12px] font-bold">Dev Panel</span></button>)}
        {isDev && !sidebarExpanded && (<button onClick={() => { window.location.href = '/dev'; }} title="Dev Panel" className="flex items-center justify-center mx-2 mb-2 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 hover:bg-green-500/20 transition-all"><Code size={16} /></button>)}
        {sidebarExpanded ? (
          <div className="p-3 mx-2 mb-3 rounded-2xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-royal-500 to-mint-500 rounded-full flex items-center justify-center text-white font-black text-sm shadow-lg shrink-0">{(JSON.parse(localStorage.getItem('lg_user') || '{}').name || 'A')[0]}</div>
              <div className="flex-1 overflow-hidden"><p className="text-sm font-bold text-white truncate">{JSON.parse(localStorage.getItem('lg_user') || '{}').name || 'Admin'}</p><p className="text-[10px] text-gray-400 font-medium">Owner</p></div>
            </div>
            <button onClick={handleLogout} className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-red-500/10 text-red-400 text-[10px] font-bold hover:bg-red-500/20 transition-all"><LogOut size={12} /> Logout</button>
          </div>
        ) : (
          <div className="px-2 mb-3">
            <button onClick={handleLogout} title="Logout" className="w-full flex items-center justify-center py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all"><LogOut size={16} /></button>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className={`flex-1 min-w-0 transition-all duration-300 ${sidebarExpanded ? 'lg:ml-[260px]' : 'lg:ml-[68px]'} flex flex-col min-h-screen`}>
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 lg:hidden bg-gradient-to-r from-[#0f172a] via-[#1e293b] to-[#0f172a]">
          <div className="flex items-center justify-between px-4 py-3">
            <Link to="/admin" className="flex items-center gap-2.5">
              <img src={logo} alt="" className="w-9 h-9 rounded-xl object-cover shadow-md ring-2 ring-white/20" decoding="async" />
              <div>
                <h1 className="font-extrabold text-white text-[14px] leading-tight">Lucy Garden</h1>
                <p className="text-[8px] text-blue-300 font-bold tracking-wider uppercase">{pageTitle()}</p>
              </div>
            </Link>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center bg-white/10 rounded-lg px-1 py-0.5">
                {SIZES.map((s, i) => (
                  <button key={s} onClick={() => setFontSize(s)}
                    className={`px-1.5 py-1 rounded text-[9px] font-bold ${fontSize === s ? 'bg-white text-[#0f172a]' : 'text-white/60'}`}>
                    {LABELS[i][0]}
                  </button>
                ))}
              </div>
              <button onClick={toggleDark} className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center">
                {isDark ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-gray-300" />}
              </button>
            </div>
          </div>
        </header>
        {/* Desktop Header */}
        <header className={`sticky top-0 z-30 hidden lg:block transition-all duration-300 ${scrolled ? 'bg-white dark:bg-[#0a0a0a] shadow-sm dark:shadow-none' : 'bg-white dark:bg-[#0a0a0a]'} border-b border-gray-200/50 dark:border-[#222222]`}>
          <div className="flex items-center justify-between px-6 py-3">
            <Link to="/admin" className="hover:opacity-80 transition-opacity">
              <h2 className="text-[15px] font-extrabold text-gray-800 dark:text-white">Lucy Garden</h2>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{pageTitle()}{pageSubtitle() ? ` • ${pageSubtitle()}` : ' • Admin Panel'}</p>
            </Link>
            <div className="flex items-center gap-2">
              {/* Font Size */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-[#111111] rounded-xl px-1.5 py-1">
                {SIZES.map((s, i) => (
                  <button key={s} onClick={() => setFontSize(s)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${fontSize === s ? 'bg-royal-600 text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-[#1a1a1a]'}`}>
                    {LABELS[i]}
                  </button>
                ))}
              </div>
              {/* Dark Mode Toggle */}
              <button onClick={toggleDark} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-[#111111] flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#1a1a1a] transition-colors">
                {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-gray-500" />}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 pb-20 lg:pb-6 overscroll-y-contain">
          {pulling && (
            <div className="flex justify-center pb-3 -mt-1 transition-all" style={{ height: pullDistance }}>
              <div className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200 ${pullDistance >= threshold ? 'bg-royal-600 shadow-lg shadow-royal-600/30 scale-110' : 'bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-[#333333] shadow-sm'}`}
                style={{ opacity: Math.min(pullDistance / (threshold * 0.6), 1) }}>
                <svg className={`w-4 h-4 transition-all duration-200 ${pullDistance >= threshold ? 'text-white' : 'text-royal-600 dark:text-royal-400'}`}
                  style={{ transform: `rotate(${Math.min(pullDistance / threshold, 1) * 180}deg)` }}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>
          )}
          <div className="animate-fade-in">
            <AnimatePresence>
              {banner && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 overflow-hidden">
                  <div className={`px-4 py-3.5 rounded-2xl flex items-start gap-3 border ${banner.type === 'urgent' ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : banner.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800' : banner.type === 'success' ? 'bg-mint-50 dark:bg-mint-900/20 border-mint-200 dark:border-mint-800' : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${banner.type === 'urgent' ? 'bg-red-100 dark:bg-red-900/40' : banner.type === 'warning' ? 'bg-amber-100 dark:bg-amber-900/40' : banner.type === 'success' ? 'bg-mint-100 dark:bg-mint-900/40' : 'bg-blue-100 dark:bg-blue-900/40'}`}>
                      <Megaphone size={14} className={banner.type === 'urgent' ? 'text-red-600' : banner.type === 'warning' ? 'text-amber-600' : banner.type === 'success' ? 'text-mint-600' : 'text-blue-600'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-[11px] font-bold uppercase tracking-wider mb-0.5 ${banner.type === 'urgent' ? 'text-red-500' : banner.type === 'warning' ? 'text-amber-500' : banner.type === 'success' ? 'text-mint-600' : 'text-blue-500'}`}>{banner.type === 'urgent' ? <><AlertCircle size={12} className="inline text-red-500" /> Important</> : banner.type === 'warning' ? <><AlertTriangle size={12} className="inline text-amber-500" /> Notice</> : banner.type === 'success' ? <><CheckCircle2 size={12} className="inline text-green-500" /> Update</> : <><Info size={12} className="inline text-blue-500" /> Announcement</>}</p>
                      <p className="text-sm font-semibold text-gray-800 dark:text-white leading-relaxed">{banner.message}</p>
                    </div>
                    <button onClick={() => { setBanner(null); setBannerDismissed(banner.createdAt); localStorage.setItem('lg_banner_dismissed', banner.createdAt); }} className="w-6 h-6 bg-white/80 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center shrink-0 mt-0.5 hover:bg-gray-100 dark:hover:bg-[#222222] transition-colors"><X size={10} className="text-gray-500" /></button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="w-6 h-6 border-2 border-royal-200 dark:border-[#333333] border-t-royal-600 dark:border-t-royal-400 rounded-full animate-spin" /></div>}>
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.1 }}
              >
                <Outlet />
              </motion.div>
            </Suspense>
          </div>
        </main>

        <AppFooter type="admin" />
      </div>

      {/* More Bottom Sheet */}
      {moreOpen && (
        <>
            <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={close} />
            <div ref={sheetRef} className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-[#0f172a] rounded-t-3xl shadow-2xl max-h-[60vh] overflow-hidden border-t border-white/10">
              <div {...handleProps} className="flex justify-center pt-4 pb-3 cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1.5 bg-white/30 rounded-full" />
              </div>
              <div className="px-5 pt-2 pb-1"><h3 className="text-[15px] font-extrabold text-white">More</h3></div>
              <div className="px-3 pb-4 overflow-y-auto">
                <div className="grid grid-cols-3 gap-2 p-2">
                  {moreLinks.map((link, i) => (
                    <button key={link.to} onClick={() => { close(); setTimeout(() => navigate(link.to), 280); }}
                      className={`w-full flex flex-col items-center gap-2 py-4 px-2 rounded-2xl transition-colors touch-manipulation ${location.pathname === link.to ? 'bg-white/10 border border-mint-400/30' : 'bg-white/5 border border-white/10'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${location.pathname === link.to ? 'bg-mint-500/20' : 'bg-white/10'}`}>
                        <link.Icon size={20} strokeWidth={1.7} className={location.pathname === link.to ? 'text-mint-400' : 'text-gray-400'} />
                      </div>
                      <span className={`text-[11px] font-semibold ${location.pathname === link.to ? 'text-mint-300' : 'text-gray-400'}`}>{link.label}</span>
                    </button>
                  ))}
                  {isDev && (
                    <button onClick={() => { close(); setTimeout(() => { window.location.href = '/dev'; }, 280); }}
                      className="flex flex-col items-center gap-2 py-4 px-2 rounded-2xl bg-green-500/10 border border-green-500/20">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-green-500/20"><Code size={20} strokeWidth={1.7} className="text-green-400" /></div>
                      <span className="text-[11px] font-semibold text-green-400">Dev Panel</span>
                    </button>
                  )}
                </div>
                <button onClick={handleLogout} className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] font-bold">
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </div>
        </>
      )}

      {/* Bottom Nav (Mobile) */}
      <nav className={`fixed bottom-0 left-0 right-0 z-30 lg:hidden transition-all duration-300 ${navHidden ? 'translate-y-full' : 'translate-y-0'} px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]`}>
        <div className="bg-[#0f172a]/95 backdrop-blur-xl rounded-2xl border border-white/10 shadow-xl shadow-black/20 mb-1">
          <div className="flex items-center justify-around py-2 px-1 max-w-md mx-auto">
          {bottomNavLinks.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end} className="relative flex-1 flex justify-center">
              {({ isActive }) => (
                <motion.div className={`flex flex-col items-center gap-[2px] py-1.5 px-2 rounded-2xl relative ${isActive ? 'text-mint-400' : 'text-gray-500'}`} whileTap={{ scale: 0.85 }}>
                  {isActive && <motion.div layoutId="adminBottomPill" className="absolute inset-0 bg-white/10 rounded-2xl border border-white/10" transition={{ type: 'spring', stiffness: 350, damping: 30 }} />}
                  <motion.div className="relative z-10" animate={{ y: isActive ? -1 : 0, scale: isActive ? 1.15 : 1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}><item.Icon size={19} strokeWidth={isActive ? 2.5 : 1.6} /></motion.div>
                  <span className={`relative z-10 font-bold ${isActive ? 'text-[9px]' : 'text-[8px]'}`}>{item.label}</span>
                </motion.div>
              )}
            </NavLink>
          ))}
          <button onClick={() => moreOpen ? close() : setMoreOpen(true)} className="relative flex-1 flex justify-center">
            <motion.div className={`flex flex-col items-center gap-[2px] py-1.5 px-2 rounded-2xl relative ${moreOpen ? 'text-mint-400' : 'text-gray-500'}`} whileTap={{ scale: 0.85 }}>
              {moreOpen && <motion.div layoutId="adminBottomPill" className="absolute inset-0 bg-white/10 rounded-2xl border border-white/10" transition={{ type: 'spring', stiffness: 350, damping: 30 }} />}
              <motion.div className="relative z-10" animate={{ y: moreOpen ? -1 : 0, scale: moreOpen ? 1.15 : 1 }} transition={{ type: 'spring', stiffness: 400, damping: 20 }}><MoreHorizontal size={19} strokeWidth={moreOpen ? 2.5 : 1.6} /></motion.div>
              <span className={`relative z-10 font-bold ${moreOpen ? 'text-[9px]' : 'text-[8px]'}`}>More</span>
            </motion.div>
          </button>
          </div>
        </div>
      </nav>
    </div>
  );
}

