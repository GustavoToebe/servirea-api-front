import { CommonModule } from '@angular/common';
import { CampoCompetenciaComponent } from '../../../../shared/components/datas/campo-competencia.component';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EscalaDetalhe, EscalaEvento, MESES, STATUS_LABEL, StatusEscala } from '../../models/escala.model';
import { EscalasService } from '../../services/escalas.service';
import { ExportService } from '../../services/export.service';
import { ReplicarDialogComponent } from '../replicar-dialog.component';
import { CabecalhoPaginaComponent } from '../../../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { DialogoService } from '../../../../shared/services/dialogo.service';
import { BarraFiltrosComponent, FiltroAtivo } from '../../../../shared/components/barra-filtros/barra-filtros.component';

@Component({
    selector: 'app-escalas-list',
    imports: [CommonModule, FormsModule, RouterLink, CampoCompetenciaComponent, BarraFiltrosComponent, ReplicarDialogComponent, CabecalhoPaginaComponent],
    template: `
    <div class="space-y-6">
      <app-cabecalho-pagina titulo="Escalas litúrgicas" subtitulo="As escalas do mês, com as vagas preenchidas e as que ainda estão livres.">
        <a acoes routerLink="/escalas/layouts" class="btn-secondary">Layouts</a>
        <a acoes routerLink="/escalas/indisponibilidades" class="btn-secondary">Indisponibilidades</a>
        <a acoes routerLink="/escalas/nova" class="btn-primary">＋ Nova escala</a>
      </app-cabecalho-pagina>

      <app-barra-filtros placeholder="Buscar escala ou celebração" [(termo)]="busca" (buscar)="load()"
        [filtrosAtivos]="filtrosAtivos" (removerFiltro)="removerFiltro($event)" (removerTodos)="removerTodosFiltros()">
        <div class="flex flex-col gap-1">
          <label class="label">Mês</label>
          <div class="flex items-center gap-2">
            <app-campo-competencia class="block flex-1" [ngModel]="competencia()" (ngModelChange)="escolherCompetencia($event)" [limpavel]="false" />
            <button type="button" class="btn-secondary !px-2 !py-1 text-xs" (click)="irPara(hojeAno, hojeMes)">Este mês</button>
            <button type="button" class="btn-secondary !px-2 !py-1 text-xs" (click)="irPara(proximo.ano, proximo.mes)">Próximo mês</button>
          </div>
        </div>
        <div class="flex flex-col gap-1">
          <label class="label">Situação</label>
          <select class="field" [(ngModel)]="filters.status">
            @for (opcao of statusOpcoes; track opcao.id) {
              <option [value]="opcao.id">{{ opcao.label }}</option>
            }
          </select>
        </div>
      </app-barra-filtros>

      @if (error) {
        <div class="rounded-xl bg-red-50 p-4 text-red-700">{{ error }}</div>
      }
      @if (loading && !escalas.length) {
        <div class="grid gap-4" aria-label="Carregando" aria-live="polite">
          @for (i of [1, 2, 3]; track i) {
            <div class="card h-40 bg-slate-100 motion-safe:animate-pulse" data-esqueleto></div>
          }
        </div>
      }
      @if (!loading && !escalas.length) {
        <div class="card p-10 text-center text-slate-500">Nenhuma escala neste período.</div>
      }

      @if (escalas.length) {
      <div class="grid gap-4">
        @for (e of escalas; track e.id) {
          <article class="card p-5" [attr.data-escala]="e.id">
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="text-xs font-bold uppercase tracking-wider text-slate-400">{{ e.tipo === 'SEMANAL' ? 'Semanal · dias úteis' : 'Mensal · sábados e domingos' }}</div>
                <h2 class="mt-1 text-lg font-black">{{ e.titulo }}</h2>
                <div class="text-sm text-slate-500">{{ months[e.mes - 1] }} de {{ e.ano }} · {{ missas(e) }} {{ missas(e) === 1 ? 'celebração' : 'celebrações' }}</div>
              </div>
              <span class="badge" [ngClass]="statusClass(e.status)">{{ status(e.status) }}</span>
            </div>
            <div class="mt-3 max-w-md">
              <div class="text-sm font-semibold text-slate-600">{{ preenchidas(e) }} de {{ vagas(e) }} vagas</div>
              <div class="mt-1 h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" [attr.aria-valuenow]="progresso(e)" aria-valuemin="0" aria-valuemax="100">
                <div class="h-full" [class.bg-emerald-500]="progresso(e) === 100" [class.bg-violet-600]="progresso(e) < 100" [style.width.%]="progresso(e)"></div>
              </div>
            </div>
            <div class="mt-4 flex flex-wrap gap-2">
              <a [routerLink]="['/escalas', e.id]" class="btn-primary !py-2">{{ e.status === 'RASCUNHO' ? 'Completar' : 'Abrir' }}</a>
              @if (e.status === 'FINALIZADA') {
                <button class="btn-secondary !py-2" (click)="exportPdf(e)">PDF</button>
                <button class="btn-secondary !py-2" (click)="exportPng(e)">PNG</button>
              }
              @if (e.tipo === 'SEMANAL' && e.status !== 'CANCELADA') {
                <button type="button" class="btn-secondary !py-2" (click)="replicar(e)" [attr.data-replicar]="e.id">Replicar</button>
              }
              @if (e.status === 'CANCELADA') {
                <button class="btn-danger !py-2" (click)="remove(e)">Excluir</button>
              }
            </div>
          </article>
        }
      </div>
      }
    </div>
    <app-replicar-dialog [open]="!!origemReplica" [origem]="origemReplica" (fechar)="origemReplica = null" />
    `
})
export class EscalasListComponent implements OnInit {
  busca = "";
  months = MESES;
  rows: EscalaDetalhe[] = [];
  loading = true;
  error = '';
  hojeAno = new Date().getFullYear();
  hojeMes = new Date().getMonth() + 1;
  filters = { ano: this.hojeAno, mes: this.hojeMes, tipo: '' as const, status: '' as StatusEscala | '' };
  statusOpcoes: { id: StatusEscala | ''; label: string }[] = [
    { id: '', label: 'Todas' },
    { id: 'RASCUNHO', label: 'Não finalizada' },
    { id: 'FINALIZADA', label: 'Finalizada' },
    { id: 'CANCELADA', label: 'Cancelada' }
  ];

