import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../environments/environment';

export type TipoConsentimento = 'WHATSAPP' | 'ANIVERSARIO_EMAIL' | 'ANIVERSARIO_WHATSAPP';
export interface ConsentimentoItem { tipo: TipoConsentimento; concedido: boolean; fonte: string; registradoEm: string; }
export interface PaginaConsentimentos { itens: ConsentimentoItem[]; total: number; pagina: number; tamanho: number; }
export interface ExecucaoRetencao { executadoEm: string; corte: string; comunicadosAnonimizados: number; }
export interface Retencao { comunicadosDias: number | null; versao: number; elegiveis: number; execucoes: ExecucaoRetencao[]; }
export interface ResultadoRetencao { corte: string; comunicadosAnonimizados: number; }

export const ROTULO_CONSENTIMENTO: Record<TipoConsentimento, string> = {
  WHATSAPP: 'Mensagens por WhatsApp',
  ANIVERSARIO_EMAIL: 'Felicitação de aniversário por e-mail',
  ANIVERSARIO_WHATSAPP: 'Felicitação de aniversário por WhatsApp'
};

/** Privacidade (F09): histórico de consentimentos, exportação autorizada e retenção de comunicados. */
@Injectable({ providedIn: 'root' })
export class PrivacidadeApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  consentimentos(pessoaId: string, pagina: number) {
    return this.http.get<PaginaConsentimentos>(`${this.base}/pessoas/${pessoaId}/consentimentos`, { params: { pagina } });
  }

  exportar(pessoaId: string) {
    return this.http.get(`${this.base}/pessoas/${pessoaId}/exportacao`, { responseType: 'blob' });
  }

  retencao() { return this.http.get<Retencao>(`${this.base}/privacidade/retencao`); }

  definirRetencao(comunicadosDias: number | null, versao: number) {
    return this.http.put<Retencao>(`${this.base}/privacidade/retencao`, { comunicadosDias, versao });
  }

  executarRetencao(versao: number) {
    return this.http.post<ResultadoRetencao>(`${this.base}/privacidade/retencao/execucao`, { versao });
  }
}
