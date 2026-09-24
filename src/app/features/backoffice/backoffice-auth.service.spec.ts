import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { BackofficeAuthService } from './backoffice-auth.service';

describe('BackofficeAuthService', () => {
  let service: BackofficeAuthService;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(BackofficeAuthService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    sessionStorage.clear();
  });

  it('login grava token e e-mail', async () => {
    const promise = service.login('  op@servire.com  ', 'segredo');
    const req = http.expectOne(`${environment.apiUrl}/admin/auth/login`);
    expect(req.request.withCredentials).toBeTrue();
    req.flush({ accessToken: 'bo-jwt', expiresInSeconds: 900 });
    await promise;

    expect(service.isLoggedIn()).toBeTrue();
    expect(service.token()).toBe('bo-jwt');
    expect(service.email()).toBe('op@servire.com');
  });

  it('logout limpa a sessão local mesmo com erro na API', async () => {
    sessionStorage.setItem('bo_access', 'bo-jwt');
    sessionStorage.setItem('bo_email', 'op@servire.com');

    const promise = service.logout();
    http.expectOne(`${environment.apiUrl}/admin/auth/logout`).error(new ProgressEvent('error'));
    await promise;

    expect(service.isLoggedIn()).toBeFalse();
    expect(service.email()).toBe('');
  });
});
