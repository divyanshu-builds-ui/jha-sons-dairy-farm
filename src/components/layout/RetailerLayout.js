import React, { useState, useEffect, Suspense } from 'react';
import { Outlet, NavLink, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home, ShoppingCart, BookOpen, Package, User, X, Settings, LogOut,
  Headphones, Megaphone, Moon, Sun, History, IndianRupee, GraduationCap,
} from 'lucide-react';
import { useConfirm } from '../../components/ConfirmModal';
import AppFooter from '../../components/AppFooter';
import { db, doc, cachedGetDoc } from '../../services/firebase';
import { useFlags } from '../../context/FeatureFlags';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import useDarkMode from '../../hooks/useDarkMode';
import { useFontSize } from '../../hooks/useFontSize';
import logo from '../../assets/logo.png';

const navItems = [
  { to: '/',          label: 'Home',         Icon: Home,        end: true },
  { to: '/order',     label: 'Place Order',  Icon: ShoppingCart },
  { to: '/track',     label: 'My Orders',    Icon: Package },
  { to: '/history',   label: 'Order History',Icon: History },
  { to: '/prices',    label: 'Price List',   Icon: IndianRupee },
  { to: '/my-ledger', label: 'My Ledger',    Icon: BookOpen,    flag: 'ledgerView' },
  { to: '/profile',   label: 'Profile',      Icon: User },
  { to: '/settings',  label: 'Settings',     Icon: Settings },
  { to: '/support',   label: 'Support',      Icon: Headphones,  flag: 'supportTickets' },
  { to: '/guide',     label: 'User Guide',   Icon: GraduationCap },
];

const bottomNav = [
  { to: '/',        label: 'Home',    Icon: Home,        end: true },
  { to: '/order',   label: 'Order',   Icon: ShoppingCart },
  { to: '/track',   label: 'Track',   Icon: Package },
  { to: '/profile', label: 'Profile', Icon: User },
];

const PAGE_TITLES = {
  '/': 'Home', '/order': 'Place Order', '/checkout': 'Checkout',
  '/track': 'My Orders', '/history': 'Order History', '/my-ledger': 'My Ledger',
  '/prices': 'Price List', '/profile': 'Profile', '/settings': 'Settings',
  '/support': 'Support', '/guide': 'User Guide', '/about': 'About',
  '/privacy': 'Privacy Policy', '/terms': 'Terms',
};

