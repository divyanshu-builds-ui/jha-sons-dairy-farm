import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Phone, MapPin, Store, Calendar, Shield, LogOut, Clock, Smartphone,
  ChevronRight, BookOpen, IndianRupee, Settings, Headphones, GraduationCap,
  History, Package,
} from 'lucide-react';
import { db, collection, query, where, getDocs, doc, getDoc } from '../../services/firebase';
import { useConfirm } from '../../components/ConfirmModal';

export default function Profile() {
  const confirm = useConfirm();
  const user = JSON.parse(localStorage.getItem('lg_user') || '{}');
  const [totalOrders, setTotalOrders] = useState(null);
  const [loginInfo, setLoginInfo] = useState({ lastLogin: null, device: null });

  useEffect(() => {
    async function fetchStats() {
      try {
        const snap = await getDocs(query(collection(db, 'orders'), where('phone', '==', user.phone)));
        setTotalOrders(snap.size);
        const userDoc = await getDoc(doc(db, 'users', user.phone));
        if (userDoc.exists()) {
          const d = userDoc.data();
          const device = d.lastLoginDevice || parseDeviceName(d.lastDevice);
          setLoginInfo({ lastLogin: d.lastLogin || null, device: device || null });
        }
      } catch {}
    }
    fetchStats();
  }, [user.phone]);

  const parseDeviceName = (ua) => {
    if (!ua) return null;
    if (ua.includes('iPhone')) return 'iPhone';
    if (ua.includes('iPad')) return 'iPad';
    if (ua.includes('Android')) return 'Android';
    if (ua.includes('Windows')) return 'Windows PC';
    if (ua.includes('Mac')) return 'Mac';
    return null;
  };

  const handleLogout = async () => {
    const ok = await confirm({ title: 'Logout', message: 'Are you sure you want to logout?', confirmText: 'Logout', type: 'logout' });
    if (ok) {
      const phone = sessionStorage.getItem('lg_active_phone');
      if (phone) { localStorage.removeItem(`lg_user_${phone}`); localStorage.removeItem(`lg_last_verify_${phone}`); }
      localStorage.removeItem('lg_user'); sessionStorage.removeItem('lg_active_phone'); window.location.reload();
    }
  };

  const joinedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
    : null;

  const menuSections = [
    {
      title: 'Orders',
      items: [
        { to: '/track',   Icon: Package,     label: 'My Orders',    sub: 'Track current orders' },
        { to: '/history', Icon: History,     label: 'Order History', sub: 'Past orders & reorder' },
      ],
    },
    {
      title: 'Finance',
      items: [
        { to: '/my-ledger', Icon: BookOpen,    label: 'My Ledger',  sub: 'Dues & payment history' },
        { to: '/prices',    Icon: IndianRupee, label: 'Price List', sub: 'Current product prices' },
      ],
    },
    {
      title: 'Support',
      items: [
        { to: '/support', Icon: Headphones,    label: 'Support',    sub: 'Help & raise a ticket' },
        { to: '/guide',   Icon: GraduationCap, label: 'User Guide', sub: 'How to use the app' },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { to: '/settings', Icon: Settings, label: 'Settings', sub: 'App preferences' },
      ],
    },
  ];

  return (
    <div className="pb-24 max-w-2xl mx-auto space-y-4">

      {/* User Card */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #1b3557 0%, #162d4a 100%)' }}>

        <div className="px-5 pt-5 pb-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/15 flex items-center justify-center text-2xl font-black text-white shrink-0">
            {user.name?.[0] || 'U'}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-white leading-tight break-words">{user.name || 'User'}</h2>
            {user.shop && <p className="text-sm text-white/50 truncate">{user.shop}</p>}
            <div className="flex items-center gap-1 mt-1">
              <Shield size={10} className="text-green-400" />
              <span className="text-[10px] text-green-400 font-semibold">Verified Retailer</span>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 divide-x divide-white/10 border-t border-white/10">
          <div className="px-3 py-3 text-center">
            <p className="text-base font-bold text-white font-mono">{totalOrders ?? '—'}</p>
            <p className="text-[9px] text-white/35 mt-0.5">Orders</p>
          </div>
          <div className="px-3 py-3 text-center">
            <p className="text-base font-bold text-white">{user.area || '—'}</p>
            <p className="text-[9px] text-white/35 mt-0.5">Area</p>
          </div>
          <div className="px-3 py-3 text-center">
            <p className="text-base font-bold text-white">{joinedDate || '—'}</p>
            <p className="text-[9px] text-white/35 mt-0.5">Since</p>
          </div>
        </div>
      </motion.div>

      {/* Account Info */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-white dark:bg-[#1a1917] border border-warm-200 dark:border-[#2e2d2b] rounded-xl overflow-hidden divide-y divide-warm-100 dark:divide-[#2e2d2b]">
        {[
          { Icon: Phone,      label: 'Phone',      value: `+91 ${user.phone || ''}` },
          { Icon: Store,      label: 'Shop',       value: user.shop || '—' },
          { Icon: MapPin,     label: 'Address',    value: user.address || user.area || '—' },
          ...(joinedDate ? [{ Icon: Calendar, label: 'Member Since', value: joinedDate }] : []),
          ...(loginInfo.lastLogin ? [{ Icon: Clock, label: 'Last Login', value: new Date(loginInfo.lastLogin).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }] : []),
          ...(loginInfo.device ? [{ Icon: Smartphone, label: 'Device', value: loginInfo.device }] : []),
        ].map(({ Icon, label, value }, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Icon size={14} className="text-warm-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-warm-400">{label}</p>
              <p className="text-sm font-medium text-warm-800 dark:text-warm-100 truncate">{value}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Menu Sections */}
      {menuSections.map((section, si) => (
        <motion.div key={section.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 + si * 0.04 }}>
          <p className="text-[10px] font-bold text-warm-400 uppercase tracking-widest mb-1.5 px-1">{section.title}</p>
          <div className="bg-white dark:bg-[#1a1917] border border-warm-200 dark:border-[#2e2d2b] rounded-xl overflow-hidden divide-y divide-warm-100 dark:divide-[#2e2d2b]">
            {section.items.map(({ to, Icon, label, sub }) => (
              <Link key={to} to={to}>
                <div className="flex items-center gap-3 px-4 py-3.5 hover:bg-warm-50 dark:hover:bg-[#222] transition-colors">
                  <div className="w-8 h-8 bg-warm-100 dark:bg-[#2e2d2b] rounded-lg flex items-center justify-center shrink-0">
                    <Icon size={15} className="text-warm-600 dark:text-warm-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-warm-800 dark:text-warm-100">{label}</p>
                    <p className="text-[10px] text-warm-400">{sub}</p>
                  </div>
                  <ChevronRight size={14} className="text-warm-300 shrink-0" />
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      ))}

      {/* Logout */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }}>
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/40 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors">
          <LogOut size={15} /> Logout
        </button>
      </motion.div>

    </div>
  );
}
