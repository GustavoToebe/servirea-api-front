import { FuncaoEscala } from '../../voluntarios/models/voluntario.model';

export type TipoEscala = 'SEMANAL' | 'MENSAL';
export type StatusEscala = 'RASCUNHO' | 'FINALIZADA' | 'CANCELADA';

export interface Escala {
  /** Número curto da escala na paróquia (V038), para ditar e copiar. */
  sequencial?: number | null;
  id: string;
  titulo: string;
  tipo: TipoEscala;
  ano: number;
  mes: number;
  status: StatusEscala;
  observacao: string | null;
  colunas?: ColunaEscala[] | null;
  layoutId?: string | null;
  /** Controle otimista da API (seção 47): o PUT precisa mandar a versão que leu. */
  version?: number | null;
}

export type Presenca = 'PENDENTE' | 'PRESENTE' | 'FALTOU';

export interface EscalaVaga {
  id?: string;
  evento_id?: string;
  funcao: FuncaoEscala;
  posicao: number;
  voluntario_id: string | null;
  voluntario?: { id: string; nome_completo: string } | null;
  presenca?: Presenca;
}

export interface EscalaEvento {
  id?: string;
  escala_id?: string;
  data: string;
  horario: string;
  celebracao: string;
  vagas: EscalaVaga[];
  /** Linha de referência da escala replicada: dia da origem que não existe neste mês. Nunca é publicada. */
  referencia?: boolean;
  /** Só na tela, nunca vai para a API: dia que só existe no mês novo (a 5ª quinta), para preencher à mão. */
  ocorrenciaNova?: boolean;
}

export interface EscalaDetalhe extends Escala {
  eventos: EscalaEvento[];
}

export interface EscalaFilters {
  ano?: number | null;
  mes?: number | null;
  tipo?: TipoEscala | '';
  status?: StatusEscala | '';
}

export const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];

export const STATUS_LABEL: Record<StatusEscala, string> = {
  RASCUNHO: 'Não finalizada',
  FINALIZADA: 'Finalizada',
  CANCELADA: 'Cancelada'
};

// ---- Indisponibilidades do mês e apoio à montagem da mensal (PLANO-007)

export type PeriodoDia = 'MANHA' | 'TARDE' | 'NOITE';
export type SituacaoResposta = 'COM_RESTRICAO' | 'SEM_RESTRICAO' | 'PENDENTE';

/** `periodo` nulo = o dia inteiro. */
export interface Indisponibilidade {
  voluntarioId: string;
  data: string;
  periodo: PeriodoDia | null;
  observacao?: string | null;
}

export interface IndisponibilidadesMes {
  versao: number;
  ano: number;
  mes: number;
  itens: Indisponibilidade[];
  semRestricao: string[];
}

export interface ApoioVoluntario {
  voluntarioId: string;
  situacao: SituacaoResposta;
  indisponiveis: { data: string; periodo: PeriodoDia | null }[];
  irmaos: string[];
}

export interface ApoioEscala {
  voluntarios: ApoioVoluntario[];
}

export const SITUACAO_LABEL: Record<SituacaoResposta, string> = {
  COM_RESTRICAO: 'Com restrição',
  SEM_RESTRICAO: 'Sem restrição',
  PENDENTE: 'Pendente'
};

export const PERIODO_LABEL: Record<PeriodoDia, string> = { MANHA: 'Só manhã', TARDE: 'Só tarde', NOITE: 'Só noite' };

/** Período do horário da missa: antes das 12h manhã, antes das 18h tarde, senão noite. */
export function periodoDoHorario(horario: string): PeriodoDia {
  const h = Number((horario || '00').slice(0, 2));
  return h < 12 ? 'MANHA' : h < 18 ? 'TARDE' : 'NOITE';
}

/** A pessoa avisou que não pode nesta data (dia inteiro ou no período do horário)? */
export function indisponivelEm(apoio: ApoioEscala | null, voluntarioId: string, data: string, horario: string): boolean {
  const v = apoio?.voluntarios.find(x => x.voluntarioId === voluntarioId);
  if (!v) return false;
  const periodo = periodoDoHorario(horario);
  return v.indisponiveis.some(i => i.data === data && (i.periodo === null || i.periodo === periodo));
}

export type TipoElementoLayout = 'TITULO' | 'SUBTITULO' | 'DATA' | 'VAGA' | 'TEXTO_LIVRE';
export type EscopoLayout = 'DOCUMENTO' | 'CELEBRACAO';

export interface ColunaEscala {
  // Atributos de vaga/coluna legado
  funcao?: FuncaoEscala;
  posicao?: number;
  rotulo?: string;
  ordem?: number;
  
  // Novos atributos do editor visual (retrocompativel)
  tipo?: TipoElementoLayout;
  idLocal?: string;
  conteudo?: string;
  alinhamento?: 'left' | 'center' | 'right';
  negrito?: boolean;
  linha?: number;
  coluna?: number;
  largura?: number;
  escopo?: EscopoLayout;
}

