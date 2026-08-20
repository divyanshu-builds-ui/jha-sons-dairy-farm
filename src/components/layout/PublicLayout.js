import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Globe, Phone, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Logo from '../../assets/Logo';
import BRAND from '../../utils/config';
import LanguageModal from '../LanguageModal';
import DemoBanner from '../DemoBanner';

function WhatsAppIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function Navbar({ onLangOpen, bannerH }) {
  const [open, setOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { t, i18n } = useTranslation();

  const NAV = [
    { to: '/',         label: t('nav.home'),    end: true },
    { to: '/milk',     label: t('nav.milk') },
    { to: '/schemes',  label: t('nav.schemes') },
    { to: '/gau-seva', label: t('nav.gauSeva') },
    { to: '/about',    label: t('nav.about') },
    { to: '/contact',  label: t('nav.contact') },
  ];

  const MORE = [
    { to: '/delivery-areas', label: 'Delivery Areas',  emoji: '📍' },
    { to: '/updates',        label: 'Updates & Offers', emoji: '🎁' },
  ];
  const isMoreActive = MORE.some(m => location.pathname === m.to);

  useEffect(() => { setOpen(false); setMoreOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!moreOpen) return;
    const h = () => setMoreOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [moreOpen]);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  const isHome = location.pathname === '/';

  return (
    <header className={`fixed inset-x-0 z-50 transition-all duration-300 ${
      scrolled || !isHome ? 'bg-white/96 backdrop-blur-md shadow-sm border-b border-sand-200' : 'bg-transparent'
    }`} style={{ top: `${bannerH}px` }}>
      <div className="container-site">
        <div className="flex items-center justify-between h-16">

          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <Logo size={34} />
            <div className="leading-tight">
              <p className={`font-black text-sm tracking-tight ${isHome && !scrolled ? 'text-white' : 'text-sand-950'}`}>{BRAND.shortName}</p>
              <p className={`text-2xs font-medium ${isHome && !scrolled ? 'text-white/60' : 'text-sand-500'}`}>Dairy Farm · {BRAND.city}</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5">
            {NAV.map(({ to, label, end }) => (
              <NavLink key={to} to={to} end={end}
                className={({ isActive }) =>
                  `px-3.5 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                    isActive
                      ? 'text-olive-700 bg-olive-50'
                      : isHome && !scrolled ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-sand-600 hover:text-sand-900 hover:bg-sand-100'
                  }`
                }>
                {label}
              </NavLink>
            ))}
            {/* More dropdown */}
            <div className="relative" onMouseDown={e => e.stopPropagation()}>
              <button onClick={() => setMoreOpen(v => !v)}
                className={`flex items-center gap-1 px-3.5 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                  isMoreActive
                    ? 'text-olive-700 bg-olive-50'
                    : isHome && !scrolled ? 'text-white/80 hover:text-white hover:bg-white/10' : 'text-sand-600 hover:text-sand-900 hover:bg-sand-100'
                }`}>
                More <ChevronDown size={13} className={`transition-transform duration-200 ${moreOpen ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence>
                {moreOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute top-full right-0 mt-1.5 w-52 bg-white rounded-2xl shadow-lg border border-sand-200 overflow-hidden z-50 py-1.5">
                    {MORE.map(({ to, label, emoji }) => (
                      <NavLink key={to} to={to}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors ${
                            isActive ? 'text-olive-700 bg-olive-50' : 'text-sand-700 hover:bg-sand-50'
                          }`
                        }>
                        <span className="text-base">{emoji}</span> {label}
                      </NavLink>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </nav>

          <div className="flex items-center gap-2">
            <button onClick={onLangOpen}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
                isHome && !scrolled ? 'border-white/25 text-white/80 hover:bg-white/10' : 'border-sand-200 text-sand-600 hover:bg-sand-100'
              }`}>
              <Globe size={13} />
              {i18n.language === 'hi' ? 'हि' : 'EN'}
            </button>
            <Link to="/login"
              className={`hidden sm:flex items-center gap-1.5 text-sm py-2 px-4 rounded-lg font-semibold transition-colors ${
                isHome && !scrolled
                  ? 'bg-white/15 text-white hover:bg-white/25 border border-white/25'
                  : 'bg-olive-700 text-white hover:bg-olive-800'
              }`}>
              Login
            </Link>
            <button onClick={() => setOpen(v => !v)}
              className={`md:hidden w-9 h-9 flex items-center justify-center rounded-lg border transition-colors ${
                isHome && !scrolled ? 'border-white/25 text-white hover:bg-white/10' : 'border-sand-200 text-sand-600 hover:bg-sand-100'
              }`}>
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="md:hidden bg-white border-b border-sand-200 shadow-md">
            <div className="container-site py-3 space-y-0.5">
              {NAV.map(({ to, label, end }) => (
                <NavLink key={to} to={to} end={end}
                  className={({ isActive }) =>
                    `block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'text-olive-700 bg-olive-50' : 'text-sand-700 hover:bg-sand-100'
                    }`
                  }>
                  {label}
                </NavLink>
              ))}
              <div className="border-t border-sand-100 my-1" />
              {MORE.map(({ to, label, emoji }) => (
                <NavLink key={to} to={to}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'text-olive-700 bg-olive-50' : 'text-sand-700 hover:bg-sand-100'
                    }`
                  }>
                  <span>{emoji}</span> {label}
                </NavLink>
              ))}
              <div className="pt-2 pb-1 grid grid-cols-2 gap-2">
                <Link to="/login" className="btn-primary justify-center py-2.5">
                  Login
                </Link>
                <button onClick={onLangOpen} className="btn-outline justify-center py-2.5">
                  <Globe size={14} /> Language
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function Footer() {
  const { t } = useTranslation();
  const NAV = [
    { to: '/',         label: t('nav.home') },
    { to: '/milk',     label: t('nav.milk') },
    { to: '/schemes',  label: t('nav.schemes') },
    { to: '/gau-seva', label: t('nav.gauSeva') },
    { to: '/about',    label: t('nav.about') },
    { to: '/contact',  label: t('nav.contact') },
  ];
  return (
    <footer className="bg-sand-950 text-sand-400">
      <div className="container-site py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <Logo size={30} />
              <div>
                <p className="font-black text-sm text-white">{BRAND.shortName}</p>
                <p className="text-2xs text-sand-600">Dairy Farm · {BRAND.city}</p>
              </div>
            </div>
            <p className="text-sm text-sand-500 leading-relaxed">{BRAND.description}</p>
          </div>
          <div>
            <p className="text-2xs font-bold uppercase tracking-widest text-sand-600 mb-3">Pages</p>
            <div className="space-y-1.5">
              {NAV.map(({ to, label }) => (
                <Link key={to} to={to} className="block text-sm text-sand-500 hover:text-white transition-colors">{label}</Link>
              ))}
              <Link to="/delivery-areas" className="block text-sm text-sand-500 hover:text-white transition-colors">Delivery Areas</Link>
              <Link to="/updates" className="block text-sm text-sand-500 hover:text-white transition-colors">Updates & Offers</Link>
            </div>
          </div>
          <div>
            <p className="text-2xs font-bold uppercase tracking-widest text-sand-600 mb-3">Contact</p>
            <div className="space-y-2.5 text-sm">
              <a href={`tel:${BRAND.phone}`} className="flex items-center gap-2 text-sand-400 hover:text-white transition-colors">
                <Phone size={13} className="shrink-0" />
                +91 {BRAND.phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}
              </a>
              <a href={`https://wa.me/${BRAND.whatsapp}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-sand-400 hover:text-white transition-colors">
                <WhatsAppIcon size={13} /> WhatsApp
              </a>
              <p className="text-sand-500 text-xs leading-relaxed">{BRAND.address}</p>
            </div>
          </div>
        </div>
        <div className="border-t border-sand-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-sand-600">© {new Date().getFullYear()} {BRAND.name}. All rights reserved.</p>
          <p className="text-2xs text-sand-700">
            Built by{' '}
            <a href={BRAND.developer.portfolio} target="_blank" rel="noopener noreferrer"
              className="hover:text-sand-400 transition-colors">{BRAND.developer.name}</a>
          </p>
        </div>
      </div>
    </footer>
  );
}

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit:    { opacity: 0, y: -6, transition: { duration: 0.18, ease: 'easeIn' } },
};

function AnimatedOutlet() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div key={location.pathname} variants={pageVariants} initial="initial" animate="animate" exit="exit">
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}

export default function PublicLayout() {
  const [langOpen, setLangOpen] = useState(false);
  const [bannerOpen, setBannerOpen] = useState(true);
  const bannerH = bannerOpen ? 32 : 0;
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <div className="min-h-screen bg-sand-50">
      <Navbar onLangOpen={() => setLangOpen(true)} bannerH={bannerH} />
      <LanguageModal open={langOpen} onClose={() => setLangOpen(false)} />
      <DemoBanner onClose={() => setBannerOpen(false)} />
      <main style={{ paddingTop: isHome ? 0 : `calc(4rem + ${bannerH}px)` }}>
        <AnimatedOutlet />
      </main>
      <Footer />
    </div>
  );
}
