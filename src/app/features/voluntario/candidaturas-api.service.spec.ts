import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting,HttpTestingController } from '@angular/common/http/testing';
import { CandidaturasApiService } from './candidaturas-api.service';
import { environment } from '../../../environments/environment';
describe('API de candidaturas',()=>{
 beforeEach(()=>TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting()]}));afterEach(()=>TestBed.inject(HttpTestingController).verify());
 it('busca vagas em páginas sem identidade no request',()=>{TestBed.inject(CandidaturasApiService).vagas('2026-10-01','2026-10-31',1).subscribe();const r=TestBed.inject(HttpTestingController).expectOne(q=>q.url===`${environment.apiUrl}/portal/vagas-abertas`);expect(r.request.params.keys()).toEqual(['de','ate','pagina']);r.flush({itens:[],total:0,pagina:1,tamanho:30});});
 it('candidata apenas a própria pessoa enviando versão',()=>{TestBed.inject(CandidaturasApiService).candidatar('v',3).subscribe();const r=TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/portal/vagas/v/candidaturas`);expect(r.request.method).toBe('POST');expect(r.request.body).toEqual({versao:3});r.flush({});});
 it('consulta somente as próprias candidaturas',()=>{TestBed.inject(CandidaturasApiService).minhas(2).subscribe();const r=TestBed.inject(HttpTestingController).expectOne(q=>q.url===`${environment.apiUrl}/portal/candidaturas`);expect(r.request.params.keys()).toEqual(['pagina']);r.flush({itens:[],total:0,pagina:2,tamanho:30});});
 it('desiste usando versão do pedido',()=>{TestBed.inject(CandidaturasApiService).desistir('p',4).subscribe();const r=TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/portal/candidaturas/p/desistencia`);expect(r.request.body).toEqual({versao:4});r.flush({});});
 it('aprova sem enviar candidato ou tenant no corpo',()=>{TestBed.inject(CandidaturasApiService).decidir('p',true,4).subscribe();const r=TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/escalas/candidaturas/p/decisao`);expect(r.request.body).toEqual({aprovar:true,versao:4});r.flush({});});
 it('consulta escala paginada da coordenação',()=>{TestBed.inject(CandidaturasApiService).coordenacao('s',0).subscribe();const r=TestBed.inject(HttpTestingController).expectOne(q=>q.url===`${environment.apiUrl}/escalas/s/candidaturas`);expect(r.request.params.get('pagina')).toBe('0');r.flush({itens:[],total:0,pagina:0,tamanho:30});});
});
