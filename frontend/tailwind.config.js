/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        // ── NeuraChat Vercel-Style Design Tokens ──
        nc: {
          bg:        '#FAFAFA',
          surface:   '#FFFFFF',
          elevated:  '#F3F4F6',
          primary:   '#111827',
          'primary-hover': '#374151',
          accent:    '#2563EB',
          success:   '#16A34A',
          warning:   '#D97706',
          danger:    '#DC2626',
          'text-primary':   '#111827',
          'text-secondary': '#6B7280',
          divider:   '#F3F4F6',
          border:    '#E5E7EB',
        },
        slate: {
          50:  '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617',
        },
        blue: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        green:  { 400: '#4ade80', 500: '#22C55E', 600: '#16a34a' },
        red:    { 400: '#f87171', 500: '#EF4444', 600: '#dc2626' },
        yellow: { 400: '#facc15', 500: '#F59E0B', 600: '#d97706' },
        purple: {
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
        },
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      borderRadius: {
        'card': '16px',
        'btn':  '12px',
        'input': '14px',
        'modal': '20px',
      },
      boxShadow: {
        'card': '0 1px 2px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.10)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.15)',
        'input-focus': '0 0 0 3px rgba(37,99,235,0.15)',
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-up': 'slideUp 200ms ease-out',
        'skeleton': 'skeleton 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { opacity: 0, transform: 'translateY(4px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        skeleton: {
          '0%, 100%': { opacity: 0.4 },
          '50%': { opacity: 0.8 },
        },
      },
      transitionDuration: {
        '150': '150ms',
        '200': '200ms',
        '250': '250ms',
      },
    },
  },
  plugins: [],
}