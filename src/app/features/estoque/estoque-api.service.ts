import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
export interface ItemEstoque {
    id: string;
    versao: number;
    nome: string;
    codigo: string;
    tipo: 'CONSUMIVEL' | 'PATRIMONIO';
    unidade: string;
    local: string | null;
    responsavelUsuarioId: string | null;
    ativo: boolean;
    saldo: number;
    responsavelNome?: string | null;
}
export interface MovimentoEstoque {
    id: string;
    itemId: string;
    chave: string;
    tipo: string;
    quantidade: number;
    saldoAntes: number;
    saldoDepois: number;
    motivo: string;
    responsavelUsuarioId: string | null;
    registradoPor: string | null;
    registradoEm: string;
    responsavelNome?: string | null;
    registradoPorNome?: string | null;
}
export interface PaginaEstoque<T> {
    itens: T[];
    total: number;
    pagina: number;
    tamanho: number;
}
export interface MovimentarEstoque {
    versao: number;
    chave: string;
    tipo: string;
    quantidade: number;
    motivo: string;
    responsavelUsuarioId: string | null;
}
@Injectable({ providedIn: 'root' })
export class EstoqueApiService {
    private readonly http = inject(HttpClient);
    private readonly base = environment.apiUrl + '/estoque';
    listar(busca: string, pagina: number) { return this.http.get<PaginaEstoque<ItemEstoque>>(this.base, { params: { busca, pagina } }); }
    buscar(id: string) { return this.http.get<ItemEstoque>(this.base + '/' + id); }
    salvar(item: ItemEstoque) { const { id, saldo, responsavelNome, ...dados } = item; return id ? this.http.put<ItemEstoque>(this.base + '/' + id, dados) : this.http.post<ItemEstoque>(this.base, dados); }
    responsaveis(busca: string) { return this.http.get<{
        id: string;
        nome: string;
    }[]>(this.base + '/responsaveis', { params: { busca } }); }
    historico(id: string, pagina: number) { return this.http.get<PaginaEstoque<MovimentoEstoque>>(this.base + '/' + id + '/movimentos', { params: { pagina } }); }
    movimentar(id: string, r: MovimentarEstoque) { return this.http.post<MovimentoEstoque>(this.base + '/' + id + '/movimentos', r); }
}
