import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { mensagemApi } from '../../../core/api/api-error';
import { celebracoesDoMes } from '../data/calendario-liturgico';
import { ApoioEscala, Escala, EscalaDetalhe, EscalaEvento, EscalaFilters, EscalaVaga, IndisponibilidadesMes, Presenca, StatusEscala, TipoEscala } from '../models/escala.model';
import { FuncaoEscala } from '../../voluntarios/models/voluntario.model';

/** Contrato de `/escalas` na API Java (`EscalaResponse` e filhos). */
interface EscalaApi {
  sequencial: number;
  id: string;
  titulo: string;
  tipo: TipoEscala;
  ano: number;
  mes: number;
  status: StatusEscala;
  observacao: string | null;
  version: number | null;
  eventos: {
    id: string;
    data: string;
    horario: string;
    celebracao: string;
    vagas: { id: string; funcao: FuncaoEscala; posicao: number; voluntarioId: string | null; voluntarioNome: string | null; presenca: Presenca }[];
    referencia?: boolean;
  }[];
}

/**
 * Escalas pela API Java. Antes falava direto com o Supabase, o que parou de
 * funcionar quando o login passou a ser o JWT da API (sem sessão do Supabase,
 * a RLS barra tudo). As telas continuam com o modelo antigo (snake_case) —
 * a tradução fica toda aqui.
 */
@Injectable({ providedIn: 'root' })
export class EscalasService {
  private readonly base = `${environment.apiUrl}/escalas`;

  constructor(private http: HttpClient) {}

  async list(filters: EscalaFilters = {}): Promise<EscalaDetalhe[]> {
    let params = new HttpParams();
    if (filters.ano) params = params.set('ano', filters.ano);
    if (filters.mes) params = params.set('mes', filters.mes);
    if (filters.tipo) params = params.set('tipo', filters.tipo);
    if (filters.status) params = params.set('status', filters.status);
    try {
      const rows = await firstValueFrom(this.http.get<EscalaApi[]>(this.base, { params }));
      return rows.map(r => this.paraDetalhe(r));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível listar as escalas.'));
    }
  }

  async getById(id: string): Promise<EscalaDetalhe> {
    try {
      return this.paraDetalhe(await firstValueFrom(this.http.get<EscalaApi>(`${this.base}/${id}`)));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Escala não encontrada.'));
    }
  }

  /**
   * Cria (POST) ou atualiza (PUT, com `version`) a escala inteira numa
   * transação só na API. Pedir `FINALIZADA` salva e depois finaliza.
   */
  async save(payload: Omit<EscalaDetalhe, 'id'> & { id?: string }): Promise<EscalaDetalhe> {
    const corpo = {
      titulo: payload.titulo,
      tipo: payload.tipo,
      ano: payload.ano,
      mes: payload.mes,
      observacao: payload.observacao || null,
      version: payload.version ?? null,
      eventos: payload.eventos.map(e => ({
        data: e.data,
        horario: this.horario(e.horario),
        celebracao: e.celebracao || 'Missa',
        vagas: e.vagas.map(v => ({ funcao: v.funcao, posicao: v.posicao, voluntarioId: v.voluntario_id || null })),
        referencia: !!e.referencia
      }))
    };
    try {
      let salva = await firstValueFrom(payload.id
        ? this.http.put<EscalaApi>(`${this.base}/${payload.id}`, corpo)
        : this.http.post<EscalaApi>(this.base, corpo));
      if (payload.status === 'FINALIZADA' && salva.status !== 'FINALIZADA') {
        salva = await firstValueFrom(this.http.post<EscalaApi>(`${this.base}/${salva.id}/finalizar`, {}));
      }
      return this.paraDetalhe(salva);
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível salvar a escala.'));
    }
  }

  async setStatus(id: string, status: StatusEscala): Promise<EscalaDetalhe> {
    const acao = status === 'CANCELADA' ? 'cancelar' : status === 'FINALIZADA' ? 'finalizar' : 'reabrir';
    try {
      return this.paraDetalhe(await firstValueFrom(this.http.post<EscalaApi>(`${this.base}/${id}/${acao}`, {})));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível mudar o status da escala.'));
    }
  }

