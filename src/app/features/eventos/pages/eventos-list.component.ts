import { ChangeDetectionStrategy, Component, OnInit, OnDestroy, computed, inject, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { coletarExportacao } from '../../../shared/utils/coletar-exportacao';
import { exportarTabela, FormatoExportacao } from '../../../shared/utils/exportacao-tabela';
import { CabecalhoPaginaComponent } from '../../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { SessaoAtual } from '../../../core/layout/sessao-atual';
import { EventosApiService } from '../eventos-api.service';
import { EventoResumo, SITUACAO_EVENTO, rotuloQuando } from '../eventos.models';

/** Eventos da paróquia: próximos primeiro (do mais perto ao mais longe), depois os passados e cancelados. */
@Component({
  selector: 'app-eventos-list',
  imports: [NgTemplateOutlet, RouterLink, FormsModule, CabecalhoPaginaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <app-cabecalho-pagina titulo="Eventos" subtitulo="Retiros, encontros e festas: inscreva as pessoas e o WhatsApp avisa e lembra.">
        
        @if (podeCriar()) {
          <a acoes routerLink="/eventos/novo" class="btn-primary" data-acao="novo">＋ Novo evento</a>
        }
        <div acoes class="flex items-center gap-2"><select class="field !w-auto" aria-label="Formato da listagem" [(ngModel)]="formatoExportacao"><option value="xlsx">Excel (XLSX)</option><option value="csv">CSV</option><option value="json">JSON</option><option value="pdf">PDF</option><option value="png">Imagem</option></select><button type="button" class="btn-secondary" [disabled]="carregando() || exportando()" (click)="exportar()">{{exportando() ? 'Preparando...' : 'Exportar eventos'}}</button></div>
      </app-cabecalho-pagina>

      @if (erro(); as mensagem) {
        <div class="rounded-xl bg-red-50 p-4 text-red-700 dark:bg-red-950/40 dark:text-red-300" data-estado="erro">{{ mensagem }}</div>
      } @else if (eventos() === null) {
        <div class="card p-10 text-center text-[var(--muted)]" data-estado="carregando">Carregando...</div>
      } @else {
        <section class="space-y-3">
          <h2 class="text-lg font-black text-[var(--ink)]">Próximos</h2>
          @if (proximos().length) {
            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              @for (e of proximos(); track e.id) {
                <ng-container *ngTemplateOutlet="cartao; context: { $implicit: e }" />
              }
            </div>
          } @else {
            <div class="card p-8 text-center text-sm text-[var(--muted)]" data-estado="vazio">Nenhum próximo evento nesta página.</div>
          }
        </section>
        @if (passados().length) {
          <section class="space-y-3">
            <h2 class="text-lg font-black text-[var(--ink)]">Passados e cancelados</h2>
            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              @for (e of passados(); track e.id) {
                <ng-container *ngTemplateOutlet="cartao; context: { $implicit: e }" />
              }
            </div>
          </section>
        }
        <nav class="flex items-center justify-between gap-3" aria-label="Páginas de eventos">
          <button class="btn-secondary" [disabled]="carregando() || pagina() === 0" (click)="mudarPagina(-1)">Anterior</button>
          <span class="text-sm text-[var(--muted)]">{{ total() }} eventos · Página {{ pagina()+1 }} de {{ paginas() || 1 }}</span>
          <button class="btn-secondary" [disabled]="carregando() || pagina()+1 >= paginas()" (click)="mudarPagina(1)">Próxima</button>
        </nav>
      }
    </div>

    <ng-template #cartao let-e>
      <a [routerLink]="['/eventos', e.id]" class="card block overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg" [attr.data-evento]="e.id">
        @if (e.capaUrl) {
          <img [src]="e.capaUrl" alt="" class="h-40 w-full object-cover">
        } @else {
          <div class="flex h-40 w-full items-center justify-center text-4xl" [style.background]="'color-mix(in srgb, var(--brand) 12%, transparent)'" aria-hidden="true">📅</div>
        }
        <div class="space-y-2 p-5">
          <div class="flex items-start justify-between gap-3">
            <h3 class="text-lg font-black text-[var(--ink)]">{{ e.titulo }}</h3>
            <span class="badge shrink-0 {{ tom(e) }}">{{ texto(e) }}</span>
          </div>
          <div class="text-sm font-semibold" [style.color]="'var(--brand)'">{{ quando(e.inicio) }}</div>
          @if (e.localNome) { <div class="text-sm text-[var(--muted)]">📍 {{ e.localNome }}</div> }
          <div class="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">
            {{ e.inscritos }} {{ e.inscritos === 1 ? 'inscrito' : 'inscritos' }}@if (e.vagas) { de {{ e.vagas }} vagas }
          </div>
        </div>
      </a>
    </ng-template>
  `
})
export class EventosListComponent implements OnInit, OnDestroy {
  formatoExportacao: FormatoExportacao = 'xlsx';
  readonly exportando = signal(false);
  private destruido = false;
  async exportar() {
    if (this.carregando() || this.exportando()) return;
    this.exportando.set(true); this.erro.set(null);
    try {
      const itens = await coletarExportacao(p => this.api.pagina(p), () => !this.destruido);
      await exportarTabela({ nome: 'eventos', titulo: 'Servirea · Eventos', colunas: ['Título', 'Início', 'Local', 'Situação', 'Inscritos', 'Vagas'], linhas: itens.map(e => [e.titulo, this.quando(e.inicio), e.localNome ?? '', this.texto(e), e.inscritos, e.vagas ?? null]) }, this.formatoExportacao, () => !this.destruido);
    } catch (e) { if (!this.destruido) this.erro.set(e instanceof Error ? e.message : 'Não foi possível exportar.'); }
    finally { if (!this.destruido) this.exportando.set(false); }
  }
  private api = inject(EventosApiService);
  private sessao = inject(SessaoAtual);

  readonly eventos = signal<EventoResumo[] | null>(null);
  readonly erro = signal<string | null>(null);
  readonly podeCriar = computed(() => this.sessao.permissoes().includes('EVENTO_CRIAR'));
  readonly proximos = computed(() => (this.eventos() ?? [])
    .filter(e => e.situacao === 'PUBLICADO' || e.situacao === 'RASCUNHO')
    .sort((a, b) => a.inicio.localeCompare(b.inicio)));
  readonly passados = computed(() => (this.eventos() ?? [])
    .filter(e => e.situacao === 'ENCERRADO' || e.situacao === 'CANCELADO'));

  readonly pagina = signal(0);
  readonly paginas = signal(0);
  readonly total = signal(0);
  readonly carregando = signal(false);
  private pedido = 0;
  async ngOnInit(): Promise<void> { await this.carregar(); }
  async carregar(): Promise<void> {
    const pedido=++this.pedido;
    this.carregando.set(true);this.erro.set(null);
    try {
      const resposta=await this.api.pagina(this.pagina());
      if(pedido!==this.pedido)return;
      this.eventos.set(resposta.itens);this.paginas.set(resposta.paginas);this.total.set(resposta.total);
    } catch(e) {
      if(pedido===this.pedido)this.erro.set((e as Error).message);
    } finally {if(pedido===this.pedido)this.carregando.set(false);}
  }
  async mudarPagina(delta:number): Promise<void> {
    const destino=this.pagina()+delta;
    if(this.carregando() || destino<0 || destino>=this.paginas())return;
    this.pagina.set(destino);await this.carregar();
  }
  ngOnDestroy(): void {this.destruido=true;this.pedido++;}

  readonly quando = rotuloQuando;

  texto(e: EventoResumo): string {
    return SITUACAO_EVENTO[e.situacao].texto;
  }

  tom(e: EventoResumo): string {
    return SITUACAO_EVENTO[e.situacao].tom;
  }
}
