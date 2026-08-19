import React, { useState, useEffect, Suspense } from 'react';
import { Outlet, NavLink, useLocation, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, ShoppingBag, Warehouse, BookOpen, X, LogOut,
  Settings, Headphones, Truck, Megaphone, Code, MoreHorizontal, Moon, Sun, ClipboardList,
} from 'lucide-react';
import { useConfirm } from '../../components/ConfirmModal';
import AppFooter from '../../components/AppFooter';
import { db, doc, cachedGetDoc } from '../../services/firebase';
import logo from '../../assets/logo.png';
import { useBottomSheet } from '../../hooks/useBottomSheet';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import useDarkMode from '../../hooks/useDarkMode';
import { useFontSize } from '../../hooks/useFontSize';

const sidebarLinks = [
  { to: '/admin',               label: 'Dashboard',    Icon: LayoutDashboard, end: true },
  { to: '/admin/retailers',     label: 'Retailers',    Icon: Users },
  { to: '/admin/daily-ledger',  label: 'Daily Sheet',  Icon: ShoppingBag },
  { to: '/admin/company-order', label: 'Company Order',Icon: Truck },
  { to: '/admin/inventory',     label: 'Inventory',    Icon: Warehouse },
  { to: '/admin/ledger',        label: 'Ledger',       Icon: BookOpen },
  { to: '/admin/support',       label: 'Tickets',      Icon: Headphones },
  { to: '/admin/place-order',   label: 'Place Order',  Icon: ClipboardList },
  { to: '/admin/announcements', label: 'Announcements',Icon: Megaphone },
  { to: '/admin/settings',      label: 'Settings',     Icon: Settings },
];

const bottomNavLinks = [
  { to: '/admin',              label: 'Home',    Icon: LayoutDashboard, end: true },
  { to: '/admin/daily-ledger', label: 'Daily',   Icon: ShoppingBag },
  { to: '/admin/company-order',label: 'Company', Icon: Truck },
  { to: '/admin/ledger',       label: 'Ledger',  Icon: BookOpen },
];

const moreLinks = [
  { to: '/admin/retailers',     label: 'Retailers',    Icon: Users },
  { to: '/admin/place-order',   label: 'Place Order',  Icon: ClipboardList },
  { to: '/admin/inventory',     label: 'Inventory',    Icon: Warehouse },
  { to: '/admin/support',       label: 'Tickets',      Icon: Headphones },
  { to: '/admin/announcements', label: 'Announce',     Icon: Megaphone },
  { to: '/admin/settings',      label: 'Settings',     Icon: Settings },
];

const PAGE_TITLES = {
  '/admin': 'Dashboard',
  '/admin/retailers': 'Retailers',
  '/admin/daily-ledger': 'Daily Sheet',
  '/admin/company-order': 'Company Order',
  '/admin/inventory': 'Inventory',
  '/admin/ledger': 'Ledger',
  '/admin/support': 'Support Tickets',
  '/admin/place-order': 'Place Order',
  '/admin/announcements': 'Announcements',
  '/admin/settings': 'Settings',
};

