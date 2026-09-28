import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CabecalhoPaginaComponent } from '../../../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { EscalaDetalhe, EscalaFilters, MESES } from '../../../escalas/models/escala.model';
import { EscalasService } from '../../../escalas/services/escalas.service';
import { ExportService } from '../../../escalas/services/export.service';
import { FUNCOES_LABEL, FuncaoEscala } from '../../../pessoas/models/pessoa.model';

interface Barra {
  rotulo: string;
  total: number;
  pct: number;
}

interface Ranking {
  nome: string;
  vezes: number;
}

@Component({
    selector: 'app-relatorios-home',
    imports: [FormsModule, CabecalhoPaginaComponent],
    template: `
    <div class="space-y-6">
      <app-cabecalho-pagina titulo="Relatórios e frequência" subtitulo="Presenças já lançadas nas escalas finalizadas, e o PDF ou PNG para a sacristia." />

      <section class="card p-5">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label class="label">Ano</label>
            <select class="field" [(ngModel)]="filters.ano" (ngModelChange)="load()">
              @for (y of years; track y) { <option [ngValue]="y">{{ y }}</option> }
            </select>
          </div>
          <div>
            <label class="label">Mês</label>
            <select class="field" [(ngModel)]="filters.mes" (ngModelChange)="load()">
              <option [ngValue]="null">Todos</option>
              @for (m of months; track m; let i = $index) { <option [ngValue]="i + 1">{{ m }}</option> }
            </select>
          </div>
          <div>
            <label class="label">Tipo de escala</label>
            <select class="field" [(ngModel)]="filters.tipo" (ngModelChange)="load()">
              <option value="">Todos</option>
              <option value="SEMANAL">Semanal</option>
              <option value="MENSAL">Mensal / fim de semana</option>
            </select>
          </div>
          <div class="flex items-end">
            <button class="btn-secondary" type="button" (click)="clear()">Limpar</button>
          </div>
        </div>
      </section>

      @if (error) {
        <div class="rounded-xl bg-red-50 p-4 text-red-700">{{ error }}</div>
      }

      <div class="grid gap-4 sm:grid-cols-3">
        <div class="card p-5">
          <div class="text-xs font-extrabold uppercase tracking-wider text-slate-500">Presenças</div>
          <div class="mt-2 text-3xl font-black">{{ presencaPct === null ? '—' : presencaPct + '%' }}</div>
          <div class="mt-2 text-xs text-slate-500">Entre as vagas com presença marcada.</div>
        </div>
        <div class="card p-5">
          <div class="text-xs font-extrabold uppercase tracking-wider text-slate-500">Celebrações</div>
          <div class="mt-2 text-3xl font-black">{{ celebracoes }}</div>
          <div class="mt-2 text-xs text-slate-500">Nas escalas finalizadas deste filtro.</div>
        </div>
        <div class="card p-5">
          <div class="text-xs font-extrabold uppercase tracking-wider text-slate-500">Escalas</div>
          <div class="mt-2 text-3xl font-black">{{ rows.length }}</div>
          <div class="mt-2 text-xs text-slate-500">Prontas para imprimir.</div>
        </div>
      </div>

      <section class="card p-6">
        <h2 class="text-lg font-black">Funções mais escaladas</h2>
        <div class="mt-4 space-y-3">
          @for (barra of funcoes; track barra.rotulo) {
            <div>
              <div class="mb-1 flex justify-between text-sm font-semibold">
                <span>{{ barra.rotulo }}</span>
                <span class="text-slate-500">{{ barra.total }}</span>
              </div>
              <div class="h-2 overflow-hidden rounded-full bg-slate-100">
                <div class="h-2 rounded-full bg-brand-blue" [style.width.%]="barra.pct"></div>
              </div>
            </div>
          }
          @if (!loading && !funcoes.length) {
            <p class="text-sm text-slate-400">Nenhuma vaga preenchida neste período.</p>
          }
        </div>
      </section>

      <section class="card p-6">
        <h2 class="text-lg font-black">Quem mais serviu</h2>
        <div class="mt-4 divide-y divide-slate-100">
          @for (pessoa of ranking; track pessoa.nome) {
            <div class="flex items-center justify-between py-3">
              <strong>{{ pessoa.nome }}</strong>
              <span class="text-sm text-slate-500">{{ pessoa.vezes }} {{ pessoa.vezes === 1 ? 'celebração' : 'celebrações' }}</span>
            </div>
          }
          @if (!loading && !ranking.length) {
            <p class="py-4 text-sm text-slate-400">Ainda não há nomes nestas escalas.</p>
          }
        </div>
      </section>

      <section class="card p-6">
        <div class="mb-5">
          <h2 class="text-lg font-black">Para imprimir</h2>
          <p class="text-sm text-slate-500">O PDF e o PNG saem no formato da planilha, com os dias separados.</p>
        </div>
        @if (loading) {
          <div class="py-8 text-center text-slate-500">Carregando...</div>
        }
        <div class="divide-y divide-slate-100">
          @for (e of rows; track e.id) {
            <div class="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <strong>{{ e.titulo }}</strong>
                <div class="text-sm text-slate-500">{{ months[e.mes - 1] }} / {{ e.ano }} · {{ e.tipo === 'SEMANAL' ? 'Semanal' : 'Mensal / fim de semana' }}</div>
              </div>
              <div class="flex gap-2">
                <button class="btn-primary !py-2" (click)="pdf(e)">Baixar PDF</button>
                <button class="btn-secondary !py-2" (click)="png(e)">Baixar PNG</button>
              </div>
            </div>
          }
          @if (!loading && !rows.length) {
            <div class="py-8 text-center text-sm text-slate-400">Nenhuma escala finalizada neste filtro.</div>
          }
        </div>
      </section>
    </div>
    `
})
export class RelatoriosHomeComponent implements OnInit {
  rows: EscalaDetalhe[] = [];
  months = MESES;
  loading = true;
  error = '';
  years = Array.from({ length: 8 }, (_, i) => new Date().getFullYear() + 2 - i);
  filters: EscalaFilters = {
    ano: new Date().getFullYear(),
    mes: new Date().getMonth() + 1,
    tipo: '',
    status: 'FINALIZADA'
  };

