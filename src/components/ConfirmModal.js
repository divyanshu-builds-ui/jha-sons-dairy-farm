import React, { useState, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, LogOut, X, Info, CheckCircle2, ShieldAlert } from 'lucide-react';

const ConfirmContext = createContext();

const typeConfig = {
  danger:   { icon: <Trash2 size={18} className="text-red-600" />,     iconBg: 'bg-red-50 dark:bg-red-950/40',    btn: 'bg-red-600 hover:bg-red-700' },
  warning:  { icon: <AlertTriangle size={18} className="text-amber-600" />, iconBg: 'bg-amber-50 dark:bg-amber-950/40', btn: 'bg-amber-600 hover:bg-amber-700' },
  logout:   { icon: <LogOut size={18} className="text-red-600" />,      iconBg: 'bg-red-50 dark:bg-red-950/40',    btn: 'bg-red-600 hover:bg-red-700' },
  info:     { icon: <Info size={18} className="text-navy-700" />,       iconBg: 'bg-navy-50 dark:bg-navy-950/40',  btn: 'bg-navy-700 hover:bg-navy-800' },
  success:  { icon: <CheckCircle2 size={18} className="text-green-700" />, iconBg: 'bg-green-50 dark:bg-green-950/40', btn: 'bg-green-700 hover:bg-green-800' },
  critical: { icon: <ShieldAlert size={18} className="text-red-700" />, iconBg: 'bg-red-100 dark:bg-red-950/50',   btn: 'bg-red-700 hover:bg-red-800' },
};

function ConfirmModal({ title, message, confirmText, cancelText, type, onConfirm, onCancel }) {
  const config = typeConfig[type] || typeConfig.warning;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-black/40 flex items-center justify-center p-4" onClick={onCancel}>
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 16 }}
        transition={{ type: 'spring', damping: 30, stiffness: 400 }}
        className="bg-white dark:bg-[#1a1917] border border-warm-200 dark:border-[#2e2d2b] rounded-lg p-5 w-full max-w-sm shadow-md"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-start gap-3 mb-4">
          <div className={`w-9 h-9 ${config.iconBg} rounded-md flex items-center justify-center shrink-0`}>
            {config.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm text-warm-800 dark:text-warm-100">{title}</h3>
            <p className="text-sm text-warm-500 dark:text-warm-400 mt-0.5 leading-relaxed">{message}</p>
          </div>
          <button onClick={onCancel} className="w-6 h-6 rounded flex items-center justify-center text-warm-400 hover:text-warm-600 shrink-0 transition-colors">
            <X size={13} />
          </button>
        </div>

        <div className="flex gap-2">
          <button onClick={onCancel}
            className="flex-1 py-2 rounded-md font-semibold text-sm text-warm-600 dark:text-warm-400 bg-warm-100 dark:bg-[#2e2d2b] hover:bg-warm-200 dark:hover:bg-[#4a4845] transition-colors">
            {cancelText || 'Cancel'}
          </button>
          <button onClick={onConfirm}
            className={`flex-1 py-2 rounded-md font-semibold text-sm text-white ${config.btn} transition-colors`}>
            {confirmText || 'Confirm'}
          </button>
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
            title={state.title} message={state.message}
            confirmText={state.confirmText} cancelText={state.cancelText}
            type={state.type} onConfirm={handleConfirm} onCancel={handleCancel}
          />
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() { return useContext(ConfirmContext); }
