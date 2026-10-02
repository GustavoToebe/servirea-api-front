import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting,HttpTestingController } from '@angular/common/http/testing';
import { TrocasApiService } from './trocas-api.service';
import { environment } from '../../../environments/environment';
describe('API de trocas',()=>{
 beforeEach(()=>TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting()]}));
 afterEach(()=>TestBed.inject(HttpTestingController).verify());
 it('solicita com substituto e versão, sem identidade do solicitante',()=>{TestBed.inject(TrocasApiService).solicitar('v','s',2).subscribe();const r=TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/portal/vagas/v/trocas`);expect(r.request.method).toBe('POST');expect(r.request.body).toEqual({substitutoId:'s',versao:2});r.flush({});});
 it('aceite envia somente decisão e versão',()=>{TestBed.inject(TrocasApiService).responder('p',true,3).subscribe();const r=TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/portal/trocas/p/aceite`);expect(r.request.body).toEqual({aprovar:true,versao:3});r.flush({});});
 it('cancelamento usa versão do pedido',()=>{TestBed.inject(TrocasApiService).cancelar('p',4).subscribe();const r=TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/portal/trocas/p/cancelamento`);expect(r.request.body).toEqual({versao:4});r.flush({});});
 it('coordenação aprova pela rota própria',()=>{TestBed.inject(TrocasApiService).decidir('p',true,4).subscribe();const r=TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/escalas/trocas/p/decisao`);expect(r.request.body).toEqual({aprovar:true,versao:4});r.flush({});});
 it('histórico pessoal tem somente paginação',()=>{TestBed.inject(TrocasApiService).minhas(2).subscribe();const r=TestBed.inject(HttpTestingController).expectOne(q=>q.url===`${environment.apiUrl}/portal/trocas`);expect(r.request.params.keys()).toEqual(['pagina']);r.flush({itens:[],total:0,pagina:2,tamanho:30});});
 it('diretório recebe termo sem tenant',()=>{TestBed.inject(TrocasApiService).substitutos('Maria').subscribe();const r=TestBed.inject(HttpTestingController).expectOne(q=>q.url===`${environment.apiUrl}/portal/trocas/substitutos`);expect(r.request.params.keys()).toEqual(['busca']);r.flush([]);});
});
