import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { ContaBancariaFormComponent } from './conta-bancaria-form.component';
import { FinanceiroApiService } from './financeiro-api.service';
import { DialogoService } from '../../shared/services/dialogo.service';

describe('ContaBancariaFormComponent', () => {
  let api: jasmine.SpyObj<FinanceiroApiService>;
  let avisar: jasmine.Spy;

  async function montar(id: string | null = null) {
    api = jasmine.createSpyObj('FinanceiroApiService', ['contas', 'salvarConta']);
    api.contas.and.resolveTo([{ id: 'x', nome: 'Principal', saldoInicial: 10, dataSaldoInicial: '2026-01-01', ativo: true, tipoConta: 'CORRENTE', banco: 'BB', agencia: '1', numeroConta: '2', titular: 'Paróquia',
      chavesPix: [{ tipo: 'EMAIL', chave: 'a@b.co', principal: true }] }]);
    api.salvarConta.and.resolveTo({} as never);
    avisar = jasmine.createSpy().and.resolveTo();
    await TestBed.configureTestingModule({ imports: [ContaBancariaFormComponent], providers: [provideRouter([]),
      { provide: FinanceiroApiService, useValue: api }, { provide: DialogoService, useValue: { avisar, confirmar: jasmine.createSpy().and.resolveTo(true) } },
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } } }] }).compileComponents();
    const f = TestBed.createComponent(ContaBancariaFormComponent);
    f.detectChanges(); await f.whenStable(); f.detectChanges();
    return f;
  }

  it('nova conta: conta corrente exige banco, agência, conta e titular; caixa não exige', async () => {
    const f = await montar();
    const c = f.componentInstance;
    expect(f.nativeElement.querySelector('h1').textContent).toContain('Nova conta bancária');
    expect(c.exigeBanco()).toBeTrue();
    c.form.tipoConta = 'CAIXA'; expect(c.exigeBanco()).toBeFalse();
  });

  it('chaves PIX: a primeira vira principal, a estrela troca, remover a principal passa a marca à primeira', async () => {
    const f = await montar();
    const c = f.componentInstance;
    c.adicionarChave(); c.adicionarChave(); c.adicionarChave();
    expect(c.form.chavesPix.map(k => k.principal)).toEqual([true, false, false]);
    c.tornarPrincipal(2); expect(c.form.chavesPix.map(k => k.principal)).toEqual([false, false, true]);
    c.removerChave(2); expect(c.form.chavesPix.map(k => k.principal)).toEqual([true, false]);
    f.detectChanges();
    expect(f.nativeElement.querySelectorAll('[data-chave-pix]').length).toBe(2);
  });

  it('editar carrega a conta; salvar envia os dados limpos e volta para a lista', async () => {
    const f = await montar('x');
    const c = f.componentInstance;
    expect(f.nativeElement.querySelector('h1').textContent).toContain('Editar conta bancária');
    expect(c.form.banco).toBe('BB'); expect(c.form.chavesPix.length).toBe(1);
    c.form.agencia = '  4321  '; c.form.dataEncerramento = '';
    const router = TestBed.inject(Router); spyOn(router, 'navigate').and.resolveTo(true);
    await c.salvar({ invalid: false } as never);
    expect(api.salvarConta).toHaveBeenCalledWith('x', jasmine.objectContaining({ agencia: '4321', dataEncerramento: null, titular: 'Paróquia' }));
    expect(router.navigate).toHaveBeenCalledWith(['/contas-bancarias']);
    expect(c.hasPendingChanges()).toBeFalse();
  });

  it('erro da API vira aviso e não sai da página', async () => {
    const f = await montar();
    api.salvarConta.and.rejectWith(new Error('Informe banco, agência, conta e titular.'));
    const router = TestBed.inject(Router); spyOn(router, 'navigate').and.resolveTo(true);
    await f.componentInstance.salvar({ invalid: false } as never);
    expect(avisar).toHaveBeenCalledWith('Informe banco, agência, conta e titular.');
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
