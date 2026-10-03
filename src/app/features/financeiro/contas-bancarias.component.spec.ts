import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { ContasBancariasComponent } from './contas-bancarias.component';
import { FinanceiroApiService } from './financeiro-api.service';
import { SessaoAtual } from '../../core/layout/sessao-atual';

describe('ContasBancariasComponent', () => {
  const permissoes = signal<string[]>(['FINANCEIRO', 'FINANCEIRO_CONFIGURAR']);

  async function montar() {
    const api = jasmine.createSpyObj('FinanceiroApiService', ['contas']);
    api.contas.and.resolveTo([
      { id: 'a', nome: 'Caixa', saldoInicial: 100, dataSaldoInicial: '2026-01-01', ativo: true, tipoConta: 'CAIXA' },
      { id: 'b', nome: 'Principal', saldoInicial: 0, dataSaldoInicial: '2025-01-01', ativo: false, tipoConta: 'CORRENTE', banco: 'Banco do Brasil', titular: 'Paróquia', agencia: '1234', numeroConta: '98765-0' },
    ]);
    await TestBed.configureTestingModule({ imports: [ContasBancariasComponent], providers: [provideRouter([]),
      { provide: FinanceiroApiService, useValue: api }, { provide: SessaoAtual, useValue: { permissoes } }] }).compileComponents();
    const f = TestBed.createComponent(ContasBancariasComponent);
    f.detectChanges(); await f.whenStable(); f.detectChanges();
    return f;
  }

  it('começa só com as contas ativas, mostra o filtro aplicado e as colunas do banco', async () => {
    const f = await montar();
    const tabela = f.nativeElement.querySelector('[data-contas]').textContent;
    expect(tabela).toContain('Caixa');
    expect(tabela).not.toContain('Principal');
    for (const coluna of ['Banco', 'Titular', 'Agência', 'Nº da conta']) expect(tabela).toContain(coluna);
    expect(f.nativeElement.textContent).toContain('Situação: Ativa');
    expect(f.nativeElement.querySelector('h1').textContent).toContain('Contas bancárias');
  });

  it('remover o filtro mostra as inativas; a busca olha banco e titular, sem acento e caixa', async () => {
    const f = await montar();
    f.componentInstance.remover('situacao'); f.detectChanges();
    expect(f.componentInstance.visiveis().length).toBe(2);
    f.componentInstance.busca = 'PAROQUIA'; f.componentInstance.aplicar();
    expect(f.componentInstance.visiveis().map(c => c.nome)).toEqual(['Principal']);
    f.componentInstance.busca = 'brasil'; f.componentInstance.aplicar();
    expect(f.componentInstance.visiveis().map(c => c.nome)).toEqual(['Principal']);
  });

  it('só quem configura vê Nova conta (link para a página) e Editar', async () => {
    const f = await montar();
    expect(f.nativeElement.querySelector('[data-nova-conta]').getAttribute('href')).toBe('/contas-bancarias/nova');
    permissoes.set(['FINANCEIRO']); f.detectChanges();
    expect(f.nativeElement.querySelector('[data-nova-conta]')).toBeNull();
    permissoes.set(['FINANCEIRO', 'FINANCEIRO_CONFIGURAR']);
  });
});
