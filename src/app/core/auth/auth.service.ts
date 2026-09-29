import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { mensagemApi } from '../api/api-error';
import { CacheDeListas } from '../api/cache-de-listas.service';
import { AccessTokenResponse, LoginResponse, TenantResumo } from './auth.models';
import { cabecalhoXsrf } from './xsrf';

const TOKEN_KEY = 'sv_access';
const TENANT_KEY = 'sv_tenant';
const TENANT_NOME_KEY = 'sv_tenant_nome';
const EMAIL_KEY = 'sv_email';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient, private cache: CacheDeListas) {
    // Quem já está logado nesta aba passa a paróquia para a próxima aba.
    const id = sessionStorage.getItem(TENANT_KEY);
    if (id && sessionStorage.getItem(TOKEN_KEY)) {
      localStorage.setItem(TENANT_KEY, id);
      const nome = sessionStorage.getItem(TENANT_NOME_KEY);
      if (nome) localStorage.setItem(TENANT_NOME_KEY, nome);
    }
  }

  token(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  tenantId(): string | null {
    return sessionStorage.getItem(TENANT_KEY);
  }

  tenantNome(): string {
    return sessionStorage.getItem(TENANT_NOME_KEY) || '';
  }

  /** Depois de renomear a paróquia, o menu lateral mostra o nome novo. */
  atualizarTenantNome(nome: string): void {
    sessionStorage.setItem(TENANT_NOME_KEY, nome);
  }

  email(): string {
    return sessionStorage.getItem(EMAIL_KEY) || '';
  }

  isLoggedIn(): boolean {
    return !!this.token() && !!this.tenantId();
  }

  /**
   * A aba nova não herda o sessionStorage. O cookie de refresh é do domínio
   * inteiro; a paróquia fica no localStorage para o refresh saber qual é.
   */
  async restaurarSessao(): Promise<boolean> {
    if (this.isLoggedIn()) return true;
    const tenantId = localStorage.getItem(TENANT_KEY);
    if (!tenantId) return false;
    try {
      const resposta = await firstValueFrom(this.http.post<AccessTokenResponse>(
        `${environment.apiUrl}/auth/refresh`,
        { tenantId },
        { withCredentials: true, headers: cabecalhoXsrf() }
      ));
      this.guardarSessao(resposta.accessToken, resposta.tenantAtual);
      return true;
    } catch {
      return false;
    }
  }

  async login(email: string, senha: string): Promise<LoginResponse> {
    try {
      const resposta = await firstValueFrom(this.http.post<LoginResponse>(
        `${environment.apiUrl}/auth/login`,
        { email, senha },
        { withCredentials: true }
      ));
      sessionStorage.setItem(EMAIL_KEY, email.trim());
      if (!resposta.precisaSelecionarTenant && resposta.accessToken && resposta.tenantAtual) {
        this.guardarSessao(resposta.accessToken, resposta.tenantAtual);
      }
      return resposta;
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível entrar. Confira e-mail e senha.'));
    }
  }

  async selecionarTenant(tokenSelecaoTenant: string, tenantId: string): Promise<void> {
    try {
      const resposta = await firstValueFrom(this.http.post<AccessTokenResponse>(
        `${environment.apiUrl}/auth/select-tenant`,
        { tokenSelecaoTenant, tenantId },
        { withCredentials: true }
      ));
      this.guardarSessao(resposta.accessToken, resposta.tenantAtual);
    } catch (erro) {
      throw new Error(mensagemApi(erro, 'Não foi possível escolher a paróquia.'));
    }
  }

  signOut(): Promise<void> {
    return this.logout();
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${environment.apiUrl}/auth/logout`, {}, { withCredentials: true }));
    } catch {
      // sai local mesmo se o cookie já tiver caído
    } finally {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(TENANT_KEY);
      sessionStorage.removeItem(TENANT_NOME_KEY);
      sessionStorage.removeItem(EMAIL_KEY);
      localStorage.removeItem(TENANT_KEY);
      localStorage.removeItem(TENANT_NOME_KEY);
      this.cache.limpar();
    }
  }

  /** Sessão já emitida pela API, como a troca do código de suporte. */
  entrar(accessToken: string, tenant: TenantResumo): void {
    this.guardarSessao(accessToken, tenant);
  }

  private guardarSessao(accessToken: string, tenant: TenantResumo): void {
    this.cache.limpar();
    sessionStorage.setItem(TOKEN_KEY, accessToken);
    sessionStorage.setItem(TENANT_KEY, tenant.id);
    localStorage.setItem(TENANT_KEY, tenant.id);
    if (tenant.nome) {
      sessionStorage.setItem(TENANT_NOME_KEY, tenant.nome);
      localStorage.setItem(TENANT_NOME_KEY, tenant.nome);
    }
  }
}
