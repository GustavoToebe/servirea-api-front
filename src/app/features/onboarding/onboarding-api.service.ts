import { Injectable,inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
export type CodigoEtapa='PAROQUIA'|'CONVITE'|'PESSOAS'|'VOLUNTARIOS'|'ESCALA';
export type AcaoEtapa='CONCLUIR'|'REABRIR'|'PULAR';
export type SituacaoEtapa='PENDENTE'|'PRONTA'|'CONCLUIDA'|'DISPENSADA'|'REVISAR'|'SEM_PERMISSAO'|'NAO_CONTRATADA';
export interface EtapaOnboarding {codigo:CodigoEtapa;titulo:string;orientacao:string;url:string|null;permissao:string;situacao:SituacaoEtapa;podeConcluir:boolean;podeReabrir:boolean;podePular:boolean;}
export interface Onboarding {versao:number;etapas:EtapaOnboarding[];concluidas:number;total:number;percentual:number;proximaEtapa:CodigoEtapa|null;iniciadoEm:string|null;atualizadoEm:string|null;}
@Injectable({providedIn:'root'})
export class OnboardingApiService {
 private readonly http=inject(HttpClient);private readonly base=`${environment.apiUrl}/onboarding`;
 consultar(){return this.http.get<Onboarding>(this.base);}
 alterar(codigo:CodigoEtapa,acao:AcaoEtapa,versao:number){return this.http.put<Onboarding>(`${this.base}/etapas/${codigo}`,{acao,versao});}
}
