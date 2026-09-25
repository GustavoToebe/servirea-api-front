import { celebracoesDoAno, celebracoesDoMes, dataPascoa, tempoLiturgico } from './calendario-liturgico';

function iso(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

describe('calendario litúrgico', () => {
  it('calcula a Páscoa gregoriana de anos conhecidos', () => {
    expect(iso(dataPascoa(2024))).toBe('2024-03-31');
    expect(iso(dataPascoa(2025))).toBe('2025-04-20');
    expect(iso(dataPascoa(2026))).toBe('2026-04-05');
    expect(iso(dataPascoa(2027))).toBe('2027-03-28');
  });

  it('monta as datas móveis a partir da Páscoa de 2026', () => {
    const titulos = Object.fromEntries(celebracoesDoAno(2026).map(c => [c.titulo, c.data]));
    expect(titulos['Carnaval']).toBe('2026-02-17');
    expect(titulos['Quarta-feira de Cinzas']).toBe('2026-02-18');
    expect(titulos['Sexta-feira Santa']).toBe('2026-04-03');
    expect(titulos['Páscoa']).toBe('2026-04-05');
    expect(titulos['Corpus Christi']).toBe('2026-06-04');
    expect(titulos['Natal do Senhor']).toBe('2026-12-25');
    expect(titulos['Nossa Senhora Aparecida']).toBe('2026-10-12');
  });

  it('nomeia o tempo e o ciclo a partir da data civil', () => {
    const comum = tempoLiturgico(new Date(2026, 8, 25, 12));
    expect(comum.tempo).toBe('Tempo Comum');
    expect(comum.ciclo).toBe('A');
    expect(comum.rotulo).toContain('Ano A');

    expect(tempoLiturgico(new Date(2026, 2, 1, 12)).tempo).toBe('Quaresma');
    expect(tempoLiturgico(new Date(2026, 3, 5, 12)).tempo).toBe('Páscoa');
    expect(tempoLiturgico(new Date(2026, 11, 25, 12)).tempo).toBe('Natal');
    expect(tempoLiturgico(new Date(2027, 1, 1, 12)).ciclo).toBe('B');
  });

  it('filtra as celebrações do mês', () => {
    const abril = celebracoesDoMes(2026, 4).map(c => c.titulo);
    expect(abril).toContain('Páscoa');
    expect(abril).toContain('Sexta-feira Santa');
    expect(abril).not.toContain('Natal do Senhor');
  });
});
