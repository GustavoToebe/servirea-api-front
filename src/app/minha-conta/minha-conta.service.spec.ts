import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { environment } from '../../environments/environment';
import { MinhaContaService } from './minha-conta.service';

describe('MinhaContaService consumo local', () => {
  it('consulta consumo na API local sem parâmetros comerciais', () => {
    TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting()]});
    const http=TestBed.inject(HttpTestingController);
    TestBed.inject(MinhaContaService).consumo().subscribe();
    const req=http.expectOne(`${environment.apiUrl}/minha-conta/consumo`);
    expect(req.request.method).toBe('GET'); expect(req.request.body).toBeNull();
    req.flush({itens:[]}); http.verify();
  });
});