  private dialogo = inject(DialogoService);

  constructor(private service: EscalasService, private exporter: ExportService) {}

  get proximo() {
    return this.hojeMes === 12 ? { ano: this.hojeAno + 1, mes: 1 } : { ano: this.hojeAno, mes: this.hojeMes + 1 };
  }

  /** Um cartão por escala (29/09/2026: um por missa repetia a mesma escala dezenas de vezes). A busca olha o título e as celebrações. */
  get escalas(): EscalaDetalhe[] {
    if (!this.busca) return this.rows;
    const normalizar = (v: string) => (v || '').normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
    const termo = normalizar(this.busca);
    return this.rows.filter(e => normalizar(e.titulo).includes(termo)
      || this.celebracoesReais(e).some(ev => normalizar(ev.celebracao).includes(termo)));
  }

  origemReplica: EscalaDetalhe | null = null;

  replicar(e: EscalaDetalhe) {
    this.origemReplica = e;
  }

  ngOnInit() { void this.load(); }

  mesmoMes(ano: number, mes: number) {
    return this.filters.ano === ano && this.filters.mes === mes;
  }

  /** Mês do filtro em `AAAA-MM`, para o campo MM/AAAA. */
  competencia() {
    return `${this.filters.ano}-${String(this.filters.mes).padStart(2, '0')}`;
  }

  escolherCompetencia(competencia: string) {
    if (competencia) this.irPara(Number(competencia.slice(0, 4)), Number(competencia.slice(5, 7)));
  }

  irPara(ano: number, mes: number) {
    this.filters.ano = ano;
    this.filters.mes = mes;
    void this.load();
  }


  get filtrosAtivos(): FiltroAtivo[] {
    const f: FiltroAtivo[] = [];
    f.push({ chave: 'mes', rotulo: `Mês: ${String(this.filters.mes).padStart(2, '0')}/${this.filters.ano}` });
    if (this.filters.status) {
      const op = this.statusOpcoes.find(o => o.id === this.filters.status);
      if (op) f.push({ chave: 'status', rotulo: 'Situação: ' + op.label });
    }
    if (this.busca) {
      f.push({ chave: 'busca', rotulo: 'Busca: ' + this.busca });
    }
    return f;
  }

  removerFiltro(chave: string) {
    if (chave === 'mes') { this.irPara(this.hojeAno, this.hojeMes); }
    if (chave === 'status') { this.filters.status = ''; this.load(); }
    if (chave === 'busca') { this.busca = ''; this.load(); }
  }

  removerTodosFiltros() {
    this.filters.status = '';
    this.busca = '';
    this.irPara(this.hojeAno, this.hojeMes);
  }

  setStatus(status: StatusEscala | '') {
    this.filters.status = status;
    void this.load();
  }

  async load() {
    const cache = this.service.emCache(this.filters);
    if (cache) {
      this.rows = cache;
      this.loading = false;
    } else {
      this.loading = true;
    }
    this.error = '';
    try {
      this.rows = await this.service.list(this.filters);
    } catch (e: unknown) {
      this.error = e instanceof Error ? e.message : 'Erro ao carregar escalas.';
    } finally {
      this.loading = false;
    }
  }

  status(s: StatusEscala) { return STATUS_LABEL[s]; }
  statusClass(s: StatusEscala) {
    return s === 'FINALIZADA' ? 'bg-emerald-50 text-emerald-700' : s === 'CANCELADA' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700';
  }
  /** Linha de referência (escala replicada) não conta: não é celebração. */
  private celebracoesReais(e: EscalaDetalhe): EscalaEvento[] { return (e.eventos || []).filter(ev => !ev.referencia); }
  missas(e: EscalaDetalhe) { return this.celebracoesReais(e).length; }
  vagas(e: EscalaDetalhe) { return this.celebracoesReais(e).reduce((n, ev) => n + ev.vagas.length, 0); }
  preenchidas(e: EscalaDetalhe) { return this.celebracoesReais(e).reduce((n, ev) => n + ev.vagas.filter(v => v.voluntario_id).length, 0); }
  progresso(e: EscalaDetalhe) { const total = this.vagas(e); return total ? Math.round(this.preenchidas(e) / total * 100) : 0; }

  async remove(e: EscalaDetalhe) {
    if (!await this.dialogo.confirmar({ titulo: 'Excluir escala?', mensagem: `Excluir definitivamente a escala "${e.titulo}"? Esta ação não pode ser desfeita.`, confirmar: 'Excluir', perigo: true })) return;
    try {
      await this.service.deleteCancelled(e.id);
      await this.load();
    } catch (err: unknown) {
      this.error = err instanceof Error ? err.message : 'Não foi possível excluir.';
    }
  }

  async exportPdf(e: EscalaDetalhe) {
    try { await this.exporter.exportPdf(e); }
    catch (err: unknown) { this.error = err instanceof Error ? err.message : 'Erro ao exportar PDF.'; }
  }

  async exportPng(e: EscalaDetalhe) {
    try { await this.exporter.exportPng(e); }
    catch (err: unknown) { this.error = err instanceof Error ? err.message : 'Erro ao exportar PNG.'; }
  }
}
