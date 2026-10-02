import { Injectable,inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
export interface BloqueioPessoal {data:string;periodo:'MANHA'|'TARDE'|'NOITE'|null;}
export interface DisponibilidadePessoal {ano:number;mes:number;versao:number;semRestricao:boolean;itens:BloqueioPessoal[];}
@Injectable({providedIn:'root'})
export class DisponibilidadeApiService {
 private readonly http=inject(HttpClient);private readonly base=`${environment.apiUrl}/portal/indisponibilidades`;
 consultar(ano:number,mes:number){return this.http.get<DisponibilidadePessoal>(this.base,{params:{ano,mes}});}
 salvar(ano:number,mes:number,dados:Pick<DisponibilidadePessoal,'versao'|'semRestricao'|'itens'>){return this.http.put<DisponibilidadePessoal>(this.base,dados,{params:{ano,mes}});}
}
