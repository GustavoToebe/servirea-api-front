/**
 * `violet` e `indigo` do Tailwind não são cores fixas neste sistema: são tons da cor principal que a pessoa escolhe
 * em Ajustes (`--brand` e `--brand-navy`, definidos pelo ThemeService). Assim os 140 lugares que já usam essas
 * classes acompanham o tema, inclusive com transparência (`bg-violet-50/40`). Não use para status: verde, âmbar e
 * vermelho continuam sendo as cores de status (docs/design-system.md).
 */
const tom = (css) => ({ opacityValue }) =>
  opacityValue === undefined ? css : `color-mix(in srgb, ${css} calc(${opacityValue} * 100%), transparent)`;
const claro = (pct) => tom(`color-mix(in srgb, var(--brand) ${pct}%, white)`);
const escuro = (pct) => tom(`color-mix(in srgb, var(--brand-navy) ${pct}%, var(--brand))`);
const rampaDaMarca = {
  50: claro(6), 100: claro(12), 200: claro(24), 300: claro(42), 400: claro(68), 500: claro(86),
  600: tom('var(--brand)'), 700: escuro(30), 800: escuro(62), 900: tom('var(--brand-navy)'), 950: tom('color-mix(in srgb, var(--brand-navy) 78%, black)')
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        violet: rampaDaMarca,
        indigo: rampaDaMarca,
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
