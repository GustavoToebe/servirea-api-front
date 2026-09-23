import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { SupabaseService } from '../../../core/supabase/supabase.service';
import {
  EnviarInscricaoResponse,
  Inscricao,
  InscricaoDados,
  InscricaoResponsavel,
  InscricaoResponsavelPayload,
  StatusInscricao
} from '../models/inscricao.model';

interface InscricaoRow extends Inscricao {
  inscricao_responsaveis?: InscricaoResponsavel[];
}

@Injectable({ providedIn: 'root' })
export class InscricoesService {
  private bucket = 'voluntarios-fotos';

  constructor(private supabase: SupabaseService) {}

  async enviarPublica(
    dados: InscricaoDados,
    responsaveis: InscricaoResponsavelPayload[],
    turnstileToken: string,
    foto?: File | null
  ): Promise<EnviarInscricaoResponse> {
    const body = new FormData();
    body.append('dados', JSON.stringify(dados));
    body.append('responsaveis', JSON.stringify(responsaveis));
    body.append('turnstileToken', turnstileToken);
    if (foto) body.append('foto', foto, foto.name);

    const response = await fetch(`${environment.supabaseUrl}/functions/v1/enviar-inscricao`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${environment.supabaseAnonKey}`,
        apikey: environment.supabaseAnonKey
      },
      body
    });

    let payload: EnviarInscricaoResponse;
    try {
      payload = await response.json() as EnviarInscricaoResponse;
    } catch {
      throw new Error('Não foi possível enviar a inscrição. Tente novamente.');
    }

    if (!response.ok || !payload.ok) {
      throw new Error(payload.message || 'Não foi possível enviar a inscrição. Tente novamente.');
    }

    return payload;
  }

  async listByStatus(status: StatusInscricao): Promise<Inscricao[]> {
    const { data, error } = await this.supabase.client
      .from('inscricoes')
      .select('*, inscricao_responsaveis(*)')
      .eq('status', status)
      .order('created_at', { ascending: true });
    if (error) throw error;
    const rows = ((data || []) as InscricaoRow[]).map(row => this.mapRow(row));
    await Promise.all(rows.map(row => this.attachSignedPhoto(row)));
    return rows;
  }

  async countByStatus(status: StatusInscricao): Promise<number> {
    const { count, error } = await this.supabase.client
      .from('inscricoes')
      .select('id', { count: 'exact', head: true })
      .eq('status', status);
    if (error) throw error;
    return count || 0;
  }

  async getById(id: string): Promise<Inscricao> {
    const { data, error } = await this.supabase.client
      .from('inscricoes')
      .select('*, inscricao_responsaveis(*)')
      .eq('id', id)
      .single();
    if (error) throw error;
    const row = this.mapRow(data as InscricaoRow);
    await this.attachSignedPhoto(row);
    return row;
  }

  async updatePendente(
    id: string,
    dados: InscricaoDados,
    responsaveis: InscricaoResponsavelPayload[],
    foto?: File | null,
    removePhoto = false
  ): Promise<Inscricao> {
    const current = await this.getById(id);
    if (current.status !== 'PENDENTE') {
      throw new Error('Somente inscrições pendentes podem ser editadas.');
    }

    const payload = this.cleanDados(dados);

    if (removePhoto && current.foto_path) {
      await this.supabase.client.storage.from(this.bucket).remove([current.foto_path]);
      payload.foto_path = null;
    }

    if (foto) {
      if (current.foto_path) {
        await this.supabase.client.storage.from(this.bucket).remove([current.foto_path]);
      }
      payload.foto_path = await this.uploadPhoto(id, foto);
    }

    const { error } = await this.supabase.client.from('inscricoes').update(payload).eq('id', id).eq('status', 'PENDENTE');
    if (error) throw error;
    await this.replaceResponsaveis(id, responsaveis);
    return this.getById(id);
  }

  async aprovar(id: string): Promise<void> {
    const { error } = await this.supabase.client.rpc('aprovar_inscricao', { p_inscricao_id: id });
    if (error) throw new Error('Não foi possível aprovar a inscrição.');
  }

  async rejeitar(id: string, motivo: string): Promise<void> {
    const { error } = await this.supabase.client.rpc('rejeitar_inscricao', {
      p_inscricao_id: id,
      p_motivo: motivo.trim()
    });
    if (error) throw new Error('Não foi possível rejeitar a inscrição.');
  }

  private async replaceResponsaveis(inscricaoId: string, responsaveis: InscricaoResponsavelPayload[]) {
    const { error: delError } = await this.supabase.client
      .from('inscricao_responsaveis')
      .delete()
      .eq('inscricao_id', inscricaoId);
    if (delError) throw delError;
    if (!responsaveis.length) return;
    const rows = responsaveis.map(responsavel => ({
      inscricao_id: inscricaoId,
      parentesco: responsavel.parentesco,
      nome: responsavel.nome,
      telefone: responsavel.telefone,
      celular: responsavel.celular,
      email: responsavel.email,
      principal: !!responsavel.principal
    }));
    const { error } = await this.supabase.client.from('inscricao_responsaveis').insert(rows);
    if (error) throw error;
  }

  private async uploadPhoto(id: string, file: File): Promise<string> {
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
    const path = `inscricoes/${id}/foto.${ext}`;
    const { error } = await this.supabase.client.storage.from(this.bucket).upload(path, file, { upsert: true });
    if (error) throw error;
    return path;
  }

  private async attachSignedPhoto(inscricao: Inscricao) {
    if (!inscricao.foto_path) return;
    const { data } = await this.supabase.client.storage.from(this.bucket).createSignedUrl(inscricao.foto_path, 3600);
    inscricao.foto_url = data?.signedUrl || null;
  }

  private mapRow(row: InscricaoRow): Inscricao {
    const responsaveis = (row.inscricao_responsaveis || row.responsaveis || [])
      .slice()
      .sort((a, b) => Number(b.principal) - Number(a.principal));
    return {
      ...row,
      funcoes_habilitadas: row.funcoes_habilitadas || [],
      voluntario_id: row.voluntario_id || null,
      aprovado_por: row.aprovado_por || null,
      rejeitado_por: row.rejeitado_por || null,
      data_rejeicao: row.data_rejeicao || null,
      motivo_rejeicao: row.motivo_rejeicao || null,
      responsaveis
    };
  }

  private cleanDados(dados: InscricaoDados): InscricaoDados & { foto_path?: string | null } {
    return {
      nome_completo: dados.nome_completo,
      data_nascimento: dados.data_nascimento,
      tipo: dados.tipo,
      etapa_catequese: dados.etapa_catequese,
      eucaristia_ano: dados.eucaristia_ano,
      crisma_ano: dados.crisma_ano,
      rua: dados.rua,
      numero: dados.numero,
      bairro: dados.bairro,
      telefone: dados.telefone,
      celular: dados.celular,
      email: dados.email,
      horario_estudo: dados.horario_estudo,
      observacoes: dados.observacoes,
      autoriza_whatsapp: dados.autoriza_whatsapp,
      funcoes_habilitadas: dados.funcoes_habilitadas
    };
  }
}
