export type TipoVoluntario = 'COROINHA' | 'ACOLITO' | 'AMBOS' | 'MESC';
export type FuncaoEscala = 'MISSAL' | 'CRUZ' | 'CREDENCIA' | 'VELA' | 'COLETA' | 'SINO' | 'OUTRO';
export type HorarioEstudo = 'MANHA' | 'TARDE' | 'NOITE';

export interface Responsavel {
  id?: string;
  voluntario_id?: string;
  parentesco: string;
  nome: string;
  telefone?: string | null;
  celular?: string | null;
  email?: string | null;
  principal: boolean;
}

export interface Voluntario {
  id: string;
  nome_completo: string;
  data_nascimento: string | null;
  tipo: TipoVoluntario;
  ativo: boolean;
  foto_path: string | null;
  foto_url?: string | null;
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
  mandato_inicio?: string | null;
  mandato_fim?: string | null;
  responsaveis?: Responsavel[];
  created_at?: string;
  updated_at?: string;
}

export interface VoluntarioFilters {
  nome?: string;
  idade?: number | null;
  funcao?: FuncaoEscala | '';
  status?: 'ATIVO' | 'INATIVO' | '';
  tipo?: TipoVoluntario | '';
}

export interface CompromissoVoluntario {
  voluntario_id: string;
  escala_id: string;
  escala_titulo: string;
  escala_status: string;
  data: string;
  horario: string;
  celebracao: string;
  funcao: FuncaoEscala;
}

export const FUNCOES_LABEL: Record<FuncaoEscala, string> = {
  MISSAL: 'Missal',
  CRUZ: 'Cruz',
  CREDENCIA: 'Credência',
  VELA: 'Vela',
  COLETA: 'Coleta',
  SINO: 'Sino',
  OUTRO: 'Outro'
};

export const TIPO_VOLUNTARIO_LABEL: Record<TipoVoluntario, string> = {
  COROINHA: 'Coroinha',
  ACOLITO: 'Acólito',
  AMBOS: 'Coroinha / Acólito',
  MESC: 'Ministro (MESC)'
};

export const HORARIO_ESTUDO_LABEL: Record<HorarioEstudo, string> = {
  MANHA: 'Manhã',
  TARDE: 'Tarde',
  NOITE: 'Noite'
};

export const FUNCOES_FORM: FuncaoEscala[] = ['MISSAL', 'CRUZ', 'CREDENCIA', 'VELA', 'COLETA', 'SINO'];

export const PARENTESCOS = [
  'Pai', 'Mãe', 'Avô', 'Avó', 'Tio', 'Tia', 'Irmão', 'Irmã',
  'Padrinho', 'Madrinha', 'Responsável', 'Outro'
];

export const TIPOS_VOLUNTARIO: TipoVoluntario[] = ['COROINHA', 'ACOLITO', 'AMBOS', 'MESC'];
export const FUNCOES_ESCALA: FuncaoEscala[] = ['MISSAL', 'CRUZ', 'CREDENCIA', 'VELA', 'COLETA', 'SINO', 'OUTRO'];
export const HORARIOS_ESTUDO: HorarioEstudo[] = ['MANHA', 'TARDE', 'NOITE'];
