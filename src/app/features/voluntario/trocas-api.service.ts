import { Injectable,inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Pagina } from './voluntario-api.service';
export type SituacaoTroca='AGUARDANDO_ACEITE'|'ACEITA'|'APROVADA'|'RECUSADA'|'CANCELADA'|'EXPIRADA';
export interface Troca{id:string;vagaId:string;celebracao:string;inicio:string;funcao:string;situacao:SituacaoTroca;versao:number;criadaEm:string;atualizadaEm:string;solicitanteNome:string|null;substitutoNome:string|null;solicitante:boolean;substituto:boolean;vigente:boolean;}
@Injectable({providedIn:'root'}) export class TrocasApiService {
 private readonly http=inject(HttpClient);private readonly base=environment.apiUrl;
 substitutos(busca:string){return this.http.get<{id:string;nome:string}[]>(`${this.base}/portal/trocas/substitutos`,{params:{busca}});}
 minhas(pagina:number){return this.http.get<Pagina<Troca>>(`${this.base}/portal/trocas`,{params:{pagina}});}
 solicitar(vagaId:string,substitutoId:string,versao:number){return this.http.post<Troca>(`${this.base}/portal/vagas/${vagaId}/trocas`,{substitutoId,versao});}
 responder(id:string,aprovar:boolean,versao:number){return this.http.put<Troca>(`${this.base}/portal/trocas/${id}/aceite`,{aprovar,versao});}
 cancelar(id:string,versao:number){return this.http.put<Troca>(`${this.base}/portal/trocas/${id}/cancelamento`,{versao});}
 coordenacao(escalaId:string,pagina:number){return this.http.get<Pagina<Troca>>(`${this.base}/escalas/${escalaId}/trocas`,{params:{pagina}});}
 decidir(id:string,aprovar:boolean,versao:number){return this.http.put<Troca>(`${this.base}/escalas/trocas/${id}/decisao`,{aprovar,versao});}
}
