import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();

  // Auto-redirect logged-in users to their home
  useEffect(() => {
    try {
      const saved = localStorage.getItem('lg_user');
      if (saved) {
        const user = JSON.parse(saved);
        if (user.role === 'admin') { navigate('/admin', { replace: true }); return; }
        if (user.role === 'retailer') { navigate('/', { replace: true }); return; }
      }
    } catch (e) {}
  }, [navigate]);

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-royal-950 via-royal-900 to-royal-800 flex items-center justify-center p-6 overflow-hidden">
      <div className="absolute top-0 left-0 w-72 h-72 bg-mint-500/8 rounded-full blur-3xl -translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-royal-400/8 rounded-full blur-3xl translate-x-1/4 translate-y-1/4" />

      <div className="text-center relative z-10 w-full max-w-xs">
        <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="text-8xl sm:text-[120px] font-black leading-none bg-gradient-to-b from-white to-white/30 bg-clip-text text-transparent">
          404
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="text-xl sm:text-2xl font-extrabold text-white mt-4">
          Page Not Found
        </motion.h1>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
          className="text-sm sm:text-base text-royal-200 mt-3">
          The page you're looking for doesn't exist or has been moved.
        </motion.p>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          className="flex flex-col gap-3 mt-8">
          <Link to={(() => { try { const u = JSON.parse(localStorage.getItem('lg_user') || '{}'); return u.role === 'admin' ? '/admin' : '/'; } catch(e) { return '/'; } })()}>
            <motion.button whileTap={{ scale: 0.97 }}
              className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-gradient-to-r from-royal-600 via-royal-500 to-mint-600 text-white font-bold text-base rounded-2xl shadow-lg shadow-royal-600/25">
              <Home size={18} /> Go Home
            </motion.button>
          </Link>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 w-full px-6 py-4 bg-white/10 backdrop-blur-sm text-white font-bold text-base rounded-2xl border border-white/10">
            <ArrowLeft size={18} /> Go Back
          </motion.button>
        </motion.div>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9 }}
          className="text-xs text-royal-400/50 mt-10">
          Lucy Garden • Fresh Dairy Supply
        </motion.p>
      </div>
    </div>
  );
}
