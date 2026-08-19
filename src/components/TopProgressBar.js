import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

let showProgress = () => {};
let hideProgress = () => {};

export function triggerProgress() { showProgress(); }
export function stopProgress() { hideProgress(); }

export default function TopProgressBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    showProgress = () => setVisible(true);
    hideProgress = () => setVisible(false);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { delay: 0.2 } }}
          className="fixed top-0 left-0 right-0 z-[9999] h-[3px]"
        >
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: ['0%', '60%', '80%', '90%'] }}
            transition={{ duration: 2, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-royal-500 via-mint-500 to-royal-500 rounded-r-full shadow-sm shadow-royal-500/50"
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Suspense fallback component — shows skeleton with dark support
export function PageLoader() {
  useEffect(() => {
    triggerProgress();
    return () => stopProgress();
  }, []);
  return (
    <div className="p-4 lg:p-6 space-y-4 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 dark:bg-[#111111] rounded-xl" />
      <div className="h-32 bg-gray-200 dark:bg-[#111111] rounded-2xl" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 bg-gray-200 dark:bg-[#111111] rounded-2xl" />
        <div className="h-24 bg-gray-200 dark:bg-[#111111] rounded-2xl" />
      </div>
      <div className="h-48 bg-gray-200 dark:bg-[#111111] rounded-2xl" />
    </div>
  );
}
