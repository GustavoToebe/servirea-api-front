import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController,provideHttpClientTesting } from '@angular/common/http/testing';
import { VoluntarioApiService } from './voluntario-api.service';
import { environment } from '../../../environments/environment';
describe('API do portal',()=>{
 beforeEach(()=>TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting()]}));afterEach(()=>TestBed.inject(HttpTestingController).verify());
 it('consulta pessoal sem aceitar pessoaId',()=>{TestBed.inject(VoluntarioApiService).consultar('2026-10-01','2026-10-31').subscribe();const r=TestBed.inject(HttpTestingController).expectOne(q=>q.url===`${environment.apiUrl}/portal/compromissos`);expect(r.request.params.keys()).toEqual(['de','ate']);r.flush({vinculado:true,compromissos:[]});});
 it('cria assinatura e revoga no servidor',()=>{const api=TestBed.inject(VoluntarioApiService);api.criarCalendario().subscribe();let r=TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/calendario/assinatura`);expect(r.request.method).toBe('POST');r.flush({token:'t',expiraEm:'x'});api.revogarCalendario().subscribe();r=TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/calendario/assinatura`);expect(r.request.method).toBe('DELETE');r.flush(null);});
});
