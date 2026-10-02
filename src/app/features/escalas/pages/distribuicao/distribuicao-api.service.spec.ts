import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../../../environments/environment';
import { DistribuicaoApiService } from './distribuicao-api.service';

describe('API de distribuição por regras', () => {
  const regras = { maximoPorPessoa: 3, intervaloDias: 2, exigirResposta: true };
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }));
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('a prévia envia só as regras', () => {
    TestBed.inject(DistribuicaoApiService).previa('e1', regras).subscribe();
    const r = TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/escalas/e1/distribuicao/previa`);
    expect(r.request.method).toBe('POST');
    expect(r.request.body).toEqual({ regras });
    r.flush({});
  });

  it('a aplicação envia versão, regras e escolhas explícitas', () => {
    const escolhas = [{ vagaId: 'v', pessoaId: 'p' }];
    TestBed.inject(DistribuicaoApiService).aplicar('e1', 4, regras, escolhas).subscribe();
    const r = TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/escalas/e1/distribuicao/aplicacao`);
    expect(r.request.body).toEqual({ versao: 4, regras, escolhas });
    r.flush({});
  });
});
