import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, GraduationCap, Star, Sparkles, ChevronRight, ArrowRight } from 'lucide-react';
import { db, collection, addDoc } from '../services/firebase';

const STORAGE_KEY = 'lg_welcome_done';

export default function WelcomePopup() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);
  const [rating, setRating] = useState(0);
  const [ratingSubmitted, setRatingSubmitted] = useState(false);

  const user = JSON.parse(localStorage.getItem('lg_user') || '{}');

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;
    if (!user.phone) return;
    // Check Firebase if welcome already shown
    (async () => {
      try {
        const { getDoc } = await import('firebase/firestore');
        const { doc: fbDoc } = await import('../services/firebase');
        const snap = await getDoc(fbDoc(db, 'users', user.phone));
        if (snap.exists() && snap.data().welcomeDone) {
          localStorage.setItem(STORAGE_KEY, 'true');
          return;
        }
      } catch (e) {}
      const timer = setTimeout(() => setShow(true), 2000);
      return () => clearTimeout(timer);
    })();
  }, []);

  const markDone = async () => {
    setShow(false);
    localStorage.setItem(STORAGE_KEY, 'true');
    // Save to Firebase so it never shows again even after cache clear
    try {
      const { updateDoc } = await import('firebase/firestore');
      const { doc: fbDoc } = await import('../services/firebase');
      if (user.phone) await updateDoc(fbDoc(db, 'users', user.phone), { welcomeDone: true });
    } catch (e) {}
  };

  const next = () => {
    if (step < 2) setStep(s => s + 1);
    else markDone();
  };

  const submitRating = async () => {
    if (rating === 0) return;
    try {
      // Prevent duplicate
      const { getDocs, query, where } = await import('firebase/firestore');
      const q = query(collection(db, 'app_ratings'), where('phone', '==', user.phone || ''));
      const existing = await getDocs(q);
      if (!existing.empty) { setRatingSubmitted(true); setTimeout(markDone, 1500); return; }
      await addDoc(collection(db, 'app_ratings'), {
        phone: user.phone || '',
        name: user.name || '',
        rating,
        createdAt: new Date(),
        device: navigator.userAgent?.slice(0, 100) || '',
      });
    } catch (err) {}
    setRatingSubmitted(true);
    setTimeout(markDone, 1500);
  };

  if (!show) return null;

  const slides = [
    {
      icon: Rocket,
      gradient: 'from-royal-600 via-royal-500 to-mint-500',
      iconBg: 'bg-royal-500/20',
      title: 'Install the App 🚀',
      desc: 'Add Lucy Garden to your Home Screen for a fast, app-like experience. Tap 3-dot menu (⋮) → Add to Home Screen.',
      action: 'Install Now',
      onAction: async () => {
        if (window.__lgInstallPrompt) {
          window.__lgInstallPrompt.prompt();
          await window.__lgInstallPrompt.userChoice;
          window.__lgInstallPrompt = null;
        }
        next();
      },
      skip: 'Not now',
    },
    {
      icon: GraduationCap,
      gradient: 'from-amber-500 via-orange-500 to-red-500',
      iconBg: 'bg-amber-500/20',
      title: 'How to use the App? 📖',
      desc: 'Learn how to place orders, track delivery & view ledger — step by step in just 2 minutes!',
      action: 'View Guide',
      onAction: () => {
        markDone();
        window.location.href = '/guide';
      },
      skip: "I'll explore myself",
    },
    {
      icon: Star,
      gradient: 'from-purple-600 via-pink-500 to-rose-500',
      iconBg: 'bg-purple-500/20',
      title: 'Rate the App ⭐',
      desc: 'Your rating helps us improve and serve you better.',
      isRating: true,
      skip: 'Maybe later',
    },
  ];

  const current = slides[step];

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-5">
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.85, opacity: 0, y: 30 }}
          transition={{ type: 'spring', damping: 22, stiffness: 260 }}
          className="bg-white dark:bg-[#111111] rounded-[28px] w-full max-w-[340px] overflow-hidden shadow-2xl relative">

          {/* Top gradient bar */}
          <div className={`h-1.5 bg-gradient-to-r ${current.gradient}`} />

          {/* Content */}
          <div className="relative px-6 pt-8 pb-6">
            {/* Step indicator */}
            <div className="flex items-center justify-center gap-1.5 mb-6">
              {[0, 1, 2].map(i => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? `w-6 bg-gradient-to-r ${current.gradient}` : i < step ? 'w-1.5 bg-mint-400' : 'w-1.5 bg-gray-200 dark:bg-[#1a1a1a]'}`} />
              ))}
            </div>

            {/* Icon */}
            <motion.div key={step} initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', delay: 0.1 }}
              className={`w-16 h-16 ${current.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-5`}>
              <current.icon size={30} style={{ color: step === 0 ? '#3b5bdb' : step === 1 ? '#f59e0b' : '#a855f7' }} />
            </motion.div>

            {/* Title */}
            <motion.h2 key={`t-${step}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="text-xl font-black text-gray-800 dark:text-white text-center">
              {current.title}
            </motion.h2>

            {/* Description */}
            <motion.p key={`d-${step}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}
              className="text-sm text-gray-500 dark:text-gray-400 text-center mt-3 leading-relaxed">
              {current.desc}
            </motion.p>

            {/* Rating Stars */}
            {current.isRating && !ratingSubmitted && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="flex items-center justify-center gap-2.5 mt-5">
                {[1, 2, 3, 4, 5].map(i => (
                  <motion.button key={i} whileTap={{ scale: 0.8 }}
                    onClick={() => setRating(i)}
                    className="p-0.5">
                    <Star size={34} fill={i <= rating ? '#f59e0b' : 'none'}
                      className={`transition-colors ${i <= rating ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600'}`}
                      strokeWidth={i <= rating ? 0 : 1.5} />
                  </motion.button>
                ))}
              </motion.div>
            )}

            {/* Rating submitted */}
            {current.isRating && ratingSubmitted && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="flex flex-col items-center mt-5">
                <Sparkles size={28} className="text-amber-400 mb-2" />
                <p className="text-sm font-bold text-mint-600">Thank you! 🙏</p>
              </motion.div>
            )}

            {/* Buttons */}
            <div className="mt-6 space-y-2.5">
              {current.isRating ? (
                !ratingSubmitted && (
                  <>
                    <motion.button whileTap={{ scale: 0.97 }} onClick={submitRating}
                      disabled={rating === 0}
                      className={`w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r ${current.gradient} shadow-lg disabled:opacity-40 flex items-center justify-center gap-2`}>
                      <Sparkles size={16} /> Submit Rating
                    </motion.button>
                    <button onClick={markDone}
                      className="w-full py-2.5 text-[13px] font-semibold text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1">
                      {current.skip}
                    </button>
                  </>
                )
              ) : (
                <>
                  <motion.button whileTap={{ scale: 0.97 }} onClick={current.onAction}
                    className={`w-full py-3.5 rounded-2xl font-bold text-sm text-white bg-gradient-to-r ${current.gradient} shadow-lg flex items-center justify-center gap-2`}>
                    {current.action} <ArrowRight size={16} />
                  </motion.button>
                  <button onClick={next}
                    className="w-full py-2.5 text-[13px] font-semibold text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1">
                    {current.skip} <ChevronRight size={14} />
                  </button>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
