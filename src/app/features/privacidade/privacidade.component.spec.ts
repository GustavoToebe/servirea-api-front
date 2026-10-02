import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { SessaoAtual } from '../../core/layout/sessao-atual';
import { DialogoService } from '../../shared/services/dialogo.service';
import { PessoaPrivacidadeComponent } from './pessoa-privacidade.component';
import { RetencaoComponent } from './retencao.component';

function configurar(permissoes: string[], confirmar = true) {
  TestBed.configureTestingModule({
    providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
      { provide: ActivatedRoute, useValue: { snapshot: { paramMap: new Map([['id', 'p1']]) } } },
      { provide: SessaoAtual, useValue: { permissoes: () => permissoes } },
      { provide: DialogoService, useValue: { confirmar: async () => confirmar } }]
  });
}

describe('Privacidade da pessoa', () => {
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('lista o histórico com rótulos legíveis', () => {
    configurar(['PRIVACIDADE']);
    const fixture = TestBed.createComponent(PessoaPrivacidadeComponent);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne(q => q.url === `${environment.apiUrl}/pessoas/p1/consentimentos`)
      .flush({ itens: [{ tipo: 'WHATSAPP', concedido: false, fonte: 'Edição do cadastro', registradoEm: '2026-10-02T10:00:00Z' }], total: 1, pagina: 0, tamanho: 30 });
    fixture.detectChanges();
    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('Mensagens por WhatsApp');
    expect(texto).toContain('Revogada');
    expect(fixture.nativeElement.querySelector('[data-exportar]')).toBeNull();
  });

  it('sem a permissão do histórico não consulta a API', () => {
    configurar(['PRIVACIDADE_EXPORTAR']);
    const fixture = TestBed.createComponent(PessoaPrivacidadeComponent);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectNone(q => q.url.endsWith('/consentimentos'));
    expect(fixture.nativeElement.querySelector('[data-exportar]')).not.toBeNull();
  });

  it('exportar recusado na confirmação não chama a API', async () => {
    configurar(['PRIVACIDADE', 'PRIVACIDADE_EXPORTAR'], false);
    const fixture = TestBed.createComponent(PessoaPrivacidadeComponent);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne(q => q.url.endsWith('/consentimentos')).flush({ itens: [], total: 0, pagina: 0, tamanho: 30 });
    await fixture.componentInstance.exportar();
    TestBed.inject(HttpTestingController).expectNone(`${environment.apiUrl}/pessoas/p1/exportacao`);
  });
});

describe('Retenção de dados', () => {
  const dados = { comunicadosDias: 90, versao: 2, elegiveis: 5, execucoes: [] };
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('anonimizar pede confirmação e envia a versão', async () => {
    configurar(['PRIVACIDADE', 'PRIVACIDADE_RETENCAO']);
    const fixture = TestBed.createComponent(RetencaoComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(`${environment.apiUrl}/privacidade/retencao`).flush(dados);
    await fixture.componentInstance.executar();
    const r = http.expectOne(`${environment.apiUrl}/privacidade/retencao/execucao`);
    expect(r.request.body).toEqual({ versao: 2 });
    r.flush({ corte: '2026-07-04T00:00:00Z', comunicadosAnonimizados: 5 });
    http.expectOne(`${environment.apiUrl}/privacidade/retencao`).flush({ ...dados, elegiveis: 0 });
    expect(fixture.componentInstance.resultado()).toContain('5');
  });

  it('sem permissão de retenção não mostra ações', () => {
    configurar(['PRIVACIDADE']);
    const fixture = TestBed.createComponent(RetencaoComponent);
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/privacidade/retencao`).flush(dados);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-executar]')).toBeNull();
  });
});
