import { ChangeDetectionStrategy, Component, ElementRef, HostListener, OnInit, ViewChild, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FavoritosService } from './favoritos.service';
import { TelaNav, agruparPorSecao, buscarTelas, tituloDaSecao } from './navegacao';

/**
 * Menu completo ("todas as telas"): busca no topo e as telas agrupadas por seção em colunas, cada uma com estrela de favorito.
 * Abre a partir do botão do cabeçalho; Esc ou o X fecham. Escolher uma tela navega e fecha.
 */
@Component({
  selector: 'app-mega-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule],
  template: `
    <div class="fixed inset-0 z-[60] overflow-y-auto bg-brand-navy text-white" role="dialog" aria-modal="true" aria-label="Todas as telas" data-mega-menu>
      <div class="mx-auto max-w-7xl px-4 py-6 md:px-8">
        <div class="flex items-center gap-3">
          <label class="sr-only" for="mega-busca">O que você deseja fazer?</label>
          <div class="flex flex-1 items-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
            <svg class="h-5 w-5 shrink-0 text-violet-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
            <input #campo id="mega-busca" type="search" autocomplete="off" placeholder="O que você deseja fazer?" class="min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-violet-200/70"
              [ngModel]="termo()" (ngModelChange)="termo.set($event)" data-mega-busca>
          </div>
          <button type="button" class="rounded-xl p-3 text-2xl leading-none text-violet-100 hover:bg-white/10" aria-label="Fechar menu completo" (click)="fechar.emit()" data-mega-fechar>✕</button>
        </div>

        @if (termo().trim()) {
          <ul class="mt-6 space-y-1" data-mega-resultados>
            @for (t of resultados(); track t.id) {
              <li class="flex items-center gap-2">
                <button type="button" class="p-2 text-xl" [class.text-amber-300]="favoritos.eFavorito(t.id)" [attr.aria-pressed]="favoritos.eFavorito(t.id)" [attr.aria-label]="'Favoritar ' + t.rotulo" (click)="favoritos.alternar(t.id)">{{ favoritos.eFavorito(t.id) ? '★' : '☆' }}</button>
                <button type="button" class="flex-1 rounded-xl px-3 py-2 text-left hover:bg-white/10" (click)="abrir(t)">{{ t.rotulo }} <span class="ml-2 text-xs text-violet-200/70">{{ tituloDaSecao(t.secao) }}</span></button>
              </li>
            } @empty {
              <li class="px-3 py-4 text-violet-200" data-mega-sem-resultado>Nenhuma tela encontrada. Tente outra palavra.</li>
            }
          </ul>
        } @else {
          <div class="mt-8 grid gap-x-10 gap-y-8 sm:grid-cols-2 xl:grid-cols-4">
            @for (g of grupos(); track g.secao.id) {
              <section [attr.data-secao]="g.secao.id">
                <h2 class="mb-2 text-lg font-extrabold uppercase tracking-wide">{{ g.secao.titulo }}</h2>
                <ul class="space-y-0.5">
                  @for (t of g.telas; track t.id) {
                    <li class="flex items-center gap-1">
                      <button type="button" class="p-1.5 text-xl leading-none" [class.text-amber-300]="favoritos.eFavorito(t.id)" [class.text-violet-300]="!favoritos.eFavorito(t.id)" [attr.aria-pressed]="favoritos.eFavorito(t.id)" [attr.aria-label]="'Favoritar ' + t.rotulo" (click)="favoritos.alternar(t.id)" data-favoritar>{{ favoritos.eFavorito(t.id) ? '★' : '☆' }}</button>
                      <button type="button" class="flex-1 rounded-lg px-2 py-1.5 text-left text-violet-50 hover:bg-white/10" (click)="abrir(t)" data-mega-tela>{{ t.rotulo }}</button>
                    </li>
                  }
                </ul>
              </section>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class MegaMenuComponent implements OnInit {
  protected readonly favoritos = inject(FavoritosService);
  private readonly router = inject(Router);
  @ViewChild('campo', { static: true }) campo?: ElementRef<HTMLInputElement>;

  readonly telas = input<readonly TelaNav[]>([]);
  readonly fechar = output<void>();
  readonly termo = signal('');

  readonly grupos = computed(() => agruparPorSecao(this.telas()));
  readonly resultados = computed(() => buscarTelas(this.telas(), this.termo()));
  protected readonly tituloDaSecao = tituloDaSecao;

  ngOnInit() { queueMicrotask(() => this.campo?.nativeElement.focus()); }

  abrir(t: TelaNav) {
    void this.router.navigate([t.url], { queryParams: t.consulta });
    this.fechar.emit();
  }

  @HostListener('document:keydown.escape')
  aoEsc() { this.fechar.emit(); }
}
