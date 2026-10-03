/** Qual tema da Ajuda explica cada tela. A regra mais específica (prefixo mais longo) vence. */
const REGRAS: readonly (readonly [string, string])[] = [
  ['/dashboard', 'inicio'],
  ['/primeiros-passos', 'primeiros-passos'],
  ['/funcionalidade-indisponivel', 'limites'],
  ['/meu-perfil', 'acesso'],
  ['/minha-conta', 'limites'],
  ['/ajustes', 'acesso'],
  ['/pessoas/importar', 'importacao'],
  ['/pessoas', 'pessoas'],
  ['/privacidade', 'privacidade'],
  ['/usuarios/vinculos', 'vinculos'],
  ['/usuarios', 'usuarios'],
  ['/perfis', 'usuarios'],
  ['/paroquia', 'paroquia'],
  ['/site-paroquia', 'site'],
  ['/escalas/indisponibilidades', 'indisponibilidades'],
  ['/escalas/layouts', 'layouts-escala'],
  ['/escalas/nova', 'escalas'],
  ['/escalas', 'escalas'],
  ['/layouts', 'comunicados'],
  ['/comunicados', 'comunicados'],
  ['/entregas', 'notificacoes'],
  ['/mural', 'mural'],
  ['/tarefas', 'tarefas'],
  ['/aniversarios', 'aniversarios'],
  ['/contas-bancarias', 'financeiro'],
  ['/financeiro', 'financeiro'],
  ['/pastorais', 'pastorais'],
  ['/minhas-pastorais', 'pastorais'],
  ['/eventos', 'eventos'],
  ['/liturgia', 'liturgia'],
  ['/estoque', 'estoque'],
  ['/portal/indisponibilidades', 'indisponibilidades'],
  ['/portal/checkin', 'checkin'],
  ['/portal/trocas', 'trocas'],
  ['/portal/vagas', 'candidaturas'],
  ['/portal/dependentes', 'portal'],
  ['/portal', 'portal'],
  ['/relatorios', 'relatorios'],
  ['/indicadores', 'indicadores'],
];

/** Sub-telas de uma escala (`/escalas/:id/...`) que têm tema próprio. */
const SUBTELAS_ESCALA: Record<string, string> = {
  distribuicao: 'distribuicao', checkin: 'checkin', respostas: 'coordenacao', candidaturas: 'coordenacao', trocas: 'coordenacao',
};

/** Id do tema da Ajuda para a tela do endereço, ou null (a própria Ajuda e telas fora do painel não têm botão). */
export function ajudaDaRota(endereco: string): string | null {
  const caminho = endereco.split('#')[0].split('?')[0].replace(/\/+$/, '') || '/';
  if (caminho === '/' || caminho === '/ajuda') return null;
  const partes = caminho.split('/');
  if (partes[1] === 'escalas' && partes.length >= 4 && SUBTELAS_ESCALA[partes[3]]) return SUBTELAS_ESCALA[partes[3]];
  if (partes[1] === 'pessoas' && partes[3] === 'privacidade') return 'privacidade';
  if (partes[1] === 'pessoas' && partes[3] === 'acessos-dependentes') return 'portal';
  let melhor: readonly [string, string] | null = null;
  for (const regra of REGRAS) {
    if ((caminho === regra[0] || caminho.startsWith(regra[0] + '/')) && (!melhor || regra[0].length > melhor[0].length)) melhor = regra;
  }
  return melhor ? melhor[1] : null;
}
