import { ChangeDetectionStrategy, Component, DestroyRef, Input, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { exportarTabela, FormatoExportacao, TabelaExportacao } from '../../utils/exportacao-tabela';
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
  imports: [RouterLink, FormsModule],
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
          @if (exportacao) {
            <select class="field !w-auto" aria-label="Formato da exportação" [(ngModel)]="formato" [ngModelOptions]="{standalone:true}"><option value="xlsx">Excel (XLSX)</option><option value="csv">CSV</option><option value="json">JSON</option><option value="pdf">PDF</option><option value="png">Imagem</option></select>
            <button type="button" class="btn-secondary" [disabled]="exportando() || exportacaoOcupada" (click)="exportar()">{{exportando() ? 'Preparando...' : 'Exportar filtrados'}}</button>
          }
          @if (temaDeAjuda; as tema) {
            <a routerLink="/ajuda" [queryParams]="{ tema }" class="btn-secondary" data-ajuda aria-label="Ajuda desta tela">Ajuda</a>
          }
        </div>
      </div>
      @if (subtitulo) { <p class="mt-1 text-sm text-slate-500" data-subtitulo>{{ subtitulo }}</p> }
      @if (erroExportacao()) {<p class="mt-3 text-sm text-red-700 dark:text-red-300" role="alert">{{erroExportacao()}}</p>}
    </header>
  `
})
export class CabecalhoPaginaComponent {
  @Input() exportacao?: () => TabelaExportacao | Promise<TabelaExportacao>;
  @Input() exportacaoOcupada = false;
  readonly exportando = signal(false);
  readonly erroExportacao = signal('');
  formato: FormatoExportacao = 'xlsx';
  private destruido = false;
  constructor() { inject(DestroyRef).onDestroy(() => { this.destruido = true; }); }
  async exportar() {
    if (!this.exportacao || this.exportando() || this.exportacaoOcupada) return;
    const formato = this.formato; this.exportando.set(true); this.erroExportacao.set('');
    try { await exportarTabela(await this.exportacao(), formato, () => !this.destruido); }
    catch (e) { if (!this.destruido) this.erroExportacao.set(e instanceof Error ? e.message : 'Não foi possível exportar.'); }
    finally { if (!this.destruido) this.exportando.set(false); }
  }
  private readonly router = inject(Router);
  @Input({ required: true }) titulo = '';
  @Input() subtitulo = '';
  @Input() icone = '';
  /** Para páginas que já têm a própria explicação na tela. */
  @Input() semAjuda = false;

  get temaDeAjuda(): string | null { return this.semAjuda ? null : ajudaDaRota(this.router.url); }
}
