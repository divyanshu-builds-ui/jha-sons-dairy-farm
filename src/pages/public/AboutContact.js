import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Gift, Heart, Phone, MapPin, ArrowRight } from 'lucide-react';
import BRAND from '../../utils/config';

function WhatsAppIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

const fmt = (phone) => `+91 ${phone.replace(/(\d{4})(\d{3})(\d{3})/, '$1 $2 $3')}`;

// ─── Schemes ──────────────────────────────────────────────────────────────────
const SCHEMES = [
  {
    id: 1, name: 'Monthly Loyalty Bonus', eligibility: 'All active customers',
    condition: 'Complete 30 litres during the offer period.',
    reward: '1 litre complimentary milk', start: '1 Aug 2026', end: '31 Aug 2026',
    terms: 'Reward credited as free delivery on the first day of the following month.',
  },
  {
    id: 2, name: 'New Customer Welcome', eligibility: 'New customers only',
    condition: 'Start a new regular delivery subscription.',
    reward: 'Special rate for first 7 days', start: 'Ongoing', end: 'Ongoing',
    terms: 'Applicable to new customers starting a regular daily delivery. One-time benefit.',
  },
];

export function SchemesPage() {
  return (
    <div className="container-site section-pad">
      <p className="label-tag mb-2">Offers & Rewards</p>
      <h1 className="heading-lg mb-2">Customer Schemes</h1>
      <p className="body-lg mb-1 max-w-lg">Periodic reward schemes for our regular customers.</p>
      <p className="text-xs text-sand-400 italic mb-10">Demo data — actual schemes managed by the business.</p>

      <div className="space-y-5 mb-10">
        {SCHEMES.map(s => (
          <div key={s.id} className="card">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h3 className="heading-sm">{s.name}</h3>
                <p className="text-xs text-sand-400 mt-0.5">{s.eligibility}</p>
              </div>
              <span className="badge-green shrink-0">Active</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
              <div className="bg-sand-50 rounded-lg p-3 border border-sand-200">
                <p className="text-2xs font-bold uppercase tracking-widest text-sand-400 mb-1">Condition</p>
                <p className="text-sm text-sand-700">{s.condition}</p>
              </div>
              <div className="bg-gold-50 rounded-lg p-3 border border-gold-200">
                <p className="text-2xs font-bold uppercase tracking-widest text-gold-600 mb-1 flex items-center gap-1"><Gift size={9} /> Reward</p>
                <p className="text-sm font-semibold text-gold-700">{s.reward}</p>
              </div>
              <div className="bg-sand-50 rounded-lg p-3 border border-sand-200">
                <p className="text-2xs font-bold uppercase tracking-widest text-sand-400 mb-1 flex items-center gap-1"><Calendar size={9} /> Period</p>
                <p className="text-xs text-sand-600">{s.start} – {s.end}</p>
              </div>
            </div>
            <p className="text-xs text-sand-400 border-t border-sand-100 pt-3">
              <span className="font-semibold">Terms:</span> {s.terms}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-sand-100 border border-sand-200 rounded-xl p-6 text-center">
        <p className="body-md mb-3">Want to know more about current offers?</p>
        <a href={`https://wa.me/${BRAND.whatsapp}?text=Hi, I want to know about current schemes`}
          target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
          <WhatsAppIcon /> Ask on WhatsApp
        </a>
      </div>
    </div>
  );
}

// ─── Gau Seva ─────────────────────────────────────────────────────────────────
const ACTIVITIES = [
  { date: 'July 2026',  type: 'Daily Feeding',    desc: 'Regular feed and care for cows and buffaloes at the farm.' },
  { date: 'June 2026',  type: 'Vet Checkup',      desc: 'Routine health checkup for all farm animals.' },
  { date: 'May 2026',   type: 'Feed Procurement', desc: 'Purchased quality fodder and supplements for the herd.' },
];

export function GauSevaPage() {
  return (
    <div className="container-site section-pad">
      <p className="label-tag mb-2">Charity & Welfare</p>
      <h1 className="heading-lg mb-3">Gau Seva</h1>
      <p className="body-lg mb-10 max-w-2xl">
        Gau Seva — the service and care of cows — is an important part of our values at {BRAND.shortName}.
        We believe the animals in our care deserve respect, proper nutrition, and welfare beyond their productive years.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <div className="card">
          <h2 className="heading-sm mb-4">Our Commitment</h2>
          <div className="space-y-3">
            {['All animals receive proper daily care and nutrition.', 'We do not abandon animals that are no longer milk-producing.', 'A portion of proceeds is directed toward animal welfare.', 'We maintain transparency about how charity funds are used.'].map((p, i) => (
              <div key={i} className="flex gap-3">
                <Heart size={14} className="text-olive-600 shrink-0 mt-0.5" />
                <p className="body-md">{p}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <h2 className="heading-sm mb-4">Activities We Support</h2>
          <div className="space-y-2">
            {['Daily feeding of cows and buffaloes', 'Regular veterinary care', 'Proper shelter and clean water', 'Care for aged animals', 'Support for goat welfare'].map(a => (
              <p key={a} className="flex items-center gap-2 body-md">
                <span className="w-1.5 h-1.5 rounded-full bg-olive-500 shrink-0" />{a}
              </p>
            ))}
          </div>
          <div className="mt-4 p-3 bg-gold-50 rounded-lg border border-gold-200">
            <p className="text-xs text-gold-700 italic">We do not claim legal charity registration or tax exemption at this time. All activities are self-funded and transparently managed.</p>
          </div>
        </div>
      </div>

      <h2 className="heading-sm mb-4">Recent Activity</h2>
      <p className="text-xs text-sand-400 italic mb-4">Demo records — actual activity will be updated regularly.</p>
      <div className="space-y-3 mb-10">
        {ACTIVITIES.map(a => (
          <div key={a.date + a.type} className="flex gap-4 p-4 bg-white border border-sand-200 rounded-xl">
            <div className="w-24 shrink-0"><p className="text-xs font-semibold text-sand-400">{a.date}</p></div>
            <div>
              <p className="text-sm font-semibold text-sand-800">{a.type}</p>
              <p className="body-sm mt-0.5">{a.desc}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl p-8 text-white mb-8" style={{ background: '#292524' }}>
        <h2 className="text-lg font-bold mb-3">Transparency</h2>
        <p className="text-sm text-sand-400 leading-relaxed">Business funds and charity activities are kept clearly separate in our records. We do not mix customer payments with charity funds without clear accounting.</p>
      </div>

      <div className="text-center">
        <a href={`https://wa.me/${BRAND.whatsapp}?text=I want to know more about Gau Seva`}
          target="_blank" rel="noopener noreferrer" className="btn-whatsapp-lg">
          <WhatsAppIcon size={17} /> Contact Us About Gau Seva
        </a>
      </div>
    </div>
  );
}

// ─── About ────────────────────────────────────────────────────────────────────
export function AboutPage() {
  return (
    <div className="container-site section-pad">
      <p className="label-tag mb-2">Our Story</p>
      <h1 className="heading-lg mb-10">About {BRAND.shortName}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="lg:col-span-2 space-y-5">
          <div className="card">
            <h2 className="heading-sm mb-3">Who We Are</h2>
            <p className="body-md">{BRAND.name} is a local dairy farm based in Kaluahi, Madhubani, Bihar. We raise cows, buffaloes, and goats, and supply fresh milk directly to families in the area. Our focus is on consistent quality, reliable delivery, and honest business practices.</p>
          </div>
          <div className="card">
            <h2 className="heading-sm mb-3">Our Farm</h2>
            <p className="body-md">We maintain a well-managed farm with cows and buffaloes. Milk is collected fresh each morning and delivered directly to our customers. The milk you receive comes directly from our animals — no intermediaries.</p>
          </div>
          <div className="card">
            <h2 className="heading-sm mb-3">Our Values</h2>
            <div className="space-y-2">
              {['Honest and transparent billing', 'Consistent, reliable daily delivery', 'Respectful treatment of our animals', 'Direct relationship with customers', 'Community contribution through Gau Seva'].map(v => (
                <p key={v} className="flex items-center gap-2 body-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-olive-500 shrink-0" />{v}
                </p>
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="card">
            <h3 className="text-sm font-bold text-sand-700 mb-3">Quick Facts</h3>
            <div className="space-y-3">
              {[['Location', `${BRAND.city}, ${BRAND.state}`], ['Products', 'Cow Milk, Buffalo Milk'], ['Animals', 'Cows, Buffaloes, Goats'], ['Customers', '150+ families served']].map(([l, v]) => (
                <div key={l}>
                  <p className="text-2xs text-sand-400 uppercase font-semibold tracking-wide">{l}</p>
                  <p className="text-sm text-sand-700 mt-0.5">{v}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h3 className="text-sm font-bold text-sand-700 mb-3">Contact</h3>
            <div className="space-y-2">
              <a href={`tel:${BRAND.phone}`} className="flex items-center gap-2 text-sm text-sand-600 hover:text-olive-700 transition-colors"><Phone size={13} /> {fmt(BRAND.phone)}</a>
              <a href={`https://wa.me/${BRAND.whatsapp}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-sand-600 hover:text-olive-700 transition-colors"><WhatsAppIcon /> WhatsApp</a>
              <p className="flex items-start gap-2 text-xs text-sand-500"><MapPin size={12} className="shrink-0 mt-0.5" />{BRAND.address}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="text-center">
        <Link to="/contact" className="btn-primary-lg">Get in Touch <ArrowRight size={15} /></Link>
      </div>
    </div>
  );
}

// ─── Contact ──────────────────────────────────────────────────────────────────
function ContactForm() {
  const [form, setForm] = React.useState({ name: '', phone: '', area: '', milk: '', qty: '', msg: '' });
  const [submitted, setSubmitted] = React.useState(false);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
  }

  const inputCls = 'w-full px-4 py-2.5 rounded-lg border border-sand-200 bg-white text-sm text-sand-800 placeholder-sand-400 focus:outline-none focus:border-olive-400 focus:ring-1 focus:ring-olive-200 transition';

  if (submitted) return (
    <div className="card text-center py-10">
      <div className="w-12 h-12 rounded-full bg-olive-100 flex items-center justify-center mx-auto mb-4 text-xl">
        ✓
      </div>
      <h3 className="heading-sm mb-2">Enquiry Received!</h3>
      <p className="body-sm text-sand-500 mb-1">We'll get back to you shortly.</p>
      <p className="text-xs text-sand-400 italic mb-5">(Demo mode — no data is actually stored)</p>
      <button onClick={() => { setSubmitted(false); setForm({ name: '', phone: '', area: '', milk: '', qty: '', msg: '' }); }}
        className="btn-ghost border border-sand-200 text-sm">Submit Another</button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h2 className="heading-sm">Delivery Enquiry</h2>
      <p className="body-sm text-sand-400 -mt-2">Fill this and we'll open WhatsApp with your details pre-filled.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-sand-600 mb-1 block">Your Name *</label>
          <input name="name" required value={form.name} onChange={handleChange}
            placeholder="e.g. Ramesh Kumar" className={inputCls} />
        </div>
        <div>
          <label className="text-xs font-semibold text-sand-600 mb-1 block">Phone Number *</label>
          <input name="phone" required value={form.phone} onChange={handleChange}
            placeholder="e.g. 9876543210" className={inputCls} />
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-sand-600 mb-1 block">Your Area / Locality *</label>
        <input name="area" required value={form.area} onChange={handleChange}
          placeholder="e.g. Kaluahi, near post office" className={inputCls} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-sand-600 mb-1 block">Milk Type *</label>
          <select name="milk" required value={form.milk} onChange={handleChange} className={inputCls}>
            <option value="">Select...</option>
            <option>Cow Milk</option>
            <option>Buffalo Milk</option>
            <option>Both</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold text-sand-600 mb-1 block">Daily Quantity (litres) *</label>
          <select name="qty" required value={form.qty} onChange={handleChange} className={inputCls}>
            <option value="">Select...</option>
            <option>0.5</option>
            <option>1</option>
            <option>1.5</option>
            <option>2</option>
            <option>3+</option>
          </select>
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-sand-600 mb-1 block">Additional Message</label>
        <textarea name="msg" value={form.msg} onChange={handleChange} rows={3}
          placeholder="Any specific requirements or questions..." className={inputCls} />
      </div>

      <button type="submit" className="btn-primary w-full justify-center py-3">
        Submit Enquiry
      </button>
    </form>
  );
}

export function ContactPage() {
  return (
    <div className="container-site section-pad">
      <p className="label-tag mb-2">Get in Touch</p>
      <h1 className="heading-lg mb-2">Contact Us</h1>
      <p className="body-lg mb-10">Reach out to start your milk delivery or for any enquiries.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

        {/* Left — contact info */}
        <div className="space-y-4">
          <a href={`https://wa.me/${BRAND.whatsapp}?text=Hi, I want to start milk delivery`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-4 p-5 bg-white border border-sand-200 rounded-xl hover:border-olive-300 hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-white" style={{ background: '#25D366' }}>
              <WhatsAppIcon size={22} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-sand-900">WhatsApp</p>
              <p className="text-sm text-sand-500">Fastest response — message us directly</p>
            </div>
            <ArrowRight size={16} className="text-sand-300 group-hover:text-olive-600 transition-colors" />
          </a>

          <a href={`tel:${BRAND.phone}`}
            className="flex items-center gap-4 p-5 bg-white border border-sand-200 rounded-xl hover:border-olive-300 hover:shadow-md transition-all group">
            <div className="w-12 h-12 rounded-xl bg-olive-50 border border-olive-100 flex items-center justify-center shrink-0">
              <Phone size={20} className="text-olive-700" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-sand-900">Call Us</p>
              <p className="text-sm text-sand-500">{fmt(BRAND.phone)}</p>
            </div>
            <ArrowRight size={16} className="text-sand-300 group-hover:text-olive-600 transition-colors" />
          </a>

          <div className="flex items-start gap-4 p-5 bg-white border border-sand-200 rounded-xl">
            <div className="w-12 h-12 rounded-xl bg-sand-100 flex items-center justify-center shrink-0">
              <MapPin size={20} className="text-sand-500" />
            </div>
            <div>
              <p className="text-sm font-bold text-sand-900">Address</p>
              <p className="text-sm text-sand-500 leading-relaxed mt-0.5">{BRAND.address}</p>
            </div>
          </div>

          {/* Map embed */}
          <div className="rounded-xl overflow-hidden border border-sand-200">
            <iframe
              title="Jha & Sons Dairy Farm Location"
              src={`https://maps.google.com/maps?q=${BRAND.lat},${BRAND.lng}&z=15&output=embed`}
              width="100%" height="220" style={{ border: 0, display: 'block' }}
              allowFullScreen loading="lazy" referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        {/* Right — form */}
        <ContactForm />
      </div>
    </div>
  );
}