/** Colunas de fábrica quando a API de layouts ainda não respondeu. */
export const COLUNAS_PADRAO_SEMANAL: ColunaEscala[] = [
  { idLocal: 'c-dt', tipo: 'DATA', escopo: 'CELEBRACAO', linha: 0, coluna: 0, largura: 1, conteudo: '#DATA_HORA#' },
  { idLocal: 'v-mis', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 0, coluna: 1, largura: 1, ordem: 1, funcao: 'MISSAL', posicao: 1, rotulo: 'Acólito Missal' },
  { idLocal: 'v-crz', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 0, coluna: 2, largura: 1, ordem: 2, funcao: 'CRUZ', posicao: 1, rotulo: 'Cruz' },
  { idLocal: 'v-crd', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 0, coluna: 3, largura: 1, ordem: 3, funcao: 'CREDENCIA', posicao: 1, rotulo: 'Credência' },
  { idLocal: 'v-vl1', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 0, coluna: 4, largura: 1, ordem: 4, funcao: 'VELA', posicao: 1, rotulo: 'Vela 1' },
  { idLocal: 'v-vl2', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 0, coluna: 5, largura: 1, ordem: 5, funcao: 'VELA', posicao: 2, rotulo: 'Vela 2' },
  { idLocal: 'v-sn1', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 0, coluna: 6, largura: 1, ordem: 6, funcao: 'SINO', posicao: 1, rotulo: 'Sino 1' },
  { idLocal: 'v-sn2', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 0, coluna: 7, largura: 1, ordem: 7, funcao: 'SINO', posicao: 2, rotulo: 'Sino 2' }
];

export const COLUNAS_PADRAO_MENSAL: ColunaEscala[] = [
  { idLocal: 'c-dt', tipo: 'DATA', escopo: 'CELEBRACAO', linha: 0, coluna: 0, largura: 12, conteudo: '#DATA_HORA#' },
  { idLocal: 'v-mis', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 1, coluna: 0, largura: 1, ordem: 1, funcao: 'MISSAL', posicao: 1, rotulo: 'Acólito Missal' },
  { idLocal: 'v-crz', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 1, coluna: 1, largura: 1, ordem: 2, funcao: 'CRUZ', posicao: 1, rotulo: 'Cruz' },
  { idLocal: 'v-crd', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 1, coluna: 2, largura: 1, ordem: 3, funcao: 'CREDENCIA', posicao: 1, rotulo: 'Credência' },
  { idLocal: 'v-vl1', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 2, coluna: 0, largura: 1, ordem: 4, funcao: 'VELA', posicao: 1, rotulo: 'Círio 1' },
  { idLocal: 'v-vl2', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 2, coluna: 1, largura: 1, ordem: 5, funcao: 'VELA', posicao: 2, rotulo: 'Círio 2' },
  { idLocal: 'v-cl1', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 3, coluna: 0, largura: 1, ordem: 6, funcao: 'COLETA', posicao: 1, rotulo: 'Oferta 1' },
  { idLocal: 'v-cl2', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 3, coluna: 1, largura: 1, ordem: 7, funcao: 'COLETA', posicao: 2, rotulo: 'Oferta 2' },
  { idLocal: 'v-cl3', tipo: 'VAGA', escopo: 'CELEBRACAO', linha: 3, coluna: 2, largura: 1, ordem: 8, funcao: 'COLETA', posicao: 3, rotulo: 'Oferta 3' }
];

export interface LayoutEscala {
  id: string;
  nome: string;
  tipo: TipoEscala;
  colunas: ColunaEscala[];
  /** Inativo: continua na lista de layouts, mas não é oferecido ao montar uma escala. */
  ativo: boolean;
  sistema: boolean;
  descricao?: string | null;
  /** No máximo um por modelo: o que a escala nova usa quando ninguém escolhe layout. */
  padrao?: boolean;
}

// ---- Helpers do layout visual (vagas x blocos de texto)

/** Só as vagas do layout (blocos VAGA ou colunas legado) — o que vira coluna da grade. */
export function vagasDoLayout(colunas: ColunaEscala[] | null | undefined): ColunaEscala[] {
  return (colunas || []).filter(c => c.tipo === 'VAGA' || (!c.tipo && !!c.funcao));
}

/** Blocos de texto do layout por escopo (Título, Subtítulo, Texto, Data), na ordem do quadro. */
export function textosDoLayout(colunas: ColunaEscala[] | null | undefined, escopo: EscopoLayout): ColunaEscala[] {
  return (colunas || [])
    .filter(c => !!c.tipo && c.tipo !== 'VAGA' && (c.escopo || 'CELEBRACAO') === escopo)
    .sort((a, b) => (a.linha || 0) - (b.linha || 0) || (a.coluna || 0) - (b.coluna || 0));
}

/** Troca as tags #...# de um texto fixo do layout pelos dados reais da escala. */
export function resolverTags(texto: string | undefined, ctx: { titulo?: string; mesAno?: string; paroquia?: string }): string {
  return (texto || '')
    .replaceAll('#TITULO_ESCALA#', ctx.titulo || '')
    .replaceAll('#MES_ANO#', ctx.mesAno || '')
    .replaceAll('#PAROQUIA#', ctx.paroquia || '');
}
