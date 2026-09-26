import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Voluntario } from '../../../features/voluntarios/models/voluntario.model';
import { VolunteerPickerComponent } from './volunteer-picker.component';

function voluntario(parcial: Partial<Voluntario> & { id: string; nome_completo: string }): Voluntario {
  return {
    data_nascimento: null,
    tipo: 'COROINHA',
    ativo: true,
    foto_path: null,
    etapa_catequese: null,
    eucaristia_ano: null,
    crisma_ano: null,
    rua: null,
    numero: null,
    bairro: null,
    telefone: null,
    celular: null,
    email: null,
    horario_estudo: null,
    observacoes: null,
    autoriza_whatsapp: true,
    funcoes_habilitadas: [],
    ...parcial
  };
}

describe('VolunteerPickerComponent', () => {
  let fixture: ComponentFixture<VolunteerPickerComponent>;
  let component: VolunteerPickerComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VolunteerPickerComponent]
    }).compileComponents();
    fixture = TestBed.createComponent(VolunteerPickerComponent);
    component = fixture.componentInstance;
    component.volunteers = [
      voluntario({ id: '1', nome_completo: 'Ana Souza', tipo: 'COROINHA' }),
      voluntario({ id: '2', nome_completo: 'Bruno Lima', tipo: 'ACOLITO' }),
      voluntario({ id: '3', nome_completo: 'Carla Dias', tipo: 'AMBOS', ativo: false }),
      voluntario({ id: '4', nome_completo: 'João da Silva', tipo: 'COROINHA' })
    ];
    fixture.detectChanges();
  });

  it('mostra só ativos e filtra por nome sem acento', () => {
    expect(component.filtered().map(v => v.id)).toEqual(['1', '2', '4']);
    component.search = 'JOAO';
    expect(component.filtered().map(v => v.id)).toEqual(['4']);
  });

  it('filtra por tipo e o segundo clique limpa o filtro', () => {
    component.setTipo('ACOLITO');
    expect(component.filtered().map(v => v.id)).toEqual(['2']);
    component.setTipo('ACOLITO');
    expect(component.filtered().map(v => v.id)).toEqual(['1', '2', '4']);
  });

  it('emite o id escolhido e fecha o painel', () => {
    const emit = spyOn(component.selectedIdChange, 'emit');
    component.open = true;
    component.choose(component.volunteers[0]);
    expect(emit).toHaveBeenCalledWith('1');
    expect(component.open).toBeFalse();
    expect(component.selectedName).toBe('Ana Souza');
  });

  it('não escolhe alguém já usado em outra vaga', () => {
    const emit = spyOn(component.selectedIdChange, 'emit');
    component.excludeIds = ['1'];
    component.choose(component.volunteers[0]);
    expect(emit).not.toHaveBeenCalled();
  });

  it('clicar de novo no selecionado limpa a vaga', () => {
    const emit = spyOn(component.selectedIdChange, 'emit');
    component.selectedId = '1';
    component.choose(component.volunteers[0]);
    expect(emit).toHaveBeenCalledWith(null);
  });

  it('clear emite null sem abrir o painel', () => {
    const emit = spyOn(component.selectedIdChange, 'emit');
    const event = new MouseEvent('click');
    spyOn(event, 'stopPropagation');
    component.clear(event);
    expect(emit).toHaveBeenCalledWith(null);
    expect(event.stopPropagation).toHaveBeenCalled();
  });

  it('painel é fixo junto ao botão (não é cortado pelo cartão) e abre para cima sem espaço embaixo', () => {
    const botao = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    spyOn(botao, 'getBoundingClientRect').and.returnValue(
      { top: 100, bottom: 140, left: 30, width: 200 } as DOMRect);
    component.toggleOpen();
    expect(component.painel).toEqual({ left: 30, width: 200, top: 144, bottom: null });

    component.open = false;
    (botao.getBoundingClientRect as jasmine.Spy).and.returnValue(
      { top: window.innerHeight - 50, bottom: window.innerHeight - 10, left: 30, width: 200 } as DOMRect);
    component.toggleOpen();
    expect(component.painel.top).toBeNull();
    expect(component.painel.bottom).toBe(54);
  });
});
