import React from 'react';

// Placeholder logo — replace with actual image once brand assets are ready.
// To use real logo: <img src={logoImg} alt="Jha & Sons" className={className} style={{width:size,height:size}} />
export default function Logo({ size = 36, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none"
      xmlns="http://www.w3.org/2000/svg" className={className} style={{ flexShrink: 0 }}>
      <rect width="40" height="40" rx="9" fill="#3d5a3e" />
      <rect x="1" y="1" width="38" height="38" rx="8" stroke="#4e7250" strokeWidth="0.5" />
      <text x="50%" y="54%" dominantBaseline="middle" textAnchor="middle"
        fill="white" fontSize="11.5" fontWeight="800"
        fontFamily="system-ui, -apple-system, sans-serif" letterSpacing="-0.2">
        J&amp;S
      </text>
    </svg>
  );
}
