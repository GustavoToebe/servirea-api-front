export interface ItemMenu {
  label: string;
  url: string;
  /** Código do catálogo, ou vários (basta um). Vazio = sempre visível. */
  permissao: string | readonly string[] | null;
}

export const BARRA: ItemMenu[] = [
  { label: 'Início', url: '/dashboard', permissao: null },
  { label: 'Escalas', url: '/escalas', permissao: ['ESCALA', 'VAGA'] },
  { label: 'Pessoas', url: '/pessoas', permissao: 'PESSOA' },
  { label: 'Relatórios', url: '/relatorios', permissao: 'AUDITORIA' },
  { label: 'Layouts', url: '/layouts', permissao: 'LAYOUT' },
  { label: 'Comunicados', url: '/comunicados', permissao: 'COMUNICADO' },
  { label: 'Dependentes', url: '/portal/dependentes', permissao: 'PORTAL_DEPENDENTES' },
  { label: 'Meus compromissos', url: '/portal', permissao: 'PORTAL_VOLUNTARIO' },
  {label:'Minhas pastorais',url:'/minhas-pastorais',permissao:'PASTORAL_COORDENACAO'},
  { label: 'Pastorais e equipes', url: '/pastorais', permissao: 'PASTORAL' },
  { label: 'Vínculos de pessoas', url: '/usuarios/vinculos', permissao: 'USUARIO_ALTERAR' },
  { label: 'Mural', url: '/mural', permissao: 'MURAL' },
  { label: 'Tarefas', url: '/tarefas', permissao: 'TAREFA' },
  { label: 'Financeiro', url: '/financeiro', permissao: 'FINANCEIRO' },
  { label: 'Eventos', url: '/eventos', permissao: 'EVENTO' },
  { label: 'Paróquia', url: '/paroquia', permissao: 'PAROQUIA' },
  { label: 'Perfis', url: '/perfis', permissao: 'PERFIL' },
  { label: 'Usuários', url: '/usuarios', permissao: 'USUARIO' },
  {label:'Roteiros litúrgicos',url:'/liturgia',permissao:'LITURGIA'},
  {label:'Indicadores privados',url:'/indicadores',permissao:'INDICADORES'},
  {label:'Estoque e patrimônio',url:'/estoque',permissao:'ESTOQUE'},
  {label:'Felicitações',url:'/aniversarios',permissao:'ANIVERSARIO'},
  {label:'Página pública',url:'/site-paroquia',permissao:'SITE'},
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
