import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { BarraFiltrosComponent, OpcaoMenu, FiltroAtivo } from './barra-filtros.component';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-test-host',
  standalone: true,
  imports: [BarraFiltrosComponent, FormsModule],
  template: `
    <app-barra-filtros
      [placeholder]="placeholder"
      [(termo)]="termo"
      [opcoes]="opcoes"
      [filtrosAtivos]="filtros"
      [temFiltros]="temFiltros"
      [semBusca]="semBusca"
      (buscar)="onBuscar()"
      (opcao)="onOpcao($event)"
      (removerFiltro)="onRemoverFiltro($event)"
      (removerTodos)="onRemoverTodos()">
      <div class="conteudo-projetado">Painel Teste</div>
    </app-barra-filtros>
  `
})
class TestHostComponent {
  @ViewChild(BarraFiltrosComponent) barra!: BarraFiltrosComponent;

  placeholder = 'Busca teste';
  termo = '';
  opcoes: OpcaoMenu[] = [];
  filtros: FiltroAtivo[] = [];
  temFiltros = true;
  semBusca = false;

  buscarEmitido = 0;
  opcaoEmitida = '';
  filtroRemovido = '';
  todosRemovidos = 0;

  onBuscar() { this.buscarEmitido++; }
  onOpcao(id: string) { this.opcaoEmitida = id; }
  onRemoverFiltro(chave: string) { this.filtroRemovido = chave; }
  onRemoverTodos() { this.todosRemovidos++; }
}

describe('BarraFiltrosComponent', () => {
  let component: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('deve criar e projetar conteúdo no painel ao abrir', () => {
    expect(fixture.debugElement.query(By.css('.conteudo-projetado'))).toBeNull();
    const seta = fixture.debugElement.query(By.css('[data-alternar-filtros]')).nativeElement;
    seta.click();
    fixture.detectChanges();

    expect(component.barra.aberto).toBeTrue();
    expect(fixture.debugElement.query(By.css('.conteudo-projetado'))).toBeTruthy();
  });

  it('"Cancelar" fecha sem emitir buscar', () => {
    component.barra.aberto = true;
    fixture.detectChanges();

    const acao = fixture.debugElement.query(By.css('[data-buscar]')).nativeElement;
    expect(acao.textContent.trim()).toBe('Cancelar');
    acao.click();
    fixture.detectChanges();

    expect(component.barra.aberto).toBeFalse();
    expect(component.buscarEmitido).toBe(0);
  });

  it('"Buscar" do painel emite e fecha', () => {
    component.barra.aberto = true;
    fixture.detectChanges();

    const buscarPainel = fixture.debugElement.query(By.css('[data-buscar-painel]')).nativeElement;
    buscarPainel.click();
    fixture.detectChanges();

    expect(component.buscarEmitido).toBe(1);
    expect(component.barra.aberto).toBeFalse();
  });

  it('opção desabilitada não emite', () => {
    component.opcoes = [
      { id: '1', rotulo: 'Op 1' },
      { id: '2', rotulo: 'Op 2', desabilitada: true }
    ];
    fixture.detectChanges();

    const btnOpcoes = fixture.debugElement.query(By.css('[data-opcoes]')).nativeElement;
    btnOpcoes.click();
    fixture.detectChanges();

    const op2 = fixture.debugElement.query(By.css('[data-opcao="2"]')).nativeElement;
    op2.click();
    fixture.detectChanges();

    expect(component.opcaoEmitida).toBe('');

    const op1 = fixture.debugElement.query(By.css('[data-opcao="1"]')).nativeElement;
    op1.click();
    fixture.detectChanges();

    expect(component.opcaoEmitida).toBe('1');
  });

  it('× emite a chave certa', () => {
    component.filtros = [{ chave: 'tipo', rotulo: 'Tipo: X' }];
    fixture.detectChanges();

    const btnX = fixture.debugElement.query(By.css('[data-remover-filtro="tipo"]')).nativeElement;
    btnX.click();
    fixture.detectChanges();

    expect(component.filtroRemovido).toBe('tipo');
  });
});
