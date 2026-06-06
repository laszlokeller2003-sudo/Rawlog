/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-base': '#080808',
        'bg-surface': '#101010',
        'bg-elevated': '#181818',
        'bg-card': '#1C1C1C',
        border: '#242424',
        'border-subtle': '#1A1A1A',
        'accent-red': '#FF2020',
        'text-primary': '#F5F5F5',
        'text-secondary': '#888888',
        'text-muted': '#444444',
        green: '#22C55E',
        yellow: '#EAB308',
        blue: '#3B82F6',
        purple: '#A855F7',
        orange: '#F97316',
        cyan: '#06B6D4',
        indigo: '#6366F1',
        pink: '#EC4899',
      },
      fontFamily: {
        heading: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0px',
        sm: '0px',
        md: '6px',
        lg: '12px',
        xl: '12px',
        full: '9999px',
      },
      boxShadow: {
        'red-glow': '0 0 20px rgba(255,32,32,0.15)',
        'red-glow-lg': '0 0 40px rgba(255,32,32,0.2)',
      },
      maxWidth: {
        app: '430px',
      },
      animation: {
        'fade-in': 'fadeIn 150ms ease-out',
        'slide-up': 'slideUp 200ms cubic-bezier(0.32, 0.72, 0, 1)',
        'slide-down': 'slideDown 200ms cubic-bezier(0.32, 0.72, 0, 1)',
        'pulse-red': 'pulseRed 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { transform: 'translateY(100%)' }, to: { transform: 'translateY(0)' } },
        slideDown: { from: { transform: 'translateY(0)' }, to: { transform: 'translateY(100%)' } },
        pulseRed: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.5' } },
      },
      spacing: {
        safe: 'env(safe-area-inset-bottom)',
      },
    },
  },
  plugins: [],
}
