import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { tap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CacheDeListas } from '../../../core/api/cache-de-listas.service';
export interface PreviaImportacao {hash:string;quantidade:number;podeConfirmar:boolean;linhas:{linha:number;nome:string;erro:string|null}[];}
export interface ResultadoImportacao {id:string;quantidade:number;repetida:boolean;}
@Injectable({providedIn:'root'})
export class ImportacoesPessoasService {
  private http=inject(HttpClient); private cache=inject(CacheDeListas);
  private base=`${environment.apiUrl}/pessoas/importacoes`;
  previa(arquivo:File) {const body=new FormData();body.append('arquivo',arquivo);return this.http.post<PreviaImportacao>(`${this.base}/previa`,body);}
  confirmar(arquivo:File,chave:string,hash:string) {
    const body=new FormData();body.append('arquivo',arquivo);
    return this.http.post<ResultadoImportacao>(`${this.base}/confirmar`,body,{params:{chave,hash}}).pipe(tap(() => {
      this.cache.invalidarPrefixo('pessoas');this.cache.invalidarPrefixo('voluntarios');
    }));
  }
}
