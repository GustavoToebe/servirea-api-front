import { ComponentFixture, TestBed, fakeAsync, flush, tick } from '@angular/core/testing';
import { TurnstileComponent } from './turnstile.component';

describe('TurnstileComponent', () => {
  let fixture: ComponentFixture<TurnstileComponent>;
  let opcoes: { theme?: string } | undefined;
  const turnstileOriginal = window.turnstile;

  beforeEach(() => {
    opcoes = undefined;
    window.turnstile = {
      ready: () => {},
      render: (_el, o) => { opcoes = o; return 'w1'; },
      reset: () => {},
      remove: () => {}
    };
    TestBed.configureTestingModule({ imports: [TurnstileComponent] });
  });

  afterEach(() => {
    fixture?.destroy();
    document.documentElement.classList.remove('dark');
    window.turnstile = turnstileOriginal;
  });

  function renderizar() {
    fixture = TestBed.createComponent(TurnstileComponent);
    fixture.componentInstance.siteKey = 'chave';
    fixture.detectChanges();
    tick(60);
    flush();
  }

  it('usa o tema claro quando a página está clara, mesmo com o navegador escuro', fakeAsync(() => {
    renderizar();
    expect(opcoes?.theme).toBe('light');
  }));

  it('usa o tema escuro quando a página está no modo noturno', fakeAsync(() => {
    document.documentElement.classList.add('dark');
    renderizar();
    expect(opcoes?.theme).toBe('dark');
  }));
});
