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
          DEFAULT: '#3B3FD9',
          dark: '#1E1F5C',
          light: '#6366F1',
          50: '#EEF2FF',
          100: '#E0E7FF',
          600: '#3B3FD9',
          700: '#312E81',
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
        slate: '#4B5563',
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
