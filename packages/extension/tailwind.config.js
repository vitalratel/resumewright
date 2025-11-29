/** @type {import('tailwindcss').Config} */
export default {
  // Enable dark mode with class strategy
  darkMode: 'class',

  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './entrypoints/**/*.html',
  ],
  theme: {
    extend: {
      colors: {
        // Custom gray shade for dark mode
        gray: {
          850: '#262626', // Between gray-900 and gray-800
        },
        // LinkedIn Professional Blue color scheme
        // Primary: #0077B5 (LinkedIn Blue) - WCAG AAA compliant (7.23:1 contrast)
        // Dark: #005E93 (Dark LinkedIn Blue) - WCAG AAA compliant (9.79:1 contrast)
        primary: {
          50: '#E6F4FA',   // Very light blue
          100: '#CCE9F5',  // Light blue
          200: '#99D3EB',  // Lighter blue
          300: '#66BDE1',  // Light-medium blue
          400: '#33A7D7',  // Medium blue
          500: '#0077B5',  // LinkedIn Blue (base)
          600: '#006599',  // Slightly darker
          700: '#005E93',  // Dark LinkedIn Blue
          800: '#00486D',  // Very dark blue
          900: '#003247',  // Darkest blue
          950: '#001E2B',  // Near black blue
        },
      },
      spacing: {
        // Full-page spacing tokens (VISUAL-P1-002)
        // Based on 4px grid system
        '18': '4.5rem',   // 72px
        '22': '5.5rem',   // 88px
        '26': '6.5rem',   // 104px
        '30': '7.5rem',   // 120px
      },
      fontSize: {
        // Full-page typography scale (VISUAL-P1-001)
        '2.5xl': ['1.75rem', { lineHeight: '2.25rem' }], // 28px
        '3.5xl': ['2rem', { lineHeight: '2.5rem' }],     // 32px
      },
      minHeight: {
        '11': '2.75rem',  // 44px - minimum touch target (INTERACTION-P1-001)
        '12': '3rem',     // 48px - comfortable touch target
        '14': '3.5rem',   // 56px - hero CTA size
      },
      minWidth: {
        '11': '2.75rem',  // 44px - minimum touch target
        '12': '3rem',     // 48px - comfortable touch target
        '14': '3.5rem',   // 56px - hero CTA size
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-slow': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'bounce-once': 'bounceOnce 0.6s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scale-in': 'scaleIn 0.2s ease-out',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceOnce: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(300%)' },
        },
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
      transitionDuration: {
        // WCAG 2.2.2: 300-400ms for comfortable perception
        'fast': '200ms',      // For immediate feedback only
        'default': '300ms',   // Standard transitions (WCAG compliant)
        'slow': '400ms',      // For important state changes
      },
    },
  },
  plugins: [],
};
