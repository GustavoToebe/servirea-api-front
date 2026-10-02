import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
export interface Referencia {
    id: string;
    versao: number;
    titulo: string;
    fonte: string;
    url: string | null;
    observacao: string | null;
    ativo: boolean;
}
export interface Passo {
    titulo: string;
    referenciaId: string | null;
    observacao: string | null;
}
export interface Roteiro {
    id: string;
    versao: number;
    titulo: string;
    celebracao: string;
    passos: Passo[];
    ativo: boolean;
}
export interface Pagina<T> {
    itens: T[];
    total: number;
    pagina: number;
    tamanho: number;
}
@Injectable({ providedIn: 'root' })
export class LiturgiaApiService {
    private readonly http = inject(HttpClient);
    private readonly base = environment.apiUrl + '/liturgia';
    referencias(busca: string, pagina = 0) { return this.http.get<Pagina<Referencia>>(this.base + '/referencias', { params: { busca, pagina } }); }
    roteiros(busca: string, pagina = 0) { return this.http.get<Pagina<Roteiro>>(this.base + '/roteiros', { params: { busca, pagina } }); }
    salvarReferencia(r: Referencia) { const { id, ...dados } = r; return id ? this.http.put<Referencia>(this.base + '/referencias/' + id, dados) : this.http.post<Referencia>(this.base + '/referencias', dados); }
    salvarRoteiro(r: Roteiro) { const { id, ...dados } = r; return id ? this.http.put<Roteiro>(this.base + '/roteiros/' + id, dados) : this.http.post<Roteiro>(this.base + '/roteiros', dados); }
}
