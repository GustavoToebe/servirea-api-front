import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LayoutEscala } from '../models/escala.model';

@Injectable({ providedIn: 'root' })
export class LayoutsEscalaService {
  private url = environment.apiUrl + '/api/escalas/layouts';

  constructor(private http: HttpClient) {}

  async listar(): Promise<LayoutEscala[]> {
    return firstValueFrom(this.http.get<LayoutEscala[]>(this.url));
  }

  async carregar(id: string): Promise<LayoutEscala> {
    return firstValueFrom(this.http.get<LayoutEscala>(`${this.url}/${id}`));
  }

  async salvar(layout: Partial<LayoutEscala>): Promise<LayoutEscala> {
    if (layout.id) {
      return firstValueFrom(this.http.put<LayoutEscala>(`${this.url}/${layout.id}`, layout));
    }
    return firstValueFrom(this.http.post<LayoutEscala>(this.url, layout));
  }

  async excluir(id: string): Promise<void> {
    return firstValueFrom(this.http.delete<void>(`${this.url}/${id}`));
  }
}
