/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,js,ejs}",  // Ajout des .ejs
    "./public/**/*.{html,js,ejs}"
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#3b82f6',
        'secondary': '#10b981',
      }
    },
  },
  plugins: [],
}
