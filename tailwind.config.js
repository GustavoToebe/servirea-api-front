/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          blue: 'var(--brand)',
          navy: 'var(--brand-navy)',
          ink: 'var(--ink)',
          gray: '#727586'
        },
        app: 'var(--app-bg)'
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
