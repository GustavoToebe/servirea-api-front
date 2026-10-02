import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { environment } from '../../../environments/environment';
import { SessaoAtual } from '../../core/layout/sessao-atual';
import { DialogoService } from '../../shared/services/dialogo.service';
import { EntregasComponent } from './entregas.component';

describe('Centro de entregas', () => {
  const config = { origem: 'ESCALA', canal: 'EMAIL', ativo: false, versao: 0 };
  const pagina = {
    total: 1, pagina: 0, tamanho: 30,
    itens: [{ id: 'x', origem: 'ESCALA', referenciaId: 'e', titulo: 'Escala de novembro', referenciaVersao: 2, canal: 'EMAIL',
      gatilho: 'AUTOMATICO', total: 3, ignorados: 1, pendentes: 2, enviados: 1, falhas: 0, criadoEm: '2026-10-02T10:00:00Z' }]
  };

  function montar(permissoes: string[], confirmar = true) {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]),
        { provide: SessaoAtual, useValue: { permissoes: () => permissoes } },
        { provide: DialogoService, useValue: { confirmar: async () => confirmar } }]
    });
    const fixture = TestBed.createComponent(EntregasComponent);
    fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    http.expectOne(`${environment.apiUrl}/notificacoes/configuracoes`).flush([config]);
    http.expectOne(q => q.url === `${environment.apiUrl}/notificacoes/entregas`).flush(pagina);
    fixture.detectChanges();
    return { fixture, http, c: fixture.componentInstance };
  }

  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('mostra a situação agregada e os ignorados', () => {
    const { fixture } = montar(['NOTIFICACAO']);
    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('Escala de novembro');
    expect(texto).toContain('2 na fila');
    expect(texto).toContain('1 enviados');
    expect(texto).toContain('+1 sem contato');
  });

  it('sem permissão de configurar o gatilho fica desabilitado', () => {
    const { fixture } = montar(['NOTIFICACAO']);
    expect(fixture.nativeElement.querySelector('input[type=checkbox]').disabled).toBeTrue();
  });

  it('ligar o gatilho pede confirmação e envia a versão', async () => {
    const { http, c } = montar(['NOTIFICACAO', 'NOTIFICACAO_CONFIGURAR']);
    await c.alternar(config as never);
    const r = http.expectOne(`${environment.apiUrl}/notificacoes/configuracoes/ESCALA/EMAIL`);
    expect(r.request.body).toEqual({ ativo: true, versao: 0 });
    r.flush({ ...config, ativo: true, versao: 1 });
    expect(c.configs()[0].ativo).toBeTrue();
  });

  it('recusar a confirmação não chama a API', async () => {
    const { http, c } = montar(['NOTIFICACAO', 'NOTIFICACAO_CONFIGURAR'], false);
    await c.alternar(config as never);
    http.expectNone(`${environment.apiUrl}/notificacoes/configuracoes/ESCALA/EMAIL`);
  });
});
