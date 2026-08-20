import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LogOut, Milk, Calendar, IndianRupee, CheckCircle2, Clock,
  PauseCircle, ChevronRight, Gift, Home, User, FileText,
  Truck, Tag, Menu, Flame, Copy, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Logo from '../../assets/Logo';
import BRAND from '../../utils/config';
import {
  SUBSCRIPTION, MONTH_STATS, DELIVERIES, BILLING,
  ACTIVE_SCHEME, REFERRAL, UPCOMING_HOLIDAYS
} from './mockData';

// ── Helpers ──────────────────────────────────────────────────────────────────
const card = {
  background: 'white',
  borderRadius: '16px',
  padding: '20px',
  border: '1px solid #e8e4dc',
  boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
};

function StatusBadge({ status }) {
  if (status === 'delivered') return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: '#3d5a3e' }}>
      <CheckCircle2 size={12} /> Delivered
    </span>
  );
  if (status === 'paused') return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: '#a8a29e' }}>
      <PauseCircle size={12} /> Paused
    </span>
  );
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600, color: '#c9a84c' }}>
      <Clock size={12} /> Pending
    </span>
  );
}

function BillBadge({ status }) {
  return (
    <span style={{
      fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '100px', textTransform: 'uppercase',
      background: status === 'paid' ? '#dcfce7' : '#fef9ec',
      color: status === 'paid' ? '#166534' : '#92400e',
    }}>
      {status === 'paid' ? 'Paid' : 'Pending'}
    </span>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────────────────
const NAV = [
  { id: 'home',      icon: Home,      label: 'Dashboard'   },
  { id: 'deliveries',icon: Truck,     label: 'Deliveries'  },
  { id: 'billing',   icon: FileText,  label: 'Billing'     },
  { id: 'schemes',   icon: Tag,       label: 'Schemes'     },
  { id: 'profile',   icon: User,      label: 'My Profile'  },
];

function Sidebar({ open, close, active, setActive }) {
  return (
    <>
      {open && <div onClick={close} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 40 }} />}
      <aside style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: '240px',
        background: '#2d4428', zIndex: 50, display: 'flex', flexDirection: 'column',
        padding: '20px 14px',
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '28px' }}>
          <Logo size={34} />
          <div>
            <p style={{ fontSize: '13px', fontWeight: 800, color: 'white', margin: 0 }}>{BRAND.shortName}</p>
            <p style={{ fontSize: '10px', color: '#a8c5a0', margin: 0 }}>Customer Portal</p>
          </div>
        </div>
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {NAV.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => { setActive(id); close(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '11px 14px', borderRadius: '10px', width: '100%',
                background: active === id ? 'rgba(255,255,255,0.12)' : 'transparent',
                border: active === id ? '1px solid rgba(255,255,255,0.18)' : '1px solid transparent',
                color: active === id ? 'white' : '#a8c5a0',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '16px' }}>
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', color: '#a8c5a0', fontSize: '12px', fontWeight: 600, textDecoration: 'none', marginBottom: '6px' }}>
            ← Back to Website
          </Link>
          <button onClick={() => { localStorage.removeItem('mockUser'); window.location.href = '/login'; }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', width: '100%', background: 'rgba(255,255,255,0.05)', border: 'none', color: '#a8c5a0', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}

// ── Pages ────────────────────────────────────────────────────────────────────
function PageHome({ paused, handlePause, displayName }) {
  const [copied, setCopied] = useState(false);
  function copyCode() {
    navigator.clipboard.writeText(REFERRAL.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Top row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>

        {/* Subscription */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          style={{ ...card, background: '#2d4428', gridColumn: 'span 1' }}>
          <p style={{ fontSize: '11px', color: '#a8c5a0', margin: '0 0 6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Subscription</p>
          <p style={{ fontSize: '20px', fontWeight: 900, color: 'white', margin: '0 0 14px' }}>{SUBSCRIPTION.milkType}</p>
          <div style={{ display: 'flex', gap: '20px' }}>
            <div><p style={{ fontSize: '11px', color: '#a8c5a0', margin: '0 0 2px' }}>Daily</p><p style={{ fontSize: '18px', fontWeight: 800, color: 'white', margin: 0 }}>{SUBSCRIPTION.totalQty}L</p></div>
            <div><p style={{ fontSize: '11px', color: '#a8c5a0', margin: '0 0 2px' }}>Rate</p><p style={{ fontSize: '18px', fontWeight: 800, color: 'white', margin: 0 }}>₹{SUBSCRIPTION.cowRate}/L</p></div>
          </div>
          <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <p style={{ fontSize: '11px', color: '#a8c5a0', margin: '0 0 2px' }}>Next Delivery</p>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'white', margin: 0 }}>{SUBSCRIPTION.nextDelivery}</p>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={card}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 14px' }}>{MONTH_STATS.month}</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              { icon: Milk, color: '#3d5a3e', val: MONTH_STATS.totalLitres + 'L', label: 'Delivered' },
              { icon: IndianRupee, color: '#c9a84c', val: '₹' + MONTH_STATS.estimatedBill, label: 'Est. Bill' },
              { icon: Calendar, color: '#3d5a3e', val: MONTH_STATS.daysDelivered, label: 'Days Done' },
              { icon: Flame, color: '#ef4444', val: MONTH_STATS.streak + ' days', label: 'Streak 🔥' },
            ].map(({ icon: Icon, color, val, label }, i) => (
              <div key={i} style={{ textAlign: 'center', padding: '12px 8px', background: '#f5f0e8', borderRadius: '12px' }}>
                <Icon size={16} style={{ color, margin: '0 auto 4px' }} />
                <p style={{ fontSize: '16px', fontWeight: 900, color: '#1c1917', margin: '0 0 2px' }}>{val}</p>
                <p style={{ fontSize: '10px', color: '#a8a29e', margin: 0 }}>{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Milk Breakdown */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} style={card}>
          <p style={{ fontSize: '13px', fontWeight: 800, color: '#1c1917', margin: '0 0 14px' }}>Milk Breakdown</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#44403c' }}>🐄 Cow Milk</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#3d5a3e' }}>{MONTH_STATS.cowLitres}L</span>
              </div>
              <div style={{ background: '#f5f0e8', borderRadius: '100px', height: '8px' }}>
                <div style={{ width: `${(MONTH_STATS.cowLitres / MONTH_STATS.totalLitres) * 100}%`, height: '100%', background: '#3d5a3e', borderRadius: '100px' }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#44403c' }}>🐃 Buffalo Milk</span>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#c9a84c' }}>{MONTH_STATS.buffaloLitres}L</span>
              </div>
              <div style={{ background: '#f5f0e8', borderRadius: '100px', height: '8px' }}>
                <div style={{ width: `${(MONTH_STATS.buffaloLitres / MONTH_STATS.totalLitres) * 100}%`, height: '100%', background: '#c9a84c', borderRadius: '100px' }} />
              </div>
            </div>
            <div style={{ paddingTop: '10px', borderTop: '1px solid #f0ece4', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: '#78716c' }}>Daily: {SUBSCRIPTION.cowQty}L cow + {SUBSCRIPTION.buffaloQty}L buffalo</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Middle row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>

        {/* Recent Deliveries */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} style={{ ...card, gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <p style={{ fontSize: '13px', fontWeight: 800, color: '#1c1917', margin: 0 }}>Recent Deliveries</p>
            <span style={{ fontSize: '11px', color: '#a8a29e' }}>Last 8 days</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {DELIVERIES.map((d, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', alignItems: 'center', gap: '16px', padding: '10px 0', borderBottom: i < DELIVERIES.length - 1 ? '1px solid #f0ece4' : 'none' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#44403c', margin: 0 }}>{d.date}</p>
                <p style={{ fontSize: '12px', color: '#78716c', margin: 0 }}>🐄 {d.cow}L</p>
                <p style={{ fontSize: '12px', color: '#78716c', margin: 0 }}>🐃 {d.buffalo}L</p>
                <StatusBadge status={d.status} />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Upcoming Holidays */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <AlertCircle size={15} style={{ color: '#c9a84c' }} />
            <p style={{ fontSize: '13px', fontWeight: 800, color: '#1c1917', margin: 0 }}>Upcoming Breaks</p>
          </div>
          {UPCOMING_HOLIDAYS.map((h, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#fef9ec', borderRadius: '10px', marginBottom: '8px', border: '1px solid #fde68a' }}>
              <div>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#1c1917', margin: 0 }}>{h.date}</p>
                <p style={{ fontSize: '11px', color: '#78716c', margin: 0 }}>{h.reason}</p>
              </div>
              <span style={{ fontSize: '10px', fontWeight: 700, color: '#92400e', background: '#fde68a', padding: '3px 8px', borderRadius: '100px' }}>No Delivery</span>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>

        {/* Active Scheme */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={{ ...card, border: '1.5px solid #c9a84c' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <Gift size={15} style={{ color: '#c9a84c' }} />
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#c9a84c', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Offer</p>
          </div>
          <p style={{ fontSize: '14px', fontWeight: 800, color: '#1c1917', margin: '0 0 4px' }}>{ACTIVE_SCHEME.name}</p>
          <p style={{ fontSize: '12px', color: '#78716c', margin: '0 0 12px' }}>{ACTIVE_SCHEME.desc}</p>
          <div style={{ background: '#f5f0e8', borderRadius: '100px', height: '10px', overflow: 'hidden' }}>
            <div style={{ width: `${(ACTIVE_SCHEME.progress / ACTIVE_SCHEME.target) * 100}%`, height: '100%', background: '#c9a84c', borderRadius: '100px' }} />
          </div>
          <p style={{ fontSize: '11px', color: '#a8a29e', margin: '6px 0 0', textAlign: 'right' }}>
            {ACTIVE_SCHEME.progress}L / {ACTIVE_SCHEME.target}L — {ACTIVE_SCHEME.target - ACTIVE_SCHEME.progress}L remaining
          </p>
        </motion.div>

        {/* Referral */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} style={{ ...card, background: '#f5f0e8', border: '1.5px solid #e8e4dc' }}>
          <p style={{ fontSize: '13px', fontWeight: 800, color: '#1c1917', margin: '0 0 4px' }}>Refer & Earn 🎁</p>
          <p style={{ fontSize: '12px', color: '#78716c', margin: '0 0 14px' }}>Refer a friend — get 2 litres free per referral.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'white', borderRadius: '10px', padding: '10px 14px', border: '1px solid #e8e4dc', marginBottom: '12px' }}>
            <span style={{ flex: 1, fontSize: '15px', fontWeight: 900, color: '#3d5a3e', letterSpacing: '2px' }}>{REFERRAL.code}</span>
            <button onClick={copyCode} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a8a29e' }}>
              <Copy size={15} />
            </button>
            {copied && <span style={{ fontSize: '11px', color: '#3d5a3e', fontWeight: 600 }}>Copied!</span>}
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1, textAlign: 'center', padding: '10px', background: 'white', borderRadius: '10px' }}>
              <p style={{ fontSize: '18px', fontWeight: 900, color: '#3d5a3e', margin: 0 }}>{REFERRAL.earned}L</p>
              <p style={{ fontSize: '10px', color: '#a8a29e', margin: 0 }}>Earned</p>
            </div>
            <div style={{ flex: 1, textAlign: 'center', padding: '10px', background: 'white', borderRadius: '10px' }}>
              <p style={{ fontSize: '18px', fontWeight: 900, color: '#c9a84c', margin: 0 }}>{REFERRAL.pending}L</p>
              <p style={{ fontSize: '10px', color: '#a8a29e', margin: 0 }}>Pending</p>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={card}>
          <p style={{ fontSize: '13px', fontWeight: 800, color: '#1c1917', margin: '0 0 14px' }}>Quick Actions</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <a href={`https://wa.me/${BRAND.whatsapp}`} target="_blank" rel="noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', borderRadius: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', textDecoration: 'none' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              <span style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: '#166534' }}>WhatsApp Us</span>
              <ChevronRight size={13} style={{ color: '#86efac' }} />
            </a>
            <a href={`tel:${BRAND.phone}`}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', borderRadius: '12px', background: '#f5f0e8', border: '1px solid #e8e4dc', textDecoration: 'none' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3d5a3e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
              <span style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: '#44403c' }}>Call — {BRAND.phone}</span>
              <ChevronRight size={13} style={{ color: '#c8c4be' }} />
            </a>
            <button onClick={handlePause}
              style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '11px 14px', borderRadius: '12px', background: paused ? '#fef9ec' : '#fafaf7', border: `1px solid ${paused ? '#fde68a' : '#e8e4dc'}`, cursor: 'pointer', width: '100%' }}>
              <PauseCircle size={16} style={{ color: paused ? '#c9a84c' : '#a8a29e' }} />
              <span style={{ flex: 1, fontSize: '13px', fontWeight: 600, color: '#44403c', textAlign: 'left' }}>
                {paused ? "Resume Tomorrow's Delivery" : "Pause Tomorrow's Delivery"}
              </span>
              <ChevronRight size={13} style={{ color: '#c8c4be' }} />
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

// ── Deliveries Page ──────────────────────────────────────────────────────────
function PageDeliveries() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={card}>
        <p style={{ fontSize: '16px', fontWeight: 800, color: '#1c1917', margin: '0 0 16px' }}>Delivery History</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: '0', marginBottom: '8px', padding: '0 0 8px', borderBottom: '2px solid #f0ece4' }}>
          {['Date', '🐄 Cow', '🐃 Buffalo', 'Status'].map(h => (
            <p key={h} style={{ fontSize: '11px', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase', margin: 0 }}>{h}</p>
          ))}
        </div>
        {DELIVERIES.map((d, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', alignItems: 'center', gap: '16px', padding: '12px 0', borderBottom: i < DELIVERIES.length - 1 ? '1px solid #f0ece4' : 'none' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#44403c', margin: 0 }}>{d.date}</p>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#3d5a3e', margin: 0 }}>{d.cow > 0 ? d.cow + 'L' : '—'}</p>
            <p style={{ fontSize: '13px', fontWeight: 700, color: '#c9a84c', margin: 0 }}>{d.buffalo > 0 ? d.buffalo + 'L' : '—'}</p>
            <StatusBadge status={d.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Billing Page ─────────────────────────────────────────────────────────────
function PageBilling() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ ...card, background: '#2d4428' }}>
        <p style={{ fontSize: '11px', color: '#a8c5a0', margin: '0 0 4px', fontWeight: 600, textTransform: 'uppercase' }}>Current Month — {MONTH_STATS.month}</p>
        <p style={{ fontSize: '28px', fontWeight: 900, color: 'white', margin: '0 0 4px' }}>₹{MONTH_STATS.estimatedBill}</p>
        <p style={{ fontSize: '12px', color: '#a8c5a0', margin: 0 }}>{MONTH_STATS.totalLitres}L delivered · {MONTH_STATS.daysLeft} days remaining</p>
      </div>
      <div style={card}>
        <p style={{ fontSize: '14px', fontWeight: 800, color: '#1c1917', margin: '0 0 16px' }}>Past Bills</p>
        {BILLING.map((b, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', borderBottom: i < BILLING.length - 1 ? '1px solid #f0ece4' : 'none' }}>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 700, color: '#1c1917', margin: '0 0 2px' }}>{b.month}</p>
              <p style={{ fontSize: '12px', color: '#a8a29e', margin: 0 }}>{b.litres}L · Paid on {b.date}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <p style={{ fontSize: '16px', fontWeight: 800, color: '#1c1917', margin: 0 }}>₹{b.amount}</p>
              <BillBadge status={b.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Schemes Page ─────────────────────────────────────────────────────────────
function PageSchemes() {
  const schemes = [
    { name: 'Monthly Loyalty Bonus', desc: 'Complete 30 litres — get 1 litre free.', status: 'active', progress: 27, target: 30 },
    { name: 'New Customer Welcome', desc: 'First 7 days at a special rate.', status: 'expired', progress: 7, target: 7 },
    { name: 'Refer & Earn', desc: 'Refer a friend — get 2 litres free.', status: 'active', progress: 2, target: null },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      {schemes.map((s, i) => (
        <div key={i} style={{ ...card, border: s.status === 'active' ? '1.5px solid #c9a84c' : '1px solid #e8e4dc', opacity: s.status === 'expired' ? 0.6 : 1 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <p style={{ fontSize: '15px', fontWeight: 800, color: '#1c1917', margin: 0 }}>{s.name}</p>
            <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '100px', textTransform: 'uppercase', background: s.status === 'active' ? '#fef9ec' : '#f5f0e8', color: s.status === 'active' ? '#92400e' : '#a8a29e' }}>
              {s.status}
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#78716c', margin: '0 0 12px' }}>{s.desc}</p>
          {s.target && (
            <>
              <div style={{ background: '#f5f0e8', borderRadius: '100px', height: '8px', overflow: 'hidden' }}>
                <div style={{ width: `${Math.min((s.progress / s.target) * 100, 100)}%`, height: '100%', background: '#c9a84c', borderRadius: '100px' }} />
              </div>
              <p style={{ fontSize: '11px', color: '#a8a29e', margin: '6px 0 0', textAlign: 'right' }}>{s.progress} / {s.target}</p>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Profile Page ─────────────────────────────────────────────────────────────
function PageProfile({ user, profile }) {
  const displayName = profile?.name || user?.displayName || user?.email?.split('@')[0] || 'Customer';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px' }}>
      <div style={{ ...card, display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#2d4428', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', fontWeight: 900, color: 'white', flexShrink: 0 }}>
          {displayName[0]?.toUpperCase()}
        </div>
        <div>
          <p style={{ fontSize: '18px', fontWeight: 900, color: '#1c1917', margin: '0 0 2px' }}>{displayName}</p>
          <p style={{ fontSize: '12px', color: '#a8a29e', margin: 0 }}>Customer since {SUBSCRIPTION.since}</p>
        </div>
      </div>
      <div style={card}>
        <p style={{ fontSize: '13px', fontWeight: 800, color: '#1c1917', margin: '0 0 14px' }}>Contact Details</p>
        {[
          { label: 'Phone', value: user?.phoneNumber || '+91 XXXXXXXXXX' },
          { label: 'Email', value: user?.email || 'Not provided' },
          { label: 'Address', value: 'Kaluahi, Madhubani, Bihar' },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0ece4' }}>
            <p style={{ fontSize: '12px', color: '#a8a29e', margin: 0 }}>{label}</p>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#44403c', margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>
      <div style={card}>
        <p style={{ fontSize: '13px', fontWeight: 800, color: '#1c1917', margin: '0 0 14px' }}>Subscription Details</p>
        {[
          { label: 'Milk Type', value: SUBSCRIPTION.milkType },
          { label: 'Daily Quantity', value: SUBSCRIPTION.totalQty + 'L' },
          { label: 'Cow Milk', value: SUBSCRIPTION.cowQty + 'L @ ₹' + SUBSCRIPTION.cowRate + '/L' },
          { label: 'Buffalo Milk', value: SUBSCRIPTION.buffaloQty + 'L @ ₹' + SUBSCRIPTION.buffaloRate + '/L' },
          { label: 'Delivery Time', value: SUBSCRIPTION.nextDelivery },
          { label: 'Member Since', value: SUBSCRIPTION.since },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f0ece4' }}>
            <p style={{ fontSize: '12px', color: '#a8a29e', margin: 0 }}>{label}</p>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#44403c', margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CustomerDashboard() {
  const { user, profile } = useAuth();
  const [paused, setPaused] = useState(false);
  const [toast, setToast] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('home');

  const displayName = profile?.name || user?.displayName || user?.email?.split('@')[0] || 'Customer';

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 3000); }
  function handlePause() { setPaused(v => !v); showToast(paused ? 'Delivery resumed! 🥛' : 'Delivery paused for tomorrow.'); }

  const PAGE_TITLES = { home: 'Dashboard', deliveries: 'My Deliveries', billing: 'Billing', schemes: 'Schemes & Offers', profile: 'My Profile' };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0e8' }}>
      {toast && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          style={{ position: 'fixed', top: '16px', left: '50%', transform: 'translateX(-50%)', background: '#2d4428', color: 'white', padding: '10px 20px', borderRadius: '100px', fontSize: '13px', fontWeight: 600, zIndex: 999, whiteSpace: 'nowrap' }}>
          {toast}
        </motion.div>
      )}

      {/* Top Header */}
      <div style={{ background: '#2d4428', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', padding: '4px' }}>
            <Menu size={22} />
          </button>
          <Logo size={28} />
          <div>
            <p style={{ fontSize: '13px', fontWeight: 800, color: 'white', margin: 0 }}>{PAGE_TITLES[activeTab]}</p>
            <p style={{ fontSize: '10px', color: '#a8c5a0', margin: 0 }}>Namaste, {displayName} 🙏</p>
          </div>
        </div>
        <span style={{ background: paused ? '#78716c' : '#c9a84c', color: paused ? 'white' : '#1c1917', fontSize: '10px', fontWeight: 800, padding: '5px 12px', borderRadius: '100px', textTransform: 'uppercase' }}>
          {paused ? 'Paused' : 'Active'}
        </span>
      </div>

      <Sidebar open={sidebarOpen} close={() => setSidebarOpen(false)} active={activeTab} setActive={setActiveTab} />

      {/* Content */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 20px' }}>
        {activeTab === 'home'       && <PageHome paused={paused} handlePause={handlePause} displayName={displayName} />}
        {activeTab === 'deliveries' && <PageDeliveries />}
        {activeTab === 'billing'    && <PageBilling />}
        {activeTab === 'schemes'    && <PageSchemes />}
        {activeTab === 'profile'    && <PageProfile user={user} profile={profile} />}

        <p style={{ textAlign: 'center', fontSize: '11px', color: '#c8c4be', margin: '32px 0 8px' }}>
          Demo mode — data is not real
        </p>
      </div>
    </div>
  );
}
