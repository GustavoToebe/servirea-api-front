import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface CheckinAberto { sessaoId: string; token: string; expiraEm: string; }
export interface PresenteCheckin { nome: string; funcao: string; registradoEm: string; }
export interface EstadoCheckin { ativa: boolean; expiraEm: string | null; escalados: number; presentes: number; registros: PresenteCheckin[]; }
export interface ResultadoCheckin { celebracao: string; data: string; horario: string; funcao: string; jaRegistrado: boolean; }

/** Check-in por encontro (F15): a coordenação abre um código de validade curta; a pessoa escalada registra a própria presença. */
@Injectable({ providedIn: 'root' })
export class CheckinApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  abrir(eventoId: string, minutos: number) {
    return this.http.post<CheckinAberto>(`${this.base}/escalas/eventos/${eventoId}/checkin`, { minutos });
  }

  encerrar(eventoId: string) { return this.http.delete<void>(`${this.base}/escalas/eventos/${eventoId}/checkin`); }

  estado(eventoId: string) { return this.http.get<EstadoCheckin>(`${this.base}/escalas/eventos/${eventoId}/checkin`); }

  registrar(token: string) { return this.http.post<ResultadoCheckin>(`${this.base}/portal/checkin`, { token }); }
}
