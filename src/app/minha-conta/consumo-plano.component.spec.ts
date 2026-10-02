import { SessaoAtual } from '../core/layout/sessao-atual';
import { TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { ConsumoPlanoComponent } from './consumo-plano.component';
import { MinhaContaService, ConsumoPlano } from './minha-conta.service';

describe('Consumo do plano', () => {
  const dados: ConsumoPlano = { planoNome:null, versaoDireitos:null, direitosConfirmadosEm:null, consultadoEm:'2026-10-01T00:00:00Z', itens:[{codigo:'pessoas',nome:'Pessoas cadastradas',usado:5,limite:5,disponivel:0,estado:'ATINGIDO'}] };
  let api: jasmine.SpyObj<MinhaContaService>;
  beforeEach(() => {
    api=jasmine.createSpyObj('MinhaContaService',['consumo','conferirArmazenamento','historicoConsumo']); api.consumo.and.returnValue(of(dados));
    TestBed.configureTestingModule({imports:[ConsumoPlanoComponent],providers:[{provide:MinhaContaService,useValue:api},{provide:SessaoAtual,useValue:{permissoes:() => ['PAROQUIA_ALTERAR']}}]});
  });
  it('mostra limite atingido e informa as cotas ainda não aplicadas', () => {
    const f=TestBed.createComponent(ConsumoPlanoComponent); f.detectChanges();
    expect(f.nativeElement.textContent).toContain('5 / 5');
    expect(f.nativeElement.textContent).toContain('Limite atingido');
    expect(f.nativeElement.textContent).toContain('XLSX e importação de documentos gerais ainda não aplicadas');
  });
  it('mostra competência e explica que reenvio não conta novamente', () => {
    api.consumo.and.returnValue(of({...dados,itens:[{codigo:'emails_mes',nome:'E-mails da fila por mês',usado:10,limite:10,disponivel:0,estado:'ATINGIDO',competencia:'2026-10'}]}));
    const f=TestBed.createComponent(ConsumoPlanoComponent); f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Competência 2026-10');
    expect(f.nativeElement.textContent).toContain('reenvios da mesma mensagem não contam novamente');
    expect(f.nativeElement.textContent).toContain('novos envios aguardam disponibilidade');
  });
  it('falha não vira consumo zero nem mantém dados antigos', () => {
    const f=TestBed.createComponent(ConsumoPlanoComponent); f.detectChanges();
    api.consumo.and.returnValue(throwError(() => new Error('falha'))); f.componentInstance.buscar(); f.detectChanges();
    expect(f.componentInstance.dados()).toBeNull(); expect(f.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
  });
  it('cancela pedido anterior e ignora resposta atrasada', () => {
    const antigo=new Subject<ConsumoPlano>(); api.consumo.and.returnValue(antigo);
    const f=TestBed.createComponent(ConsumoPlanoComponent); f.detectChanges();
    api.consumo.and.returnValue(of({...dados,itens:[]})); f.componentInstance.buscar(); antigo.next(dados);
    expect(f.componentInstance.dados()?.itens).toEqual([]);
    f.destroy(); expect(antigo.observed).toBeFalse();
  });

  it('mostra MB e pendência sem apresentar espaço livre falso', () => {
    api.consumo.and.returnValue(of({...dados,itens:[{codigo:'armazenamento_mb',nome:'Armazenamento',usado:1048576,limite:2097152,disponivel:null,estado:'INVENTARIO_PENDENTE',unidade:'bytes',pendentes:2}]}));
    const f=TestBed.createComponent(ConsumoPlanoComponent);f.detectChanges();
    expect(f.nativeElement.textContent).toContain('1 MB conhecidos / 2 MB');
    expect(f.nativeElement.textContent).toContain('consumo é parcial');
    api.conferirArmazenamento.and.returnValue(of({conferidos:1,falhas:0,pendentes:1}));
    f.componentInstance.conferir();f.detectChanges();expect(f.nativeElement.textContent).toContain('1 conferidas');
    expect(api.consumo).toHaveBeenCalledTimes(2);
  });
  it('leitor não pode disparar conferência de metadados', () => {
    TestBed.overrideProvider(SessaoAtual,{useValue:{permissoes:() => []}});
    const f=TestBed.createComponent(ConsumoPlanoComponent);f.detectChanges();f.componentInstance.conferir();
    expect(api.conferirArmazenamento).not.toHaveBeenCalled();
  });
  it('histórico é consultado sob demanda e ausência não vira zero',()=>{api.historicoConsumo.and.returnValue(of([]));const f=TestBed.createComponent(ConsumoPlanoComponent);f.detectChanges();expect(api.historicoConsumo).not.toHaveBeenCalled();f.componentInstance.buscarHistorico();f.detectChanges();expect(f.nativeElement.textContent).toContain('Nenhuma consulta registrada');expect(f.componentInstance.dados()).toEqual(dados);});
  it('falha do histórico preserva consumo atual e não apresenta zero',()=>{api.historicoConsumo.and.returnValue(throwError(()=>new Error('falha')));const f=TestBed.createComponent(ConsumoPlanoComponent);f.detectChanges();f.componentInstance.buscarHistorico();expect(f.componentInstance.erroHistorico()).toBeTruthy();expect(f.componentInstance.dados()).toEqual(dados);});
});
