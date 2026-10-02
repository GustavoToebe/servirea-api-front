import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { SessaoAtual } from '../../core/layout/sessao-atual';
import { DialogoService } from '../../shared/services/dialogo.service';
import { EscalasService } from '../escalas/services/escalas.service';
import { CheckinEscalaComponent, linkDeCheckin } from './checkin-escala.component';
import { CheckinPessoaComponent, extrairCodigo } from './checkin-pessoa.component';

describe('Check-in da pessoa', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])] }));
  afterEach(() => { history.replaceState(null, '', window.location.pathname); TestBed.inject(HttpTestingController).verify(); });

  it('extrai o código de um link colado ou do fragmento', () => {
    expect(extrairCodigo('https://app.exemplo/portal/checkin#abc123')).toBe('abc123');
    expect(extrairCodigo('  abc123  ')).toBe('abc123');
  });

  it('lê o código do fragmento, limpa a barra de endereço e registra', () => {
    history.replaceState(null, '', '/portal/checkin#codigo-secreto');
    const fixture = TestBed.createComponent(CheckinPessoaComponent);
    fixture.detectChanges();
    expect(window.location.hash).toBe('');
    fixture.componentInstance.registrar();
    const r = TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/portal/checkin`);
    expect(r.request.body).toEqual({ token: 'codigo-secreto' });
    r.flush({ celebracao: 'Missa', data: '2026-10-10', horario: '19:00:00', funcao: 'MISSAL', jaRegistrado: false });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-sucesso]')).not.toBeNull();
    expect(fixture.componentInstance.codigo).toBe('');
  });

  it('mostra o erro da API e não registra sem código', () => {
    const fixture = TestBed.createComponent(CheckinPessoaComponent);
    fixture.detectChanges();
    fixture.componentInstance.registrar();
    TestBed.inject(HttpTestingController).expectNone(`${environment.apiUrl}/portal/checkin`);
    fixture.componentInstance.codigo = 'x';
    fixture.componentInstance.registrar();
    TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/portal/checkin`)
      .flush({ message: 'Código inválido ou expirado.' }, { status: 404, statusText: 'Not Found' });
    expect(fixture.componentInstance.erro()).not.toBe('');
  });
});

describe('Check-in da coordenação', () => {
  const escala = {
    id: 'e1', status: 'FINALIZADA',
    eventos: [
      { id: 'ev1', data: '2026-10-10', horario: '19:00:00', celebracao: 'Missa', vagas: [{ funcao: 'MISSAL', posicao: 1, voluntario_id: 'p1' }] },
      { id: 'ev2', data: '2026-10-11', horario: '09:00:00', celebracao: 'Missa', vagas: [{ funcao: 'MISSAL', posicao: 1, voluntario_id: null }] },
      { id: 'ref', data: '2026-10-12', horario: '09:00:00', celebracao: 'Ref', referencia: true, vagas: [{ funcao: 'MISSAL', posicao: 1, voluntario_id: 'p1' }] }
    ]
  };
  const estado = { ativa: false, expiraEm: null, escalados: 1, presentes: 0, registros: [] };

  async function montar(permissoes: string[]) {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['id', 'e1']]) } } },
        { provide: EscalasService, useValue: { getById: async () => escala } },
        { provide: SessaoAtual, useValue: { permissoes: () => permissoes } },
        { provide: DialogoService, useValue: { confirmar: async () => true, avisar: async () => undefined } }]
    });
    const fixture = TestBed.createComponent(CheckinEscalaComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    return { fixture, http: TestBed.inject(HttpTestingController), c: fixture.componentInstance };
  }

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('lista só celebrações reais com alguém escalado e abre o código com a validade', async () => {
    const { fixture, http, c } = await montar(['CHECKIN', 'CHECKIN_GERENCIAR']);
    http.expectOne(`${environment.apiUrl}/escalas/eventos/ev1/checkin`).flush(estado);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(c.eventos().map(e => e.id)).toEqual(['ev1']);
    c.minutos = 120;
    const abrir = c.abrir(c.eventos()[0]);
    http.expectOne(r => r.method === 'POST' && r.url.endsWith('/escalas/eventos/ev1/checkin')).flush({ sessaoId: 's', token: 'TOKEN', expiraEm: '2026-10-10T22:00:00Z' });
    await Promise.resolve();
    http.expectOne(r => r.method === 'GET' && r.url.endsWith('/escalas/eventos/ev1/checkin')).flush({ ...estado, ativa: true });
    await abrir;
    fixture.detectChanges();
    expect(c.link(c.abertos()['ev1'])).toBe(linkDeCheckin(window.location.origin, 'TOKEN'));
    expect(fixture.nativeElement.querySelector('[data-codigo]')).not.toBeNull();
  });

  it('sem permissão de gerenciar não oferece abrir nem consulta o estado sem CHECKIN', async () => {
    const { fixture } = await montar([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-abrir]')).toBeNull();
  });
});
