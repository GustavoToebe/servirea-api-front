import { FuncaoEscala, Voluntario } from '../../voluntarios/models/voluntario.model';

export type TipoEscala = 'SEMANAL' | 'MENSAL';
export type StatusEscala = 'RASCUNHO' | 'FINALIZADA' | 'CANCELADA';

export interface Escala {
  id: string;
  titulo: string;
  tipo: TipoEscala;
  ano: number;
  mes: number;
  status: StatusEscala;
  observacao: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface EscalaVaga {
  id?: string;
  evento_id?: string;
  funcao: FuncaoEscala;
  posicao: number;
  voluntario_id: string | null;
  voluntario?: Pick<Voluntario, 'id' | 'nome_completo' | 'tipo' | 'ativo'> | null;
}

export interface EscalaEvento {
  id?: string;
  escala_id?: string;
  data: string;
  horario: string;
  celebracao: string;
  vagas: EscalaVaga[];
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
