import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PlanoContasListaComponent } from './plano-contas-lista.component';
import { Categoria } from './financeiro.models';

const g = (id: string, nome: string, tipo: 'RECEITA' | 'DESPESA', ativo = true): Categoria => ({ id, nome, ativo, tipo, grupoId: null, ehGrupo: true });
const c = (id: string, nome: string, grupo: Categoria, ativo = true): Categoria => ({ id, nome, ativo, tipo: grupo.tipo, grupoId: grupo.id, ehGrupo: false });

describe('Plano de contas em árvore', () => {
  let fixture: ComponentFixture<PlanoContasListaComponent>;
  const fixas = g('1', 'Despesas fixas', 'DESPESA');
  const receitas = g('2', 'Receitas', 'RECEITA');
  const lista = [fixas, receitas, c('a', 'Energia', fixas), c('b', 'Água', fixas), c('d', 'Antiga', fixas, false), c('r', 'Doações', receitas)];
  const texto = () => fixture.nativeElement.textContent as string;
  const clicar = (seletor: string) => { (fixture.nativeElement.querySelector(seletor) as HTMLElement).click(); fixture.detectChanges(); };
  const contas = () => Array.from(fixture.nativeElement.querySelectorAll('[data-conta]') as NodeListOf<HTMLElement>);

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [PlanoContasListaComponent] }).compileComponents();
    fixture = TestBed.createComponent(PlanoContasListaComponent);
    fixture.componentRef.setInput('categorias', lista);
    fixture.componentRef.setInput('podeConfigurar', true);
    fixture.detectChanges();
  });

  it('separa saídas e entradas, e os grupos começam recolhidos', () => {
    expect(texto()).toContain('Saídas (débito)');
    expect(texto()).toContain('Entradas (crédito)');
    expect(texto()).toContain('Despesas fixas');
    expect(texto()).toContain('2 conta(s) contábil(is)');
    expect(contas().length).toBe(0);
  });

  it('expandir um grupo mostra só as contas ativas; "Todos" inclui as inativas', () => {
    clicar('[data-grupo] button');
    expect(contas().map(e => e.querySelector('td')!.textContent!.trim())).toEqual(['Água', 'Energia']);
    fixture.componentInstance.situacao.set('TODOS');
    fixture.detectChanges();
    expect(contas().length).toBe(3);
    fixture.componentInstance.situacao.set('INATIVO');
    fixture.detectChanges();
    expect(texto()).toContain('Antiga');
    expect(texto()).not.toContain('Energia');
  });

  it('a busca ignora acento e caixa e abre o grupo da conta encontrada', () => {
    fixture.componentInstance.busca.set('AGUA');
    fixture.detectChanges();
    expect(texto()).toContain('Água');
    expect(texto()).not.toContain('Energia');
    expect(texto()).not.toContain('Doações');
    fixture.componentInstance.busca.set('zzz');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('[data-secao-vazia]').length).toBe(2);
  });

  it('expandir tudo e recolher tudo', () => {
    clicar('[data-alternar-todos]');
    expect(contas().length).toBe(3);
    clicar('[data-alternar-todos]');
    expect(contas().length).toBe(0);
  });

  it('emite as ações e esconde os botões de quem só lê', () => {
    const emitidos: string[] = [];
    fixture.componentInstance.editarGrupo.subscribe(x => emitidos.push('grupo:' + x.nome));
    fixture.componentInstance.novaConta.subscribe(x => emitidos.push('nova:' + x.nome));
    const botoes = fixture.nativeElement.querySelectorAll('[data-grupo] .btn-secondary') as NodeListOf<HTMLElement>;
    botoes[0].click();
    botoes[1].click();
    expect(emitidos).toEqual(['grupo:Despesas fixas', 'nova:Despesas fixas']);
    fixture.componentRef.setInput('podeConfigurar', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('[data-grupo] .btn-secondary').length).toBe(0);
  });

  it('sem nenhum grupo oferece criar o primeiro e emite o tipo da área', () => {
    fixture.componentRef.setInput('categorias', []);
    fixture.detectChanges();
    const tipos: string[] = [];
    fixture.componentInstance.novoGrupo.subscribe(t => tipos.push(t));
    (fixture.nativeElement.querySelectorAll('[data-secao-vazia] button')[0] as HTMLElement).click();
    expect(tipos).toEqual(['DESPESA']);
  });
});
