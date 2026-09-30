import { ItemAssinatura, LINHAS_POR_FOLHA, LINHAS_POR_FOLHA_PAISAGEM, ListaAssinaturaService, Ordem, OrdenarPor, ordenar } from './lista-assinatura.service';
import { Orientacao } from '../../../shared/export/orientacao';

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
    expect(texto).toContain('1. Ana <b>');
    expect(folha.innerHTML).toContain('Ana &lt;b&gt;');
    const segunda = new ListaAssinaturaService().montarFolha([{ nome: 'Bia' }],
      { titulo: 'T', subtitulo: '', ordenarPor: 'NOME', ordem: 'ASC' }, 'Folha 2 de 2', LINHAS_POR_FOLHA);
    expect(segunda.textContent).toContain(`${LINHAS_POR_FOLHA + 1}. Bia`);
    expect(LINHAS_POR_FOLHA).toBeGreaterThan(15);
  });
  describe('orientação do PDF', () => {
    const opcoes = (orientacao?: Orientacao) =>
      ({ titulo: 'T', subtitulo: '', ordenarPor: 'NOME' as OrdenarPor, ordem: 'ASC' as Ordem, orientacao });

    async function pdfGerado(quantidade: number, orientacao?: Orientacao): Promise<string> {
      let arquivo: Blob | null = null;
      spyOn(URL, 'createObjectURL').and.callFake((b: Blob | MediaSource) => { arquivo = b as Blob; return 'blob:teste'; });
      spyOn(URL, 'revokeObjectURL');
      const baixar = function (this: HTMLAnchorElement) { return true; };
      spyOn(HTMLAnchorElement.prototype, 'dispatchEvent').and.callFake(baixar);
      spyOn(HTMLAnchorElement.prototype, 'click').and.callFake(baixar as unknown as () => void);
      const lista = Array.from({ length: quantidade }, (_, i) => ({ nome: `Pessoa ${String(i).padStart(2, '0')}` }));
      await new ListaAssinaturaService().gerarPdf(lista, opcoes(orientacao));
      await new Promise(pronto => setTimeout(pronto, 50));
      return (arquivo as unknown as Blob).text();
    }
    const paginas = (pdf: string) => [...pdf.matchAll(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)\s*\]/g)].map(m => [Number(m[1]), Number(m[2])]);

    it('retrato é o padrão: páginas A4 em pé', async () => {
      const [[largura, altura]] = paginas(await pdfGerado(3));
      expect(largura).toBeLessThan(altura);
    });

    it('paisagem gera páginas A4 deitadas e usa menos linhas por folha', async () => {
      const folhas = paginas(await pdfGerado(LINHAS_POR_FOLHA_PAISAGEM + 1, 'PAISAGEM'));
      expect(folhas.length).toBe(2);
      folhas.forEach(([largura, altura]) => expect(largura).toBeGreaterThan(altura));
      expect(LINHAS_POR_FOLHA_PAISAGEM).toBeLessThan(LINHAS_POR_FOLHA);
    });

    it('a folha da imagem fica mais larga em paisagem', () => {
      const servico = new ListaAssinaturaService();
      const largura = (o?: Orientacao) => parseInt(servico.montarFolha([{ nome: 'A' }], opcoes(o), '').style.width, 10);
      expect(largura('PAISAGEM')).toBeGreaterThan(largura('RETRATO'));
      expect(largura()).toBe(largura('RETRATO'));
    });
  });
});
