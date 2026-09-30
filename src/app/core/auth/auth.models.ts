export interface TenantResumo {
  id: string;
  nome: string;
  slug: string;
}

export interface LoginResponse {
  precisaSelecionarTenant: boolean;
  accessToken: string | null;
  expiresInSeconds: number | null;
  tenantAtual: TenantResumo | null;
  tokenSelecaoTenant: string | null;
  tenantsDisponiveis: TenantResumo[] | null;
}

export interface AccessTokenResponse {
  accessToken: string;
  expiresInSeconds: number;
  tenantAtual: TenantResumo;
}