  constructor(private service: EscalasService, private exporter: ExportService) {}

  get celebracoes(): number {
    return this.rows.reduce((soma, escala) => soma + (escala.eventos || []).filter(ev => !ev.referencia).length, 0);
  }

  get presencaPct(): number | null {
    const vagas = this.rows.flatMap(e => (e.eventos || []).filter(ev => !ev.referencia)).flatMap(ev => ev.vagas || []);
    const marcadas = vagas.filter(v => v.presenca === 'PRESENTE' || v.presenca === 'FALTOU');
    if (!marcadas.length) return null;
    return Math.round(100 * marcadas.filter(v => v.presenca === 'PRESENTE').length / marcadas.length);
  }

  get funcoes(): Barra[] {
    const contagem = new Map<string, number>();
    for (const vaga of this.rows.flatMap(e => (e.eventos || []).filter(ev => !ev.referencia)).flatMap(ev => ev.vagas || [])) {
      if (!vaga.voluntario_id) continue;
      contagem.set(vaga.funcao, (contagem.get(vaga.funcao) || 0) + 1);
    }
    const maior = Math.max(0, ...contagem.values());
    return [...contagem.entries()]
      .map(([codigo, total]) => ({
        rotulo: FUNCOES_LABEL[codigo as FuncaoEscala] || codigo,
        total,
        pct: maior ? Math.round(100 * total / maior) : 0
      }))
      .sort((a, b) => b.total - a.total);
  }

  get ranking(): Ranking[] {
    const contagem = new Map<string, number>();
    for (const vaga of this.rows.flatMap(e => (e.eventos || []).filter(ev => !ev.referencia)).flatMap(ev => ev.vagas || [])) {
      const nome = vaga.voluntario?.nome_completo;
      if (!nome) continue;
      contagem.set(nome, (contagem.get(nome) || 0) + 1);
    }
    return [...contagem.entries()]
      .map(([nome, vezes]) => ({ nome, vezes }))
      .sort((a, b) => b.vezes - a.vezes)
      .slice(0, 8);
  }

  ngOnInit() { void this.load(); }

  async load() {
    this.loading = true;
    this.error = '';
    try {
      this.rows = await this.service.list({ ...this.filters, status: 'FINALIZADA' });
    } catch (e: unknown) {
      this.error = e instanceof Error ? e.message : 'Erro ao carregar relatórios.';
    } finally {
      this.loading = false;
    }
  }

  clear() {
    this.filters = { ano: new Date().getFullYear(), mes: new Date().getMonth() + 1, tipo: '', status: 'FINALIZADA' };
    void this.load();
  }

  async pdf(e: EscalaDetalhe) {
    try { await this.exporter.exportPdf(e); }
    catch (err: unknown) { this.error = err instanceof Error ? err.message : 'Erro ao gerar PDF.'; }
  }

  async png(e: EscalaDetalhe) {
    try { await this.exporter.exportPng(e); }
    catch (err: unknown) { this.error = err instanceof Error ? err.message : 'Erro ao gerar PNG.'; }
  }
}
