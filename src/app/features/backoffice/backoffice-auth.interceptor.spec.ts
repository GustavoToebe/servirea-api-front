import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { backofficeAuthInterceptor, resetBackofficeAuthRefresh } from './backoffice-auth.interceptor';

describe('backofficeAuthInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let router: Router;
  const api = environment.apiUrl;

  beforeEach(() => {
    sessionStorage.clear();
    resetBackofficeAuthRefresh();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([backofficeAuthInterceptor])),
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
    resetBackofficeAuthRefresh();
  });

  it('ignora rotas que não são /admin', () => {
    http.get(`${api}/pessoas`).subscribe();
    const req = httpMock.expectOne(`${api}/pessoas`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush([]);
  });

  it('manda Bearer nas rotas do painel', () => {
    sessionStorage.setItem('bo_access', 'bo-jwt');
    http.get(`${api}/admin/paroquias`).subscribe();
    const req = httpMock.expectOne(`${api}/admin/paroquias`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer bo-jwt');
    req.flush([]);
  });

  it('não manda Bearer no login do operador', () => {
    sessionStorage.setItem('bo_access', 'bo-jwt');
    http.post(`${api}/admin/auth/login`, {}).subscribe();
    const req = httpMock.expectOne(`${api}/admin/auth/login`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('renova o token e refaz o pedido após 401', async () => {
    sessionStorage.setItem('bo_access', 'velho');
    const promise = firstValueFrom(http.get(`${api}/admin/paroquias`));
    httpMock.expectOne(`${api}/admin/paroquias`).flush({}, { status: 401, statusText: 'Unauthorized' });
    httpMock.expectOne(`${api}/admin/auth/refresh`).flush({ accessToken: 'novo-bo' });
    const retry = httpMock.expectOne(`${api}/admin/paroquias`);
    expect(retry.request.headers.get('Authorization')).toBe('Bearer novo-bo');
    retry.flush([]);
    await promise;
  });

  it('manda para /admin/login se o refresh falhar', async () => {
    sessionStorage.setItem('bo_access', 'velho');
    const promise = firstValueFrom(http.get(`${api}/admin/paroquias`));
    httpMock.expectOne(`${api}/admin/paroquias`).flush({}, { status: 401, statusText: 'Unauthorized' });
    httpMock.expectOne(`${api}/admin/auth/refresh`).flush({}, { status: 401, statusText: 'Unauthorized' });
    await expectAsync(promise).toBeRejected();
    expect(router.navigate).toHaveBeenCalledWith(['/admin/login']);
  });
});
