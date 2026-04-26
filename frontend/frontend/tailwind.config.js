/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#142588',
        'primary-container': '#303f9f',
        secondary: '#006c48',
        tertiary: '#421384',
        surface: '#f4faff',
        'surface-low': '#e7f6ff',
        'surface-lowest': '#ffffff',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
