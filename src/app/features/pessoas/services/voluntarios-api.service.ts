import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { mensagemApi } from '../../../core/api/api-error';
import { CacheDeListas } from '../../../core/api/cache-de-listas.service';
import { AuthService } from '../../../core/auth/auth.service';
import { TipoVoluntario, VoluntarioLista } from '../models/pessoa.model';

interface VoluntarioResponse {
  id: string;
  nomeCompleto: string;
  tipo: TipoVoluntario;
  ativo: boolean;
  fotoPath: string | null;
  etapaCatequese: string | null;
  eucaristiaAno: string | null;
  crismaAno: string | null;
  horarioEstudo: VoluntarioLista['horarioEstudo'];
  autorizaWhatsapp: boolean;
  funcoesHabilitadas: VoluntarioLista['funcoesHabilitadas'];
  mandatoInicio: string | null;
  mandatoFim: string | null;
}

@Injectable({ providedIn: 'root' })
export class VoluntariosApiService {
  private readonly base = `${environment.apiUrl}/voluntarios`;

  constructor(private http: HttpClient, private cache: CacheDeListas, private auth: AuthService) {}

  emCache(ativo: boolean): VoluntarioLista[] | null {
    return this.cache.ler<VoluntarioLista[]>(`voluntarios:${ativo}`, this.auth.tenantId());
  }

  async listar(filtro: { ativo?: boolean; tipo?: TipoVoluntario | ''; nome?: string } = {}): Promise<VoluntarioLista[]> {
    let params = new HttpParams();
    if (filtro.ativo != null) params = params.set('ativo', String(filtro.ativo));
    if (filtro.tipo) params = params.set('tipo', filtro.tipo);
    if (filtro.nome?.trim()) params = params.set('nome', filtro.nome.trim());
    try {
      const rows = await firstValueFrom(this.http.get<VoluntarioResponse[]>(this.base, { params }));
      const lista = rows.map(this.paraLista);
      if (filtro.ativo != null && !filtro.tipo && !filtro.nome?.trim()) {
        this.cache.gravar(`voluntarios:${filtro.ativo}`, this.auth.tenantId(), lista);
      }
      return lista;
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível listar os voluntários.'));
    }
  }

  async contagens(): Promise<{ ativos: number; inativos: number }> {
    try {
      return await firstValueFrom(this.http.get<{ ativos: number; inativos: number }>(`${this.base}/contagens`));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível contar os cadastros.'));
    }
  }

  async contar(ativo: boolean): Promise<number> {
    try {
      return await firstValueFrom(this.http.get<number>(`${this.base}/count`, { params: { ativo } }));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível contar os cadastros.'));
    }
  }

  async setAtivo(id: string, ativo: boolean): Promise<void> {
    try {
      await firstValueFrom(this.http.patch(`${this.base}/${id}/ativo`, null, { params: { ativo } }));
      this.cache.invalidarPrefixo('voluntarios');
      this.cache.invalidarPrefixo('pessoas');
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível alterar o status.'));
    }
  }

  async enviarFoto(id: string, foto: File): Promise<void> {
    const body = new FormData();
    body.append('foto', foto);
    try {
      await firstValueFrom(this.http.post(`${this.base}/${id}/foto`, body));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível enviar a foto.'));
    }
  }

  async fotoUrl(id: string): Promise<string | null> {
    try {
      const resp = await firstValueFrom(this.http.get<{ url: string }>(`${this.base}/${id}/foto-url`));
      return resp.url || null;
    } catch {
      return null;
    }
  }

  private paraLista(v: VoluntarioResponse): VoluntarioLista {
    return {
      id: v.id,
      nomeCompleto: v.nomeCompleto,
      nome_completo: v.nomeCompleto,
      tipo: v.tipo,
      ativo: v.ativo,
      fotoPath: v.fotoPath,
      etapaCatequese: v.etapaCatequese,
      eucaristiaAno: v.eucaristiaAno,
      crismaAno: v.crismaAno,
      horarioEstudo: v.horarioEstudo,
      autorizaWhatsapp: v.autorizaWhatsapp,
      funcoesHabilitadas: v.funcoesHabilitadas || [],
      mandatoInicio: v.mandatoInicio,
      mandatoFim: v.mandatoFim
    };
  }
}
