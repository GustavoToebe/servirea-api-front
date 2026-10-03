export type Tipo = 'RECEITA' | 'DESPESA';
export type Situacao = 'PENDENTE' | 'PAGO' | 'CANCELADO';
export interface Conta { id: string; nome: string; saldoInicial: number; dataSaldoInicial: string; ativo: boolean; }
/** Plano de contas: grupo (organiza, `ehGrupo`) ou conta contábil (recebe lançamentos, tem `grupoId`). A conta tem o tipo do grupo. */
export interface Categoria { id: string; nome: string; ativo: boolean; tipo: Tipo; grupoId: string | null; ehGrupo: boolean; }
export type CategoriaRequest = Pick<Categoria, 'nome' | 'ativo' | 'tipo' | 'grupoId'>;
export const ROTULO_TIPO: Record<Tipo, string> = { DESPESA: 'Saídas (débito)', RECEITA: 'Entradas (crédito)' };
export interface Movimento { id: string; versao: number; descricao: string; tipo: Tipo; situacao: Situacao; valor: number; vencimento: string; dataPagamento: string | null; contaId: string; conta: string; categoriaId: string; categoria: string; observacoes: string | null; }
export type MovimentoRequest = Pick<Movimento, 'descricao' | 'tipo' | 'valor' | 'vencimento' | 'contaId' | 'categoriaId' | 'observacoes' | 'versao'>;
export interface Pagina { itens: Movimento[]; total: number; pagina: number; tamanho: number; }
export interface Resumo { de: string; ate: string; receitas: number; despesas: number; resultado: number; saldoTotal: number; contas: { id: string; nome: string; saldo: number }[]; }
export interface Filtros { de: string; ate: string; nome: string; contaId: string; categoriaId: string; situacao: Situacao | ''; tipo: Tipo | ''; pagina: number; tamanho: number; }
