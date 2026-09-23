import { Injectable } from '@angular/core';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import { CompromissoVoluntario, Responsavel, Voluntario, VoluntarioFilters } from '../models/voluntario.model';

@Injectable({ providedIn: 'root' })
export class VoluntariosService {
  private bucket = 'voluntarios-fotos';

  constructor(private supabase: SupabaseService) {}

  async list(filters: VoluntarioFilters = {}): Promise<Voluntario[]> {
    let query = this.supabase.client
      .from('voluntarios')
      .select('*')
      .order('nome_completo');

    if (filters.nome?.trim()) query = query.ilike('nome_completo', `%${filters.nome.trim()}%`);
    if (filters.tipo) query = query.eq('tipo', filters.tipo);
    if (filters.status === 'ATIVO') query = query.eq('ativo', true);
    if (filters.status === 'INATIVO') query = query.eq('ativo', false);
    if (filters.funcao) query = query.contains('funcoes_habilitadas', [filters.funcao]);

    const { data, error } = await query;
    if (error) throw error;

    let rows = (data || []) as Voluntario[];
    if (filters.idade != null) {
      rows = rows.filter(v => this.age(v.data_nascimento) === Number(filters.idade));
    }

    await Promise.all(rows.map(v => this.attachSignedPhoto(v)));
    return rows;
  }

  async active(): Promise<Voluntario[]> {
    return this.list({ status: 'ATIVO' });
  }

  async countByActive(ativo: boolean): Promise<number> {
    const { count, error } = await this.supabase.client
      .from('voluntarios')
      .select('id', { count: 'exact', head: true })
      .eq('ativo', ativo);
    if (error) throw error;
    return count || 0;
  }

  async getById(id: string): Promise<Voluntario> {
    const { data, error } = await this.supabase.client
      .from('voluntarios')
      .select('*, responsaveis(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    const row = data as Voluntario;
    await this.attachSignedPhoto(row);
    row.responsaveis = (row.responsaveis || []).sort((a, b) => Number(b.principal) - Number(a.principal));
    return row;
  }

  async create(payload: Omit<Voluntario, 'id'>, responsaveis: Responsavel[], foto?: File | null): Promise<Voluntario> {
    const clean = this.cleanVoluntario(payload);
    const { data, error } = await this.supabase.client.from('voluntarios').insert(clean).select().single();
    if (error) throw error;
    const created = data as Voluntario;

    try {
      if (responsaveis.length) await this.replaceResponsaveis(created.id, responsaveis);
      if (foto) {
        const path = await this.uploadPhoto(created.id, foto);
        const { error: updateError } = await this.supabase.client.from('voluntarios').update({ foto_path: path }).eq('id', created.id);
        if (updateError) throw updateError;
        created.foto_path = path;
      }
      return this.getById(created.id);
    } catch (e) {
      await this.supabase.client.from('voluntarios').delete().eq('id', created.id);
      throw e;
    }
  }

  async update(id: string, payload: Partial<Voluntario>, responsaveis: Responsavel[], foto?: File | null, removePhoto = false): Promise<Voluntario> {
    const clean = this.cleanVoluntario(payload);
    delete (clean as any).id;
    delete (clean as any).responsaveis;
    delete (clean as any).foto_url;

    if (removePhoto) {
      const current = await this.getById(id);
      if (current.foto_path) await this.supabase.client.storage.from(this.bucket).remove([current.foto_path]);
      clean.foto_path = null;
    }

    const { error } = await this.supabase.client.from('voluntarios').update(clean).eq('id', id);
    if (error) throw error;
    await this.replaceResponsaveis(id, responsaveis);

    if (foto) {
      const current = await this.getById(id);
      if (current.foto_path) await this.supabase.client.storage.from(this.bucket).remove([current.foto_path]);
      const path = await this.uploadPhoto(id, foto);
      const { error: updateError } = await this.supabase.client.from('voluntarios').update({ foto_path: path }).eq('id', id);
      if (updateError) throw updateError;
    }

    return this.getById(id);
  }

  async setActive(id: string, ativo: boolean): Promise<void> {
    const { error } = await this.supabase.client.from('voluntarios').update({ ativo }).eq('id', id);
    if (error) throw error;
  }

  async commitments(id: string): Promise<CompromissoVoluntario[]> {
    const { data, error } = await this.supabase.client
      .from('vw_voluntario_compromissos')
      .select('*')
      .eq('voluntario_id', id)
      .order('data', { ascending: true })
      .order('horario', { ascending: true });
    if (error) throw error;
    return (data || []) as CompromissoVoluntario[];
  }

  private async replaceResponsaveis(voluntarioId: string, responsaveis: Responsavel[]) {
    const { error: delError } = await this.supabase.client.from('responsaveis').delete().eq('voluntario_id', voluntarioId);
    if (delError) throw delError;
    if (!responsaveis.length) return;
    const rows = responsaveis.map(r => ({
      voluntario_id: voluntarioId,
      parentesco: r.parentesco,
      nome: r.nome,
      telefone: r.telefone || null,
      celular: r.celular || null,
      email: r.email || null,
      principal: !!r.principal
    }));
    const { error } = await this.supabase.client.from('responsaveis').insert(rows);
    if (error) throw error;
  }

  private async uploadPhoto(id: string, file: File): Promise<string> {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const path = `${id}/perfil-${Date.now()}.${ext}`;
    const { error } = await this.supabase.client.storage.from(this.bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    return path;
  }

  private async attachSignedPhoto(v: Voluntario) {
    if (!v.foto_path) return;
    const { data } = await this.supabase.client.storage.from(this.bucket).createSignedUrl(v.foto_path, 3600);
    v.foto_url = data?.signedUrl || null;
  }

  private age(date: string | null): number | null {
    if (!date) return null;
    const d = new Date(`${date}T12:00:00`);
    const now = new Date();
    let age = now.getFullYear() - d.getFullYear();
    const m = now.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
    return age;
  }

  private cleanVoluntario(payload: any): any {
    const allowed = [
      'nome_completo','data_nascimento','tipo','ativo','foto_path','etapa_catequese','eucaristia_ano','crisma_ano',
      'rua','numero','bairro','telefone','celular','email','horario_estudo','observacoes','autoriza_whatsapp','funcoes_habilitadas'
    ];
    return Object.fromEntries(allowed.filter(k => k in payload).map(k => [k, payload[k] === '' ? null : payload[k]]));
  }
}
