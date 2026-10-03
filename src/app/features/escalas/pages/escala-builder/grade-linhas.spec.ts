import { ApoioEscala, EscalaEvento } from '../../models/escala.model';
import { Linha, calcularGrade, hojeIso, rotuloDaVaga, vezesNoMes } from './grade-linhas';

function evento(data: string, vagas: (string | null)[], extra: Partial<EscalaEvento> = {}): EscalaEvento {
  return {
    data, horario: '19:00:00', celebracao: 'Missa',
    vagas: vagas.map((id, i) => ({ funcao: 'VELA' as const, posicao: i + 1, voluntario_id: id })),
    ...extra,
  };
}

const base = { anteriores: [] as Linha[], ano: 2026, mes: 9, hojeIso: '2026-09-06', nomesPorId: new Map<string, string>(), mensal: false, apoio: null };

describe('grade da escala (função pura)', () => {
  it('conta vagas preenchidas e totais sem contar linhas de referência', () => {
    const g = calcularGrade({
      ...base,
      eventos: [evento('2026-09-06', ['a', null]), evento('2026-09-13', ['b', 'c'], { referencia: true })],
    });
    expect(g.preenchidas).toBe(1);
    expect(g.total).toBe(2);
    expect(g.referencias).toBe(1);
  });

  it('chaves repetidas ganham sufixo e o domingo vira DOM', () => {
    const g = calcularGrade({ ...base, eventos: [evento('2026-09-06', ['a']), evento('2026-09-06', ['b'])] });
    expect(g.linhas.map(l => l.chave)).toEqual(['2026-09-06|19:00:00', '2026-09-06|19:00:00|1']);
    expect(g.linhas[0].fimDeSemana).toBe('DOM');
    expect(g.linhas[0].hoje).toBeTrue();
  });

  it('semana do mês parte da segunda-feira e a referência fica fora (0)', () => {
    const g = calcularGrade({
      ...base,
      eventos: [evento('2026-09-01', ['a']), evento('2026-09-07', ['a']), evento('2026-09-07', ['a'], { referencia: true })],
    });
    expect(g.linhas.map(l => l.semana)).toEqual([1, 2, 0]);
  });

  it('a tabela semanal põe as referências primeiro e marca a virada de semana', () => {
    const g = calcularGrade({
      ...base,
      eventos: [evento('2026-09-01', ['a']), evento('2026-09-07', ['a']), evento('2026-08-31', [], { referencia: true })],
    });
    expect(g.linhasSemanal[0].evento.referencia).toBeTrue();
    expect(g.linhasSemanal.map(l => l.novaSemana)).toEqual([false, false, true]);
  });

  it('reaproveita o mesmo Set de usados quando nada mudou, e troca quando mudou', () => {
    const eventos = [evento('2026-09-06', ['a'])];
    const primeira = calcularGrade({ ...base, eventos });
    const igual = calcularGrade({ ...base, eventos, anteriores: primeira.linhas });
    expect(igual.linhas[0].usados).toBe(primeira.linhas[0].usados);
    const mudou = calcularGrade({ ...base, eventos: [evento('2026-09-06', ['b'])], anteriores: primeira.linhas });
    expect(mudou.linhas[0].usados).not.toBe(primeira.linhas[0].usados);
  });

  it('marcadores só aparecem na mensal e mostram indisponibilidade, repetições e irmão na mesma missa', () => {
    const apoio: ApoioEscala = {
      voluntarios: [
        { voluntarioId: 'a', situacao: 'COM_RESTRICAO', indisponiveis: [{ data: '2026-09-06', periodo: null }], irmaos: ['b'] },
        { voluntarioId: 'b', situacao: 'SEM_RESTRICAO', indisponiveis: [], irmaos: ['a'] },
      ],
    };
    const eventos = [evento('2026-09-06', ['b']), evento('2026-09-13', ['b'])];
    const nomesPorId = new Map([['b', 'Beto']]);
    expect(calcularGrade({ ...base, eventos, apoio, mensal: false }).linhas[0].marcadores).toBeNull();
    const m = calcularGrade({ ...base, eventos, apoio, mensal: true, nomesPorId }).linhas[0].marcadores!;
    expect(m['a']).toEqual({ indisponivel: true, vezesNoMes: undefined, irmaoNaMissa: 'Beto' });
    expect(m['b']).toEqual({ indisponivel: false, vezesNoMes: 2, irmaoNaMissa: undefined });
  });

  it('vezesNoMes ignora referência; rótulo numera só função repetida', () => {
    expect(vezesNoMes([evento('2026-09-06', ['a', 'a']), evento('2026-09-13', ['a'], { referencia: true })]).get('a')).toBe(2);
    const dupla = evento('2026-09-06', [null, null]);
    expect(rotuloDaVaga(dupla, dupla.vagas[1])).toMatch(/ 2$/);
    const unica = evento('2026-09-06', [null]);
    expect(rotuloDaVaga(unica, unica.vagas[0])).not.toMatch(/ 1$/);
  });

  it('hojeIso formata com zeros à esquerda', () => {
    expect(hojeIso(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});
