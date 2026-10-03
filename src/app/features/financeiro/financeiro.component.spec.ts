import { provideRouter } from '@angular/router';
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
    api.categorias.and.resolveTo([
      { id:'gr',nome:'Receitas',ativo:true,tipo:'RECEITA',grupoId:null,ehGrupo:true },
      { id:'g',nome:'Doações',ativo:true,tipo:'RECEITA',grupoId:'gr',ehGrupo:false },
      { id:'gd',nome:'Despesas fixas',ativo:true,tipo:'DESPESA',grupoId:null,ehGrupo:true },
      { id:'e',nome:'Energia',ativo:true,tipo:'DESPESA',grupoId:'gd',ehGrupo:false },
      { id:'gi',nome:'Antigo',ativo:false,tipo:'DESPESA',grupoId:null,ehGrupo:true },
      { id:'ci',nome:'Conta de grupo inativo',ativo:true,tipo:'DESPESA',grupoId:'gi',ehGrupo:false }
    ]);
    api.listar.and.resolveTo({ itens:[],total:0,pagina:0,tamanho:30 });
    api.resumo.and.resolveTo({ de:'2026-01-01',ate:'2026-01-31',receitas:50,despesas:20,resultado:30,saldoTotal:130,contas:[{ id:'c',nome:'Caixa',saldo:130 }] });
    await TestBed.configureTestingModule({ imports:[FinanceiroComponent], providers:[provideRouter([]),
      { provide:FinanceiroApiService,useValue:api }, { provide:SessaoAtual,useValue:{ permissoes } },
      { provide:DialogoService,useValue:{ avisar: jasmine.createSpy().and.resolveTo(), confirmar:jasmine.createSpy().and.resolveTo(true) } }
    ] }).compileComponents();
    fixture = TestBed.createComponent(FinanceiroComponent);
    fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges();
  });
  it('leitor vê resumo e não vê ações de escrita', () => {
    expect(fixture.nativeElement.textContent).toContain('Saldo por conta');
    expect(fixture.nativeElement.textContent).not.toContain('Novo lançamento');
    fixture.componentInstance.abrirMovimento(); expect(fixture.componentInstance.modal).toBeNull();
  });
  it('permissão de criar não concede configuração de contas', () => {
    permissoes.set(['FINANCEIRO','FINANCEIRO_CRIAR']); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Novo lançamento');
    fixture.componentInstance.abrirMovimento(); expect(fixture.componentInstance.modal).toBe('movimento');
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
  it('lançamento só oferece contas contábeis ativas do tipo escolhido e de grupo ativo', () => {
    const c = fixture.componentInstance;
    expect(c.contasParaLancamento('RECEITA').map(g => g.contas.map(x => x.nome))).toEqual([['Doações']]);
    expect(c.contasParaLancamento('DESPESA').map(g => g.contas.map(x => x.nome))).toEqual([['Energia']]);
    expect(c.rotuloContaContabil('e')).toBe('Despesas fixas › Energia');
  });
  it('trocar o tipo do lançamento limpa a conta contábil do outro tipo', () => {
    const c = fixture.componentInstance;
    c.movimentoForm.tipo = 'RECEITA'; c.movimentoForm.categoriaId = 'g';
    c.trocouTipoLancamento(); expect(c.movimentoForm.categoriaId).toBe('g');
    c.movimentoForm.tipo = 'DESPESA'; c.trocouTipoLancamento(); expect(c.movimentoForm.categoriaId).toBe('');
  });
  it('plano de contas: só quem configura abre grupo e conta; a conta herda o tipo do grupo', () => {
    const c = fixture.componentInstance;
    c.abrirGrupo(); expect(c.modal).toBeNull();
    permissoes.set(['FINANCEIRO','FINANCEIRO_CONFIGURAR']);
    c.abrirGrupo(); expect(c.modal as string | null).toBe('grupo'); expect(c.categoriaForm.grupoId).toBeNull();
    c.modal = null; c.abrirContaContabil(undefined, c.categorias.find(x => x.id === 'gd')); expect(c.modal as string | null).toBe('contaContabil');
    expect(c.categoriaForm.grupoId).toBe('gd'); expect(c.categoriaForm.tipo).toBe('DESPESA');
    c.categoriaForm.grupoId = 'gr'; c.trocouGrupo(); expect(c.categoriaForm.tipo).toBe('RECEITA');
  });
  it('grupo com contas não deixa trocar o tipo', () => {
    permissoes.set(['FINANCEIRO','FINANCEIRO_CONFIGURAR']);
    const c = fixture.componentInstance;
    c.abrirGrupo(c.categorias.find(x => x.id === 'gd')); expect(c.tipoTravado).toBeTrue();
    c.modal = null; c.abrirGrupo({ id:'novo',nome:'Vazio',ativo:true,tipo:'DESPESA',grupoId:null,ehGrupo:true }); expect(c.tipoTravado).toBeFalse();
  });
  it('a aba do plano de contas aparece com esse nome e salvar grupo envia grupoId nulo', async () => {
    permissoes.set(['FINANCEIRO','FINANCEIRO_CONFIGURAR']); fixture.detectChanges();
    fixture.componentInstance.mudarAba('plano'); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Plano de contas');
    expect(fixture.nativeElement.textContent).toContain('Novo grupo');
    api.salvarCategoria.and.resolveTo({ id:'n',nome:'Novo',ativo:true,tipo:'DESPESA',grupoId:null,ehGrupo:true });
    const c = fixture.componentInstance; c.abrirGrupo(); c.categoriaForm.nome = 'Novo'; c.categoriaForm.grupoId = 'lixo';
    fixture.detectChanges();
    await c.salvar({ invalid: false } as never);
    expect(api.salvarCategoria).toHaveBeenCalledWith(null, jasmine.objectContaining({ nome: 'Novo', tipo: 'DESPESA', grupoId: null }));
  });
});
