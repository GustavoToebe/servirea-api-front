import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ajudaDaRota } from '../../../features/ajuda/ajuda-da-rota';

/** Botão "Ajuda" para páginas que não usam `app-cabecalho-pagina`; abre o tema que explica a tela atual. */
@Component({
  selector: 'app-ajuda-link',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@if (tema; as t) { <a routerLink="/ajuda" [queryParams]="{ tema: t }" class="btn-secondary !py-2" data-ajuda aria-label="Ajuda desta tela">Ajuda</a> }`
})
export class AjudaLinkComponent {
  private readonly router = inject(Router);
  get tema(): string | null { return ajudaDaRota(this.router.url); }
}
