/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/shared/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4F46E5',
          50: '#EEF2FF',
          100: '#E0E7FF',
          200: '#C7D2FE',
          300: '#A5B4FC',
          400: '#818CF8',
          500: '#6366F1',
          600: '#4F46E5',
          700: '#4338CA',
          800: '#3730A3',
          900: '#312E81',
          950: '#1E1B4B',
          dark: '#3730A3',
          light: '#818CF8',
        },
        folk: {
          DEFAULT: '#F5A524',
          dark: '#D97706',
          light: '#FDE68A',
        },
        sports: {
          DEFAULT: '#0FA3A3',
          dark: '#0D8282',
          light: '#CCFBF1',
        },
        male: {
          DEFAULT: '#2563EB',
          bg: '#EFF6FF',
          border: '#93C5FD',
        },
        female: {
          DEFAULT: '#C026D3',
          bg: '#FDF4FF',
          border: '#F0ABFC',
        },
        ink: '#111827',
        mist: '#E5E7EB',
        cloud: '#F9FAFB',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      keyframes: {
        'pulse-subtle': {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.8 },
        },
        'scan-line': {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
      },
      animation: {
        'pulse-subtle': 'pulse-subtle 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan-line': 'scan-line 2.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
