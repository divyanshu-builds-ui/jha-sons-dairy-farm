import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { CheckCircle2, MapPin, Phone, ArrowRight, Star, ChevronDown, Gift, Heart } from 'lucide-react';
import BRAND from '../../utils/config';
import { WhatsAppIcon, fmt } from './HomeTop';
import useRazorpay from '../../hooks/useRazorpay';

// ─── Why Us ───────────────────────────────────────────────────────────────────
export function WhyUs() {
  const { t } = useTranslation();
  const reasons = t('whyUs.reasons', { returnObjects: true });
  return (
    <section className="bg-white">
      <div className="container-site section-pad">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <p className="label-tag mb-2">{t('whyUs.label')}</p>
            <h2 className="heading-lg mb-6">{t('whyUs.heading')}</h2>
            <div className="space-y-3.5">
              {reasons.map((r, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -12 }} whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.07 }}
                  className="flex items-center gap-3">
                  <CheckCircle2 size={16} className="text-olive-600 shrink-0" />
                  <span className="text-base text-sand-700">{r}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="relative rounded-2xl overflow-hidden shadow-lg">
            <img src="/images/milking cow india.jpg" alt="Fresh Milk" className="w-full h-80 object-cover" />
            <div className="absolute inset-0 flex flex-col justify-end p-6"
              style={{ background: 'linear-gradient(to top, rgba(15,25,15,0.92) 0%, transparent 55%)' }}>
              <p className="text-xs font-bold uppercase tracking-widest text-olive-300 mb-2">{t('whyUs.ctaLabel')}</p>
              <p className="text-lg font-black text-white mb-4">{t('whyUs.ctaSub')}</p>
              <div className="flex gap-2 flex-wrap">
                <a href={`https://wa.me/${BRAND.whatsapp}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white"
                  style={{ background: '#25D366' }}>
                  <WhatsAppIcon size={15} /> WhatsApp
                </a>
                <a href={`tel:${BRAND.phone}`}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-white/25 text-white font-semibold text-sm hover:bg-white/10 transition-colors">
                  <Phone size={14} /> {fmt(BRAND.phone)}
                </a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Founders ─────────────────────────────────────────────────────────────────
export function Founders() {
  const { t } = useTranslation();
  return (
    <section style={{ background: '#f5f0e8' }} className="border-y border-sand-200">
      <div className="container-site section-pad">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <p className="label-tag mb-2">{t('founders.label')}</p>
            <h2 className="heading-lg mb-3">{t('founders.heading')}</h2>
            <p className="body-lg mb-8">{t('founders.sub')}</p>
            <div className="space-y-4">
              {[
                { name: 'Babloo Jha',  role: t('founders.role1'), initial: 'BJ', story: t('founders.story1') },
                { name: 'Prabhat Jha', role: t('founders.role2'), initial: 'PJ', story: t('founders.story2') },
              ].map(({ name, role, initial, story }, i) => (
                <motion.div key={name} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.12 }}
                  className="card flex gap-4 items-start">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
                    style={{ background: 'linear-gradient(135deg, #3d5a3e, #2d4428)' }}>
                    {initial}
                  </div>
                  <div>
                    <p className="text-base font-black text-sand-900">{name}</p>
                    <p className="text-xs font-semibold text-olive-600 mb-1.5">{role}</p>
                    <p className="body-sm">{story}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="relative rounded-2xl overflow-hidden shadow-lg">
            <img src="/images/indian cow farm close up.jpg" alt="Our Farm" className="w-full h-64 sm:h-96 object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(15,25,15,0.5) 0%, transparent 60%)' }} />
            <div className="absolute bottom-5 left-5">
              <p className="text-white font-black text-lg">{BRAND.shortName} Farm</p>
              <p className="text-white/60 text-sm">{BRAND.city}, {BRAND.state}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Schemes Preview ──────────────────────────────────────────────────────────
const SCHEMES_PREVIEW = [
  { id: 1, nameKey: 's1name', descKey: 's1desc', end: '31 Aug 2026' },
  { id: 2, nameKey: 's2name', descKey: 's2desc', end: 'Ongoing' },
  { id: 3, nameKey: 's3name', descKey: 's3desc', end: 'Ongoing' },
];

export function SchemesPreview() {
  const { t } = useTranslation();
  return (
    <section className="bg-white border-y border-sand-200">
      <div className="container-site section-pad">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <p className="label-tag mb-2">{t('schemes.label')}</p>
            <h2 className="heading-lg">{t('schemes.heading')}</h2>
          </div>
          <Link to="/schemes" className="text-sm font-semibold text-olive-700 hover:text-olive-800 inline-flex items-center gap-1.5 shrink-0 transition-colors">
            {t('schemes.viewAll')} <ArrowRight size={13} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {SCHEMES_PREVIEW.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.1 }}
              className="card">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl bg-gold-50 border border-gold-200 flex items-center justify-center shrink-0">
                  <Gift size={16} className="text-gold-600" />
                </div>
                <span className="badge-green">{t('schemes.active')}</span>
              </div>
              <h3 className="heading-sm mb-2">{t(`schemes.${s.nameKey}`)}</h3>
              <p className="body-sm mb-3">{t(`schemes.${s.descKey}`)}</p>
              <p className="text-xs text-sand-400">{t('schemes.validTill')}: {s.end}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Gau Seva ₹1 ─────────────────────────────────────────────────────────────
const DEMO_DONORS = ['Ramesh K.', 'Sunita D.', 'Amit S.', 'Priya J.', 'Mohan L.', 'Kavita R.', 'Suresh P.', 'Anita M.', 'Vijay T.', 'Geeta B.'];

export function GauSevaSection() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [donors, setDonors] = useState(DEMO_DONORS);
  const { openDonation, loading, status, setStatus } = useRazorpay();

  function handleDonate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    openDonation({
      name: name.trim(),
      amount: 100,
      onSuccess: ({ name: n }) => { setDonors(prev => [n, ...prev]); setName(''); },
    });
  }
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img src="/images/gaau-seva.jpg" alt="Gau Seva" className="w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'rgba(15,25,15,0.88)' }} />
      </div>
      <div className="container-site section-pad relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#c9a84c' }}>{t('gauSeva.label')}</p>
            <h2 className="text-3xl font-black text-white mb-4">{t('gauSeva.heading')}</h2>
            <p className="text-base mb-6 leading-relaxed" style={{ color: 'rgba(255,255,255,0.7)' }}>{t('gauSeva.sub')}</p>

            <div className="flex items-center gap-4 mb-6 p-4 rounded-2xl" style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)' }}>
              <div className="text-center">
                <p className="text-3xl font-black" style={{ color: '#c9a84c' }}>₹1</p>
                <p className="text-xs text-white/50 mt-0.5">{t('gauSeva.perPurchase')}</p>
              </div>
              <div className="w-px h-10 bg-white/10" />
              <div>
                <p className="text-sm font-bold text-white">99 + 1 = Seva</p>
                <p className="text-xs" style={{ color: 'rgba(255,255,255,0.55)' }}>{t('gauSeva.99plus1')}</p>
              </div>
            </div>

            {status === 'success' ? (
              <div className="text-center py-2">
                <p className="font-bold text-white mb-1">{t('gauSeva.thankYou')}</p>
                <p className="text-sm mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>{t('gauSeva.nameAdded')}</p>
                <button onClick={() => setStatus(null)} className="text-xs underline" style={{ color: 'rgba(255,255,255,0.5)' }}>{t('gauSeva.donateAgain')}</button>
              </div>
            ) : (
              <form onSubmit={handleDonate} className="flex flex-col sm:flex-row gap-2">
                <input
                  value={name} onChange={e => setName(e.target.value)} required
                  placeholder={t('gauSeva.namePlaceholder')}
                  className="flex-1 px-4 py-2.5 rounded-xl text-sm text-sand-800 placeholder-sand-400 focus:outline-none focus:ring-2 focus:ring-gold-400 border-0"
                />
                <button type="submit" disabled={loading}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm disabled:opacity-60 transition-opacity"
                  style={{ background: '#c9a84c', color: '#1c1917' }}>
                  <Heart size={14} />
                  {loading ? t('gauSeva.donating') : t('gauSeva.donateBtn')}
                </button>
              </form>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: 0.15 }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>{t('gauSeva.donorWall')}</p>
            <div className="grid grid-cols-2 gap-2">
              {donors.slice(0, 10).map((name, i) => (
                <motion.div key={name} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }} transition={{ duration: 0.3, delay: i * 0.05 }}
                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0"
                    style={{ background: '#3d5a3e' }}>
                    {name[0]}
                  </div>
                  <span className="text-sm text-white/80 font-medium">{name}</span>
                </motion.div>
              ))}
            </div>
            <p className="text-xs mt-3 italic" style={{ color: 'rgba(255,255,255,0.3)' }}>{t('gauSeva.demoNote')}</p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Delivery Areas ───────────────────────────────────────────────────────────
export function DeliveryAreas() {
  const { t } = useTranslation();
  const areas = t('deliveryAreas.areas', { returnObjects: true });
  return (
    <section style={{ background: '#f5f0e8' }} className="border-y border-sand-200">
      <div className="container-site section-pad">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <p className="label-tag mb-2">{t('deliveryAreas.label')}</p>
            <h2 className="heading-lg mb-3">{t('deliveryAreas.heading')}</h2>
            <p className="body-lg mb-8">{t('deliveryAreas.sub')}</p>
            <div className="flex flex-wrap gap-3 mb-5">
              {areas.map((area, i) => (
                <motion.div key={area} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }} transition={{ duration: 0.3, delay: i * 0.06 }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-full border border-sand-200 shadow-xs">
                  <MapPin size={13} className="text-olive-600" />
                  <span className="text-sm font-medium text-sand-700">{area}</span>
                </motion.div>
              ))}
            </div>
            <p className="text-sm text-sand-400 italic">{t('deliveryAreas.note')}</p>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="rounded-2xl overflow-hidden border border-sand-200 shadow-md">
            <iframe
              title="Jha & Sons Location"
              src={`https://maps.google.com/maps?q=${BRAND.lat},${BRAND.lng}&z=13&output=embed`}
              width="100%" height="320" style={{ border: 0, display: 'block' }}
              allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
const TESTIMONIALS_HI = [
  { name: 'अमित कुमार',   area: 'कलुआही',   text: 'दूध की गुणवत्ता एकदम सही है। डिलीवरी कभी देर से नहीं होती।', rating: 5 },
  { name: 'नेहा देवी',    area: 'मधुबनी', text: 'एक साल से ले रहे हैं — कभी शिकायत नहीं। बिल्कुल भरोसेमंद।', rating: 5 },
  { name: 'राकेश सिंह', area: 'बेंटा',     text: 'बिलिंग बिल्कुल साफ। मात्रा भी एडजस्ट हो जाती है। सिफारिश करूंगा।', rating: 4 },
];

const TESTIMONIALS_EN = [
  { name: 'Amit Kumar',   area: 'Kaluahi',   text: 'Milk quality is consistently good. Delivery is always on time.', rating: 5 },
  { name: 'Neha Devi',    area: 'Madhubani', text: 'Been getting milk for a year — never a complaint. Very reliable.', rating: 5 },
  { name: 'Rakesh Singh', area: 'Benta',     text: 'Transparent billing and flexible quantity. Highly recommended.', rating: 4 },
];

export function Testimonials() {
  const { t, i18n } = useTranslation();
  const list = i18n.language === 'hi' ? TESTIMONIALS_HI : TESTIMONIALS_EN;
  return (
    <section className="bg-white border-t border-sand-200">
      <div className="container-site section-pad">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <p className="label-tag mb-2">{t('testimonials.label')}</p>
          <h2 className="heading-lg mb-1">{t('testimonials.heading')}</h2>
          <p className="text-xs text-sand-400 italic mb-8">{t('testimonials.demo')}</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {list.map(({ name, area, text, rating }, i) => (
            <motion.div key={name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.1 }}
              className="card">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} size={13} className={j < rating ? 'text-gold-600 fill-gold-600' : 'text-sand-200'} />
                ))}
              </div>
              <p className="body-md mb-4">"{text}"</p>
              <div className="flex items-center gap-2 pt-3 border-t border-sand-100">
                <div className="w-8 h-8 rounded-full bg-olive-100 flex items-center justify-center text-xs font-black text-olive-700">
                  {name[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-sand-800">{name}</p>
                  <p className="text-xs text-sand-400 flex items-center gap-1"><MapPin size={9} /> {area}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────
export function FAQ() {
  const { t } = useTranslation();
  const faqs = t('faq.items', { returnObjects: true });
  const [open, setOpen] = useState(null);
  return (
    <section style={{ background: '#f5f0e8' }} className="border-t border-sand-200">
      <div className="container-site section-pad">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
            <p className="label-tag mb-2">{t('faq.label')}</p>
            <h2 className="heading-lg mb-4">{t('faq.heading')}</h2>
            <p className="body-lg mb-6">{t('faq.askUs')}</p>
            <a href={`https://wa.me/${BRAND.whatsapp}?text=Mujhe kuch poochna tha`}
              target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
              <WhatsAppIcon size={15} /> {t('faq.askWhatsapp')}
            </a>
          </motion.div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ duration: 0.35, delay: i * 0.07 }}
                className="bg-white border border-sand-200 rounded-xl overflow-hidden">
                <button onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left">
                  <span className="text-sm font-semibold text-sand-800">{faq.q}</span>
                  <ChevronDown size={16} className={`text-sand-400 shrink-0 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`} />
                </button>
                {open === i && (
                  <div className="px-5 pb-4 text-sm text-sand-600 leading-relaxed border-t border-sand-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Contact CTA ──────────────────────────────────────────────────────────────
export function ContactCTA() {
  const { t } = useTranslation();
  return (
    <section style={{ background: '#2d4428' }}>
      <div className="container-site section-pad text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
          <p className="label-tag text-olive-300 mb-2">{t('cta.label')}</p>
          <h2 className="heading-lg text-white mb-3">{t('cta.heading')}</h2>
          <p className="text-base text-olive-300 mb-8 max-w-md mx-auto">{t('cta.sub')}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href={`https://wa.me/${BRAND.whatsapp}`} target="_blank" rel="noopener noreferrer"
              className="btn-whatsapp-lg">
              <WhatsAppIcon size={17} /> {t('cta.whatsapp')}
            </a>
            <a href={`tel:${BRAND.phone}`}
              className="inline-flex items-center gap-2 text-base px-7 py-3.5 rounded-xl border font-semibold transition-colors hover:bg-white/10"
              style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}>
              <Phone size={16} /> {fmt(BRAND.phone)}
            </a>
            <Link to="/enquiry"
              className="inline-flex items-center gap-2 text-base px-7 py-3.5 rounded-xl border font-semibold transition-colors hover:bg-white/10"
              style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.65)' }}>
              {t('cta.enquiry')}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
