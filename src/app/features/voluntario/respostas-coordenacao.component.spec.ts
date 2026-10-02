import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute,provideRouter } from '@angular/router';
import { of,Subject,throwError } from 'rxjs';
import { RespostasCoordenacaoComponent } from './respostas-coordenacao.component';
import { VoluntarioApiService } from './voluntario-api.service';
import { SessaoAtual } from '../../core/layout/sessao-atual';

describe('Respostas da coordenação',()=>{
 let api:jasmine.SpyObj<VoluntarioApiService>;const permissoes=signal<string[]>([]);
 beforeEach(()=>{permissoes.set(['VAGA_RESPOSTA_LER']);api=jasmine.createSpyObj('api',['coordenacao']);api.coordenacao.and.returnValue(of({itens:[],total:0,pagina:0,tamanho:30}));TestBed.configureTestingModule({imports:[RespostasCoordenacaoComponent],providers:[provideRouter([]),{provide:VoluntarioApiService,useValue:api},{provide:SessaoAtual,useValue:{permissoes}},{provide:ActivatedRoute,useValue:{snapshot:{paramMap:{get:()=> 'escala'}}}}]});});
 it('não consulta sem permissão',()=>{permissoes.set([]);const f=TestBed.createComponent(RespostasCoordenacaoComponent);f.detectChanges();expect(api.coordenacao).not.toHaveBeenCalled();expect(f.nativeElement.textContent).toContain('não permite consultar');});
 it('filtrar reinicia a paginação',()=>{const f=TestBed.createComponent(RespostasCoordenacaoComponent);f.detectChanges();f.componentInstance.pagina=2;f.componentInstance.filtro='RECUSADA';f.componentInstance.buscar();expect(api.coordenacao).toHaveBeenCalledWith('escala',0,'RECUSADA');});
 it('cancela resultado antigo ao filtrar',()=>{const antigo=new Subject<any>();api.coordenacao.and.returnValue(antigo);const f=TestBed.createComponent(RespostasCoordenacaoComponent);f.detectChanges();api.coordenacao.and.returnValue(of({itens:[],total:0,pagina:0,tamanho:30}));f.componentInstance.buscar();antigo.next({itens:[{vagaId:'antiga'}],total:1,pagina:0,tamanho:30});expect(f.componentInstance.itens()).toEqual([]);});
 it('erro não mostra dados antigos nem zero como carga bem sucedida',()=>{api.coordenacao.and.returnValue(throwError(()=>new Error('rede')));const f=TestBed.createComponent(RespostasCoordenacaoComponent);f.detectChanges();expect(f.componentInstance.erro()).toBeTruthy();expect(f.componentInstance.itens()).toEqual([]);expect(f.componentInstance.carregando()).toBeFalse();});
});
