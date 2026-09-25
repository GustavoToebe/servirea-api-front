import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { parishAuthInterceptor, resetParishAuthRefresh } from './auth.interceptor';

describe('parishAuthInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let router: Router;
  const api = environment.apiUrl;

  beforeEach(() => {
    sessionStorage.clear();
    resetParishAuthRefresh();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([parishAuthInterceptor])),
        provideHttpClientTesting()
      ]
    });
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
    resetParishAuthRefresh();
  });

  it('não mexe em URL que não é da API', () => {
    http.get('/assets/logo.svg').subscribe();
    const req = httpMock.expectOne('/assets/logo.svg');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('coloca Bearer também em URL da API que não é da paróquia autenticada', () => {
    sessionStorage.setItem('sv_access', 'parish-jwt');
    http.get(`${api}/integracao/v1/instancias`).subscribe();
    const req = httpMock.expectOne(`${api}/integracao/v1/instancias`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer parish-jwt');
    req.flush([]);
  });

  it('manda Bearer e credentials nas rotas autenticadas da paróquia', () => {
    sessionStorage.setItem('sv_access', 'parish-jwt');
    http.get(`${api}/pessoas`).subscribe();
    const req = httpMock.expectOne(`${api}/pessoas`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer parish-jwt');
    expect(req.request.withCredentials).toBeTrue();
    req.flush([]);
  });

  it('não manda Bearer no login', () => {
    sessionStorage.setItem('sv_access', 'parish-jwt');
    http.post(`${api}/auth/login`, {}).subscribe();
    const req = httpMock.expectOne(`${api}/auth/login`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('renova o token uma vez só para vários 401 simultâneos', async () => {
    sessionStorage.setItem('sv_access', 'velho');
    sessionStorage.setItem('sv_tenant', 'paroquia-1');

    const a = firstValueFrom(http.get(`${api}/pessoas`));
    const b = firstValueFrom(http.get(`${api}/escalas`));

    const pessoas = httpMock.expectOne(`${api}/pessoas`);
    const escalas = httpMock.expectOne(`${api}/escalas`);
    pessoas.flush({ message: 'expirado' }, { status: 401, statusText: 'Unauthorized' });
    escalas.flush({ message: 'expirado' }, { status: 401, statusText: 'Unauthorized' });

    const refreshes = httpMock.match(`${api}/auth/refresh`);
    expect(refreshes.length).toBe(1);
    refreshes[0].flush({
      accessToken: 'novo-jwt',
      expiresInSeconds: 900,
      tenantAtual: { id: 'paroquia-1', nome: 'São José', slug: 'sao-jose' }
    });

    const retryPessoas = httpMock.expectOne(`${api}/pessoas`);
    expect(retryPessoas.request.headers.get('Authorization')).toBe('Bearer novo-jwt');
    retryPessoas.flush([]);
    const retryEscalas = httpMock.expectOne(`${api}/escalas`);
    expect(retryEscalas.request.headers.get('Authorization')).toBe('Bearer novo-jwt');
    retryEscalas.flush([]);

    await Promise.all([a, b]);
    expect(sessionStorage.getItem('sv_access')).toBe('novo-jwt');
  });

  it('encerra a sessão e vai para /login se o refresh falhar', async () => {
    sessionStorage.setItem('sv_access', 'velho');
    sessionStorage.setItem('sv_tenant', 'paroquia-1');
    sessionStorage.setItem('sv_email', 'mae@x.com');

    const promise = firstValueFrom(http.get(`${api}/pessoas`));
    httpMock.expectOne(`${api}/pessoas`).flush({}, { status: 401, statusText: 'Unauthorized' });
    httpMock.expectOne(`${api}/auth/refresh`).flush({}, { status: 401, statusText: 'Unauthorized' });

    await expectAsync(promise).toBeRejected();
    expect(sessionStorage.getItem('sv_access')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
