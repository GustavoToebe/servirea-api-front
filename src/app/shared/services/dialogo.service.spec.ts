import { TestBed } from '@angular/core/testing';
import { DialogoHostComponent } from '../components/dialogo-host/dialogo-host.component';
import { DialogoService } from './dialogo.service';

describe('DialogoService + DialogoHostComponent', () => {
  let dialogo: DialogoService;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [DialogoHostComponent] });
    dialogo = TestBed.inject(DialogoService);
  });

  function renderizar() {
    const fixture = TestBed.createComponent(DialogoHostComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('mostra a confirmação e responde pelo botão clicado', async () => {
    const fixture = renderizar();
    const resposta = dialogo.confirmar({ titulo: 'Excluir escala?', mensagem: 'Não dá para desfazer.', confirmar: 'Excluir', perigo: true });
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Excluir escala?');
    expect(el.textContent).toContain('Não dá para desfazer.');
    const botao = el.querySelector<HTMLButtonElement>('[data-dialogo-confirmar]')!;
    expect(botao.className).toContain('btn-danger');
    botao.click();
    expect(await resposta).toBeTrue();
    fixture.detectChanges();
    expect(el.querySelector('[role=alertdialog]')).toBeNull();
  });

  it('Esc e clique no fundo contam como "não"', async () => {
    const fixture = renderizar();
    const primeira = dialogo.confirmar({ mensagem: 'Sair?' });
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(await primeira).toBeFalse();

    const segunda = dialogo.confirmar({ mensagem: 'Sair?' });
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.fixed') as HTMLElement).click();
    expect(await segunda).toBeFalse();
  });

  it('aviso tem um botão só', async () => {
    const fixture = renderizar();
    const aviso = dialogo.avisar('Informe a data e o horário.');
    fixture.detectChanges();
    const botoes = fixture.nativeElement.querySelectorAll('button');
    expect(botoes.length).toBe(1);
    expect(botoes[0].textContent.trim()).toBe('Entendi');
    botoes[0].click();
    await aviso;
  });

  it('pedido novo responde "não" ao que estava aberto', async () => {
    const antigo = dialogo.confirmar({ mensagem: 'A' });
    const novo = dialogo.confirmar({ mensagem: 'B' });
    expect(await antigo).toBeFalse();
    expect(dialogo.aberto()?.mensagem).toBe('B');
    dialogo.responder(true);
    expect(await novo).toBeTrue();
  });
});
