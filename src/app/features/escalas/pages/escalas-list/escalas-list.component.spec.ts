import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EscalaDetalhe, EscalaEvento } from '../../models/escala.model';
import { EscalasService } from '../../services/escalas.service';
import { EscalasListComponent } from './escalas-list.component';

describe('EscalasListComponent', () => {
  const evento = (data: string, celebracao: string, cheias: number, referencia = false): EscalaEvento => ({
    data, horario: '19:00:00', celebracao, referencia,
    vagas: Array.from({ length: 7 }, (_, i) => ({
      funcao: 'VELA' as const, posicao: i + 1,
      voluntario_id: i < cheias ? `v${i}` : null, voluntario: i < cheias ? { id: `v${i}`, nome_completo: `Pessoa ${i}` } : null
    }))
  });
  const semanal: EscalaDetalhe = {
    id: 's1', titulo: 'Escala Semanal - Setembro 2026', tipo: 'SEMANAL', ano: 2026, mes: 9, status: 'FINALIZADA', observacao: null,
    eventos: [evento('2026-09-01', 'Missa', 6), evento('2026-09-02', 'Missa', 7), evento('2026-08-31', 'Missa', 7, true)]
  };
  const mensal: EscalaDetalhe = {
    id: 'm1', titulo: 'Escala Mensal - Setembro 2026', tipo: 'MENSAL', ano: 2026, mes: 9, status: 'RASCUNHO', observacao: null,
    eventos: [evento('2026-09-06', 'Missa', 0), evento('2026-09-13', 'Exaltação da Santa Cruz', 7)]
  };

  async function montar() {
    TestBed.configureTestingModule({
      imports: [EscalasListComponent],
      providers: [provideHttpClient(), provideRouter([]),
        { provide: EscalasService, useValue: { list: () => Promise.resolve([semanal, mensal]), emCache: () => null } }]
    });
    const fixture = TestBed.createComponent(EscalasListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('mostra um cartão por escala, sem contar a linha de referência', async () => {
    const fixture = await montar();
    const el: HTMLElement = fixture.nativeElement;
    const cartoes = el.querySelectorAll('[data-escala]');
    expect(cartoes.length).toBe(2);
    expect(cartoes[0].textContent).toContain('Escala Semanal - Setembro 2026');
    expect(cartoes[0].textContent).toContain('2 celebrações');
    expect(cartoes[0].textContent).toContain('13 de 14 vagas');
    expect(cartoes[1].textContent).toContain('7 de 14 vagas');
  });

  it('Replicar aparece só na semanal', async () => {
    const fixture = await montar();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[data-escala="s1"] [data-replicar]')).not.toBeNull();
    expect(el.querySelector('[data-escala="m1"] [data-replicar]')).toBeNull();
  });

  it('a busca acha a escala pelo nome da celebração, sem acento', async () => {
    const fixture = await montar();
    fixture.componentInstance.busca = 'exaltacao';
    expect(fixture.componentInstance.escalas.map(e => e.id)).toEqual(['m1']);
  });
});
