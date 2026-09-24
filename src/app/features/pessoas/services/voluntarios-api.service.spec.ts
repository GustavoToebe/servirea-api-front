import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { VoluntariosApiService } from './voluntarios-api.service';

describe('VoluntariosApiService', () => {
  let service: VoluntariosApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(VoluntariosApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista e traduz camelCase para o modelo da tela', async () => {
    const promise = service.listar({ ativo: true, tipo: 'COROINHA', nome: ' Ana ' });
    const req = http.expectOne(r => r.url === `${environment.apiUrl}/voluntarios`);
    expect(req.request.params.get('ativo')).toBe('true');
    expect(req.request.params.get('tipo')).toBe('COROINHA');
    expect(req.request.params.get('nome')).toBe('Ana');
    req.flush([{
      id: 'v-1',
      nomeCompleto: 'Ana Souza',
      tipo: 'COROINHA',
      ativo: true,
      fotoPath: null,
      etapaCatequese: null,
      eucaristiaAno: null,
      crismaAno: null,
      horarioEstudo: 'TARDE',
      autorizaWhatsapp: true,
      funcoesHabilitadas: ['VELA']
    }]);

    const [row] = await promise;
    expect(row.nome_completo).toBe('Ana Souza');
    expect(row.nomeCompleto).toBe('Ana Souza');
    expect(row.funcoesHabilitadas).toEqual(['VELA']);
  });

  it('fotoUrl devolve null se a API falhar', async () => {
    const promise = service.fotoUrl('v-1');
    http.expectOne(`${environment.apiUrl}/voluntarios/v-1/foto-url`)
      .flush({}, { status: 404, statusText: 'Not Found' });
    expect(await promise).toBeNull();
  });

  it('altera ativo com PATCH', async () => {
    const promise = service.setAtivo('v-1', false);
    const req = http.expectOne(r => r.url === `${environment.apiUrl}/voluntarios/v-1/ativo`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.params.get('ativo')).toBe('false');
    req.flush(null);
    await promise;
  });
});
