import { Component, input, signal } from '@angular/core';

/**
 * Olho no canto do campo de senha para ver o que está digitando (27/09/2026).
 * Uso: `<div class="relative"><input #s type="password" class="... pr-11"><app-olho-senha [campo]="s" /></div>`.
 * O mousedown não tira o foco do campo.
 */
@Component({
  selector: 'app-olho-senha',
  template: `
    <button type="button" class="absolute right-2 top-1/2 inline-flex -translate-y-1/2 items-center justify-center rounded-lg p-1.5 text-slate-400 hover:text-[var(--brand)]"
      [attr.aria-label]="visivel() ? 'Esconder senha' : 'Mostrar senha'" [attr.aria-pressed]="visivel()"
      [title]="visivel() ? 'Esconder senha' : 'Mostrar senha'"
      (mousedown)="$event.preventDefault()" (click)="alternar()">
      <svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>
        @if (!visivel()) { <path d="M3 3l18 18"/> }
      </svg>
    </button>
  `
})
export class OlhoSenhaComponent {
  readonly campo = input.required<HTMLInputElement>();
  readonly visivel = signal(false);

  alternar(): void {
    this.visivel.update(v => !v);
    this.campo().type = this.visivel() ? 'text' : 'password';
  }
}
