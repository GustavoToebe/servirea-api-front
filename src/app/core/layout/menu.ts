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
  { label: 'Ajustes', url: '/ajustes', permissao: null }
];

export const CONTA: ItemMenu[] = [
  { label: 'Layouts', url: '/layouts', permissao: 'LAYOUT' },
  { label: 'Paróquia', url: '/paroquia', permissao: 'PAROQUIA' },
  { label: 'Perfis', url: '/perfis', permissao: 'PERFIL' },
  { label: 'Usuários', url: '/usuarios', permissao: 'USUARIO' },
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
