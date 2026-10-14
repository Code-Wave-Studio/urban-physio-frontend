/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
          950: '#431407',
        },
        /* Same logo-blue scale as --logo-* in index.css (sampled #0062AD). */
        logo: {
          50: 'rgb(var(--logo-50) / <alpha-value>)',
          100: 'rgb(var(--logo-100) / <alpha-value>)',
          200: 'rgb(var(--logo-200) / <alpha-value>)',
          300: 'rgb(var(--logo-300) / <alpha-value>)',
          400: 'rgb(var(--logo-400) / <alpha-value>)',
          500: 'rgb(var(--logo-500) / <alpha-value>)',
          600: 'rgb(var(--logo-600) / <alpha-value>)',
          700: 'rgb(var(--logo-700) / <alpha-value>)',
          800: 'rgb(var(--logo-800) / <alpha-value>)',
          900: 'rgb(var(--logo-900) / <alpha-value>)',
          950: 'rgb(var(--logo-950) / <alpha-value>)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.18s ease-out forwards',
        'slide-up': 'slideUp 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-down': 'slideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'scale-in': 'scaleIn 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'modal-pop': 'modalPop 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 2s infinite',
        'pulse-soft': 'pulseSoft 4s ease-in-out infinite',
        'shimmer': 'shimmer 2.2s ease-in-out infinite',
        'icon-pop': 'iconPop 0.35s cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        slideDown: { '0%': { opacity: '0', transform: 'translateY(-12px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        scaleIn: { '0%': { opacity: '0', transform: 'scale(0.96)' }, '100%': { opacity: '1', transform: 'scale(1)' } },
        modalPop: { '0%': { opacity: '0', transform: 'translateY(12px) scale(0.98)' }, '100%': { opacity: '1', transform: 'translateY(0) scale(1)' } },
        float: { '0%, 100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-12px)' } },
        pulseSoft: { '0%, 100%': { opacity: '0.4' }, '50%': { opacity: '0.7' } },
        shimmer: { '0%': { backgroundPosition: '200% center' }, '100%': { backgroundPosition: '-200% center' } },
        iconPop: { '0%': { transform: 'scale(1)' }, '50%': { transform: 'scale(1.15)' }, '100%': { transform: 'scale(1)' } },
      },
      transitionTimingFunction: {
        micro: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      backdropBlur: {
        xs: '2px',
      },
      boxShadow: {
        '2xs': '0 1px 2px 0 rgba(0, 0, 0, 0.04)',
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.ease-micro': {
          transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
        },
      });
    },
  ],
}
