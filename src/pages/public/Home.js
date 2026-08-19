import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, MapPin, Phone, ArrowRight, Star } from 'lucide-react';
import BRAND from '../../utils/config';

// Official WhatsApp SVG
function WhatsAppIcon({ size = 16, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

const SCHEMES_PREVIEW = [
  { id: 1, name: 'Monthly Loyalty Bonus',  desc: 'Complete 30 litres during the offer period and receive 1 litre complimentary.', end: '31 Aug 2026' },
  { id: 2, name: 'New Customer Welcome',   desc: 'First 7 days of delivery at a special introductory rate.', end: 'Ongoing' },
];

const TESTIMONIALS = [
  { name: 'Amit Kumar',   area: 'Kaluahi',   text: 'Milk quality is consistently good. Delivery is always on time.', rating: 5 },
  { name: 'Neha Devi',    area: 'Madhubani', text: 'Very reliable. We have been getting milk from Jha & Sons for over a year.', rating: 5 },
  { name: 'Rakesh Singh', area: 'Benta',     text: 'Transparent billing and flexible quantity. Highly recommended.', rating: 4 },
];

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative overflow-hidden" style={{ background: 'linear-gradient(160deg, #f5f0e8 0%, #fafaf7 50%, #f2f7f2 100%)' }}>
      {/* Subtle decorative circle */}
      <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full opacity-[0.06]"
        style={{ background: 'radial-gradient(circle, #3d5a3e, transparent)' }} />

      <div className="container-site section-pad">
        <div className="max-w-2xl">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: 'easeOut' }}>

            {/* Location pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-olive-100 border border-olive-200 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-olive-500" />
              <span className="text-xs font-semibold text-olive-700">{BRAND.city}, {BRAND.state}</span>
            </div>

            <h1 className="heading-xl mb-5">
              Fresh Milk.<br />
              <span className="text-olive-700">Trusted Daily.</span>
            </h1>

            <p className="body-lg mb-8 max-w-lg">
              Fresh cow and buffalo milk supplied directly to local families in Madhubani.
              Reliable doorstep delivery, transparent billing.
            </p>

            <div className="flex flex-wrap gap-3">
              <a href={`https://wa.me/${BRAND.whatsapp}?text=Hi, I want to start milk delivery`}
                target="_blank" rel="noopener noreferrer"
                className="btn-primary-lg">
                Start Milk Delivery <ArrowRight size={16} />
              </a>
              <a href={`https://wa.me/${BRAND.whatsapp}`}
                target="_blank" rel="noopener noreferrer"
                className="btn-whatsapp-lg">
                <WhatsAppIcon size={17} /> WhatsApp
              </a>
            </div>

            {/* Phone */}
            <a href={`tel:${BRAND.phone}`}
              className="inline-flex items-center gap-2 mt-5 text-sm text-sand-500 hover:text-sand-800 transition-colors">
              <Phone size={13} />
              +91 {BRAND.phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}
            </a>

          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ─── Trust bar ────────────────────────────────────────────────────────────────
