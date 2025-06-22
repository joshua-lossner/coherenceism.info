import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      colors: {
        background: '#111111',
        foreground: '#f4f4f5',
        border: '#27272a',
        card: '#18181b',
        primary: '#67e8f9',
        'primary-foreground': '#0c0a09',
      },
    },
  },
  plugins: [],
} satisfies Config
