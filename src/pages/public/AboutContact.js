import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Phone, MapPin, ArrowRight, Heart, Calendar, Gift } from 'lucide-react';
import BRAND from '../../utils/config';
import useRazorpay from '../../hooks/useRazorpay';

function WhatsAppIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

const fmt = (p) => `+91 ${p.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}`;

function PageHeader({ label, title, sub }) {
  return (
    <div className="bg-white border-b border-sand-200">
      <div className="container-site py-10">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <p className="label-tag mb-2">{label}</p>
          <h1 className="heading-lg mb-2">{title}</h1>
          {sub && <p className="body-lg max-w-xl">{sub}</p>}
        </motion.div>
      </div>
    </div>
  );
}

// ─── Schemes ──────────────────────────────────────────────────────────────────
const SCHEMES = [
  {
    id: 1, icon: '🎁', color: '#c9a84c', bg: '#fef9ec', border: '#fde68a',
    nameKey: 's1name', conditionKey: 's1condition', rewardKey: 's1reward', eligibilityKey: 's1eligibility',
    progress: 27, target: 30, end: '31 Aug 2026',
  },
  {
    id: 2, icon: '👋', color: '#3d5a3e', bg: '#f0f7f0', border: '#bbf7d0',
    nameKey: 's2name', conditionKey: 's2condition', rewardKey: 's2reward', eligibilityKey: 's2eligibility',
    progress: null, target: null, end: 'Ongoing',
  },
  {
    id: 3, icon: '🤝', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe',
    nameKey: 's3name', conditionKey: 's3condition', rewardKey: 's3reward', eligibilityKey: 's3eligibility',
    progress: null, target: null, end: 'Ongoing',
  },
];

