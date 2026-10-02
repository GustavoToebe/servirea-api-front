import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of,Subject,throwError } from 'rxjs';
import { PortalComponent } from './portal.component';
import { VoluntarioApiService,Portal } from './voluntario-api.service';
import { SessaoAtual } from '../../core/layout/sessao-atual';
import { DialogoService } from '../../shared/services/dialogo.service';
describe('Portal de consulta e calendário',()=>{
 let api:jasmine.SpyObj<VoluntarioApiService>;let dialogo:jasmine.SpyObj<DialogoService>;
 beforeEach(()=>{api=jasmine.createSpyObj('api',['consultar','criarCalendario','revogarCalendario','responder','historico']);api.consultar.and.returnValue(of({vinculado:false,compromissos:[]}));api.criarCalendario.and.returnValue(of({token:'token-test',expiraEm:'2027-10-02T00:00:00Z'}));api.revogarCalendario.and.returnValue(of(undefined));dialogo=jasmine.createSpyObj('dialogo',['confirmar','avisar']);dialogo.confirmar.and.resolveTo(true);TestBed.configureTestingModule({imports:[PortalComponent],providers:[{provide:VoluntarioApiService,useValue:api},{provide:SessaoAtual,useValue:{permissoes:signal(['PORTAL_VOLUNTARIO','CALENDARIO','PORTAL_RESPONDER'])}},{provide:DialogoService,useValue:dialogo}]});});
 it('orienta vínculo sem inventar identidade',()=>{const f=TestBed.createComponent(PortalComponent);f.detectChanges();expect(f.nativeElement.textContent).toContain('ainda não está vinculado');expect(f.nativeElement.textContent).not.toContain('Gerar link');});
 it('mostra somente o que a API pessoal devolve',()=>{api.consultar.and.returnValue(of({vinculado:true,compromissos:[{id:'a',tipo:'ESCALA',titulo:'Missa',inicio:'2026-10-02T19:00:00',termino:'2026-10-02T20:00:00',local:null,funcao:'CRUZ',vagaId:'v',resposta:'PENDENTE',versao:0,respondidoEm:null,prazoResposta:'2099-10-02T22:00:00Z'}]}));const f=TestBed.createComponent(PortalComponent);f.detectChanges();expect(f.nativeElement.textContent).toContain('Missa');expect(f.nativeElement.textContent).not.toContain('Confirmar participação');});
 it('gera, revoga e limpa token ao destruir',async()=>{const f=TestBed.createComponent(PortalComponent);f.detectChanges();await f.componentInstance.gerar();expect(f.componentInstance.link()).toContain('/public/calendario/token-test.ics');await f.componentInstance.revogar();expect(api.revogarCalendario).toHaveBeenCalled();expect(f.componentInstance.link()).toBe('');await f.componentInstance.gerar();f.destroy();expect(f.componentInstance.link()).toBe('');});
 it('consulta cancelada não mostra resultado de período anterior',()=>{const anterior=new Subject<Portal>();api.consultar.and.returnValue(anterior);const f=TestBed.createComponent(PortalComponent);f.detectChanges();api.consultar.and.returnValue(of({vinculado:false,compromissos:[]}));f.componentInstance.carregar();anterior.next({vinculado:true,compromissos:[]});expect(f.componentInstance.dados()?.vinculado).toBeFalse();});
 it('falha limpa resultado e mostra erro',()=>{api.consultar.and.returnValue(throwError(()=>new Error('rede')));const f=TestBed.createComponent(PortalComponent);f.detectChanges();expect(f.componentInstance.dados()).toBeNull();expect(f.nativeElement.querySelector('[role=alert]')).toBeTruthy();});
 it('não gera assinatura se a confirmação chegar após sair da tela',async()=>{
  let confirmar!:(valor:boolean)=>void;dialogo.confirmar.and.returnValue(new Promise<boolean>(r=>confirmar=r));
  const f=TestBed.createComponent(PortalComponent);f.detectChanges();const acao=f.componentInstance.gerar();f.destroy();confirmar(true);await acao;
  expect(api.criarCalendario).not.toHaveBeenCalled();
 });

 const compromisso={id:'escala-v',tipo:'ESCALA',titulo:'Missa',inicio:'2099-10-02T19:00:00',termino:'2099-10-02T20:00:00',local:null,funcao:'CRUZ',vagaId:'v',resposta:'PENDENTE' as const,versao:3,respondidoEm:null,prazoResposta:'2099-10-02T22:00:00Z'};
 it('envia resposta com a versão lida e recarrega os compromissos',async()=>{
  api.consultar.and.returnValue(of({vinculado:true,compromissos:[compromisso]}));api.responder.and.returnValue(of({}));
  const f=TestBed.createComponent(PortalComponent);f.detectChanges();await f.componentInstance.responder(compromisso,'RECUSADA');
  expect(api.responder).toHaveBeenCalledOnceWith('v','RECUSADA',3);expect(api.consultar).toHaveBeenCalledTimes(2);expect(dialogo.confirmar.calls.mostRecent().args[0].mensagem).toContain('continuará alocado');
 });
 it('prazo vencido não exibe nem envia ação pessoal',async()=>{
  const passado={...compromisso,prazoResposta:'2000-01-01T00:00:00Z'};api.consultar.and.returnValue(of({vinculado:true,compromissos:[passado]}));
  const f=TestBed.createComponent(PortalComponent);f.detectChanges();await f.componentInstance.responder(passado,'CONFIRMADA');
  expect(api.responder).not.toHaveBeenCalled();
  const botoes=Array.from(f.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>).map(b=>b.textContent?.trim());
  expect(botoes).not.toContain('Recusar');expect(botoes).not.toContain('Confirmar');
 });
 it('permissão de consulta não autoriza responder',async()=>{
  (TestBed.inject(SessaoAtual).permissoes as any).set(['PORTAL_VOLUNTARIO']);
  const f=TestBed.createComponent(PortalComponent);await f.componentInstance.responder(compromisso,'CONFIRMADA');expect(api.responder).not.toHaveBeenCalled();
 });
 it('conflito recarrega a versão sem repetir a escrita',async()=>{
  api.responder.and.returnValue(throwError(()=>({status:409,error:{message:'O compromisso mudou.'}})));
  const f=TestBed.createComponent(PortalComponent);f.detectChanges();await f.componentInstance.responder(compromisso,'CONFIRMADA');
  expect(api.responder).toHaveBeenCalledTimes(1);expect(api.consultar).toHaveBeenCalledTimes(2);expect(f.componentInstance.erro()).toBeTruthy();
 });
 it('trocar histórico cancela resposta antiga',()=>{
  const antigo=new Subject<any>();api.historico.and.returnValue(antigo);const f=TestBed.createComponent(PortalComponent);
  f.componentInstance.abrirHistorico(compromisso);api.historico.and.returnValue(of({itens:[],total:0,pagina:0,tamanho:30}));f.componentInstance.abrirHistorico({...compromisso,vagaId:'outra'});
  antigo.next({itens:[{id:'antigo',resposta:'RECUSADA',respondidoEm:'x',versao:1}],total:1,pagina:0,tamanho:30});expect(f.componentInstance.historico()).toEqual([]);
 });
});
