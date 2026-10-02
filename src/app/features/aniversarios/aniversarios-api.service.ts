import { Injectable,inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
export type CanalAniversario='EMAIL'|'WHATSAPP';
export interface ConfigAniversario{canal:CanalAniversario;ativo:boolean;layoutId:string|null;versao:number;agendadorAtivo:boolean;}
export interface AutorizacaoAniversario{pessoaId:string;canal:CanalAniversario;autorizado:boolean;fonte:string|null;registradoEm:string|null;versao:number;}
@Injectable({providedIn:'root'})
export class AniversariosApiService{
 private readonly http=inject(HttpClient);private readonly base=environment.apiUrl+'/aniversarios';
 configuracoes(){return this.http.get<ConfigAniversario[]>(this.base+'/configuracoes');}
 layouts(){return this.http.get<{id:string;nome:string;canal:CanalAniversario}[]>(this.base+'/layouts');}
 configurar(c:ConfigAniversario){return this.http.put<ConfigAniversario>(this.base+'/configuracoes/'+c.canal,{ativo:c.ativo,layoutId:c.layoutId||null,versao:c.versao});}
 pessoas(nome:string){return this.http.get<{id:string;nomeCompleto:string}[]>(environment.apiUrl+'/pessoas/opcoes',{params:{nome,limite:30}});}
 autorizacoes(id:string){return this.http.get<AutorizacaoAniversario[]>(this.base+'/pessoas/'+id);}
 autorizar(a:AutorizacaoAniversario){return this.http.put<AutorizacaoAniversario>(this.base+'/pessoas/'+a.pessoaId+'/'+a.canal,{autorizado:a.autorizado,fonte:a.fonte,versao:a.versao});}
}
