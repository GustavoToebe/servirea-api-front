import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { authGuard } from './auth.guard';
import { AuthService } from './auth.service';

describe('authGuard', () => {
  let auth: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    auth = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'restaurarSessao']);
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth }
      ]
    });
  });

  it('libera a rota quando há sessão', async () => {
    auth.isLoggedIn.and.returnValue(true);
    const resultado = await TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(resultado).toBeTrue();
  });

  it('restaura a sessão quando a aba nova ainda tem o cookie', async () => {
    auth.isLoggedIn.and.returnValue(false);
    auth.restaurarSessao.and.resolveTo(true);
    const resultado = await TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(resultado).toBeTrue();
  });

  it('manda para /login quando não há sessão', async () => {
    auth.isLoggedIn.and.returnValue(false);
    auth.restaurarSessao.and.resolveTo(false);
    const resultado = await TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));
    expect(resultado instanceof UrlTree).toBeTrue();
    expect(TestBed.inject(Router).serializeUrl(resultado as UrlTree)).toBe('/login');
  });
});
