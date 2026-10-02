import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { of,Subject,throwError } from 'rxjs';
import { DisponibilidadeComponent } from './disponibilidade.component';
import { DisponibilidadeApiService,DisponibilidadePessoal } from './disponibilidade-api.service';
import { SessaoAtual } from '../../core/layout/sessao-atual';
import { DialogoService } from '../../shared/services/dialogo.service';
describe('Indisponibilidade pessoal',()=>{
 let api:jasmine.SpyObj<DisponibilidadeApiService>;let permissoes:ReturnType<typeof signal<string[]>>;
 const dados:DisponibilidadePessoal={ano:2026,mes:10,versao:4,semRestricao:false,itens:[{data:'2026-10-03',periodo:'MANHA'}]};
 beforeEach(()=>{api=jasmine.createSpyObj('api',['consultar','salvar']);api.consultar.and.returnValue(of(dados));api.salvar.and.returnValue(of({...dados,versao:5}));permissoes=signal(['PORTAL_VOLUNTARIO','PORTAL_DISPONIBILIDADE']);TestBed.configureTestingModule({imports:[DisponibilidadeComponent],providers:[provideRouter([]),{provide:DisponibilidadeApiService,useValue:api},{provide:SessaoAtual,useValue:{permissoes}}]});});
 function montar(){const f=TestBed.createComponent(DisponibilidadeComponent);f.componentInstance.competencia='2026-10';f.detectChanges();return f;}
 it('edita uma cópia e envia apenas resposta própria com versão',async()=>{const f=montar();await f.whenStable();f.componentInstance.itens[0].periodo='NOITE';f.detectChanges();await f.whenStable();f.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));expect(api.salvar).toHaveBeenCalledWith(2026,10,{versao:4,semRestricao:false,itens:[{data:'2026-10-03',periodo:'NOITE'}]});expect(dados.itens[0].periodo).toBe('MANHA');expect(f.componentInstance.dados()?.versao).toBe(5);});
 it('sem permissão não oferece salvar nem faz mutação',()=>{permissoes.set(['PORTAL_VOLUNTARIO']);const f=montar();f.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));expect(api.salvar).not.toHaveBeenCalled();expect(f.nativeElement.querySelector('app-rodape-form')).toBeNull();});
 it('conflito preserva alterações e permite recarregar com confirmação',async()=>{api.salvar.and.returnValue(throwError(()=>new HttpErrorResponse({status:409,error:{message:'O mês mudou'}})));const f=montar();await f.whenStable();f.componentInstance.alterado=true;f.nativeElement.querySelector('form').dispatchEvent(new Event('submit'));expect(f.componentInstance.hasPendingChanges()).toBeTrue();expect(f.componentInstance.erro()).toContain('mês mudou');spyOn(TestBed.inject(DialogoService),'confirmar').and.resolveTo(true);await f.componentInstance.recarregar();expect(f.componentInstance.hasPendingChanges()).toBeFalse();});
 it('troca de mês cancela consulta antiga',async()=>{const antiga=new Subject<DisponibilidadePessoal>();api.consultar.and.returnValue(antiga);const f=montar();api.consultar.and.returnValue(of({...dados,ano:2026,mes:11,itens:[]}));await f.componentInstance.trocarMes('2026-11');antiga.next(dados);expect(f.componentInstance.dados()?.mes).toBe(11);expect(api.consultar).toHaveBeenCalledWith(2026,11);});
 it('sem restrição só apaga datas após confirmação',async()=>{const f=montar();const dialogo=spyOn(TestBed.inject(DialogoService),'confirmar').and.resolveTo(false);await f.componentInstance.alternarSem(true);expect(f.componentInstance.itens.length).toBe(1);expect(f.componentInstance.semRestricao).toBeFalse();dialogo.and.resolveTo(true);await f.componentInstance.alternarSem(true);expect(f.componentInstance.itens).toEqual([]);expect(f.componentInstance.semRestricao).toBeTrue();});
 it('não consulta depois de destruir durante confirmação',async()=>{const f=montar();f.componentInstance.alterado=true;let resolver!:(b:boolean)=>void;spyOn(TestBed.inject(DialogoService),'confirmar').and.returnValue(new Promise(r=>resolver=r));const troca=f.componentInstance.trocarMes('2026-11');f.destroy();resolver(true);await troca;expect(api.consultar.calls.count()).toBe(1);});
});
