import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
export interface Contagens {
    alocacoes: number;
    presentes: number;
    faltas: number;
    presencasPendentes: number;
    confirmacoes: number;
    recusas: number;
}
export interface Indicadores {
    itens: {
        pessoaId: string;
        nome: string;
        contagens: Contagens;
    }[];
    total: number;
    pagina: number;
    tamanho: number;
    resumo: Contagens;
}
@Injectable({ providedIn: 'root' })
export class IndicadoresApiService {
    private readonly http = inject(HttpClient);
    consultar(de: string, ate: string, busca: string, pagina: number) { return this.http.get<Indicadores>(environment.apiUrl + '/indicadores/participacao', { params: { de, ate, busca, pagina } }); }
}
