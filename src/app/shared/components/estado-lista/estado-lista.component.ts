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
        <div class="text-3xl opacity-40" aria-hidden="true">🗂</div>
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
