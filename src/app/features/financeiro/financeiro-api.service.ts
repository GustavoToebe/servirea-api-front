import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { mensagemApi } from '../../core/api/api-error';
import { Categoria, CategoriaRequest, Conta, ContaRequest, Filtros, Movimento, MovimentoRequest, Pagina, Resumo } from './financeiro.models';

@Injectable({ providedIn: 'root' })
export class FinanceiroApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/financeiro`;
  contas() { return this.chamar(this.http.get<Conta[]>(`${this.base}/contas`)); }
  categorias() { return this.chamar(this.http.get<Categoria[]>(`${this.base}/categorias`)); }
  listar(filtro: Filtros) {
    let params = new HttpParams();
    for (const [chave, valor] of Object.entries(filtro)) if (valor !== '') params = params.set(chave, String(valor));
    return this.chamar(this.http.get<Pagina>(`${this.base}/movimentos`, { params }));
  }
  resumo(de: string, ate: string) { return this.chamar(this.http.get<Resumo>(`${this.base}/resumo`, { params: { de, ate } })); }
  salvarConta(id: string | null, dados: ContaRequest) { return this.salvar<Conta>('contas', id, dados); }
  salvarCategoria(id: string | null, dados: CategoriaRequest) { return this.salvar<Categoria>('categorias', id, dados); }
  salvarMovimento(id: string | null, dados: MovimentoRequest) { return this.salvar<Movimento>('movimentos', id, dados); }
  baixar(m: Movimento, dataPagamento: string) { return this.chamar(this.http.post<Movimento>(`${this.base}/movimentos/${m.id}/baixar`, { versao: m.versao, dataPagamento })); }
  acao(m: Movimento, acao: 'estornar' | 'cancelar') { return this.chamar(this.http.post<Movimento>(`${this.base}/movimentos/${m.id}/${acao}`, { versao: m.versao })); }
  private salvar<T>(recurso: string, id: string | null, dados: unknown) {
    return this.chamar(id ? this.http.put<T>(`${this.base}/${recurso}/${id}`, dados) : this.http.post<T>(`${this.base}/${recurso}`, dados));
  }
  private async chamar<T>(pedido: Observable<T>): Promise<T> {
    try { return await firstValueFrom(pedido); }
    catch (erro) { throw new Error(mensagemApi(erro, 'Não foi possível completar a operação financeira.')); }
  }
}
