import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { mensagemApi } from '../../../core/api/api-error';
import { Inscricao, InscricaoPublicaRequest, StatusInscricao } from '../models/inscricao.model';
import { Duplicidade } from '../models/pessoa.model';

@Injectable({ providedIn: 'root' })
export class InscricoesApiService {
  constructor(private http: HttpClient) {}

  async listar(status?: StatusInscricao): Promise<Inscricao[]> {
    let params = new HttpParams();
    if (status) params = params.set('status', status);
    try {
      return await firstValueFrom(this.http.get<Inscricao[]>(`${environment.apiUrl}/inscricoes`, { params }));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível listar as inscrições.'));
    }
  }

  async buscar(id: string): Promise<Inscricao> {
    try {
      return await firstValueFrom(this.http.get<Inscricao>(`${environment.apiUrl}/inscricoes/${id}`));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Inscrição não encontrada.'));
    }
  }

  async aprovar(id: string): Promise<Inscricao> {
    try {
      return await firstValueFrom(this.http.post<Inscricao>(`${environment.apiUrl}/inscricoes/${id}/aprovar`, {}));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível aprovar a inscrição.'));
    }
  }

  async rejeitar(id: string, motivo: string): Promise<Inscricao> {
    try {
      return await firstValueFrom(this.http.post<Inscricao>(`${environment.apiUrl}/inscricoes/${id}/rejeitar`, { motivo }));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível rejeitar a inscrição.'));
    }
  }

  async criarPublica(slug: string, dados: InscricaoPublicaRequest, foto?: File | null): Promise<Inscricao> {
    const body = new FormData();
    body.append('dados', new Blob([JSON.stringify(dados)], { type: 'application/json' }));
    if (foto) {
      body.append('foto', foto);
    }
    try {
      return await firstValueFrom(this.http.post<Inscricao>(
        `${environment.apiUrl}/public/${slug}/inscricoes`,
        body
      ));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível enviar a inscrição.'));
    }
  }

  async duplicidades(id: string): Promise<Duplicidade[]> {
    try {
      return await firstValueFrom(this.http.get<Duplicidade[]>(`${environment.apiUrl}/inscricoes/${id}/duplicidades`));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível verificar cadastros parecidos.'));
    }
  }
}
