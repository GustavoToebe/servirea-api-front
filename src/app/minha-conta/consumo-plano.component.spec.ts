import { TestBed } from '@angular/core/testing';
import { of, throwError, Subject } from 'rxjs';
import { ConsumoPlanoComponent } from './consumo-plano.component';
import { MinhaContaService, ConsumoPlano } from './minha-conta.service';

describe('Consumo do plano', () => {
  const dados: ConsumoPlano = { planoNome:null, versaoDireitos:null, direitosConfirmadosEm:null, consultadoEm:'2026-10-01T00:00:00Z', itens:[{codigo:'pessoas',nome:'Pessoas cadastradas',usado:5,limite:5,disponivel:0,estado:'ATINGIDO'}] };
  let api: jasmine.SpyObj<MinhaContaService>;
  beforeEach(() => {
    api=jasmine.createSpyObj('MinhaContaService',['consumo']); api.consumo.and.returnValue(of(dados));
    TestBed.configureTestingModule({imports:[ConsumoPlanoComponent],providers:[{provide:MinhaContaService,useValue:api}]});
  });
  it('mostra limite atingido e informa as cotas ainda não aplicadas', () => {
    const f=TestBed.createComponent(ConsumoPlanoComponent); f.detectChanges();
    expect(f.nativeElement.textContent).toContain('5 / 5');
    expect(f.nativeElement.textContent).toContain('Limite atingido');
    expect(f.nativeElement.textContent).toContain('ainda não têm cotas');
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
});
