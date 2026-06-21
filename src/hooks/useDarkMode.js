import { useState, useEffect } from 'react';

export default function useDarkMode() {
  const [isDark, setIsDark] = useState(() => localStorage.getItem('lg_darkmode') === 'true');

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('lg_darkmode', isDark);
  }, [isDark]);

  const toggleDark = () => setIsDark(prev => !prev);

  return [isDark, toggleDark];
}
