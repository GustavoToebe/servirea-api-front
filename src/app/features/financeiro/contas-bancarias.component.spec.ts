import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ContasBancariasComponent } from './contas-bancarias.component';
import { FinanceiroApiService } from './financeiro-api.service';
import { SessaoAtual } from '../../core/layout/sessao-atual';
import { DialogoService } from '../../shared/services/dialogo.service';

describe('ContasBancariasComponent', () => {
  const permissoes = signal<string[]>(['FINANCEIRO', 'FINANCEIRO_CONFIGURAR']);
  let api: jasmine.SpyObj<FinanceiroApiService>;

  async function montar() {
    api = jasmine.createSpyObj('FinanceiroApiService', ['contas', 'salvarConta']);
    api.contas.and.resolveTo([
      { id: 'a', nome: 'Caixa', saldoInicial: 100, dataSaldoInicial: '2026-01-01', ativo: true },
      { id: 'b', nome: 'Banco antigo', saldoInicial: 0, dataSaldoInicial: '2025-01-01', ativo: false },
    ]);
    await TestBed.configureTestingModule({ imports: [ContasBancariasComponent], providers: [provideRouter([]),
      { provide: FinanceiroApiService, useValue: api }, { provide: SessaoAtual, useValue: { permissoes } },
      { provide: DialogoService, useValue: { avisar: jasmine.createSpy().and.resolveTo(), confirmar: jasmine.createSpy().and.resolveTo(true) } }] }).compileComponents();
    const f = TestBed.createComponent(ContasBancariasComponent);
    f.detectChanges(); await f.whenStable(); f.detectChanges();
    return f;
  }

  it('começa só com as contas ativas e mostra o filtro aplicado', async () => {
    const f = await montar();
    expect(f.nativeElement.querySelector('[data-contas]').textContent).toContain('Caixa');
    expect(f.nativeElement.querySelector('[data-contas]').textContent).not.toContain('Banco antigo');
    expect(f.nativeElement.textContent).toContain('Situação: Ativa');
    expect(f.nativeElement.querySelector('h1').textContent).toContain('Contas bancárias');
  });

  it('remover o filtro mostra também as inativas; a busca ignora acento e caixa', async () => {
    const f = await montar();
    f.componentInstance.remover('situacao'); f.detectChanges();
    expect(f.componentInstance.visiveis().length).toBe(2);
    f.componentInstance.busca = 'BANCO'; f.componentInstance.aplicar();
    expect(f.componentInstance.visiveis().map(c => c.nome)).toEqual(['Banco antigo']);
  });

  it('só quem configura vê Nova conta e abre o formulário; salvar envia e recarrega', async () => {
    const f = await montar();
    expect(f.nativeElement.querySelector('[data-nova-conta]')).not.toBeNull();
    f.componentInstance.abrir(); expect(f.componentInstance.modal).toBeTrue();
    f.componentInstance.form.nome = 'Poupança';
    api.salvarConta.and.resolveTo({ id: 'n', nome: 'Poupança', saldoInicial: 0, dataSaldoInicial: '2026-01-01', ativo: true });
    await f.componentInstance.salvar({ invalid: false } as never);
    expect(api.salvarConta).toHaveBeenCalledWith(null, jasmine.objectContaining({ nome: 'Poupança' }));
    expect(api.contas).toHaveBeenCalledTimes(2);
    permissoes.set(['FINANCEIRO']); f.componentInstance.modal = false; f.componentInstance.abrir();
    expect(f.componentInstance.modal).toBeFalse();
    permissoes.set(['FINANCEIRO', 'FINANCEIRO_CONFIGURAR']);
  });
});
