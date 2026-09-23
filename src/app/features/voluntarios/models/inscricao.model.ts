import { FuncaoEscala, TipoVoluntario } from './voluntario.model';

export type StatusInscricao = 'PENDENTE' | 'APROVADA' | 'REJEITADA';

export interface InscricaoResponsavel {
  id?: string;
  inscricao_id?: string;
  parentesco: string;
  nome: string;
  telefone?: string | null;
  celular?: string | null;
  email?: string | null;
  principal: boolean;
}

export interface InscricaoDados {
  nome_completo: string;
  data_nascimento: string | null;
  tipo: TipoVoluntario;
  foto_path?: string | null;
  etapa_catequese: string | null;
  eucaristia_ano: string | null;
  crisma_ano: string | null;
  rua: string | null;
  numero: string | null;
  bairro: string | null;
  telefone: string | null;
  celular: string | null;
  email: string | null;
  horario_estudo: string | null;
  observacoes: string | null;
  autoriza_whatsapp: boolean;
  funcoes_habilitadas: FuncaoEscala[];
}

export interface Inscricao extends InscricaoDados {
  id: string;
  status: StatusInscricao;
  voluntario_id: string | null;
  aprovado_por: string | null;
  rejeitado_por: string | null;
  data_aprovacao?: string | null;
  data_rejeicao: string | null;
  motivo_rejeicao: string | null;
  created_at: string;
  updated_at?: string | null;
  foto_url?: string | null;
  responsaveis?: InscricaoResponsavel[];
  inscricao_responsaveis?: InscricaoResponsavel[];
}

export interface InscricaoPublicaPayload {
  dados: InscricaoDados;
  responsaveis: InscricaoResponsavelPayload[];
  turnstileToken: string;
}

export interface InscricaoResponsavelPayload {
  parentesco: string;
  nome: string;
  telefone: string | null;
  celular: string | null;
  email: string | null;
  principal: boolean;
}

export interface EnviarInscricaoResponse {
  ok: boolean;
  id?: string;
  message: string;
}

export const STATUS_INSCRICAO_LABEL: Record<StatusInscricao, string> = {
  PENDENTE: 'Aguardando aprovação',
  APROVADA: 'Aprovada',
  REJEITADA: 'Rejeitada'
};
