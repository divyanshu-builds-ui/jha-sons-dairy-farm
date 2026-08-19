import React from 'react';
import { ArrowRight } from 'lucide-react';
import BRAND from '../../utils/config';

function WhatsAppIcon({ size = 15 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  );
}

export default function MilkPage() {
  return (
    <div className="container-site section-pad">
      <p className="label-tag mb-2">Products</p>
      <h1 className="heading-lg mb-2">Our Milk</h1>
      <p className="body-lg mb-10 max-w-lg">Fresh cow and buffalo milk directly from our farm to your doorstep every morning.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
        {[
          { type: 'Cow Milk',     emoji: '🐄', desc: 'Fresh cow milk collected daily from our farm. Lighter in texture and naturally sweet. Suitable for daily drinking, tea, and cooking.' },
          { type: 'Buffalo Milk', emoji: '🐃', desc: 'Rich, creamy buffalo milk from our farm. Higher fat content makes it ideal for preparing sweets, curd, paneer, and khoya.' },
        ].map(({ type, emoji, desc }) => (
          <div key={type} className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-olive-50 border border-olive-100 rounded-xl flex items-center justify-center text-2xl">{emoji}</div>
              <div>
                <h2 className="heading-sm">{type}</h2>
                <span className="badge-green mt-1">Available Daily</span>
              </div>
            </div>
            <p className="body-md mb-2">{desc}</p>
            <p className="text-xs text-sand-400 italic mb-5">Contact us for current rates.</p>
            <a href={`https://wa.me/${BRAND.whatsapp}?text=I want to enquire about ${type}`}
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-olive-700 hover:text-olive-800 transition-colors">
              Enquire on WhatsApp <ArrowRight size={13} />
            </a>
          </div>
        ))}
      </div>

      <div className="bg-sand-100 border border-sand-200 rounded-xl p-6 mb-10">
        <h3 className="text-sm font-bold text-sand-700 mb-2">Coming Soon</h3>
        <p className="body-sm mb-3">We plan to expand our product range in the future:</p>
        <div className="flex flex-wrap gap-2">
          {['Curd (Dahi)', 'Paneer', 'Ghee', 'Other farm products'].map(p => (
            <span key={p} className="badge-sand">{p}</span>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-8 text-white text-center" style={{ background: 'linear-gradient(135deg, #3d5a3e, #2d4428)' }}>
        <h3 className="text-xl font-black mb-2">Start Your Daily Delivery</h3>
        <p className="text-sm text-olive-300 mb-5">Contact us to set up your regular milk supply.</p>
        <a href={`https://wa.me/${BRAND.whatsapp}?text=Hi, I want to start milk delivery`}
          target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-colors"
          style={{ background: '#25D366', color: 'white' }}>
          <WhatsAppIcon size={16} /> Contact on WhatsApp
        </a>
      </div>
    </div>
  );
}
