/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },
      colors: {
        brand: {
          50: "#f0f7ff",
          100: "#e0effe",
          200: "#bae0fd",
          300: "#7cc5fb",
          400: "#36a6f7",
          500: "#0284c7",
          600: "#0369a1",
          700: "#075985",
          800: "#0c4a6e",
          900: "#082f49",
        },
      },
      boxShadow: {
        'glow-primary': '0 0 25px -4px rgba(2, 132, 199, 0.28)',
        'glow-emerald': '0 0 25px -4px rgba(16, 185, 129, 0.28)',
        'glow-amber': '0 0 25px -4px rgba(245, 158, 11, 0.28)',
        'glow-rose': '0 0 25px -4px rgba(239, 68, 68, 0.28)',
      },
    },
  },
  plugins: [],
};