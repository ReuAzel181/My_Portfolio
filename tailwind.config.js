/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Light Theme - Neo-Futuristic Blue
        'light': {
          primary: '#2D7FF9',
          50: '#F0F7FF',
          100: '#E6F0FF',
          200: '#B8D9FF',
          300: '#85B9FF',
          400: '#4D94FF',
          500: '#2D7FF9',
          600: '#1A6BE8',
          700: '#0D55D6',
        },
        // Dark Theme - Cyberpunk-inspired
        'dark': {
          bg: '#0A1929',
          accent: '#00D5FF',
          text: '#E6F0FF',
          secondary: '#132F4C',
          tertiary: '#173A5E',
        },
        primary: '#8B5CF6',
        secondary: '#4F46E5',
        mint: {
          100: '#E6F9F4',
          200: '#B3F0E4',
          300: '#80E7D4',
          400: '#4DDDC4',
          500: '#1AD4B4',
          600: '#15A990',
          700: '#107F6C',
          800: '#0B5448',
          900: '#062A24',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      boxShadow: {
        'glow': '0 0 10px var(--card-shadow)',
      },
    },
  },
  plugins: [],
} 