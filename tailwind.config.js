/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'mono': ['"JetBrains Mono"', '"Consolas"', '"Monaco"', '"Courier New"', 'monospace'],
      },
      colors: {
        'terminal-green': '#00ff00',
        'terminal-green-dim': '#00cc00',
        'terminal-amber': '#ffbf00',
        'terminal-dark': '#001100',
        'terminal-yellow': '#ffff00',
      },
      animation: {
        'pulse-cursor': 'pulse 1s infinite',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
} 