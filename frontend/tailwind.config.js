/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Medieval dark theme colors
        medieval: {
          bg: {
            primary: '#0d0d0d',
            secondary: '#1a1a1a',
            tertiary: '#262626',
            card: '#1f1f1f',
          },
          border: {
            primary: '#3d3d3d',
            secondary: '#4a4a4a',
            gold: '#8b7355',
          },
          text: {
            primary: '#e0e0e0',
            secondary: '#a0a0a0',
            muted: '#666666',
            gold: '#d4af37',
          },
          accent: {
            ally: '#2d5a27',
            allyHover: '#3d7a37',
            enemy: '#5a2727',
            enemyHover: '#7a3737',
            gold: '#d4af37',
            goldDark: '#8b7355',
            online: '#27ae60',
            offline: '#7f8c8d',
            hunting: '#e67e22',
          }
        }
      },
      fontFamily: {
        medieval: ['Cinzel', 'serif'],
        body: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'medieval': '0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -1px rgba(0, 0, 0, 0.3)',
        'medieval-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.5), 0 4px 6px -2px rgba(0, 0, 0, 0.3)',
        'gold': '0 0 10px rgba(212, 175, 55, 0.3)',
      },
      animation: {
        'pulse-soft': 'pulse-soft 2s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'glow': {
          'from': { boxShadow: '0 0 5px rgba(212, 175, 55, 0.2)' },
          'to': { boxShadow: '0 0 15px rgba(212, 175, 55, 0.4)' },
        },
      },
    },
  },
  plugins: [],
}
