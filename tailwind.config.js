/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9', // Core Hydration Blue
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        dark: {
          bg: '#0b132b',       // Deep midnight blue
          surface: '#1c2541',  // Slate blue surface
          card: '#111a36',     // Card base
          border: '#3a506b',   // Steel blue borders
        },
        glass: {
          bg: 'rgba(255, 255, 255, 0.07)',
          border: 'rgba(255, 255, 255, 0.15)',
          bgDark: 'rgba(11, 19, 43, 0.6)',
        },
        accent: {
          red: '#ff4d4d',      // Dehydration danger
          yellow: '#ffad33',   // Medium risk dehydration
          green: '#00cc66',    // Safe hydration level
        }
      },
      fontFamily: {
        sans: ['System'],
      }
    },
  },
  plugins: [],
}
