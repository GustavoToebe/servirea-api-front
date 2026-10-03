import {
  ColunaEscala, COLUNAS_PADRAO_MENSAL, COLUNAS_PADRAO_SEMANAL, EscalaEvento, EscalaVaga, LayoutEscala, MESES, TipoEscala, vagasDoLayout,
} from '../../models/escala.model';

export interface LinhaCelebracao { index: number; elementos: ColunaEscala[]; }

/** Título sugerido para uma escala nova ou regenerada. */
export function tituloPadrao(tipo: TipoEscala, mes: number, ano: number): string {
  return `Escala ${tipo === 'SEMANAL' ? 'Semanal' : 'Mensal'} - ${MESES[mes - 1]} ${ano}`;
}

/**
 * Colunas de uma escala nova: as do layout escolhido (se tiver vaga); senão o layout padrão ativo do modelo; senão o de sistema;
 * senão as colunas embutidas.
 */
export function colunasParaEscalaNova(layouts: readonly LayoutEscala[], tipo: TipoEscala, layoutId: string | null): ColunaEscala[] {
  if (layoutId) {
    const escolhido = layouts.find(x => x.id === layoutId);
    if (escolhido && vagasDoLayout(escolhido.colunas).length) return escolhido.colunas || [];
  }
  const padrao = layouts.find(x => x.tipo === tipo && x.padrao && x.ativo)
    ?? layouts.find(x => x.tipo === tipo && x.sistema && x.ativo);
  return padrao ? padrao.colunas : (tipo === 'MENSAL' ? COLUNAS_PADRAO_MENSAL : COLUNAS_PADRAO_SEMANAL);
}

/** Mantém as vagas já preenchidas quando o layout muda: o que não existe mais some, o que é novo entra vazio. */
export function adaptarVagasAoLayout(eventos: readonly EscalaEvento[], colunas: ColunaEscala[]): EscalaEvento[] {
  const layoutVagas = vagasDoLayout(colunas);
  return eventos.map(e => {
    const novasVagas: EscalaVaga[] = layoutVagas.map(lv => {
      const existente = e.vagas.find(v => v.funcao === lv.funcao && v.posicao === (lv.posicao || 1));
      return {
        funcao: lv.funcao!,
        posicao: lv.posicao || 1,
        voluntario_id: existente?.voluntario_id || null,
        voluntario: existente?.voluntario || null,
      };
    });
    return { ...e, vagas: novasVagas };
  });
}

/**
 * Linhas do cartão de cada celebração. Layout sem posição explícita ganha uma linha de data e as vagas de três em três;
 * com posição, respeita linha e coluna.
 */
export function linhasDaCelebracao(colunas: ColunaEscala[] | null | undefined): LinhaCelebracao[] {
  const celBlocos = (colunas || []).filter(c => (c.escopo || 'CELEBRACAO') === 'CELEBRACAO');
  const temLinhas = celBlocos.some(c => c.linha !== undefined);
  if (!temLinhas) {
    const vagas = vagasDoLayout(colunas ?? []);
    if (!vagas.length) return [];
    const res: LinhaCelebracao[] = [];
    res.push({ index: 0, elementos: [{ tipo: 'DATA', escopo: 'CELEBRACAO', linha: 0, coluna: 0, largura: 12, conteudo: '#DATA_HORA#' }] });
    let lin = 1;
    for (let i = 0; i < vagas.length; i += 3) {
      const pedaco = vagas.slice(i, i + 3).map((v, col) => ({
        ...v,
        tipo: 'VAGA' as const,
        escopo: 'CELEBRACAO' as const,
        linha: lin,
        coluna: col,
        largura: 1,
      }));
      res.push({ index: lin, elementos: pedaco });
      lin++;
    }
    return res;
  }
  const maxLinha = celBlocos.reduce((max, e) => Math.max(max, e.linha || 0), -1);
  const result: LinhaCelebracao[] = [];
  for (let i = 0; i <= maxLinha; i++) {
    const els = celBlocos.filter(e => (e.linha || 0) === i).sort((a, b) => (a.coluna || 0) - (b.coluna || 0));
    if (els.length > 0) result.push({ index: i, elementos: els });
  }
  return result;
}

/** Textos do cabeçalho do documento (título, subtítulo, textos livres), em ordem de linha e coluna. */
export function textosDoCabecalho(colunas: readonly ColunaEscala[] | null | undefined): ColunaEscala[] {
  return (colunas || [])
    .filter(c => c.escopo === 'DOCUMENTO' && c.tipo && c.tipo !== 'VAGA')
    .sort((a, b) => (a.linha || 0) - (b.linha || 0) || (a.coluna || 0) - (b.coluna || 0));
}

export function classeDeAlinhamento(align?: string): string {
  if (align === 'center') return 'text-center';
  if (align === 'right') return 'text-right';
  return 'text-left';
}

/** Troca os marcadores de texto do layout (#TITULO_ESCALA#, #MES_ANO#, #PAROQUIA#) pelos valores da escala. */
export function resolverMarcadores(texto: string | undefined, titulo: string, mes: number, ano: number, paroquia: string): string {
  return (texto || '')
    .replaceAll('#TITULO_ESCALA#', titulo || '')
    .replaceAll('#MES_ANO#', `${MESES[mes - 1]} ${ano}`)
    .replaceAll('#PAROQUIA#', paroquia);
}
