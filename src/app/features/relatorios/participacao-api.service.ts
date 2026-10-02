import { Injectable,inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
export interface FiltrosParticipacao {de:string;ate:string;busca:string;presenca:string;resposta:string;funcao:string;}
export interface LinhaParticipacao {vagaId:string;escala:string;celebracao:string;data:string;horario:string;pessoa:string;funcao:string;presenca:string;resposta:string;}
export interface PaginaParticipacao {itens:LinhaParticipacao[];total:number;pagina:number;tamanho:number;}
@Injectable({providedIn:'root'})
export class ParticipacaoApiService {
 private readonly http=inject(HttpClient);private readonly base=`${environment.apiUrl}/relatorios/participacao`;
 private params(f:FiltrosParticipacao){return Object.fromEntries(Object.entries(f).filter(([_,v])=>v!==''));}
 listar(f:FiltrosParticipacao,pagina:number){return this.http.get<PaginaParticipacao>(this.base,{params:{...this.params(f),pagina,tamanho:30}});}
 exportar(f:FiltrosParticipacao){return this.http.get(`${this.base}/csv`,{params:this.params(f),responseType:'blob'});}
}
