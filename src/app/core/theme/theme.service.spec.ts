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
});
