import { Directive, ElementRef, HostListener, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';

export interface Posicao { left: number; top: number | null; bottom: number | null; }

/**
 * Base dos campos de data: o painel abre no `body`, preso ao campo
 * (`[data-ancora]`). Dentro de um cartão ou modal com `overflow` ele seria
 * cortado. Fecha com clique fora e Esc; abre para cima sem espaço embaixo.
 */
@Directive()
export abstract class PainelFlutuante implements OnInit, OnDestroy {
  protected readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly aberto = signal(false);
  readonly posicao = signal<Posicao>({ left: 0, top: 0, bottom: null });
  /** Altura aproximada do painel aberto, para decidir se abre para cima. */
  protected abstract readonly alturaPainel: number;
  protected readonly larguraPainel: number = 300;
  private painelNoBody: HTMLElement | null = null;

  @ViewChild('painel')
  set painel(ref: ElementRef<HTMLElement> | undefined) {
    this.painelNoBody = ref?.nativeElement ?? null;
    if (this.painelNoBody) document.body.appendChild(this.painelNoBody);
  }

  abrir(): void {
    if (this.aberto()) return;
    this.aoAbrir();
    this.posicionar();
    this.aberto.set(true);
  }

  fechar(): void {
    this.aberto.set(false);
  }

  alternar(): void {
    if (this.aberto()) this.fechar();
    else this.abrir();
  }

  /** Antes de abrir (carregar o rascunho, ir ao mês certo). */
  protected aoAbrir(): void {}

  posicionar(): void {
    const ancora = this.host.nativeElement.querySelector('[data-ancora]')?.getBoundingClientRect();
    if (!ancora) return;
    const altura = window.innerHeight;
    const paraCima = altura - ancora.bottom < this.alturaPainel && ancora.top > altura - ancora.bottom;
    const left = Math.max(8, Math.min(ancora.left, window.innerWidth - this.larguraPainel - 8));
    this.posicao.set({
      left,
      top: paraCima ? null : ancora.bottom + 4,
      bottom: paraCima ? altura - ancora.top + 4 : null
    });
  }

  protected dentro(alvo: EventTarget | null): boolean {
    return alvo instanceof Node && (this.host.nativeElement.contains(alvo) || !!this.painelNoBody?.contains(alvo));
  }

  @HostListener('document:mousedown', ['$event'])
  aoClicarFora(evento: MouseEvent): void {
    if (this.aberto() && !this.dentro(evento.target)) this.fechar();
  }

  @HostListener('document:keydown.escape')
  aoApertarEsc(): void {
    this.fechar();
  }

  @HostListener('window:resize')
  aoRedimensionar(): void {
    if (this.aberto()) this.posicionar();
  }

  /** Captura: a página rola num container, não na janela. */
  private readonly aoRolar = (evento: Event) => {
    if (this.aberto() && !this.dentro(evento.target)) this.posicionar();
  };

  ngOnInit(): void {
    document.addEventListener('scroll', this.aoRolar, true);
  }

  ngOnDestroy(): void {
    document.removeEventListener('scroll', this.aoRolar, true);
    this.painelNoBody?.remove();
  }
}