function TrustBar() {
  return (
    <div className="bg-white border-y border-sand-200">
      <div className="container-site py-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-sand-200">
          {BRAND.trustStats.map(({ value, label }, i) => (
            <div key={label} className="text-center px-4 py-2">
              <p className="text-2xl font-black text-olive-700 leading-none">{value}</p>
              <p className="text-xs text-sand-500 mt-1 font-medium">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Milk offerings ───────────────────────────────────────────────────────────
function MilkOfferings() {
  return (
    <section className="container-site section-pad">
      <p className="label-tag mb-2">Our Products</p>
      <h2 className="heading-lg mb-2">Fresh Milk, Every Morning</h2>
      <p className="body-lg mb-10 max-w-lg">Collected fresh from our farm and delivered directly to your home.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {[
          { type: 'Cow Milk',     emoji: '🐄', desc: 'Fresh cow milk collected daily. Lighter, naturally sweet — perfect for daily drinking, tea, and cooking.' },
          { type: 'Buffalo Milk', emoji: '🐃', desc: 'Rich, creamy buffalo milk. Higher fat content — ideal for sweets, curd, and paneer.' },
        ].map(({ type, emoji, desc }) => (
          <div key={type} className="card group cursor-default">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-xl bg-olive-50 border border-olive-100 flex items-center justify-center text-2xl shrink-0">
                {emoji}
              </div>
              <div>
                <h3 className="heading-sm">{type}</h3>
                <span className="badge-green mt-1">Daily Supply</span>
              </div>
            </div>
            <p className="body-md mb-5">{desc}</p>
            <a href={`https://wa.me/${BRAND.whatsapp}?text=I want to enquire about ${type}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-olive-700 hover:text-olive-800 transition-colors group-hover:gap-2.5">
              Enquire <ArrowRight size={13} />
            </a>
          </div>
        ))}
      </div>

      <div className="mt-5 text-center">
        <Link to="/milk" className="btn-ghost border border-sand-200">
          View all products <ArrowRight size={13} />
        </Link>
      </div>
    </section>
  );
}

// ─── How it works ─────────────────────────────────────────────────────────────
function HowItWorks() {
  const steps = [
    { n: '01', title: 'Choose Your Milk',   desc: 'Select cow milk, buffalo milk, or both based on your daily need.' },
    { n: '02', title: 'Set Daily Quantity', desc: 'Tell us how much you need each day. Adjust anytime.' },
    { n: '03', title: 'Doorstep Delivery',  desc: 'Fresh milk delivered to your door every morning.' },
  ];
  return (
    <section style={{ background: '#2d4428' }}>
      <div className="container-site section-pad">
        <p className="label-tag text-olive-300 mb-2">Simple Process</p>
        <h2 className="heading-lg text-white mb-10">How It Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {steps.map(({ n, title, desc }) => (
            <div key={n} className="flex gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
                style={{ background: '#c9a84c' }}>
                {n}
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-1.5">{title}</h3>
                <p className="text-sm text-olive-300 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Why us ───────────────────────────────────────────────────────────────────
function WhyUs() {
  const reasons = [
    'Consistent daily delivery',
    'Direct local farm supply',
    'Flexible quantity adjustments',
    'Transparent monthly billing',
    'Responsive customer support',
    'Cow & buffalo milk options',
  ];
  return (
    <section className="container-site section-pad">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <p className="label-tag mb-2">Why Customers Choose Us</p>
          <h2 className="heading-lg mb-6">Reliable. Local. Transparent.</h2>
          <div className="space-y-3">
            {reasons.map(r => (
              <div key={r} className="flex items-center gap-3">
                <CheckCircle2 size={16} className="text-olive-600 shrink-0" />
                <span className="text-base text-sand-700">{r}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA card */}
        <div className="rounded-2xl p-8 text-white" style={{ background: 'linear-gradient(135deg, #3d5a3e 0%, #2d4428 100%)' }}>
          <p className="text-xs font-bold uppercase tracking-widest text-olive-300 mb-3">Get Started Today</p>
          <p className="text-xl font-black leading-snug mb-6">
            Fresh milk at your door every morning.
          </p>
          <div className="space-y-3">
            <a href={`https://wa.me/${BRAND.whatsapp}?text=Hi, I want to start milk delivery`}
              target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-sm transition-colors"
              style={{ background: '#25D366', color: 'white' }}
              onMouseEnter={e => e.currentTarget.style.background = '#20b858'}
              onMouseLeave={e => e.currentTarget.style.background = '#25D366'}>
              <WhatsAppIcon size={16} /> Start on WhatsApp
            </a>
            <a href={`tel:${BRAND.phone}`}
              className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-white/25 text-white font-semibold text-sm hover:bg-white/10 transition-colors">
              <Phone size={15} /> +91 {BRAND.phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Schemes preview ──────────────────────────────────────────────────────────
function SchemesPreview() {
  return (
    <section style={{ background: '#f5f0e8' }} className="border-y border-sand-200">
      <div className="container-site section-pad">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <p className="label-tag mb-2">Current Offers</p>
            <h2 className="heading-lg">Customer Schemes</h2>
          </div>
          <Link to="/schemes"
            className="text-sm font-semibold text-olive-700 hover:text-olive-800 inline-flex items-center gap-1.5 shrink-0 transition-colors">
            View all <ArrowRight size={13} />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {SCHEMES_PREVIEW.map(s => (
            <div key={s.id} className="card">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="heading-sm">{s.name}</h3>
                <span className="badge-green shrink-0">Active</span>
              </div>
              <p className="body-md mb-3">{s.desc}</p>
              <p className="text-xs text-sand-400">Valid until: {s.end}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Gau Seva preview ─────────────────────────────────────────────────────────
function GauSevaPreview() {
  return (
    <section className="container-site section-pad">
      <div className="rounded-2xl p-8 sm:p-12" style={{ background: '#292524' }}>
        <div className="max-w-xl">
          <p className="text-xs font-bold uppercase tracking-widest text-sand-500 mb-3">Community & Charity</p>
          <h2 className="text-2xl font-black text-white mb-3">Gau Seva — Cow Welfare</h2>
          <p className="text-sm text-sand-400 leading-relaxed mb-6">
            Beyond supplying milk, we are committed to the welfare of our cows and other animals.
            A portion of our proceeds supports daily cow feeding and animal care activities.
          </p>
          <Link to="/gau-seva"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-colors"
            style={{ background: '#c9a84c', color: '#1c1917' }}>
            Learn about Gau Seva <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────
function Testimonials() {
  return (
    <section className="bg-white border-t border-sand-200">
      <div className="container-site section-pad">
        <p className="label-tag mb-2">What Customers Say</p>
        <h2 className="heading-lg mb-1">Customer Feedback</h2>
        <p className="text-xs text-sand-400 italic mb-8">Demo placeholders — will be replaced with real feedback.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {TESTIMONIALS.map(({ name, area, text, rating }) => (
            <div key={name} className="card">
              <div className="flex gap-0.5 mb-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={13}
                    className={i < rating ? 'text-gold-600 fill-gold-600' : 'text-sand-200'} />
                ))}
              </div>
              <p className="body-md mb-4">"{text}"</p>
              <p className="text-sm font-semibold text-sand-800">{name}</p>
              <p className="text-xs text-sand-400 flex items-center gap-1 mt-0.5">
                <MapPin size={10} /> {area}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Contact CTA ──────────────────────────────────────────────────────────────
function ContactCTA() {
  return (
    <section className="bg-sand-50 border-t border-sand-200">
      <div className="container-site section-pad text-center">
        <p className="label-tag mb-2">Ready to Start?</p>
        <h2 className="heading-lg mb-3">Begin Your Daily Delivery</h2>
        <p className="body-lg mb-8 max-w-md mx-auto">
          Contact us to start your regular milk supply. We serve families across Madhubani.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <a href={`https://wa.me/${BRAND.whatsapp}?text=Hi, I want to start milk delivery`}
            target="_blank" rel="noopener noreferrer"
            className="btn-whatsapp-lg">
            <WhatsAppIcon size={17} /> WhatsApp Us
          </a>
          <a href={`tel:${BRAND.phone}`} className="btn-outline-lg">
            <Phone size={16} /> +91 {BRAND.phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}
          </a>
          <Link to="/contact" className="btn-ghost border border-sand-200 text-base px-7 py-3.5">
            Delivery Enquiry
          </Link>
        </div>
      </div>
    </section>
  );
}

export default function PublicHome() {
  return (
    <>
      <Hero />
      <TrustBar />
      <MilkOfferings />
      <HowItWorks />
      <WhyUs />
      <SchemesPreview />
      <GauSevaPreview />
      <Testimonials />
      <ContactCTA />
    </>
  );
}
