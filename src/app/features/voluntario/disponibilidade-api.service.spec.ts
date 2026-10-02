import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting,HttpTestingController } from '@angular/common/http/testing';
import { DisponibilidadeApiService } from './disponibilidade-api.service';
import { environment } from '../../../environments/environment';
describe('API de indisponibilidade própria',()=>{
 beforeEach(()=>TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting()]}));afterEach(()=>TestBed.inject(HttpTestingController).verify());
 it('consulta por competência, sem id de pessoa nem tenant',()=>{TestBed.inject(DisponibilidadeApiService).consultar(2026,10).subscribe();const r=TestBed.inject(HttpTestingController).expectOne(q=>q.url===`${environment.apiUrl}/portal/indisponibilidades`);expect(r.request.params.keys()).toEqual(['ano','mes']);r.flush({});});
 it('salva versão e datas somente no portal',()=>{const dados={versao:4,semRestricao:false,itens:[{data:'2026-10-03',periodo:null}]};TestBed.inject(DisponibilidadeApiService).salvar(2026,10,dados).subscribe();const r=TestBed.inject(HttpTestingController).expectOne(q=>q.url===`${environment.apiUrl}/portal/indisponibilidades`);expect(r.request.method).toBe('PUT');expect(r.request.body).toEqual(dados);r.flush({});});
});
