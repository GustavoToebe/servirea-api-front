export type SituacaoEvento = 'RASCUNHO' | 'PUBLICADO' | 'ENCERRADO' | 'CANCELADO';
export type SituacaoMensagem = 'PENDENTE' | 'ENVIADA' | 'FALHOU' | 'SEM_AUTORIZACAO' | 'SEM_TELEFONE';

export interface EventoResumo {
  id: string;
  titulo: string;
  /** Horário de Brasília, sem fuso: "2026-10-10T19:30:00". */
  inicio: string;
  termino: string | null;
  localNome: string | null;
  situacao: SituacaoEvento;
  inscritos: number;
  vagas: number | null;
  capaUrl: string | null;
}

export interface FotoEvento {
  id: string;
  url: string;
  capa: boolean;
}

export interface Inscrito {
  id: string;
  pessoaId: string;
  nome: string;
  telefone: string | null;
  confirmacao: SituacaoMensagem | null;
  lembrete: SituacaoMensagem | null;
}

export interface EventoDetalhe {
  id: string;
  titulo: string;
  descricao: string | null;
  inicio: string;
  termino: string | null;
  localNome: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  mapaUrl: string | null;
  vagas: number | null;
  responsavelNome: string | null;
  responsavelTelefone: string | null;
  lembreteDias: number;
  mensagemConfirmacao: string;
  mensagemLembrete: string;
  situacao: SituacaoEvento;
  fotos: FotoEvento[];
  inscritos: Inscrito[];
  tags: Record<string, string>;
}

export interface EventoRequest {
  titulo: string;
  descricao: string | null;
  inicio: string;
  termino: string | null;
  localNome: string | null;
  cep: string | null;
  logradouro: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  mapaUrl: string | null;
  vagas: number | null;
  responsavelNome: string | null;
  responsavelTelefone: string | null;
  lembreteDias: number;
  mensagemConfirmacao: string | null;
  mensagemLembrete: string | null;
}

const VERDE = 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold';
const AMBAR = 'bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold';
const VERMELHO = 'bg-red-500/15 border border-red-500/30 text-red-700 dark:text-red-300 font-bold';
const CINZA = 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold';

export const SITUACAO_EVENTO: Record<SituacaoEvento, { texto: string; tom: string }> = {
  RASCUNHO: { texto: 'Rascunho', tom: CINZA },
  PUBLICADO: { texto: 'Publicado', tom: VERDE },
  ENCERRADO: { texto: 'Encerrado', tom: CINZA },
  CANCELADO: { texto: 'Cancelado', tom: VERMELHO }
};

export const SITUACAO_MENSAGEM: Record<SituacaoMensagem, { texto: string; tom: string }> = {
  PENDENTE: { texto: 'Na fila', tom: AMBAR },
  ENVIADA: { texto: 'Enviada', tom: VERDE },
  FALHOU: { texto: 'Falhou', tom: VERMELHO },
  SEM_AUTORIZACAO: { texto: 'Sem autorização', tom: AMBAR },
  SEM_TELEFONE: { texto: 'Sem telefone', tom: AMBAR }
};

/** "sáb., 10/10/2026 às 19:30" a partir de "2026-10-10T19:30:00" (horário de Brasília, sem fuso). */
export function rotuloQuando(iso: string): string {
  const [data, hora] = iso.split('T');
  const [ano, mes, dia] = data.split('-').map(Number);
  const dataTexto = new Date(ano, mes - 1, dia, 12).toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric'
  });
  return `${dataTexto} às ${(hora ?? '').slice(0, 5)}`;
}
