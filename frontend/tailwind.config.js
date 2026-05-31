/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-primary': '#1A1A1A',
        'dark-secondary': '#2C2C2C',
        'brand-gold': '#FFD700',
        'success-green': '#4CAF50',
        'alert-red': '#F44336',
      }
    },
  },
  plugins: [],
}
