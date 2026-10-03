import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/**
 * Estado da lista (PLANO-009): esqueleto enquanto carrega ou mensagem de vazio. Fica abaixo do `<table>`,
 * que nesses estados mostra só o cabeçalho.
 */
@Component({
  selector: 'app-estado-lista',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (carregando) {
      <div class="space-y-2 py-2" aria-label="Carregando" aria-live="polite">
        @for (i of esqueleto; track i) { <div class="h-[55px] rounded-lg bg-slate-100 motion-safe:animate-pulse" data-esqueleto></div> }
      </div>
    } @else if (vazio) {
      <div class="py-12 text-center text-slate-500" data-vazio>
        <svg class="mx-auto h-10 w-10 opacity-40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 12h-6l-2 3h-4l-2-3H2"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg>
        <p class="mt-2 text-sm">{{ mensagemVazio }}</p>
      </div>
    }
  `
})
export class EstadoListaComponent {
  @Input() carregando = false;
  @Input() vazio = false;
  @Input() mensagemVazio = 'Nenhum registro encontrado, tente outros filtros.';
  readonly esqueleto = [1, 2, 3, 4, 5];
}
