import { useState, useEffect } from 'react';

const SIZES = ['font-small', 'font-normal', 'font-large'];
const LABELS = ['Small', 'Normal', 'Large'];

export function useFontSize() {
  const [size, setSize] = useState(() => localStorage.getItem('lg_font_size') || 'font-normal');

  useEffect(() => {
    document.documentElement.classList.remove(...SIZES);
    if (size !== 'font-normal') document.documentElement.classList.add(size);
    localStorage.setItem('lg_font_size', size);
  }, [size]);

  return { size, setSize, SIZES, LABELS };
}
