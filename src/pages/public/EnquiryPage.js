import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle2, Milk } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Logo from '../../assets/Logo';
import BRAND from '../../utils/config';

const AREAS = ['Kaluahi', 'Haripur Baxitol', 'Benta', 'Rahika', 'Ladania', 'Jhanjharpur', 'Madhubani Town', 'Other'];

const inp = {
  width: '100%', padding: '11px 14px', borderRadius: '12px',
  border: '1.5px solid #e8e4dc', background: 'white',
  fontSize: '14px', color: '#44403c', outline: 'none', boxSizing: 'border-box',
};

export default function EnquiryPage() {
  const { t } = useTranslation();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: '', phone: '', area: '', address: '',
    products: [], cowQty: '1', buffaloQty: '0.5', startDate: '',
  });
  const [errors, setErrors] = useState({});

  function set(key, val) { setForm(f => ({ ...f, [key]: val })); setErrors(e => ({ ...e, [key]: '' })); }

  function toggleProduct(val) {
    setForm(f => ({
      ...f,
      products: f.products.includes(val) ? f.products.filter(p => p !== val) : [...f.products, val]
    }));
    setErrors(e => ({ ...e, products: '' }));
  }

  function validateStep1() {
    const e = {};
    if (!form.name.trim())        e.name  = t('enquiry.nameErr');
    if (form.phone.length !== 10) e.phone = t('enquiry.phoneErr');
    if (!form.area)               e.area  = t('enquiry.areaErr');
    return e;
  }

  function validateStep2() {
    const e = {};
    if (!form.products.length) e.products = t('enquiry.milkErr');
    return e;
  }

  function handleNext() {
    const e = step === 1 ? validateStep1() : validateStep2();
    if (Object.keys(e).length) { setErrors(e); return; }
    setStep(s => s + 1);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const hasMilk = form.products.includes('cow') || form.products.includes('buffalo') || form.products.includes('both');
    const milkPart = hasMilk ? `*Milk:* ${form.products.filter(p => ['cow','buffalo','both'].includes(p)).join(', ')}%0A${form.products.includes('cow') || form.products.includes('both') ? `*Cow Qty:* ${form.cowQty}L/day%0A` : ''}${form.products.includes('buffalo') || form.products.includes('both') ? `*Buffalo Qty:* ${form.buffaloQty}L/day%0A` : ''}*Start Date:* ${form.startDate || 'ASAP'}%0A` : '';
    const otherPart = form.products.filter(p => !['cow','buffalo','both'].includes(p)).length ? `*Other Products:* ${form.products.filter(p => !['cow','buffalo','both'].includes(p)).join(', ')}%0A` : '';
    const msg = `Namaste! Mujhe order karna hai.%0A%0A*Naam:* ${form.name}%0A*Phone:* ${form.phone}%0A*Area:* ${form.area}%0A*Address:* ${form.address || 'N/A'}%0A${milkPart}${otherPart}`;
    window.open(`https://wa.me/${BRAND.whatsapp}?text=${msg}`, '_blank');
    setStep(4);
  }

  const hasCow     = form.products.includes('cow') || form.products.includes('both');
  const hasBuffalo  = form.products.includes('buffalo') || form.products.includes('both');
  const totalQty    = (hasCow ? +form.cowQty : 0) + (hasBuffalo ? +form.buffaloQty : 0);
  const estBill     = Math.round((hasCow ? +form.cowQty * 55 : 0) + (hasBuffalo ? +form.buffaloQty * 65 : 0)) * 30;
  const milkLabel   = form.products.filter(p => ['cow','buffalo','both'].includes(p)).join(' + ') || '—';

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0e8', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>

      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#a8a29e', textDecoration: 'none', alignSelf: 'flex-start', maxWidth: '440px', width: '100%', margin: '0 auto 20px' }}>
        <ArrowLeft size={13} /> {t('enquiry.backSite')}
      </Link>

      <div style={{ width: '100%', maxWidth: '440px', margin: '0 auto' }}>
        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}>

            <div style={{ background: 'white', borderRadius: '20px', padding: '28px', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', border: '1px solid #e8e4dc' }}>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                <Logo size={36} />
                <div>
                  <p style={{ fontWeight: 800, fontSize: '14px', color: '#1c1917', margin: 0 }}>{BRAND.shortName}</p>
                  <p style={{ fontSize: '11px', color: '#a8a29e', margin: 0 }}>{t('enquiry.portalLabel')}</p>
                </div>
              </div>

              {step < 4 && (
                <div style={{ display: 'flex', gap: '6px', marginBottom: '24px' }}>
                  {[1, 2, 3].map(s => (
                    <div key={s} style={{ flex: 1, height: '4px', borderRadius: '100px', background: s <= step ? '#3d5a3e' : '#e8e4dc', transition: 'background 0.3s' }} />
                  ))}
                </div>
              )}

              {/* Step 1 */}
              {step === 1 && (
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#1c1917', margin: '0 0 4px' }}>{t('enquiry.step1Title')}</h2>
                  <p style={{ fontSize: '13px', color: '#a8a29e', margin: '0 0 20px' }}>{t('enquiry.step1Sub')}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#78716c', display: 'block', marginBottom: '6px' }}>{t('enquiry.nameLabel')} *</label>
                      <input value={form.name} onChange={e => set('name', e.target.value)} placeholder={t('enquiry.namePlaceholder')} style={{ ...inp, borderColor: errors.name ? '#fca5a5' : '#e8e4dc' }} />
                      {errors.name && <p style={{ fontSize: '11px', color: '#dc2626', margin: '4px 0 0' }}>{errors.name}</p>}
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#78716c', display: 'block', marginBottom: '6px' }}>{t('login.mobileLabel')} *</label>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <div style={{ padding: '11px 12px', borderRadius: '12px', border: '1.5px solid #e8e4dc', background: '#fafaf7', fontSize: '13px', fontWeight: 700, color: '#78716c', flexShrink: 0 }}>+91</div>
                        <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value.replace(/\D/g, '').slice(0, 10))}
                          placeholder={t('login.mobilePlaceholder')} style={{ ...inp, borderColor: errors.phone ? '#fca5a5' : '#e8e4dc' }} />
                      </div>
                      {errors.phone && <p style={{ fontSize: '11px', color: '#dc2626', margin: '4px 0 0' }}>{errors.phone}</p>}
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#78716c', display: 'block', marginBottom: '6px' }}>{t('enquiry.areaLabel')} *</label>
                      <select value={form.area} onChange={e => set('area', e.target.value)} style={{ ...inp, borderColor: errors.area ? '#fca5a5' : '#e8e4dc', appearance: 'none' }}>
                        <option value="">{t('enquiry.areaPlaceholder')}</option>
                        {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                      {errors.area && <p style={{ fontSize: '11px', color: '#dc2626', margin: '4px 0 0' }}>{errors.area}</p>}
                    </div>
                    <div>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#78716c', display: 'block', marginBottom: '6px' }}>{t('enquiry.addressLabel')} <span style={{ color: '#c8c4be' }}>{t('enquiry.addressOptional')}</span></label>
                      <input value={form.address} onChange={e => set('address', e.target.value)} placeholder={t('enquiry.addressPlaceholder')} style={inp} />
                    </div>
                  </div>
                  <button onClick={handleNext} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', marginTop: '20px', padding: '13px', borderRadius: '12px', background: '#3d5a3e', border: 'none', color: 'white', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                    {t('enquiry.next')} <ArrowRight size={15} />
                  </button>
                </div>
              )}

              {/* Step 2 */}
              {step === 2 && (
                <div>
                  <button onClick={() => setStep(1)} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#a8a29e', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '16px', padding: 0 }}>
                    <ArrowLeft size={13} /> {t('login.back')}
                  </button>
                  <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#1c1917', margin: '0 0 4px' }}>{t('enquiry.step2Title')}</h2>
                  <p style={{ fontSize: '13px', color: '#a8a29e', margin: '0 0 20px' }}>{t('enquiry.step2Sub')}</p>

                  {/* Milk */}
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>🥛 Doodh</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {[
                      { val: 'cow',     label: '🐄 ' + t('enquiry.cowLabel'),     sub: t('enquiry.cowSub')     },
                      { val: 'buffalo', label: '🐃 ' + t('enquiry.buffaloLabel'), sub: t('enquiry.buffaloSub') },
                      { val: 'both',    label: '🐄🐃 ' + t('enquiry.bothLabel'),  sub: t('enquiry.bothSub')    },
                    ].map(({ val, label, sub }) => (
                      <button key={val} onClick={() => toggleProduct(val)}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '12px', border: `2px solid ${form.products.includes(val) ? '#3d5a3e' : '#e8e4dc'}`, background: form.products.includes(val) ? '#f2f7f2' : 'white', cursor: 'pointer', textAlign: 'left' }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '13px', fontWeight: 700, color: '#1c1917', margin: 0 }}>{label}</p>
                          <p style={{ fontSize: '11px', color: '#a8a29e', margin: 0 }}>{sub}</p>
                        </div>
                        {form.products.includes(val) && <CheckCircle2 size={16} style={{ color: '#3d5a3e', flexShrink: 0 }} />}
                      </button>
                    ))}
                  </div>

                  {/* Other products */}
                  <p style={{ fontSize: '11px', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 8px' }}>🛒 Other Products</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {[
                      { val: 'ghee',   label: '🫙 ' + t('enquiry.gheeLabel'),   sub: t('enquiry.gheeSub')   },
                      { val: 'paneer', label: '🧀 ' + t('enquiry.paneerLabel'), sub: t('enquiry.paneerSub') },
                      { val: 'khoa',   label: '🥛 ' + t('enquiry.khoaLabel'),   sub: t('enquiry.khoaSub')   },
                      { val: 'peda',   label: '🍮 ' + t('enquiry.pedaLabel'),   sub: t('enquiry.pedaSub')   },
                      { val: 'bakri',  label: '🐐 ' + t('enquiry.bakriLabel'),  sub: t('enquiry.bakriSub')  },
                      { val: 'fish',   label: '🐟 ' + t('enquiry.fishLabel'),   sub: t('enquiry.fishSub')   },
                    ].map(({ val, label, sub }) => (
                      <button key={val} onClick={() => toggleProduct(val)}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', borderRadius: '12px', border: `2px solid ${form.products.includes(val) ? '#3d5a3e' : '#e8e4dc'}`, background: form.products.includes(val) ? '#f2f7f2' : 'white', cursor: 'pointer', textAlign: 'left' }}>
                        <div style={{ flex: 1 }}>
                          <p style={{ fontSize: '13px', fontWeight: 700, color: '#1c1917', margin: 0 }}>{label}</p>
                          <p style={{ fontSize: '11px', color: '#a8a29e', margin: 0 }}>{sub}</p>
                        </div>
                        {form.products.includes(val) && <CheckCircle2 size={16} style={{ color: '#3d5a3e', flexShrink: 0 }} />}
                      </button>
                    ))}
                  </div>

                  {errors.products && <p style={{ fontSize: '11px', color: '#dc2626', margin: '0 0 8px' }}>{errors.products}</p>}

                  {/* Milk qty */}
                  {(form.products.includes('cow') || form.products.includes('both')) && (
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#78716c', display: 'block', marginBottom: '6px' }}>{t('enquiry.cowQtyLabel')}</label>
                      <select value={form.cowQty} onChange={e => set('cowQty', e.target.value)} style={{ ...inp }}>
                        {['0.5','1','1.5','2','2.5','3'].map(q => <option key={q} value={q}>{q} Litre/day</option>)}
                      </select>
                    </div>
                  )}
                  {(form.products.includes('buffalo') || form.products.includes('both')) && (
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 600, color: '#78716c', display: 'block', marginBottom: '6px' }}>{t('enquiry.buffaloQtyLabel')}</label>
                      <select value={form.buffaloQty} onChange={e => set('buffaloQty', e.target.value)} style={{ ...inp }}>
                        {['0.5','1','1.5','2','2.5','3'].map(q => <option key={q} value={q}>{q} Litre/day</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#78716c', display: 'block', marginBottom: '6px' }}>{t('enquiry.startDateLabel')} <span style={{ color: '#c8c4be' }}>{t('enquiry.addressOptional')}</span></label>
                    <input type="date" value={form.startDate} onChange={e => set('startDate', e.target.value)} style={inp} />
                  </div>
                  <button onClick={handleNext} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', marginTop: '20px', padding: '13px', borderRadius: '12px', background: '#3d5a3e', border: 'none', color: 'white', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                    {t('enquiry.summaryBtn')} <ArrowRight size={15} />
                  </button>
                </div>
              )}

              {/* Step 3 */}
              {step === 3 && (
                <form onSubmit={handleSubmit}>
                  <button type="button" onClick={() => setStep(2)} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#a8a29e', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '16px', padding: 0 }}>
                    <ArrowLeft size={13} /> {t('login.back')}
                  </button>
                  <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#1c1917', margin: '0 0 4px' }}>{t('enquiry.step3Title')}</h2>
                  <p style={{ fontSize: '13px', color: '#a8a29e', margin: '0 0 20px' }}>{t('enquiry.step3Sub')}</p>
                  <div style={{ background: '#f5f0e8', borderRadius: '14px', padding: '16px', marginBottom: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      { label: t('enquiry.labelName'),     val: form.name },
                      { label: t('enquiry.labelPhone'),    val: '+91 ' + form.phone },
                      { label: t('enquiry.labelArea'),     val: form.area },
                      { label: t('enquiry.labelAddress'),  val: form.address || '—' },
                      { label: t('enquiry.labelMilkType'), val: form.products.join(', ') || '—' },
                      ...(totalQty > 0 ? [{ label: t('enquiry.labelDailyQty'), val: totalQty + 'L/day' }] : []),
                      ...(estBill > 0  ? [{ label: t('enquiry.labelEstBill'),  val: '~₹' + estBill }] : []),
                      { label: t('enquiry.labelStartDate'),val: form.startDate || t('enquiry.asap') },
                    ].map(({ label, val }) => (
                      <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ fontSize: '12px', color: '#a8a29e', margin: 0 }}>{label}</p>
                        <p style={{ fontSize: '13px', fontWeight: 700, color: '#1c1917', margin: 0 }}>{val}</p>
                      </div>
                    ))}
                  </div>
                  <p style={{ fontSize: '12px', color: '#a8a29e', margin: '0 0 16px', textAlign: 'center' }}>
                    {t('enquiry.whatsappNote')}
                  </p>
                  <button type="submit" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', width: '100%', padding: '14px', borderRadius: '12px', background: '#25D366', border: 'none', color: 'white', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    {t('enquiry.whatsappBtn')}
                  </button>
                </form>
              )}

              {/* Step 4 */}
              {step === 4 && (
                <div style={{ textAlign: 'center', padding: '12px 0' }}>
                  <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#f0f7f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                    <CheckCircle2 size={32} style={{ color: '#3d5a3e' }} />
                  </div>
                  <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#1c1917', margin: '0 0 8px' }}>{t('enquiry.thankYouTitle')}</h2>
                  <p style={{ fontSize: '13px', color: '#78716c', margin: '0 0 24px', lineHeight: 1.6 }}>{t('enquiry.thankYouSub')}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <a href={`tel:${BRAND.phone}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '12px', background: '#f5f0e8', border: '1px solid #e8e4dc', textDecoration: 'none', fontSize: '13px', fontWeight: 600, color: '#44403c' }}>
                      📞 {t('enquiry.callBtn')}{BRAND.phone}
                    </a>
                    <Link to="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', borderRadius: '12px', background: '#3d5a3e', textDecoration: 'none', fontSize: '13px', fontWeight: 700, color: 'white' }}>
                      <Milk size={15} /> {t('enquiry.backHomeBtn')}
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {step < 4 && (
              <p style={{ textAlign: 'center', fontSize: '11px', color: '#c8c4be', marginTop: '16px' }}>
                {t('enquiry.demoNote')}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
