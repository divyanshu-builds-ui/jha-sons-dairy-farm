import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Phone, ArrowRight, ChevronDown } from 'lucide-react';
import BRAND from '../../utils/config';

export function WhatsAppIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export const fmt = (p) => `+91 ${p.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}`;

// ─── Animated Counter ─────────────────────────────────────────────────────────
export function Counter({ to, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        let start = 0;
        const step = Math.ceil(to / 40);
        const timer = setInterval(() => {
          start += step;
          if (start >= to) { setCount(to); clearInterval(timer); }
          else setCount(start);
        }, 30);
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [to]);
  return <span ref={ref}>{count}{suffix}</span>;
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
export function Hero() {
  const { t } = useTranslation();
  return (
    <section className="relative overflow-hidden" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center' }}>
      <div className="absolute inset-0">
        <img src="/images/hero.jpg" alt="Jha & Sons Dairy Farm" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(105deg, rgba(15,25,15,0.92) 0%, rgba(15,25,15,0.65) 50%, rgba(15,25,15,0.2) 100%)' }} />
      </div>

      <div className="container-site relative z-10 w-full" style={{ paddingTop: '7rem', paddingBottom: '5rem' }}>
        <div className="max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: 'easeOut' }}>

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-7"
              style={{ background: 'rgba(201,168,76,0.15)', border: '1px solid rgba(201,168,76,0.35)' }}>
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#c9a84c' }} />
              <span className="text-xs font-semibold" style={{ color: '#e8d9aa' }}>{t('hero.location')}</span>
            </div>

            <h1 style={{ fontSize: 'clamp(1.8rem, 7vw, 3.5rem)', fontWeight: 900, color: 'white', lineHeight: 1.12, letterSpacing: '-0.5px', marginBottom: '1.25rem' }}>
              {t('hero.tagline')}<br />
              <span style={{ color: '#c9a84c' }}>{t('hero.tagline2')}</span>
            </h1>

            <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.75, maxWidth: '480px', marginBottom: '2.25rem' }}>
              {t('hero.sub')}
            </p>

            <div className="flex flex-wrap gap-3 mb-6">
              <Link to="/enquiry" className="btn-primary-lg">
                {t('hero.cta_delivery')} <ArrowRight size={16} />
              </Link>
              <a href={`https://wa.me/${BRAND.whatsapp}?text=Namaste, dairy delivery ke baare mein jaanna chahta hoon`}
                target="_blank" rel="noopener noreferrer" className="btn-whatsapp-lg">
                <WhatsAppIcon size={17} /> WhatsApp
              </a>
            </div>

            <a href={`tel:${BRAND.phone}`}
              className="inline-flex items-center gap-2 text-sm"
              style={{ color: 'rgba(255,255,255,0.4)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.75)'}
              onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.4)'}>
              <Phone size={13} /> {fmt(BRAND.phone)}
            </a>

          </motion.div>
        </div>
      </div>

      <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        style={{ color: 'rgba(255,255,255,0.3)' }}>
        <ChevronDown size={24} />
      </motion.div>
    </section>
  );
}

