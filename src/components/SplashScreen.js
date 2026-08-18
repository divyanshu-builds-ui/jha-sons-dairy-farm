import React from 'react';
import { motion } from 'framer-motion';
import logo from '../assets/logo.png';

const LAUNCH_DATE = '2026-06-02';

const isLaunchPeriod = () => {
  const launch = new Date(LAUNCH_DATE + 'T00:00:00');
  const diff = (new Date() - launch) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 30;
};

function LaunchSplash() {
  return (
    <div className="min-h-screen bg-navy-800 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(255,255,255,0.04)_0%,_transparent_60%)]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, type: 'spring', stiffness: 120, damping: 14 }}
        className="relative z-10">
        <img src={logo} alt="Lucy Garden" className="w-20 h-20 rounded-lg object-cover shadow-xl ring-1 ring-white/10" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="text-2xl font-bold text-white mt-5 tracking-tight relative z-10">
        Lucy Garden
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-white/40 text-[11px] font-medium tracking-[0.2em] uppercase mt-1 relative z-10">
        Fresh Dairy Supply
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="mt-5 px-4 py-2 rounded-md bg-white/5 border border-white/10 relative z-10">
        <p className="text-[11px] text-white/70 font-medium text-center">
          Introducing — Your Digital Dairy Partner
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="mt-8 relative z-10 w-24">
        <div className="h-[2px] bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ delay: 1.5, duration: 1.2, ease: 'easeInOut' }}
            className="h-full bg-white/30 rounded-full" />
        </div>
      </motion.div>
    </div>
  );
}

function NormalSplash() {
  return (
    <div className="min-h-screen bg-navy-800 flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative z-10">
        <img src={logo} alt="Lucy Garden" className="w-16 h-16 rounded-lg object-cover shadow-lg ring-1 ring-white/10" />
      </motion.div>

      <motion.h1
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15 }}
        className="text-xl font-bold text-white mt-4 tracking-tight">
        Lucy Garden
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="text-white/30 text-[10px] font-medium tracking-[0.2em] uppercase mt-1">
        Fresh Dairy Supply
      </motion.p>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="mt-6 w-16">
        <div className="h-[2px] bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
            className="h-full w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>
      </motion.div>
    </div>
  );
}

export default function SplashScreen() {
  return isLaunchPeriod() ? <LaunchSplash /> : <NormalSplash />;
}
