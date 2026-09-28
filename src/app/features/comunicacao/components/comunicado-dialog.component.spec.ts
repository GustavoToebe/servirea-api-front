import { SimpleChange } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ComunicadosApiService } from '../comunicados-api.service';
import { LayoutsApiService } from '../layouts-api.service';
import { ComunicadoDialogComponent } from './comunicado-dialog.component';

describe('ComunicadoDialogComponent', () => {
  let api: jasmine.SpyObj<ComunicadosApiService>;
  let layouts: jasmine.SpyObj<LayoutsApiService>;

  async function montar(whatsappAtivo: boolean) {
    api = jasmine.createSpyObj<ComunicadosApiService>('ComunicadosApiService', ['whatsapp', 'destinatarios', 'criar', 'preVisualizar']);
    layouts = jasmine.createSpyObj<LayoutsApiService>('LayoutsApiService', ['ativosPorCanal']);
    api.whatsapp.and.resolveTo({ instancia: 'x', ativo: whatsappAtivo, tokenConfigurado: whatsappAtivo });
    api.destinatarios.and.resolveTo([
      { pessoaId: 'p1', nome: 'Ana', destinos: [{ nome: 'Maria', endereco: 'maria@t.com', deQuem: 'RESPONSAVEL' }], autorizaWhatsapp: true },
      { pessoaId: 'p2', nome: 'Bruno', destinos: [], autorizaWhatsapp: null }
    ]);
    api.criar.and.resolveTo({ id: 'c1', total: 1 });
    layouts.ativosPorCanal.and.resolveTo([
      { id: 'l1', nome: 'Aviso', tipoLayout: 'TODOS', tipoEnvio: 'EMAIL', assunto: 'Reunião de pais', conteudo: '<p>Oi</p>', ativo: true }
    ]);
    TestBed.configureTestingModule({
      imports: [ComunicadoDialogComponent],
      providers: [provideRouter([]), { provide: ComunicadosApiService, useValue: api }, { provide: LayoutsApiService, useValue: layouts }]
    });
    const fixture = TestBed.createComponent(ComunicadoDialogComponent);
    const c = fixture.componentInstance;
    c.pessoaIds = ['p1', 'p2'];
    c.open = true;
    c.ngOnChanges({ open: new SimpleChange(false, true, true) });
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('fluxo por e-mail: canal, layout, aplicar, selecionar válidos, assunto e enviar', async () => {
    const fixture = await montar(true);
    const c = fixture.componentInstance;
    const el: HTMLElement = fixture.nativeElement;

    (el.querySelector('[data-canal="EMAIL"]') as HTMLButtonElement).click();
    await fixture.whenStable();
    expect(layouts.ativosPorCanal).toHaveBeenCalledWith('EMAIL', false);
    c.layoutId = 'l1';
    await c.continuar();
    expect(c.passo).toBe(2);
    expect(api.destinatarios).toHaveBeenCalledWith('EMAIL', ['p1', 'p2'], 'RESPONSAVEIS', 'PRINCIPAL');
    expect(c.assunto).toBe('Reunião de pais');

    c.selecionados = new Set(['p2']);
    c.selecionarValidos();
    expect([...c.selecionados]).toEqual(['p1']);
    await c.continuar();
    expect(c.passo).toBe(3);

    c.assunto = 'Reunião de pais – outubro';
    const emitido = spyOn(c.enviado, 'emit');
    await c.enviar();
    expect(api.criar).toHaveBeenCalledWith({
      canal: 'EMAIL', layoutId: 'l1', assunto: 'Reunião de pais – outubro', enviarPara: 'RESPONSAVEIS',
      contatos: 'PRINCIPAL', pessoaIds: ['p1']
    }, []);
    expect(emitido).toHaveBeenCalledWith({ id: 'c1', total: 1 });
  });

  it('WhatsApp fica desabilitado quando a configuração vem inativa', async () => {
    const fixture = await montar(false);
    const botao = fixture.nativeElement.querySelector('[data-canal="WHATSAPP"]') as HTMLButtonElement;
    expect(botao.disabled).toBeTrue();
    expect(botao.title).toContain('Configure o WhatsApp');
  });

  it('recusa anexo de tipo não aceito', async () => {
    const fixture = await montar(true);
    fixture.componentInstance.adicionar([new File(['x'], 'virus.exe', { type: 'application/x-msdownload' })]);
    expect(fixture.componentInstance.anexos.length).toBe(0);
    expect(fixture.componentInstance.erro).toContain('Tipo não aceito');
  });
});
