/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
    "./node_modules/flowbite/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          100: '#E3F2FD',
          200: '#BBDEFB',
          300: '#90CAF9',
          400: '#64B5F6',
          500: '#2196F3',
          600: '#1976D2',
          700: '#1565C0',
          800: '#0D47A1',
          900: '#0277BD',
        },
        secondary: {
          100: '#F8E6FF',
          200: '#E1B3FF',
          300: '#CA80FF',
          400: '#B34DFF',
          500: '#9C1AFF',
          600: '#7A14CC',
          700: '#580E99',
          800: '#360866',
          900: '#140233',
        },
        purple: {
          50: '#F3E5F5',
          100: '#E1BEE7',
          200: '#CE93D8',
          300: '#BA68C8',
          400: '#AB47BC',
          500: '#9C27B0',
          600: '#8E24AA',
          700: '#7B1FA2',
          800: '#6A1B9A',
          900: '#4A148C',
        },
        gradient: {
          from: '#8B5CF6',
          to: '#A855F7',
        }
      },
      fontFamily: {
        'sans': ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      backgroundImage: {
        'gradient-purple': 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'gradient-main': 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%)',
      }
    },
  },
  plugins: [
    require('flowbite/plugin')
  ],
}