export function SchemesPage() {
  const { t } = useTranslation();
  return (
    <>
      {/* Hero */}
      <div className="relative overflow-hidden" style={{ minHeight: '260px', display: 'flex', alignItems: 'flex-end' }}>
        <img src="/images/delivery.jpg" alt="Schemes"
          className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(15,25,15,0.92) 0%, rgba(15,25,15,0.4) 60%, transparent 100%)' }} />
        <div className="container-site relative z-10 pb-10 pt-20">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="label-tag text-olive-300 mb-2">{t('schemes.label')}</p>
            <h1 className="heading-lg text-white mb-2">{t('schemes.heading')}</h1>
            <p className="body-lg max-w-xl" style={{ color: 'rgba(255,255,255,0.65)' }}>{t('schemes.sub')}</p>
          </motion.div>
        </div>
      </div>

      <div className="container-site section-pad">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-12">
          {[
            { val: '3',    label: t('schemes.statsSchemes')   },
            { val: '150+', label: t('schemes.statsCustomers') },
            { val: '₹0',   label: t('schemes.statsCharges')   },
          ].map(({ val, label }) => (
            <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className="card text-center py-5">
              <p className="text-2xl sm:text-3xl font-black text-olive-700 mb-1">{val}</p>
              <p className="text-xs text-sand-400 font-medium">{label}</p>
            </motion.div>
          ))}
        </div>

        {/* Scheme Cards */}
        <div className="space-y-6 mb-12">
          {SCHEMES.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="card overflow-hidden p-0">

              {/* Card Header */}
              <div className="flex items-center gap-4 p-6 pb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                  style={{ background: s.bg, border: `1.5px solid ${s.border}` }}>
                  {s.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="heading-sm">{t(`schemes.${s.nameKey}`)}</h3>
                    <span className="badge-green">{t('schemes.active')}</span>
                  </div>
                  <p className="text-xs text-sand-400 mt-0.5">{t(`schemes.${s.eligibilityKey}`)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-sand-400">{t('schemes.validTill')}</p>
                  <p className="text-xs font-semibold text-sand-600">{s.end}</p>
                </div>
              </div>

              {/* Divider */}
              <div className="mx-6 border-t border-sand-100" />

              {/* Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6">
                <div className="rounded-xl p-4 border border-sand-200" style={{ background: '#fafaf7' }}>
                  <p className="text-2xs font-bold uppercase tracking-widest text-sand-400 mb-2">📋 {t('schemes.condition')}</p>
                  <p className="text-sm text-sand-700">{t(`schemes.${s.conditionKey}`)}</p>
                </div>
                <div className="rounded-xl p-4 border" style={{ background: s.bg, borderColor: s.border }}>
                  <p className="text-2xs font-bold uppercase tracking-widest mb-2" style={{ color: s.color }}>
                    <Gift size={9} className="inline mr-1" />{t('schemes.reward')}
                  </p>
                  <p className="text-sm font-bold" style={{ color: s.color }}>{t(`schemes.${s.rewardKey}`)}</p>
                </div>
              </div>

              {/* Progress bar for scheme 1 */}
              {s.progress !== null && (
                <div className="px-6 pb-6">
                  <div className="flex justify-between text-xs text-sand-400 mb-2">
                    <span>{t('schemes.progressDemo')}</span>
                    <span>{s.progress}L / {s.target}L</span>
                  </div>
                  <div className="bg-sand-100 rounded-full h-2.5 overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(s.progress / s.target) * 100}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full rounded-full" style={{ background: s.color }} />
                  </div>
                  <p className="text-xs text-sand-400 mt-1.5">{s.target - s.progress}L {t('schemes.progressMore')}</p>
                </div>
              )}

              {/* Action */}
              <div className="px-6 pb-6">
                <Link to="/enquiry" className="btn-primary text-sm">
                  {t('products.enquire')} <ArrowRight size={13} />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <div className="bg-olive-50 border border-olive-200 rounded-2xl p-6 sm:p-8 text-center">
          <p className="heading-sm mb-2">{t('schemes.ctaTitle')}</p>
          <p className="body-md mb-5">{t('schemes.ctaSub')}</p>
          <a href={`https://wa.me/${BRAND.whatsapp}?text=Hi, current schemes ke baare mein jaanna chahta hoon`}
            target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
            <WhatsAppIcon /> {t('schemes.ctaBtn')}
          </a>
        </div>
      </div>
    </>
  );
}

// ─── Gau Seva ─────────────────────────────────────────────────────────────────
const DEMO_DONORS = [
  'Ramesh K.', 'Sunita D.', 'Amit S.', 'Priya J.', 'Mohan L.',
  'Kavita R.', 'Suresh P.', 'Anita M.', 'Vijay T.', 'Geeta B.',
];

function DonateSection() {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [donors, setDonors] = useState(DEMO_DONORS);
  const { openDonation, loading, status, setStatus } = useRazorpay();

  function handleDonate(e) {
    e.preventDefault();
    if (!name.trim()) return;
    openDonation({
      name: name.trim(), amount: 100,
      onSuccess: ({ name: n }) => { setDonors(prev => [n, ...prev]); setName(''); },
    });
  }

  return (
    <div className="card">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-olive-100 flex items-center justify-center">
          <Heart size={18} className="text-olive-600" />
        </div>
        <div>
          <h2 className="heading-sm mb-0">{t('gauSeva.donateTitle')}</h2>
          <p className="text-xs text-sand-400">{t('gauSeva.donateSub')}</p>
        </div>
      </div>

      {/* 99+1 */}
      <div className="rounded-xl p-4 mb-4 flex items-center gap-4" style={{ background: 'linear-gradient(135deg, #fef9ec, #fef3c7)', border: '1.5px solid #fde68a' }}>
        <div className="text-center shrink-0">
          <p className="text-3xl font-black" style={{ color: '#c9a84c' }}>₹1</p>
          <p className="text-xs text-sand-500">{t('gauSeva.perPurchase')}</p>
        </div>
        <div className="w-px h-10 bg-sand-200" />
        <div>
          <p className="text-sm font-bold text-sand-800">99 + 1 = Seva</p>
          <p className="text-xs text-sand-500">{t('gauSeva.99plus1')}</p>
        </div>
      </div>

      {/* Test hint */}
      <div className="rounded-xl p-3 mb-4 flex items-start gap-2" style={{ background: '#eff6ff', border: '1px solid #bfdbfe' }}>
        <span className="text-blue-500 shrink-0">ℹ️</span>
        <div>
          <p className="text-xs font-bold text-blue-700 mb-0.5">Test Mode — Demo Card Details</p>
          <p className="text-xs text-blue-600">Card: <span className="font-mono font-bold">4111 1111 1111 1111</span></p>
          <p className="text-xs text-blue-600">Expiry: <span className="font-mono font-bold">any future date</span> · CVV: <span className="font-mono font-bold">any 3 digits</span></p>
          <p className="text-xs text-blue-500 mt-0.5">OTP: <span className="font-mono font-bold">1234 56</span> (if asked)</p>
        </div>
      </div>

      {status === 'success' ? (
        <div className="text-center py-6">
          <div className="w-14 h-14 rounded-full bg-olive-100 flex items-center justify-center mx-auto mb-3"><span className="text-2xl">🙏</span></div>
          <p className="font-black text-sand-900 text-lg mb-1">{t('gauSeva.thankYou')}</p>
          <p className="text-sm text-sand-500 mb-5">{t('gauSeva.nameAdded')}</p>
          <button onClick={() => setStatus(null)} className="btn-ghost border border-sand-200 text-sm">{t('gauSeva.donateAgain')}</button>
        </div>
      ) : status === 'failed' ? (
        <div className="text-center py-4">
          <p className="text-sm text-red-500 mb-3">Payment fail ho gayi. Dobara try karein.</p>
          <button onClick={() => setStatus(null)} className="btn-outline text-sm">Try Again</button>
        </div>
      ) : (
        <form onSubmit={handleDonate} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-sand-600 mb-1 block">{t('gauSeva.nameLabel')} *</label>
            <input value={name} onChange={e => setName(e.target.value)} required
              placeholder={t('gauSeva.namePlaceholder')}
              className="w-full px-4 py-2.5 rounded-xl border border-sand-200 bg-white text-sm text-sand-800 placeholder-sand-400 focus:outline-none focus:border-olive-400 focus:ring-1 focus:ring-olive-200 transition" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 disabled:opacity-60">
            <Heart size={15} />
            {loading ? t('gauSeva.donating') : t('gauSeva.donateBtn')}
          </button>
          <p className="text-xs text-sand-400 text-center">Secured by Razorpay · Test Mode</p>
        </form>
      )}

      <div className="mt-6 pt-5 border-t border-sand-100">
        <p className="text-xs font-bold uppercase tracking-widest text-sand-400 mb-3">{t('gauSeva.donorWall')}</p>
        <div className="flex flex-wrap gap-2">
          {donors.slice(0, 12).map((d, i) => (
            <motion.span key={i} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-olive-50 border border-olive-100 text-xs font-medium text-olive-700">
              <Heart size={10} className="text-olive-500" /> {d}
            </motion.span>
          ))}
        </div>
        <p className="text-xs text-sand-400 italic mt-3">{t('gauSeva.demoNote')}</p>
      </div>
    </div>
  );
}

export function GauSevaPage() {
  const { t } = useTranslation();
  return (
    <>
      <div className="relative h-72 sm:h-96 overflow-hidden">
        <img src="/images/gaau-seva.jpg" alt="Gau Seva" className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex flex-col justify-end p-8"
          style={{ background: 'linear-gradient(to top, rgba(15,25,15,0.92) 0%, rgba(15,25,15,0.3) 60%, transparent 100%)' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#c9a84c' }}>{t('gauSeva.label')}</p>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">{t('gauSeva.heading')}</h1>
            <p className="text-base max-w-lg" style={{ color: 'rgba(255,255,255,0.7)' }}>{t('gauSeva.sub')}</p>
          </motion.div>
        </div>
      </div>

      <div className="container-site section-pad">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Commitment */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="card">
            <h2 className="heading-sm mb-5">{t('gauSeva.commitTitle')}</h2>
            <div className="space-y-4">
              {[
                { icon: '🌾', text: t('gauSeva.commit1') },
                { icon: '❤️', text: t('gauSeva.commit2') },
                { icon: '💰', text: t('gauSeva.commit3') },
                { icon: '📋', text: t('gauSeva.commit4') },
              ].map(({ icon, text }, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <span className="text-lg shrink-0">{icon}</span>
                  <p className="body-md">{text}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-5 border-t border-sand-100">
              <p className="text-xs font-bold uppercase tracking-widest text-sand-400 mb-4">{t('gauSeva.recentActivity')}</p>
              <div className="space-y-3">
                {[
                  { date: 'Aug 2026', type: t('gauSeva.act1type'), desc: t('gauSeva.act1desc') },
                  { date: 'Jul 2026', type: t('gauSeva.act2type'), desc: t('gauSeva.act2desc') },
                  { date: 'Jun 2026', type: t('gauSeva.act3type'), desc: t('gauSeva.act3desc') },
                ].map((a, i) => (
                  <div key={i} className="flex gap-3 p-3 bg-sand-50 rounded-xl border border-sand-200">
                    <p className="text-xs font-semibold text-sand-400 w-16 shrink-0">{a.date}</p>
                    <div>
                      <p className="text-sm font-semibold text-sand-800">{a.type}</p>
                      <p className="text-xs text-sand-500 mt-0.5">{a.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-sand-400 italic mt-3">{t('gauSeva.activityNote')}</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
            <DonateSection />
          </motion.div>
        </div>
      </div>
    </>
  );
}

// ─── About ────────────────────────────────────────────────────────────────────
const FOUNDERS = [
  { name: 'Babloo Jha', initial: 'BJ', roleKey: 'role1', storyKey: 'story1', emoji: '🌾' },
  { name: 'Prabhat Jha', initial: 'PJ', roleKey: 'role2', storyKey: 'story2', emoji: '🚴' },
];

const VALUES = [
  { icon: '📋', key: 'val1' },
  { icon: '🚚', key: 'val2' },
  { icon: '🐄', key: 'val3' },
  { icon: '🤝', key: 'val4' },
  { icon: '🙏', key: 'val5' },
];

const STORY_STEPS = [
  { year: '2018', icon: '🌱', key: 'story1' },
  { year: '2020', icon: '🐄', key: 'story2' },
  { year: '2022', icon: '🚚', key: 'story3' },
  { year: '2024', icon: '🏆', key: 'story4' },
];

export function AboutPage() {
  const { t } = useTranslation();
  return (
    <>
      {/* Hero */}
      <div className="relative h-72 sm:h-96 overflow-hidden">
        <img src="/images/farm.jpg" alt="About" className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex flex-col justify-end p-8"
          style={{ background: 'linear-gradient(to top, rgba(15,25,15,0.92) 0%, rgba(15,25,15,0.3) 60%, transparent 100%)' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#c9a84c' }}>{t('about.label')}</p>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">{t('about.heading')}</h1>
            <p className="text-base max-w-lg" style={{ color: 'rgba(255,255,255,0.7)' }}>{t('about.sub')}</p>
          </motion.div>
        </div>
      </div>

      <div className="container-site section-pad">

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
          {[
            { val: '150+', key: 'statFamilies' },
            { val: BRAND.foundingYear, key: 'statSince' },
            { val: '5+', key: 'statProducts' },
            { val: '4', key: 'statAnimals' },
          ].map(({ val, key }, i) => (
            <motion.div key={key} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }} className="card text-center py-5">
              <p className="text-2xl sm:text-3xl font-black text-olive-700 mb-1">{val}</p>
              <p className="text-xs text-sand-400 font-medium">{t(`about.${key}`)}</p>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 space-y-6">

            {/* Who we are */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="card">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-9 h-9 rounded-xl bg-olive-100 flex items-center justify-center text-lg">🏡</div>
                <h2 className="heading-sm mb-0">{t('about.whoTitle')}</h2>
              </div>
              <p className="body-md">{t('about.whoDesc')}</p>
            </motion.div>

            {/* Founders */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }} className="card">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-gold-50 flex items-center justify-center text-lg">👨‍👨‍👦</div>
                <h2 className="heading-sm mb-0">{t('founders.heading')}</h2>
              </div>
              <div className="space-y-4">
                {FOUNDERS.map(({ name, initial, roleKey, storyKey, emoji }, i) => (
                  <motion.div key={name} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="flex gap-4 items-start p-4 rounded-2xl border border-sand-200"
                    style={{ background: '#fafaf7' }}>
                    <div className="w-14 h-14 rounded-2xl flex flex-col items-center justify-center shrink-0 gap-0.5"
                      style={{ background: 'linear-gradient(135deg, #3d5a3e, #2d4428)' }}>
                      <span className="text-lg">{emoji}</span>
                      <span className="text-2xs font-black text-white tracking-wide">{initial}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-base font-black text-sand-900">{name}</p>
                      <p className="text-xs font-semibold text-olive-600 mb-2">{t(`founders.${roleKey}`)}</p>
                      <p className="text-sm text-sand-600 leading-relaxed">{t(`founders.${storyKey}`)}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Values */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="card">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-9 h-9 rounded-xl bg-olive-100 flex items-center justify-center text-lg">💎</div>
                <h2 className="heading-sm mb-0">{t('about.valuesTitle')}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {VALUES.map(({ icon, key }, i) => (
                  <motion.div key={key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.06 }}
                    className="flex items-center gap-3 p-3 rounded-xl border border-sand-200"
                    style={{ background: '#fafaf7' }}>
                    <span className="text-xl shrink-0">{icon}</span>
                    <p className="text-sm text-sand-700 font-medium">{t(`about.${key}`)}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Farm image */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15 }}>
              <img src="/images/dairy farm india morning.jpg" alt="Farm" className="w-full h-44 object-cover rounded-2xl" />
            </motion.div>

            {/* Quick Facts */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.2 }} className="card">
              <p className="text-xs font-bold uppercase tracking-widest text-sand-400 mb-4">{t('about.quickFacts')}</p>
              <div className="space-y-3">
                {[
                  { labelKey: 'factLocation', val: `${BRAND.city}, ${BRAND.state}` },
                  { labelKey: 'factProducts', val: t('about.factProductsVal') },
                  { labelKey: 'factAnimals', val: t('about.factAnimalsVal') },
                  { labelKey: 'factCustomers', val: '150+ families' },
                  { labelKey: 'factSince', val: BRAND.foundingYear },
                ].map(({ labelKey, val }) => (
                  <div key={labelKey} className="flex justify-between items-start gap-2">
                    <p className="text-xs text-sand-400 uppercase font-semibold tracking-wide shrink-0">{t(`about.${labelKey}`)}</p>
                    <p className="text-xs text-sand-700 font-semibold text-right">{val}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Our Story Timeline */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25 }} className="card">
              <p className="text-xs font-bold uppercase tracking-widest text-sand-400 mb-4">{t('about.ourJourney')}</p>
              <div className="space-y-4">
                {STORY_STEPS.map(({ year, icon, key }, i) => (
                  <div key={year} className="flex gap-3 items-start">
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm"
                        style={{ background: '#f0f7f0', border: '1.5px solid #bbf7d0' }}>{icon}</div>
                      {i < STORY_STEPS.length - 1 && <div className="w-px h-4 bg-sand-200 mt-1" />}
                    </div>
                    <div className="pt-1">
                      <p className="text-xs font-black text-olive-700">{year}</p>
                      <p className="text-xs text-sand-600 mt-0.5">{t(`about.journey${key.replace('story', '')}`)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* CTA */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.3 }}
          className="bg-olive-50 border border-olive-200 rounded-2xl p-6 sm:p-8 text-center">
          <p className="heading-sm mb-2">{t('about.ctaTitle')}</p>
          <p className="body-md mb-5">{t('about.ctaSub')}</p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/contact" className="btn-primary">{t('about.ctaContact')} <ArrowRight size={13} /></Link>
            <a href={`https://wa.me/${BRAND.whatsapp}?text=Hi, ${BRAND.shortName} ke baare mein jaanna chahta hoon`}
              target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
              <WhatsAppIcon /> {t('about.ctaWhatsapp')}
            </a>
          </div>
        </motion.div>
      </div>
    </>
  );
}

// ─── Contact ──────────────────────────────────────────────────────────────────
function ContactForm() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', phone: '', area: '', milk: '', qty: '', msg: '' });
  const [submitted, setSubmitted] = useState(false);

  function handleChange(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }
  function handleSubmit(e) { e.preventDefault(); setSubmitted(true); }

  const inputCls = 'w-full px-4 py-2.5 rounded-xl border border-sand-200 bg-white text-sm text-sand-800 placeholder-sand-400 focus:outline-none focus:border-olive-400 focus:ring-1 focus:ring-olive-200 transition';

  if (submitted) return (
    <div className="card text-center py-10">
      <div className="w-14 h-14 rounded-full bg-olive-100 flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl">✅</span>
      </div>
      <h3 className="heading-sm mb-2">{t('contact.successTitle')}</h3>
      <p className="body-sm text-sand-500 mb-1">{t('contact.successSub')}</p>
      <p className="text-xs text-sand-400 italic mb-5">{t('contact.demoNote')}</p>
      <button onClick={() => { setSubmitted(false); setForm({ name: '', phone: '', area: '', milk: '', qty: '', msg: '' }); }}
        className="btn-ghost border border-sand-200 text-sm">{t('contact.submitAnother')}</button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-9 h-9 rounded-xl bg-olive-100 flex items-center justify-center text-lg">📋</div>
        <div>
          <h2 className="heading-sm mb-0">{t('contact.formTitle')}</h2>
          <p className="text-xs text-sand-400">{t('contact.formSub')}</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-sand-600 mb-1 block">{t('contact.nameLabel')} *</label>
          <input name="name" required value={form.name} onChange={handleChange} placeholder={t('contact.namePlaceholder')} className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-semibold text-sand-600 mb-1 block">{t('contact.phoneLabel')} *</label>
          <input name="phone" required value={form.phone} onChange={handleChange} placeholder={t('contact.phonePlaceholder')} className={inputCls} />
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-sand-600 mb-1 block">{t('contact.areaLabel')} *</label>
        <input name="area" required value={form.area} onChange={handleChange} placeholder={t('contact.areaPlaceholder')} className={inputCls} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-sand-600 mb-1 block">{t('contact.milkLabel')} *</label>
          <select name="milk" required value={form.milk} onChange={handleChange} className={inputCls}>
            <option value="">{t('contact.selectPlaceholder')}</option>
            <option value="cow">{t('contact.milkCow')}</option>
            <option value="buffalo">{t('contact.milkBuffalo')}</option>
            <option value="both">{t('contact.milkBoth')}</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-sand-600 mb-1 block">{t('contact.qtyLabel')} *</label>
          <select name="qty" required value={form.qty} onChange={handleChange} className={inputCls}>
            <option value="">{t('contact.selectPlaceholder')}</option>
            <option>0.5</option><option>1</option><option>1.5</option><option>2</option><option>3+</option>
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs font-semibold text-sand-600 mb-1 block">{t('contact.msgLabel')}</label>
        <textarea name="msg" value={form.msg} onChange={handleChange} rows={3}
          placeholder={t('contact.msgPlaceholder')} className={inputCls} />
      </div>
      <button type="submit" className="btn-primary w-full justify-center py-3">{t('contact.submitBtn')}</button>
      <p className="text-xs text-sand-400 text-center">{t('contact.demoNote')}</p>
    </form>
  );
}

export function ContactPage() {
  const { t } = useTranslation();
  return (
    <>
      {/* Hero */}
      <div className="relative h-64 sm:h-80 overflow-hidden">
        <img src="/images/delivery.jpg" alt="Contact" className="w-full h-full object-cover" />
        <div className="absolute inset-0 flex flex-col justify-end p-8"
          style={{ background: 'linear-gradient(to top, rgba(15,25,15,0.92) 0%, rgba(15,25,15,0.3) 60%, transparent 100%)' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#c9a84c' }}>{t('contact.label')}</p>
            <h1 className="text-3xl sm:text-4xl font-black text-white mb-2">{t('contact.heading')}</h1>
            <p className="text-base max-w-lg" style={{ color: 'rgba(255,255,255,0.7)' }}>{t('contact.sub')}</p>
          </motion.div>
        </div>
      </div>

      <div className="container-site section-pad">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* Left — contact info */}
          <div className="space-y-4">
            {/* WhatsApp */}
            <motion.a initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              href={`https://wa.me/${BRAND.whatsapp}?text=${t('contact.waText')}`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-4 p-5 bg-white border border-sand-200 rounded-2xl hover:border-green-300 hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white" style={{ background: '#25D366' }}>
                <WhatsAppIcon size={22} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-sand-900">WhatsApp</p>
                <p className="text-sm text-sand-500">{t('contact.waSub')}</p>
              </div>
              <ArrowRight size={16} className="text-sand-300 group-hover:text-olive-600 transition-colors" />
            </motion.a>

            {/* Call */}
            <motion.a initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              href={`tel:${BRAND.phone}`}
              className="flex items-center gap-4 p-5 bg-white border border-sand-200 rounded-2xl hover:border-olive-300 hover:shadow-md transition-all group">
              <div className="w-12 h-12 rounded-xl bg-olive-50 border border-olive-100 flex items-center justify-center shrink-0">
                <Phone size={20} className="text-olive-700" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-sand-900">{t('contact.callTitle')}</p>
                <p className="text-sm text-sand-500">{fmt(BRAND.phone)}</p>
              </div>
              <ArrowRight size={16} className="text-sand-300 group-hover:text-olive-600 transition-colors" />
            </motion.a>

            {/* Address */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="flex items-start gap-4 p-5 bg-white border border-sand-200 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-sand-100 flex items-center justify-center shrink-0">
                <MapPin size={20} className="text-sand-500" />
              </div>
              <div>
                <p className="text-sm font-bold text-sand-900">{t('contact.addressTitle')}</p>
                <p className="text-sm text-sand-500 leading-relaxed mt-0.5">{BRAND.address}</p>
              </div>
            </motion.div>

            {/* Hours */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="flex items-start gap-4 p-5 bg-white border border-sand-200 rounded-2xl">
              <div className="w-12 h-12 rounded-xl bg-gold-50 border border-gold-100 flex items-center justify-center shrink-0 text-xl">🕕</div>
              <div>
                <p className="text-sm font-bold text-sand-900">{t('contact.hoursTitle')}</p>
                <p className="text-sm text-sand-500 mt-0.5">{t('contact.hoursSub')}</p>
              </div>
            </motion.div>

            {/* Map */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="rounded-2xl overflow-hidden border border-sand-200">
              <iframe
                title="Jha & Sons Location"
                src={`https://maps.google.com/maps?q=${BRAND.lat},${BRAND.lng}&z=15&output=embed`}
                width="100%" height="220" style={{ border: 0, display: 'block' }}
                allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
              />
            </motion.div>
          </div>

          {/* Right — form */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
            <ContactForm />
          </motion.div>
        </div>
      </div>
    </>
  );
}
