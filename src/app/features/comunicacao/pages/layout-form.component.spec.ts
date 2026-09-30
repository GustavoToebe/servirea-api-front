import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { DialogoService } from '../../../shared/services/dialogo.service';
import { LayoutsApiService } from '../layouts-api.service';
import { LayoutFormComponent, htmlParaWhatsapp, whatsappParaEmail } from './layout-form.component';

describe('LayoutFormComponent', () => {
  let api: jasmine.SpyObj<LayoutsApiService>;

  function montar() {
    api = jasmine.createSpyObj<LayoutsApiService>('LayoutsApiService', ['buscar', 'criar', 'atualizar', 'tags', 'preVisualizar']);
    api.tags.and.resolveTo([{ codigo: '#PESSOA.NOME#', descricao: 'Será trocado pelo nome completo da pessoa' }]);
    api.criar.and.resolveTo({} as any);
    TestBed.configureTestingModule({
      imports: [LayoutFormComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({}) } } },
        { provide: LayoutsApiService, useValue: api }
      ]
    });
    const fixture = TestBed.createComponent(LayoutFormComponent);
    fixture.detectChanges();
    return fixture;
  }

  function escolherEnvio(el: HTMLElement, valor: string) {
    const select = el.querySelector('[data-tipo-envio]') as HTMLSelectElement;
    select.value = valor;
    select.dispatchEvent(new Event('change'));
  }

  it('WhatsApp + clicar numa tag insere a tag no texto', async () => {
    const fixture = montar();
    const el: HTMLElement = fixture.nativeElement;
    await fixture.componentInstance.trocarTipoLayout('COROINHA');
    escolherEnvio(el, 'WHATSAPP');
    await fixture.whenStable();
    fixture.detectChanges();
    (el.querySelector('[data-tag="#PESSOA.NOME#"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect((el.querySelector('[data-editor-whatsapp]') as HTMLTextAreaElement).value).toBe('#PESSOA.NOME#');
    expect(fixture.componentInstance.conteudo).toBe('#PESSOA.NOME#');
  });

  it('trocar para e-mail com texto pede confirmação e converte', async () => {
    const fixture = montar();
    const dialogo = TestBed.inject(DialogoService);
    const confirmar = spyOn(dialogo, 'confirmar').and.resolveTo(true);
    const c = fixture.componentInstance;
    c.tipoEnvio = 'WHATSAPP';
    c.conteudo = 'Olá *Ana*';
    fixture.detectChanges();
    escolherEnvio(fixture.nativeElement, 'EMAIL');
    await fixture.whenStable();
    expect(confirmar).toHaveBeenCalled();
    expect(c.tipoEnvio).toBe('EMAIL');
    expect(c.conteudo).toBe('<p>Olá <b>Ana</b></p>');
  });

  it('cancelar a troca mantém o tipo e o texto', async () => {
    const fixture = montar();
    spyOn(TestBed.inject(DialogoService), 'confirmar').and.resolveTo(false);
    const c = fixture.componentInstance;
    c.tipoEnvio = 'WHATSAPP';
    c.conteudo = 'Olá';
    fixture.detectChanges();
    escolherEnvio(fixture.nativeElement, 'EMAIL');
    await fixture.whenStable();
    expect(c.tipoEnvio).toBe('WHATSAPP');
    expect(c.conteudo).toBe('Olá');
  });

  it('salvar chama criar com tipo de envio, tipo layout e conteúdo', async () => {
    const fixture = montar();
    const c = fixture.componentInstance;
    c.nome = 'Boas-vindas';
    c.tipoLayout = 'RESPONSAVEL';
    c.tipoEnvio = 'WHATSAPP';
    c.assunto = 'ignorado';
    c.conteudo = 'Olá #PESSOA.NOME#';
    await c.salvar();
    expect(api.criar).toHaveBeenCalledWith({
      nome: 'Boas-vindas', tipoLayout: 'RESPONSAVEL', tipoEnvio: 'WHATSAPP', assunto: null, conteudo: 'Olá #PESSOA.NOME#', ativo: true
    });
  });

  it('converte HTML em texto do WhatsApp e volta', () => {
    expect(htmlParaWhatsapp('<p>Olá <strong>Ana</strong></p><p><em>até</em> &amp; mais</p>')).toBe('Olá *Ana*\n_até_ & mais');
    expect(whatsappParaEmail('a\n\n<b>')).toBe('<p>a</p><p><br></p><p>&lt;b&gt;</p>');
  });
});
