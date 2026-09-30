export type TipoLayout = 'TODOS' | 'RESPONSAVEL' | 'COROINHA' | 'ACOLITO' | 'COROINHA_ACOLITO' | 'MINISTRO';

export const TIPO_LAYOUT_LABEL: Record<TipoLayout, string> = {
  TODOS: 'Todos',
  RESPONSAVEL: 'Responsáveis',
  COROINHA: 'Coroinhas',
  ACOLITO: 'Acólitos',
  COROINHA_ACOLITO: 'Coroinha / acólito',
  MINISTRO: 'Ministros'
};

export type TipoEnvio = 'EMAIL' | 'WHATSAPP';

export const TIPO_ENVIO_LABEL: Record<TipoEnvio, string> = {
  EMAIL: 'E-mail',
  WHATSAPP: 'WhatsApp'
};

export interface Layout {
  id: string;
  nome: string;
  tipoLayout: TipoLayout;
  tipoEnvio: TipoEnvio;
  assunto?: string | null;
  conteudo: string;
  ativo: boolean;
}

export interface TagLayout {
  codigo: string;
  descricao: string;
}

export interface PreVisualizarRequest {
  tipoLayout: TipoLayout;
  tipoEnvio: TipoEnvio;
  assunto?: string | null;
  conteudo: string;
}

export interface PreVisualizacaoResponse {
  assunto?: string | null;
  conteudo: string;
}

// ---- Comunicado (PLANO-005)

export type EnviarPara = 'PESSOA' | 'RESPONSAVEIS' | 'AMBOS';
export type QuaisContatos = 'PRINCIPAL' | 'TODOS';
export type StatusComunicado = 'NA_FILA' | 'ENVIANDO' | 'CONCLUIDO';
export type StatusEnvio = 'PENDENTE' | 'ENVIADO' | 'FALHA';

export const ENVIAR_PARA_LABEL: Record<EnviarPara, string> = {
  PESSOA: 'A própria pessoa',
  RESPONSAVEIS: 'Responsáveis',
  AMBOS: 'Ambos'
};

export const STATUS_COMUNICADO_LABEL: Record<StatusComunicado, string> = {
  NA_FILA: 'Na fila',
  ENVIANDO: 'Enviando',
  CONCLUIDO: 'Concluído'
};

export const STATUS_ENVIO_LABEL: Record<StatusEnvio, string> = {
  PENDENTE: 'Pendente',
  ENVIADO: 'Enviado',
  FALHA: 'Falha'
};

export interface DestinoPrevia {
  nome: string;
  endereco: string;
  deQuem: 'PESSOA' | 'RESPONSAVEL';
}

export interface DestinatarioPrevia {
  pessoaId: string;
  nome: string;
  destinos: DestinoPrevia[];
  autorizaWhatsapp: boolean | null;
}

export interface CriarComunicado {
  canal: TipoEnvio;
  layoutId: string;
  assunto: string | null;
  enviarPara: EnviarPara;
  contatos: QuaisContatos;
  pessoaIds: string[];
}

export interface PreVisualizacaoComunicado {
  de: string;
  para: string;
  assunto: string | null;
  conteudo: string;
}

export interface Comunicado {
  id: string;
  canal: TipoEnvio;
  layoutNome: string;
  assunto: string | null;
  enviarPara: EnviarPara;
  status: StatusComunicado;
  total: number;
  enviados: number;
  falhas: number;
  createdAt: string;
  concluidoEm: string | null;
}

export interface DestinatarioLinha {
  id: string;
  nome: string;
  destino: string;
  status: StatusEnvio;
  erro: string | null;
  enviadoEm: string | null;
}

export interface ComunicadoDetalhe {
  comunicado: Comunicado;
  destinatarios: DestinatarioLinha[];
  anexos: { id: string; nome: string; tamanho: number }[];
}

export interface WhatsappConfig {
  instancia: string;
  ativo: boolean;
  tokenConfigurado: boolean;
}

/** Mesmos limites da API para os anexos do e-mail. */
export const ANEXOS_MAX = 5;
export const ANEXOS_MAX_BYTES = 10 * 1024 * 1024;
export const ANEXOS_TIPOS = [
  'application/pdf', 'image/jpeg', 'image/png',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];
