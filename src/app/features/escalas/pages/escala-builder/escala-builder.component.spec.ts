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

  it('referência aparece no topo da grade semanal com o selo e não conta nas vagas', () => {
    component.form.controls.tipo.setValue('SEMANAL');
    const real = { ...evento([{ id: 'a', funcao: 'MISSAL' }]), data: '2026-10-01' };
    const ref = { ...evento([{ id: 'b', funcao: 'MISSAL' }]), data: '2026-09-29', referencia: true };
    component.events = [real, ref];
    fixture.detectChanges();
    const linhas = fixture.nativeElement.querySelectorAll('tbody tr');
    expect(linhas[0].getAttribute('data-referencia')).toBe('2026-09-29');
    expect(linhas[0].querySelector('[data-selo-referencia]').textContent).toContain('Referência de setembro');
    expect(fixture.nativeElement.querySelector('[data-aviso-referencias]')).toBeTruthy();
    expect(component.totalSlots()).toBe(1);
    expect(component.filledCount()).toBe(1);
  });

  it('finalizar com referência pede confirmação e salva sem ela', async () => {
    component.form.controls.tipo.setValue('SEMANAL');
    component.form.controls.titulo.setValue('Escala Semanal - Outubro 2026');
    component.events = [
      { ...evento([{ id: 'a', funcao: 'MISSAL' }]), data: '2026-10-01' },
      { ...evento([{ id: 'b', funcao: 'MISSAL' }]), data: '2026-09-29', referencia: true }
    ];
    const confirmar = spyOn(TestBed.inject(DialogoService), 'confirmar').and.resolveTo(true);
    escalas.save.and.callFake(async (p: any) => ({ ...p, id: 'n1', status: 'FINALIZADA', eventos: p.eventos }));
    await component.finalize();
    expect(confirmar.calls.first().args[0].mensagem).toContain('1 linha(s) de referência');
    const payload = escalas.save.calls.mostRecent().args[0];
    expect(payload.eventos.length).toBe(1);
    expect(payload.eventos.some((e: EscalaEvento) => e.referencia)).toBeFalse();
  });

  function semanaCheia(): EscalaEvento[] {
    const eventos: EscalaEvento[] = [];
    for (let d = 1; d <= 31 && eventos.length < 23; d++) {
      const iso = `2026-10-${String(d).padStart(2, '0')}`;
      const dow = new Date(`${iso}T12:00:00`).getDay();
      if (dow === 0 || dow === 6) continue;
      eventos.push({ data: iso, horario: '19:00:00', celebracao: 'Missa', vagas: [
        { funcao: 'MISSAL', posicao: 1, voluntario_id: null }, { funcao: 'CRUZ', posicao: 1, voluntario_id: null },
        { funcao: 'CREDENCIA', posicao: 1, voluntario_id: null }, { funcao: 'VELA', posicao: 1, voluntario_id: null },
        { funcao: 'VELA', posicao: 2, voluntario_id: null }, { funcao: 'SINO', posicao: 1, voluntario_id: null },
        { funcao: 'SINO', posicao: 2, voluntario_id: null }] });
    }
    return eventos;
  }

  it('semanal cheia (22 dias úteis de outubro): o template não chama usedIds nem slotFor a cada detecção', () => {
    component.form.setValue({ titulo: 'Semanal', tipo: 'SEMANAL', ano: 2026, mes: 10, observacao: '', layoutId: null });
    component.events = semanaCheia();
    fixture.detectChanges();
    const usados = spyOn(component, 'usedIds').and.callThrough();
    const slot = spyOn(component, 'slotFor').and.callThrough();
    fixture.detectChanges();
    fixture.detectChanges();
    expect(usados).not.toHaveBeenCalled();
    expect(slot).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelectorAll('app-volunteer-picker').length).toBe(component.events.length * 7);
    expect(fixture.nativeElement.querySelectorAll('[data-separador-semana]').length).toBeGreaterThan(2);
  });

  it('escala finalizada mostra só os nomes, sem nenhum seletor', () => {
    component.form.setValue({ titulo: 'Semanal', tipo: 'SEMANAL', ano: 2026, mes: 10, observacao: '', layoutId: null });
    component.status = 'FINALIZADA';
    component.events = semanaCheia();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('app-volunteer-picker').length).toBe(0);
  });

  it('alocar alguém atualiza a contagem na hora', () => {
    component.events = [evento([{ id: '' }, { id: '' }])];
    expect(component.filledCount()).toBe(0);
    component.selectVolunteer(component.events[0], component.events[0].vagas[0], 'x');
    expect(component.filledCount()).toBe(1);
    expect(component.totalSlots()).toBe(2);
  });

  it('mensal: vaga de sábado 03/10 mostra ⛔ para quem não pode em 03/10 e sugere o irmão', () => {
    component.form.setValue({ titulo: 'Mensal', tipo: 'MENSAL', ano: 2026, mes: 10, observacao: '', layoutId: null });
    component.volunteers = [
      { id: 'a', nome_completo: 'Ana', tipo: 'COROINHA', ativo: true },
      { id: 'b', nome_completo: 'Bruno', tipo: 'COROINHA', ativo: true },
      { id: 'c', nome_completo: 'Caio', tipo: 'COROINHA', ativo: true }
    ] as any;
    component.apoio = { voluntarios: [
      { voluntarioId: 'a', situacao: 'SEM_RESTRICAO', indisponiveis: [], irmaos: ['b'] },
      { voluntarioId: 'b', situacao: 'SEM_RESTRICAO', indisponiveis: [], irmaos: ['a'] },
      { voluntarioId: 'c', situacao: 'COM_RESTRICAO', indisponiveis: [{ data: '2026-10-03', periodo: null }], irmaos: [] }
    ] };
    component.events = [{ ...evento([{ id: '', funcao: 'MISSAL' }, { id: '', funcao: 'CRUZ' }]), data: '2026-10-03' }];
    expect(component.linhas[0].marcadores!['c'].indisponivel).toBeTrue();

    const ev = component.events[0];
    component.selectVolunteer(ev, ev.vagas[0], 'a');
    fixture.detectChanges();
    expect(component.sugestaoIrmao?.nomeIrmao).toBe('Bruno');
    expect(fixture.nativeElement.querySelector('[data-sugestao-irmao]')).toBeTruthy();
    expect(ev.vagas[1].voluntario_id).toBeNull();

    component.colocarIrmao(ev);
    expect(ev.vagas[1].voluntario_id).toBe('b');
    expect(component.linhas[0].marcadores!['a'].irmaoNaMissa).toBe('Bruno');
  });
});
