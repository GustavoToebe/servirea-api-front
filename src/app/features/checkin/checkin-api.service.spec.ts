import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { CheckinApiService } from './checkin-api.service';

describe('API de check-in', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }));
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('abre com a validade em minutos', () => {
    TestBed.inject(CheckinApiService).abrir('ev', 120).subscribe();
    const r = TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/escalas/eventos/ev/checkin`);
    expect(r.request.method).toBe('POST');
    expect(r.request.body).toEqual({ minutos: 120 });
    r.flush({});
  });

  it('encerra pelo mesmo caminho com DELETE', () => {
    TestBed.inject(CheckinApiService).encerrar('ev').subscribe();
    const r = TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/escalas/eventos/ev/checkin`);
    expect(r.request.method).toBe('DELETE');
    r.flush(null);
  });

  it('a pessoa registra só com o código', () => {
    TestBed.inject(CheckinApiService).registrar('codigo').subscribe();
    const r = TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/portal/checkin`);
    expect(r.request.body).toEqual({ token: 'codigo' });
    r.flush({});
  });
});
