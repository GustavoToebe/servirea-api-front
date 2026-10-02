import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController,provideHttpClientTesting } from '@angular/common/http/testing';
import { PastoraisApiService } from './pastorais-api.service';
import { environment } from '../../../environments/environment';
describe('API de pastorais e vínculos',()=>{
 beforeEach(()=>TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting()]}));afterEach(()=>TestBed.inject(HttpTestingController).verify());
 it('pagina equipes e participantes',()=>{const api=TestBed.inject(PastoraisApiService);api.equipes('Liturgia',2).subscribe();let r=TestBed.inject(HttpTestingController).expectOne(q=>q.url.endsWith('/pastorais/equipes'));expect(r.request.params.get('pagina')).toBe('2');r.flush({itens:[],total:0,pagina:2,tamanho:30});api.membros('a',1).subscribe();r=TestBed.inject(HttpTestingController).expectOne(q=>q.url.endsWith('/equipes/a/membros'));expect(r.request.params.get('pagina')).toBe('1');r.flush({itens:[],total:0,pagina:1,tamanho:30});});
 it('inclui versão de participante ao alterar papel',()=>{const d={pessoaId:'p',papel:'COORDENADOR',ativo:true,versao:3};TestBed.inject(PastoraisApiService).membro('a',d).subscribe();const r=TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/pastorais/equipes/a/membros`);expect(r.request.body).toEqual(d);r.flush(null);});
 it('remove vínculo com pessoa null',()=>{TestBed.inject(PastoraisApiService).vincular('u',null).subscribe();const r=TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/usuarios/u/pessoa`);expect(r.request.method).toBe('PUT');expect(r.request.body).toEqual({pessoaId:null});r.flush({});});
 it('cria equipe sem enviar tenant e busca opções limitadas',()=>{const api=TestBed.inject(PastoraisApiService);api.salvar({nome:'Liturgia',descricao:null,ativo:true,versao:null},null).subscribe();let r=TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/pastorais/equipes`);expect(r.request.method).toBe('POST');expect(r.request.body.tenantId).toBeUndefined();r.flush({});api.pessoas('Maria').subscribe();r=TestBed.inject(HttpTestingController).expectOne(q=>q.url.endsWith('/pastorais/pessoas'));expect(r.request.params.get('busca')).toBe('Maria');r.flush([]);});
});
