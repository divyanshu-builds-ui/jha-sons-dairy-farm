import React, { useState, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, LogOut, X, Info, CheckCircle2, ShieldAlert } from 'lucide-react';

const ConfirmContext = createContext();

const typeConfig = {
  danger: { icon: <Trash2 size={20} className="text-red-500" />, iconBg: 'bg-red-50 dark:bg-red-900/30', btn: 'bg-gradient-to-r from-red-600 to-red-500 shadow-red-500/20' },
  warning: { icon: <AlertTriangle size={20} className="text-amber-500" />, iconBg: 'bg-amber-50 dark:bg-amber-900/30', btn: 'bg-gradient-to-r from-amber-600 to-amber-500 shadow-amber-500/20' },
  logout: { icon: <LogOut size={20} className="text-red-500" />, iconBg: 'bg-red-50 dark:bg-red-900/30', btn: 'bg-gradient-to-r from-red-600 to-red-500 shadow-red-500/20' },
  info: { icon: <Info size={20} className="text-blue-500" />, iconBg: 'bg-blue-50 dark:bg-blue-900/30', btn: 'bg-gradient-to-r from-royal-700 to-royal-600 shadow-royal-600/20' },
  success: { icon: <CheckCircle2 size={20} className="text-green-500" />, iconBg: 'bg-green-50 dark:bg-green-900/30', btn: 'bg-gradient-to-r from-green-600 to-green-500 shadow-green-500/20' },
  critical: { icon: <ShieldAlert size={20} className="text-red-600" />, iconBg: 'bg-red-100 dark:bg-red-900/40', btn: 'bg-gradient-to-r from-red-700 to-red-600 shadow-red-600/20' },
};

function ConfirmModal({ isOpen, title, message, confirmText, cancelText, type, onConfirm, onCancel }) {
  const config = typeConfig[type] || typeConfig.warning;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onCancel}>
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 40 }}
        transition={{ type: 'spring', damping: 28, stiffness: 350 }}
        className="bg-gray-900 border border-gray-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl shadow-black/50"
        onClick={e => e.stopPropagation()}>

        {/* Icon + Content */}
        <div className="flex items-start gap-4 mb-5">
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', delay: 0.1, stiffness: 300 }}
            className={`w-11 h-11 ${config.iconBg} rounded-xl flex items-center justify-center shrink-0`}>
            {config.icon}
          </motion.div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[15px] text-white">{title}</h3>
            <p className="text-sm text-gray-400 mt-1 leading-relaxed">{message}</p>
          </div>
          <button onClick={onCancel} className="w-7 h-7 bg-gray-800 rounded-full flex items-center justify-center text-gray-500 hover:text-gray-300 shrink-0 transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="flex gap-3">
          <motion.button whileTap={{ scale: 0.97 }} onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-bold text-sm text-gray-300 bg-gray-800 hover:bg-gray-700 border border-gray-700 transition-colors">
            {cancelText || 'Cancel'}
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={onConfirm}
            className={`flex-1 py-3 rounded-xl font-bold text-sm text-white ${config.btn} shadow-md transition-colors`}>
            {confirmText || 'Confirm'}
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function ConfirmProvider({ children }) {
  const [state, setState] = useState({ isOpen: false, title: '', message: '', confirmText: '', cancelText: '', type: 'warning', resolve: null });

  const confirm = useCallback(({ title, message, confirmText, cancelText, type }) => {
    return new Promise(resolve => {
      setState({ isOpen: true, title, message, confirmText, cancelText, type: type || 'warning', resolve });
    });
  }, []);

  const handleConfirm = () => { state.resolve?.(true); setState(s => ({ ...s, isOpen: false })); };
  const handleCancel = () => { state.resolve?.(false); setState(s => ({ ...s, isOpen: false })); };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <AnimatePresence>
        {state.isOpen && (
          <ConfirmModal
            isOpen={state.isOpen}
            title={state.title}
            message={state.message}
            confirmText={state.confirmText}
            cancelText={state.cancelText}
            type={state.type}
            onConfirm={handleConfirm}
            onCancel={handleCancel}
          />
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  return useContext(ConfirmContext);
}
