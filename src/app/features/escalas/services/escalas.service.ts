import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { mensagemApi } from '../../../core/api/api-error';
import { celebracoesDoMes } from '../data/calendario-liturgico';
import { Escala, EscalaDetalhe, EscalaEvento, EscalaFilters, EscalaVaga, Presenca, StatusEscala, TipoEscala } from '../models/escala.model';
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
        vagas: e.vagas.map(v => ({ funcao: v.funcao, posicao: v.posicao, voluntarioId: v.voluntario_id || null }))
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

  private paraDetalhe(r: EscalaApi): EscalaDetalhe {
    const eventos: EscalaEvento[] = (r.eventos || []).map(e => ({
      id: e.id,
      escala_id: r.id,
      data: e.data,
      horario: this.horario(e.horario),
      celebracao: e.celebracao || 'Missa',
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

  buildDefaultEvents(tipo: TipoEscala, ano: number, mes: number): EscalaEvento[] {
    const events: EscalaEvento[] = [];
    const days = new Date(ano, mes, 0).getDate();
    for (let day = 1; day <= days; day++) {
      const d = new Date(ano, mes - 1, day, 12);
      const dow = d.getDay();
      const date = `${ano}-${String(mes).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (tipo === 'SEMANAL' && dow >= 1 && dow <= 5) {
        events.push(this.createEvent(tipo, date, '19:00', 'Missa'));
      }
      if (tipo === 'MENSAL' && dow === 6) {
        events.push(this.createEvent(tipo, date, '19:00', 'Missa'));
      }
      if (tipo === 'MENSAL' && dow === 0) {
        events.push(this.createEvent(tipo, date, '09:30', 'Missa'));
        events.push(this.createEvent(tipo, date, '19:00', 'Missa'));
      }
    }
    this.mergeLiturgicalDays(events, tipo, ano, mes);
    return events.sort((a, b) => `${a.data} ${a.horario}`.localeCompare(`${b.data} ${b.horario}`));
  }

  createEvent(tipo: TipoEscala, data: string, horario: string, celebracao: string): EscalaEvento {
    return {
      data,
      horario: horario.length === 5 ? `${horario}:00` : horario,
      celebracao: celebracao || 'Missa',
      vagas: this.defaultSlots(tipo === 'MENSAL')
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

  private defaultSlots(includeColeta: boolean): EscalaVaga[] {
    const defs: FuncaoEscala[] = ['MISSAL','CRUZ','CREDENCIA','VELA','VELA', ...(includeColeta ? ['COLETA' as FuncaoEscala] : []), 'SINO','SINO'];
    const counters: Record<string, number> = {};
    return defs.map(funcao => {
      counters[funcao] = (counters[funcao] || 0) + 1;
      return { funcao, posicao: counters[funcao], voluntario_id: null };
    });
  }

  private slotOrder(v: EscalaVaga) {
    const order: Record<string, number> = { MISSAL:1, CRUZ:2, CREDENCIA:3, VELA:4, COLETA:5, SINO:6, OUTRO:7 };
    return (order[v.funcao] || 99) * 10 + v.posicao;
  }
}
