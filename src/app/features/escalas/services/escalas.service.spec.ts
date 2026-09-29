import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { ApoioEscala, EscalaDetalhe, indisponivelEm, periodoDoHorario } from '../models/escala.model';
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
    const semanal = service.buildDefaultEvents('SEMANAL', 2026, 9, [{funcao:'MISSAL',posicao:1},{funcao:'CRUZ',posicao:1},{funcao:'CREDENCIA',posicao:1},{funcao:'VELA',posicao:1},{funcao:'VELA',posicao:2},{funcao:'SINO',posicao:1},{funcao:'SINO',posicao:2}] as any);
    expect(semanal.every(e => {
      const dow = new Date(`${e.data}T12:00:00`).getDay();
      return dow >= 1 && dow <= 5;
    })).toBeTrue();
    expect(semanal.length).toBe(22);
    expect(semanal[0].vagas.map(v => v.funcao)).toEqual(['MISSAL', 'CRUZ', 'CREDENCIA', 'VELA', 'VELA', 'SINO', 'SINO']);
    expect(semanal.every(e => e.horario === '19:00:00')).toBeTrue();

    const mensal = service.buildDefaultEvents('MENSAL', 2026, 9, [{funcao:'MISSAL',posicao:1},{funcao:'CRUZ',posicao:1},{funcao:'CREDENCIA',posicao:1},{funcao:'VELA',posicao:1},{funcao:'VELA',posicao:2},{funcao:'COLETA',posicao:1},{funcao:'COLETA',posicao:2},{funcao:'COLETA',posicao:3},{funcao:'COLETA',posicao:4},{funcao:'SINO',posicao:1},{funcao:'SINO',posicao:2}] as any);
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
    const semanalAbril = service.buildDefaultEvents('SEMANAL', 2026, 4, [{funcao:'MISSAL',posicao:1},{funcao:'CRUZ',posicao:1},{funcao:'CREDENCIA',posicao:1},{funcao:'VELA',posicao:1},{funcao:'VELA',posicao:2},{funcao:'SINO',posicao:1},{funcao:'SINO',posicao:2}] as any);
    const sextaSanta = semanalAbril.find(e => e.data === '2026-04-03');
    expect(sextaSanta?.celebracao).toBe('Sexta-feira Santa');

    const mensalAbril = service.buildDefaultEvents('MENSAL', 2026, 4, [{funcao:'MISSAL',posicao:1},{funcao:'CRUZ',posicao:1},{funcao:'CREDENCIA',posicao:1},{funcao:'VELA',posicao:1},{funcao:'VELA',posicao:2},{funcao:'COLETA',posicao:1},{funcao:'COLETA',posicao:2},{funcao:'COLETA',posicao:3},{funcao:'COLETA',posicao:4},{funcao:'SINO',posicao:1},{funcao:'SINO',posicao:2}] as any);
    const pascoa = mensalAbril.find(e => e.data === '2026-04-05');
    expect(pascoa?.celebracao).toBe('Páscoa');
    expect(mensalAbril.some(e => e.data === '2026-04-03')).toBeFalse();
  });
});

