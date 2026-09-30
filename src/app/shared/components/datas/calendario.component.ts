import { Component, computed, effect, input, output, signal } from '@angular/core';
import { DIAS_DA_SEMANA, competenciaBr, diasDaGrade, hojeIso, somarMeses } from './datas';

/**
 * Grade de um mês (domingo a sábado), usada pelo campo de data e pelo de
 * período. `inicio`/`fim` pintam a faixa do período.
 */
@Component({
  selector: 'app-calendario',
  template: `
    <div class="select-none">
      <div class="mb-2 flex items-center justify-between">
        <button type="button" class="cal-nav" aria-label="Mês anterior" (click)="mudarMes(-1)">‹</button>
        <span class="text-sm font-bold">{{ competenciaBr(mes()) }}</span>
        <button type="button" class="cal-nav" aria-label="Próximo mês" (click)="mudarMes(1)">›</button>
      </div>
      <div class="grid grid-cols-7 text-center text-[11px] text-[var(--muted)]">
        @for (d of diasDaSemana; track d) { <span class="py-1">{{ d }}</span> }
      </div>
      <div class="grid grid-cols-7 gap-y-0.5 text-center text-sm">
        @for (d of grade(); track d.iso) {
          <button type="button" class="cal-dia"
            [class.fora]="!d.doMes" [class.hoje]="d.iso === hoje" [class.faixa]="naFaixa(d.iso)"
            [class.escolhido]="d.iso === selecionado() || d.iso === inicio() || d.iso === fim()"
            [disabled]="bloqueado(d.iso)" [attr.data-dia]="d.iso" (click)="escolher.emit(d.iso)">
            {{ +d.iso.slice(8) }}
          </button>
        }
      </div>
    </div>
  `
})
export class CalendarioComponent {
  readonly selecionado = input('');
  readonly inicio = input('');
  readonly fim = input('');
  readonly min = input('');
  readonly max = input('');
  /** Data que o calendário mostra ao abrir ou quando muda (o mês dela). */
  readonly foco = input('');
  readonly escolher = output<string>();

  readonly hoje = hojeIso();
  readonly diasDaSemana = DIAS_DA_SEMANA;
  readonly competenciaBr = competenciaBr;
  readonly mes = signal(this.hoje.slice(0, 7));
  readonly grade = computed(() => diasDaGrade(this.mes()));

  constructor() {
    effect(() => {
      const foco = this.foco();
      if (foco) this.mes.set(foco.slice(0, 7));
    });
  }

  mudarMes(n: number): void {
    this.mes.update(m => somarMeses(m, n));
  }

  naFaixa(iso: string): boolean {
    return !!this.inicio() && !!this.fim() && iso > this.inicio() && iso < this.fim();
  }

  bloqueado(iso: string): boolean {
    return (!!this.min() && iso < this.min()) || (!!this.max() && iso > this.max());
  }
}