  /** A API só exclui escala CANCELADA (409 caso contrário). */
  async deleteCancelled(id: string): Promise<void> {
    try {
      await firstValueFrom(this.http.delete<void>(`${this.base}/${id}`));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'A escala precisa estar Cancelada antes de ser excluída.'));
    }
  }

  async indisponibilidades(ano: number, mes: number): Promise<IndisponibilidadesMes> {
    const params = new HttpParams().set('ano', ano).set('mes', mes);
    try {
      return await firstValueFrom(this.http.get<IndisponibilidadesMes>(`${this.base}/indisponibilidades`, { params }));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível carregar as indisponibilidades.'));
    }
  }

  async salvarIndisponibilidades(ano: number, mes: number, dados: Pick<IndisponibilidadesMes, 'itens' | 'semRestricao'>): Promise<IndisponibilidadesMes> {
    const params = new HttpParams().set('ano', ano).set('mes', mes);
    try {
      return await firstValueFrom(this.http.put<IndisponibilidadesMes>(`${this.base}/indisponibilidades`, dados, { params }));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível salvar as indisponibilidades.'));
    }
  }

  /** Situação, datas indisponíveis e irmãos de cada voluntário ativo, no mês da escala. */
  async apoio(escalaId: string): Promise<ApoioEscala> {
    try {
      return await firstValueFrom(this.http.get<ApoioEscala>(`${this.base}/${escalaId}/apoio`));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível carregar o apoio da escala.'));
    }
  }

  private paraDetalhe(r: EscalaApi): EscalaDetalhe {
    const eventos: EscalaEvento[] = (r.eventos || []).map(e => ({
      id: e.id,
      escala_id: r.id,
      data: e.data,
      horario: this.horario(e.horario),
      celebracao: e.celebracao || 'Missa',
      referencia: !!e.referencia,
      vagas: (e.vagas || []).map(v => ({
        id: v.id,
        evento_id: e.id,
        funcao: v.funcao,
        posicao: v.posicao,
        voluntario_id: v.voluntarioId,
        voluntario: v.voluntarioId ? { id: v.voluntarioId, nome_completo: v.voluntarioNome || '' } : null,
        presenca: v.presenca
      })).sort((a, b) => this.slotOrder(a) - this.slotOrder(b))
    })).sort((a, b) => `${a.data} ${a.horario}`.localeCompare(`${b.data} ${b.horario}`));
    const escala: Escala = {
      id: r.id, sequencial: r.sequencial, titulo: r.titulo, tipo: r.tipo, ano: r.ano, mes: r.mes,
      status: r.status, observacao: r.observacao, version: r.version
    };
    return { ...escala, eventos };
  }

  /** A API devolve "19:00" quando os segundos são zero; as telas usam "19:00:00". */
  private horario(h: string): string {
    return h && h.length === 5 ? `${h}:00` : h;
  }

  buildDefaultEvents(tipo: TipoEscala, ano: number, mes: number, colunas: {funcao: FuncaoEscala, posicao: number}[]): EscalaEvento[] {
    const events: EscalaEvento[] = [];
    const days = new Date(ano, mes, 0).getDate();
    for (let day = 1; day <= days; day++) {
      const d = new Date(ano, mes - 1, day, 12);
      const dow = d.getDay();
      const date = `${ano}-${String(mes).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (tipo === 'SEMANAL' && dow >= 1 && dow <= 5) {
        events.push(this.createEvent(tipo, date, '19:00', 'Missa', colunas));
      }
      if (tipo === 'MENSAL' && dow === 6) {
        events.push(this.createEvent(tipo, date, '19:00', 'Missa', colunas));
      }
      if (tipo === 'MENSAL' && dow === 0) {
        events.push(this.createEvent(tipo, date, '09:30', 'Missa', colunas));
        events.push(this.createEvent(tipo, date, '19:00', 'Missa', colunas));
      }
    }
    this.mergeLiturgicalDays(events, tipo, ano, mes);
    return events.sort((a, b) => `${a.data} ${a.horario}`.localeCompare(`${b.data} ${b.horario}`));
  }

  /**
   * Replica uma escala semanal para outro mês (PLANO-006), sem HTTP. Mapeia por dia da semana + ocorrência no mês
   * (1ª quinta → 1ª quinta). Dia que só existe no destino fica vazio com `ocorrenciaNova`; dia da origem que não existe
   * no destino vira `referencia` com a data original e os nomes. Resultado: referências primeiro, depois os dias reais.
   */
  replicarSemanal(origem: EscalaDetalhe, ano: number, mes: number): EscalaEvento[] {
    const chave = (iso: string) => {
      const d = new Date(`${iso}T12:00:00`);
      return `${d.getDay()}-${Math.floor((d.getDate() - 1) / 7) + 1}`;
    };
    const copiarVagas = (vagas: EscalaVaga[]): EscalaVaga[] => vagas.map(v => ({
      funcao: v.funcao, posicao: v.posicao, voluntario_id: v.voluntario_id ?? null,
      voluntario: v.voluntario ? { ...v.voluntario } : null
    }));
    const porChave = new Map<string, EscalaEvento[]>();
    for (const e of origem.eventos.filter(x => !x.referencia)) {
      const lista = porChave.get(chave(e.data)) ?? [];
      lista.push(e);
      porChave.set(chave(e.data), lista);
    }
    for (const lista of porChave.values()) lista.sort((a, b) => a.horario.localeCompare(b.horario));

    const destino = this.buildDefaultEvents('SEMANAL', ano, mes, origem.colunas || []);
    const usadas = new Set<string>();
    const reais: EscalaEvento[] = [];
    for (const data of [...new Set(destino.map(e => e.data))]) {
      const padrao = destino.filter(e => e.data === data);
      const k = chave(data);
      const daOrigem = porChave.get(k);
      if (daOrigem?.length) {
        usadas.add(k);
        for (const e of daOrigem) {
          reais.push({ data, horario: e.horario, celebracao: padrao[0].celebracao, vagas: copiarVagas(e.vagas) });
        }
      } else {
        for (const e of padrao) reais.push({ ...e, ocorrenciaNova: true });
      }
    }
    const referencias: EscalaEvento[] = [];
    for (const [k, lista] of porChave) {
      if (usadas.has(k)) continue;
      for (const e of lista) {
        referencias.push({ data: e.data, horario: e.horario, celebracao: e.celebracao, vagas: copiarVagas(e.vagas), referencia: true });
      }
    }
    const ordem = (a: EscalaEvento, b: EscalaEvento) => `${a.data} ${a.horario}`.localeCompare(`${b.data} ${b.horario}`);
    return [...referencias.sort(ordem), ...reais.sort(ordem)];
  }

  createEvent(tipo: TipoEscala, data: string, horario: string, celebracao: string, colunas: {funcao: FuncaoEscala, posicao: number}[]): EscalaEvento {
    return {
      data,
      horario: horario.length === 5 ? `${horario}:00` : horario,
      celebracao: celebracao || 'Missa',
      vagas: colunas.map(c => ({ funcao: c.funcao, posicao: c.posicao, voluntario_id: null }))
    };
  }

  private mergeLiturgicalDays(events: EscalaEvento[], tipo: TipoEscala, ano: number, mes: number) {
    for (const feast of celebracoesDoMes(ano, mes)) {
      const dow = new Date(`${feast.data}T12:00:00`).getDay();
      const weekend = dow === 0 || dow === 6;
      if (tipo === 'MENSAL' && !weekend) continue;
      if (tipo === 'SEMANAL' && weekend) continue;
      for (const event of events.filter(e => e.data === feast.data)) {
        if (!event.celebracao || event.celebracao === 'Missa') event.celebracao = feast.titulo;
      }
    }
  }

  private slotOrder(v: EscalaVaga) {
    const order: Record<string, number> = { MISSAL:1, CRUZ:2, CREDENCIA:3, VELA:4, COLETA:5, SINO:6, OUTRO:7 };
    return (order[v.funcao] || 99) * 10 + v.posicao;
  }
}
