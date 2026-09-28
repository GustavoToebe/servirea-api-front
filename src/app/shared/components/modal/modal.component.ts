import {
  AfterViewChecked, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild
} from '@angular/core';

let sequencia = 0;
/** Modais abertos, do mais antigo ao mais recente: Esc fecha só o de cima (ex.: confirmação aberta sobre outro modal). */
const abertos: ModalComponent[] = [];

/**
 * Esqueleto único de modal (PLANO-009, estrutura do SIN+): título + ✕, linha fina, corpo com rolagem própria
 * (até 85 vh) e rodapé `[rodape]` com Cancelar à esquerda e a ação à direita. Esc fecha; o foco fica preso dentro
 * enquanto aberto e volta a quem abriu.
 */
@Component({
  selector: 'app-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (aberto) {
      <div class="fixed inset-0 flex items-center justify-center bg-black/40 p-4" [style.z-index]="camada" (click)="fecharNoFundo && fechar.emit()" data-fundo>
        <div #painel class="card flex max-h-[85vh] w-full flex-col outline-none" tabindex="-1" [attr.role]="papel" aria-modal="true"
             [attr.aria-labelledby]="idTitulo" [attr.aria-label]="rotulo || null" [attr.aria-describedby]="idDescricao || null" [style.max-width.px]="largura"
             (click)="$event.stopPropagation()" (keydown)="prenderFoco($event)">
          <div class="flex items-center justify-between gap-4 border-b border-[var(--line)] px-6 py-4">
            <h2 class="text-lg font-black text-slate-900" [id]="idTitulo">{{ titulo }}</h2>
            @if (mostrarFechar) {
              <button type="button" class="rounded-lg px-2 py-1 text-slate-400 hover:text-slate-700" aria-label="Fechar" (click)="fechar.emit()">✕</button>
            }
          </div>
          <div class="flex-1 overflow-y-auto px-6 py-5"><ng-content /></div>
          <div class="border-t border-[var(--line)] px-6 py-4 empty:hidden"><ng-content select="[rodape]" /></div>
        </div>
      </div>
    }
  `
})
export class ModalComponent implements OnChanges, AfterViewChecked, OnDestroy {
  @Input() aberto = false;
  @Input() titulo = '';
  /** Nome acessível do diálogo quando o spec/usuário procura por ele (além do título). */
  @Input() rotulo = '';
  /** Id do elemento do corpo que descreve o diálogo (`aria-describedby`). */
  @Input() idDescricao = '';
  /** sm ≈ 500, md ≈ 600, lg ≈ 800 px; xl ≈ 900 px só para assistentes com tabela (comunicado). */
  @Input() tamanho: 'sm' | 'md' | 'lg' | 'xl' = 'md';
  @Input() fecharNoFundo = true;
  /** ✕ no topo; o `dialogo-host` esconde (as respostas ficam só nos botões do rodapé). */
  @Input() mostrarFechar = true;
  /** `alertdialog` para confirmações que exigem resposta (ex.: `dialogo-host`). */
  @Input() papel: 'dialog' | 'alertdialog' = 'dialog';
  /** z-index do fundo; o `dialogo-host` fica acima dos outros modais. */
  @Input() camada = 50;
  @Output() fechar = new EventEmitter<void>();

  @ViewChild('painel') painel?: ElementRef<HTMLElement>;

  readonly idTitulo = `modal-titulo-${++sequencia}`;
  private quemAbriu: HTMLElement | null = null;
  private focar = false;

  get largura(): number {
    return { sm: 500, md: 600, lg: 800, xl: 900 }[this.tamanho];
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['aberto']) return;
    if (this.aberto) {
      abertos.push(this);
      this.quemAbriu = document.activeElement as HTMLElement | null;
      this.focar = true;
    } else {
      this.sairDaPilha();
    }
    if (!this.aberto && this.quemAbriu) {
      this.quemAbriu.focus?.();
      this.quemAbriu = null;
    }
  }

  ngOnDestroy(): void {
    this.sairDaPilha();
    // Modal removido ainda aberto (ex.: `@if` do dialogo-host): devolve o foco do mesmo jeito.
    if (this.aberto && this.quemAbriu) this.quemAbriu.focus?.();
  }

  private sairDaPilha(): void {
    const i = abertos.indexOf(this);
    if (i >= 0) abertos.splice(i, 1);
  }

  ngAfterViewChecked(): void {
    if (this.focar && this.painel) {
      this.focar = false;
      this.painel.nativeElement.focus();
    }
  }

  @HostListener('document:keydown.escape')
  aoApertarEsc(): void {
    if (this.aberto && abertos[abertos.length - 1] === this) this.fechar.emit();
  }

  prenderFoco(e: KeyboardEvent): void {
    if (e.key !== 'Tab' || !this.painel) return;
    const fociveis = Array.from(this.painel.nativeElement.querySelectorAll<HTMLElement>(
      'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])'));
    if (!fociveis.length) return;
    const primeiro = fociveis[0];
    const ultimo = fociveis[fociveis.length - 1];
    if (e.shiftKey && document.activeElement === primeiro) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primeiro.focus(); }
  }
}
