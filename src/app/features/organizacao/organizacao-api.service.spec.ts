import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { OrganizacaoApiService } from './organizacao-api.service';
import { environment } from '../../../environments/environment';
describe('API de organização',()=>{
 beforeEach(()=>TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting()]}));
 afterEach(()=>TestBed.inject(HttpTestingController).verify());
 for(const tipo of ['mural','tarefas'] as const){
  const rota=tipo==='mural'?'mural/avisos':'tarefas';
  it(`consulta ${tipo} com paginação e busca`,()=>{TestBed.inject(OrganizacaoApiService).listar(tipo,'Título','',2).subscribe();const r=TestBed.inject(HttpTestingController).expectOne(q=>q.url===`${environment.apiUrl}/${rota}`&&q.params.get('pagina')==='2'&&q.params.get('busca')==='Título');expect(r.request.method).toBe('GET');r.flush({itens:[],total:0,pagina:2,tamanho:30});});
  it(`edita ${tipo} com versão`,()=>{const dados={titulo:'Título',descricao:'Descrição',status:tipo==='mural'?'PUBLICADO':'ABERTA',prazo:null,versao:2};TestBed.inject(OrganizacaoApiService).salvar(tipo,'a',dados).subscribe();const r=TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/${rota}/a`);expect(r.request.method).toBe('PUT');expect(r.request.body).toEqual(dados);r.flush({});});
 }
});
