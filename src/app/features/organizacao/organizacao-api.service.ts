import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
export type ModuloOrganizacao = 'mural' | 'tarefas';
export interface RegistroOrganizacao { id: string; titulo: string; descricao: string; status: string; prazo: string | null; equipe?: string | null; responsavelUsuarioId?: string | null; responsavelNome?: string | null; versao: number; criadoEm: string; atualizadoEm: string; }
export interface PaginaOrganizacao { itens: RegistroOrganizacao[]; total: number; pagina: number; tamanho: number; }
export interface SalvarOrganizacao { titulo: string; descricao: string; status: string; prazo: string | null; equipe?: string | null; responsavelUsuarioId?: string | null; versao: number | null; }
@Injectable({providedIn:'root'})
export class OrganizacaoApiService {
 private readonly http=inject(HttpClient);
 private base(tipo: ModuloOrganizacao) {return `${environment.apiUrl}/${tipo==='mural'?'mural/avisos':'tarefas'}`;}
 listar(tipo: ModuloOrganizacao,busca: string,status: string,pagina: number,responsavelUsuarioId = '',minhas = false) {return this.http.get<PaginaOrganizacao>(this.base(tipo),{params:{busca,status,pagina,tamanho:30,...(tipo==='tarefas'?{...(responsavelUsuarioId?{responsavelUsuarioId}:{}),minhas}:{})}});}
 responsaveis(busca: string) {return this.http.get<{id:string;nome:string}[]>(`${environment.apiUrl}/tarefas/responsaveis`,{params:{busca}});}
 salvar(tipo: ModuloOrganizacao,id: string | null,dados: SalvarOrganizacao) {return id?this.http.put<RegistroOrganizacao>(`${this.base(tipo)}/${id}`,dados):this.http.post<RegistroOrganizacao>(this.base(tipo),dados);}
}
