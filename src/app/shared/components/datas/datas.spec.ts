import { competenciaBr, competenciaDeBr, dataBr, dataDeBr, diasDaGrade, hojeIso, mascararData, somarMeses } from './datas';

describe('datas', () => {
  it('hoje no fuso local, em ISO', () => {
    expect(hojeIso(new Date(2026, 8, 5, 23, 30))).toBe('2026-09-05');
  });

  it('mostra e lê DD/MM/AAAA e MM/AAAA', () => {
    expect(dataBr('2026-09-05')).toBe('05/09/2026');
    expect(dataDeBr('05/09/2026')).toBe('2026-09-05');
    expect(dataDeBr('31/02/2026')).toBeNull();
    expect(dataDeBr('05/09/20')).toBeNull();
    expect(competenciaBr('2026-09')).toBe('09/2026');
    expect(competenciaDeBr('09/2026')).toBe('2026-09');
    expect(competenciaDeBr('13/2026')).toBeNull();
  });

  it('máscara põe as barras enquanto digita', () => {
    expect(mascararData('05092026', [2, 2, 4])).toBe('05/09/2026');
    expect(mascararData('0509', [2, 2, 4])).toBe('05/09');
    expect(mascararData('a092026x', [2, 4])).toBe('09/2026');
  });

  it('grade de 6 semanas começando no domingo e soma de meses', () => {
    const grade = diasDaGrade('2026-09');
    expect(grade.length).toBe(42);
    expect(grade[0]).toEqual({ iso: '2026-08-30', doMes: false }); // 01/09/2026 é terça
    expect(grade[2]).toEqual({ iso: '2026-09-01', doMes: true });
    expect(somarMeses('2026-12', 1)).toBe('2027-01');
    expect(somarMeses('2026-01', -1)).toBe('2025-12');
  });
});
