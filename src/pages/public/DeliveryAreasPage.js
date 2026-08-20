import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight, MapPin } from 'lucide-react';
import BRAND from '../../utils/config';

function WhatsAppIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const AREAS = [
  { nameKey: 'area1', status: 'active',  timeKey: 'time1', distKey: 'dist1' },
  { nameKey: 'area2', status: 'active',  timeKey: 'time1', distKey: 'dist2' },
  { nameKey: 'area3', status: 'active',  timeKey: 'time2', distKey: 'dist3' },
  { nameKey: 'area4', status: 'active',  timeKey: 'time2', distKey: 'dist4' },
  { nameKey: 'area5', status: 'active',  timeKey: 'time3', distKey: 'dist5' },
  { nameKey: 'area6', status: 'active',  timeKey: 'time3', distKey: 'dist6' },
  { nameKey: 'area7', status: 'active',  timeKey: 'time4', distKey: 'dist7' },
  { nameKey: 'area8', status: 'enquire', timeKey: 'timeReq', distKey: 'distAsk' },
];

const STATUS_STYLE = {
  active:  { bg: '#f0fdf4', border: '#bbf7d0', dot: '#22c55e' },
  enquire: { bg: '#fef9ec', border: '#fde68a', dot: '#c9a84c' },
};

export default function DeliveryAreasPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const filtered = AREAS.filter(a =>
    t(`deliveryPage.${a.nameKey}`).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Hero */}
      <div className="relative h-64 sm:h-80 overflow-hidden">
        <img src="/images/delivery.jpg" alt="Delivery Areas" className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex flex-col justify-end p-8"
          style={{ background: 'linear-gradient(to top, rgba(15,25,15,0.92) 0%, rgba(15,25,15,0.3) 60%, transparent 100%)' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#c9a84c' }}>
              {t('deliveryAreas.label')}
            </p>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">{t('deliveryAreas.heading')}</h1>
            <p className="text-base max-w-lg" style={{ color: 'rgba(255,255,255,0.7)' }}>{t('deliveryAreas.sub')}</p>
          </motion.div>
        </div>
      </div>

      <div className="container-site section-pad">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { val: '7+',   key: 'statAreas' },
            { val: '150+', key: 'statFamilies' },
            { val: '6 AM', key: 'statEarliest' },
          ].map(({ val, key }, i) => (
            <motion.div key={key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }} className="card text-center py-5">
              <p className="text-2xl sm:text-3xl font-black text-olive-700 mb-1">{val}</p>
              <p className="text-xs text-sand-400 font-medium">{t(`deliveryPage.${key}`)}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">

            {/* Search */}
            <div className="relative mb-5">
              <MapPin size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-sand-400" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder={t('deliveryPage.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-sand-200 bg-white text-sm text-sand-800 placeholder-sand-400 focus:outline-none focus:border-olive-400 focus:ring-1 focus:ring-olive-200 transition"
              />
            </div>

            {/* Area cards */}
            <div className="space-y-3 mb-6">
              {filtered.length === 0 ? (
                <div className="card text-center py-10">
                  <p className="text-2xl mb-2">🔍</p>
                  <p className="text-sm font-semibold text-sand-700 mb-1">{t('deliveryPage.notFoundTitle')}</p>
                  <p className="text-xs text-sand-400">{t('deliveryPage.notFoundSub')}</p>
                </div>
              ) : filtered.map((area, i) => {
                const s = STATUS_STYLE[area.status];
                return (
                  <motion.div key={area.nameKey} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-sand-200 hover:border-olive-200 hover:shadow-sm transition-all">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: s.bg, border: `1.5px solid ${s.border}` }}>
                      <MapPin size={16} style={{ color: s.dot }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-sand-900">{t(`deliveryPage.${area.nameKey}`)}</p>
                      <p className="text-xs text-sand-400 mt-0.5">🕕 {t(`deliveryPage.${area.timeKey}`)} · {t(`deliveryPage.${area.distKey}`)}</p>
                    </div>
                    <span className="text-xs font-semibold px-3 py-1 rounded-full shrink-0"
                      style={{ background: s.bg, color: s.dot, border: `1px solid ${s.border}` }}>
                      <span className="inline-block w-1.5 h-1.5 rounded-full mr-1.5 align-middle" style={{ background: s.dot }} />
                      {t(`deliveryPage.status${area.status.charAt(0).toUpperCase() + area.status.slice(1)}`)}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {/* Not in list note */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
              className="rounded-2xl p-5 flex items-start gap-4"
              style={{ background: '#f0f7f0', border: '1.5px solid #bbf7d0' }}>
              <span className="text-2xl shrink-0">📍</span>
              <div>
                <p className="text-sm font-bold text-olive-800 mb-1">{t('deliveryAreas.note')}</p>
                <a href={`https://wa.me/${BRAND.whatsapp}?text=Hi, mera area delivery mein hai kya? Main ${search || t('deliveryPage.myArea')} mein rehta hoon.`}
                  target="_blank" rel="noopener noreferrer" className="btn-whatsapp mt-3 text-sm">
                  <WhatsAppIcon /> {t('deliveryPage.askWhatsapp')} <ArrowRight size={13} />
                </a>
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="rounded-2xl overflow-hidden border border-sand-200">
              <iframe
                title="Delivery Area Map"
                src={`https://maps.google.com/maps?q=${BRAND.lat},${BRAND.lng}&z=13&output=embed`}
                width="100%" height="260" style={{ border: 0, display: 'block' }}
                allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
              />
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="card">
              <p className="text-xs font-bold uppercase tracking-widest text-sand-400 mb-4">{t('deliveryPage.infoTitle')}</p>
              <div className="space-y-3">
                {[
                  { icon: '🕕', labelKey: 'infoTimingLabel', valKey: 'infoTimingVal' },
                  { icon: '📅', labelKey: 'infoDaysLabel',   valKey: 'infoDaysVal' },
                  { icon: '🥛', labelKey: 'infoProductsLabel', valKey: 'infoProductsVal' },
                  { icon: '💰', labelKey: 'infoChargesLabel', valKey: 'infoChargesVal' },
                ].map(({ icon, labelKey, valKey }) => (
                  <div key={labelKey} className="flex items-start gap-3">
                    <span className="text-lg shrink-0">{icon}</span>
                    <div>
                      <p className="text-xs text-sand-400 font-semibold uppercase tracking-wide">{t(`deliveryPage.${labelKey}`)}</p>
                      <p className="text-sm text-sand-700 font-medium mt-0.5">{t(`deliveryPage.${valKey}`)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="card text-center" style={{ background: 'linear-gradient(135deg, #f0f7f0, #fafaf7)' }}>
              <p className="text-2xl mb-2">🚀</p>
              <p className="text-sm font-black text-sand-900 mb-1">{t('deliveryPage.ctaTitle')}</p>
              <p className="text-xs text-sand-500 mb-4">{t('deliveryPage.ctaSub')}</p>
              <a href={`https://wa.me/${BRAND.whatsapp}?text=Hi, delivery shuru karni hai`}
                target="_blank" rel="noopener noreferrer" className="btn-whatsapp w-full justify-center text-sm">
                <WhatsAppIcon /> WhatsApp Us
              </a>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}
