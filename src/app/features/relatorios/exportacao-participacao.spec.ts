import { lerCsv } from './exportacao-participacao';

describe('leitura da exportação de participação', () => {
  it('preserva separadores, aspas e quebras de linha dentro dos campos', () => {
    expect(lerCsv('\uFEFFNome;Observação\r\n"Ana; Maria";"Disse ""sim""\ne voltou"\r\n'))
      .toEqual([['Nome', 'Observação'], ['Ana; Maria', 'Disse "sim"\ne voltou']]);
  });
});
