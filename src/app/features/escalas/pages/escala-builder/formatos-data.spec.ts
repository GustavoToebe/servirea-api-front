import { dataCurta, dataLonga, diaDaSemana, diaEData } from './formatos-data';

describe('formatos-data', () => {
  it('formata como o builder formatava', () => {
    expect(dataLonga('2026-10-01')).toBe('01/10/2026');
    expect(diaDaSemana('2026-10-01')).toBe('quinta-feira');
    expect(dataCurta('2026-10-01')).toBe('01 de out');
    expect(diaEData('2026-10-01')).toBe('qui 01/10');
  });

  it('não constrói Intl.DateTimeFormat ao formatar 100 datas', () => {
    const construtor = spyOn(Intl, 'DateTimeFormat').and.callThrough();
    for (let i = 1; i <= 100; i++) {
      const dia = String((i % 28) + 1).padStart(2, '0');
      dataCurta(`2026-10-${dia}`);
      dataLonga(`2026-10-${dia}`);
      diaDaSemana(`2026-10-${dia}`);
    }
    expect(construtor).not.toHaveBeenCalled();
  });
});
