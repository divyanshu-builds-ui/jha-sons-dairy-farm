import React, { useState, useEffect, Suspense } from 'react';
import { Outlet, NavLink, useLocation, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, ShoppingCart, BookOpen, Package, User, X, Settings, LogOut, Headphones, Megaphone, MoreHorizontal, Moon, Sun, History, IndianRupee, AlertCircle, AlertTriangle, CheckCircle2, Info, GraduationCap } from 'lucide-react';
import { useConfirm } from '../../components/ConfirmModal';
import AppFooter from '../../components/AppFooter';
import { db, doc, cachedGetDoc } from '../../services/firebase';
import { useFlags } from '../../context/FeatureFlags';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import useDarkMode from '../../hooks/useDarkMode';
import { useFontSize } from '../../hooks/useFontSize';
import logo from '../../assets/logo.png';
import { useBottomSheet } from '../../hooks/useBottomSheet';

const navItems = [
  { to: '/', label: 'Home', Icon: Home, end: true },
  { to: '/order', label: 'Place Order', Icon: ShoppingCart },
  { to: '/track', label: 'My Orders', Icon: Package },
  { to: '/history', label: 'Order History', Icon: History },
  { to: '/prices', label: 'Price List', Icon: IndianRupee },
  { to: '/my-ledger', label: 'My Ledger', Icon: BookOpen, flag: 'ledgerView' },
  { to: '/profile', label: 'Profile', Icon: User },
  { to: '/settings', label: 'Settings', Icon: Settings },
  { to: '/support', label: 'Support', Icon: Headphones, flag: 'supportTickets' },
  { to: '/guide', label: 'User Guide', Icon: GraduationCap },
];

const bottomNav = [
  { to: '/', label: 'Home', Icon: Home, end: true },
  { to: '/order', label: 'Order', Icon: ShoppingCart },
  { to: '/track', label: 'Track', Icon: Package },
  { to: '/prices', label: 'Prices', Icon: IndianRupee },
  { to: '/my-ledger', label: 'Ledger', Icon: BookOpen, flag: 'ledgerView' },
];

const moreLinks = [
  { to: '/history', label: 'Order History', Icon: History },
  { to: '/profile', label: 'Profile', Icon: User },
  { to: '/settings', label: 'Settings', Icon: Settings },
  { to: '/support', label: 'Support', Icon: Headphones, flag: 'supportTickets' },
  { to: '/guide', label: 'User Guide', Icon: GraduationCap },
];

