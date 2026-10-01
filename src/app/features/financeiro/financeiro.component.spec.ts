import { TestBed, ComponentFixture } from '@angular/core/testing';
import { signal } from '@angular/core';
import { FinanceiroComponent } from './financeiro.component';
import { FinanceiroApiService } from './financeiro-api.service';
import { SessaoAtual } from '../../core/layout/sessao-atual';
import { DialogoService } from '../../shared/services/dialogo.service';
import { Movimento, Pagina } from './financeiro.models';

describe('Financeiro paroquial', () => {
  let fixture: ComponentFixture<FinanceiroComponent>;
  let api: jasmine.SpyObj<FinanceiroApiService>;
  const permissoes = signal<string[]>([]);
  beforeEach(async () => {
    permissoes.set(['FINANCEIRO']);
    api = jasmine.createSpyObj('FinanceiroApiService', ['contas','categorias','listar','resumo','salvarConta','salvarCategoria','salvarMovimento','baixar','acao']);
    api.contas.and.resolveTo([{ id:'c',nome:'Caixa',saldoInicial:100,dataSaldoInicial:'2026-01-01',ativo:true }]);
    api.categorias.and.resolveTo([{ id:'g',nome:'Doações',ativo:true }]);
    api.listar.and.resolveTo({ itens:[],total:0,pagina:0,tamanho:30 });
    api.resumo.and.resolveTo({ de:'2026-01-01',ate:'2026-01-31',receitas:50,despesas:20,resultado:30,saldoTotal:130,contas:[{ id:'c',nome:'Caixa',saldo:130 }] });
    await TestBed.configureTestingModule({ imports:[FinanceiroComponent], providers:[
      { provide:FinanceiroApiService,useValue:api }, { provide:SessaoAtual,useValue:{ permissoes } },
      { provide:DialogoService,useValue:{ avisar: jasmine.createSpy().and.resolveTo(), confirmar:jasmine.createSpy().and.resolveTo(true) } }
    ] }).compileComponents();
    fixture = TestBed.createComponent(FinanceiroComponent);
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
  });
  it('leitor vê resumo e não vê ações de escrita', () => {
    expect(fixture.nativeElement.textContent).toContain('Saldo por conta');
    expect(fixture.nativeElement.textContent).not.toContain('Novo lançamento');
    fixture.componentInstance.abrirConta(); expect(fixture.componentInstance.modal).toBeNull();
    fixture.componentInstance.abrirMovimento(); expect(fixture.componentInstance.modal).toBeNull();
  });
  it('permissão de criar não concede configuração de contas', () => {
    permissoes.set(['FINANCEIRO','FINANCEIRO_CRIAR']); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Novo lançamento');
    fixture.componentInstance.abrirMovimento(); expect(fixture.componentInstance.modal).toBe('movimento');
    fixture.componentInstance.modal = null; fixture.componentInstance.abrirConta(); expect(fixture.componentInstance.modal).toBeNull();
  });
  it('falha de carga limpa saldo antigo e expõe erro com opção de tentar novamente', async () => {
    api.resumo.and.rejectWith(new Error('Sem conexão'));
    await fixture.componentInstance.carregar(); fixture.detectChanges();
    expect(fixture.componentInstance.resumo).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Sem conexão');
  });
  it('resposta atrasada não sobrescreve a busca mais nova', async () => {
    let entregar!: (pagina: Pagina) => void;
    api.listar.and.returnValue(new Promise<Pagina>(resolve => entregar = resolve));
    const antiga = fixture.componentInstance.carregar();
    const m = { id:'novo',descricao:'Resultado novo' } as Movimento;
    api.listar.and.resolveTo({ itens:[m],total:1,pagina:0,tamanho:30 });
    await fixture.componentInstance.carregar();
    entregar({ itens:[],total:0,pagina:0,tamanho:30 }); await antiga;
    expect(fixture.componentInstance.movimentos[0].id).toBe('novo');
  });
});
