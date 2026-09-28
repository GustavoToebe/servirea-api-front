/**
 * Formatadores de data da montagem da escala (PLANO-008). Criar um `Intl.DateTimeFormat` é caro; numa grade com
 * 160 células ele era construído a cada detecção de mudanças. Aqui cada um existe uma vez só, no escopo do módulo.
 */
const FMT_CURTA = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' });
const FMT_LONGA = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
const FMT_SEMANA = new Intl.DateTimeFormat('pt-BR', { weekday: 'long' });
const FMT_SEMANA_CURTA = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' });

const meioDia = (iso: string) => new Date(`${iso}T12:00:00`);

/** "01 out" */
export function dataCurta(iso: string): string {
  return FMT_CURTA.format(meioDia(iso)).replace('.', '');
}

/** "01/10/2026" */
export function dataLonga(iso: string): string {
  return FMT_LONGA.format(meioDia(iso));
}

/** "quinta-feira" */
export function diaDaSemana(iso: string): string {
  return FMT_SEMANA.format(meioDia(iso));
}

/** "qui 01/10" */
export function diaEData(iso: string): string {
  return `${FMT_SEMANA_CURTA.format(meioDia(iso)).replace('.', '')} ${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
}
