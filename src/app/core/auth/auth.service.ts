import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { mensagemApi } from '../api/api-error';
import { AccessTokenResponse, LoginResponse, TenantResumo } from './auth.models';

const TOKEN_KEY = 'sv_access';
const TENANT_KEY = 'sv_tenant';
const EMAIL_KEY = 'sv_email';

@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private http: HttpClient) {}

  token(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  tenantId(): string | null {
    return sessionStorage.getItem(TENANT_KEY);
  }

  email(): string {
    return sessionStorage.getItem(EMAIL_KEY) || '';
  }

  isLoggedIn(): boolean {
    return !!this.token() && !!this.tenantId();
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
      sessionStorage.removeItem(EMAIL_KEY);
    }
  }

  private guardarSessao(accessToken: string, tenant: TenantResumo): void {
    sessionStorage.setItem(TOKEN_KEY, accessToken);
    sessionStorage.setItem(TENANT_KEY, tenant.id);
  }
}
