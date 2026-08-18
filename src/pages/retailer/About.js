import React from 'react';
import { motion } from 'framer-motion';
import { Truck, ShieldCheck, BarChart3, FileText, Headphones, Code2, ExternalLink } from 'lucide-react';
import { APP_CONFIG } from '../../utils/config';

const fadeUp = { initial: { opacity: 0, y: 14 }, animate: { opacity: 1, y: 0 } };

export default function About() {
  return (
    <div className="pb-24 space-y-6 max-w-3xl mx-auto">
      {/* Hero */}
      <motion.div {...fadeUp}
        className="relative bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] rounded-2xl p-6 text-white overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-royal-500/15 rounded-full blur-3xl" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-mint-500/10 rounded-full blur-2xl" />
        <div className="relative z-10 text-center">
          <h1 className="text-2xl font-black tracking-tight">{APP_CONFIG.appName}</h1>
          <p className="text-mint-400 text-xs font-bold tracking-[0.2em] uppercase mt-1">{APP_CONFIG.tagline}</p>
          <p className="text-white/40 text-[11px] mt-3">Version {APP_CONFIG.version}</p>
        </div>
      </motion.div>

      {/* About */}
      <motion.div {...fadeUp} transition={{ delay: 0.1 }}>
        <div className="card !p-6">
          <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-3">About Us</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            Lucy Garden is a fresh dairy supply management platform that connects retailers with quality dairy products. We ensure daily doorstep delivery of fresh milk, curd, paneer, ghee, and seasonal products to our retail partners across Madhubani, Bihar.
          </p>
        </div>
      </motion.div>

      {/* Features Grid */}
      <motion.div {...fadeUp} transition={{ delay: 0.15 }}>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { icon: Truck, label: 'Daily Delivery', desc: 'Fresh every morning', color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
            { icon: BarChart3, label: 'Order Tracking', desc: 'Real-time status', color: 'text-mint-600', bg: 'bg-mint-50 dark:bg-mint-900/20' },
            { icon: FileText, label: 'Digital Ledger', desc: 'Payments & invoices', color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
            { icon: ShieldCheck, label: 'Secure Platform', desc: 'PIN protected', color: 'text-royal-600', bg: 'bg-royal-50 dark:bg-royal-900/20' },
            { icon: Headphones, label: 'Dedicated Support', desc: 'WhatsApp + tickets', color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
            { icon: Code2, label: 'Modern PWA', desc: 'Install on any device', color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-[#111111]' },
          ].map((f, i) => (
            <div key={i} className="card !p-4 text-center">
              <div className={`w-10 h-10 ${f.bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
                <f.icon size={18} className={f.color} />
              </div>
              <p className="text-xs font-bold text-gray-800 dark:text-white">{f.label}</p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{f.desc}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Contact */}
      <motion.div {...fadeUp} transition={{ delay: 0.2 }}>
        <div className="card !p-5">
          <h3 className="text-sm font-bold text-gray-800 dark:text-white mb-3">Contact</h3>
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Phone</span>
              <a href={`tel:+91${APP_CONFIG.phone}`} className="text-sm font-bold text-gray-800 dark:text-white">{APP_CONFIG.phone}</a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">WhatsApp</span>
              <a href={`https://wa.me/91${APP_CONFIG.phone}`} target="_blank" rel="noreferrer" className="text-sm font-bold text-green-600">Chat →</a>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Delivery</span>
              <span className="text-sm font-bold text-gray-800 dark:text-white">6 AM – 12 PM</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Location</span>
              <span className="text-sm font-bold text-gray-800 dark:text-white">Madhubani, Bihar</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Developer Credit — Premium */}
      <motion.div {...fadeUp} transition={{ delay: 0.25 }}>
        <div className="card !p-5 bg-gradient-to-br from-gray-50 to-white dark:from-[#111111] dark:to-[#0a0a0a] border border-gray-100 dark:border-[#222222]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#0f172a] to-[#1e293b] rounded-xl flex items-center justify-center shadow-lg shrink-0">
              <Code2 size={20} className="text-mint-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Designed & Developed by</p>
              <p className="text-base font-black text-gray-800 dark:text-white mt-0.5">{APP_CONFIG.developer.name}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Web & App Development Agency</p>
            </div>
            <a href={APP_CONFIG.developer.portfolio} target="_blank" rel="noreferrer"
              className="w-9 h-9 bg-royal-50 dark:bg-royal-900/30 rounded-xl flex items-center justify-center border border-royal-100 dark:border-royal-800 hover:bg-royal-100 dark:hover:bg-royal-900/50 transition-colors shrink-0">
              <ExternalLink size={14} className="text-royal-600 dark:text-royal-400" />
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
