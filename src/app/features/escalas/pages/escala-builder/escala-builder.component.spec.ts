import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { VoluntariosService } from '../../../voluntarios/services/voluntarios.service';
import { EscalaEvento } from '../../models/escala.model';
import { EscalasService } from '../../services/escalas.service';
import { ExportService } from '../../services/export.service';
import { DialogoService } from '../../../../shared/services/dialogo.service';
import { EscalaBuilderComponent } from './escala-builder.component';

function evento(vagas: { id: string; funcao?: string }[] = []): EscalaEvento {
  return {
    data: '2026-09-06',
    horario: '19:00:00',
    celebracao: 'Missa',
    vagas: vagas.map((v, i) => ({
      funcao: (v.funcao || 'VELA') as 'VELA',
      posicao: i + 1,
      voluntario_id: v.id || null
    }))
  };
}

describe('EscalaBuilderComponent', () => {
  let fixture: ComponentFixture<EscalaBuilderComponent>;
  let component: EscalaBuilderComponent;
  let escalas: jasmine.SpyObj<EscalasService>;

  beforeEach(async () => {
    escalas = jasmine.createSpyObj('EscalasService', [
      'getById', 'buildDefaultEvents', 'createEvent', 'save', 'setStatus', 'deleteCancelled'
    ]);
    escalas.buildDefaultEvents.and.returnValue([]);
    escalas.createEvent.and.callFake((tipo, data, horario, celebracao) => ({
      data,
      horario: horario.length === 5 ? `${horario}:00` : horario,
      celebracao,
      vagas: [{ funcao: 'MISSAL', posicao: 1, voluntario_id: null }]
    }));

    await TestBed.configureTestingModule({
      imports: [EscalaBuilderComponent],
      providers: [
        provideRouter([]),
        { provide: EscalasService, useValue: escalas },
        { provide: VoluntariosService, useValue: { active: () => Promise.resolve([]) } },
        { provide: ExportService, useValue: { exportPdf: () => Promise.resolve(), exportPng: () => Promise.resolve() } },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => null } } } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EscalaBuilderComponent);
    component = fixture.componentInstance;
    component.loading = false;
  });

  it('usedIds ignora a vaga atual e os vazios', () => {
    const ev = evento([{ id: 'a' }, { id: 'b' }, { id: '' }]);
    expect(component.usedIds(ev, 'a')).toEqual(['b']);
  });

  it('bloqueia a mesma pessoa duas vezes na missa', () => {
    const aviso = spyOn(TestBed.inject(DialogoService), 'avisar').and.resolveTo();
    const ev = evento([{ id: 'a' }, { id: '' }]);
    component.selectVolunteer(ev, ev.vagas[1], 'a');
    expect(aviso).toHaveBeenCalledWith('Esta pessoa já está alocada em outra função nesta mesma missa.');
    expect(ev.vagas[1].voluntario_id).toBeNull();
  });

  it('marca a grade como suja ao alocar alguém novo', () => {
    const ev = evento([{ id: '' }]);
    component.selectVolunteer(ev, ev.vagas[0], 'novo');
    expect(ev.vagas[0].voluntario_id).toBe('novo');
    expect(component.eventsDirty).toBeTrue();
    expect(component.hasPendingChanges()).toBeTrue();
  });

  it('não adiciona dia repetido no mesmo horário', () => {
    const aviso = spyOn(TestBed.inject(DialogoService), 'avisar').and.resolveTo();
    component.events = [evento()];
    component.addDate = '2026-09-06';
    component.addTime = '19:00';
    component.addDay();
    expect(aviso).toHaveBeenCalledWith('Já existe uma celebração neste dia e horário.');
    expect(component.events.length).toBe(1);
  });

  it('adiciona um dia novo e ordena', () => {
    component.events = [evento()];
    component.addDate = '2026-09-05';
    component.addTime = '19:00';
    component.addCelebration = 'Vigília';
    component.addDay();
    expect(component.events.map(e => e.data)).toEqual(['2026-09-05', '2026-09-06']);
    expect(escalas.createEvent).toHaveBeenCalled();
  });

  it('conta vagas preenchidas', () => {
    component.events = [evento([{ id: 'a' }, { id: '' }]), evento([{ id: 'b' }])];
    expect(component.totalSlots()).toBe(3);
    expect(component.filledCount()).toBe(2);
  });

  it('escala finalizada não tem alteração pendente', () => {
    component.status = 'FINALIZADA';
    component.eventsDirty = true;
    expect(component.hasPendingChanges()).toBeFalse();
    expect(component.readOnly).toBeTrue();
  });
});
