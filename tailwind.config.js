/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0d1f35',
          900: '#122540',
          800: '#162d4a',
          700: '#1e3a5f',
          600: '#254d7a',
          500: '#2e6095',
          400: '#4a7fb0',
          300: '#7aaacb',
          200: '#b0cfe3',
          100: '#d8e8f2',
          50:  '#e8eef5',
        },
        warm: {
          50:  '#f8f7f4',
          100: '#f0ede8',
          200: '#e2e0db',
          300: '#c8c5be',
          400: '#9c9890',
          500: '#6b6860',
          600: '#4a4845',
          700: '#2e2d2b',
          800: '#1a1917',
          900: '#0f0e0d',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        sm: '4px',
        md: '6px',
        lg: '8px',
      },
      boxShadow: {
        sm:   '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md:   '0 2px 8px 0 rgb(0 0 0 / 0.08)',
        card: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'card-hover': '0 2px 8px 0 rgb(0 0 0 / 0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.15s ease-out',
        'slide-up': 'slideUp 0.2s ease-out',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(6px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
}
