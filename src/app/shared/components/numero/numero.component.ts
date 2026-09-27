import { Component, input, signal } from '@angular/core';

/**
 * Número curto do cadastro na paróquia, "(12)", que copia ao clicar (teste de
 * telas de 26/09/2026). Não propaga o clique, para não abrir a linha da lista.
 */
@Component({
  selector: 'app-numero',
  template: `
    @if (numero() != null) {
      <button type="button" class="ml-1 whitespace-nowrap align-middle text-[0.8em] font-bold text-violet-600 hover:text-violet-800"
        [title]="copiado() ? 'Copiado' : 'Copiar o número'" (click)="copiar($event)">
        ({{ numero() }})
      </button>
    }
  `
})
export class NumeroComponent {
  readonly numero = input<number | null | undefined>();
  readonly copiado = signal(false);

  async copiar(evento: Event): Promise<void> {
    evento.stopPropagation();
    evento.preventDefault();
    try {
      await navigator.clipboard.writeText(String(this.numero()));
      this.copiado.set(true);
      setTimeout(() => this.copiado.set(false), 1500);
    } catch {
      // Sem permissão de área de transferência: o número continua visível para copiar à mão.
    }
  }
}
