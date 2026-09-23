/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#006599',
          navy: '#10344a',
          gray: '#9ca3af'
        },
        app: '#f5f7f9'
      },
      boxShadow: {
        card: '0 8px 24px rgba(15, 23, 42, 0.06)'
      }
    }
  },
  plugins: []
};
