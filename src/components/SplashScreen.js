import React from 'react';
import { motion } from 'framer-motion';
import logo from '../assets/logo.png';

// Launch date: 2 June 2026 — premium splash for 30 days (until 2 July 2026)
const LAUNCH_DATE = '2026-06-02';

const isLaunchPeriod = () => {
  const launch = new Date(LAUNCH_DATE + 'T00:00:00');
  const now = new Date();
  const diff = (now - launch) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 30;
};

function LaunchSplash() {
  return (
    <div className="min-h-screen bg-royal-950 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Brand gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-royal-900/50 via-transparent to-royal-950" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(34,199,122,0.06)_0%,_transparent_60%)]" />

      {/* Top accent */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-mint-500 to-transparent origin-center" />

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: 'spring', stiffness: 120, damping: 14 }}
        className="relative z-10">
        <motion.div
          animate={{ opacity: [0.2, 0.5, 0.2] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="absolute inset-[-10px] bg-mint-500/15 rounded-3xl blur-xl" />
        <img src={logo} alt="Lucy Garden" className="relative w-24 h-24 rounded-2xl object-cover shadow-2xl ring-2 ring-mint-500/30" />
      </motion.div>

      {/* Brand */}
      <motion.h1
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="text-[34px] font-black text-white mt-6 tracking-tight relative z-10">
        Lucy Garden
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.4 }}
        className="text-mint-400 text-[11px] font-bold tracking-[0.25em] uppercase mt-1.5 relative z-10">
        Fresh Dairy Supply
      </motion.p>

      {/* Launch badge */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="mt-6 relative z-10">
        <div className="px-5 py-2.5 rounded-xl bg-white/[0.04] border border-mint-500/20">
          <p className="text-[12px] text-white/90 font-bold text-center">
            Introducing — Your Digital Dairy Partner
          </p>
          <p className="text-[10px] text-mint-300/50 text-center mt-0.5 font-medium">
            Order • Track • Manage • Grow
          </p>
        </div>
      </motion.div>

      {/* Loading */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8 }}
        className="mt-8 relative z-10 w-32">
        <div className="h-[2px] bg-white/[0.08] rounded-full overflow-hidden">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ delay: 1.8, duration: 1.2, ease: 'easeInOut' }}
            className="h-full bg-gradient-to-r from-royal-500 via-mint-500 to-royal-400 rounded-full" />
        </div>
      </motion.div>

      {/* Bottom */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="absolute bottom-6 z-10 text-[10px] text-white/30 font-medium">
        Developed by <span className="text-white/50 font-semibold">Divyanshu Gupta</span>
      </motion.p>

      {/* Bottom accent */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.8, duration: 0.6 }}
        className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-royal-500/30 to-transparent origin-center" />
    </div>
  );
}

function NormalSplash() {
  return (
    <div className="min-h-screen bg-royal-950 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(1,54,228,0.08)_0%,_transparent_60%)]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative z-10">
        <img src={logo} alt="Lucy Garden" className="w-20 h-20 rounded-2xl object-cover shadow-xl ring-1 ring-white/10" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="text-2xl font-black text-white mt-4 tracking-tight relative z-10">
        Lucy Garden
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="text-mint-400/60 text-[10px] font-semibold tracking-[0.2em] uppercase mt-1 relative z-10">
        Fresh Dairy Supply
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="mt-6 relative z-10 w-20">
        <div className="h-[2px] bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
            className="h-full w-1/2 bg-gradient-to-r from-transparent via-mint-400/50 to-transparent" />
        </div>
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-6 text-[10px] text-white/25 font-medium z-10">
        Developed by <span className="text-white/40 font-semibold">Divyanshu Gupta</span>
      </motion.p>
    </div>
  );
}

export default function SplashScreen() {
  return isLaunchPeriod() ? <LaunchSplash /> : <NormalSplash />;
}
