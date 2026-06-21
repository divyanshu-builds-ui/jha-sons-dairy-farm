import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Listen for install prompt
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      window.__lgInstallPrompt = e;
      // Show prompt only if not dismissed before
      const dismissed = localStorage.getItem('lg_install_dismissed');
      if (!dismissed) {
        setTimeout(() => setShow(true), 3000); // Show after 3 seconds
      }
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShow(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem('lg_install_dismissed', 'true');
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-24 lg:bottom-6 left-4 right-4 z-50 max-w-sm mx-auto"
        >
          <div className="bg-white dark:bg-[#111111] rounded-3xl p-5 shadow-2xl border border-gray-100 dark:border-[#222222]">
            <button onClick={handleDismiss} className="absolute top-4 right-4 w-7 h-7 bg-gray-100 dark:bg-[#1a1a1a] rounded-full flex items-center justify-center text-gray-400">
              <X size={14} />
            </button>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-gradient-to-br from-royal-600 to-mint-600 rounded-2xl flex items-center justify-center shadow-lg">
                <Download size={24} className="text-white" />
              </div>
              <div>
                <h3 className="font-extrabold text-base text-gray-800 dark:text-white">Install Lucy Garden</h3>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">Get app-like experience</p>
              </div>
            </div>
            <div className="flex gap-3">
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleDismiss}
                className="flex-1 py-3 rounded-2xl font-bold text-sm text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-[#1a1a1a]">
                Not Now
              </motion.button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleInstall}
                className="flex-1 py-3 rounded-2xl font-bold text-sm text-white bg-gradient-to-r from-royal-700 via-royal-600 to-mint-700 shadow-lg shadow-royal-600/20">
                Install App
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
