export interface CelebracaoLiturgica {
  data: string;
  titulo: string;
}

/** Computus gregoriano (Gauss) para o domingo de Páscoa. */
export function dataPascoa(ano: number): Date {
  const a = ano % 19;
  const b = ano % 4;
  const c = ano % 7;
  const k = Math.floor(ano / 100);
  const p = Math.floor((13 + 8 * k) / 25);
  const q = Math.floor(k / 4);
  const M = (15 - p + k - q) % 30;
  const N = (4 + k - q) % 7;
  const d = (19 * a + M) % 30;
  const e = (2 * b + 4 * c + 6 * d + N) % 7;
  if (d === 29 && e === 6) return new Date(ano, 3, 19, 12, 0, 0);
  if (d === 28 && e === 6 && ((11 * M + 11) % 30) < 19) return new Date(ano, 3, 18, 12, 0, 0);
  const day = 22 + d + e;
  if (day <= 31) return new Date(ano, 2, day, 12, 0, 0);
  return new Date(ano, 3, d + e - 9, 12, 0, 0);
}

const DATAS_FIXAS: { mes: number; dia: number; titulo: string }[] = [
  { mes: 1, dia: 6, titulo: 'Dia de Reis (Epifania do Senhor)' },
  { mes: 10, dia: 12, titulo: 'Nossa Senhora Aparecida' },
  { mes: 11, dia: 1, titulo: 'Dia de Todos os Santos' },
  { mes: 11, dia: 2, titulo: 'Dia de Finados' },
  { mes: 12, dia: 8, titulo: 'Imaculada Conceição de Nossa Senhora' },
  { mes: 12, dia: 25, titulo: 'Natal do Senhor' }
];

export const TITULOS_CELEBRACAO = [
  'Missa',
  'Carnaval',
  'Quarta-feira de Cinzas',
  'Sexta-feira Santa',
  'Páscoa',
  'Corpus Christi',
  ...DATAS_FIXAS.map(d => d.titulo)
];

export function celebracoesDoAno(ano: number): CelebracaoLiturgica[] {
  const pascoa = dataPascoa(ano);
  const moveis: CelebracaoLiturgica[] = [
    { data: iso(addDays(pascoa, -47)), titulo: 'Carnaval' },
    { data: iso(addDays(pascoa, -46)), titulo: 'Quarta-feira de Cinzas' },
    { data: iso(addDays(pascoa, -2)), titulo: 'Sexta-feira Santa' },
    { data: iso(pascoa), titulo: 'Páscoa' },
    { data: iso(addDays(pascoa, 60)), titulo: 'Corpus Christi' }
  ];
  const fixas = DATAS_FIXAS.map(d => ({
    data: `${ano}-${pad(d.mes)}-${pad(d.dia)}`,
    titulo: d.titulo
  }));
  return [...moveis, ...fixas];
}

export function celebracoesDoMes(ano: number, mes: number): CelebracaoLiturgica[] {
  return celebracoesDoAno(ano).filter(c => Number(c.data.slice(5, 7)) === mes);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

function iso(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}
