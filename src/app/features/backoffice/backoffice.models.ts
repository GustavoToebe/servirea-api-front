export type StatusParoquia = 'ATIVO' | 'TRIAL' | 'BLOQUEADO' | 'CANCELADO';
export type SituacaoParoquia = '' | 'ATIVOS' | 'INADIMPLENTES' | 'INATIVOS';
export type TipoEmail = '' | 'CONTATO' | 'FINANCEIRO' | 'ADMINISTRATIVO';
export type RoleUsuario = 'ADMIN' | 'COORDENADOR' | 'VISUALIZADOR';
export type StatusVinculo = 'ATIVO' | 'INATIVO';

export interface DashboardResponse {
  total: number;
  ativas: number;
  trial: number;
  bloqueadas: number;
  canceladas: number;
}

export interface ParoquiaAdmin {
  id: string;
  codigo: string;
  slug: string;
  nome: string;
  razaoSocial: string | null;
  cnpj: string | null;
  status: StatusParoquia;
  email: string | null;
  telefone: string | null;
  cep: string | null;
  cidade: string | null;
  uf: string | null;
  bairro: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  observacoes: string | null;
  ultimoPagamentoEm: string | null;
  vigenciaAte: string | null;
  tipoEmail: string | null;
  createdAt: string;
}

export interface FiltroParoquia {
  situacao: SituacaoParoquia;
  nome: string;
  cnpj: string;
  email: string;
  tipoEmail: TipoEmail;
  contratadoDe: string;
  contratadoAte: string;
  vigenciaDe: string;
  vigenciaAte: string;
}

export interface VinculoParoquia {
  tenantId: string;
  tenantNome: string;
  tenantSlug: string;
  role: RoleUsuario;
  status: StatusVinculo;
}

export interface UsuarioAdmin {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  createdAt: string;
  vinculos: VinculoParoquia[];
}

export interface VinculoForm {
  tenantId: string;
  role: RoleUsuario;
  status: StatusVinculo;
}

export interface BackofficeLog {
  id: string;
  userId: string | null;
  tenantAlvoId: string | null;
  acao: string;
  entidade: string;
  entidadeId: string | null;
  ip: string | null;
  requestId: string | null;
  createdAt: string;
}

export interface SuporteToken {
  accessToken: string;
  expiresInSeconds: number;
  tenantAtual: { id: string; nome: string; slug: string };
  suporte: boolean;
}

export const STATUS_PAROQUIA: Record<StatusParoquia, string> = {
  ATIVO: 'Ativa',
  TRIAL: 'Trial',
  BLOQUEADO: 'Inadimplente',
  CANCELADO: 'Inativa'
};

export const ROLE_LABEL: Record<RoleUsuario, string> = {
  ADMIN: 'Administrador',
  COORDENADOR: 'Coordenador',
  VISUALIZADOR: 'Visualizador'
};

export function statusClass(status: StatusParoquia): string {
  if (status === 'ATIVO') return 'bo-ok';
  if (status === 'TRIAL') return 'bo-warn';
  if (status === 'BLOQUEADO') return 'bo-bad';
  return 'bo-mute';
}

export function formatWhen(value?: string | null): string {
  if (!value) return '—';
  const day = value.slice(0, 10);
  const [y, m, d] = day.split('-');
  if (!y || !m || !d) return '—';
  if (value.length > 10) return `${d}/${m}/${y} ${value.slice(11, 16)}`;
  return `${d}/${m}/${y}`;
}

export function initials(nome?: string | null): string {
  const parts = (nome || '').trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '•';
  return parts.slice(0, 2).map(part => part.charAt(0).toUpperCase()).join('');
}

export function apiMessage(err: unknown): string {
  const body = (err as { error?: { message?: string; fieldErrors?: { message: string }[] } })?.error;
  if (body?.fieldErrors?.length) return body.fieldErrors.map(field => field.message).join(' ');
  return body?.message || 'Não foi possível concluir a operação.';
}

export function blankToNull(value: string): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}
