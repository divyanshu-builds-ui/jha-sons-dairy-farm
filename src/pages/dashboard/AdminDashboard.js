import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LogOut, Users, Truck, FileText, Megaphone,
  Home, Menu, CheckCircle2, Clock, PauseCircle,
  IndianRupee, Milk, TrendingUp, AlertCircle, Phone
} from 'lucide-react';
import Logo from '../../assets/Logo';
import BRAND from '../../utils/config';
import {
  ADMIN_STATS, CUSTOMERS, TODAY_DELIVERIES,
  MONTHLY_BILLS
} from './adminMockData';

// ── Helpers ──────────────────────────────────────────────────────────────────
const card = {
  background: 'white',
  borderRadius: '16px',
  padding: '20px',
  border: '1px solid #e8e4dc',
  boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
};

function DeliveryBadge({ status }) {
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

function PayBadge({ status }) {
  return (
    <span style={{
      fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '100px', textTransform: 'uppercase',
      background: status === 'paid' ? '#dcfce7' : '#fef2f2',
      color: status === 'paid' ? '#166534' : '#dc2626',
    }}>
      {status === 'paid' ? 'Paid' : 'Pending'}
    </span>
  );
}

// ── Sidebar ──────────────────────────────────────────────────────────────────
const NAV = [
  { id: 'overview',    icon: Home,       label: 'Overview'      },
  { id: 'customers',   icon: Users,      label: 'Customers'     },
  { id: 'deliveries',  icon: Truck,      label: 'Deliveries'    },
  { id: 'billing',     icon: FileText,   label: 'Billing'       },
  { id: 'announce',    icon: Megaphone,  label: 'Announcements' },
];

function Sidebar({ open, close, active, setActive }) {
  return (
    <>
      {open && <div onClick={close} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 40 }} />}
      <aside style={{
        position: 'fixed', top: 0, left: 0, bottom: 0, width: '240px',
        background: '#1c1917', zIndex: 50, display: 'flex', flexDirection: 'column',
        padding: '20px 14px',
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Logo size={34} />
          <div>
            <p style={{ fontSize: '13px', fontWeight: 800, color: 'white', margin: 0 }}>{BRAND.shortName}</p>
            <p style={{ fontSize: '10px', color: '#c9a84c', margin: 0, fontWeight: 700 }}>Admin Panel</p>
          </div>
        </div>
        <p style={{ fontSize: '11px', color: '#57534e', margin: '0 0 20px 0', paddingBottom: '16px', borderBottom: '1px solid #292524' }}>Demo Mode</p>
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {NAV.map(({ id, icon: Icon, label }) => (
            <button key={id} onClick={() => { setActive(id); close(); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '11px 14px', borderRadius: '10px', width: '100%',
                background: active === id ? '#c9a84c' : 'transparent',
                border: 'none',
                color: active === id ? '#1c1917' : '#a8a29e',
                fontSize: '13px', fontWeight: active === id ? 700 : 600,
                cursor: 'pointer',
              }}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>
        <div style={{ borderTop: '1px solid #292524', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', color: '#78716c', fontSize: '12px', fontWeight: 600, textDecoration: 'none' }}>
            ← Customer View
          </Link>
          <button onClick={() => { localStorage.removeItem('mockUser'); window.location.href = '/login'; }}
            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderRadius: '10px', width: '100%', background: 'transparent', border: 'none', color: '#78716c', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            <LogOut size={15} /> Logout
          </button>
        </div>
      </aside>
    </>
  );
}

// ── Overview Page ─────────────────────────────────────────────────────────────
function PageOverview() {
  const delivered = TODAY_DELIVERIES.filter(d => d.status === 'delivered').length;
  const pending   = TODAY_DELIVERIES.filter(d => d.status === 'pending').length;
  const totalLitres = TODAY_DELIVERIES.reduce((s, d) => s + d.qty, 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* Stat Cards — 2 cols on mobile, 3 on md */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
        {[
          { icon: Users,       color: '#3d5a3e', bg: '#f0f7f0', val: ADMIN_STATS.totalCustomers,                              label: 'Total Customers'  },
          { icon: Truck,       color: '#3d5a3e', bg: '#f0f7f0', val: ADMIN_STATS.activeToday,                                 label: 'Active Today'     },
          { icon: Milk,        color: '#c9a84c', bg: '#fef9ec', val: totalLitres + 'L',                                       label: "Today's Litres"   },
          { icon: IndianRupee, color: '#c9a84c', bg: '#fef9ec', val: '₹' + (ADMIN_STATS.monthlyRevenue / 1000).toFixed(1) + 'k', label: 'Monthly Revenue'  },
          { icon: AlertCircle, color: '#dc2626', bg: '#fef2f2', val: ADMIN_STATS.pendingPayments,                             label: 'Pending Payments' },
          { icon: PauseCircle, color: '#a8a29e', bg: '#f5f0e8', val: ADMIN_STATS.pausedToday,                                label: 'Paused Today'     },
        ].map(({ icon: Icon, color, bg, val, label }, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            style={{ ...card, padding: '14px 12px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px' }}>
              <Icon size={15} style={{ color }} />
            </div>
            <p style={{ fontSize: '18px', fontWeight: 900, color: '#1c1917', margin: '0 0 2px', lineHeight: 1 }}>{val}</p>
            <p style={{ fontSize: '10px', color: '#a8a29e', margin: 0, lineHeight: 1.3 }}>{label}</p>
          </motion.div>
        ))}
      </div>

      {/* Delivery progress bar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <p style={{ fontSize: '14px', fontWeight: 800, color: '#1c1917', margin: 0 }}>Today's Delivery Progress</p>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#3d5a3e' }}>{delivered}/{TODAY_DELIVERIES.length}</span>
        </div>
        <div style={{ background: '#f0ece4', borderRadius: '100px', height: '10px', overflow: 'hidden', marginBottom: '12px' }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${(delivered / TODAY_DELIVERIES.length) * 100}%` }}
            transition={{ duration: 0.8, delay: 0.4 }}
            style={{ height: '100%', background: '#3d5a3e', borderRadius: '100px' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
          {[
            { label: 'Delivered', val: delivered, color: '#3d5a3e', bg: '#f0f7f0' },
            { label: 'Pending',   val: pending,   color: '#c9a84c', bg: '#fef9ec' },
            { label: 'Paused',    val: ADMIN_STATS.pausedToday, color: '#a8a29e', bg: '#f5f0e8' },
          ].map(({ label, val, color, bg }) => (
            <div key={label} style={{ textAlign: 'center', padding: '10px 8px', background: bg, borderRadius: '10px' }}>
              <p style={{ fontSize: '20px', fontWeight: 900, color, margin: '0 0 2px' }}>{val}</p>
              <p style={{ fontSize: '11px', color: '#a8a29e', margin: 0 }}>{label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Recent customers + area breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>

        {/* Recent customers */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} style={card}>
          <p style={{ fontSize: '14px', fontWeight: 800, color: '#1c1917', margin: '0 0 14px' }}>Recent Customers</p>
          {CUSTOMERS.slice(0, 5).map((c, i) => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: i < 4 ? '1px solid #f0ece4' : 'none' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#f0f7f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: '#3d5a3e' }}>{c.name.charAt(0)}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#1c1917', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
                <p style={{ fontSize: '11px', color: '#a8a29e', margin: 0 }}>{c.area} · {c.cow + c.buffalo}L/day</p>
              </div>
              <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 8px', borderRadius: '100px', flexShrink: 0, background: c.status === 'active' ? '#dcfce7' : '#f5f0e8', color: c.status === 'active' ? '#166534' : '#a8a29e' }}>
                {c.status}
              </span>
            </div>
          ))}
        </motion.div>

        {/* Area breakdown */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} style={card}>
          <p style={{ fontSize: '14px', fontWeight: 800, color: '#1c1917', margin: '0 0 14px' }}>Customers by Area</p>
          {['Kaluahi', 'Haripur Baxitol', 'Benta', 'Rahika', 'Ladania', 'Jhanjharpur', 'Madhubani Town'].map((area) => {
            const count = CUSTOMERS.filter(c => c.area === area).length;
            const max = 3;
            return (
              <div key={area} style={{ marginBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <p style={{ fontSize: '12px', color: '#44403c', margin: 0, fontWeight: 600 }}>{area}</p>
                  <p style={{ fontSize: '12px', fontWeight: 700, color: '#3d5a3e', margin: 0 }}>{count}</p>
                </div>
                <div style={{ background: '#f0ece4', borderRadius: '100px', height: '5px', overflow: 'hidden' }}>
                  <div style={{ width: `${(count / max) * 100}%`, height: '100%', background: '#3d5a3e', borderRadius: '100px' }} />
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}

// ── Customers Page ────────────────────────────────────────────────────────────
function PageCustomers() {
  const [search, setSearch] = useState('');
  const filtered = CUSTOMERS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.area.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, area or phone..."
          style={{ flex: 1, padding: '10px 16px', borderRadius: '12px', border: '1.5px solid #e8e4dc', background: 'white', fontSize: '13px', color: '#44403c', outline: 'none' }} />
        <span style={{ fontSize: '12px', color: '#a8a29e', whiteSpace: 'nowrap', flexShrink: 0 }}>{filtered.length} found</span>
      </div>

      {filtered.length === 0 && (
        <div style={{ ...card, textAlign: 'center', padding: '40px 20px' }}>
          <p style={{ fontSize: '24px', margin: '0 0 8px' }}>🔍</p>
          <p style={{ fontSize: '13px', color: '#a8a29e', margin: 0 }}>No customers found</p>
        </div>
      )}

      {filtered.map((c, i) => (
        <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }} style={{ ...card, padding: '14px 16px' }}>
          {/* Top row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: '#f0f7f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: '#3d5a3e' }}>{c.name.charAt(0)}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: '14px', fontWeight: 800, color: '#1c1917', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</p>
              <p style={{ fontSize: '11px', color: '#a8a29e', margin: 0 }}>{c.area}</p>
            </div>
            <span style={{ fontSize: '10px', fontWeight: 700, padding: '3px 10px', borderRadius: '100px', flexShrink: 0, textTransform: 'uppercase', background: c.status === 'active' ? '#dcfce7' : '#f5f0e8', color: c.status === 'active' ? '#166534' : '#a8a29e' }}>
              {c.status}
            </span>
          </div>
          {/* Bottom row — 4 cols */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', paddingTop: '10px', borderTop: '1px solid #f0ece4' }}>
            <div>
              <p style={{ fontSize: '10px', color: '#a8a29e', margin: '0 0 3px', fontWeight: 600, textTransform: 'uppercase' }}>Phone</p>
              <a href={`tel:${c.phone}`} style={{ fontSize: '11px', color: '#3d5a3e', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Phone size={10} />{c.phone}
              </a>
            </div>
            <div>
              <p style={{ fontSize: '10px', color: '#a8a29e', margin: '0 0 3px', fontWeight: 600, textTransform: 'uppercase' }}>Daily</p>
              <p style={{ fontSize: '13px', fontWeight: 800, color: '#44403c', margin: 0 }}>{c.cow + c.buffalo}L</p>
            </div>
            <div>
              <p style={{ fontSize: '10px', color: '#a8a29e', margin: '0 0 3px', fontWeight: 600, textTransform: 'uppercase' }}>Bill</p>
              <p style={{ fontSize: '13px', fontWeight: 800, color: '#44403c', margin: 0 }}>₹{c.bill}</p>
            </div>
            <div>
              <p style={{ fontSize: '10px', color: '#a8a29e', margin: '0 0 3px', fontWeight: 600, textTransform: 'uppercase' }}>Paid</p>
              <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '100px', background: c.paid ? '#dcfce7' : '#fef2f2', color: c.paid ? '#166534' : '#dc2626' }}>
                {c.paid ? 'Paid' : 'Due'}
              </span>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ── Deliveries Page ───────────────────────────────────────────────────────────
function PageDeliveries() {
  const [deliveries, setDeliveries] = useState(TODAY_DELIVERIES);

  function toggleStatus(id) {
    setDeliveries(prev => prev.map(d =>
      d.id === id ? { ...d, status: d.status === 'delivered' ? 'pending' : 'delivered' } : d
    ));
  }

  const delivered = deliveries.filter(d => d.status === 'delivered').length;
  const pending   = deliveries.filter(d => d.status === 'pending').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
        {[
          { label: 'Total',     val: deliveries.length, color: '#44403c', bg: 'white'    },
          { label: 'Delivered', val: delivered,          color: '#3d5a3e', bg: '#f0f7f0' },
          { label: 'Pending',   val: pending,            color: '#c9a84c', bg: '#fef9ec' },
        ].map(({ label, val, color, bg }) => (
          <div key={label} style={{ ...card, background: bg, textAlign: 'center' }}>
            <p style={{ fontSize: '28px', fontWeight: 900, color, margin: '0 0 4px' }}>{val}</p>
            <p style={{ fontSize: '12px', color: '#a8a29e', margin: 0 }}>{label}</p>
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <p style={{ fontSize: '14px', fontWeight: 800, color: '#1c1917', margin: 0 }}>Today's Deliveries — 15 Jul 2025</p>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#3d5a3e' }}>{delivered}/{deliveries.length}</span>
        </div>
        <div style={{ background: '#f0ece4', borderRadius: '100px', height: '8px', overflow: 'hidden', marginBottom: '14px' }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${(delivered / deliveries.length) * 100}%` }}
            transition={{ duration: 0.7 }} style={{ height: '100%', background: '#3d5a3e', borderRadius: '100px' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {deliveries.map((d) => (
            <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: '#fafaf7', borderRadius: '12px', border: '1px solid #f0ece4' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#1c1917', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.name}</p>
                <p style={{ fontSize: '11px', color: '#a8a29e', margin: 0 }}>{d.area} · {d.qty}L</p>
              </div>
              <button onClick={() => toggleStatus(d.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
                <DeliveryBadge status={d.status} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Billing Page ──────────────────────────────────────────────────────────────
function PageBilling() {
  const [bills, setBills] = useState(MONTHLY_BILLS);
  const totalPaid    = bills.filter(b => b.status === 'paid').reduce((s, b) => s + b.amount, 0);
  const totalPending = bills.filter(b => b.status === 'pending').reduce((s, b) => s + b.amount, 0);

  function togglePaid(id) {
    setBills(prev => prev.map(b => b.id === id ? { ...b, status: b.status === 'paid' ? 'pending' : 'paid' } : b));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        <div style={{ ...card, background: '#2d4428' }}>
          <p style={{ fontSize: '11px', color: '#a8c5a0', margin: '0 0 4px', fontWeight: 600, textTransform: 'uppercase' }}>Collected</p>
          <p style={{ fontSize: '28px', fontWeight: 900, color: 'white', margin: 0 }}>₹{totalPaid.toLocaleString()}</p>
        </div>
        <div style={{ ...card, border: '1.5px solid #fecaca' }}>
          <p style={{ fontSize: '11px', color: '#dc2626', margin: '0 0 4px', fontWeight: 600, textTransform: 'uppercase' }}>Pending</p>
          <p style={{ fontSize: '28px', fontWeight: 900, color: '#dc2626', margin: 0 }}>₹{totalPending.toLocaleString()}</p>
        </div>
      </div>

      <div style={card}>
        <p style={{ fontSize: '14px', fontWeight: 800, color: '#1c1917', margin: '0 0 14px' }}>July 2025 — All Bills</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {bills.map((b) => (
            <div key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', background: '#fafaf7', borderRadius: '12px', border: '1px solid #f0ece4' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '13px', fontWeight: 700, color: '#1c1917', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{b.name}</p>
                <p style={{ fontSize: '12px', fontWeight: 800, color: '#44403c', margin: '2px 0 0' }}>₹{b.amount}</p>
              </div>
              <button onClick={() => togglePaid(b.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, flexShrink: 0 }}>
                <PayBadge status={b.status} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Announcements Page ────────────────────────────────────────────────────────
function PageAnnounce() {
  const [msg, setMsg] = useState('');
  const [date, setDate] = useState('');
  const [sent, setSent] = useState(false);
  const [announcements] = useState([
    { text: 'No delivery on 19 Jul — Farm Maintenance.', date: '19 Jul 2025', sentTo: 152 },
    { text: 'No delivery on 15 Aug — Independence Day.', date: '15 Aug 2025', sentTo: 152 },
  ]);

  function handleSend(e) {
    e.preventDefault();
    if (!msg) return;
    setSent(true);
    setTimeout(() => setSent(false), 3000);
    setMsg(''); setDate('');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '600px' }}>
      <div style={card}>
        <p style={{ fontSize: '14px', fontWeight: 800, color: '#1c1917', margin: '0 0 16px' }}>Send Announcement</p>
        <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#78716c', display: 'block', marginBottom: '6px' }}>Message</label>
            <textarea value={msg} onChange={e => setMsg(e.target.value)} rows={3}
              placeholder="e.g. No delivery on 19 Jul due to farm maintenance..."
              style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #e8e4dc', fontSize: '13px', color: '#44403c', outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#78716c', display: 'block', marginBottom: '6px' }}>Date (optional)</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              style={{ padding: '10px 14px', borderRadius: '12px', border: '1.5px solid #e8e4dc', fontSize: '13px', color: '#44403c', outline: 'none' }} />
          </div>
          <button type="submit"
            style={{ padding: '12px 20px', borderRadius: '12px', background: '#3d5a3e', border: 'none', color: 'white', fontSize: '13px', fontWeight: 700, cursor: 'pointer', alignSelf: 'flex-start' }}>
            {sent ? '✓ Sent to all customers!' : 'Send to All Customers (152)'}
          </button>
        </form>
      </div>

      <div style={card}>
        <p style={{ fontSize: '14px', fontWeight: 800, color: '#1c1917', margin: '0 0 14px' }}>Past Announcements</p>
        {announcements.map((a, i) => (
          <div key={i} style={{ padding: '12px', background: '#f5f0e8', borderRadius: '12px', marginBottom: '10px' }}>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#1c1917', margin: '0 0 6px' }}>{a.text}</p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <span style={{ fontSize: '11px', color: '#a8a29e' }}>📅 {a.date}</span>
              <span style={{ fontSize: '11px', color: '#a8a29e' }}>👥 Sent to {a.sentTo} customers</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const PAGE_TITLES = {
    overview:   'Overview',
    customers:  'Customers',
    deliveries: 'Deliveries',
    billing:    'Billing',
    announce:   'Announcements',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f5f0e8' }}>
      {/* Header */}
      <div style={{ background: '#1c1917', padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 30 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', padding: '4px' }}>
            <Menu size={22} />
          </button>
          <Logo size={28} />
          <div>
            <p style={{ fontSize: '13px', fontWeight: 800, color: 'white', margin: 0 }}>{PAGE_TITLES[activeTab]}</p>
            <p style={{ fontSize: '10px', color: '#c9a84c', margin: 0, fontWeight: 700 }}>Admin Panel · Demo</p>
          </div>
        </div>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#c9a84c', background: 'rgba(201,168,76,0.15)', padding: '5px 12px', borderRadius: '100px' }}>
          {ADMIN_STATS.totalCustomers} Customers
        </span>
      </div>

      <Sidebar open={sidebarOpen} close={() => setSidebarOpen(false)} active={activeTab} setActive={setActiveTab} />

      {/* Content */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '24px 20px' }}>
        {activeTab === 'overview'   && <PageOverview />}
        {activeTab === 'customers'  && <PageCustomers />}
        {activeTab === 'deliveries' && <PageDeliveries />}
        {activeTab === 'billing'    && <PageBilling />}
        {activeTab === 'announce'   && <PageAnnounce />}

        <p style={{ textAlign: 'center', fontSize: '11px', color: '#c8c4be', margin: '32px 0 8px' }}>
          Demo mode — data is not real
        </p>
      </div>
    </div>
  );
}
