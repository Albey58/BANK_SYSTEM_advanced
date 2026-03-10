/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0F0F10',
        surface: '#1C1C1E',
        primary: '#FFFFFF',
        secondary: '#A1A1AA',
        border: 'rgba(255, 255, 255, 0.08)',
        accent: '#3B82F6',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
