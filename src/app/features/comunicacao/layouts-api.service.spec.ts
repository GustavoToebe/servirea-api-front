import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthService } from '../../core/auth/auth.service';
import { LayoutsApiService } from './layouts-api.service';

/** Cache da sessão dos layouts ativos por canal (PLANO-009, tópico 8). */
describe('LayoutsApiService (cache de ativos por canal)', () => {
  let api: LayoutsApiService;
  let http: HttpTestingController;
  let tenant: string;

  beforeEach(() => {
    tenant = 't1';
    const auth = jasmine.createSpyObj<AuthService>('AuthService', ['tenantId']);
    auth.tenantId.and.callFake(() => tenant);
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), { provide: AuthService, useValue: auth }]
    });
    api = TestBed.inject(LayoutsApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  function responderLista() {
    http.expectOne(r => r.url.endsWith('/layouts') && r.params.get('tipoEnvio') === 'EMAIL' && r.params.get('ativo') === 'true').flush([]);
  }

  it('a segunda chamada usa o cache; salvar um layout limpa', async () => {
    const primeira = api.ativosPorCanal('EMAIL');
    responderLista();
    await primeira;
    await api.ativosPorCanal('EMAIL');
    http.expectNone(r => r.url.endsWith('/layouts'));

    const criar = api.criar({ nome: 'Novo', tipoLayout: 'TODOS', tipoEnvio: 'EMAIL', conteudo: 'x', ativo: true });
    http.expectOne(r => r.method === 'POST').flush({ id: 'l2' });
    await criar;
    const depois = api.ativosPorCanal('EMAIL');
    responderLista();
    await depois;
  });

  it('forcar e trocar de paróquia buscam de novo', async () => {
    const primeira = api.ativosPorCanal('EMAIL');
    responderLista();
    await primeira;

    const forcada = api.ativosPorCanal('EMAIL', true);
    responderLista();
    await forcada;

    tenant = 't2';
    const outraParoquia = api.ativosPorCanal('EMAIL');
    responderLista();
    await outraParoquia;
  });
});
