import { TestBed } from '@angular/core/testing';
import { Voluntario } from '../../voluntarios/models/voluntario.model';
import { ApoioEscala, EscalaEvento } from '../models/escala.model';
import { AindaNaoEscaladosComponent, montarPainel } from './ainda-nao-escalados.component';

const v = (id: string, nome: string) => ({ id, nome_completo: nome, tipo: 'COROINHA', ativo: true }) as Voluntario;
const apoio: ApoioEscala = { voluntarios: [
  { voluntarioId: 'c', situacao: 'COM_RESTRICAO', indisponiveis: [{ data: '2026-10-19', periodo: null }, { data: '2026-10-20', periodo: null }], irmaos: [] },
  { voluntarioId: 's', situacao: 'SEM_RESTRICAO', indisponiveis: [], irmaos: [] },
  { voluntarioId: 'p', situacao: 'PENDENTE', indisponiveis: [], irmaos: [] }
] };

describe('AindaNaoEscaladosComponent', () => {
  it('ordena com restrição, sem restrição e pendentes', () => {
    const r = montarPainel([v('p', 'Paulo'), v('s', 'Sara'), v('c', 'Caio')], apoio, [], '', '');
    expect(r.ainda.map(l => l.id)).toEqual(['c', 's', 'p']);
    expect(r.ainda[0].detalhe).toBe('não pode 19 e 20');
  });

  it('ao alocar alguém ele sai de "ainda não" e aparece em "já escalados" com a data', () => {
    const fixture = TestBed.createComponent(AindaNaoEscaladosComponent);
    const evento: EscalaEvento = { data: '2026-10-06', horario: '19:00:00', celebracao: 'Missa',
      vagas: [{ funcao: 'MISSAL', posicao: 1, voluntario_id: null }] };
    fixture.componentRef.setInput('volunteers', [v('c', 'Caio'), v('s', 'Sara')]);
    fixture.componentRef.setInput('apoio', apoio);
    fixture.componentRef.setInput('eventos', [evento]);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[data-ainda] [data-pessoa="c"]')).toBeTruthy();

    evento.vagas[0].voluntario_id = 'c';
    fixture.componentRef.setInput('revisao', 1);
    fixture.detectChanges();
    expect(el.querySelector('[data-ainda] [data-pessoa="c"]')).toBeNull();
    expect(el.querySelector('[data-ja] [data-pessoa="c"]')!.textContent).toContain('06/10');
  });
});