export default function RetailerLayout() {
  const [moreOpen, setMoreOpen] = useState(false);
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
  const user = JSON.parse(localStorage.getItem('lg_user') || '{}');
  const confirm = useConfirm();
  const flags = useFlags();
  const { pulling, pullDistance, threshold } = usePullToRefresh();
  const [isDark, toggleDark] = useDarkMode();
  const { size: fontSize, setSize: setFontSize, SIZES, LABELS } = useFontSize();

  useEffect(() => { setMoreOpen(false); }, [location.pathname]);

  const pageInfo = () => {
    const path = location.pathname;
    const map = {
      '/': { title: 'Home', subtitle: 'Your dashboard' },
      '/order': { title: 'Place Order', subtitle: 'Select products & quantity' },
      '/checkout': { title: 'Checkout', subtitle: 'Review & confirm order' },
      '/track': { title: 'My Orders', subtitle: 'Track delivery status' },
      '/history': { title: 'Order History', subtitle: 'Past orders & invoices' },
      '/my-ledger': { title: 'My Ledger', subtitle: 'Payments & dues' },
      '/prices': { title: 'Price List', subtitle: 'Current product rates' },
      '/profile': { title: 'Profile', subtitle: 'Your account info' },
      '/settings': { title: 'Settings', subtitle: 'Preferences & security' },
      '/support': { title: 'Support', subtitle: 'Get help & raise tickets' },
      '/guide': { title: 'User Guide', subtitle: 'How to use the app' },
      '/about': { title: 'About', subtitle: 'About Lucy Garden' },
      '/privacy': { title: 'Privacy Policy', subtitle: 'Data & privacy info' },
      '/terms': { title: 'Terms', subtitle: 'Terms of service' },
    };
    return map[path] || { title: navItems.find(n => n.to === path)?.label || 'Lucy Garden', subtitle: '' };
  };

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const snap = await cachedGetDoc(doc(db, 'settings', 'banner'), 10 * 60 * 1000);
        if (snap.exists()) {
          const data = snap.data();
          if (data.active && data.message && (!data.expiresAt || new Date(data.expiresAt) > new Date())) {
            if (data.target === 'all' || data.target === 'retailers') {
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
    await new Promise(r => setTimeout(r, 300));
    const ok = await confirm({ title: 'Logout', message: 'Are you sure you want to logout?', confirmText: 'Logout', type: 'logout' });
    if (ok) { const phone = sessionStorage.getItem('lg_active_phone'); if (phone) localStorage.removeItem(`lg_user_${phone}`); localStorage.removeItem('lg_user'); sessionStorage.removeItem('lg_active_phone'); window.location.reload(); }
  };

  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  return (
    <div className="min-h-screen flex bg-[#f8fafc] dark:bg-[#000000]">
      {/* Desktop Sidebar */}
      <aside
        onMouseEnter={() => setSidebarExpanded(true)}
        onMouseLeave={() => setSidebarExpanded(false)}
        className={`hidden lg:flex fixed top-0 left-0 h-full z-50 flex-col bg-white dark:bg-[#0a0a0a] border-r border-gray-100 dark:border-[#222222] shadow-xl shadow-royal-900/5 transition-all duration-300 ${sidebarExpanded ? 'w-[260px]' : 'w-[68px]'}`}>
        <div className="p-4 border-b border-gray-100 dark:border-[#222222]">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Lucy Garden" className="w-10 h-10 rounded-xl object-cover shadow-md ring-2 ring-royal-100 dark:ring-royal-800 shrink-0" />
            {sidebarExpanded && (
              <div className="overflow-hidden">
                <h1 className="font-black text-royal-900 dark:text-white text-[15px] tracking-tight whitespace-nowrap">Lucy Garden</h1>
                <p className="text-mint-600 text-[8px] font-bold tracking-[0.15em] uppercase">Fresh Dairy Supply</p>
              </div>
            )}
          </div>
        </div>
        <nav className="p-2 space-y-0.5 flex-1 overflow-y-auto">
          {navItems.filter(item => !item.flag || flags[item.flag] !== false).map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              title={item.label}
              className={({ isActive }) => `group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-royal-600 to-royal-700 text-white shadow-lg shadow-royal-600/20' : 'text-gray-500 dark:text-gray-400 hover:bg-royal-50 dark:hover:bg-[#111111] hover:text-royal-700 dark:hover:text-white'}`}>
              {({ isActive }) => (<><item.Icon size={18} strokeWidth={isActive ? 2.2 : 1.7} className={`shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-royal-500'}`} />{sidebarExpanded && <span className="whitespace-nowrap">{item.label}</span>}{sidebarExpanded && isActive && <motion.div layoutId="desktopSidebarDot" className="ml-auto w-1.5 h-1.5 bg-mint-400 rounded-full shadow-glow" />}</>)}
            </NavLink>
          ))}
        </nav>
        {sidebarExpanded ? (
          <div className="p-3 mx-2 mb-3 rounded-2xl bg-gradient-to-br from-royal-50 to-mint-50 dark:from-[#111111] dark:to-[#111111] border border-royal-100/60 dark:border-[#222222]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-royal-600 to-mint-600 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">{user.name?.[0] || 'U'}</div>
              <div className="flex-1 min-w-0"><p className="text-sm font-bold text-gray-800 dark:text-white truncate">{user.name || 'User'}</p><p className="text-[10px] text-royal-600 dark:text-royal-400 font-medium truncate">{user.shop || ''}</p></div>
            </div>
            <button onClick={handleLogout} className="w-full mt-2 flex items-center justify-center gap-2 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 text-[10px] font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-all border border-red-100 dark:border-red-900/30"><LogOut size={12} /> Logout</button>
          </div>
        ) : (
          <div className="px-2 mb-3">
            <button onClick={handleLogout} title="Logout" className="w-full flex items-center justify-center py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all"><LogOut size={16} /></button>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className={`flex-1 transition-all duration-300 ${sidebarExpanded ? 'lg:ml-[260px]' : 'lg:ml-[68px]'} flex flex-col min-h-screen`}>
        {/* Mobile Header */}
        <header className="sticky top-0 z-30 lg:hidden bg-gradient-to-r from-royal-700 via-royal-600 to-mint-700">
          <div className="flex items-center justify-between px-4 py-3">
            <Link to="/" className="flex items-center gap-2.5">
              <img src={logo} alt="Lucy Garden" className="w-9 h-9 rounded-xl object-cover shadow-md ring-2 ring-white/20" />
              <div>
                <h1 className="font-extrabold text-white text-[14px] leading-tight">Lucy Garden</h1>
                <p className="text-[8px] text-white/70 font-bold tracking-wider uppercase">{pageInfo().title}</p>
              </div>
            </Link>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center bg-white/15 rounded-lg px-1 py-0.5">
                {SIZES.map((s, i) => (
                  <button key={s} onClick={() => setFontSize(s)}
                    className={`px-1.5 py-1 rounded text-[9px] font-bold ${fontSize === s ? 'bg-white text-royal-700' : 'text-white/70'}`}>
                    {LABELS[i][0]}
                  </button>
                ))}
              </div>
              <button onClick={toggleDark} className="w-8 h-8 bg-white/15 backdrop-blur-sm rounded-full flex items-center justify-center">
                {isDark ? <Sun size={14} className="text-amber-300" /> : <Moon size={14} className="text-white/80" />}
              </button>
            </div>
          </div>
        </header>
        {/* Desktop Header */}
        <header className="sticky top-0 z-30 hidden lg:block bg-white dark:bg-[#0a0a0a] border-b border-gray-100/60 dark:border-[#222222]">
          <div className="flex items-center justify-between px-6 py-3">
            <Link to="/" className="hover:opacity-80 transition-opacity">
              <h2 className="text-[15px] font-extrabold text-gray-800 dark:text-white">Lucy Garden</h2>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">{pageInfo().title}{pageInfo().subtitle ? ` • ${pageInfo().subtitle}` : ''}</p>
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
              <button onClick={toggleDark} className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-[#111111] flex items-center justify-center hover:bg-gray-200 dark:hover:bg-[#1a1a1a] transition-colors">
                {isDark ? <Sun size={15} className="text-amber-400" /> : <Moon size={15} className="text-gray-500" />}
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 pb-20 lg:pb-6 w-full overscroll-y-contain">
          {/* Pull to refresh indicator */}
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
                    <button onClick={() => { setBanner(null); setBannerDismissed(banner.createdAt); localStorage.setItem('lg_banner_dismissed', banner.createdAt); }} className="w-6 h-6 bg-white/80 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center shrink-0 mt-0.5"><X size={10} className="text-gray-500" /></button>
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

        <AppFooter type="retailer" />
      </div>

      {/* More Bottom Sheet */}
      {moreOpen && (
        <>
            <div className="fixed inset-0 bg-black/40 z-50 lg:hidden" onClick={close} />
            <div ref={sheetRef} className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-white dark:bg-[#0a0a0a] rounded-t-3xl shadow-2xl max-h-[55vh] overflow-hidden">
              <div {...handleProps} className="flex justify-center pt-4 pb-3 cursor-grab active:cursor-grabbing">
                <div className="w-12 h-1.5 bg-gray-300 dark:bg-[#222222] rounded-full" />
              </div>
              <div className="px-5 pt-2 pb-1"><h3 className="text-[15px] font-extrabold text-gray-800 dark:text-white">More</h3></div>
              <div className="px-3 pb-4 overflow-y-auto">
                <div className="grid grid-cols-3 gap-2 p-2">
                  {moreLinks.filter(item => !item.flag || flags[item.flag] !== false).map((link, i) => (
                    <button key={link.to} onClick={() => { close(); setTimeout(() => navigate(link.to), 280); }}
                      className={`w-full flex flex-col items-center gap-2 py-4 px-2 rounded-2xl transition-colors touch-manipulation ${location.pathname === link.to ? 'bg-royal-50 dark:bg-royal-900/30 border border-royal-200 dark:border-royal-800' : 'bg-gray-50 dark:bg-[#111111] border border-gray-100 dark:border-[#222222]'}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${location.pathname === link.to ? 'bg-royal-100 dark:bg-royal-900/50' : 'bg-gray-100 dark:bg-[#1a1a1a]'}`}>
                        <link.Icon size={20} strokeWidth={1.7} className={location.pathname === link.to ? 'text-royal-600 dark:text-royal-400' : 'text-gray-500 dark:text-gray-400'} />
                      </div>
                      <span className={`text-[11px] font-semibold ${location.pathname === link.to ? 'text-royal-700 dark:text-royal-300' : 'text-gray-600 dark:text-gray-400'}`}>{link.label}</span>
                    </button>
                  ))}
                </div>
                <button onClick={handleLogout} className="w-full mt-3 flex items-center justify-center gap-2 py-3 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-500 text-[13px] font-bold">
                  <LogOut size={16} /> Logout
                </button>
              </div>
            </div>
        </>
      )}

      {/* Mobile Bottom Nav */}
      <nav className={`fixed bottom-0 left-0 right-0 z-30 lg:hidden transition-all duration-300 ${navHidden ? 'translate-y-full' : 'translate-y-0'} px-3 pb-[max(0.5rem,env(safe-area-inset-bottom))]`}>
        <div className="bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-xl rounded-2xl border border-gray-200/60 dark:border-[#222222] shadow-xl shadow-black/10 mb-1">
          <div className="flex items-center justify-around py-2.5 px-2 max-w-md mx-auto">
          {bottomNav.filter(item => !item.flag || flags[item.flag] !== false).map(item => (
            <NavLink key={item.to} to={item.to} end={item.end} className="relative flex-1 flex justify-center">
              {({ isActive }) => (
                <motion.div className={`flex flex-col items-center gap-1 py-2 px-3 rounded-2xl relative ${isActive ? 'text-royal-700 dark:text-white' : 'text-gray-400'}`} whileTap={{ scale: 0.82, y: 2 }}>
                  {isActive && <motion.div layoutId="bottomNavPill" className="absolute inset-0 bg-gradient-to-b from-royal-100 to-royal-50 dark:from-royal-900/40 dark:to-royal-900/20 rounded-2xl border border-royal-200/60 dark:border-royal-700 shadow-sm" transition={{ type: 'spring', stiffness: 350, damping: 30 }} />}
                  <motion.div className="relative z-10" animate={isActive ? { y: -1, scale: 1.15 } : { y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 15, bounce: 0.5 }}>
                    <item.Icon size={22} strokeWidth={isActive ? 2.5 : 1.6} />
                    {item.to === '/' && banner && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-[#111111]" />}
                  </motion.div>
                  <span className={`relative z-10 font-bold ${isActive ? 'text-[10px]' : 'text-[9px]'}`}>{item.label}</span>
                </motion.div>
              )}
            </NavLink>
          ))}
          <button onClick={() => moreOpen ? close() : setMoreOpen(true)} className="relative flex-1 flex justify-center">
            <motion.div className={`flex flex-col items-center gap-1 py-2 px-3 rounded-2xl relative ${moreOpen ? 'text-royal-700 dark:text-white' : 'text-gray-400'}`} whileTap={{ scale: 0.82, y: 2 }}>
              {moreOpen && <motion.div layoutId="bottomNavPill" className="absolute inset-0 bg-gradient-to-b from-royal-100 to-royal-50 dark:from-royal-900/40 dark:to-royal-900/20 rounded-2xl border border-royal-200/60 dark:border-royal-700 shadow-sm" transition={{ type: 'spring', stiffness: 350, damping: 30 }} />}
              <motion.div className="relative z-10" animate={moreOpen ? { y: -1, scale: 1.15 } : { y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 15, bounce: 0.5 }}><MoreHorizontal size={22} strokeWidth={moreOpen ? 2.5 : 1.6} /></motion.div>
              <span className={`relative z-10 font-bold ${moreOpen ? 'text-[10px]' : 'text-[9px]'}`}>More</span>
            </motion.div>
          </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
