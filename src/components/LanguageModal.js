import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const LANGS = [
  { code: 'hi', label: 'हिंदी',   sub: 'Hindi',   flag: '🇮🇳' },
  { code: 'en', label: 'English', sub: 'अंग्रेज़ी', flag: '🇬🇧' },
];

export default function LanguageModal({ open, onClose }) {
  const { i18n } = useTranslation();

  function select(code) {
    i18n.changeLanguage(code);
    onClose();
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 10001, backdropFilter: 'blur(2px)' }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              marginTop: '-200px',
              marginLeft: '-180px',
              zIndex: 10002,
              width: 'calc(100vw - 32px)',
              maxWidth: '360px',
            }}>
            <div style={{
              background: 'white', borderRadius: '20px',
              boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
              overflow: 'hidden',
            }}>
              {/* Header */}
              <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid #f2ede6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <p style={{ fontSize: '16px', fontWeight: 800, color: '#1c1917', fontFamily: 'system-ui', margin: 0 }}>भाषा चुनें</p>
                  <p style={{ fontSize: '12px', color: '#a8a29e', fontFamily: 'system-ui', margin: '2px 0 0' }}>Choose Language</p>
                </div>
                <button onClick={onClose} style={{
                  width: '32px', height: '32px', borderRadius: '8px', border: '1px solid #e8e4dc',
                  background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#78716c',
                }}>
                  <X size={16} />
                </button>
              </div>

              {/* Options */}
              <div style={{ padding: '12px' }}>
                {LANGS.map(({ code, label, sub, flag }) => {
                  const active = i18n.language === code;
                  return (
                    <button key={code} onClick={() => select(code)} style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: '14px',
                      padding: '14px 16px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                      background: active ? '#f2f7f2' : 'transparent',
                      outline: active ? '1.5px solid #3d5a3e' : '1.5px solid transparent',
                      marginBottom: '6px', transition: 'all 0.15s ease',
                    }}>
                      <span style={{ fontSize: '28px', lineHeight: 1 }}>{flag}</span>
                      <div style={{ textAlign: 'left', flex: 1 }}>
                        <p style={{ fontSize: '15px', fontWeight: 700, color: '#1c1917', fontFamily: 'system-ui', margin: 0 }}>{label}</p>
                        <p style={{ fontSize: '12px', color: '#a8a29e', fontFamily: 'system-ui', margin: '1px 0 0' }}>{sub}</p>
                      </div>
                      {active && (
                        <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#3d5a3e', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
