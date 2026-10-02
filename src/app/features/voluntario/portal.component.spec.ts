import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of,Subject,throwError } from 'rxjs';
import { PortalComponent } from './portal.component';
import { VoluntarioApiService,Portal } from './voluntario-api.service';
import { SessaoAtual } from '../../core/layout/sessao-atual';
import { DialogoService } from '../../shared/services/dialogo.service';
describe('Portal de consulta e calendário',()=>{
 let api:jasmine.SpyObj<VoluntarioApiService>;let dialogo:jasmine.SpyObj<DialogoService>;
 beforeEach(()=>{api=jasmine.createSpyObj('api',['consultar','criarCalendario','revogarCalendario']);api.consultar.and.returnValue(of({vinculado:false,compromissos:[]}));api.criarCalendario.and.returnValue(of({token:'token-test',expiraEm:'2027-10-02T00:00:00Z'}));api.revogarCalendario.and.returnValue(of(undefined));dialogo=jasmine.createSpyObj('dialogo',['confirmar','avisar']);dialogo.confirmar.and.resolveTo(true);TestBed.configureTestingModule({imports:[PortalComponent],providers:[{provide:VoluntarioApiService,useValue:api},{provide:SessaoAtual,useValue:{permissoes:signal(['PORTAL_VOLUNTARIO','CALENDARIO'])}},{provide:DialogoService,useValue:dialogo}]});});
 it('orienta vínculo sem inventar identidade',()=>{const f=TestBed.createComponent(PortalComponent);f.detectChanges();expect(f.nativeElement.textContent).toContain('ainda não está vinculado');expect(f.nativeElement.textContent).not.toContain('Gerar link');});
 it('mostra somente o que a API pessoal devolve',()=>{api.consultar.and.returnValue(of({vinculado:true,compromissos:[{id:'a',tipo:'ESCALA',titulo:'Missa',inicio:'2026-10-02T19:00:00',termino:'2026-10-02T20:00:00',local:null,funcao:'CRUZ'}]}));const f=TestBed.createComponent(PortalComponent);f.detectChanges();expect(f.nativeElement.textContent).toContain('Missa');expect(f.nativeElement.textContent).not.toContain('Confirmar participação');});
 it('gera, revoga e limpa token ao destruir',async()=>{const f=TestBed.createComponent(PortalComponent);f.detectChanges();await f.componentInstance.gerar();expect(f.componentInstance.link()).toContain('/public/calendario/token-test.ics');await f.componentInstance.revogar();expect(api.revogarCalendario).toHaveBeenCalled();expect(f.componentInstance.link()).toBe('');await f.componentInstance.gerar();f.destroy();expect(f.componentInstance.link()).toBe('');});
 it('consulta cancelada não mostra resultado de período anterior',()=>{const anterior=new Subject<Portal>();api.consultar.and.returnValue(anterior);const f=TestBed.createComponent(PortalComponent);f.detectChanges();api.consultar.and.returnValue(of({vinculado:false,compromissos:[]}));f.componentInstance.carregar();anterior.next({vinculado:true,compromissos:[]});expect(f.componentInstance.dados()?.vinculado).toBeFalse();});
 it('falha limpa resultado e mostra erro',()=>{api.consultar.and.returnValue(throwError(()=>new Error('rede')));const f=TestBed.createComponent(PortalComponent);f.detectChanges();expect(f.componentInstance.dados()).toBeNull();expect(f.nativeElement.querySelector('[role=alert]')).toBeTruthy();});
 it('não gera assinatura se a confirmação chegar após sair da tela',async()=>{
  let confirmar!:(valor:boolean)=>void;dialogo.confirmar.and.returnValue(new Promise<boolean>(r=>confirmar=r));
  const f=TestBed.createComponent(PortalComponent);f.detectChanges();const acao=f.componentInstance.gerar();f.destroy();confirmar(true);await acao;
  expect(api.criarCalendario).not.toHaveBeenCalled();
 });
});
