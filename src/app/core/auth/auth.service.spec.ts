import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { LoginResponse } from './auth.models';

const tenant = { id: 'paroquia-1', nome: 'São José', slug: 'sao-jose' };

function loginOk(parcial: Partial<LoginResponse> = {}): LoginResponse {
  return {
    precisaSelecionarTenant: false,
    accessToken: 'jwt-abc',
    expiresInSeconds: 900,
    tenantAtual: tenant,
    tokenSelecaoTenant: null,
    tenantsDisponiveis: null,
    ...parcial
  };
}

describe('AuthService', () => {
  let service: AuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(AuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    sessionStorage.clear();
  });

  it('só considera logado com token e tenant', () => {
    expect(service.isLoggedIn()).toBeFalse();
    sessionStorage.setItem('sv_access', 'jwt');
    expect(service.isLoggedIn()).toBeFalse();
    sessionStorage.setItem('sv_tenant', tenant.id);
    expect(service.isLoggedIn()).toBeTrue();
  });

  it('guarda a sessão quando o login já traz a paróquia', async () => {
    const promise = service.login('  mae@paroquia.com  ', 'senha123');
    const req = http.expectOne(`${environment.apiUrl}/auth/login`);
    expect(req.request.withCredentials).toBeTrue();
    expect(req.request.body).toEqual({ email: '  mae@paroquia.com  ', senha: 'senha123' });
    req.flush(loginOk());

    await promise;
    expect(service.token()).toBe('jwt-abc');
    expect(service.tenantId()).toBe('paroquia-1');
    expect(service.email()).toBe('mae@paroquia.com');
    expect(service.isLoggedIn()).toBeTrue();
  });

  it('não grava token quando ainda falta escolher a paróquia', async () => {
    const promise = service.login('mae@paroquia.com', 'senha123');
    http.expectOne(`${environment.apiUrl}/auth/login`).flush(loginOk({
      precisaSelecionarTenant: true,
      accessToken: null,
      tenantAtual: null,
      tokenSelecaoTenant: 'sel-1',
      tenantsDisponiveis: [tenant]
    }));

    const resposta = await promise;
    expect(resposta.precisaSelecionarTenant).toBeTrue();
    expect(service.token()).toBeNull();
    expect(service.email()).toBe('mae@paroquia.com');
  });

  it('selecionarTenant guarda o JWT da paróquia escolhida', async () => {
    const promise = service.selecionarTenant('sel-1', tenant.id);
    const req = http.expectOne(`${environment.apiUrl}/auth/select-tenant`);
    expect(req.request.body).toEqual({ tokenSelecaoTenant: 'sel-1', tenantId: tenant.id });
    req.flush({ accessToken: 'jwt-tenant', expiresInSeconds: 900, tenantAtual: tenant });

    await promise;
    expect(service.token()).toBe('jwt-tenant');
    expect(service.tenantId()).toBe(tenant.id);
  });

  it('logout limpa a sessão mesmo se a API falhar', async () => {
    sessionStorage.setItem('sv_access', 'jwt');
    sessionStorage.setItem('sv_tenant', tenant.id);
    sessionStorage.setItem('sv_email', 'mae@paroquia.com');

    const promise = service.logout();
    http.expectOne(`${environment.apiUrl}/auth/logout`).flush(
      { message: 'cookie já caiu' },
      { status: 401, statusText: 'Unauthorized' }
    );
    await promise;

    expect(service.token()).toBeNull();
    expect(service.tenantId()).toBeNull();
    expect(service.email()).toBe('');
  });

  it('traduz erro de login da API', async () => {
    const promise = service.login('mae@paroquia.com', 'errada');
    http.expectOne(`${environment.apiUrl}/auth/login`).flush(
      { message: 'Senha inválida.' },
      { status: 401, statusText: 'Unauthorized' }
    );
    await expectAsync(promise).toBeRejectedWithError('Senha inválida.');
  });
});
