import { Injectable } from '@angular/core';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { celebracoesDoMes } from '../data/calendario-liturgico';
import { Escala, EscalaDetalhe, EscalaEvento, EscalaFilters, EscalaVaga, TipoEscala } from '../models/escala.model';
import { FuncaoEscala } from '../../voluntarios/models/voluntario.model';

@Injectable({ providedIn: 'root' })
export class EscalasService {
  constructor(private supabase: SupabaseService) {}

  async list(filters: EscalaFilters = {}): Promise<Escala[]> {
    let query = this.supabase.client.from('escalas').select('*').order('ano', { ascending: false }).order('mes', { ascending: false }).order('created_at', { ascending: false });
    if (filters.ano) query = query.eq('ano', filters.ano);
    if (filters.mes) query = query.eq('mes', filters.mes);
    if (filters.tipo) query = query.eq('tipo', filters.tipo);
    if (filters.status) query = query.eq('status', filters.status);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as Escala[];
  }

  async getById(id: string): Promise<EscalaDetalhe> {
    const { data, error } = await this.supabase.client
      .from('escalas')
      .select('*, eventos:escala_eventos(*, vagas:escala_vagas(*, voluntario:voluntarios(id,nome_completo,tipo,ativo)))')
      .eq('id', id)
      .single();
    if (error) throw error;
    const result = data as unknown as EscalaDetalhe;
    result.eventos = (result.eventos || []).sort((a,b) => `${a.data} ${a.horario}`.localeCompare(`${b.data} ${b.horario}`));
    result.eventos.forEach(e => e.vagas = (e.vagas || []).sort((a,b) => this.slotOrder(a)-this.slotOrder(b)));
    return result;
  }

  async save(payload: Omit<EscalaDetalhe, 'id'> & { id?: string }): Promise<EscalaDetalhe> {
    const meta = {
      titulo: payload.titulo,
      tipo: payload.tipo,
      ano: payload.ano,
      mes: payload.mes,
      status: payload.status,
      observacao: payload.observacao || null
    };
    let id = payload.id;
    if (id) {
      const { error } = await this.supabase.client.from('escalas').update(meta).eq('id', id);
      if (error) throw error;
      const { error: delError } = await this.supabase.client.from('escala_eventos').delete().eq('escala_id', id);
      if (delError) throw delError;
    } else {
      const { data, error } = await this.supabase.client.from('escalas').insert(meta).select().single();
      if (error) throw error;
      id = data.id;
    }

    try {
      for (const event of payload.eventos) {
        const { data: inserted, error } = await this.supabase.client.from('escala_eventos').insert({
          escala_id: id,
          data: event.data,
          horario: event.horario,
          celebracao: event.celebracao || 'Missa'
        }).select().single();
        if (error) throw error;
        if (event.vagas.length) {
          const rows = event.vagas.map(v => ({ evento_id: inserted.id, funcao: v.funcao, posicao: v.posicao, voluntario_id: v.voluntario_id || null }));
          const { error: slotsError } = await this.supabase.client.from('escala_vagas').insert(rows);
          if (slotsError) throw slotsError;
        }
      }
      return await this.getById(id!);
    } catch (e) {
      if (!payload.id && id) {
        await this.supabase.client.from('escalas').update({ status: 'CANCELADA' }).eq('id', id);
        await this.supabase.client.from('escalas').delete().eq('id', id);
      }
      throw e;
    }
  }

  async setStatus(id: string, status: 'RASCUNHO' | 'FINALIZADA' | 'CANCELADA'): Promise<void> {
    const { error } = await this.supabase.client.from('escalas').update({ status }).eq('id', id);
    if (error) throw error;
  }

  async deleteCancelled(id: string): Promise<void> {
    const { data, error: findError } = await this.supabase.client.from('escalas').select('status,titulo').eq('id', id).single();
    if (findError) throw findError;
    if (data.status !== 'CANCELADA') throw new Error('A escala precisa estar Cancelada antes de ser excluída.');
    const { error } = await this.supabase.client.from('escalas').delete().eq('id', id).eq('status', 'CANCELADA');
    if (error) throw error;
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
