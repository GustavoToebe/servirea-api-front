import { BARRA, ItemMenu, podeVer } from './menu';

/** Seções do menu: agrupam as telas por assunto, na ordem em que aparecem no menu lateral e no menu completo. */
export type SecaoId = 'inicio' | 'cadastro' | 'escalas' | 'comunicacao' | 'financeiro' | 'pastoral' | 'meu-espaco' | 'relatorios' | 'ajuda';

export interface SecaoNav { id: SecaoId; titulo: string; }

export const SECOES: SecaoNav[] = [
  { id: 'inicio', titulo: 'Início' },
  { id: 'cadastro', titulo: 'Cadastro' },
  { id: 'escalas', titulo: 'Escalas' },
  { id: 'comunicacao', titulo: 'Comunicação' },
  { id: 'financeiro', titulo: 'Financeiro' },
  { id: 'pastoral', titulo: 'Pastoral e eventos' },
  { id: 'meu-espaco', titulo: 'Meu espaço' },
  { id: 'relatorios', titulo: 'Relatórios e indicadores' },
  { id: 'ajuda', titulo: 'Ajuda' },
];

/** Uma tela ou atalho que o usuário pode abrir. `noMenu` = aparece no menu lateral; os demais só na busca e no menu completo. */
export interface TelaNav {
  id: string;
  rotulo: string;
  url: string;
  consulta?: Record<string, string>;
  permissao: string | readonly string[] | null;
  secao: SecaoId;
  noMenu: boolean;
  /** Palavras que o usuário pode digitar para achar a tela (sinônimos). */
  palavras?: string;
}

/** Seção de cada item do menu lateral (pela URL do item). Item novo em `menu.ts` sem seção aqui cai em "Início" e o teste acusa. */
export const SECAO_DA_URL: Record<string, SecaoId> = {
  '/dashboard': 'inicio',
  '/escalas': 'escalas',
  '/pessoas': 'cadastro',
  '/relatorios': 'relatorios',
  '/layouts': 'comunicacao',
  '/comunicados': 'comunicacao',
  '/entregas': 'comunicacao',
  '/portal/dependentes': 'meu-espaco',
  '/portal': 'meu-espaco',
  '/minhas-pastorais': 'pastoral',
  '/pastorais': 'pastoral',
  '/usuarios/vinculos': 'cadastro',
  '/mural': 'comunicacao',
  '/tarefas': 'pastoral',
  '/financeiro': 'financeiro',
  '/eventos': 'pastoral',
  '/paroquia': 'cadastro',
  '/perfis': 'cadastro',
  '/usuarios': 'cadastro',
  '/liturgia': 'pastoral',
  '/indicadores': 'relatorios',
  '/estoque': 'pastoral',
  '/aniversarios': 'comunicacao',
  '/site-paroquia': 'cadastro',
  '/privacidade': 'cadastro',
  '/primeiros-passos': 'ajuda',
  '/ajuda': 'ajuda',
};

const PALAVRAS: Record<string, string> = {
  '/dashboard': 'home painel resumo',
  '/escalas': 'escala missa celebração vaga montar grade',
  '/pessoas': 'voluntário coroinha acólito ministro cadastro ficha responsável',
  '/relatorios': 'participação presença exportar',
  '/layouts': 'modelo de mensagem e-mail whatsapp comunicado',
  '/comunicados': 'aviso mensagem enviar histórico',
  '/entregas': 'notificação fila gatilho automático envio',
  '/portal/dependentes': 'filho responsável',
  '/portal': 'minha agenda escala candidatura troca disponibilidade',
  '/minhas-pastorais': 'coordenador equipe',
  '/pastorais': 'equipe grupo coordenação participante',
  '/usuarios/vinculos': 'conta pessoa associar',
  '/mural': 'aviso recado quadro',
  '/tarefas': 'solicitação pendência prazo',
  '/financeiro': 'dinheiro caixa banco lançamento conta contábil receita despesa',
  '/eventos': 'inscrição retiro festa evento',
  '/paroquia': 'igreja endereço diocese cnpj',
  '/perfis': 'permissão acesso papel',
  '/usuarios': 'convite login senha acesso',
  '/liturgia': 'roteiro referência',
  '/indicadores': 'participação presença faltas',
  '/estoque': 'patrimônio item movimentação',
  '/aniversarios': 'felicitação parabéns',
  '/site-paroquia': 'página pública publicar',
  '/privacidade': 'retenção lgpd anonimizar dados',
  '/primeiros-passos': 'checklist começar configuração',
  '/ajuda': 'manual dúvida como funciona suporte',
};

