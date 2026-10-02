import { Injectable,inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
export interface BlocoSite{tipo:'AVISO'|'EVENTO';titulo:string;texto:string;quando:string|null;local:string|null;}
export interface DadosSite{titulo:string;apresentacao:string;endereco:string|null;horarios:string|null;contato:string|null;blocos:BlocoSite[];}
export interface EstadoSite{versao:number;slug:string;rascunho:DadosSite;publicado:DadosSite|null;publicadoEm:string|null;}
@Injectable({providedIn:'root'})
export class SiteApiService{
 private readonly http=inject(HttpClient);private readonly base=environment.apiUrl+'/site-paroquia';
 consultar(){return this.http.get<EstadoSite>(this.base);}
 salvar(versao:number,dados:DadosSite){return this.http.put<EstadoSite>(this.base,{versao,dados});}
 publicar(versao:number){return this.http.post<EstadoSite>(this.base+'/publicar',{versao,confirmar:true});}
 despublicar(versao:number){return this.http.post<EstadoSite>(this.base+'/despublicar',{versao});}
 publico(slug:string){return this.http.get<DadosSite>(environment.apiUrl+'/public/paroquias/'+encodeURIComponent(slug));}
}
