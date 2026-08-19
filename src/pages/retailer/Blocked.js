import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldOff, Phone, MessageSquare, IndianRupee, Clock, ArrowRight, AlertCircle } from 'lucide-react';
import { db, doc, getDoc, collection, getDocs, query, where } from '../../services/firebase';
import { formatPrice } from '../../utils/price';
import { Link } from 'react-router-dom';

export default function Blocked() {
  const user = JSON.parse(localStorage.getItem('lg_user') || '{}');
  const [balance, setBalance] = useState(0);
  const [blockInfo, setBlockInfo] = useState({});

  useEffect(() => {
    async function fetch() {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.phone));
        if (userDoc.exists()) setBlockInfo(userDoc.data());
        // Calculate due from ledger (source of truth)
        const ledgerSnap = await getDocs(query(collection(db, 'ledger'), where('retailerId', '==', user.phone)));
        const entries = ledgerSnap.docs.map(d => d.data());
        const due = entries.reduce((sum, e) => e.type === 'debit' ? sum + (e.amount || 0) : sum - (e.amount || 0), 0);
        setBalance(due);
      } catch (e) {}
    }
    fetch();
  }, [user.phone]);

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-5">

        {/* Header */}
        <div className="text-center">
          <motion.div initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="w-20 h-20 bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-900/10 border-2 border-red-200 dark:border-red-800 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-100/50 dark:shadow-none">
            <ShieldOff size={32} className="text-red-500" />
          </motion.div>
          <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="text-xl font-black text-gray-800 dark:text-white">Account Suspended</motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-sm text-gray-400 dark:text-gray-500 mt-1">Your account access is temporarily restricted</motion.p>
        </div>

        {/* Info Card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#222222] overflow-hidden shadow-sm">

          {/* Reason */}
          {blockInfo.blockReason && (
            <div className="px-4 py-3.5 border-b border-gray-100 dark:border-[#222222]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-red-50 dark:bg-red-900/20 rounded-lg flex items-center justify-center shrink-0">
                  <AlertCircle size={14} className="text-red-500" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Reason</p>
                  <p className="text-sm font-bold text-gray-800 dark:text-white">{blockInfo.blockReason}</p>
                </div>
              </div>
            </div>
          )}

          {/* Due Amount */}
          {balance > 0 && (
            <div className="px-4 py-3.5 border-b border-gray-100 dark:border-[#222222] bg-red-50/50 dark:bg-red-900/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center shrink-0">
                    <IndianRupee size={14} className="text-red-600" />
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Outstanding Dues</p>
                    <p className="text-lg font-black text-red-600">{formatPrice(balance)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Blocked Since */}
          {blockInfo.blockedAt && (
            <div className="px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-gray-100 dark:bg-[#1a1a1a] rounded-lg flex items-center justify-center shrink-0">
                  <Clock size={14} className="text-gray-500" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Suspended Since</p>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                    {new Date(blockInfo.blockedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="space-y-2.5">
          <Link to="/support?reason=unblock">
            <motion.div whileTap={{ scale: 0.97 }}
              className="w-full flex items-center justify-between px-5 py-4 bg-gradient-to-r from-royal-700 to-royal-600 text-white rounded-2xl shadow-lg shadow-royal-600/20">
              <div className="flex items-center gap-3">
                <MessageSquare size={18} />
                <div>
                  <p className="text-sm font-bold">Request Unblock</p>
                  <p className="text-[10px] text-white/60">Raise a support ticket</p>
                </div>
              </div>
              <ArrowRight size={16} className="text-white/70" />
            </motion.div>
          </Link>

          <a href="tel:+919939079107">
            <motion.div whileTap={{ scale: 0.97 }}
              className="w-full flex items-center justify-between px-5 py-4 bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#222222] rounded-2xl mt-2.5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center">
                  <Phone size={16} className="text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800 dark:text-white">Call Admin</p>
                  <p className="text-[10px] text-gray-400">For immediate help</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-gray-400">9939079107</span>
            </motion.div>
          </a>
        </motion.div>

        {/* Footer note */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
          className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
          <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium text-center leading-relaxed">
            {balance > 0
              ? 'Clear your outstanding dues to get your account restored. Contact admin for payment details.'
              : 'Contact admin to understand why your account was suspended and get it restored.'}
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
