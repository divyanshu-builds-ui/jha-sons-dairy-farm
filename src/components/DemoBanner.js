import React, { useState } from 'react';
import BRAND from '../utils/config';

export default function DemoBanner({ onClose }) {
  const [closed, setClosed] = useState(false);

  function handleClose() {
    setClosed(true);
    onClose && onClose();
  }

  if (closed) return null;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 10000,
      background: '#2d4428', color: 'white',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '7px 36px 7px 12px',
      fontSize: '11px', fontFamily: 'system-ui, -apple-system, sans-serif',
      gap: '6px', lineHeight: 1.4,
    }}>
      <span style={{ opacity: 0.7 }}>🛠️</span>
      <span style={{ opacity: 0.85 }}>
        This is a demo site built by{' '}
        <a href={BRAND.developer.portfolio} target="_blank" rel="noopener noreferrer"
          style={{ color: '#c9a84c', fontWeight: 600, textDecoration: 'none' }}>
          {BRAND.developer.name}
        </a>
        {' '}— like this for your business?{' '}
        <a href={`https://wa.me/${BRAND.developer.whatsapp}?text=Hi, I saw the Jha %26 Sons demo site. I want a website for my business.`}
          target="_blank" rel="noopener noreferrer"
          style={{ color: 'white', fontWeight: 600, textDecoration: 'underline' }}>
          Get in touch
        </a>
      </span>
      <button onClick={handleClose} style={{
        position: 'absolute', right: '12px',
        background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
        cursor: 'pointer', fontSize: '16px', lineHeight: 1, padding: '2px 4px',
      }}>×</button>
    </div>
  );
}
