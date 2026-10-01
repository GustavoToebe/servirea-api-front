import { PaginaLista } from '../../../core/api/pagina-lista';
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { mensagemApi } from '../../../core/api/api-error';
import { CacheDeListas } from '../../../core/api/cache-de-listas.service';
import { AuthService } from '../../../core/auth/auth.service';
import { Pessoa, PessoaPapel, PessoaRequest, DuplicidadeRequest, Duplicidade } from '../models/pessoa.model';

@Injectable({ providedIn: 'root' })
export class PessoasService {
  private readonly base = `${environment.apiUrl}/pessoas`;

  constructor(private http: HttpClient, private cache: CacheDeListas, private auth: AuthService) {}

  emCache(): Pessoa[] | null {
    return this.cache.ler<Pessoa[]>('pessoas', this.auth.tenantId());
  }


  async pagina(filtro: { papel?: PessoaPapel; nome?: string; tipo?: string; ativo?: boolean }, pagina = 0): Promise<PaginaLista<Pessoa>> {
    let params=new HttpParams().set('pagina',pagina).set('tamanho',30);
    for (const [chave,valor] of Object.entries(filtro)) if (valor !== undefined && valor !== '') params=params.set(chave,String(valor));
    try { return await firstValueFrom(this.http.get<PaginaLista<Pessoa>>(`${this.base}/pagina`,{params})); }
    catch (erro) { throw new Error(mensagemApi(erro,'Não foi possível carregar a página de pessoas.')); }
  }
  async resumo(): Promise<{pessoas:number;ativos:number;inativos:number;pendentes:number}> {
    try { return await firstValueFrom(this.http.get<{pessoas:number;ativos:number;inativos:number;pendentes:number}>(`${this.base}/resumo`)); }
    catch (erro) { throw new Error(mensagemApi(erro,'Não foi possível carregar as contagens.')); }
  }

  async listar(papel?: PessoaPapel, nome?: string): Promise<Pessoa[]> {
    let params = new HttpParams();
    if (papel) params = params.set('papel', papel);
    if (nome?.trim()) params = params.set('nome', nome.trim());
    try {
      const pessoas = await firstValueFrom(this.http.get<Pessoa[]>(this.base, { params }));
      if (!papel && !nome?.trim()) this.cache.gravar('pessoas', this.auth.tenantId(), pessoas);
      return pessoas;
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível listar as pessoas.'));
    }
  }

  async buscar(id: string): Promise<Pessoa> {
    try {
      return await firstValueFrom(this.http.get<Pessoa>(`${this.base}/${id}`));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Pessoa não encontrada.'));
    }
  }

  /** Com foto, ficha e foto vão juntas: se a foto falhar, a API não grava a ficha. */
  async criar(request: PessoaRequest, foto?: File | null): Promise<Pessoa> {
    try {
      const criada = await firstValueFrom(this.http.post<Pessoa>(this.base, corpo(request, foto)));
      this.cache.invalidarPrefixo('pessoas');
      this.cache.invalidarPrefixo('voluntarios');
      return criada;
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível criar o cadastro.'));
    }
  }

  async atualizar(id: string, request: PessoaRequest, foto?: File | null): Promise<Pessoa> {
    try {
      const atualizada = await firstValueFrom(this.http.put<Pessoa>(`${this.base}/${id}`, corpo(request, foto)));
      this.cache.invalidarPrefixo('pessoas');
      this.cache.invalidarPrefixo('voluntarios');
      return atualizada;
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível atualizar o cadastro.'));
    }
  }

  async duplicidades(request: DuplicidadeRequest): Promise<Duplicidade[]> {
    try {
      return await firstValueFrom(this.http.post<Duplicidade[]>(`${this.base}/duplicidades`, request));
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível verificar cadastros parecidos.'));
    }
  }
}

/**
 * Sem foto, JSON puro. Com foto, multipart com a ficha na parte `dados`
 * (26/09/2026: antes eram duas chamadas e a ficha ficava gravada quando a
 * foto falhava; cada novo "Salvar" criava outra pessoa).
 */
export function corpo(request: PessoaRequest, foto?: File | null): PessoaRequest | FormData {
  if (!foto) return request;
  const form = new FormData();
  form.append('dados', new Blob([JSON.stringify(request)], { type: 'application/json' }));
  form.append('foto', foto);
  return form;
}
