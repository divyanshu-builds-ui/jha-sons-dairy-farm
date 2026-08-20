import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { ArrowRight, Phone } from 'lucide-react';
import BRAND from '../../utils/config';

function WhatsAppIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const ALL_PRODUCTS = [
  { key: 'cowMilk',     img: '/images/cow-milk.jpg',     price: '₹55', per: 'litre', badge: 'Daily',      category: 'milk',  daily: true  },
  { key: 'buffaloMilk', img: '/images/buffalo-milk.jpg', price: '₹65', per: 'litre', badge: 'Daily',      category: 'milk',  daily: true  },
  { key: 'ghee',        img: '/images/ghee.jpg',         price: null,  per: null,    badge: 'On Enquiry', category: 'dairy', daily: false },
  { key: 'paneer',      img: '/images/paneer.jpg',       price: null,  per: null,    badge: 'On Enquiry', category: 'dairy', daily: false },
  { key: 'khoa',        img: '/images/khoa.jpg',         price: null,  per: null,    badge: 'On Enquiry', category: 'dairy', daily: false },
  { key: 'peda',        img: '/images/peda.jpg',         price: null,  per: null,    badge: 'On Enquiry', category: 'sweet', daily: false },
  { key: 'bakri',       img: '/images/goat.jpg',         price: null,  per: null,    badge: 'On Enquiry', category: 'other', daily: false },
  { key: 'fish',        img: '/images/fish.jpg',         price: null,  per: null,    badge: 'On Enquiry', category: 'other', daily: false },
];

const TABS = [
  { id: 'all',   label: 'All' },
  { id: 'milk',  label: '🥛 Milk' },
  { id: 'dairy', label: '🧀 Dairy' },
  { id: 'sweet', label: '🍮 Sweets' },
  { id: 'other', label: '🐐 Other' },
];

export default function ProductsPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('all');

  const filtered = activeTab === 'all' ? ALL_PRODUCTS : ALL_PRODUCTS.filter(p => p.category === activeTab);

  return (
    <>
      {/* Hero Banner */}
      <div className="relative overflow-hidden" style={{ minHeight: '280px', display: 'flex', alignItems: 'flex-end' }}>
        <img src="/images/dairy farm india morning.jpg" alt="Our Products"
          className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(15,25,15,0.92) 0%, rgba(15,25,15,0.4) 60%, transparent 100%)' }} />
        <div className="container-site relative z-10 pb-10 pt-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="label-tag text-olive-300 mb-2">{t('products.label')}</p>
            <h1 className="heading-lg text-white mb-2">{t('products.heading')}</h1>
            <p className="body-lg max-w-xl" style={{ color: 'rgba(255,255,255,0.65)' }}>{t('products.sub')}</p>
          </motion.div>
        </div>
      </div>

      <div className="container-site section-pad">

        {/* Filter Tabs */}
        <div className="flex gap-2 flex-wrap mb-10">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${
                activeTab === tab.id
                  ? 'bg-olive-700 text-white border-olive-700'
                  : 'bg-white text-sand-600 border-sand-200 hover:border-olive-300'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <AnimatePresence mode="wait">
          <motion.div key={activeTab}
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-14">
            {filtered.map(({ key, img, price, per, badge, daily }, i) => (
              <motion.div key={key}
                initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                className="card group overflow-hidden p-0">

                {/* Image */}
                <div className="relative overflow-hidden" style={{ height: daily ? '200px' : '160px' }}>
                  <img src={img} alt={t(`products.${key}.name`)}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 55%)' }} />
                  <span className={`absolute top-3 right-3 ${daily ? 'badge-green' : 'badge-gold'}`}>
                    {daily ? t('products.daily') : t('products.onEnquiry')}
                  </span>
                  {daily && (
                    <div className="absolute bottom-3 left-4">
                      <p className="text-white font-black text-xl">{price}</p>
                      <p className="text-white/60 text-xs">/ {t('products.perLitre')}</p>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4">
                  <h3 className="text-base font-black text-sand-900 mb-1">{t(`products.${key}.name`)}</h3>
                  <p className="text-xs text-sand-500 leading-relaxed mb-4">{t(`products.${key}.desc`)}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-sand-100">
                    {daily
                      ? <span className="text-lg font-black text-olive-700">{price} <span className="text-xs font-normal text-sand-400">/ {t('products.perLitre')}</span></span>
                      : <span className="text-xs font-semibold text-sand-400">{t('products.onEnquiry')}</span>
                    }
                    <Link to="/enquiry" className="btn-primary py-2 px-4 text-xs">
                      {t('products.enquire')} <ArrowRight size={12} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* CTA */}
        <div className="rounded-2xl p-8 sm:p-10 text-white text-center" style={{ background: 'linear-gradient(135deg, #3d5a3e, #2d4428)' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#c9a84c' }}>{t('cta.label')}</p>
          <h3 className="text-2xl font-black mb-2">{t('cta.heading')}</h3>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.6)' }}>{t('cta.sub')}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link to="/enquiry" className="btn-primary-lg">
              {t('cta.enquiry')} <ArrowRight size={16} />
            </Link>
            <a href={`https://wa.me/${BRAND.whatsapp}`} target="_blank" rel="noopener noreferrer"
              className="btn-whatsapp-lg">
              <WhatsAppIcon size={17} /> {t('cta.whatsapp')}
            </a>
            <a href={`tel:${BRAND.phone}`}
              className="inline-flex items-center gap-2 text-base px-6 py-3 rounded-xl border font-semibold transition-colors hover:bg-white/10"
              style={{ borderColor: 'rgba(255,255,255,0.25)', color: 'white' }}>
              <Phone size={15} /> {BRAND.phone}
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
