import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { BackofficeAuthService } from './backoffice-auth.service';
import { backofficeGuard } from './backoffice.guard';

describe('backofficeGuard', () => {
  let auth: jasmine.SpyObj<BackofficeAuthService>;

  beforeEach(() => {
    auth = jasmine.createSpyObj('BackofficeAuthService', ['isLoggedIn']);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: BackofficeAuthService, useValue: auth }
      ]
    });
  });

  it('libera o painel com sessão de operador', () => {
    auth.isLoggedIn.and.returnValue(true);
    expect(TestBed.runInInjectionContext(() => backofficeGuard({} as never, {} as never))).toBeTrue();
  });

  it('manda para /admin/login sem sessão', () => {
    auth.isLoggedIn.and.returnValue(false);
    const resultado = TestBed.runInInjectionContext(() => backofficeGuard({} as never, {} as never));
    expect(TestBed.inject(Router).serializeUrl(resultado as UrlTree)).toBe('/admin/login');
  });
});
