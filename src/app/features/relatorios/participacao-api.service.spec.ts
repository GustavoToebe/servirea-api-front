import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting,HttpTestingController } from '@angular/common/http/testing';
import { ParticipacaoApiService } from './participacao-api.service';
import { environment } from '../../../environments/environment';
describe('API de relatórios paginados',()=>{
 const filtros={de:'2026-10-01',ate:'2026-10-31',busca:'Ana',presenca:'FALTOU',resposta:'',funcao:''};
 beforeEach(()=>TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting()]}));afterEach(()=>TestBed.inject(HttpTestingController).verify());
 it('envia filtros ao servidor e omite enums vazios',()=>{TestBed.inject(ParticipacaoApiService).listar(filtros,2).subscribe();const r=TestBed.inject(HttpTestingController).expectOne(q=>q.url===`${environment.apiUrl}/relatorios/participacao`);expect(r.request.params.get('pagina')).toBe('2');expect(r.request.params.get('presenca')).toBe('FALTOU');expect(r.request.params.has('resposta')).toBeFalse();r.flush({});});
 it('CSV usa os mesmos filtros sem limitar à página exibida',()=>{TestBed.inject(ParticipacaoApiService).exportar(filtros).subscribe();const r=TestBed.inject(HttpTestingController).expectOne(q=>q.url===`${environment.apiUrl}/relatorios/participacao/csv`);expect(r.request.responseType).toBe('blob');expect(r.request.params.has('pagina')).toBeFalse();r.flush(new Blob(['CSV']));});
});
