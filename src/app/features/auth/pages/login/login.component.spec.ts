import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { LoginResponse } from '../../../../core/auth/auth.models';
import { LoginComponent } from './login.component';

const tenant = { id: 'p-1', nome: 'São José', slug: 'sao-jose' };

function loginOk(parcial: Partial<LoginResponse> = {}): LoginResponse {
  return {
    precisaSelecionarTenant: false,
    accessToken: 'jwt',
    expiresInSeconds: 900,
    tenantAtual: tenant,
    tokenSelecaoTenant: null,
    tenantsDisponiveis: null,
    ...parcial
  };
}

describe('LoginComponent', () => {
  let fixture: ComponentFixture<LoginComponent>;
  let component: LoginComponent;
  let auth: jasmine.SpyObj<AuthService>;
  let router: Router;

  beforeEach(async () => {
    auth = jasmine.createSpyObj('AuthService', ['login', 'selecionarTenant']);
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: auth }
      ]
    }).compileComponents();
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    fixture.detectChanges();
  });

  it('não envia o formulário inválido', async () => {
    await component.submit();
    expect(auth.login).not.toHaveBeenCalled();
  });

  it('vai ao dashboard quando o login já tem paróquia', async () => {
    component.form.setValue({ email: 'mae@paroquia.com', senha: 'senha12', codigoMfa: '' });
    auth.login.and.resolveTo(loginOk());
    await component.submit();
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
    expect(component.loading).toBeFalse();
  });

  it('mostra as paróquias quando o login pede escolha', async () => {
    component.form.setValue({ email: 'mae@paroquia.com', senha: 'senha12', codigoMfa: '' });
    auth.login.and.resolveTo(loginOk({
      precisaSelecionarTenant: true,
      accessToken: null,
      tenantAtual: null,
      tokenSelecaoTenant: 'sel-1',
      tenantsDisponiveis: [tenant]
    }));
    await component.submit();
    expect(component.tenants).toEqual([tenant]);
    expect(router.navigate).not.toHaveBeenCalled();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('São José');
  });

  it('mostra o erro da API', async () => {
    component.form.setValue({ email: 'mae@paroquia.com', senha: 'senha12', codigoMfa: '' });
    auth.login.and.rejectWith(new Error('Senha inválida.'));
    await component.submit();
    expect(component.error).toBe('Senha inválida.');
  });

  it('escolher a paróquia conclui o login', async () => {
    component.tokenSelecao = 'sel-1';
    auth.selecionarTenant.and.resolveTo();
    await component.escolher(tenant);
    expect(auth.selecionarTenant).toHaveBeenCalledWith('sel-1', 'p-1');
    expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
  });
});
