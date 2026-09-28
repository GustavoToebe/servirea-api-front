export type CondicaoEspecial = 'SINDROME_DOWN' | 'TEA' | 'TDAH' | 'ANSIEDADE' | 'DEPRESSAO' | 'BORDERLINE' | 'OUTRA';

export interface CondicaoDetalhe {
  id: CondicaoEspecial;
  nome: string;
  descricao: string;
  icone: string;
}

export interface GrupoCondicao {
  nome: string;
  itens: CondicaoDetalhe[];
}

export const GRUPOS_CONDICAO: GrupoCondicao[] = [
  {
    nome: 'Condição genética',
    itens: [
      { id: 'SINDROME_DOWN', nome: 'Síndrome de Down', descricao: 'Uma característica genética que a pessoa tem desde sempre. Não é doença.', icone: '💛' }
    ]
  },
  {
    nome: 'Desenvolvimento',
    itens: [
      { id: 'TEA', nome: 'Autismo (TEA)', descricao: 'Um jeito diferente de perceber o mundo, de se comunicar e de se relacionar.', icone: '🧩' },
      { id: 'TDAH', nome: 'TDAH', descricao: 'Afeta a atenção, a agitação e o controle dos impulsos.', icone: '⚡' }
    ]
  },
  {
    nome: 'Saúde emocional',
    itens: [
      { id: 'ANSIEDADE', nome: 'Ansiedade', descricao: 'O corpo entra em alerta mais do que precisa, e isso cansa.', icone: '🌿' },
      { id: 'DEPRESSAO', nome: 'Depressão', descricao: 'Uma tristeza que pesa por muito tempo e tira a vontade das coisas.', icone: '🌧' },
      { id: 'BORDERLINE', nome: 'Borderline', descricao: 'Emoções muito intensas, que mudam rápido, e relações que oscilam.', icone: '🌊' }
    ]
  },
  {
    nome: 'Outra',
    itens: [
      { id: 'OUTRA', nome: 'Outra', descricao: 'Conte com suas palavras.', icone: '✍' }
    ]
  }
];

export const NIVEIS_TEA = [
  { valor: 1, rotulo: 'Nível 1 — precisa de pouco apoio' },
  { valor: 2, rotulo: 'Nível 2 — precisa de bastante apoio' },
  { valor: 3, rotulo: 'Nível 3 — precisa de apoio intenso' },
  { valor: null, rotulo: 'Não sei / prefiro não dizer' }
];

export const CONDICAO_LABEL: Record<CondicaoEspecial, string> = {
  SINDROME_DOWN: 'Síndrome de Down',
  TEA: 'Autismo (TEA)',
  TDAH: 'TDAH',
  ANSIEDADE: 'Ansiedade',
  DEPRESSAO: 'Depressão',
  BORDERLINE: 'Borderline',
  OUTRA: 'Outra'
};
