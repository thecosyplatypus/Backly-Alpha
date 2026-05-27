/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "./public/**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        backly: {
          dark: '#111111',
          darker: '#0a0a0a',
          gold: '#FFD700',
          goldLight: '#FFE55C',
          goldDark: '#D4AF37',
          accent: '#FFA500',
          glass: 'rgba(255, 255, 255, 0.1)',
          glassHover: 'rgba(255, 255, 255, 0.15)',
          primary: '#6366F1',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          info: '#3B82F6'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      }
    }
  },
  plugins: []
}