/** Atalhos que não estão no menu lateral, mas existem como tela ou aba. */
export const ATALHOS: TelaNav[] = [
  { id: 'pessoas/nova', rotulo: 'Nova pessoa', url: '/pessoas/nova', permissao: 'PESSOA_CRIAR', secao: 'cadastro', noMenu: false, palavras: 'cadastrar voluntário coroinha acólito novo cadastro' },
  { id: 'pessoas/importar', rotulo: 'Importar pessoas', url: '/pessoas/importar', permissao: 'PESSOA_CRIAR', secao: 'cadastro', noMenu: false, palavras: 'planilha csv xlsx lote' },
  { id: 'escalas/nova', rotulo: 'Nova escala', url: '/escalas/nova', permissao: 'ESCALA_CRIAR', secao: 'escalas', noMenu: false, palavras: 'criar montar escala do mês' },
  { id: 'escalas/indisponibilidades', rotulo: 'Indisponibilidades', url: '/escalas/indisponibilidades', permissao: ['ESCALA', 'VAGA'], secao: 'escalas', noMenu: false, palavras: 'quem não pode datas restrição' },
  { id: 'escalas/layouts', rotulo: 'Layouts de escala', url: '/escalas/layouts', permissao: 'LAYOUT', secao: 'escalas', noMenu: false, palavras: 'modelo impressão cabeçalho' },
  { id: 'financeiro?lancamentos', rotulo: 'Lançamentos financeiros', url: '/financeiro', consulta: { aba: 'lancamentos' }, permissao: 'FINANCEIRO', secao: 'financeiro', noMenu: false, palavras: 'entrada saída baixa pagamento' },
  { id: 'financeiro?contas', rotulo: 'Contas / bancos', url: '/financeiro', consulta: { aba: 'contas' }, permissao: 'FINANCEIRO', secao: 'financeiro', noMenu: false, palavras: 'caixa banco saldo' },
  { id: 'financeiro?plano', rotulo: 'Plano de contas', url: '/financeiro', consulta: { aba: 'plano-de-contas' }, permissao: 'FINANCEIRO', secao: 'financeiro', noMenu: false, palavras: 'grupo conta contábil categoria' },
  { id: 'eventos/novo', rotulo: 'Novo evento', url: '/eventos/novo', permissao: 'EVENTO_CRIAR', secao: 'pastoral', noMenu: false, palavras: 'criar evento inscrição' },
  { id: 'portal/indisponibilidades', rotulo: 'Minha disponibilidade', url: '/portal/indisponibilidades', permissao: 'PORTAL_VOLUNTARIO', secao: 'meu-espaco', noMenu: false, palavras: 'não posso datas' },
  { id: 'portal/vagas', rotulo: 'Vagas e candidaturas', url: '/portal/vagas', permissao: 'PORTAL_VOLUNTARIO', secao: 'meu-espaco', noMenu: false, palavras: 'candidatar vaga aberta' },
  { id: 'portal/trocas', rotulo: 'Trocas de escala', url: '/portal/trocas', permissao: 'PORTAL_VOLUNTARIO', secao: 'meu-espaco', noMenu: false, palavras: 'trocar substituir' },
  { id: 'portal/checkin', rotulo: 'Check-in', url: '/portal/checkin', permissao: 'PORTAL_VOLUNTARIO', secao: 'meu-espaco', noMenu: false, palavras: 'presença código' },
  { id: 'relatorios/participacao', rotulo: 'Relatório de participação', url: '/relatorios/participacao', permissao: 'AUDITORIA', secao: 'relatorios', noMenu: false, palavras: 'presença exportar csv' },
];

function deItem(item: ItemMenu): TelaNav {
  return { id: item.url, rotulo: item.label, url: item.url, permissao: item.permissao, secao: SECAO_DA_URL[item.url] ?? 'inicio', noMenu: true, palavras: PALAVRAS[item.url] };
}

/** Todas as telas conhecidas (menu lateral + atalhos), sem filtrar por permissão. */
export const TODAS_AS_TELAS: TelaNav[] = [...BARRA.map(deItem), ...ATALHOS];

export function telasVisiveis(permissoes: readonly string[]): TelaNav[] {
  return TODAS_AS_TELAS.filter(t => podeVer(permissoes, t.permissao));
}

export function tituloDaSecao(id: SecaoId): string { return SECOES.find(s => s.id === id)?.titulo ?? ''; }

/** Agrupa as telas por seção, na ordem de SECOES, sem seções vazias. */
export function agruparPorSecao(telas: readonly TelaNav[]): { secao: SecaoNav; telas: TelaNav[] }[] {
  return SECOES.map(secao => ({ secao, telas: telas.filter(t => t.secao === secao.id) })).filter(g => g.telas.length);
}

export function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

/**
 * Busca por todas as palavras digitadas (sem acento e sem diferença de caixa) no nome, nos sinônimos e na seção.
 * Quem começa com o termo vem primeiro, depois quem contém no nome, depois o resto.
 */
export function buscarTelas(telas: readonly TelaNav[], termo: string): TelaNav[] {
  const palavras = normalizar(termo).split(/\s+/).filter(Boolean);
  if (!palavras.length) return [];
  const completo = normalizar(termo);
  const pontuar = (t: TelaNav) => {
    const nome = normalizar(t.rotulo);
    return nome.startsWith(completo) ? 0 : nome.includes(completo) ? 1 : 2;
  };
  return telas
    .filter(t => {
      const alvo = normalizar(`${t.rotulo} ${t.palavras ?? ''} ${tituloDaSecao(t.secao)}`);
      return palavras.every(p => alvo.includes(p));
    })
    .map((t, i) => ({ t, p: pontuar(t), i }))
    .sort((a, b) => a.p - b.p || a.i - b.i)
    .map(x => x.t);
}

/** Tela que corresponde ao endereço atual: caminho e consulta iguais; senão, a de caminho mais longo que seja prefixo. */
export function telaDoEndereco(telas: readonly TelaNav[], endereco: string): TelaNav | null {
  const [caminho, resto = ''] = endereco.split('#')[0].split('?');
  const consulta = new URLSearchParams(resto);
  const exata = telas.find(t => t.url === caminho && t.consulta && Object.entries(t.consulta).every(([k, v]) => consulta.get(k) === v));
  if (exata) return exata;
  const candidatas = telas.filter(t => !t.consulta && (caminho === t.url || caminho.startsWith(t.url + '/')));
  return candidatas.sort((a, b) => b.url.length - a.url.length)[0] ?? null;
}