const bannerColors = {
  urgent:  { wrap: 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900',    label: 'text-red-600',   icon: 'text-red-600' },
  warning: { wrap: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900', label: 'text-amber-600', icon: 'text-amber-600' },
  success: { wrap: 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900', label: 'text-green-700', icon: 'text-green-700' },
  info:    { wrap: 'bg-navy-50 border-navy-200 dark:bg-navy-950/30 dark:border-navy-900',  label: 'text-navy-700',  icon: 'text-navy-700' },
};

export default function AdminLayout() {
  const [moreOpen, setMoreOpen] = useState(false);
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const { sheetRef, handleProps, close } = useBottomSheet(() => setMoreOpen(false));
  const [navHidden, setNavHidden] = useState(false);
  const [banner, setBanner] = useState(null);
  const [bannerDismissed, setBannerDismissed] = useState(localStorage.getItem('lg_banner_dismissed') || '');

  const location = useLocation();
  const navigate = useNavigate();
  const confirm = useConfirm();
  const user = JSON.parse(localStorage.getItem('lg_user') || '{}');
  const isDev = user.phone === '8051725780';
  const { pulling, pullDistance, threshold } = usePullToRefresh();
  const [isDark, toggleDark] = useDarkMode();
  const { size: fontSize, setSize: setFontSize, SIZES, LABELS } = useFontSize();

  const pageTitle = (() => {
    const path = location.pathname;
    if (PAGE_TITLES[path]) return PAGE_TITLES[path];
    if (path.startsWith('/admin/orders/')) return 'Order Detail';
    const segment = path.split('/').pop();
    return segment.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  })();

  useEffect(() => {
    import('../TopProgressBar').then(m => { m.triggerProgress(); setTimeout(m.stopProgress, 300); });
  }, [location.pathname]);

  useEffect(() => {
    if (isDev) {
      const stored = sessionStorage.getItem('lg_dev_verified');
      if (!stored || JSON.parse(stored).expiry <= Date.now()) window.location.href = '/dev';
    }
  }, [isDev]);

  useEffect(() => { setMoreOpen(false); }, [location.pathname]);

  useEffect(() => {
    (async () => {
      try {
        const snap = await cachedGetDoc(doc(db, 'settings', 'banner'), 10 * 60 * 1000);
        if (snap.exists()) {
          const data = snap.data();
          if (data.active && data.message && (!data.expiresAt || new Date(data.expiresAt) > new Date())) {
            if (data.target === 'all' || data.target === 'admin') {
              setBanner(bannerDismissed === data.createdAt ? null : data);
            } else setBanner(null);
          } else setBanner(null);
        } else setBanner(null);
      } catch {}
    })();
  }, [bannerDismissed]);

  useEffect(() => {
    let lastY = 0;
    const h = () => { const y = window.scrollY; setNavHidden(y > lastY && y > 60); lastY = y; };
    window.addEventListener('scroll', h);
    return () => window.removeEventListener('scroll', h);
  }, []);

  const handleLogout = async () => {
    setMoreOpen(false);
    await new Promise(r => setTimeout(r, 300));
    const ok = await confirm({ title: 'Logout', message: 'Are you sure you want to logout from admin panel?', confirmText: 'Logout', type: 'logout' });
    if (ok) {
      const phone = sessionStorage.getItem('lg_active_phone');
      if (phone) { localStorage.removeItem(`lg_user_${phone}`); localStorage.removeItem(`lg_last_verify_${phone}`); }
      localStorage.removeItem('lg_user'); sessionStorage.removeItem('lg_active_phone'); window.location.reload();
    }
  };

  const bc = bannerColors[banner?.type] || bannerColors.info;

  return (
    <div className="min-h-screen flex bg-warm-50 dark:bg-[#0f0e0d]">

      {/* ── Desktop Sidebar ── */}
      <aside
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
        className={`hidden lg:flex fixed top-0 left-0 h-full z-50 flex-col bg-navy-900 dark:bg-[#0d1f35] transition-all duration-200 ${sidebarExpanded ? 'w-[220px]' : 'w-[60px]'}`}>

        {/* Logo */}
        <div className="h-[52px] flex items-center px-3.5 border-b border-white/10 shrink-0">
          <img src={logo} alt="Lucy Garden" className="w-7 h-7 rounded object-cover shrink-0" />
          {sidebarExpanded && (
            <div className="ml-2.5 overflow-hidden">
              <p className="font-bold text-white text-sm whitespace-nowrap leading-tight">Lucy Garden</p>
              <p className="text-white/40 text-[10px] whitespace-nowrap">Admin Console</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {sidebarLinks.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} title={link.label}
              className={({ isActive }) =>
                `flex items-center gap-3 px-2.5 py-2 rounded-md text-[13px] font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-white/15 text-white'
                    : 'text-white/50 hover:bg-white/10 hover:text-white'
                }`}>
              {({ isActive }) => (
                <>
                  <link.Icon size={16} strokeWidth={isActive ? 2.2 : 1.7} className="shrink-0" />
                  {sidebarExpanded && <span className="whitespace-nowrap">{link.label}</span>}
                </>
              )}
            </NavLink>
          ))}
          {isDev && (
            <button onClick={() => { window.location.href = '/dev'; }} title="Dev Panel"
              className="w-full flex items-center gap-3 px-2.5 py-2 rounded-md text-[13px] font-medium text-green-400 hover:bg-white/10 transition-colors">
              <Code size={16} strokeWidth={1.7} className="shrink-0" />
              {sidebarExpanded && <span className="whitespace-nowrap">Dev Panel</span>}
            </button>
          )}
        </nav>

        {/* User + Logout */}
        {sidebarExpanded ? (
          <div className="p-2 mx-2 mb-3 rounded-md bg-white/5 border border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-white/20 rounded flex items-center justify-center text-white font-bold text-xs shrink-0">
                {user.name?.[0] || 'A'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user.name || 'Admin'}</p>
                <p className="text-[10px] text-white/40">Owner</p>
              </div>
            </div>
            <button onClick={handleLogout}
              className="w-full mt-2 flex items-center justify-center gap-1.5 py-1.5 rounded bg-red-500/20 text-red-300 text-[11px] font-semibold hover:bg-red-500/30 transition-colors">
              <LogOut size={11} /> Logout
            </button>
          </div>
        ) : (
          <div className="px-2 mb-3">
            <button onClick={handleLogout} title="Logout"
              className="w-full flex items-center justify-center py-2 rounded bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors">
              <LogOut size={15} />
            </button>
          </div>
        )}
      </aside>

      {/* ── Main Content ── */}
      <div className={`flex-1 min-w-0 transition-all duration-200 ${sidebarExpanded ? 'lg:ml-[220px]' : 'lg:ml-[60px]'} flex flex-col min-h-screen`}>

        {/* Mobile Header */}
        <header className="sticky top-0 z-40 lg:hidden bg-navy-800 dark:bg-[#0d1f35]" id="mobile-header">
          <div className="flex items-center justify-between px-4 h-[52px]">
            <Link to="/admin" className="shrink-0">
              <img src={logo} alt="" className="w-7 h-7 rounded object-cover" />
            </Link>
            <p className="text-sm font-semibold text-white absolute left-1/2 -translate-x-1/2">{pageTitle}</p>
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex items-center bg-white/10 rounded px-1 py-0.5">
                {SIZES.map((s, i) => (
                  <button key={s} onClick={() => setFontSize(s)}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors ${fontSize === s ? 'bg-white text-navy-800' : 'text-white/60'}`}>
                    {LABELS[i][0]}
                  </button>
                ))}
              </div>
              <button onClick={toggleDark} className="w-7 h-7 bg-white/10 rounded flex items-center justify-center">
                {isDark ? <Sun size={13} className="text-amber-300" /> : <Moon size={13} className="text-white/70" />}
              </button>
            </div>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="sticky top-0 z-40 hidden lg:flex items-center justify-between px-6 h-[52px] bg-white dark:bg-[#1a1917] border-b border-warm-200 dark:border-[#2e2d2b]">
          <div>
            <p className="text-sm font-semibold text-warm-800 dark:text-warm-100">{pageTitle}</p>
            <p className="text-[10px] text-warm-400">Lucy Garden · Admin Panel</p>
          </div>
          <div className="flex items-center gap-3">
            {/* User chip */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-warm-50 dark:bg-[#2e2d2b] rounded-lg border border-warm-200 dark:border-[#4a4845]">
              <div className="w-5 h-5 bg-navy-700 rounded flex items-center justify-center text-white font-bold text-[10px] shrink-0">
                {user.name?.[0] || 'A'}
              </div>
              <span className="text-xs font-semibold text-warm-700 dark:text-warm-200">{user.name || 'Admin'}</span>
            </div>
            <div className="flex items-center gap-0.5 bg-warm-100 dark:bg-[#2e2d2b] rounded px-1 py-0.5">
              {SIZES.map((s, i) => (
                <button key={s} onClick={() => setFontSize(s)}
                  className={`px-2 py-1 rounded text-[10px] font-semibold transition-colors ${fontSize === s ? 'bg-navy-700 text-white' : 'text-warm-500 hover:text-warm-800 dark:hover:text-warm-100'}`}>
                  {LABELS[i]}
                </button>
              ))}
            </div>
            <button onClick={toggleDark}
              className="w-8 h-8 rounded bg-warm-100 dark:bg-[#2e2d2b] flex items-center justify-center hover:bg-warm-200 dark:hover:bg-[#4a4845] transition-colors">
              {isDark ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-warm-500" />}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-5 pb-20 lg:pb-6 overscroll-y-contain">

          {/* Pull to refresh */}
          {pulling && (
            <div className="flex justify-center pb-3 -mt-1" style={{ height: pullDistance }}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${pullDistance >= threshold ? 'bg-navy-700 scale-110' : 'bg-white dark:bg-[#2e2d2b] border border-warm-200 dark:border-[#4a4845]'}`}
                style={{ opacity: Math.min(pullDistance / (threshold * 0.6), 1) }}>
                <svg className={`w-4 h-4 ${pullDistance >= threshold ? 'text-white' : 'text-navy-700'}`}
                  style={{ transform: `rotate(${Math.min(pullDistance / threshold, 1) * 180}deg)` }}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </div>
            </div>
          )}

          <div className="animate-fade-in">
            {/* Banner */}
            <AnimatePresence>
              {banner && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-4 overflow-hidden">
                  <div className={`px-4 py-3 rounded-lg flex items-start gap-3 border ${bc.wrap}`}>
                    <Megaphone size={14} className={`${bc.icon} shrink-0 mt-0.5`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-[11px] font-bold uppercase tracking-wide mb-0.5 ${bc.label}`}>
                        {banner.type === 'urgent' ? 'Important' : banner.type === 'warning' ? 'Notice' : banner.type === 'success' ? 'Update' : 'Announcement'}
                      </p>
                      <p className="text-sm text-warm-800 dark:text-warm-100 leading-relaxed">{banner.message}</p>
                    </div>
                    <button onClick={() => { setBanner(null); setBannerDismissed(banner.createdAt); localStorage.setItem('lg_banner_dismissed', banner.createdAt); }}
                      className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 hover:bg-black/5 transition-colors">
                      <X size={10} className="text-warm-500" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Suspense fallback={
              <div className="flex items-center justify-center py-20">
                <div className="w-5 h-5 border-2 border-warm-200 border-t-navy-700 rounded-full animate-spin" />
              </div>
            }>
              <motion.div key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.1 }}>
                <Outlet />
              </motion.div>
            </Suspense>
          </div>
        </main>

        <AppFooter type="admin" />
      </div>

      {/* ── More Bottom Sheet ── */}
      {moreOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50 lg:hidden" onClick={close} />
          <div ref={sheetRef} className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white dark:bg-[#1a1917] rounded-t-xl shadow-xl border-t border-warm-200 dark:border-[#2e2d2b] max-h-[55vh] overflow-hidden">
            <div {...handleProps} className="flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing">
              <div className="w-10 h-1 bg-warm-200 dark:bg-[#4a4845] rounded-full" />
            </div>

            {/* User strip */}
            <div className="px-4 pb-3 flex items-center gap-3 border-b border-warm-100 dark:border-[#2e2d2b]">
              <div className="w-8 h-8 bg-navy-700 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0">
                {user.name?.[0] || 'A'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-warm-800 dark:text-warm-100 truncate">{user.name || 'Admin'}</p>
                <p className="text-[10px] text-warm-400">Owner · Admin Panel</p>
              </div>
            </div>

            <div className="px-3 pt-3 pb-4 overflow-y-auto">
              <div className="grid grid-cols-3 gap-2">
                {moreLinks.map((link) => (
                  <button key={link.to} onClick={() => { close(); setTimeout(() => navigate(link.to), 250); }}
                    className={`w-full flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg transition-colors touch-manipulation ${
                      location.pathname === link.to
                        ? 'bg-navy-50 dark:bg-navy-900/30 border border-navy-200 dark:border-navy-800'
                        : 'bg-warm-50 dark:bg-[#2e2d2b] border border-warm-200 dark:border-[#4a4845]'
                    }`}>
                    <link.Icon size={18} strokeWidth={1.7}
                      className={location.pathname === link.to ? 'text-navy-700' : 'text-warm-500 dark:text-warm-400'} />
                    <span className={`text-[11px] font-medium ${location.pathname === link.to ? 'text-navy-700' : 'text-warm-600 dark:text-warm-400'}`}>
                      {link.label}
                    </span>
                  </button>
                ))}
                {isDev && (
                  <button onClick={() => { close(); setTimeout(() => { window.location.href = '/dev'; }, 250); }}
                    className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-900">
                    <Code size={18} strokeWidth={1.7} className="text-green-700 dark:text-green-400" />
                    <span className="text-[11px] font-medium text-green-700 dark:text-green-400">Dev Panel</span>
                  </button>
                )}
              </div>
              <button onClick={handleLogout}
                className="w-full mt-3 flex items-center justify-center gap-2 py-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 text-red-600 text-sm font-semibold">
                <LogOut size={14} /> Logout
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Mobile Bottom Nav ── */}
      <nav className={`fixed bottom-0 left-0 right-0 z-30 lg:hidden transition-transform duration-300 ${navHidden ? 'translate-y-full' : 'translate-y-0'} px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]`}>
        <div className="bg-white dark:bg-[#1a1917] border border-warm-200 dark:border-[#2e2d2b] rounded-xl shadow-lg mb-1">
          <div className="flex items-center justify-around py-1.5 px-1">
            {bottomNavLinks.map(item => (
              <NavLink key={item.to} to={item.to} end={item.end} className="relative flex-1 flex justify-center">
                {({ isActive }) => (
                  <div className={`flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-lg relative transition-colors ${isActive ? 'text-navy-700 dark:text-navy-300' : 'text-warm-400'}`}>
                    {isActive && (
                      <motion.div layoutId="adminBottomPill"
                        className="absolute inset-0 bg-navy-50 dark:bg-navy-900/30 rounded-lg border border-navy-100 dark:border-navy-800"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                    )}
                    <item.Icon size={20} strokeWidth={isActive ? 2.2 : 1.6} className="relative z-10" />
                    <span className="relative z-10 text-[10px] font-semibold">{item.label}</span>
                  </div>
                )}
              </NavLink>
            ))}
            <button onClick={() => moreOpen ? close() : setMoreOpen(true)} className="relative flex-1 flex justify-center">
              <div className={`flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-lg relative transition-colors ${moreOpen ? 'text-navy-700 dark:text-navy-300' : 'text-warm-400'}`}>
                {moreOpen && (
                  <motion.div layoutId="adminBottomPill"
                    className="absolute inset-0 bg-navy-50 dark:bg-navy-900/30 rounded-lg border border-navy-100 dark:border-navy-800"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                )}
                <MoreHorizontal size={20} strokeWidth={moreOpen ? 2.2 : 1.6} className="relative z-10" />
                <span className="relative z-10 text-[10px] font-semibold">More</span>
              </div>
            </button>
          </div>
        </div>
      </nav>

    </div>
  );
}
