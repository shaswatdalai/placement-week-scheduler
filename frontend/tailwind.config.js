/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        stone: {
          50: '#fcfcfb',
          100: '#f5f5f3',
          200: '#e9e9e5',
          300: '#d7d7d0',
          400: '#b7b7ad',
          500: '#949488',
          600: '#75756a',
          700: '#5e5e54',
          800: '#484841',
          900: '#3d3d37',
          950: '#20201d',
        },
        accent: {
          50: '#fbf9f4',
          100: '#f5ece0',
          200: '#ebd9c1',
          300: '#dba97b',
          400: '#c5844d',
          500: '#b06536',
          600: '#974b2a',
          700: '#7d3822',
          800: '#652a1d',
          900: '#522119',
          950: '#2d0e0a',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
