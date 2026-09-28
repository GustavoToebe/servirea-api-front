import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, ViewChild, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import Quill from 'quill';

export const LIMITE_EMAIL = 50000;

/** Editor rico do e-mail (Quill 2, tema snow). O valor é o HTML do editor; vazio vira ''. */
@Component({
  selector: 'app-editor-html',
  standalone: true,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => EditorHtmlComponent), multi: true }],
  template: `
    <div class="overflow-hidden rounded-xl border border-[var(--field-line)] bg-white">
      <div #barra>
        <span class="ql-formats">
          <button type="button" class="ql-bold" title="Negrito"></button>
          <button type="button" class="ql-italic" title="Itálico"></button>
          <button type="button" class="ql-underline" title="Sublinhado"></button>
          <button type="button" class="ql-strike" title="Tachado"></button>
        </span>
        <span class="ql-formats">
          <select class="ql-size" title="Tamanho"></select>
          <select class="ql-color" title="Cor do texto"></select>
          <select class="ql-background" title="Cor de fundo"></select>
        </span>
        <span class="ql-formats">
          <select class="ql-align" title="Alinhamento"></select>
          <button type="button" class="ql-list" value="ordered" title="Lista numerada"></button>
          <button type="button" class="ql-list" value="bullet" title="Marcadores"></button>
        </span>
        <span class="ql-formats">
          <button type="button" class="ql-link" title="Link"></button>
          <button type="button" class="ql-image" title="Imagem por URL"></button>
          <button type="button" class="ql-clean" title="Limpar formatação"></button>
        </span>
      </div>
      <div #editor class="min-h-72" data-editor-html></div>
    </div>
    <p class="mt-1 text-right text-xs" [class.text-red-600]="tamanho > limite" [class.text-slate-500]="tamanho <= limite">
      {{ tamanho }} / {{ limite }}
    </p>
  `
})
export class EditorHtmlComponent implements ControlValueAccessor, AfterViewInit, OnDestroy {
  @ViewChild('barra', { static: true }) barra!: ElementRef<HTMLElement>;
  @ViewChild('editor', { static: true }) editor!: ElementRef<HTMLElement>;
  readonly limite = LIMITE_EMAIL;
  tamanho = 0;
  private quill?: Quill;
  private pendente = '';
  private ultimoIndice: number | null = null;
  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(private zone: NgZone) {}

  ngAfterViewInit(): void {
    this.quill = new Quill(this.editor.nativeElement, {
      theme: 'snow',
      modules: { toolbar: { container: this.barra.nativeElement, handlers: { image: () => this.imagemPorUrl() } } }
    });
    this.definirHtml(this.pendente);
    this.quill.on('text-change', () => this.zone.run(() => this.emitir()));
    this.quill.on('selection-change', faixa => {
      if (faixa) this.ultimoIndice = faixa.index + faixa.length;
      else this.zone.run(() => this.onTouched());
    });
  }

  ngOnDestroy(): void {
    this.quill?.off('text-change');
    this.quill?.off('selection-change');
  }

  writeValue(v: string | null): void {
    this.pendente = v ?? '';
    if (this.quill) this.definirHtml(this.pendente);
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(d: boolean): void {
    this.quill?.enable(!d);
  }

  /** Insere na posição do cursor (ou no fim, se o editor nunca teve foco). */
  inserir(texto: string) {
    if (!this.quill) return;
    const indice = this.quill.getSelection()?.index ?? this.ultimoIndice ?? Math.max(0, this.quill.getLength() - 1);
    this.quill.insertText(indice, texto, 'user');
    this.quill.setSelection(indice + texto.length, 0, 'silent');
    this.ultimoIndice = indice + texto.length;
  }

  private definirHtml(html: string) {
    if (!this.quill) return;
    this.quill.setContents(this.quill.clipboard.convert({ html }), 'silent');
    this.tamanho = this.html().length;
  }

  private html(): string {
    if (!this.quill || this.quill.getText().trim() === '' && !this.quill.root.querySelector('img')) return '';
    return this.quill.getSemanticHTML();
  }

  private emitir() {
    const v = this.html();
    this.tamanho = v.length;
    this.onChange(v);
  }

  private imagemPorUrl() {
    const url = window.prompt('Endereço (URL) da imagem:');
    if (!url || !/^https?:\/\//i.test(url.trim()) || !this.quill) return;
    const indice = this.quill.getSelection(true)?.index ?? this.quill.getLength();
    this.quill.insertEmbed(indice, 'image', url.trim(), 'user');
  }
}
