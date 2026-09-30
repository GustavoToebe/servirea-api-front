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

export type CicloLiturgico = 'A' | 'B' | 'C';
export type NomeTempo = 'Advento' | 'Natal' | 'Quaresma' | 'Páscoa' | 'Tempo Comum';

export interface TempoLiturgico {
  tempo: NomeTempo;
  ciclo: CicloLiturgico;
  rotulo: string;
}

/** Domingo entre 27 de novembro e 3 de dezembro, início do Advento daquele ano civil. */
export function domingoAdvento(ano: number): Date {
  const nov27 = new Date(ano, 10, 27, 12, 0, 0);
  const desloca = nov27.getDay() === 0 ? 0 : 7 - nov27.getDay();
  return addDays(nov27, desloca);
}

/** O ano litúrgico recebe o número do ano civil em que termina, e o ciclo segue esse número. */
export function tempoLiturgico(data: Date): TempoLiturgico {
  const dia = new Date(data.getFullYear(), data.getMonth(), data.getDate(), 12, 0, 0);
  const advento = domingoAdvento(dia.getFullYear());
  const anoLiturgico = dia >= advento ? dia.getFullYear() + 1 : dia.getFullYear();
  const ciclo = cicloLiturgico(anoLiturgico);
  const tempo = nomeTempo(dia);
  const titulo = dia.getDay() === 0 ? tituloDomingo(tempo) : tempo;
  return { tempo, ciclo, rotulo: `${titulo} • Ano ${ciclo}` };
}

export function rotuloDia(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split('-').map(Number);
  return new Date(ano, mes - 1, dia, 12).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short'
  });
}

function cicloLiturgico(anoLiturgico: number): CicloLiturgico {
  const resto = anoLiturgico % 3;
  if (resto === 1) return 'A';
  if (resto === 2) return 'B';
  return 'C';
}

function tituloDomingo(tempo: NomeTempo): string {
  if (tempo === 'Quaresma') return 'Domingo da Quaresma';
  if (tempo === 'Páscoa') return 'Domingo de Páscoa';
  return `Domingo do ${tempo}`;
}

function nomeTempo(dia: Date): NomeTempo {
  const ano = dia.getFullYear();
  const pascoa = dataPascoa(ano);
  const cinzas = addDays(pascoa, -46);
  const pentecostes = addDays(pascoa, 49);
  const natal = new Date(ano, 11, 25, 12, 0, 0);
  const advento = domingoAdvento(ano);
  const batismo = domingoBatismo(ano);

  if (dia >= advento && dia < natal) return 'Advento';
  if (dia >= natal || (dia.getMonth() === 0 && dia <= batismo)) return 'Natal';
  if (dia >= cinzas && dia < pascoa) return 'Quaresma';
  if (dia >= pascoa && dia <= pentecostes) return 'Páscoa';
  return 'Tempo Comum';
}

/** Domingo depois de 6 de janeiro: encerra o Tempo do Natal. */
function domingoBatismo(ano: number): Date {
  const epifania = new Date(ano, 0, 6, 12, 0, 0);
  const desloca = epifania.getDay() === 0 ? 7 : 7 - epifania.getDay();
  return addDays(epifania, desloca);
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
