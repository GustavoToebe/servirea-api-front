import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { EscalaDetalhe } from '../models/escala.model';
import { EscalasService } from './escalas.service';

const apiEscala = {
  id: 'esc-1',
  titulo: 'Escala Mensal - Setembro 2026',
  tipo: 'MENSAL' as const,
  ano: 2026,
  mes: 9,
  status: 'RASCUNHO' as const,
  observacao: null,
  version: 3,
  eventos: [{
    id: 'ev-1',
    data: '2026-09-06',
    horario: '19:00',
    celebracao: 'Missa',
    vagas: [
      { id: 'v-2', funcao: 'CRUZ', posicao: 1, voluntarioId: null, voluntarioNome: null, presenca: 'PENDENTE' },
      { id: 'v-1', funcao: 'MISSAL', posicao: 1, voluntarioId: 'p-1', voluntarioNome: 'Ana', presenca: 'PENDENTE' }
    ]
  }]
};

describe('EscalasService', () => {
  let service: EscalasService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(EscalasService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista com filtros e traduz para o modelo das telas', async () => {
    const promise = service.list({ ano: 2026, mes: 9, tipo: 'MENSAL', status: 'RASCUNHO' });
    const req = http.expectOne(r => r.url === `${environment.apiUrl}/escalas`);
    expect(req.request.params.get('ano')).toBe('2026');
    expect(req.request.params.get('mes')).toBe('9');
    expect(req.request.params.get('tipo')).toBe('MENSAL');
    req.flush([apiEscala]);

    const [escala] = await promise;
    expect(escala.id).toBe('esc-1');
    expect(escala.eventos[0].horario).toBe('19:00:00');
    expect(escala.eventos[0].vagas.map(v => v.funcao)).toEqual(['MISSAL', 'CRUZ']);
    expect(escala.eventos[0].vagas[0].voluntario_id).toBe('p-1');
    expect(escala.eventos[0].vagas[0].voluntario?.nome_completo).toBe('Ana');
  });

  it('grava rascunho novo com POST e não chama finalizar', async () => {
    const payload: Omit<EscalaDetalhe, 'id'> & { id?: string } = {
      titulo: 'Nova',
      tipo: 'SEMANAL',
      ano: 2026,
      mes: 9,
      status: 'RASCUNHO',
      observacao: '',
      version: null,
      eventos: [{
        data: '2026-09-01',
        horario: '19:00:00',
        celebracao: '',
        vagas: [{ funcao: 'MISSAL', posicao: 1, voluntario_id: 'p-1' }]
      }]
    };
    const promise = service.save(payload);
    const req = http.expectOne(`${environment.apiUrl}/escalas`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body.eventos[0].horario).toBe('19:00:00');
    expect(req.request.body.eventos[0].celebracao).toBe('Missa');
    expect(req.request.body.eventos[0].vagas[0].voluntarioId).toBe('p-1');
    req.flush({ ...apiEscala, status: 'RASCUNHO' });
    await promise;
  });

  it('ao pedir FINALIZADA, salva e depois chama /finalizar', async () => {
    const promise = service.save({
      id: 'esc-1',
      titulo: 'Nova',
      tipo: 'MENSAL',
      ano: 2026,
      mes: 9,
      status: 'FINALIZADA',
      observacao: null,
      version: 3,
      eventos: [{ data: '2026-09-06', horario: '19:00', celebracao: 'Missa', vagas: [] }]
    });
    const put = http.expectOne(`${environment.apiUrl}/escalas/esc-1`);
    expect(put.request.method).toBe('PUT');
    expect(put.request.body.version).toBe(3);
    put.flush({ ...apiEscala, status: 'RASCUNHO' });
    await Promise.resolve();
    http.expectOne(`${environment.apiUrl}/escalas/esc-1/finalizar`).flush({ ...apiEscala, status: 'FINALIZADA' });

    const salva = await promise;
    expect(salva.status).toBe('FINALIZADA');
  });

  it('setStatus escolhe a ação certa na API', async () => {
    const promise = service.setStatus('esc-1', 'CANCELADA');
    const req = http.expectOne(`${environment.apiUrl}/escalas/esc-1/cancelar`);
    expect(req.request.method).toBe('POST');
    req.flush({ ...apiEscala, status: 'CANCELADA' });
    expect((await promise).status).toBe('CANCELADA');
  });

  it('gera dias úteis na escala semanal e sábado/domingo na mensal', () => {
    const semanal = service.buildDefaultEvents('SEMANAL', 2026, 9);
    expect(semanal.every(e => {
      const dow = new Date(`${e.data}T12:00:00`).getDay();
      return dow >= 1 && dow <= 5;
    })).toBeTrue();
    expect(semanal.length).toBe(22);
    expect(semanal[0].vagas.map(v => v.funcao)).toEqual(['MISSAL', 'CRUZ', 'CREDENCIA', 'VELA', 'VELA', 'SINO', 'SINO']);
    expect(semanal.every(e => e.horario === '19:00:00')).toBeTrue();

    const mensal = service.buildDefaultEvents('MENSAL', 2026, 9);
    const tipos = mensal.map(e => `${e.data} ${e.horario.slice(0, 5)}`);
    expect(tipos).toContain('2026-09-05 19:00');
    expect(tipos).toContain('2026-09-06 09:30');
    expect(tipos).toContain('2026-09-06 19:00');
    expect(mensal[0].vagas.some(v => v.funcao === 'COLETA')).toBeTrue();
    expect(mensal.every(e => {
      const dow = new Date(`${e.data}T12:00:00`).getDay();
      return dow === 0 || dow === 6;
    })).toBeTrue();
  });

  it('nomeia a celebração litúrgica quando a festa cai no tipo da escala', () => {
    const semanalAbril = service.buildDefaultEvents('SEMANAL', 2026, 4);
    const sextaSanta = semanalAbril.find(e => e.data === '2026-04-03');
    expect(sextaSanta?.celebracao).toBe('Sexta-feira Santa');

    const mensalAbril = service.buildDefaultEvents('MENSAL', 2026, 4);
    const pascoa = mensalAbril.find(e => e.data === '2026-04-05');
    expect(pascoa?.celebracao).toBe('Páscoa');
    expect(mensalAbril.some(e => e.data === '2026-04-03')).toBeFalse();
  });
});
