import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Diocese, Paroquia, ParoquiaRequest } from './paroquia.models';

@Injectable({ providedIn: 'root' })
export class ParoquiaApiService {
  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  buscar() {
    return this.http.get<Paroquia>(`${this.api}/tenant`);
  }

  salvar(corpo: ParoquiaRequest) {
    return this.http.put<Paroquia>(`${this.api}/tenant`, corpo);
  }

  dioceses() {
    return this.http.get<Diocese[]>(`${this.api}/dioceses`);
  }
}