const bannerColors = {
  urgent:  { wrap: 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900',    icon: 'text-red-600',   label: 'text-red-600' },
  warning: { wrap: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900', icon: 'text-amber-600', label: 'text-amber-600' },
  success: { wrap: 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900', icon: 'text-green-700', label: 'text-green-700' },
  info:    { wrap: 'bg-navy-50 border-navy-200 dark:bg-navy-950/30 dark:border-navy-900',  icon: 'text-navy-700',  label: 'text-navy-700' },
};

export default function RetailerLayout() {
  const [navHidden, setNavHidden] = useState(false);
  const [banner, setBanner] = useState(null);
  const [bannerDismissed, setBannerDismissed] = useState(localStorage.getItem('lg_banner_dismissed') || '');
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('lg_user') || '{}');
  const confirm = useConfirm();
  const flags = useFlags();
  const { pulling, pullDistance, threshold } = usePullToRefresh();
  const [isDark, toggleDark] = useDarkMode();
  const { size: fontSize, setSize: setFontSize, SIZES, LABELS } = useFontSize();

  const pageTitle = PAGE_TITLES[location.pathname] || navItems.find(n => n.to === location.pathname)?.label || 'Lucy Garden';

  useEffect(() => {
    import('../TopProgressBar').then(m => { m.triggerProgress(); setTimeout(m.stopProgress, 300); });
  }, [location.pathname]);



  useEffect(() => {
    (async () => {
      try {
        const snap = await cachedGetDoc(doc(db, 'settings', 'banner'), 10 * 60 * 1000);
        if (snap.exists()) {
          const data = snap.data();
          if (data.active && data.message && (!data.expiresAt || new Date(data.expiresAt) > new Date())) {
            if (data.target === 'all' || data.target === 'retailers') {
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
    const ok = await confirm({ title: 'Logout', message: 'Are you sure you want to logout?', confirmText: 'Logout', type: 'logout' });
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
        className={`hidden lg:flex fixed top-0 left-0 h-full z-50 flex-col bg-white dark:bg-[#1a1917] border-r border-warm-200 dark:border-[#2e2d2b] transition-all duration-200 ${sidebarExpanded ? 'w-[216px]' : 'w-[60px]'}`}>

        {/* Logo */}
        <div className="h-[52px] flex items-center px-3.5 border-b border-warm-200 dark:border-[#2e2d2b] shrink-0">
          <img src={logo} alt="Lucy Garden" className="w-7 h-7 rounded object-cover shrink-0" />
          {sidebarExpanded && (
            <div className="ml-2.5 overflow-hidden">
              <p className="font-bold text-warm-800 dark:text-warm-100 text-sm whitespace-nowrap leading-tight">Lucy Garden</p>
              <p className="text-warm-400 text-[10px] whitespace-nowrap">Fresh Dairy Supply</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
          {navItems.filter(item => !item.flag || flags[item.flag] !== false).map(item => (
            <NavLink key={item.to} to={item.to} end={item.end} title={item.label}
              className={({ isActive }) =>
                `flex items-center gap-3 px-2.5 py-2 rounded-md text-[13px] font-medium transition-colors duration-150 ${
                  isActive
                    ? 'bg-navy-700 text-white'
                    : 'text-warm-500 dark:text-warm-400 hover:bg-warm-100 dark:hover:bg-[#2e2d2b] hover:text-warm-800 dark:hover:text-warm-100'
                }`}>
              {({ isActive }) => (
                <>
                  <item.Icon size={16} strokeWidth={isActive ? 2.2 : 1.7} className="shrink-0" />
                  {sidebarExpanded && <span className="whitespace-nowrap">{item.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User + Logout */}
        {sidebarExpanded ? (
          <div className="p-2 mx-2 mb-3 rounded-md bg-warm-50 dark:bg-[#2e2d2b] border border-warm-200 dark:border-[#4a4845]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-navy-700 rounded flex items-center justify-center text-white font-bold text-xs shrink-0">
                {user.name?.[0] || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-warm-800 dark:text-warm-100 truncate">{user.name || 'User'}</p>
                <p className="text-[10px] text-warm-400 truncate">{user.shop || user.area || ''}</p>
              </div>
            </div>
            <button onClick={handleLogout}
              className="w-full mt-2 flex items-center justify-center gap-1.5 py-1.5 rounded bg-red-50 dark:bg-red-950/40 text-red-600 text-[11px] font-semibold hover:bg-red-100 transition-colors border border-red-100 dark:border-red-900/50">
              <LogOut size={11} /> Logout
            </button>
          </div>
        ) : (
          <div className="px-2 mb-3">
            <button onClick={handleLogout} title="Logout"
              className="w-full flex items-center justify-center py-2 rounded bg-red-50 dark:bg-red-950/40 text-red-500 hover:bg-red-100 transition-colors">
              <LogOut size={15} />
            </button>
          </div>
        )}
      </aside>

      {/* ── Main Content ── */}
      <div className={`flex-1 transition-all duration-200 ${sidebarExpanded ? 'lg:ml-[216px]' : 'lg:ml-[60px]'} flex flex-col min-h-screen`}>

        {/* Mobile Header */}
        <header className="sticky top-0 z-40 lg:hidden border-b border-white/10" style={{ background: 'linear-gradient(180deg, #1b3557 0%, #162d4a 100%)' }}>
          <div className="flex items-center h-[54px] px-4 gap-3">

            <Link to="/" className="shrink-0">
              <img src={logo} alt="Lucy Garden" className="w-7 h-7 rounded-lg object-cover" />
            </Link>

            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-white truncate">Lucy Garden</p>
              <p className="text-[9px] text-white/35 truncate">{pageTitle}</p>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex items-center bg-white/10 rounded-lg overflow-hidden">
                {SIZES.map((s, i) => (
                  <button key={s} onClick={() => setFontSize(s)}
                    className={`px-2 py-1.5 text-[9px] font-bold transition-all ${fontSize === s ? 'bg-white text-navy-700' : 'text-white/40'}`}>
                    {LABELS[i][0]}
                  </button>
                ))}
              </div>
              <button onClick={toggleDark}
                className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center active:scale-95 transition-transform">
                {isDark ? <Sun size={14} className="text-amber-300" /> : <Moon size={14} className="text-white/60" />}
              </button>
            </div>

          </div>
        </header>

        {/* Desktop Header */}
        <header className="sticky top-0 z-30 hidden lg:flex items-center justify-between px-6 h-[52px] bg-white dark:bg-[#1a1917] border-b border-warm-200 dark:border-[#2e2d2b]">
          <div>
            <p className="text-sm font-semibold text-warm-800 dark:text-warm-100">{pageTitle}</p>
            <p className="text-[10px] text-warm-400">Lucy Garden · Fresh Dairy Supply</p>
          </div>
          <div className="flex items-center gap-2">
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
        <main className="flex-1 p-4 md:p-5 pb-20 lg:pb-6 w-full overscroll-y-contain">

          {/* Pull to refresh indicator */}
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
            {/* Announcement Banner */}
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

        <AppFooter type="retailer" />
      </div>


      {/* ── Mobile Bottom Nav ── */}
      <nav className={`fixed bottom-0 left-0 right-0 z-30 lg:hidden transition-transform duration-300 ${navHidden ? 'translate-y-full' : 'translate-y-0'}`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)', background: 'linear-gradient(180deg, #1b3557 0%, #162d4a 100%)' }}>
        <div className="flex items-center justify-around h-[58px]">
          {bottomNav.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end} className="flex-1 flex justify-center">
              {({ isActive }) => (
                <div className="flex flex-col items-center gap-1">
                  <div className="relative">
                    <item.Icon size={20} strokeWidth={isActive ? 2.2 : 1.5}
                      className={`transition-colors duration-150 ${isActive ? 'text-white' : 'text-white/35'}`} />
                    {item.to === '/' && banner && (
                      <div className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-400 rounded-full" />
                    )}
                  </div>
                  <span className={`text-[10px] font-medium transition-colors duration-150 ${isActive ? 'text-white' : 'text-white/35'}`}>
                    {item.label}
                  </span>
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

    </div>
  );
}
