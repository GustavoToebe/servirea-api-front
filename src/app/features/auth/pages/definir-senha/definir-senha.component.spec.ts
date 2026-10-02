import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { DefinirSenhaComponent } from './definir-senha.component';

function criar(token: string | null) {
  TestBed.configureTestingModule({
    imports: [DefinirSenhaComponent],
    providers: [
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([]),
      { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap(token ? { token } : {}) } } }
    ]
  });
  const fixture = TestBed.createComponent(DefinirSenhaComponent);
  fixture.detectChanges();
  return { componente: fixture.componentInstance, http: TestBed.inject(HttpTestingController) };
}

describe('DefinirSenhaComponent', () => {
  it('com token, envia a nova senha para /auth/reset-password', async () => {
    const { componente, http } = criar('tok-123');
    componente.senhaForm.setValue({ senha: 'senha-forte', confirmacao: 'senha-forte', codigoMfa: '' });

    const envio = componente.definir();
    const req = http.expectOne(`${environment.apiUrl}/auth/reset-password`);
    expect(req.request.body).toEqual({ token: 'tok-123', novaSenha: 'senha-forte' });
    req.flush(null, { status: 204, statusText: 'No Content' });
    await envio;

    expect(componente.concluido).toBeTrue();
    http.verify();
  });

  it('não envia se as senhas forem diferentes', () => {
    const { componente, http } = criar('tok-123');
    componente.senhaForm.setValue({ senha: 'senha-forte', confirmacao: 'outra-senha', codigoMfa: '' });

    expect(componente.senhaForm.invalid).toBeTrue();
    componente.definir();
    http.expectNone(`${environment.apiUrl}/auth/reset-password`);
  });

  it('sem token, pede o link em /auth/forgot-password', async () => {
    const { componente, http } = criar(null);
    componente.emailForm.setValue({ email: 'mae@exemplo.com' });

    const envio = componente.pedirLink();
    const req = http.expectOne(`${environment.apiUrl}/auth/forgot-password`);
    expect(req.request.body).toEqual({ email: 'mae@exemplo.com' });
    req.flush(null, { status: 202, statusText: 'Accepted' });
    await envio;

    expect(componente.enviado).toBeTrue();
  });
});
