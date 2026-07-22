import type { Config } from 'tailwindcss';

// ============================================================================
// Design tokens — derived from the frontend-design plan:
// White base, ink text (not pure black), blue primary, cyan "cold therapy"
// accent, warm accent reserved for "hot therapy" states only.
// ============================================================================

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class', // present but unused — brief mandates no dark mode
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0B1220',
          soft: '#374151',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          tint: '#F7F9FC',
          raised: '#FFFFFF',
        },
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#3B82F6',
          600: '#2563EB',
          700: '#1D4ED8',
          800: '#1E40AF',
          900: '#1E3A8A',
        },
        cold: {
          50: '#F0F9FF',
          100: '#E0F2FE',
          400: '#38BDF8',
          500: '#0EA5E9',
          600: '#0284C7',
        },
        warm: {
          50: '#FFF7ED',
          400: '#FB923C',
          500: '#F97316',
          600: '#EA580C',
        },
        success: {
          500: '#16A34A',
          50: '#F0FDF4',
        },
      },
      fontFamily: {
        display: ['"Inter"', 'system-ui', 'sans-serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.045em',
        tighter: '-0.03em',
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      },
      boxShadow: {
        soft: '0 2px 8px -2px rgba(11,18,32,0.06), 0 8px 24px -8px rgba(11,18,32,0.08)',
        lifted: '0 8px 30px -8px rgba(11,18,32,0.14), 0 2px 8px -2px rgba(11,18,32,0.08)',
        glow: '0 0 0 1px rgba(37,99,235,0.08), 0 8px 24px -6px rgba(37,99,235,0.25)',
      },
      backgroundImage: {
        'thermal-gradient': 'linear-gradient(90deg, #0EA5E9 0%, rgba(148,163,184,0.15) 50%, #F97316 100%)',
        'brand-radial': 'radial-gradient(circle at 30% 20%, rgba(37,99,235,0.12), transparent 60%)',
      },
      keyframes: {
        'thermal-sweep': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'thermal-sweep': 'thermal-sweep 8s ease-in-out infinite',
        'fade-up': 'fade-up 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
} satisfies Config;
