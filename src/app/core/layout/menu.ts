/** Subitem de um módulo no menu lateral (uma aba da tela, escolhida por `?aba=`). */
export interface FilhoMenu {
  id: string;
  label: string;
  /** Aba da própria tela do módulo (`?aba=`). */
  consulta?: Record<string, string>;
  /** Tela própria, quando o subitem não é uma aba do módulo. */
  url?: string;
  /** Seção do menu em que o subitem aparece, quando difere da do módulo. */
  secao?: 'inicio' | 'cadastro' | 'escalas' | 'comunicacao' | 'financeiro' | 'pastoral' | 'meu-espaco' | 'relatorios' | 'ajuda';
  /** Quem pode ver o subitem; vazio = quem vê o módulo. */
  permissao?: string | readonly string[] | null;
}

export interface ItemMenu {
  label: string;
  url: string;
  /** Quando existe, o menu lateral mostra o módulo como título e estes subitens como links. */
  filhos?: readonly FilhoMenu[];
  /** Código do catálogo, ou vários (basta um). Vazio = sempre visível. */
  permissao: string | readonly string[] | null;
}

export const BARRA: ItemMenu[] = [
  { label: 'Início', url: '/dashboard', permissao: null },
  { label: 'Escalas', url: '/escalas', permissao: ['ESCALA', 'VAGA'], filhos: [
    { id: '/escalas', label: 'Escalas' },
    { id: 'escalas/layouts', label: 'Layouts de escala', url: '/escalas/layouts', permissao: 'LAYOUT' },
    { id: 'escalas/indisponibilidades', label: 'Indisponibilidades', url: '/escalas/indisponibilidades', permissao: ['ESCALA', 'VAGA'] },
  ] },
  { label: 'Pessoas', url: '/pessoas', permissao: 'PESSOA' },
  { label: 'Relatórios', url: '/relatorios', permissao: 'AUDITORIA' },
  { label: 'Layouts', url: '/layouts', permissao: 'LAYOUT' },
  { label: 'Comunicados', url: '/comunicados', permissao: 'COMUNICADO' },
  { label: 'Centro de entregas', url: '/entregas', permissao: 'NOTIFICACAO' },
  { label: 'Dependentes', url: '/portal/dependentes', permissao: 'PORTAL_DEPENDENTES' },
  { label: 'Meus compromissos', url: '/portal', permissao: 'PORTAL_VOLUNTARIO' },
  {label:'Minhas pastorais',url:'/minhas-pastorais',permissao:'PASTORAL_COORDENACAO'},
  { label: 'Pastorais e equipes', url: '/pastorais', permissao: 'PASTORAL' },
  { label: 'Vínculos de pessoas', url: '/usuarios/vinculos', permissao: 'USUARIO_ALTERAR' },
  { label: 'Mural', url: '/mural', permissao: 'MURAL' },
  { label: 'Tarefas', url: '/tarefas', permissao: 'TAREFA' },
  { label: 'Contas bancárias', url: '/contas-bancarias', permissao: 'FINANCEIRO' },
  { label: 'Financeiro', url: '/financeiro', permissao: 'FINANCEIRO', filhos: [
    { id: 'financeiro?lancamentos', label: 'Banco/caixa', consulta: { aba: 'lancamentos' } },
    { id: 'financeiro?plano', label: 'Plano de contas', consulta: { aba: 'plano-de-contas' } },
  ] },
  { label: 'Eventos', url: '/eventos', permissao: 'EVENTO' },
  { label: 'Paróquia', url: '/paroquia', permissao: 'PAROQUIA' },
  { label: 'Perfis', url: '/perfis', permissao: 'PERFIL' },
  { label: 'Usuários', url: '/usuarios', permissao: 'USUARIO' },
  {label:'Roteiros litúrgicos',url:'/liturgia',permissao:'LITURGIA'},
  {label:'Indicadores privados',url:'/indicadores',permissao:'INDICADORES'},
  {label:'Estoque e patrimônio',url:'/estoque',permissao:'ESTOQUE'},
  {label:'Felicitações',url:'/aniversarios',permissao:'ANIVERSARIO'},
  {label:'Página pública',url:'/site-paroquia',permissao:'SITE'},
  { label: 'Retenção de dados', url: '/privacidade', permissao: 'PRIVACIDADE' },
  { label: 'Primeiros passos', url: '/primeiros-passos', permissao: 'ONBOARDING' },
  { label: 'Ajuda', url: '/ajuda', permissao: null }
];

/** Ficam no menu do perfil (cabeçalho), não na barra; aqui só para o título da página. */
export const CONTA: ItemMenu[] = [
  { label: 'Ajustes', url: '/ajustes', permissao: null },
  { label: 'Meu perfil', url: '/meu-perfil', permissao: null }
];

export function podeVer(permissoes: readonly string[], exigida: string | readonly string[] | null): boolean {
  if (!exigida) {
    return true;
  }
  const lista = typeof exigida === 'string' ? [exigida] : exigida;
  return lista.some(codigo => permissoes.includes(codigo));
}

export function montarMenu(permissoes: readonly string[]): { barra: ItemMenu[]; conta: ItemMenu[] } {
  return {
    barra: BARRA.filter(item => podeVer(permissoes, item.permissao)),
    conta: CONTA.filter(item => podeVer(permissoes, item.permissao))
  };
}
