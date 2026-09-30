import { coresDaFolha, misturar } from './cores-folha';

describe('cores da folha', () => {
  afterEach(() => {
    document.documentElement.style.removeProperty('--brand');
    document.documentElement.style.removeProperty('--brand-navy');
  });

  it('mistura duas cores em hexadecimal', () => {
    expect(misturar('#000000', '#ffffff', 0)).toBe('#000000');
    expect(misturar('#000000', '#ffffff', 1)).toBe('#ffffff');
    expect(misturar('#000000', '#ffffff', 0.5)).toBe('#808080');
  });

  it('sem tema aplicado, usa o roxo padrão', () => {
    const c = coresDaFolha();
    expect(c.brand).toBe('#673DE6');
    expect(c.navy).toBe('#2F1C6A');
  });

  it('segue a cor principal escolhida em Ajustes', () => {
    document.documentElement.style.setProperty('--brand', '#2E6B4F');
    document.documentElement.style.setProperty('--brand-navy', '#163323');
    const c = coresDaFolha();
    expect(c.brand).toBe('#2E6B4F');
    expect(c.navy).toBe('#163323');
    expect(c.tom(1)).toBe('#ffffff');
    expect(c.tom(0)).toBe('#2e6b4f');
  });

  it('ignora um valor que não é uma cor', () => {
    document.documentElement.style.setProperty('--brand', 'var(--outra)');
    expect(coresDaFolha().brand).toBe('#673DE6');
  });
});
