import React, { useEffect, useState } from 'react';

export default function SplashScreen({ onDone }) {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t0 = setTimeout(() => setVisible(true), 80);
    const t1 = setTimeout(() => setFading(true), 1600);
    const t2 = setTimeout(() => onDone(), 2100);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); };
  }, [onDone]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#fafaf7',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      transition: 'opacity 0.45s ease',
      opacity: fading ? 0 : 1,
    }}>

      {/* Logo + Name */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px',
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.5s ease, transform 0.5s ease',
      }}>

        {/* Logo mark */}
        <svg width="72" height="72" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="40" height="40" rx="9" fill="#3d5a3e" />
          <rect x="1" y="1" width="38" height="38" rx="8" stroke="#4e7250" strokeWidth="0.5" />
          <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle"
            fill="white" fontSize="11.5" fontWeight="800"
            fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="-0.2">
            J&amp;S
          </text>
        </svg>

        {/* Name */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            color: '#2d4428', fontSize: '20px', fontWeight: '700',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            letterSpacing: '-0.3px', lineHeight: 1.2,
          }}>
            Jha &amp; Sons Dairy Farm
          </div>
          <div style={{
            color: '#78716c', fontSize: '12px', fontWeight: '400',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            marginTop: '5px', letterSpacing: '0.4px',
          }}>
            Kaluahi · Madhubani · Bihar
          </div>
        </div>
      </div>

      {/* Makeward credit */}
      <div style={{
        position: 'absolute', bottom: '24px',
        color: '#a8a29e', fontSize: '11px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        letterSpacing: '0.2px',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.6s ease 0.4s',
      }}>
        Demo by{' '}
        <a href="https://makeward.in" target="_blank" rel="noopener noreferrer"
          style={{ color: '#3d5a3e', fontWeight: 600, textDecoration: 'none' }}>
          Makeward
        </a>
      </div>

      {/* Bottom progress bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px',
        background: '#e4eeE5',
      }}>
        <div style={{
          height: '100%', background: '#3d5a3e',
          width: visible ? '100%' : '0%',
          transition: 'width 1.5s ease',
        }} />
      </div>
    </div>
  );
}
