import { Voluntario } from '../../../voluntarios/models/voluntario.model';
import { ApoioEscala, EscalaEvento } from '../../models/escala.model';
import {
  EntradaImpedimento, idsEscalados, idsUsadosNoEvento, impedimentoDeAlocacao, posicaoDoPainel, primeiraVagaLivre, sugestaoDeIrmao,
} from './regras-alocacao';

function evento(vagas: (string | null)[], extra: Partial<EscalaEvento> = {}): EscalaEvento {
  return {
    data: '2026-09-06', horario: '19:00:00', celebracao: 'Missa',
    vagas: vagas.map((id, i) => ({ funcao: 'VELA' as const, posicao: i + 1, voluntario_id: id })),
    ...extra,
  };
}

function pessoa(id: string, extra: Partial<Voluntario> = {}): Voluntario {
  return { id, nome_completo: `Pessoa ${id}`, ativo: true, funcoes_habilitadas: ['VELA'], ...extra } as Voluntario;
}

function entrada(extra: Partial<EntradaImpedimento> = {}): EntradaImpedimento {
  const ev = evento([null, 'b']);
  return { edicaoIndisponivel: false, eventos: [ev], evento: ev, vaga: ev.vagas[0], pessoaId: 'a', voluntarios: [pessoa('a'), pessoa('b')], apoio: null, ...extra };
}

describe('regras de alocação (funções puras)', () => {
  it('pessoa apta pode ocupar a vaga', () => {
    expect(impedimentoDeAlocacao(entrada())).toBeNull();
  });

  it('cada impedimento devolve a sua mensagem', () => {
    expect(impedimentoDeAlocacao(entrada({ edicaoIndisponivel: true }))).toContain('não está disponível');
    expect(impedimentoDeAlocacao(entrada({ evento: evento([null]) }))).toContain('vaga deste rascunho');
    const ref = evento([null], { referencia: true });
    expect(impedimentoDeAlocacao(entrada({ evento: ref, eventos: [ref], vaga: ref.vagas[0] }))).toContain('sem referência');
    expect(impedimentoDeAlocacao(entrada({ voluntarios: [pessoa('a', { ativo: false })] }))).toBe('Voluntário não está ativo.');
    expect(impedimentoDeAlocacao(entrada({ voluntarios: [pessoa('a', { funcoes_habilitadas: [] })] }))).toContain('habilitado');
    expect(impedimentoDeAlocacao(entrada({ pessoaId: 'b' }))).toContain('outra função nesta mesma missa');
  });

  it('indisponibilidade informada e conflito de horário em outra celebração bloqueiam', () => {
    const apoio: ApoioEscala = {
      voluntarios: [{ voluntarioId: 'a', situacao: 'COM_RESTRICAO', indisponiveis: [{ data: '2026-09-06', periodo: 'NOITE' }], irmaos: [] }],
    };
    expect(impedimentoDeAlocacao(entrada({ apoio }))).toContain('indisponibilidade');
    const ev = evento([null]);
    const outra = evento(['a']);
    expect(impedimentoDeAlocacao(entrada({ evento: ev, eventos: [ev, outra], vaga: ev.vagas[0] }))).toContain('mesmo horário');
    const outraReferencia = evento(['a'], { referencia: true });
    expect(impedimentoDeAlocacao(entrada({ evento: ev, eventos: [ev, outraReferencia], vaga: ev.vagas[0] }))).toBeNull();
  });

  it('ids usados ignoram a vaga atual e os vazios; escalados juntam todos os eventos', () => {
    expect(idsUsadosNoEvento(evento(['a', null, 'b']), 'a')).toEqual(['b']);
    expect(idsEscalados([evento(['a', null]), evento(['b'])])).toEqual(['a', 'b']);
    expect(primeiraVagaLivre(evento(['a', null, null]))?.posicao).toBe(2);
    expect(primeiraVagaLivre(evento(['a']))).toBeNull();
  });

  it('sugere o irmão que está fora da missa e ainda não foi alocado, só se for conhecido na tela', () => {
    const apoio: ApoioEscala = { voluntarios: [{ voluntarioId: 'a', situacao: 'SEM_RESTRICAO', indisponiveis: [], irmaos: ['b', 'c'] }] };
    const ev = evento(['a', 'b']);
    expect(sugestaoDeIrmao(ev, 'a', apoio, [pessoa('a'), pessoa('c')])).toEqual({ irmaoId: 'c', nomeIrmao: 'Pessoa c', nomePessoa: 'Pessoa a' });
    expect(sugestaoDeIrmao(ev, 'a', apoio, [pessoa('a')])).toBeNull();
    expect(sugestaoDeIrmao(ev, null, apoio, [pessoa('c')])).toBeNull();
    expect(sugestaoDeIrmao(ev, 'a', null, [pessoa('c')])).toBeNull();
  });

  it('o mini-painel fica dentro da janela e sobe quando não cabe embaixo', () => {
    const janela = { largura: 1000, altura: 800 };
    expect(posicaoDoPainel({ left: 100, top: 100, bottom: 120 }, janela)).toEqual({ top: 124, left: 100 });
    expect(posicaoDoPainel({ left: 990, top: 700, bottom: 720 }, janela)).toEqual({ top: 370, left: 700 });
    expect(posicaoDoPainel({ left: -50, top: 5, bottom: 500 }, janela)).toEqual({ top: 8, left: 8 });
  });
});
