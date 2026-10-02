import { Injectable,inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
export interface Equipe {id:string;nome:string;descricao:string|null;ativo:boolean;versao:number;}
export interface Membro {id:string;pessoaId:string;nome:string;papel:'MEMBRO'|'COORDENADOR';ativo:boolean;versao:number;}
export interface PessoaOpcao {id:string;nome:string;}
export interface Pagina<T>{itens:T[];total:number;pagina:number;tamanho:number;}
@Injectable({providedIn:'root'}) export class PastoraisApiService {
 private readonly http=inject(HttpClient);private readonly base=environment.apiUrl;
 equipes(busca:string,pagina:number){return this.http.get<Pagina<Equipe>>(`${this.base}/pastorais/equipes`,{params:{busca,pagina}});}
 salvar(e:{nome:string;descricao:string|null;ativo:boolean;versao:number|null},id:string|null){return id?this.http.put<Equipe>(`${this.base}/pastorais/equipes/${id}`,e):this.http.post<Equipe>(`${this.base}/pastorais/equipes`,e);}
 membros(id:string,pagina:number){return this.http.get<Pagina<Membro>>(`${this.base}/pastorais/equipes/${id}/membros`,{params:{pagina}});}
 membro(id:string,dados:{pessoaId:string;papel:string;ativo:boolean;versao:number|null}){return this.http.post<void>(`${this.base}/pastorais/equipes/${id}/membros`,dados);}
 minhasEquipes(pagina:number){return this.http.get<Equipe[]>(`${this.base}/pastorais/minhas-equipes`,{params:{pagina}});}
 membrosProprios(id:string,pagina:number){return this.http.get<Pagina<Membro>>(`${this.base}/pastorais/minhas-equipes/${id}/membros`,{params:{pagina}});}
 alterarProprio(id:string,m:Membro){return this.http.put<void>(`${this.base}/pastorais/minhas-equipes/${id}/membros/${m.pessoaId}`,{ativo:!m.ativo,versao:m.versao});}
 pessoas(busca:string){return this.http.get<PessoaOpcao[]>(`${this.base}/pastorais/pessoas`,{params:{busca}});}
 vinculo(id:string){return this.http.get<{pessoaId:string|null;pessoaNome:string|null}>(`${this.base}/usuarios/${id}/pessoa`);}
 vincular(id:string,pessoaId:string|null){return this.http.put(`${this.base}/usuarios/${id}/pessoa`,{pessoaId});}
}
