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

export interface ColunaEscala {
  funcao: FuncaoEscala;
  posicao: number;
  rotulo: string;
  ordem?: number;
}

/** Colunas de fábrica quando a API de layouts ainda não respondeu. */
export const COLUNAS_PADRAO_SEMANAL: ColunaEscala[] = [
  { ordem: 1, funcao: 'MISSAL', posicao: 1, rotulo: 'Acólito Missal' },
  { ordem: 2, funcao: 'CRUZ', posicao: 1, rotulo: 'Cruz' },
  { ordem: 3, funcao: 'CREDENCIA', posicao: 1, rotulo: 'Credência' },
  { ordem: 4, funcao: 'VELA', posicao: 1, rotulo: 'Vela 1' },
  { ordem: 5, funcao: 'VELA', posicao: 2, rotulo: 'Vela 2' },
  { ordem: 6, funcao: 'SINO', posicao: 1, rotulo: 'Sino 1' },
  { ordem: 7, funcao: 'SINO', posicao: 2, rotulo: 'Sino 2' }
];

export const COLUNAS_PADRAO_MENSAL: ColunaEscala[] = [
  ...COLUNAS_PADRAO_SEMANAL.slice(0, 5),
  { ordem: 6, funcao: 'COLETA', posicao: 1, rotulo: 'Coleta' },
  { ordem: 7, funcao: 'COLETA', posicao: 2, rotulo: 'Coleta' },
  { ordem: 8, funcao: 'COLETA', posicao: 3, rotulo: 'Coleta' },
  { ordem: 9, funcao: 'COLETA', posicao: 4, rotulo: 'Coleta' },
  { ordem: 10, funcao: 'SINO', posicao: 1, rotulo: 'Sino 1' },
  { ordem: 11, funcao: 'SINO', posicao: 2, rotulo: 'Sino 2' }
];

export interface LayoutEscala {
  id: string;
  nome: string;
  tipo: TipoEscala;
  colunas: ColunaEscala[];
  ativo: boolean;
  sistema: boolean;
}
