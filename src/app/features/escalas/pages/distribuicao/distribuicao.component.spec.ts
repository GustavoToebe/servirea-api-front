import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { SessaoAtual } from '../../../../core/layout/sessao-atual';
import { DialogoService } from '../../../../shared/services/dialogo.service';
import { DistribuicaoComponent } from './distribuicao.component';

describe('Distribuição por regras', () => {
  const previa = {
    escalaId: 'e1', versao: 3, vagasVazias: 2, bloqueado: false,
    sugestoes: [
      { vagaId: 'v1', eventoId: 'ev', data: '2026-11-07', horario: '19:00:00', celebracao: 'Missa', funcao: 'MISSAL', pessoaId: 'p1', nome: 'Ana', explicacao: 'Menor carga' },
      { vagaId: 'v2', eventoId: 'ev2', data: '2026-11-14', horario: '19:00:00', celebracao: 'Missa', funcao: 'MISSAL', pessoaId: 'p2', nome: 'Beto', explicacao: 'Menor carga' }
    ],
    conflitos: []
  };

  function montar(permissoes: string[], confirmar = true) {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['id', 'e1']]) } } },
        { provide: SessaoAtual, useValue: { permissoes: () => permissoes } },
        { provide: DialogoService, useValue: { confirmar: async () => confirmar } }]
    });
    const fixture = TestBed.createComponent(DistribuicaoComponent);
    fixture.detectChanges();
    return { fixture, http: TestBed.inject(HttpTestingController), c: fixture.componentInstance };
  }

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('sem permissão não oferece o formulário', () => {
    const { fixture } = montar([]);
    expect(fixture.nativeElement.querySelector('[data-gerar]')).toBeNull();
  });

  it('gera prévia, marca tudo e aplica só as escolhas marcadas com a versão da prévia', async () => {
    const { fixture, http, c } = montar(['VAGA_DISTRIBUIR', 'VAGA_ALOCAR']);
    c.regras.intervaloDias = 2;
    c.gerar();
    http.expectOne(`${environment.apiUrl}/escalas/e1/distribuicao/previa`).flush(previa);
    fixture.detectChanges();
    expect(c.marcadas().size).toBe(2);
    c.alternar('v2');
    c.regras.intervaloDias = 9;
    await c.aplicar();
    const r = http.expectOne(`${environment.apiUrl}/escalas/e1/distribuicao/aplicacao`);
    expect(r.request.body).toEqual({
      versao: 3, regras: { maximoPorPessoa: 3, intervaloDias: 2, exigirResposta: false },
      escolhas: [{ vagaId: 'v1', pessoaId: 'p1' }]
    });
    r.flush({ escalaId: 'e1', versao: 4, aplicadas: 1 });
  });

  it('conflito na aplicação descarta a prévia e mostra o erro', async () => {
    const { fixture, http, c } = montar(['VAGA_DISTRIBUIR', 'VAGA_ALOCAR']);
    c.gerar();
    http.expectOne(`${environment.apiUrl}/escalas/e1/distribuicao/previa`).flush(previa);
    await c.aplicar();
    http.expectOne(`${environment.apiUrl}/escalas/e1/distribuicao/aplicacao`)
      .flush({ message: 'A escala foi alterada depois da prévia.' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();
    expect(c.previa()).toBeNull();
    expect(c.erro()).not.toBe('');
  });

  it('prévia bloqueada não aplica', async () => {
    const { http, c } = montar(['VAGA_DISTRIBUIR', 'VAGA_ALOCAR']);
    c.gerar();
    http.expectOne(`${environment.apiUrl}/escalas/e1/distribuicao/previa`).flush({ ...previa, bloqueado: true });
    await c.aplicar();
    http.expectNone(`${environment.apiUrl}/escalas/e1/distribuicao/aplicacao`);
  });
});
