/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    '../packages/ui/src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    // Custom breakpoints matching Requirements 15.1, 15.5
    // Mobile: < 640px, Tablet: 640px - 1024px, Desktop: > 1024px
    screens: {
      'sm': '640px',    // Tablet starts
      'md': '768px',    // Medium tablet
      'lg': '1024px',   // Desktop starts
      'xl': '1280px',   // Large desktop
      '2xl': '1536px',  // Extra large desktop
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: '#f5d393',
          hover: '#e5c383',
          50: '#fefbf3',
          100: '#fdf5e1',
          200: '#fbebc3',
          300: '#f8dc9a',
          400: '#f5d393',
          500: '#e5c383',
          600: '#c9a45f',
          700: '#a68445',
          800: '#866a38',
          900: '#6d5630',
        },
        dark: {
          DEFAULT: '#0b0c0f',
          50: '#f6f6f7',
          100: '#e3e3e5',
          200: '#c6c6ca',
          300: '#a1a1aa',
          400: '#71717a',
          500: '#52525b',
          600: '#3f3f46',
          700: '#27272a',
          800: '#1a1a1f',
          900: '#131316',
          950: '#0b0c0f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
      },
      // Touch-friendly spacing
      spacing: {
        'touch': '44px', // Minimum touch target size (44x44px)
        'touch-sm': '36px',
      },
      // Responsive font sizes
      fontSize: {
        'mobile-xs': ['11px', { lineHeight: '1.4' }],
        'mobile-sm': ['13px', { lineHeight: '1.5' }],
        'mobile-base': ['15px', { lineHeight: '1.6' }],
        'mobile-lg': ['17px', { lineHeight: '1.5' }],
      },
    },
  },
  plugins: [],
};
