import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { DialogoService } from '../../../../shared/services/dialogo.service';
import { LayoutEscala } from '../../models/escala.model';
import { LayoutsEscalaService } from '../../services/layouts-escala.service';
import { LayoutsListComponent } from './layouts-list.component';

function layout(id: string, nome: string, extra: Partial<LayoutEscala> = {}): LayoutEscala {
  return { id, nome, tipo: 'MENSAL', colunas: [], ativo: true, sistema: false, ...extra };
}

describe('LayoutsListComponent', () => {
  let fixture: ComponentFixture<LayoutsListComponent>;
  let component: LayoutsListComponent;
  let servico: jasmine.SpyObj<LayoutsEscalaService>;

  beforeEach(async () => {
    servico = jasmine.createSpyObj('LayoutsEscalaService', ['listar', 'salvar', 'excluir', 'carregar']);
    servico.listar.and.resolveTo([
      layout('a', 'Padrão Mensal', { sistema: true, padrao: true, descricao: 'Formato clássico' }),
      layout('b', 'Matriz'),
      layout('c', 'Antigo', { ativo: false })
    ]);
    servico.salvar.and.callFake(async l => ({ ...layout('x', 'x'), ...l } as LayoutEscala));

    await TestBed.configureTestingModule({
      imports: [LayoutsListComponent],
      providers: [provideRouter([]), { provide: LayoutsEscalaService, useValue: servico }]
    }).compileComponents();

    fixture = TestBed.createComponent(LayoutsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('mostra todos por padrão, com a situação e o selo de layout padrão', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('tbody tr').length).toBe(3);
    expect(el.querySelectorAll('[data-situacao="ativo"]').length).toBe(2);
    expect(el.querySelectorAll('[data-situacao="inativo"]').length).toBe(1);
    expect(el.querySelectorAll('[data-selo-padrao]').length).toBe(1);
    expect(el.textContent).toContain('Formato clássico');
  });

  it('filtra por situação', () => {
    component.situacao = 'INATIVOS';
    component.filtrar();
    expect(component.layoutsFiltrados.map(l => l.nome)).toEqual(['Antigo']);
    component.situacao = 'ATIVOS';
    component.filtrar();
    expect(component.layoutsFiltrados.map(l => l.nome)).toEqual(['Padrão Mensal', 'Matriz']);
  });

  it('busca também pela descrição', () => {
    component.termo = 'clássico';
    component.filtrar();
    expect(component.layoutsFiltrados.map(l => l.nome)).toEqual(['Padrão Mensal']);
  });

  it('ativar um layout inativo salva com ativo=true sem pedir confirmação', async () => {
    const confirmar = spyOn(TestBed.inject(DialogoService), 'confirmar').and.resolveTo(true);
    await component.alternarAtivo(component.layouts.find(l => l.id === 'c')!);
    expect(confirmar).not.toHaveBeenCalled();
    expect(servico.salvar.calls.mostRecent().args[0].ativo).toBeTrue();
  });

  it('inativar pede confirmação e só salva se confirmar', async () => {
    const confirmar = spyOn(TestBed.inject(DialogoService), 'confirmar').and.resolveTo(false);
    await component.alternarAtivo(component.layouts.find(l => l.id === 'b')!);
    expect(servico.salvar).not.toHaveBeenCalled();

    confirmar.and.resolveTo(true);
    await component.alternarAtivo(component.layouts.find(l => l.id === 'b')!);
    expect(servico.salvar.calls.mostRecent().args[0].ativo).toBeFalse();
  });

  it('layout de sistema não tem o botão Excluir', () => {
    const linhas = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(linhas[0].textContent).not.toContain('Excluir');
    expect(linhas[1].textContent).toContain('Excluir');
  });
});
