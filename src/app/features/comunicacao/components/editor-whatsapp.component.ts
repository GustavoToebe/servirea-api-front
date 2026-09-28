import { Component, ElementRef, ViewChild, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export const LIMITE_WHATSAPP = 4096;

/** Formatação do WhatsApp em HTML seguro, só para a prévia: escapa antes de trocar os marcadores. */
export function whatsappParaHtml(texto: string): string {
  return (texto ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#x27;')
    .replace(/```([\s\S]+?)```/g, '<code>$1</code>')
    .replace(/\*([^*\n]+)\*/g, '<b>$1</b>')
    .replace(/_([^_\n]+)_/g, '<i>$1</i>')
    .replace(/~([^~\n]+)~/g, '<s>$1</s>')
    .replace(/\n/g, '<br>');
}

/** Texto do WhatsApp com botões de formatação, contador e prévia em balão. */
@Component({
  selector: 'app-editor-whatsapp',
  standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => EditorWhatsappComponent), multi: true }],
  template: `
    <div class="grid gap-3 lg:grid-cols-2">
      <div>
        <div class="mb-2 flex gap-1">
          <button type="button" class="btn-secondary !px-3 !py-1 font-bold" title="Negrito" (click)="envolver('*')">B</button>
          <button type="button" class="btn-secondary !px-3 !py-1 italic" title="Itálico" (click)="envolver('_')">I</button>
          <button type="button" class="btn-secondary !px-3 !py-1 line-through" title="Tachado" (click)="envolver('~')">S</button>
          <button type="button" class="btn-secondary !px-3 !py-1 font-mono" title="Monoespaçado" (click)="envolver('\`\`\`')">&lt;/&gt;</button>
        </div>
        <textarea #area class="field min-h-72" rows="14" [value]="valor" [disabled]="desabilitado"
                  (input)="digitou(area.value)" (blur)="onTouched()" data-editor-whatsapp></textarea>
        <p class="mt-1 text-right text-xs" [class.text-red-600]="valor.length > limite" [class.text-slate-500]="valor.length <= limite">
          {{ valor.length }} / {{ limite }}
        </p>
      </div>
      <div class="rounded-xl bg-[#e5ddd5] p-4">
        <p class="mb-2 text-xs font-bold text-slate-600">Prévia</p>
        <div class="ml-auto max-w-[85%] whitespace-normal break-words rounded-lg bg-[#dcf8c6] px-3 py-2 text-sm text-slate-900 shadow"
             [innerHTML]="previa" data-previa-whatsapp></div>
      </div>
    </div>
  `
})
export class EditorWhatsappComponent implements ControlValueAccessor {
  @ViewChild('area', { static: true }) area!: ElementRef<HTMLTextAreaElement>;
  readonly limite = LIMITE_WHATSAPP;
  valor = '';
  desabilitado = false;
  private teveFoco = false;
  private onChange: (v: string) => void = () => {};
  onTouched: () => void = () => {};

  get previa(): string {
    return whatsappParaHtml(this.valor);
  }

  writeValue(v: string | null): void {
    this.valor = v ?? '';
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(d: boolean): void {
    this.desabilitado = d;
  }

  digitou(v: string) {
    this.teveFoco = true;
    this.valor = v;
    this.onChange(v);
  }

  /** Insere no cursor; se o campo nunca teve foco, no fim. */
  inserir(texto: string) {
    const el = this.area.nativeElement;
    const usarCursor = this.teveFoco || document.activeElement === el;
    const ini = usarCursor ? el.selectionStart : this.valor.length;
    const fim = usarCursor ? el.selectionEnd : this.valor.length;
    this.aplicar(this.valor.slice(0, ini) + texto + this.valor.slice(fim), ini + texto.length, ini + texto.length);
  }

  envolver(marca: string) {
    const el = this.area.nativeElement;
    const ini = el.selectionStart;
    const fim = el.selectionEnd;
    const meio = this.valor.slice(ini, fim);
    this.aplicar(this.valor.slice(0, ini) + marca + meio + marca + this.valor.slice(fim),
      ini + marca.length, ini + marca.length + meio.length);
  }

  private aplicar(novo: string, selIni: number, selFim: number) {
    const el = this.area.nativeElement;
    this.valor = novo;
    el.value = novo;
    this.teveFoco = true;
    el.focus();
    el.setSelectionRange(selIni, selFim);
    this.onChange(novo);
  }
}
