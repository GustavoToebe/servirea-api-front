import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter } from 'rxjs';
import { TelaNav, telaDoEndereco, tituloDaSecao } from './navegacao';

/**
 * Faixa no topo de cada tela: "Seção › Tela" e atalhos para as outras telas da mesma seção, para a pessoa saltar entre telas
 * relacionadas sem voltar ao menu. Some quando a seção só tem uma tela (como o Início).
 */
@Component({
  selector: 'app-navegacao-contextual',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    @if (tela(); as t) {
      @if (irmas().length) {
        <nav aria-label="Você está em" class="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm" data-navegacao-contextual>
          <span class="text-slate-500">{{ secao() }}@if (t.rotulo !== secao()) { <span aria-hidden="true" class="mx-1">›</span><strong class="text-brand-ink" data-tela-atual>{{ t.rotulo }}</strong> }</span>
          <span class="hidden h-4 w-px bg-slate-200 sm:inline-block" aria-hidden="true"></span>
          <ul class="flex flex-wrap items-center gap-2">
            @for (i of irmas(); track i.id) {
              <li><a [routerLink]="[i.url]" [queryParams]="i.consulta" class="rounded-full border border-[#E7E4F5] bg-white px-3 py-1 text-xs font-semibold text-slate-600 transition hover:border-brand-blue hover:text-brand-blue" data-irma>{{ i.rotulo }}</a></li>
            }
            @if (restantes() > 0) {
              <li><button type="button" class="rounded-full px-3 py-1 text-xs font-semibold text-brand-blue hover:underline" (click)="verTodas.emit()" data-ver-todas>+{{ restantes() }} no menu completo</button></li>
            }
          </ul>
        </nav>
      }
    }
  `
})
export class NavegacaoContextualComponent {
  private readonly router = inject(Router);
  readonly telas = input<readonly TelaNav[]>([]);
  readonly verTodas = output<void>();
  private readonly endereco = signal(this.router.url);

  static readonly LIMITE = 7;

  constructor() {
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd), takeUntilDestroyed(inject(DestroyRef)))
      .subscribe(e => this.endereco.set(e.urlAfterRedirects));
  }

  readonly tela = computed(() => telaDoEndereco(this.telas(), this.endereco()));
  readonly secao = computed(() => { const t = this.tela(); return t ? tituloDaSecao(t.secao) : ''; });
  private readonly todasIrmas = computed(() => {
    const t = this.tela(); const todas = this.telas();
    if (!t) return [];
    // O item do menu que só repete as abas de uma tela (ex.: Financeiro e suas abas) não precisa aparecer ao lado delas.
    return todas.filter(x => x.secao === t.secao && x.id !== t.id && !(x.noMenu && !x.consulta && todas.some(y => y.url === x.url && y.consulta)));
  });
  readonly irmas = computed(() => this.todasIrmas().slice(0, NavegacaoContextualComponent.LIMITE));
  readonly restantes = computed(() => Math.max(0, this.todasIrmas().length - NavegacaoContextualComponent.LIMITE));
}
