export type Tipo = 'RECEITA' | 'DESPESA';
export type Situacao = 'PENDENTE' | 'PAGO' | 'CANCELADO';
export type TipoConta = 'CORRENTE' | 'POUPANCA' | 'CAIXA' | 'OUTRA';
export type TipoChavePix = 'CPF' | 'CNPJ' | 'EMAIL' | 'TELEFONE' | 'ALEATORIA';
export interface ChavePix { tipo: TipoChavePix; chave: string; principal: boolean; }
export const ROTULO_TIPO_CONTA: Record<TipoConta, string> = { CORRENTE: 'Conta corrente', POUPANCA: 'Poupança', CAIXA: 'Caixa', OUTRA: 'Outra' };
export const ROTULO_TIPO_CHAVE: Record<TipoChavePix, string> = { CPF: 'CPF', CNPJ: 'CNPJ', EMAIL: 'E-mail', TELEFONE: 'Telefone', ALEATORIA: 'Chave aleatória' };
/** Conta bancária ou caixa. Os dados do banco são opcionais no caixa e em contas antigas. */
export interface Conta {
  id: string; nome: string; saldoInicial: number; dataSaldoInicial: string; ativo: boolean;
  tipoConta?: TipoConta; banco?: string | null; agencia?: string | null; numeroConta?: string | null; titular?: string | null;
  dataAbertura?: string | null; dataEncerramento?: string | null; chavesPix?: ChavePix[];
}
export type ContaRequest = Omit<Conta, 'id'> & { tipoConta: TipoConta; chavesPix: ChavePix[] };
/** Plano de contas: grupo (organiza, `ehGrupo`) ou conta contábil (recebe lançamentos, tem `grupoId`). A conta tem o tipo do grupo. */
export interface Categoria { id: string; nome: string; ativo: boolean; tipo: Tipo; grupoId: string | null; ehGrupo: boolean; }
export type CategoriaRequest = Pick<Categoria, 'nome' | 'ativo' | 'tipo' | 'grupoId'>;
export const ROTULO_TIPO: Record<Tipo, string> = { DESPESA: 'Saídas (débito)', RECEITA: 'Entradas (crédito)' };
export interface Movimento { id: string; versao: number; descricao: string; tipo: Tipo; situacao: Situacao; valor: number; vencimento: string; dataPagamento: string | null; contaId: string; conta: string; categoriaId: string; categoria: string; observacoes: string | null; }
export type MovimentoRequest = Pick<Movimento, 'descricao' | 'tipo' | 'valor' | 'vencimento' | 'contaId' | 'categoriaId' | 'observacoes' | 'versao'>;
export interface Pagina { itens: Movimento[]; total: number; pagina: number; tamanho: number; }
export interface Resumo { de: string; ate: string; receitas: number; despesas: number; resultado: number; saldoTotal: number; contas: { id: string; nome: string; saldo: number }[]; }
export interface Filtros { de: string; ate: string; nome: string; contaId: string; categoriaId: string; situacao: Situacao | ''; tipo: Tipo | ''; pagina: number; tamanho: number; }
