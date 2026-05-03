/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        accent: {
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      backgroundImage: {
        'hero-pattern': "url('https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920&q=80')",
      },
      keyframes: {
        'fade-in-up': {
          '0%':   { opacity: '0', transform: 'translateY(28px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-left': {
          '0%':   { opacity: '0', transform: 'translateX(-40px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          '0%':   { opacity: '0', transform: 'scale(0.88)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'blob': {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%':      { transform: 'translate(20px, -25px) scale(1.08)' },
          '66%':      { transform: 'translate(-15px, 18px) scale(0.95)' },
        },
        'check-pop': {
          '0%':   { transform: 'scale(0) rotate(-10deg)', opacity: '0' },
          '60%':  { transform: 'scale(1.2) rotate(5deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        'bar-fill': {
          '0%':   { width: '0%' },
          '100%': { width: '100%' },
        },
        'ripple': {
          '0%':   { transform: 'scale(0)', opacity: '0.5' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
      },
      animation: {
        'fade-in-up':    'fade-in-up 0.55s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in-up-d1': 'fade-in-up 0.55s 0.08s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in-up-d2': 'fade-in-up 0.55s 0.16s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in-up-d3': 'fade-in-up 0.55s 0.24s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in-up-d4': 'fade-in-up 0.55s 0.32s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in-up-d5': 'fade-in-up 0.55s 0.40s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in':       'fade-in 0.4s ease both',
        'scale-in':      'scale-in 0.5s cubic-bezier(0.16,1,0.3,1) both',
        'slide-in-left': 'slide-in-left 0.6s cubic-bezier(0.16,1,0.3,1) both',
        'blob':          'blob 7s infinite',
        'check-pop':     'check-pop 0.6s cubic-bezier(0.16,1,0.3,1) both',
        'bar-fill':      'bar-fill 2s ease forwards',
        'ripple':        'ripple 0.6s linear forwards',
        'shimmer':       'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
}

