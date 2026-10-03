import { Voluntario } from '../../../voluntarios/models/voluntario.model';
import { ApoioEscala, EscalaEvento, EscalaVaga, indisponivelEm } from '../../models/escala.model';

/** Ids já alocados no evento, exceto o da vaga que está sendo editada. */
export function idsUsadosNoEvento(evento: EscalaEvento, atual: string | null): string[] {
  return evento.vagas.map(v => v.voluntario_id).filter((x): x is string => !!x && x !== atual);
}

/** Ids de todas as pessoas já escaladas no rascunho. */
export function idsEscalados(eventos: readonly EscalaEvento[]): string[] {
  return eventos.flatMap(e => e.vagas.flatMap(v => (v.voluntario_id ? [v.voluntario_id] : [])));
}

export interface EntradaImpedimento {
  /** Escala bloqueada, salvando ou usuário sem permissão: nada pode ser alocado. */
  edicaoIndisponivel: boolean;
  eventos: readonly EscalaEvento[];
  evento: EscalaEvento;
  vaga: EscalaVaga;
  pessoaId: string;
  voluntarios: readonly Voluntario[];
  apoio: ApoioEscala | null;
}

/** Motivo pelo qual a pessoa não pode ocupar a vaga (mensagem para a tela) ou `null` se pode. A ordem das checagens é a da mensagem mostrada. */
export function impedimentoDeAlocacao(e: EntradaImpedimento): string | null {
  if (e.edicaoIndisponivel) return 'A escala não está disponível para edição.';
  if (!e.eventos.includes(e.evento) || !e.evento.vagas.includes(e.vaga) || e.evento.referencia) {
    return 'Escolha uma vaga deste rascunho, sem referência.';
  }
  const pessoa = e.voluntarios.find(v => v.id === e.pessoaId);
  if (!pessoa?.ativo) return 'Voluntário não está ativo.';
  if (!pessoa.funcoes_habilitadas?.includes(e.vaga.funcao)) return 'Voluntário não está habilitado para esta função.';
  if (idsUsadosNoEvento(e.evento, e.vaga.voluntario_id).includes(e.pessoaId)) {
    return 'Esta pessoa já está alocada em outra função nesta mesma missa.';
  }
  if (indisponivelEm(e.apoio, e.pessoaId, e.evento.data, e.evento.horario)) {
    return 'A pessoa informou indisponibilidade nesta data e período.';
  }
  const horario = e.evento.horario.slice(0, 5);
  const noutra = e.eventos.some(o => o !== e.evento && !o.referencia && o.data === e.evento.data
    && o.horario.slice(0, 5) === horario && o.vagas.some(v => v.voluntario_id === e.pessoaId));
  if (noutra) return 'A pessoa já está em outra celebração deste rascunho no mesmo horário.';
  return null;
}

/** Primeira vaga livre do evento, na ordem das colunas. */
export function primeiraVagaLivre(evento: EscalaEvento): EscalaVaga | null {
  return evento.vagas.find(v => !v.voluntario_id) ?? null;
}

export interface Sugestao { irmaoId: string; nomeIrmao: string; nomePessoa: string; }

/** Irmão que ainda não está nesta missa e já é conhecido na tela: só sugere, nunca coloca sozinho. */
export function sugestaoDeIrmao(
  evento: EscalaEvento, pessoaId: string | null, apoio: ApoioEscala | null, voluntarios: readonly Voluntario[],
): Sugestao | null {
  if (!pessoaId || !apoio) return null;
  const irmaos = apoio.voluntarios.find(v => v.voluntarioId === pessoaId)?.irmaos ?? [];
  const usados = new Set(evento.vagas.map(v => v.voluntario_id).filter(Boolean));
  const fora = irmaos.find(i => !usados.has(i) && voluntarios.some(v => v.id === i));
  if (!fora) return null;
  return {
    irmaoId: fora,
    nomeIrmao: voluntarios.find(v => v.id === fora)?.nome_completo ?? '',
    nomePessoa: voluntarios.find(v => v.id === pessoaId)?.nome_completo ?? '',
  };
}

export interface Posicao { top: number; left: number; }

/** Posição do mini-painel ancorado a um elemento: dentro da janela, acima se não couber embaixo. */
export function posicaoDoPainel(alvo: { left: number; top: number; bottom: number }, janela: { largura: number; altura: number }): Posicao {
  const left = Math.max(8, Math.min(alvo.left, janela.largura - 300));
  const top = alvo.bottom + 330 > janela.altura ? Math.max(8, alvo.top - 330) : alvo.bottom + 4;
  return { top, left };
}
