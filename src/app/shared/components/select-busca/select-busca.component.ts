import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, NgZone, OnChanges, OnDestroy, ViewChild, forwardRef, inject
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface OpcaoSelectBusca {
  valor: string;
  rotulo: string;
  detalhe?: string;
}

const MAX_VISIVEIS = 50;
const ALTURA_PAINEL = 320;

function semAcento(s: string): string {
  return (s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/**
 * Lista longa com filtro dentro do próprio campo (PLANO-009, o `p-dropdown [filter]` do SIN). ControlValueAccessor.
 * O painel vai para o `body` (o `.card` tem `backdrop-filter`) e os listeners globais só existem com ele aberto,
 * fora da zona do Angular (mesma regra do `volunteer-picker`).
 */
@Component({
  selector: 'app-select-busca',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => SelectBuscaComponent), multi: true }],
  template: `
    <button #botao type="button" class="field flex items-center gap-2 text-left" [disabled]="desabilitado"
            (click)="alternar()" [attr.aria-expanded]="aberto" data-select-busca>
      <span class="min-w-0 flex-1 truncate" [class.text-slate-400]="!rotuloAtual">{{ rotuloAtual || placeholder }}</span>
      @if (limpavel && valor && !desabilitado) {
        <span role="button" class="text-slate-400 hover:text-red-500" aria-label="Limpar" (click)="limpar($event)" data-limpar>✕</span>
      }
      <span class="text-slate-400">▾</span>
    </button>
    @if (aberto) {
      <div #painel class="fixed z-50 overflow-hidden rounded-xl border border-[var(--line)] bg-[var(--card)] shadow-lg" role="listbox"
           [style.left.px]="pos.left" [style.width.px]="pos.width" [style.top.px]="pos.top" [style.bottom.px]="pos.bottom">
        <div class="border-b border-[var(--line)] p-2">
          <input #campo class="field !py-1.5" placeholder="Buscar…" [value]="termo" (input)="filtrar(campo.value)" (keydown)="teclado($event)" data-busca-opcao>
        </div>
        <ul class="max-h-60 overflow-y-auto py-1">
          @for (o of visiveis; track o.valor; let i = $index) {
            <li role="option" class="cursor-pointer px-3 py-1.5 text-sm" [attr.aria-selected]="o.valor === valor"
                [class.bg-violet-50]="i === destaque" [class.font-bold]="o.valor === valor"
                (mouseenter)="destaque = i" (mousedown)="$event.preventDefault()" (click)="escolher(o)" [attr.data-opcao]="o.valor">
              <span class="block">{{ o.rotulo }}</span>
              @if (o.detalhe) { <span class="block text-xs text-slate-500">{{ o.detalhe }}</span> }
            </li>
          } @empty {
            <li class="px-3 py-3 text-center text-xs text-slate-500">Nada encontrado.</li>
          }
          @if (maisQueOLimite) { <li class="px-3 py-2 text-xs text-slate-500">Refine a busca para ver mais.</li> }
        </ul>
      </div>
    }
  `
})
export class SelectBuscaComponent implements ControlValueAccessor, OnChanges, OnDestroy {
  @Input() opcoes: OpcaoSelectBusca[] = [];
  @Input() placeholder = 'Selecione';
  @Input() limpavel = true;

  @ViewChild('botao', { static: true }) botao!: ElementRef<HTMLButtonElement>;

