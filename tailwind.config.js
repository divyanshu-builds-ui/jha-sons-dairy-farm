/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ["./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        royal: {
          950: '#001a6e',
          900: '#002299',
          800: '#0030b8',
          700: '#0136e4',
          600: '#1a4ff0',
          500: '#3366f5',
          400: '#5c85f7',
          300: '#85a3fa',
          200: '#adc2fc',
          100: '#d6e0fe',
          50: '#eef2ff',
        },
        mint: {
          900: '#0a6b3f',
          800: '#0f8a52',
          700: '#17a966',
          600: '#22c77a',
          500: '#33de92',
          400: '#5ce6a8',
          300: '#85edbf',
          200: '#adf4d5',
          100: '#d6faeb',
          50: '#edfdf5',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(1,54,228,0.04), 0 4px 16px rgba(1,54,228,0.04)',
        'card-hover': '0 8px 24px rgba(1,54,228,0.08), 0 2px 8px rgba(1,54,228,0.04)',
        'float': '0 12px 40px rgba(1,54,228,0.15)',
        'glow': '0 0 20px rgba(51,222,146,0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'gradient': 'gradient 8s ease infinite',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(10px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        gradient: { '0%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' }, '100%': { backgroundPosition: '0% 50%' } },
      }
    },
  },
  plugins: [],
}
