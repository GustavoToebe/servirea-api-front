import { Injectable,inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
export interface Compromisso {id:string;tipo:string;titulo:string;inicio:string;termino:string;local:string|null;funcao:string|null;}
export interface Portal {vinculado:boolean;compromissos:Compromisso[];}
@Injectable({providedIn:'root'}) export class VoluntarioApiService {
 private readonly http=inject(HttpClient);private readonly base=environment.apiUrl;
 consultar(de:string,ate:string){return this.http.get<Portal>(`${this.base}/portal/compromissos`,{params:{de,ate}});}
 criarCalendario(){return this.http.post<{token:string;expiraEm:string}>(`${this.base}/calendario/assinatura`,{});}
 revogarCalendario(){return this.http.delete<void>(`${this.base}/calendario/assinatura`);}
}
