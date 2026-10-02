import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CacheDeListas } from '../../../core/api/cache-de-listas.service';
export interface PreviaImportacao {hash:string;quantidade:number;podeConfirmar:boolean;linhas:{linha:number;nome:string;erro:string|null;papel?:string|null;cpf?:string|null;email?:string|null;telefone?:string|null}[];}
export interface ResultadoImportacao {id:string;quantidade:number;repetida:boolean;}
export interface OpcoesImportacao {aba:number;nome:number;papel:number;cpf:number;email:number;telefone:number;}
export interface EstruturaImportacao {abas:{indice:number;nome:string}[];aba:number;linhaCabecalho:number;colunas:{indice:number;titulo:string}[];sugestao:Record<string,number>;}
@Injectable({providedIn:'root'})
export class ImportacoesPessoasService {
  private http=inject(HttpClient); private cache=inject(CacheDeListas);
  private base=`${environment.apiUrl}/pessoas/importacoes`;
  estrutura(arquivo:File,aba=0) {const body=new FormData();body.append('arquivo',arquivo);return this.http.post<EstruturaImportacao>(`${this.base}/estrutura`,body,{params:{aba}});}
  previa(arquivo:File,opcoes?:OpcoesImportacao) {const body=new FormData();body.append('arquivo',arquivo);return this.http.post<PreviaImportacao>(`${this.base}/previa`,body,{params:opcoes ? {...opcoes} : {}});}
  confirmar(arquivo:File,chave:string,hash:string,opcoes?:OpcoesImportacao) {
    const body=new FormData();body.append('arquivo',arquivo);
    return this.http.post<ResultadoImportacao>(`${this.base}/confirmar`,body,{params:{chave,hash,...opcoes}}).pipe(tap(() => {
      this.cache.invalidarPrefixo('pessoas');this.cache.invalidarPrefixo('voluntarios');
    }));
  }
}
