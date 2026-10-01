export interface ItemMenu {
  label: string;
  url: string;
  /** CÃ³digo do catÃ¡logo, ou vÃ¡rios (basta um). Vazio = sempre visÃ­vel. */
  permissao: string | readonly string[] | null;
}

export const BARRA: ItemMenu[] = [
  { label: 'InÃ­cio', url: '/dashboard', permissao: null },
  { label: 'Escalas', url: '/escalas', permissao: ['ESCALA', 'VAGA'] },
  { label: 'Pessoas', url: '/pessoas', permissao: 'PESSOA' },
  { label: 'RelatÃ³rios', url: '/relatorios', permissao: 'AUDITORIA' },
  { label: 'Ajustes', url: '/ajustes', permissao: null },
  { label: 'Layouts', url: '/layouts', permissao: 'LAYOUT' },
  { label: 'Comunicados', url: '/comunicados', permissao: 'COMUNICADO' },
  { label: 'ParÃ³quia', url: '/paroquia', permissao: 'PAROQUIA' },
  { label: 'Perfis', url: '/perfis', permissao: 'PERFIL' },
  { label: 'UsuÃ¡rios', url: '/usuarios', permissao: 'USUARIO' }
];

export const CONTA: ItemMenu[] = [
  { label: 'Minha conta', url: '/minha-conta', permissao: 'PAROQUIA' },
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
