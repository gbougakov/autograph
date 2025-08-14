/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'belgium-black': '#000000',
        'belgium-yellow': '#FDDA24',
        'belgium-red': '#EF3340',
        'primary': '#3B82F6',
        'primary-foreground': '#FFFFFF'
      },
      fontFamily: {
        'sans': ['InterVariable']
      }
    },
  },
  plugins: [],
}