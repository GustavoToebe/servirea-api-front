import { criarXlsx, csvDaTabela, exportarTabela, lerCsv, TabelaExportacao } from './exportacao-tabela';

describe('arquivos das listagens e relatórios', () => {
  const tabela: TabelaExportacao = { nome: 'teste', titulo: 'Teste', colunas: ['Descrição', 'Valor'], linhas: [['=Não executar', 12.5], ['Texto; com "aspas"\ne outra linha', -3]] };

  it('CSV preserva campos e neutraliza fórmulas sem transformar números em texto', () => {
    expect(lerCsv(csvDaTabela(tabela))).toEqual([['Descrição', 'Valor'], ["'=Não executar", '12,5'], ['Texto; com "aspas"\ne outra linha', '-3']]);
  });

  it('XLSX abre com números, cabeçalho fixo e texto que começa com = como texto', async () => {
    const arquivo = await criarXlsx(tabela);
    const ExcelJS = await import('exceljs'); const livro = new ExcelJS.Workbook();
    await livro.xlsx.load(await arquivo.arrayBuffer());
    const aba = livro.getWorksheet('Dados')!;
    expect(aba.getCell('A2').value).toBe('=Não executar');
    expect(aba.getCell('B2').value).toBe(12.5);
    expect(aba.getCell('A3').value).toBe('Texto; com "aspas"\ne outra linha');
    expect(aba.views[0].state).toBe('frozen');
  });

  it('não baixa um arquivo se a tela foi abandonada', async () => {
    const baixar = spyOn(URL, 'createObjectURL');
    await exportarTabela(tabela, 'json', () => false);
    expect(baixar).not.toHaveBeenCalled();
  });

  it('recusa volume acima do limite em vez de truncar a exportação', async () => {
    await expectAsync(exportarTabela({ ...tabela, limiteLinhas: 1 }, 'json')).toBeRejectedWithError(/Reduza os filtros/);
  });
});
