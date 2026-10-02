import { Injectable,inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
export type RespostaParticipacao='PENDENTE'|'CONFIRMADA'|'RECUSADA';
export interface Pagina<T>{itens:T[];total:number;pagina:number;tamanho:number;}
export interface HistoricoResposta{id:string;resposta:RespostaParticipacao;respondidoEm:string;versao:number;}
export interface RespostaCoordenacao{vagaId:string;pessoaNome:string;celebracao:string;inicio:string;funcao:string;resposta:RespostaParticipacao;respondidoEm:string|null;}
export interface Compromisso {id:string;tipo:string;titulo:string;inicio:string;termino:string;local:string|null;funcao:string|null;vagaId:string|null;resposta:RespostaParticipacao|null;versao:number|null;respondidoEm:string|null;prazoResposta:string|null;}
export interface Portal {vinculado:boolean;compromissos:Compromisso[];}
@Injectable({providedIn:'root'}) export class VoluntarioApiService {
 private readonly http=inject(HttpClient);private readonly base=environment.apiUrl;
 dependentes(pagina:number){return this.http.get<{pessoaId:string;nome:string;podeResponder:boolean}[]>(`${this.base}/portal/dependentes`,{params:{pagina}});}
 consultarDependente(id:string,de:string,ate:string){return this.http.get<Portal>(`${this.base}/portal/dependentes/${id}/compromissos`,{params:{de,ate}});}
 responderDependente(id:string,vagaId:string,resposta:'CONFIRMADA'|'RECUSADA',versao:number){return this.http.put(`${this.base}/portal/dependentes/${id}/vagas/${vagaId}/resposta`,{resposta,versao});}
 consultar(de:string,ate:string){return this.http.get<Portal>(`${this.base}/portal/compromissos`,{params:{de,ate}});}
 responder(vagaId:string,resposta:'CONFIRMADA'|'RECUSADA',versao:number){return this.http.put(`${this.base}/portal/vagas/${vagaId}/resposta`,{resposta,versao});}
 historico(vagaId:string,pagina:number){return this.http.get<Pagina<HistoricoResposta>>(`${this.base}/portal/vagas/${vagaId}/respostas`,{params:{pagina}});}
 coordenacao(escalaId:string,pagina:number,resposta:RespostaParticipacao|''){return this.http.get<Pagina<RespostaCoordenacao>>(`${this.base}/escalas/${escalaId}/respostas`,{params:resposta?{pagina,resposta}:{pagina}});}
 criarCalendario(){return this.http.post<{token:string;expiraEm:string}>(`${this.base}/calendario/assinatura`,{});}
 revogarCalendario(){return this.http.delete<void>(`${this.base}/calendario/assinatura`);}
}
