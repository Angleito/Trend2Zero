/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bitcoin: {
          50: '#f7f7f7',
          100: '#f0f0f0',
          200: '#e6e6e6',
          300: '#d4d4d4',
          400: '#a0a0a0',
          500: '#f7931a', // Bitcoin Orange
          600: '#d4760f',
          700: '#b35e0c',
          800: '#924b09',
          900: '#7a3e07'
        },
        dark: {
          50: '#121212',
          100: '#1e1e1e',
          200: '#2c2c2c',
          300: '#3a3a3a',
          400: '#4a4a4a',
          500: '#5c5c5c',
          600: '#6e6e6e',
          700: '#808080',
          800: '#929292',
          900: '#a4a4a4'
        },
        'dark-card': '#111111',
        'dark-border': '#333333'
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        'bitcoin': '0 0 15px rgba(247, 147, 26, 0.3)',
      },
      animation: {
        'pulse-bitcoin': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        pulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        }
      }
    },
  },
  plugins: [],
}
