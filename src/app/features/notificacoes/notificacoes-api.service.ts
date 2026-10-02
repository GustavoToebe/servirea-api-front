import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

export type OrigemNotificacao = 'ESCALA' | 'MURAL';
export type CanalNotificacao = 'EMAIL' | 'WHATSAPP';
export interface ConfigNotificacao { origem: OrigemNotificacao; canal: CanalNotificacao; ativo: boolean; versao: number; }
export interface EntregaNotificacao {
  id: string; origem: OrigemNotificacao; referenciaId: string; titulo: string | null; referenciaVersao: number;
  canal: CanalNotificacao; gatilho: 'MANUAL' | 'AUTOMATICO'; total: number; ignorados: number;
  pendentes: number; enviados: number; falhas: number; criadoEm: string;
}
export interface PaginaEntregas { itens: EntregaNotificacao[]; total: number; pagina: number; tamanho: number; }
export interface ResultadoNotificacao { entregaId: string; total: number; ignorados: number; }

/** Centro de entregas e gatilhos (F05/F13). Tudo entra na fila de comunicados existente. */
@Injectable({ providedIn: 'root' })
export class NotificacoesApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  configuracoes() { return this.http.get<ConfigNotificacao[]>(`${this.base}/notificacoes/configuracoes`); }

  configurar(origem: OrigemNotificacao, canal: CanalNotificacao, ativo: boolean, versao: number) {
    return this.http.put<ConfigNotificacao>(`${this.base}/notificacoes/configuracoes/${origem}/${canal}`, { ativo, versao });
  }

  entregas(origem: OrigemNotificacao | '', pagina: number) {
    return this.http.get<PaginaEntregas>(`${this.base}/notificacoes/entregas`, { params: { pagina, ...(origem ? { origem } : {}) } });
  }

  notificarEscala(escalaId: string, canal: CanalNotificacao) {
    return this.http.post<ResultadoNotificacao>(`${this.base}/escalas/${escalaId}/notificacoes`, { canal });
  }

  notificarAviso(avisoId: string, canal: CanalNotificacao, versao: number) {
    return this.http.post<ResultadoNotificacao>(`${this.base}/mural/avisos/${avisoId}/notificacoes`, { canal, versao });
  }
}
