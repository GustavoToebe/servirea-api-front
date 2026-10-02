import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { NgForm } from '@angular/forms';
import { EstoqueComponent } from './estoque.component';
import { EstoqueApiService, ItemEstoque } from './estoque-api.service';
import { SessaoAtual } from '../../core/layout/sessao-atual';
import { DialogoService } from '../../shared/services/dialogo.service';
describe('Estoque: registro seguro no formulário', () => {
    let api: jasmine.SpyObj<EstoqueApiService>;
    let perms: string[];
    const item: ItemEstoque = { id: 'i', versao: 2, nome: 'Velas', codigo: 'V', tipo: 'CONSUMIVEL', unidade: 'unidade', local: null, responsavelUsuarioId: null, ativo: true, saldo: 10 };
    const form = { invalid: false } as NgForm;
    beforeEach(() => { perms = ['ESTOQUE_EDITAR', 'ESTOQUE_MOVIMENTAR', 'ESTOQUE_AJUSTAR']; api = jasmine.createSpyObj('api', ['listar', 'buscar', 'historico', 'responsaveis', 'salvar', 'movimentar']); api.listar.and.returnValue(of({ itens: [], total: 0, pagina: 0, tamanho: 30 })); api.buscar.and.returnValue(of(item)); api.historico.and.returnValue(of({ itens: [], total: 0, pagina: 0, tamanho: 30 })); api.responsaveis.and.returnValue(of([])); TestBed.configureTestingModule({ imports: [EstoqueComponent], providers: [{ provide: EstoqueApiService, useValue: api }, { provide: SessaoAtual, useValue: { permissoes: () => perms } }, { provide: DialogoService, useValue: { confirmar: () => Promise.resolve(true), avisar: () => Promise.resolve() } }] }); });
    it('falha e repetição conservam a mesma chave e quantidade', async () => { const f = TestBed.createComponent(EstoqueComponent); const c = f.componentInstance; await c.abrir(item); c.iniciarMovimento(); c.movimento!.motivo = 'Recebimento'; api.movimentar.and.returnValue(throwError(() => new Error('rede'))); await c.registrar(form); const original = api.movimentar.calls.mostRecent().args[1]; c.movimento!.quantidade = 999; await c.registrar(form); expect(api.movimentar.calls.mostRecent().args[1]).toEqual(original); expect(c.pedidoPendente()).toBeTrue(); expect(c.erro()).toContain('rede'); });
    it('sem ação de ajuste não registra ajuste mesmo por chamada direta', async () => { const c = TestBed.createComponent(EstoqueComponent).componentInstance; await c.abrir(item); c.iniciarMovimento(); c.movimento!.tipo = 'AJUSTE'; perms = ['ESTOQUE_MOVIMENTAR']; await c.registrar(form); expect(api.movimentar).not.toHaveBeenCalled(); });
    it('formulário não envia alteração de cadastro enquanto há movimento', async () => { const c = TestBed.createComponent(EstoqueComponent).componentInstance; await c.abrir(item); c.iniciarMovimento(); c.salvar(form); expect(api.salvar).not.toHaveBeenCalled(); });
    it('leitura não recebe botões de escrita', async () => { perms = []; const f = TestBed.createComponent(EstoqueComponent); f.detectChanges(); await f.componentInstance.abrir(item); f.detectChanges(); expect(f.nativeElement.textContent).not.toContain('Registrar movimento'); expect(f.nativeElement.textContent).not.toContain('Novo item'); });
});
