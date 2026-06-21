import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Phone, MapPin, Store, Calendar, Shield, LogOut, Clock, Smartphone } from 'lucide-react';
import { db, collection, query, where, getDocs, doc, getDoc } from '../../services/firebase';
import { useConfirm } from '../../components/ConfirmModal';
import { ProfileSkeleton } from '../../components/LoadingSkeleton';

const fadeUp = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } };

export default function Profile() {
  const confirm = useConfirm();
  const user = JSON.parse(localStorage.getItem('lg_user') || '{}');
  const [totalOrders, setTotalOrders] = useState(0);
  const [loading, setLoading] = useState(true);
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
      } catch (err) {}
      setLoading(false);
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
    if (ua.includes('Linux')) return 'Linux';
    return null;
  };

  const handleLogout = async () => {
    const ok = await confirm({ title: 'Logout', message: 'Are you sure you want to logout?', confirmText: 'Logout', type: 'logout' });
    if (ok) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const joinedDate = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'N/A';

  return (
    <div className="pb-24 space-y-5 max-w-2xl mx-auto">
      <motion.h2 {...fadeUp} className="text-xl font-extrabold text-gray-800 dark:text-white sr-only">Profile</motion.h2>

      {/* Profile Card */}
      <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="card text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-royal-800 via-royal-600 to-mint-500 rounded-t-2xl" />
        <div className="relative pt-10">
          <motion.div whileHover={{ scale: 1.05 }}
            className="w-20 h-20 bg-gradient-to-br from-royal-600 to-mint-500 rounded-2xl flex items-center justify-center mx-auto text-3xl text-white font-black shadow-xl border-4 border-white dark:border-[#222222]">
            {user.name?.[0] || 'U'}
          </motion.div>
          <h3 className="font-extrabold text-2xl text-gray-800 dark:text-white mt-4">{user.name || 'User'}</h3>
          <p className="text-base text-gray-400 dark:text-gray-500 font-medium mt-1">+91 {user.phone || ''}</p>
          <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-bold bg-mint-100 text-mint-700 px-3 py-1 rounded-full border border-mint-200">
            <Shield size={10} /> Verified Retailer
          </span>

          <div className="mt-5 pt-5 border-t border-gray-100 dark:border-[#222222] grid grid-cols-3 gap-4">
            <div>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Total Orders</p>
              <p className="font-extrabold text-royal-800 dark:text-royal-300 text-sm mt-0.5">{loading ? '...' : totalOrders}</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Since</p>
              <p className="font-extrabold text-royal-800 dark:text-royal-300 text-sm mt-0.5">{joinedDate}</p>
            </div>
            <div>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">Area</p>
              <p className="font-extrabold text-royal-800 dark:text-royal-300 text-sm mt-0.5">{user.area || 'N/A'}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Details */}
      <motion.div {...fadeUp} transition={{ delay: 0.2 }} className="card !p-0 overflow-hidden divide-y divide-gray-50 dark:divide-gray-700">
        {[
          { Icon: Phone, label: 'Phone', value: `+91 ${user.phone || ''}` },
          { Icon: Store, label: 'Shop Name', value: user.shop || 'N/A' },
          { Icon: MapPin, label: 'Area', value: user.area || 'N/A' },
          { Icon: MapPin, label: 'Address', value: user.address || 'N/A' },
          { Icon: Calendar, label: 'Joined', value: joinedDate },
          ...(loginInfo.lastLogin ? [{ Icon: Clock, label: 'Last Login', value: new Date(loginInfo.lastLogin).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) }] : []),
          ...(loginInfo.device ? [{ Icon: Smartphone, label: 'Device', value: loginInfo.device }] : []),
        ].map((item, i) => (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i }}
            className="flex items-center gap-4 px-5 py-4">
            <div className="w-10 h-10 bg-gradient-to-br from-royal-50 to-mint-50 dark:from-[#1a1a1a] dark:to-[#222222] rounded-xl flex items-center justify-center border border-royal-100/30 dark:border-[#333333]">
              <item.Icon size={16} className="text-royal-600 dark:text-royal-300" strokeWidth={2} />
            </div>
            <div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider">{item.label}</p>
              <p className="text-base font-semibold text-gray-800 dark:text-white">{item.value}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Logout */}
      <motion.div {...fadeUp} transition={{ delay: 0.3 }}>
        <motion.button whileTap={{ scale: 0.97 }} onClick={handleLogout}
          className="w-full card !p-5 flex items-center justify-center gap-3 border border-red-100 dark:border-red-900/30 hover:bg-red-50/50 dark:hover:bg-red-900/20 transition-colors cursor-pointer">
          <LogOut size={18} className="text-red-500" />
          <p className="text-base font-bold text-red-500">Logout</p>
        </motion.button>
      </motion.div>
    </div>
  );
}