// ─── Trust Bar ────────────────────────────────────────────────────────────────
export function TrustBar() {
  const { t } = useTranslation();
  return (
    <div className="bg-white border-y border-sand-200">
      <div className="container-site py-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-sand-200">
          {[
            { value: 150, suffix: '+', label: t('trust.customers') },
            { value: 2020, suffix: '',  label: t('trust.since') },
            { value: 7,   suffix: '+', label: t('trust.varieties') },
            { value: 365, suffix: '',  label: t('trust.delivery') },
          ].map(({ value, suffix, label }) => (
            <div key={label} className="text-center px-4 py-3">
              <p className="text-2xl font-black text-olive-700 leading-none">
                <Counter to={value} suffix={suffix} />
              </p>
              <p className="text-xs text-sand-500 mt-1.5 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Products ─────────────────────────────────────────────────────────────────
export function Products() {
  const { t } = useTranslation();

  const featured = [
    { key: 'cowMilk',     img: '/images/cow-milk.jpg',     price: '₹55', unit: t('products.perLitre'), badge: t('products.daily') },
    { key: 'buffaloMilk', img: '/images/buffalo-milk.jpg', price: '₹65', unit: t('products.perLitre'), badge: t('products.daily') },
  ];

  const others = [
    { key: 'ghee',   img: '/images/ghee.jpg'   },
    { key: 'paneer', img: '/images/paneer.jpg' },
    { key: 'khoa',   img: '/images/khoa.jpg'   },
    { key: 'peda',   img: '/images/peda.jpg'   },
    { key: 'bakri',  img: '/images/goat.jpg'   },
    { key: 'fish',   img: '/images/fish.jpg'   },
  ];

  return (
    <section className="bg-sand-50">
      <div className="container-site section-pad">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <p className="label-tag mb-2">{t('products.label')}</p>
          <h2 className="heading-lg mb-2">{t('products.heading')}</h2>
          <p className="body-lg mb-10 max-w-lg">{t('products.sub')}</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          {featured.map(({ key, img, price, unit, badge }, i) => (
            <motion.div key={key} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.45, delay: i * 0.1 }}
              className="card group overflow-hidden p-0">
              <div className="relative h-56 overflow-hidden">
                <img src={img} alt={t(`products.${key}.name`)}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.45) 0%, transparent 55%)' }} />
                <span className="absolute top-3 right-3 badge-green">{badge}</span>
                <div className="absolute bottom-4 left-5">
                  <p className="text-white font-black text-xl">{t(`products.${key}.name`)}</p>
                  <p className="text-white/70 text-sm">{price} <span className="text-white/50 text-xs">{unit}</span></p>
                </div>
              </div>
              <div className="p-5">
                <p className="body-sm mb-4">{t(`products.${key}.desc`)}</p>
                <div className="flex items-center justify-between pt-3 border-t border-sand-100">
                  <span className="text-2xl font-black text-olive-700">{price} <span className="text-xs font-normal text-sand-400">{unit}</span></span>
                  <Link to="/contact" className="btn-primary py-2 px-4 text-sm">
                    {t('products.enquire')} <ArrowRight size={13} />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {others.map(({ key, emoji, img }, i) => (
            <motion.div key={key} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.07 }}
              className="card group overflow-hidden p-0">
              <div className="h-28 overflow-hidden">
                <img src={img} alt={t(`products.${key}.name`)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
              <div className="p-3">
                <p className="text-sm font-bold text-sand-800">{t(`products.${key}.name`)}</p>
                <p className="text-xs text-sand-400 mt-0.5">{t('products.onEnquiry')}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <Link to="/milk" className="btn-ghost border border-sand-200">
            {t('products.viewAll')} <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Gallery Strip ────────────────────────────────────────────────────────────
export function GalleryStrip() {
  const images = [
    { src: '/images/farm.jpg',                    alt: 'Our Farm' },
    { src: '/images/indian cow farm close up.jpg', alt: 'Desi Cow' },
    { src: '/images/milking cow india.jpg',        alt: 'Fresh Milk' },
    { src: '/images/dairy farm india morning.jpg', alt: 'Morning Farm' },
    { src: '/images/gaau-seva.jpg',               alt: 'Gau Seva' },
    { src: '/images/delivery.jpg',                alt: 'Delivery' },
  ];

  return (
    <section className="bg-white py-3 overflow-hidden">
      <div className="flex gap-3 overflow-x-auto px-4 sm:px-8 pb-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {images.map(({ src, alt }, i) => (
          <motion.div key={i} initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.07 }}
            className="shrink-0 rounded-2xl overflow-hidden"
            style={{ width: 'min(260px, 72vw)', height: '180px' }}>
            <img src={src} alt={alt} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// ─── How It Works ─────────────────────────────────────────────────────────────
export function HowItWorks() {
  const { t } = useTranslation();
  return (
    <section style={{ background: '#2d4428' }}>
      <div className="container-site section-pad">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <p className="label-tag text-olive-300 mb-2">{t('howItWorks.label')}</p>
          <h2 className="heading-lg text-white mb-10">{t('howItWorks.heading')}</h2>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {['step1', 'step2', 'step3'].map((s, i) => (
            <motion.div key={s} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.45, delay: i * 0.12 }}
              className="flex gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
                style={{ background: '#c9a84c' }}>
                {String(i + 1).padStart(2, '0')}
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1.5">{t(`howItWorks.${s}.title`)}</h3>
                <p className="text-sm text-olive-300 leading-relaxed">{t(`howItWorks.${s}.desc`)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
