import { Marcadores } from '../../../../shared/components/volunteer-picker/volunteer-picker.component';
import { FUNCOES_LABEL } from '../../../voluntarios/models/voluntario.model';
import { ApoioEscala, EscalaEvento, EscalaVaga, indisponivelEm } from '../../models/escala.model';
import { dataLonga, diaDaSemana, diaEData } from './formatos-data';

/** Uma linha da grade, calculada só quando os eventos mudam (PLANO-008). */
export interface Linha {
  evento: EscalaEvento;
  chave: string;
  diaEData: string;
  dataLonga: string;
  diaSemana: string;
  /** Semana do mês (segunda a domingo); 0 = fora do mês (referência). */
  semana: number;
  novaSemana: boolean;
  hoje: boolean;
  fimDeSemana: 'SAB' | 'DOM' | null;
  vagasPorColuna: Record<string, EscalaVaga>;
  /** "Vela 1", "Missal": rótulo de cada vaga do cartão da mensal. */
  rotulos: Record<string, string>;
  usados: ReadonlySet<string>;
  marcadores: Marcadores | null;
  preenchidas: number;
}

export interface EntradaGrade {
  eventos: EscalaEvento[];
  /** Linhas do cálculo anterior: reaproveita o mesmo Set de usados quando nada mudou, para o seletor não refazer. */
  anteriores: readonly Linha[];
  ano: number;
  mes: number;
  /** Data de hoje em AAAA-MM-DD (injetada para o cálculo ser determinístico). */
  hojeIso: string;
  nomesPorId: ReadonlyMap<string, string>;
  /** Só a mensal mostra marcas de indisponibilidade, repetição e irmão. */
  mensal: boolean;
  apoio: ApoioEscala | null;
}

export interface Grade {
  linhas: Linha[];
  /** Referências primeiro, depois as demais: a ordem da tabela semanal. */
  linhasSemanal: Linha[];
  preenchidas: number;
  total: number;
  referencias: number;
}

export function hojeIso(data = new Date()): string {
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}-${String(data.getDate()).padStart(2, '0')}`;
}

export function rotuloDaVaga(evento: EscalaEvento, vaga: EscalaVaga): string {
  const repetida = evento.vagas.filter(v => v.funcao === vaga.funcao).length > 1;
  return FUNCOES_LABEL[vaga.funcao] + (repetida ? ` ${vaga.posicao}` : '');
}

/** Quantas vagas reais (não referência) de cada pessoa há no rascunho atual. */
export function vezesNoMes(eventos: readonly EscalaEvento[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const e of eventos) {
    if (e.referencia) continue;
    for (const v of e.vagas) if (v.voluntario_id) m.set(v.voluntario_id, (m.get(v.voluntario_id) ?? 0) + 1);
  }
  return m;
}

/** Marcas da mensal (PLANO-007): ⛔ indisponível na data/horário, "N× no mês" e irmão já nesta missa. */
export function marcadoresDo(
  evento: EscalaEvento, usados: ReadonlySet<string>, vezes: ReadonlyMap<string, number>,
  nomes: ReadonlyMap<string, string>, apoio: ApoioEscala | null, mensal: boolean,
): Marcadores | null {
  if (!apoio || !mensal) return null;
  const m: Marcadores = {};
  for (const v of apoio.voluntarios) {
    const indisponivel = indisponivelEm(apoio, v.voluntarioId, evento.data, evento.horario);
    const irmao = v.irmaos.find(i => usados.has(i));
    const n = vezes.get(v.voluntarioId) ?? 0;
    if (indisponivel || irmao || n) {
      m[v.voluntarioId] = { indisponivel, vezesNoMes: n || undefined, irmaoNaMissa: irmao ? nomes.get(irmao) : undefined };
    }
  }
  return m;
}

/** Recalcula as linhas (textos, vagas por coluna, usados, marcadores e contagens). Função pura: não toca em estado. */
export function calcularGrade(entrada: EntradaGrade): Grade {
  const { eventos, ano, mes } = entrada;
  const anterior = new Map(entrada.anteriores.map(l => [l.chave, l]));
  const primeiroSeg = (new Date(ano, mes - 1, 1).getDay() + 6) % 7;
  const vezes = vezesNoMes(eventos);
  let preenchidas = 0; let total = 0; let referencias = 0;
  const repetidas = new Map<string, number>();
  const linhas = eventos.map(evento => {
    const base = `${evento.data}|${evento.horario}${evento.referencia ? '|ref' : ''}`;
    const n = repetidas.get(base) ?? 0;
    repetidas.set(base, n + 1);
    const chave = n ? `${base}|${n}` : base;
    const vagasPorColuna: Record<string, EscalaVaga> = {};
    const rotulos: Record<string, string> = {};
    const usados = new Set<string>();
    let cheias = 0;
    for (const v of evento.vagas) {
      vagasPorColuna[`${v.funcao}-${v.posicao}`] = v;
      rotulos[`${v.funcao}-${v.posicao}`] = rotuloDaVaga(evento, v);
      if (v.voluntario_id) { usados.add(v.voluntario_id); cheias++; }
    }
    if (evento.referencia) referencias++; else { preenchidas += cheias; total += evento.vagas.length; }
    const dia = Number(evento.data.slice(8, 10));
    const doMes = Number(evento.data.slice(0, 4)) === ano && Number(evento.data.slice(5, 7)) === mes;
    const dow = new Date(`${evento.data}T12:00:00`).getDay();
    const velho = anterior.get(chave);
    const mesmos = !!velho && velho.usados.size === usados.size && [...usados].every(u => velho.usados.has(u));
    const linha: Linha = {
      evento, chave,
      diaEData: diaEData(evento.data), dataLonga: dataLonga(evento.data), diaSemana: diaDaSemana(evento.data),
      semana: doMes && !evento.referencia ? Math.floor((dia - 1 + primeiroSeg) / 7) + 1 : 0,
      novaSemana: false,
      hoje: evento.data === entrada.hojeIso,
      fimDeSemana: dow === 6 ? 'SAB' : dow === 0 ? 'DOM' : null,
      vagasPorColuna,
      rotulos,
      usados: mesmos ? velho!.usados : usados,
      marcadores: marcadoresDo(evento, usados, vezes, entrada.nomesPorId, entrada.apoio, entrada.mensal),
      preenchidas: cheias,
    };
    return linha;
  });
  const linhasSemanal = [...linhas.filter(l => l.evento.referencia), ...linhas.filter(l => !l.evento.referencia)];
  let semanaAnterior = 0;
  for (const l of linhasSemanal) {
    l.novaSemana = l.semana > 1 && semanaAnterior > 0 && l.semana !== semanaAnterior;
    if (l.semana) semanaAnterior = l.semana;
  }
  return { linhas, linhasSemanal, preenchidas, total, referencias };
}
