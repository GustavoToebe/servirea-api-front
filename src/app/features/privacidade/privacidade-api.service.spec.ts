import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { PrivacidadeApiService } from './privacidade-api.service';

describe('API de privacidade', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }));
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('histórico só leva a página', () => {
    TestBed.inject(PrivacidadeApiService).consentimentos('p1', 2).subscribe();
    const r = TestBed.inject(HttpTestingController).expectOne(q => q.url === `${environment.apiUrl}/pessoas/p1/consentimentos`);
    expect(r.request.params.keys()).toEqual(['pagina']);
    r.flush({ itens: [], total: 0, pagina: 2, tamanho: 30 });
  });

  it('exportação pede arquivo', () => {
    TestBed.inject(PrivacidadeApiService).exportar('p1').subscribe();
    const r = TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/pessoas/p1/exportacao`);
    expect(r.request.responseType).toBe('blob');
    r.flush(new Blob(['{}']));
  });

  it('retenção envia prazo nulo para desligar e versão', () => {
    TestBed.inject(PrivacidadeApiService).definirRetencao(null, 3).subscribe();
    const r = TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/privacidade/retencao`);
    expect(r.request.method).toBe('PUT');
    expect(r.request.body).toEqual({ comunicadosDias: null, versao: 3 });
    r.flush({});
  });

  it('execução envia somente a versão', () => {
    TestBed.inject(PrivacidadeApiService).executarRetencao(1).subscribe();
    const r = TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/privacidade/retencao/execucao`);
    expect(r.request.body).toEqual({ versao: 1 });
    r.flush({});
  });
});
