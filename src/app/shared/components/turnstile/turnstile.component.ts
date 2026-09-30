
import { AfterViewInit, Component, ElementRef, Input, NgZone, OnDestroy, ViewChild } from '@angular/core';

@Component({
    selector: 'app-turnstile',
    imports: [],
    template: `
    <div class="flex w-full justify-center">
      <div class="flex w-[300px] flex-col items-stretch gap-3">
        <div #widget class="min-h-[65px] w-[300px]"></div>
        @if (errorMessage) {
          <p class="text-center text-sm text-red-700">{{ errorMessage }}</p>
        }
        @if (errorMessage) {
          <button type="button" class="btn-secondary !py-2 text-sm" (click)="retry()">Tentar novamente</button>
        }
      </div>
    </div>
    `
})
export class TurnstileComponent implements AfterViewInit, OnDestroy {
  @ViewChild('widget', { static: true }) widget!: ElementRef<HTMLElement>;
  @Input({ required: true }) siteKey = '';

  errorMessage = '';
  private widgetId: string | null = null;
  private rendered = false;
  private timer: number | null = null;

  constructor(private zone: NgZone) {}

  ngAfterViewInit() {
    this.waitAndRender();
  }

  ngOnDestroy() {
    this.clearTimer();
    this.removeWidget();
  }

  reset() {
    this.errorMessage = '';
    window.onTurnstileExpiredCallback?.();
    if (this.widgetId && window.turnstile) {
      window.turnstile.reset(this.widgetId);
    }
  }

  retry() {
    this.errorMessage = '';
    this.removeWidget();
    this.rendered = false;
    this.waitAndRender();
  }

  private waitAndRender() {
    if (!this.siteKey) {
      this.errorMessage = 'A Site Key do Turnstile não está configurada.';
      return;
    }
    this.clearTimer();
    this.timer = window.setInterval(() => {
      if (!window.turnstile) return;
      this.clearTimer();
      this.renderWidget();
    }, 50);
    window.setTimeout(() => this.clearTimer(), 8000);
  }

  private renderWidget() {
    if (this.rendered || !window.turnstile || !this.siteKey) return;

    this.widgetId = window.turnstile.render(this.widget.nativeElement, {
      sitekey: this.siteKey.trim(),
      callback: (token: string) => window.onTurnstileSuccessCallback?.(token),
      'expired-callback': () => window.onTurnstileExpiredCallback?.(),
      'error-callback': (errorCode?: string) => {
        this.zone.run(() => {
          window.onTurnstileExpiredCallback?.();
          this.errorMessage = this.messageFor(errorCode);
        });
      }
    });
    this.rendered = true;
  }

  private removeWidget() {
    if (this.widgetId && window.turnstile) {
      window.turnstile.remove(this.widgetId);
    }
    this.widgetId = null;
    this.widget.nativeElement.innerHTML = '';
  }

  private messageFor(errorCode?: string): string {
    if (errorCode === '400020' || errorCode === '110100' || errorCode === '110110') {
      return 'A verificação do Cloudflare recusou este site. Confira se a Site Key está correta e se o hostname em Turnstile → Hostname Management é exatamente o da barra do navegador, sem https://.';
    }
    if (errorCode === '110200') {
      return 'Este domínio não está autorizado no widget do Cloudflare. Em Turnstile → Hostname Management, adicione o endereço exato da barra do navegador, além de localhost e 127.0.0.1.';
    }
    if (errorCode === '300030' || errorCode === '600010') {
      return 'O widget do Turnstile não conseguiu iniciar. Recarregue a página.';
    }
    return errorCode
      ? `Não foi possível carregar a verificação de segurança (${errorCode}). Recarregue a página.`
      : 'Não foi possível carregar a verificação de segurança. Recarregue a página.';
  }

  private clearTimer() {
    if (this.timer == null) return;
    window.clearInterval(this.timer);
    this.timer = null;
  }
}
