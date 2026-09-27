import { ItemAssinatura, LINHAS_POR_FOLHA, ListaAssinaturaService, ordenar } from './lista-assinatura.service';

describe('lista de assinatura', () => {
  const itens: ItemAssinatura[] = [
    { nome: 'Bruno', numero: 3, nascimento: '2012-01-01', tipo: 'Acólito' },
    { nome: 'ana', numero: 10, nascimento: '2015-06-01', tipo: 'Coroinha' },
    { nome: 'Érica', numero: null, nascimento: null, tipo: null },
    { nome: 'Carlos', numero: 1, nascimento: '2010-03-01', tipo: 'Coroinha' }
  ];
  const nomes = (l: ItemAssinatura[]) => l.map(i => i.nome);

  it('ordena por nome sem diferenciar maiúscula e acento', () => {
    expect(nomes(ordenar(itens, 'NOME', 'ASC'))).toEqual(['ana', 'Bruno', 'Carlos', 'Érica']);
    expect(nomes(ordenar(itens, 'NOME', 'DESC'))).toEqual(['Érica', 'Carlos', 'Bruno', 'ana']);
  });

  it('número, idade e tipo; quem não tem o dado vai para o fim nos dois sentidos', () => {
    expect(nomes(ordenar(itens, 'NUMERO', 'ASC'))).toEqual(['Carlos', 'Bruno', 'ana', 'Érica']);
    expect(nomes(ordenar(itens, 'NUMERO', 'DESC'))).toEqual(['ana', 'Bruno', 'Carlos', 'Érica']);
    expect(nomes(ordenar(itens, 'IDADE', 'ASC'))).toEqual(['ana', 'Bruno', 'Carlos', 'Érica']);
    expect(nomes(ordenar(itens, 'TIPO', 'ASC'))).toEqual(['Bruno', 'ana', 'Carlos', 'Érica']);
  });

  it('a folha tem título, subtítulo, as duas colunas e o nome escapado', () => {
    const folha = new ListaAssinaturaService().montarFolha(
      [{ nome: 'Ana <b>' }], { titulo: 'Reunião Coroinhas - 2026', subtitulo: 'PARÓQUIA X / Cascavel - PR', ordenarPor: 'NOME', ordem: 'ASC' }, '');
    const texto = folha.textContent ?? '';
    expect(texto).toContain('Reunião Coroinhas - 2026');
    expect(texto).toContain('PARÓQUIA X / Cascavel - PR');
    expect(texto).toContain('Assinatura / Responsável');
    expect(folha.innerHTML).toContain('Ana &lt;b&gt;');
    expect(LINHAS_POR_FOLHA).toBeGreaterThan(15);
  });
});
