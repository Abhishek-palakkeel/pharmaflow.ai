/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'system-ui', 'sans-serif'],
      },
      colors: {
        ink: {
          950: '#0B1220',
          900: '#0F172A',
          800: '#1E293B',
          700: '#334155',
          600: '#475569',
          500: '#64748B',
          400: '#94A3B8',
          300: '#CBD5E1',
          200: '#E2E8F0',
          100: '#F1F5F9',
          50: '#F8FAFC',
        },
        teal: {
          950: '#042F2C',
          900: '#0B4A45',
          800: '#0F6B62',
          700: '#0D9488',
          600: '#14B8A6',
          500: '#2DD4BF',
          400: '#5EEAD4',
          100: '#CCFBF1',
          50: '#F0FDFA',
        },
        clay: {
          700: '#B45309',
          600: '#D97706',
          500: '#F59E0B',
          100: '#FEF3C7',
        },
        rose: {
          700: '#BE123C',
          600: '#DC2626',
          100: '#FEE2E2',
        },
      },
      boxShadow: {
        soft: '0 1px 2px rgba(15, 23, 42, 0.06), 0 1px 1px rgba(15,23,42,0.04)',
        card: '0 1px 3px rgba(15, 23, 42, 0.08), 0 4px 12px rgba(15, 23, 42, 0.04)',
      },
    },
  },
  plugins: [],
}
