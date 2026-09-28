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
