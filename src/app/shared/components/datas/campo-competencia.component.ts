import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { competenciaAtual, competenciaBr, competenciaDeBr, mascararData } from './datas';
import { PainelFlutuante } from './painel-flutuante';

/**
 * Campo de competência: mostra e aceita `MM/AAAA` (nada de "setembro de
 * 2026", teste de telas de 27/09/2026). O valor (ngModel) é `AAAA-MM`, ou `''`.
 */
@Component({
  selector: 'app-campo-competencia',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CampoCompetenciaComponent), multi: true }],
  template: `
    <div class="relative" data-ancora>
      <input class="field" [class.pr-16]="limpavel()" [class.pr-10]="!limpavel()" [id]="idCampo()" inputmode="numeric" maxlength="7" autocomplete="off"
        placeholder="mm/aaaa" [value]="texto()" [disabled]="desabilitado()"
        (input)="digitar($any($event.target))" (click)="abrir()" (blur)="aoSair()" (keydown.enter)="$event.preventDefault(); fechar()">
      @if (valor() && !desabilitado() && limpavel()) {
        <button type="button" class="campo-x right-9" aria-label="Limpar competência" (click)="limpar(); $event.stopPropagation()">✕</button>
      }
      <button type="button" class="campo-icone" aria-label="Escolher competência" [disabled]="desabilitado()"
        (click)="alternar(); $event.stopPropagation(); $event.preventDefault()">
        <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>
        </svg>
      </button>
    </div>
    @if (aberto()) {
      <div #painel class="cal-flutuante w-[260px] select-none" role="dialog" aria-label="Competência"
        [style.left.px]="posicao().left" [style.top.px]="posicao().top" [style.bottom.px]="posicao().bottom">
        <div class="mb-2 flex items-center justify-between">
          <button type="button" class="cal-nav" aria-label="Ano anterior" (click)="ano.set(ano() - 1)">‹</button>
          <span class="text-sm font-bold">{{ ano() }}</span>
          <button type="button" class="cal-nav" aria-label="Próximo ano" (click)="ano.set(ano() + 1)">›</button>
        </div>
        <div class="grid grid-cols-4 gap-1">
          @for (m of meses; track m) {
            <button type="button" class="cal-dia py-2" [attr.data-mes]="m"
              [class.hoje]="chave(m) === atual" [class.escolhido]="chave(m) === valor()"
              [disabled]="!!min() && chave(m) < min()" (click)="escolher(chave(m))">{{ m }}</button>
          }
        </div>
        <div class="mt-2 flex justify-between border-t border-[var(--line)] pt-2">
          <button type="button" class="cal-link" [disabled]="!!min() && atual < min()" (click)="escolher(atual)">Este mês</button>
          @if (limpavel()) { <button type="button" class="cal-link" (click)="limpar()">Limpar</button> }
        </div>
      </div>
    }
  `
})
export class CampoCompetenciaComponent extends PainelFlutuante implements ControlValueAccessor {
  /** `AAAA-MM` mínimo. */
  readonly min = input('');
  readonly idCampo = input<string | null>(null);
  readonly limpavel = input(true);

  protected readonly alturaPainel = 230;
  protected override readonly larguraPainel = 260;
  readonly meses = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  readonly atual = competenciaAtual();
  readonly valor = signal('');
  readonly texto = signal('');
  readonly ano = signal(Number(this.atual.slice(0, 4)));
  readonly desabilitado = signal(false);

  private aoMudar: (v: string) => void = () => {};
  private aoTocar: () => void = () => {};

  writeValue(v: string | null): void {
    this.valor.set(v ?? '');
    this.texto.set(competenciaBr(v));
  }
  registerOnChange(fn: (v: string) => void): void { this.aoMudar = fn; }
  registerOnTouched(fn: () => void): void { this.aoTocar = fn; }
  setDisabledState(d: boolean): void { this.desabilitado.set(d); }

  protected override aoAbrir(): void {
    this.ano.set(Number((this.valor() || this.min() || this.atual).slice(0, 4)));
  }

  chave(mes: string): string {
    return `${this.ano()}-${mes}`;
  }

  digitar(campo: HTMLInputElement): void {
    const texto = mascararData(campo.value, [2, 4]);
    campo.value = texto;
    this.texto.set(texto);
    if (!texto) return this.definir('');
    const competencia = competenciaDeBr(texto);
    if (competencia && !(this.min() && competencia < this.min())) {
      this.definir(competencia);
      this.ano.set(Number(competencia.slice(0, 4)));
    }
  }

  escolher(competencia: string): void {
    this.definir(competencia);
    this.texto.set(competenciaBr(competencia));
    this.fechar();
  }

  limpar(): void {
    this.definir('');
    this.texto.set('');
    this.fechar();
  }

  aoSair(): void {
    this.texto.set(competenciaBr(this.valor()));
    this.aoTocar();
  }

  private definir(competencia: string): void {
    if (competencia === this.valor()) return;
    this.valor.set(competencia);
    this.aoMudar(competencia);
  }
}
