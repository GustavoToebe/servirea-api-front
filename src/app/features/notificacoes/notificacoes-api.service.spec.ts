import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { NotificacoesApiService } from './notificacoes-api.service';

describe('API de notificações', () => {
  beforeEach(() => TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] }));
  afterEach(() => TestBed.inject(HttpTestingController).verify());

  it('escala envia só o canal', () => {
    TestBed.inject(NotificacoesApiService).notificarEscala('e1', 'EMAIL').subscribe();
    const r = TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/escalas/e1/notificacoes`);
    expect(r.request.body).toEqual({ canal: 'EMAIL' });
    r.flush({});
  });

  it('aviso envia canal e versão lida', () => {
    TestBed.inject(NotificacoesApiService).notificarAviso('a1', 'WHATSAPP', 3).subscribe();
    const r = TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/mural/avisos/a1/notificacoes`);
    expect(r.request.body).toEqual({ canal: 'WHATSAPP', versao: 3 });
    r.flush({});
  });

  it('configuração envia ativo e versão', () => {
    TestBed.inject(NotificacoesApiService).configurar('ESCALA', 'EMAIL', true, 0).subscribe();
    const r = TestBed.inject(HttpTestingController).expectOne(`${environment.apiUrl}/notificacoes/configuracoes/ESCALA/EMAIL`);
    expect(r.request.method).toBe('PUT');
    expect(r.request.body).toEqual({ ativo: true, versao: 0 });
    r.flush({});
  });

  it('lista filtra por origem somente quando informada', () => {
    TestBed.inject(NotificacoesApiService).entregas('', 1).subscribe();
    const r = TestBed.inject(HttpTestingController).expectOne(q => q.url === `${environment.apiUrl}/notificacoes/entregas`);
    expect(r.request.params.keys()).toEqual(['pagina']);
    r.flush({ itens: [], total: 0, pagina: 1, tamanho: 30 });
  });
});
