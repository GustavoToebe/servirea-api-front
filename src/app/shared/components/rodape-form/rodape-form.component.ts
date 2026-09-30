import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { RouterLink } from '@angular/router';

/**
 * Rodapé fixo do formulário (PLANO-009): Cancelar à esquerda (volta pelo link ou emite `cancelar`), conteúdo opcional
 * no meio e Salvar à direita. `[carregando]` mostra "Salvando…" e desabilita. O Salvar é `type="submit"`: fica dentro do `<form>`.
 */
@Component({
  selector: 'app-rodape-form',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sticky bottom-4 z-20 flex flex-wrap items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-3 shadow-lg">
      @if (voltarUrl) {
        <a class="btn-secondary" [routerLink]="voltarUrl" data-cancelar>Cancelar</a>
      } @else {
        <button type="button" class="btn-secondary" (click)="cancelar.emit()" data-cancelar>Cancelar</button>
      }
      <div class="flex flex-1 flex-wrap justify-end gap-2"><ng-content /></div>
      <button type="submit" class="btn-primary" [disabled]="carregando || desabilitado" data-salvar>{{ carregando ? 'Salvando…' : rotuloSalvar }}</button>
    </div>
  `
})
export class RodapeFormComponent {
  @Input() voltarUrl: string | unknown[] | null = null;
  @Input() rotuloSalvar = 'Salvar';
  @Input() carregando = false;
  @Input() desabilitado = false;
  @Output() cancelar = new EventEmitter<void>();
}
