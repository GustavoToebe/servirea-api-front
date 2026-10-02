import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth/auth.service';
import { MeuPerfil, Perfil, SecaoCatalogo, UsuarioParoquia } from './acesso.models';

@Injectable({ providedIn: 'root' })
export class AcessoApiService {
  private readonly api = environment.apiUrl;
  private readonly auth = inject(AuthService);
  /**
   * Perfis da paróquia guardados na sessão (telas de usuários e de perfis), por paróquia: trocar de paróquia sem
   * recarregar não mostra os da anterior. Limpa quando um perfil é salvo ou duplicado.
   */
  private perfisCache: { tenant: string | null; perfis: Observable<Perfil[]> } | null = null;

  constructor(private http: HttpClient) {}

  catalogo() {
    return this.http.get<SecaoCatalogo[]>(`${this.api}/permissoes/catalogo`);
  }

  perfis(): Observable<Perfil[]> {
    // shareReplay refaz a busca se a anterior falhou (o erro não fica guardado).
    const tenant = this.auth.tenantId();
    if (!this.perfisCache || this.perfisCache.tenant !== tenant) {
      this.perfisCache = { tenant, perfis: this.http.get<Perfil[]>(`${this.api}/perfis`).pipe(shareReplay({ bufferSize: 1, refCount: false })) };
    }
    return this.perfisCache.perfis;
  }

  private limparPerfis = () => { this.perfisCache = null; };

  salvarPerfil(perfil: Partial<Perfil> & { nome: string; ativo: boolean; acessoTotal: boolean; permissoes: string[] }, id?: string) {
    const corpo = {
      nome: perfil.nome,
      ativo: perfil.ativo,
      acessoTotal: perfil.acessoTotal,
      permissoes: perfil.permissoes
    };
    return (id
      ? this.http.put<Perfil>(`${this.api}/perfis/${id}`, corpo)
      : this.http.post<Perfil>(`${this.api}/perfis`, corpo)).pipe(tap(this.limparPerfis));
  }

  duplicarPerfil(id: string) {
    return this.http.post<Perfil>(`${this.api}/perfis/${id}/duplicar`, {}).pipe(tap(this.limparPerfis));
  }

  usuarios() {
    return this.http.get<UsuarioParoquia[]>(`${this.api}/usuarios`);
  }

  salvarUsuario(corpo: {
    nome: string;
    email: string;
    tipoTelefone: string | null;
    telefone: string | null;
    perfilId: string;
    ativo: boolean;
  }, id?: string) {
    return id
      ? this.http.put<UsuarioParoquia>(`${this.api}/usuarios/${id}`, corpo)
      : this.http.post<UsuarioParoquia>(`${this.api}/usuarios`, corpo);
  }

  reenviarConvite(id: string) {
    return this.http.post<void>(`${this.api}/usuarios/${id}/convite`, {});
  }

  eu() {
    return this.http.get<MeuPerfil>(`${this.api}/me`);
  }

  salvarEu(corpo: { nome: string; tipoTelefone: string | null; telefone: string | null; senha: string | null; senhaAtual?: string | null; codigoMfa?: string | null }) {
    return this.http.put<MeuPerfil>(`${this.api}/me`, corpo);
  }
}
