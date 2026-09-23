import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  BackofficeLog,
  DashboardResponse,
  FiltroParoquia,
  ParoquiaAdmin,
  SuporteToken,
  UsuarioAdmin,
  VinculoForm,
  VinculoParoquia
} from './backoffice.models';

@Injectable({ providedIn: 'root' })
export class BackofficeApiService {
  private readonly base = `${environment.apiUrl}/admin`;

  constructor(private http: HttpClient) {}

  dashboard(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${this.base}/dashboard`);
  }

  listarParoquias(filtro: FiltroParoquia): Observable<ParoquiaAdmin[]> {
    let params = new HttpParams();
    const entries: [string, string][] = [
      ['situacao', filtro.situacao],
      ['nome', filtro.nome.trim()],
      ['cnpj', filtro.cnpj.trim()],
      ['email', filtro.email.trim()],
      ['tipoEmail', filtro.tipoEmail],
      ['contratadoDe', filtro.contratadoDe],
      ['contratadoAte', filtro.contratadoAte],
      ['vigenciaDe', filtro.vigenciaDe],
      ['vigenciaAte', filtro.vigenciaAte]
    ];
    for (const [key, value] of entries) {
      if (value) params = params.set(key, value);
    }
    return this.http.get<ParoquiaAdmin[]>(`${this.base}/paroquias`, { params });
  }

  buscarParoquia(id: string): Observable<ParoquiaAdmin> {
    return this.http.get<ParoquiaAdmin>(`${this.base}/paroquias/${id}`);
  }

  criarParoquia(body: unknown): Observable<ParoquiaAdmin> {
    return this.http.post<ParoquiaAdmin>(`${this.base}/paroquias`, body);
  }

  atualizarParoquia(id: string, body: unknown): Observable<ParoquiaAdmin> {
    return this.http.put<ParoquiaAdmin>(`${this.base}/paroquias/${id}`, body);
  }

  bloquear(id: string): Observable<ParoquiaAdmin> {
    return this.http.post<ParoquiaAdmin>(`${this.base}/paroquias/${id}/bloquear`, {});
  }

  desbloquear(id: string): Observable<ParoquiaAdmin> {
    return this.http.post<ParoquiaAdmin>(`${this.base}/paroquias/${id}/desbloquear`, {});
  }

  marcarPago(id: string): Observable<ParoquiaAdmin> {
    return this.http.post<ParoquiaAdmin>(`${this.base}/paroquias/${id}/marcar-pago`, {});
  }

  entrarEmSuporte(id: string): Observable<SuporteToken> {
    return this.http.post<SuporteToken>(`${this.base}/paroquias/${id}/suporte`, {});
  }

  listarUsuarios(ativo: boolean | null, busca: string): Observable<UsuarioAdmin[]> {
    let params = new HttpParams();
    if (ativo !== null) params = params.set('ativo', String(ativo));
    if (busca.trim()) params = params.set('busca', busca.trim());
    return this.http.get<UsuarioAdmin[]>(`${this.base}/usuarios`, { params });
  }

  buscarUsuario(id: string): Observable<UsuarioAdmin> {
    return this.http.get<UsuarioAdmin>(`${this.base}/usuarios/${id}`);
  }

  criarUsuario(body: unknown): Observable<UsuarioAdmin> {
    return this.http.post<UsuarioAdmin>(`${this.base}/usuarios`, body);
  }

  atualizarUsuario(id: string, body: unknown): Observable<UsuarioAdmin> {
    return this.http.put<UsuarioAdmin>(`${this.base}/usuarios/${id}`, body);
  }

  substituirVinculos(id: string, vinculos: VinculoForm[]): Observable<VinculoParoquia[]> {
    return this.http.put<VinculoParoquia[]>(`${this.base}/usuarios/${id}/paroquias`, { vinculos });
  }

  listarLogs(): Observable<BackofficeLog[]> {
    return this.http.get<BackofficeLog[]>(`${this.base}/logs`);
  }
}