  valor: string | null = null;
  rotuloAtual = '';
  aberto = false;
  termo = '';
  destaque = 0;
  visiveis: OpcaoSelectBusca[] = [];
  maisQueOLimite = false;
  desabilitado = false;
  pos: { left: number; width: number; top: number | null; bottom: number | null } = { left: 0, width: 0, top: 0, bottom: null };

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);
  private painelNoBody: HTMLElement | null = null;
  private normalizadas: { o: OpcaoSelectBusca; chave: string }[] = [];
  private onChange: (v: string | null) => void = () => {};
  private onTouched: () => void = () => {};

  @ViewChild('painel')
  set painel(ref: ElementRef<HTMLElement> | undefined) {
    this.painelNoBody = ref?.nativeElement ?? null;
    if (this.painelNoBody) {
      document.body.appendChild(this.painelNoBody);
      this.painelNoBody.querySelector('input')?.focus();
    }
  }

  ngOnChanges(): void {
    this.normalizadas = this.opcoes.map(o => ({ o, chave: semAcento(`${o.rotulo} ${o.detalhe ?? ''}`) }));
    this.sincronizarRotulo();
    this.filtrar(this.termo);
  }

  ngOnDestroy(): void {
    this.pararDeEscutar();
    this.painelNoBody?.remove();
  }

  alternar() {
    if (this.aberto) this.fechar();
    else this.abrir();
  }

  abrir() {
    if (this.desabilitado) return;
    this.aberto = true;
    this.filtrar('');
    const i = this.visiveis.findIndex(o => o.valor === this.valor);
    this.destaque = i >= 0 ? i : 0;
    this.posicionar();
    this.escutar();
    this.cdr.markForCheck();
  }

  fechar() {
    if (!this.aberto) return;
    this.aberto = false;
    this.pararDeEscutar();
    this.onTouched();
    this.cdr.markForCheck();
  }

  filtrar(texto: string) {
    this.termo = texto;
    const t = semAcento(texto.trim());
    const todas = t ? this.normalizadas.filter(n => n.chave.includes(t)).map(n => n.o) : this.opcoes;
    this.visiveis = todas.slice(0, MAX_VISIVEIS);
    this.maisQueOLimite = todas.length > MAX_VISIVEIS;
    this.destaque = 0;
  }

  teclado(e: KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); this.destaque = Math.min(this.destaque + 1, this.visiveis.length - 1); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); this.destaque = Math.max(this.destaque - 1, 0); }
    else if (e.key === 'Enter') { e.preventDefault(); const o = this.visiveis[this.destaque]; if (o) this.escolher(o); }
    else if (e.key === 'Escape') { e.preventDefault(); this.fechar(); this.botao.nativeElement.focus(); }
  }

  escolher(o: OpcaoSelectBusca) {
    this.valor = o.valor;
    this.rotuloAtual = o.rotulo;
    this.onChange(o.valor);
    this.fechar();
  }

  limpar(e: Event) {
    e.stopPropagation();
    this.valor = null;
    this.rotuloAtual = '';
    this.onChange(null);
    this.onTouched();
    this.cdr.markForCheck();
  }

  writeValue(v: string | null): void {
    this.valor = v || null;
    this.sincronizarRotulo();
    this.cdr.markForCheck();
  }
  registerOnChange(fn: (v: string | null) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.desabilitado = d; this.cdr.markForCheck(); }

  private sincronizarRotulo() {
    this.rotuloAtual = this.opcoes.find(o => o.valor === this.valor)?.rotulo ?? '';
  }

  private posicionar() {
    const r = this.botao.nativeElement.getBoundingClientRect();
    const altura = window.innerHeight;
    const paraCima = altura - r.bottom < ALTURA_PAINEL && r.top > altura - r.bottom;
    this.pos = { left: r.left, width: Math.max(r.width, 240), top: paraCima ? null : r.bottom + 4, bottom: paraCima ? altura - r.top + 4 : null };
  }

  private dentro(alvo: EventTarget | null): boolean {
    return alvo instanceof Node && (this.host.nativeElement.contains(alvo) || !!this.painelNoBody?.contains(alvo));
  }

  private readonly aoClicar = (e: MouseEvent) => { if (!this.dentro(e.target)) this.zone.run(() => this.fechar()); };
  private readonly aoRolar = (e: Event) => {
    if (!this.dentro(e.target)) this.zone.run(() => { this.posicionar(); this.cdr.markForCheck(); });
  };

  private escutar() {
    this.zone.runOutsideAngular(() => {
      document.addEventListener('mousedown', this.aoClicar);
      document.addEventListener('scroll', this.aoRolar, true);
      window.addEventListener('resize', this.aoRolar);
    });
  }

  private pararDeEscutar() {
    document.removeEventListener('mousedown', this.aoClicar);
    document.removeEventListener('scroll', this.aoRolar, true);
    window.removeEventListener('resize', this.aoRolar);
  }
}
