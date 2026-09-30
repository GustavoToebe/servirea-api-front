import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { mensagemApi } from '../../core/api/api-error';
import { AuthService } from '../../core/auth/auth.service';
import { Layout, PreVisualizacaoResponse, PreVisualizarRequest, TagLayout, TipoEnvio, TipoLayout } from './comunicacao.models';

@Injectable({ providedIn: 'root' })
export class LayoutsApiService {
  private readonly base = `${environment.apiUrl}/layouts`;
  /** Layouts ativos por canal (usados no comunicado), guardados na sessão; limpa quando um layout é salvo ou excluído. */
  private readonly ativos = new Map<string, Promise<Layout[]>>();
  private readonly auth = inject(AuthService);

  constructor(private http: HttpClient) {}

  async listar(tipoLayout?: TipoLayout | '', tipoEnvio?: TipoEnvio | '', ativo?: boolean | null, nome?: string): Promise<Layout[]> {
    let params = new HttpParams();
    if (tipoLayout) params = params.set('tipoLayout', tipoLayout);
    if (tipoEnvio) params = params.set('tipoEnvio', tipoEnvio);
    if (ativo !== undefined && ativo !== null) params = params.set('ativo', ativo);
    if (nome?.trim()) params = params.set('nome', nome.trim());
    try {
      return await firstValueFrom(this.http.get<Layout[]>(this.base, { params }));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível listar os layouts.'));
    }
  }

  /** Layouts ativos do canal, do cache da sessão; `forcar` busca de novo (ex.: layout criado em outra aba). */
  ativosPorCanal(canal: TipoEnvio, forcar = false): Promise<Layout[]> {
    // Chave com a paróquia: trocar de paróquia sem recarregar não reaproveita os layouts da anterior.
    const chave = `${this.auth.tenantId()}|${canal}`;
    let pedido = forcar ? undefined : this.ativos.get(chave);
    if (!pedido) {
      pedido = this.listar(undefined, canal, true);
      this.ativos.set(chave, pedido);
      // Erro não fica guardado: a próxima chamada tenta de novo.
      pedido.catch(() => this.ativos.delete(chave));
    }
    return pedido;
  }

  async buscar(id: string): Promise<Layout> {
    try {
      return await firstValueFrom(this.http.get<Layout>(`${this.base}/${id}`));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Layout não encontrado.'));
    }
  }

  async criar(request: Omit<Layout, 'id'>): Promise<Layout> {
    try {
      const layout = await firstValueFrom(this.http.post<Layout>(this.base, request));
      this.ativos.clear();
      return layout;
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível criar o layout.'));
    }
  }

  async atualizar(id: string, request: Omit<Layout, 'id'>): Promise<Layout> {
    try {
      const layout = await firstValueFrom(this.http.put<Layout>(`${this.base}/${id}`, request));
      this.ativos.clear();
      return layout;
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível atualizar o layout.'));
    }
  }

  async excluir(id: string): Promise<void> {
    try {
      await firstValueFrom(this.http.delete(`${this.base}/${id}`));
      this.ativos.clear();
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível excluir o layout.'));
    }
  }

  async tags(tipoLayout: TipoLayout): Promise<TagLayout[]> {
    try {
      let params = new HttpParams().set('tipoLayout', tipoLayout);
      return await firstValueFrom(this.http.get<TagLayout[]>(`${this.base}/tags`, { params }));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível carregar as tags.'));
    }
  }

  async preVisualizar(request: PreVisualizarRequest): Promise<PreVisualizacaoResponse> {
    try {
      return await firstValueFrom(this.http.post<PreVisualizacaoResponse>(`${this.base}/pre-visualizar`, request));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível gerar a pré-visualização.'));
    }
  }
}
