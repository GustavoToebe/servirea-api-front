import { Injectable,inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { Pagina } from './voluntario-api.service';
export type SituacaoCandidatura='PENDENTE'|'APROVADA'|'RECUSADA'|'DESISTIDA'|'EXPIRADA';
export interface VagaAberta{vagaId:string;celebracao:string;inicio:string;funcao:string;versao:number;elegivel:boolean;impedimento:string|null;}
export interface Candidatura{id:string;vagaId:string;celebracao:string;inicio:string;funcao:string;situacao:SituacaoCandidatura;versao:number;criadaEm:string;atualizadaEm:string;pessoaNome:string|null;vigente:boolean;}
@Injectable({providedIn:'root'})
export class CandidaturasApiService{
 private readonly http=inject(HttpClient);private readonly base=environment.apiUrl;
 vagas(de:string,ate:string,pagina:number){return this.http.get<Pagina<VagaAberta>>(`${this.base}/portal/vagas-abertas`,{params:{de,ate,pagina}});}
 minhas(pagina:number){return this.http.get<Pagina<Candidatura>>(`${this.base}/portal/candidaturas`,{params:{pagina}});}
 candidatar(vagaId:string,versao:number){return this.http.post<Candidatura>(`${this.base}/portal/vagas/${vagaId}/candidaturas`,{versao});}
 desistir(id:string,versao:number){return this.http.put<Candidatura>(`${this.base}/portal/candidaturas/${id}/desistencia`,{versao});}
 coordenacao(escalaId:string,pagina:number){return this.http.get<Pagina<Candidatura>>(`${this.base}/escalas/${escalaId}/candidaturas`,{params:{pagina}});}
 decidir(id:string,aprovar:boolean,versao:number){return this.http.put<Candidatura>(`${this.base}/escalas/candidaturas/${id}/decisao`,{aprovar,versao});}
}
