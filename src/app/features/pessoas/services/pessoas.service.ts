import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { mensagemApi } from '../../../core/api/api-error';
import { Pessoa, PessoaPapel, PessoaRequest } from '../models/pessoa.model';

@Injectable({ providedIn: 'root' })
export class PessoasService {
  private readonly base = `${environment.apiUrl}/pessoas`;

  constructor(private http: HttpClient) {}

  async listar(papel?: PessoaPapel, nome?: string): Promise<Pessoa[]> {
    let params = new HttpParams();
    if (papel) params = params.set('papel', papel);
    if (nome?.trim()) params = params.set('nome', nome.trim());
    try {
      return await firstValueFrom(this.http.get<Pessoa[]>(this.base, { params }));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível listar as pessoas.'));
    }
  }

  async buscar(id: string): Promise<Pessoa> {
    try {
      return await firstValueFrom(this.http.get<Pessoa>(`${this.base}/${id}`));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Pessoa não encontrada.'));
    }
  }

  async criar(request: PessoaRequest): Promise<Pessoa> {
    try {
      return await firstValueFrom(this.http.post<Pessoa>(this.base, request));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível criar o cadastro.'));
    }
  }

  async atualizar(id: string, request: PessoaRequest): Promise<Pessoa> {
    try {
      return await firstValueFrom(this.http.put<Pessoa>(`${this.base}/${id}`, request));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível atualizar o cadastro.'));
    }
  }
}
