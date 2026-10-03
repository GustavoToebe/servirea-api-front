import { ColunaEscala, COLUNAS_PADRAO_MENSAL, COLUNAS_PADRAO_SEMANAL, EscalaEvento, LayoutEscala } from '../../models/escala.model';
import {
  adaptarVagasAoLayout, classeDeAlinhamento, colunasParaEscalaNova, linhasDaCelebracao, resolverMarcadores, textosDoCabecalho, tituloPadrao,
} from './colunas-layout';

const vela = (posicao: number): ColunaEscala => ({ tipo: 'VAGA', funcao: 'VELA', posicao, escopo: 'CELEBRACAO' } as ColunaEscala);
const layout = (extra: Partial<LayoutEscala>): LayoutEscala => ({ id: 'x', nome: 'L', tipo: 'MENSAL', ativo: true, colunas: [vela(1)], ...extra } as LayoutEscala);

describe('colunas e layout da escala (funções puras)', () => {
  it('título padrão por modelo', () => {
    expect(tituloPadrao('MENSAL', 10, 2026)).toMatch(/^Escala Mensal - .+ 2026$/);
    expect(tituloPadrao('SEMANAL', 10, 2026)).toMatch(/^Escala Semanal - /);
  });

  it('escala nova usa o layout escolhido, depois o padrão ativo, depois o de sistema, depois as colunas embutidas', () => {
    const escolhido = layout({ id: 'e', colunas: [vela(1), vela(2)] });
    const padrao = layout({ id: 'p', padrao: true, colunas: [vela(3)] });
    const sistema = layout({ id: 's', sistema: true, colunas: [vela(4)] });
    expect(colunasParaEscalaNova([escolhido, padrao], 'MENSAL', 'e')).toBe(escolhido.colunas);
    expect(colunasParaEscalaNova([padrao, sistema], 'MENSAL', null)).toBe(padrao.colunas);
    expect(colunasParaEscalaNova([layout({ id: 'p', padrao: true, ativo: false }), sistema], 'MENSAL', null)).toBe(sistema.colunas);
    expect(colunasParaEscalaNova([], 'MENSAL', null)).toBe(COLUNAS_PADRAO_MENSAL);
    expect(colunasParaEscalaNova([], 'SEMANAL', 'inexistente')).toBe(COLUNAS_PADRAO_SEMANAL);
    // layout escolhido sem nenhuma vaga não serve
    expect(colunasParaEscalaNova([layout({ id: 'e', colunas: [] })], 'MENSAL', 'e')).toBe(COLUNAS_PADRAO_MENSAL);
  });

  it('adaptar vagas mantém quem já estava e esvazia o que é novo', () => {
    const ev: EscalaEvento = {
      data: '2026-09-06', horario: '19:00:00', celebracao: 'Missa',
      vagas: [{ funcao: 'VELA', posicao: 1, voluntario_id: 'a' }, { funcao: 'CRUZ', posicao: 1, voluntario_id: 'z' }],
    };
    const [novo] = adaptarVagasAoLayout([ev], [vela(1), vela(2)]);
    expect(novo.vagas.map(v => [v.funcao, v.posicao, v.voluntario_id])).toEqual([['VELA', 1, 'a'], ['VELA', 2, null]]);
    expect(ev.vagas.length).toBe(2);
  });

  it('layout sem posições vira linha de data mais vagas de três em três', () => {
    const colunas = [1, 2, 3, 4].map(p => ({ tipo: 'VAGA', funcao: 'VELA', posicao: p } as ColunaEscala));
    const linhas = linhasDaCelebracao(colunas);
    expect(linhas.map(l => l.elementos.length)).toEqual([1, 3, 1]);
    expect(linhas[0].elementos[0].conteudo).toBe('#DATA_HORA#');
    expect(linhasDaCelebracao([])).toEqual([]);
    expect(linhasDaCelebracao(null)).toEqual([]);
  });

  it('layout com posições respeita linha e coluna e ignora o que é do documento', () => {
    const colunas = [
      { tipo: 'VAGA', funcao: 'VELA', posicao: 1, escopo: 'CELEBRACAO', linha: 1, coluna: 1 },
      { tipo: 'DATA', escopo: 'CELEBRACAO', linha: 0, coluna: 0 },
      { tipo: 'VAGA', funcao: 'VELA', posicao: 2, escopo: 'CELEBRACAO', linha: 1, coluna: 0 },
      { tipo: 'TITULO', escopo: 'DOCUMENTO', linha: 0, coluna: 0 },
    ] as ColunaEscala[];
    const linhas = linhasDaCelebracao(colunas);
    expect(linhas.map(l => l.index)).toEqual([0, 1]);
    expect(linhas[1].elementos.map(e => e.posicao)).toEqual([2, 1]);
  });

  it('cabeçalho: só texto do documento, em ordem de linha e coluna', () => {
    const colunas = [
      { tipo: 'TEXTO_LIVRE', escopo: 'DOCUMENTO', linha: 1, coluna: 0, conteudo: 'b' },
      { tipo: 'TITULO', escopo: 'DOCUMENTO', linha: 0, coluna: 0, conteudo: 'a' },
      { tipo: 'VAGA', escopo: 'DOCUMENTO', linha: 0, coluna: 1 },
      { tipo: 'DATA', escopo: 'CELEBRACAO', linha: 0, coluna: 0 },
    ] as ColunaEscala[];
    expect(textosDoCabecalho(colunas).map(c => c.conteudo)).toEqual(['a', 'b']);
    expect(textosDoCabecalho(undefined)).toEqual([]);
  });

  it('alinhamento e marcadores de texto', () => {
    expect(classeDeAlinhamento('center')).toBe('text-center');
    expect(classeDeAlinhamento('right')).toBe('text-right');
    expect(classeDeAlinhamento(undefined)).toBe('text-left');
    expect(resolverMarcadores('#PAROQUIA# - #TITULO_ESCALA# (#MES_ANO#)', 'Escala', 10, 2026, 'São José')).toMatch(/^São José - Escala \(.+ 2026\)$/);
    expect(resolverMarcadores(undefined, '', 1, 2026, 'P')).toBe('');
  });
});
