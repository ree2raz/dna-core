/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'monospace',
        ],
      },
      colors: {
        ink: {
          50: '#f5f5fa',
          100: '#e7e7f0',
          200: '#c5c5d4',
          300: '#a5a5b8',
          400: '#9a9ab0',
          500: '#5a5a72',
          600: '#3a3a4f',
          700: '#2a2a3a',
          800: '#1a1a26',
          900: '#101019',
          950: '#0a0a0f',
        },
        accent: {
          DEFAULT: '#7dd3fc',
          glow: '#22d3ee',
        },
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
      },
    },
  },
  plugins: [],
}
