/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Primary — muted olive green
        olive: {
          950: '#1a2618',
          900: '#243520',
          800: '#2d4428',
          700: '#3d5a3e',  // main primary
          600: '#4e7250',
          500: '#618f63',
          400: '#7daa7f',
          300: '#a3c4a5',
          200: '#c8ddc9',
          100: '#e4eeE5',
          50:  '#f2f7f2',
        },
        // Accent — warm gold
        gold: {
          900: '#5c3d0a',
          800: '#7a5210',
          700: '#9a6b18',
          600: '#c9a84c',  // main accent
          500: '#d4b96a',
          400: '#deca8a',
          300: '#e8d9aa',
          200: '#f0e8c8',
          100: '#f7f2e2',
          50:  '#fbf8f0',
        },
        // Warm sand — backgrounds & surfaces
        sand: {
          950: '#1c1917',
          900: '#292524',
          800: '#44403c',
          700: '#57534e',
          600: '#78716c',
          500: '#a8a29e',
          400: '#c8c4be',
          300: '#ddd9d3',
          200: '#e8e4dc',
          100: '#f2ede6',
          50:  '#fafaf7',  // page background
          25:  '#fdfcf9',  // card background
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['11px', { lineHeight: '1.4' }],
        xs:    ['12px', { lineHeight: '1.5' }],
        sm:    ['13px', { lineHeight: '1.5' }],
        base:  ['15px', { lineHeight: '1.6' }],
        lg:    ['17px', { lineHeight: '1.5' }],
        xl:    ['19px', { lineHeight: '1.4' }],
        '2xl': ['22px', { lineHeight: '1.3' }],
        '3xl': ['28px', { lineHeight: '1.2' }],
        '4xl': ['34px', { lineHeight: '1.15' }],
        '5xl': ['42px', { lineHeight: '1.1' }],
      },
      borderRadius: {
        sm:   '6px',
        md:   '10px',
        lg:   '14px',
        xl:   '18px',
        '2xl':'24px',
      },
      boxShadow: {
        xs:   '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        sm:   '0 1px 4px 0 rgb(0 0 0 / 0.06)',
        md:   '0 4px 12px 0 rgb(0 0 0 / 0.07)',
        lg:   '0 8px 24px 0 rgb(0 0 0 / 0.09)',
        card: '0 1px 3px 0 rgb(0 0 0 / 0.05), 0 1px 2px -1px rgb(0 0 0 / 0.04)',
        'card-hover': '0 6px 20px 0 rgb(0 0 0 / 0.09)',
        olive: '0 4px 14px 0 rgb(61 90 62 / 0.22)',
      },
      animation: {
        'fade-in':  'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
      },
      keyframes: {
        fadeIn:  { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
