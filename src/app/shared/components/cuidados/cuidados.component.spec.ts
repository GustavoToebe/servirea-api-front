import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CuidadosComponent } from './cuidados.component';
import { FormsModule } from '@angular/forms';

describe('CuidadosComponent', () => {
  let component: CuidadosComponent;
  let fixture: ComponentFixture<CuidadosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CuidadosComponent, FormsModule]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CuidadosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('clicar "Sim" + cartão TEA + nível 2 → valor emitido {condicoes:[\'TEA\'], nivelSuporteTea:2, ...}', () => {
    spyOn(component, 'onChange');
    
    component.setAberto(true);
    fixture.detectChanges();
    
    component.toggleCondicao('TEA');
    component.value.nivelSuporteTea = 2;
    component.onModelChange();
    
    expect(component.onChange).toHaveBeenCalledWith(jasmine.objectContaining({
      condicoes: ['TEA'],
      nivelSuporteTea: 2
    }));
  });

  it('desmarcar TEA zera o nivel', () => {
    component.value = { condicoes: ['TEA'], nivelSuporteTea: 2, condicaoOutra: '', cuidados: '' };
    component.toggleCondicao('TEA');
    
    expect(component.value.condicoes).not.toContain('TEA');
    expect(component.value.nivelSuporteTea).toBeNull();
  });

  it('"Não, tudo certo" limpa o valor', () => {
    component.value = { condicoes: ['TEA'], nivelSuporteTea: 2, condicaoOutra: 'Teste', cuidados: 'Algo' };
    component.setAberto(false);
    
    expect(component.value.condicoes.length).toBe(0);
    expect(component.value.nivelSuporteTea).toBeNull();
    expect(component.value.condicaoOutra).toBe('');
    expect(component.value.cuidados).toBe('');
  });
});
