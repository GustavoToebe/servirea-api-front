import { Component, forwardRef, input, signal } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CalendarioComponent } from './calendario.component';
import { dataBr, dataDeBr, hojeIso, mascararData } from './datas';
import { PainelFlutuante } from './painel-flutuante';

/**
 * Campo de uma data: mostra e aceita `DD/MM/AAAA` digitado, ou escolhe no
 * calendário. O valor (ngModel) é ISO `AAAA-MM-DD`, ou `''` vazio.
 */
@Component({
  selector: 'app-campo-data',
  imports: [CalendarioComponent],
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => CampoDataComponent), multi: true }],
  template: `
    <div class="relative" data-ancora>
      <input class="field" [class.pr-16]="limpavel()" [class.pr-10]="!limpavel()" [id]="idCampo()" inputmode="numeric" maxlength="10" autocomplete="off"
        [placeholder]="placeholder()" [value]="texto()" [disabled]="desabilitado()"
        (input)="digitar($any($event.target))" (click)="abrir()" (blur)="aoSair()" (keydown.enter)="$event.preventDefault(); fechar()">
      @if (valor() && !desabilitado() && limpavel()) {
        <button type="button" class="campo-x right-9" aria-label="Limpar data" (click)="limpar(); $event.stopPropagation()">✕</button>
      }
      <button type="button" class="campo-icone" aria-label="Abrir calendário" [disabled]="desabilitado()"
        (click)="alternar(); $event.stopPropagation(); $event.preventDefault()">
        <svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>
        </svg>
      </button>
    </div>
    @if (aberto()) {
      <div #painel class="cal-flutuante w-[300px]" role="dialog" aria-label="Calendário"
        [style.left.px]="posicao().left" [style.top.px]="posicao().top" [style.bottom.px]="posicao().bottom">
        <app-calendario [selecionado]="valor()" [foco]="valor()" [min]="min()" [max]="max()" (escolher)="escolher($event)" />
        <div class="mt-2 flex justify-between border-t border-[var(--line)] pt-2">
          <button type="button" class="cal-link" [disabled]="hojeForaDoLimite()" (click)="escolher(hoje)">Hoje</button>
          @if (limpavel()) { <button type="button" class="cal-link" (click)="limpar()">Limpar</button> }
        </div>
      </div>
    }
  `
})
export class CampoDataComponent extends PainelFlutuante implements ControlValueAccessor {
  readonly min = input('');
  readonly max = input('');
  readonly placeholder = input('dd/mm/aaaa');
  readonly idCampo = input<string | null>(null);
  /** Campo obrigatório esconde o "Limpar". */
  readonly limpavel = input(true);

  protected readonly alturaPainel = 340;
  readonly hoje = hojeIso();
  readonly valor = signal('');
  readonly texto = signal('');
  readonly desabilitado = signal(false);

  private aoMudar: (v: string) => void = () => {};
  private aoTocar: () => void = () => {};

  writeValue(v: string | null): void {
    this.valor.set(v ?? '');
    this.texto.set(dataBr(v));
  }
  registerOnChange(fn: (v: string) => void): void { this.aoMudar = fn; }
  registerOnTouched(fn: () => void): void { this.aoTocar = fn; }
  setDisabledState(d: boolean): void { this.desabilitado.set(d); }

  digitar(campo: HTMLInputElement): void {
    const texto = mascararData(campo.value, [2, 2, 4]);
    campo.value = texto;
    this.texto.set(texto);
    if (!texto) return this.definir('');
    const iso = dataDeBr(texto);
    if (iso && !this.foraDoLimite(iso)) this.definir(iso);
  }

  escolher(iso: string): void {
    this.definir(iso);
    this.texto.set(dataBr(iso));
    this.fechar();
  }

  limpar(): void {
    this.definir('');
    this.texto.set('');
    this.fechar();
  }

  /** Texto incompleto ou inválido volta para a data que valia. */
  aoSair(): void {
    this.texto.set(dataBr(this.valor()));
    this.aoTocar();
  }

  hojeForaDoLimite(): boolean {
    return this.foraDoLimite(this.hoje);
  }

  private foraDoLimite(iso: string): boolean {
    return (!!this.min() && iso < this.min()) || (!!this.max() && iso > this.max());
  }

  private definir(iso: string): void {
    if (iso === this.valor()) return;
    this.valor.set(iso);
    this.aoMudar(iso);
  }
}
