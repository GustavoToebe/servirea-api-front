import { BARRA } from './menu';
import { SECAO_DA_URL, SECOES, TODAS_AS_TELAS, agruparPorSecao, buscarTelas, normalizar, telaDoEndereco, telasVisiveis } from './navegacao';

describe('Navegação por seções', () => {
  it('todo item do menu lateral tem uma seção definida (item novo sem seção cairia em Início)', () => {
    expect(BARRA.filter(i => !(i.url in SECAO_DA_URL)).map(i => i.url)).toEqual([]);
    expect(Object.values(SECAO_DA_URL).every(id => SECOES.some(s => s.id === id))).toBeTrue();
  });

  it('as telas têm ids únicos e os atalhos de aba têm consulta', () => {
    const ids = TODAS_AS_TELAS.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(TODAS_AS_TELAS.filter(t => t.consulta).every(t => t.url === '/financeiro')).toBeTrue();
  });

  it('só aparece o que a pessoa pode ver, e quem não tem permissão não vê atalhos de criação', () => {
    const sem = telasVisiveis(['PESSOA']).map(t => t.rotulo);
    expect(sem).toContain('Pessoas');
    expect(sem).not.toContain('Nova pessoa');
    expect(telasVisiveis(['PESSOA', 'PESSOA_CRIAR']).map(t => t.rotulo)).toContain('Nova pessoa');
    expect(telasVisiveis([]).map(t => t.rotulo)).toEqual(['Início', 'Ajuda']);
  });

  it('agrupa por seção na ordem do menu e omite seções vazias', () => {
    const grupos = agruparPorSecao(telasVisiveis(['FINANCEIRO']));
    expect(grupos.map(g => g.secao.id)).toEqual(['inicio', 'cadastro', 'financeiro', 'ajuda']);
    expect(grupos[2].telas.map(t => t.rotulo)).toEqual(['Financeiro', 'Banco/caixa', 'Plano de contas']);
    expect(grupos[1].telas.map(t => t.rotulo)).toContain('Contas bancárias');
  });

  it('a busca ignora acento e caixa, exige todas as palavras e usa sinônimos', () => {
    const telas = telasVisiveis(['FINANCEIRO', 'PESSOA', 'PESSOA_CRIAR', 'PRIVACIDADE']);
    expect(normalizar('  Informação ')).toBe('informacao');
    expect(buscarTelas(telas, 'PLANO conta')[0].rotulo).toBe('Plano de contas');
    expect(buscarTelas(telas, 'coroinha').map(t => t.rotulo)).toContain('Pessoas');
    expect(buscarTelas(telas, 'lgpd').map(t => t.rotulo)).toContain('Retenção de dados');
    expect(buscarTelas(telas, 'zzzz')).toEqual([]);
    expect(buscarTelas(telas, '   ')).toEqual([]);
  });

  it('quem começa com o termo vem antes de quem só contém', () => {
    const r = buscarTelas(telasVisiveis(['FINANCEIRO']), 'caixa');
    expect(r[0].rotulo).toBe('Banco/caixa');
  });

  it('acha a tela pelo endereço, com aba, com subcaminho e sem correspondência', () => {
    const telas = telasVisiveis(['FINANCEIRO', 'PESSOA', 'PESSOA_CRIAR']);
    expect(telaDoEndereco(telas, '/financeiro?aba=plano-de-contas')?.rotulo).toBe('Plano de contas');
    expect(telaDoEndereco(telas, '/financeiro')?.rotulo).toBe('Financeiro');
    expect(telaDoEndereco(telas, '/pessoas/nova')?.rotulo).toBe('Nova pessoa');
    expect(telaDoEndereco(telas, '/pessoas/123/editar')?.rotulo).toBe('Pessoas');
    expect(telaDoEndereco(telas, '/pessoas?x=1#topo')?.rotulo).toBe('Pessoas');
    expect(telaDoEndereco(telas, '/rota-inexistente')).toBeNull();
  });
});
