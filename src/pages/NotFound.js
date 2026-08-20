import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Phone, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import BRAND from '../utils/config';

export default function NotFound() {
  const { t } = useTranslation();

  const QUICK_LINKS = [
    { to: '/milk',     label: t('nav.milk'),    emoji: '🥛' },
    { to: '/schemes',  label: t('nav.schemes'), emoji: '🎁' },
    { to: '/about',    label: t('nav.about'),   emoji: '🏡' },
    { to: '/contact',  label: t('nav.contact'), emoji: '📞' },
  ];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: '#fafaf7' }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="text-center max-w-md w-full">

        <div className="relative mb-6 select-none">
          <p className="text-[120px] sm:text-[160px] font-black leading-none" style={{ color: '#e8e5e0' }}>404</p>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl sm:text-6xl">🐄</span>
          </div>
        </div>

        <h1 className="heading-lg mb-3">{t('notFound.title')}</h1>
        <p className="body-md mb-8 max-w-xs mx-auto">{t('notFound.sub')}</p>

        <div className="flex flex-wrap gap-3 justify-center mb-10">
          <Link to="/" className="btn-primary">
            <Home size={15} /> {t('notFound.goHome')}
          </Link>
          <a href={`tel:${BRAND.phone}`} className="btn-outline">
            <Phone size={15} /> {t('notFound.callUs')}
          </a>
        </div>

        <div className="card p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-sand-400 mb-4">{t('notFound.quickLinks')}</p>
          <div className="grid grid-cols-2 gap-2">
            {QUICK_LINKS.map(({ to, label, emoji }) => (
              <Link key={to} to={to}
                className="flex items-center gap-2 p-3 rounded-xl border border-sand-200 hover:border-olive-300 hover:bg-olive-50 transition-all group text-left">
                <span className="text-lg">{emoji}</span>
                <span className="text-sm font-medium text-sand-700 group-hover:text-olive-700 flex-1">{label}</span>
                <ArrowRight size={12} className="text-sand-300 group-hover:text-olive-500 transition-colors" />
              </Link>
            ))}
          </div>
        </div>

      </motion.div>
    </div>
  );
}
