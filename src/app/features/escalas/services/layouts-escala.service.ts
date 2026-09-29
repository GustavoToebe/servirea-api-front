import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { mensagemApi } from '../../../core/api/api-error';
import { LayoutEscala } from '../models/escala.model';

@Injectable({ providedIn: 'root' })
export class LayoutsEscalaService {
  private readonly url = `${environment.apiUrl}/escalas/layouts`;

  constructor(private http: HttpClient) {}

  async listar(): Promise<LayoutEscala[]> {
    try {
      return await firstValueFrom(this.http.get<LayoutEscala[]>(this.url));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível listar os layouts.'));
    }
  }

  async carregar(id: string): Promise<LayoutEscala> {
    try {
      return await firstValueFrom(this.http.get<LayoutEscala>(`${this.url}/${id}`));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível carregar o layout.'));
    }
  }

  async salvar(layout: Partial<LayoutEscala>): Promise<LayoutEscala> {
    try {
      if (layout.id) {
        return await firstValueFrom(this.http.put<LayoutEscala>(`${this.url}/${layout.id}`, layout));
      }
      return await firstValueFrom(this.http.post<LayoutEscala>(this.url, layout));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível salvar o layout.'));
    }
  }

  async excluir(id: string): Promise<void> {
    try {
      await firstValueFrom(this.http.delete<void>(`${this.url}/${id}`));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível excluir o layout.'));
    }
  }
}
