import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ajudaDaRota } from '../../../features/ajuda/ajuda-da-rota';

/**
 * Cabeçalho de página (PLANO-009, estrutura do SIN+): ícone + título à esquerda, botões à direita (`[acoes]`),
 * subtítulo pequeno embaixo e linha fina separando do conteúdo. No celular os botões descem.
 * O botão "Ajuda" é automático: abre o tema que explica a tela atual (veja `ajuda-da-rota.ts`).
 */
@Component({
  selector: 'app-cabecalho-pagina',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="border-b border-[var(--line)] pb-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 class="flex items-center gap-2 text-2xl font-black text-slate-900" data-titulo>
          @if (icone) { <span aria-hidden="true">{{ icone }}</span> }
          {{ titulo }}
        </h1>
        <div class="flex flex-wrap items-center gap-2">
          <ng-content select="[acoes]" />
          @if (temaDeAjuda; as tema) {
            <a routerLink="/ajuda" [queryParams]="{ tema }" class="btn-secondary" data-ajuda aria-label="Ajuda desta tela">Ajuda</a>
          }
        </div>
      </div>
      @if (subtitulo) { <p class="mt-1 text-sm text-slate-500" data-subtitulo>{{ subtitulo }}</p> }
    </header>
  `
})
export class CabecalhoPaginaComponent {
  private readonly router = inject(Router);
  @Input({ required: true }) titulo = '';
  @Input() subtitulo = '';
  @Input() icone = '';
  /** Para páginas que já têm a própria explicação na tela. */
  @Input() semAjuda = false;

  get temaDeAjuda(): string | null { return this.semAjuda ? null : ajudaDaRota(this.router.url); }
}
