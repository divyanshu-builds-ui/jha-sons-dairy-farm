import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight } from 'lucide-react';
import BRAND from '../../utils/config';

function WhatsAppIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const UPDATE_DATA = [
  { id: 1, category: 'offer',  emoji: '🎁', date: 'Aug 2026', titleKey: 'u1title', bodyKey: 'u1body', tagKey: 'tagOffer',   tagColor: '#c9a84c', tagBg: '#fef9ec', tagBorder: '#fde68a' },
  { id: 2, category: 'farm',   emoji: '🐄', date: 'Jul 2026', titleKey: 'u2title', bodyKey: 'u2body', tagKey: 'tagFarm',    tagColor: '#3d5a3e', tagBg: '#f0f7f0', tagBorder: '#bbf7d0' },
  { id: 3, category: 'notice', emoji: '📢', date: 'Jul 2026', titleKey: 'u3title', bodyKey: 'u3body', tagKey: 'tagNotice',  tagColor: '#7c3aed', tagBg: '#f5f3ff', tagBorder: '#ddd6fe' },
  { id: 4, category: 'offer',  emoji: '👋', date: 'Jun 2026', titleKey: 'u4title', bodyKey: 'u4body', tagKey: 'tagNewCust', tagColor: '#3d5a3e', tagBg: '#f0f7f0', tagBorder: '#bbf7d0' },
  { id: 5, category: 'farm',   emoji: '🌾', date: 'Jun 2026', titleKey: 'u5title', bodyKey: 'u5body', tagKey: 'tagFarm',    tagColor: '#3d5a3e', tagBg: '#f0f7f0', tagBorder: '#bbf7d0' },
  { id: 6, category: 'notice', emoji: '📋', date: 'May 2026', titleKey: 'u6title', bodyKey: 'u6body', tagKey: 'tagNotice',  tagColor: '#7c3aed', tagBg: '#f5f3ff', tagBorder: '#ddd6fe' },
];

const TAB_KEYS = [
  { key: 'all',    labelKey: 'tabAll',    emoji: '📰' },
  { key: 'offer',  labelKey: 'tabOffer',  emoji: '🎁' },
  { key: 'farm',   labelKey: 'tabFarm',   emoji: '🐄' },
  { key: 'notice', labelKey: 'tabNotice', emoji: '📢' },
];

export default function UpdatesPage() {
  const { t } = useTranslation();
  const [active, setActive] = useState('all');

  const filtered = active === 'all' ? UPDATE_DATA : UPDATE_DATA.filter(u => u.category === active);

  return (
    <>
      {/* Hero */}
      <div className="relative h-64 sm:h-80 overflow-hidden">
        <img src="/images/dairy farm india morning.jpg" alt="Updates" className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex flex-col justify-end p-8"
          style={{ background: 'linear-gradient(to top, rgba(15,25,15,0.92) 0%, rgba(15,25,15,0.3) 60%, transparent 100%)' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#c9a84c' }}>
              {t('updates.label')}
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">{t('updates.heading')}</h1>
            <p className="text-base max-w-lg" style={{ color: 'rgba(255,255,255,0.7)' }}>{t('updates.sub')}</p>
          </motion.div>
        </div>
      </div>

      <div className="container-site section-pad">

        {/* Filter tabs */}
        <div className="flex gap-2 flex-wrap mb-8">
          {TAB_KEYS.map(tab => (
            <button key={tab.key} onClick={() => setActive(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                active === tab.key
                  ? 'bg-olive-700 text-white border-olive-700'
                  : 'bg-white text-sand-600 border-sand-200 hover:border-olive-300'
              }`}>
              <span>{tab.emoji}</span> {t(`updates.${tab.labelKey}`)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-5">
            <AnimatePresence mode="popLayout">
              {filtered.map((u, i) => (
                <motion.div key={u.id}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3, delay: i * 0.06 }}
                  className="card p-0 overflow-hidden">
                  <div className="flex items-start gap-4 p-5 pb-4">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                      style={{ background: u.tagBg, border: `1.5px solid ${u.tagBorder}` }}>
                      {u.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                          style={{ background: u.tagBg, color: u.tagColor, border: `1px solid ${u.tagBorder}` }}>
                          {t(`updates.${u.tagKey}`)}
                        </span>
                        <span className="text-xs text-sand-400">{u.date}</span>
                      </div>
                      <h3 className="text-base font-black text-sand-900 leading-snug">{t(`updates.${u.titleKey}`)}</h3>
                    </div>
                  </div>
                  <div className="mx-5 border-t border-sand-100" />
                  <p className="text-sm text-sand-600 leading-relaxed p-5 pt-4">{t(`updates.${u.bodyKey}`)}</p>
                </motion.div>
              ))}
            </AnimatePresence>

            {filtered.length === 0 && (
              <div className="card text-center py-12">
                <p className="text-3xl mb-3">📭</p>
                <p className="text-sm font-semibold text-sand-700">{t('updates.empty')}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="card" style={{ background: 'linear-gradient(135deg, #f0f7f0, #fafaf7)' }}>
              <p className="text-2xl mb-2">🔔</p>
              <p className="text-sm font-black text-sand-900 mb-1">{t('updates.subscribeTitle')}</p>
              <p className="text-xs text-sand-500 mb-4">{t('updates.subscribeSub')}</p>
              <a href={`https://wa.me/${BRAND.whatsapp}?text=Hi, mujhe farm updates aur offers WhatsApp par chahiye`}
                target="_blank" rel="noopener noreferrer" className="btn-whatsapp w-full justify-center text-sm">
                <WhatsAppIcon /> {t('updates.subscribeBtn')}
              </a>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="card">
              <p className="text-xs font-bold uppercase tracking-widest text-sand-400 mb-4">{t('updates.glanceTitle')}</p>
              <div className="space-y-3">
                {[
                  { emoji: '🎁', labelKey: 'glanceOffers',  val: '2' },
                  { emoji: '🐄', labelKey: 'glanceFarm',    val: '2' },
                  { emoji: '📢', labelKey: 'glanceNotices', val: '2' },
                  { emoji: '📅', labelKey: 'glanceUpdated', val: 'Aug 2026' },
                ].map(({ emoji, labelKey, val }) => (
                  <div key={labelKey} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{emoji}</span>
                      <p className="text-xs text-sand-500">{t(`updates.${labelKey}`)}</p>
                    </div>
                    <p className="text-xs font-bold text-sand-800">{val}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              className="bg-olive-50 border border-olive-200 rounded-2xl p-5 text-center">
              <p className="text-sm font-black text-sand-900 mb-1">{t('updates.ctaTitle')}</p>
              <p className="text-xs text-sand-500 mb-4">{t('updates.ctaSub')}</p>
              <a href="/enquiry" className="btn-primary w-full justify-center text-sm">
                {t('updates.ctaBtn')} <ArrowRight size={13} />
              </a>
            </motion.div>
          </div>
        </div>

        <p className="text-xs text-sand-400 italic text-center mt-10">{t('updates.demoNote')}</p>
      </div>
    </>
  );
}
