import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of,Subject } from 'rxjs';
import { ParticipacaoComponent } from './participacao.component';
import { ParticipacaoApiService,PaginaParticipacao } from './participacao-api.service';
import { SessaoAtual } from '../../core/layout/sessao-atual';
describe('Relatório de participação',()=>{
 let api:jasmine.SpyObj<ParticipacaoApiService>;let permissoes:ReturnType<typeof signal<string[]>>;
 beforeEach(()=>{api=jasmine.createSpyObj('api',['listar','exportar']);api.listar.and.returnValue(of({itens:[],total:61,pagina:0,tamanho:30}));api.exportar.and.returnValue(of(new Blob(['csv'])));permissoes=signal(['AUDITORIA','RELATORIO_EXPORTAR']);TestBed.configureTestingModule({imports:[ParticipacaoComponent],providers:[provideRouter([]),{provide:ParticipacaoApiService,useValue:api},{provide:SessaoAtual,useValue:{permissoes}}]});});
 function montar(){const f=TestBed.createComponent(ParticipacaoComponent);f.detectChanges();return f;}
 it('pagina com filtros aplicados, sem misturar edição ainda não buscada',()=>{const f=montar();f.componentInstance.filtros.presenca='FALTOU';f.componentInstance.buscar();f.componentInstance.filtros.presenca='PRESENTE';f.componentInstance.paginar(1);expect(api.listar.calls.mostRecent().args[0].presenca).toBe('FALTOU');expect(api.listar.calls.mostRecent().args[1]).toBe(1);});
 it('exportação usa filtros da tabela e libera a URL do arquivo',()=>{const f=montar();f.componentInstance.filtros.busca='Outro filtro ainda não buscado';spyOn(URL,'createObjectURL').and.returnValue('blob:teste');const revoke=spyOn(URL,'revokeObjectURL');spyOn(HTMLAnchorElement.prototype,'click');f.componentInstance.exportar();expect(api.exportar.calls.mostRecent().args[0].busca).toBe('');expect(revoke).toHaveBeenCalledWith('blob:teste');expect(f.componentInstance.exportando()).toBeFalse();});
 it('consulta não concede exportação',()=>{permissoes.set(['AUDITORIA']);const f=montar();f.componentInstance.exportar();expect(api.exportar).not.toHaveBeenCalled();expect(f.nativeElement.textContent).not.toContain('Exportar CSV');});
 it('resultado antigo não substitui uma busca nova',()=>{const antiga=new Subject<PaginaParticipacao>();api.listar.and.returnValue(antiga);const f=montar();api.listar.and.returnValue(of({itens:[],total:0,pagina:0,tamanho:30}));f.componentInstance.buscar();antiga.next({itens:[],total:99,pagina:0,tamanho:30});expect(f.componentInstance.total()).toBe(0);});
 it('destruir cancela requisição de exportação',()=>{const exportacao=new Subject<Blob>();api.exportar.and.returnValue(exportacao);const f=montar();const create=spyOn(URL,'createObjectURL');f.componentInstance.exportar();f.destroy();exportacao.next(new Blob(['csv']));expect(create).not.toHaveBeenCalled();});
});
