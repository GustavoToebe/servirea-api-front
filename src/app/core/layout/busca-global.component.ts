import { ChangeDetectionStrategy, Component, ElementRef, HostListener, ViewChild, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FavoritosService } from './favoritos.service';
import { TelaNav, buscarTelas, tituloDaSecao } from './navegacao';

/**
 * Barra "O que você deseja fazer?": digita o nome de uma tela, aba ou ação e abre com Enter (ou clique). Setas navegam,
 * Esc fecha e Ctrl+K (ou Cmd+K) coloca o cursor aqui de qualquer tela. Sem texto, mostra os favoritos.
 */
@Component({
  selector: 'app-busca-global',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="relative w-full">
      <label class="sr-only" for="busca-global">{{ rotulo() }}</label>
      <div class="flex items-center gap-2 rounded-xl border border-[#E7E4F5] bg-white px-3 py-2 focus-within:border-brand-blue focus-within:ring-2 focus-within:ring-brand-blue/20" [class.border-white/30]="escuro()">
        <svg class="h-4 w-4 shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
        <input #campo id="busca-global" type="search" autocomplete="off" role="combobox" aria-autocomplete="list" aria-haspopup="listbox"
          class="min-w-0 flex-1 bg-transparent text-sm text-brand-ink outline-none placeholder:text-slate-400"
          [placeholder]="rotulo()" [attr.aria-expanded]="aberto()" aria-controls="busca-global-lista" [attr.aria-activedescendant]="aberto() && itens().length ? 'busca-global-' + indice() : null"
          [ngModel]="termo()" (ngModelChange)="digitou($event)" (focus)="abrir()" (keydown)="teclou($event)" data-busca-global>
        <kbd class="hidden rounded border border-slate-200 px-1.5 text-[10px] font-semibold text-slate-400 lg:inline">Ctrl K</kbd>
      </div>
      @if (aberto()) {
        <ul id="busca-global-lista" role="listbox" class="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-2 shadow-xl">
          @for (t of itens(); track t.id; let i = $index) {
            <li role="option" [id]="'busca-global-' + i" [attr.aria-selected]="i === indice()">
              <button type="button" class="flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-slate-50"
                [class.bg-slate-100]="i === indice()" (mousedown)="$event.preventDefault()" (click)="abrirTela(t)" data-resultado>
                <span class="font-semibold text-brand-ink">{{ t.rotulo }}</span>
                <span class="text-xs text-slate-400">{{ secao(t) }}</span>
              </button>
            </li>
          } @empty {
            <li class="px-3 py-3 text-sm text-slate-500" data-sem-resultado>
              {{ termo().trim() ? 'Nenhuma tela encontrada para “' + termo().trim() + '”. Tente outra palavra.' : 'Digite o que procura. Marque telas com a estrela no menu completo para vê-las aqui.' }}
            </li>
          }
        </ul>
      }
    </div>
  `
})
export class BuscaGlobalComponent {
  private readonly router = inject(Router);
  private readonly favoritos = inject(FavoritosService);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  @ViewChild('campo') campo?: ElementRef<HTMLInputElement>;

  readonly telas = input<readonly TelaNav[]>([]);
  readonly rotulo = input('O que você deseja fazer?');
  readonly escuro = input(false);
  readonly navegou = output<TelaNav>();

  readonly termo = signal('');
  readonly aberto = signal(false);
  readonly indice = signal(0);

  readonly itens = computed<TelaNav[]>(() => {
    const termo = this.termo();
    if (termo.trim()) return buscarTelas(this.telas(), termo).slice(0, 8);
    const ids = this.favoritos.ids();
    return this.telas().filter(t => ids.includes(t.id)).slice(0, 8);
  });

  secao(t: TelaNav) { return tituloDaSecao(t.secao); }
  abrir() { this.aberto.set(true); }
  focar() { this.campo?.nativeElement.focus(); this.campo?.nativeElement.select(); }

  digitou(valor: string) { this.termo.set(valor); this.indice.set(0); this.aberto.set(true); }

  teclou(e: KeyboardEvent) {
    const total = this.itens().length;
    if (e.key === 'ArrowDown') { e.preventDefault(); this.aberto.set(true); this.indice.set(total ? (this.indice() + 1) % total : 0); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); this.indice.set(total ? (this.indice() - 1 + total) % total : 0); }
    else if (e.key === 'Enter') { const t = this.itens()[this.indice()]; if (t) { e.preventDefault(); this.abrirTela(t); } }
    else if (e.key === 'Escape') { this.aberto.set(false); (e.target as HTMLElement).blur(); }
  }

  abrirTela(t: TelaNav) {
    void this.router.navigate([t.url], { queryParams: t.consulta });
    this.termo.set(''); this.aberto.set(false); this.indice.set(0);
    this.navegou.emit(t);
  }

  @HostListener('document:keydown', ['$event'])
  atalho(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); this.focar(); }
  }

  @HostListener('document:click', ['$event'])
  cliqueFora(e: Event) {
    if (this.aberto() && !this.host.nativeElement.contains(e.target as Node)) this.aberto.set(false);
  }
}
