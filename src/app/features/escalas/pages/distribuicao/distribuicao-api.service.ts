import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../../../../environments/environment';

export interface RegrasDistribuicao { maximoPorPessoa: number; intervaloDias: number; exigirResposta: boolean; }
export interface SugestaoDistribuicao {
  vagaId: string; eventoId: string; data: string; horario: string; celebracao: string; funcao: string;
  pessoaId: string; nome: string; explicacao: string;
}
export interface DescarteDistribuicao { codigo: string; motivo: string; quantidade: number; }
export interface ConflitoDistribuicao {
  vagaId: string; eventoId: string; data: string; horario: string; celebracao: string; funcao: string;
  explicacao: string; descartes: DescarteDistribuicao[]; alocacaoExistente: boolean;
}
export interface PreviaDistribuicao {
  escalaId: string; versao: number; vagasVazias: number; sugestoes: SugestaoDistribuicao[];
  conflitos: ConflitoDistribuicao[]; bloqueado: boolean;
}
export interface EscolhaDistribuicao { vagaId: string; pessoaId: string; }

/** Distribuição por regras (F04): a prévia não grava; a aplicação revalida no servidor. */
@Injectable({ providedIn: 'root' })
export class DistribuicaoApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  previa(escalaId: string, regras: RegrasDistribuicao) {
    return this.http.post<PreviaDistribuicao>(`${this.base}/escalas/${escalaId}/distribuicao/previa`, { regras });
  }

  aplicar(escalaId: string, versao: number, regras: RegrasDistribuicao, escolhas: EscolhaDistribuicao[]) {
    return this.http.post<{ escalaId: string; versao: number; aplicadas: number }>(
      `${this.base}/escalas/${escalaId}/distribuicao/aplicacao`, { versao, regras, escolhas });
  }
}
