export type StatusParoquia = 'ATIVO' | 'TRIAL' | 'BLOQUEADO' | 'CANCELADO';
export type SituacaoParoquia = '' | 'ATIVOS' | 'INADIMPLENTES' | 'INATIVOS';
export type TipoEmail = '' | 'CONTATO' | 'FINANCEIRO' | 'ADMINISTRATIVO';
export type RoleUsuario = 'ADMIN' | 'COORDENADOR' | 'VISUALIZADOR';
export type StatusVinculo = 'ATIVO' | 'INATIVO';

export type Periodicidade = 'MENSAL' | 'ANUAL';
export type FormaPagamento = 'PIX' | 'CARTAO_CREDITO' | 'CARTAO_DEBITO' | 'DINHEIRO' | 'TRANSFERENCIA' | 'BOLETO' | 'OUTRO';
export type StatusCobranca = 'ABERTA' | 'PAGA' | 'CANCELADA';
export type StatusAssinatura = 'ATIVA' | 'CANCELADA';

export interface DashboardResponse {
  total: number;
  ativas: number;
  trial: number;
  bloqueadas: number;
  canceladas: number;
  emAtraso: number;
  recebidoNoMes: number;
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
  planoNome: string | null;
  periodicidade: Periodicidade | null;
  cobrancasVencidas: number;
  diasAtraso: number;
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
  /** Só paróquias com cobrança vencida em aberto. Opcional: outras telas listam paróquias sem filtro. */
  emAtraso?: boolean;
}

export interface PrecoPlano {
  id: string;
  periodicidade: Periodicidade;
  valor: number;
  vigenteDesde: string;
}

export interface Plano {
  id: string;
  codigo: string;
  nome: string;
  limiteVoluntarios: number | null;
  ativo: boolean;
  precoMensal: number | null;
  precoAnual: number | null;
  precos: PrecoPlano[];
}

export interface Assinatura {
  id: string;
  planoId: string;
  planoNome: string;
  periodicidade: Periodicidade;
  valor: number;
  diaVencimento: number;
  inicio: string;
  fim: string | null;
  status: StatusAssinatura;
  observacoes: string | null;
}

export interface Cobranca {
  id: string;
  assinaturaId: string;
  competenciaInicio: string;
  competenciaFim: string;
  vencimento: string;
  valor: number;
  status: StatusCobranca;
  vencida: boolean;
  pagoEm: string | null;
  valorPago: number | null;
  formaPagamento: FormaPagamento | null;
  observacao: string | null;
}

export interface Financeiro {
  assinaturaAtual: Assinatura | null;
  assinaturas: Assinatura[];
  cobrancas: Cobranca[];
  resumo: {
    vencidas: number;
    diasAtraso: number;
    valorEmAtraso: number;
    proximoVencimento: string | null;
    totalPagoNoAno: number;
  };
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

export const PERIODICIDADE: Record<Periodicidade, string> = {
  MENSAL: 'Mensal',
  ANUAL: 'Anual'
};

export const FORMA_PAGAMENTO: Record<FormaPagamento, string> = {
  PIX: 'PIX',
  CARTAO_CREDITO: 'Cartão de crédito',
  CARTAO_DEBITO: 'Cartão de débito',
  DINHEIRO: 'Dinheiro',
  TRANSFERENCIA: 'Transferência',
  BOLETO: 'Boleto',
  OUTRO: 'Outro'
};

const MOEDA = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatMoney(value?: number | null): string {
  return value === null || value === undefined ? '—' : MOEDA.format(value);
}

/** "2026-09-01" → "09/2026" (competência). */
export function formatCompetencia(value: string): string {
  const [y, m] = value.split('-');
  return `${m}/${y}`;
}

/** Hoje no fuso do navegador, em ISO (yyyy-mm-dd), para inputs type=date. */
export function todayIso(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

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
