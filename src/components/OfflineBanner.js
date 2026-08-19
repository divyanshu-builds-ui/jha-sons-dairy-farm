import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WifiOff, RefreshCw } from 'lucide-react';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [showBack, setShowBack] = useState(false);

  useEffect(() => {
    const goOffline = () => { setIsOffline(true); setShowBack(false); };
    const goOnline = () => { setShowBack(true); setTimeout(() => setShowBack(false), 3000); setIsOffline(false); };
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => { window.removeEventListener('offline', goOffline); window.removeEventListener('online', goOnline); };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[200] bg-gradient-to-r from-red-600 to-red-500 text-white px-4 py-3 flex items-center justify-center gap-3 shadow-lg">
          <WifiOff size={16} />
          <span className="text-sm font-bold">No Internet Connection</span>
          <motion.button whileTap={{ scale: 0.9 }} onClick={() => window.location.reload()}
            className="ml-2 p-1.5 bg-white/20 rounded-lg hover:bg-white/30">
            <RefreshCw size={14} />
          </motion.button>
        </motion.div>
      )}
      {showBack && !isOffline && (
        <motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[200] bg-green-600 text-white px-4 py-3 flex items-center justify-center gap-3 shadow-lg">
          <span className="text-sm font-bold">✓ Back Online</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