describe('EscalasService.replicarSemanal (setembro → outubro/2026)', () => {
  let service: EscalasService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(EscalasService);
  });

  /** Setembro/2026 inteiro, dias úteis, um nome diferente por dia no Missal ("Missal 03" para 03/09). */
  function setembro(): EscalaDetalhe {
    const eventos = service.buildDefaultEvents('SEMANAL', 2026, 9, [{funcao:'MISSAL',posicao:1},{funcao:'CRUZ',posicao:1},{funcao:'CREDENCIA',posicao:1},{funcao:'VELA',posicao:1},{funcao:'VELA',posicao:2},{funcao:'SINO',posicao:1},{funcao:'SINO',posicao:2}] as any).map(e => ({
      ...e,
      vagas: e.vagas.map(v => v.funcao === 'MISSAL'
        ? { ...v, voluntario_id: 'p' + e.data.slice(8), voluntario: { id: 'p' + e.data.slice(8), nome_completo: 'Missal ' + e.data.slice(8) } }
        : v)
    }));
    return { id: 'set', titulo: 'Escala Semanal - Setembro 2026', tipo: 'SEMANAL', ano: 2026, mes: 9, status: 'FINALIZADA', observacao: null, eventos };
  }

  const missal = (e: { vagas: { funcao: string; voluntario?: { nome_completo: string } | null }[] }) =>
    e.vagas.find(v => v.funcao === 'MISSAL')?.voluntario?.nome_completo ?? null;

  it('mapeia por dia da semana e ocorrência, deixa a 5ª ocorrência vazia e o que sobra vira referência', () => {
    const resultado = service.replicarSemanal(setembro(), 2026, 10);
    const reais = resultado.filter(e => !e.referencia);
    const referencias = resultado.filter(e => e.referencia);

    expect(reais[0].data).toBe('2026-10-01');
    expect(new Date('2026-10-01T12:00:00').getDay()).toBe(4);
    expect(reais.every(e => e.data.startsWith('2026-10'))).toBeTrue();

    const dia = (iso: string) => reais.find(e => e.data === iso)!;
    expect(missal(dia('2026-10-01'))).toBe('Missal 03');
    expect(missal(dia('2026-10-22'))).toBe('Missal 24');
    expect(missal(dia('2026-10-26'))).toBe('Missal 28');

    for (const iso of ['2026-10-29', '2026-10-30']) {
      expect(dia(iso).ocorrenciaNova).toBeTrue();
      expect(dia(iso).vagas.every(v => !v.voluntario_id)).toBeTrue();
    }

    expect(referencias.map(e => e.data)).toEqual(['2026-09-29', '2026-09-30']);
    expect(referencias.map(missal)).toEqual(['Missal 29', 'Missal 30']);
    expect(resultado.indexOf(referencias[0])).toBe(0);
    expect(referencias.some(e => e.data === '2026-09-28')).toBeFalse();
    expect(reais.every(e => e.vagas.every(v => v.id === undefined && v.presenca === undefined))).toBeTrue();
  });

  it('não leva referência antiga da origem', () => {
    const origem = setembro();
    origem.eventos.unshift({ data: '2026-08-31', horario: '19:00:00', celebracao: 'Missa', vagas: [], referencia: true });
    expect(service.replicarSemanal(origem, 2026, 10).some(e => e.data === '2026-08-31')).toBeFalse();
  });
});

describe('indisponibilidade na vaga (PLANO-007)', () => {
  it('periodoDoHorario separa manhã, tarde e noite', () => {
    expect(periodoDoHorario('09:30:00')).toBe('MANHA');
    expect(periodoDoHorario('12:00')).toBe('TARDE');
    expect(periodoDoHorario('17:59')).toBe('TARDE');
    expect(periodoDoHorario('19:00:00')).toBe('NOITE');
  });

  it('indisponivelEm vale para o dia inteiro ou para o período do horário', () => {
    const apoio: ApoioEscala = { voluntarios: [
      { voluntarioId: 'a', situacao: 'COM_RESTRICAO', indisponiveis: [{ data: '2026-10-03', periodo: null }], irmaos: [] },
      { voluntarioId: 'b', situacao: 'COM_RESTRICAO', indisponiveis: [{ data: '2026-10-04', periodo: 'MANHA' }], irmaos: [] }
    ] };
    expect(indisponivelEm(apoio, 'a', '2026-10-03', '19:00:00')).toBeTrue();
    expect(indisponivelEm(apoio, 'b', '2026-10-04', '09:30:00')).toBeTrue();
    expect(indisponivelEm(apoio, 'b', '2026-10-04', '19:00:00')).toBeFalse();
    expect(indisponivelEm(apoio, 'c', '2026-10-03', '19:00:00')).toBeFalse();
    expect(indisponivelEm(null, 'a', '2026-10-03', '19:00:00')).toBeFalse();
  });
});
