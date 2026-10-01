import { TestBed } from '@angular/core/testing';
import { PALETAS, ThemeService } from './theme.service';

function luminancia(hex: string): number {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
const contrasteComBranco = (hex: string) => 1.05 / (luminancia(hex) + 0.05);

describe('paletas do tema', () => {
  beforeEach(() => localStorage.removeItem('sv_aparencia'));
  afterEach(() => localStorage.removeItem('sv_aparencia'));

  it('tem 12 paletas, sem id repetido e todas com cores hexadecimais', () => {
    expect(PALETAS.length).toBe(12);
    expect(new Set(PALETAS.map(p => p.id)).size).toBe(PALETAS.length);
    for (const p of PALETAS) {
      for (const cor of [p.brand, p.hover, p.navy, p.bg]) expect(cor).toMatch(/^#[0-9A-F]{6}$/i);
    }
  });

  it('o texto branco sobre a cor principal é legível em todas (contraste mínimo 4,5)', () => {
    for (const p of PALETAS) expect(contrasteComBranco(p.brand)).withContext(p.nome).toBeGreaterThanOrEqual(4.5);
  });

  it('o cabeçalho (navy) é mais escuro que a cor principal em todas', () => {
    for (const p of PALETAS) expect(luminancia(p.navy)).withContext(p.nome).toBeLessThan(luminancia(p.brand));
  });

  it('escolher uma paleta nova aplica a cor principal e lembra a escolha', () => {
    const tema = TestBed.inject(ThemeService);
    tema.escolherPaleta('TURQUESA');
    expect(document.documentElement.style.getPropertyValue('--brand')).toBe('#0F766E');
    expect(document.documentElement.style.getPropertyValue('--brand-navy')).toBe('#0B3B38');
    expect(JSON.parse(localStorage.getItem('sv_aparencia') || '{}').paleta).toBe('TURQUESA');
    tema.restaurar();
  });
  describe('classes violet e indigo do Tailwind', () => {
    afterEach(() => TestBed.inject(ThemeService).restaurar());

    function corDe(classe: string, propriedade: 'backgroundColor' | 'color' | 'borderTopColor'): string {
      const el = document.createElement('div');
      el.className = classe;
      el.style.borderTopStyle = 'solid';
      document.body.appendChild(el);
      const cor = getComputedStyle(el)[propriedade];
      el.remove();
      return cor;
    }

    /** O Chrome devolve `rgb(r, g, b)` ou `color(srgb r g b)` (0 a 1): os dois viram [r, g, b] de 0 a 255. */
    function canais(css: string): number[] {
      const numeros = (css.match(/[\d.]+/g) || []).map(Number);
      return (css.startsWith('color(') ? numeros.slice(0, 3).map(n => Math.round(n * 255)) : numeros.slice(0, 3));
    }

    it('acompanham a cor principal escolhida em Ajustes', () => {
      const tema = TestBed.inject(ThemeService);
      tema.escolherPaleta('TURQUESA'); // #0F766E = rgb(15, 118, 110)
      expect(canais(corDe('bg-violet-600', 'backgroundColor'))).toEqual([15, 118, 110]);
      expect(canais(corDe('bg-indigo-600', 'backgroundColor'))).toEqual([15, 118, 110]);
      tema.escolherPaleta('ROSA'); // #B83280 = rgb(184, 50, 128)
      expect(canais(corDe('bg-violet-600', 'backgroundColor'))).toEqual([184, 50, 128]);
    });

    it('os tons claros e escuros também mudam, e a transparência continua funcionando', () => {
      const tema = TestBed.inject(ThemeService);
      tema.escolherPaleta('TURQUESA');
      const claro = corDe('bg-violet-50', 'backgroundColor');
      expect(canais(claro)).not.toEqual([245, 243, 255]); // o violet-50 original do Tailwind
      expect(claro).not.toContain('/'); // opaco
      expect(corDe('bg-violet-50/50', 'backgroundColor')).toContain('/ 0.5'); // metade da opacidade: canal alfa 0,5
      expect(canais(corDe('text-indigo-950', 'color'))).not.toEqual([30, 27, 75]); // o indigo-950 original
    });
  });
});
