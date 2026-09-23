/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#673DE6',
          navy: '#2F1C6A',
          ink: '#1D1E20',
          gray: '#727586'
        },
        app: '#F4F5FF'
      },
      boxShadow: {
        card: '0 10px 30px rgba(47, 28, 106, 0.06)'
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
