/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Matches the "SmartStudy" purple theme from your wireframes
        brand: '#6366f1', 
        brandDark: '#4f46e5',
      },
    },
  },
  plugins: [],
}