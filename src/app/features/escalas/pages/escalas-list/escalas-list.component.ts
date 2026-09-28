import { CommonModule } from '@angular/common';
import { NumeroComponent } from '../../../../shared/components/numero/numero.component';
import { CampoCompetenciaComponent } from '../../../../shared/components/datas/campo-competencia.component';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { rotuloDia } from '../../data/calendario-liturgico';
import { EscalaDetalhe, EscalaEvento, MESES, STATUS_LABEL, StatusEscala } from '../../models/escala.model';
import { EscalasService } from '../../services/escalas.service';
import { ExportService } from '../../services/export.service';
import { DialogoService } from '../../../../shared/services/dialogo.service';
import { BarraFiltrosComponent, FiltroAtivo } from '../../../../shared/components/barra-filtros/barra-filtros.component';
import { FUNCOES_LABEL } from '../../../pessoas/models/pessoa.model';

interface CelebracaoVista {
  escala: EscalaDetalhe;
  evento: EscalaEvento;
}

@Component({
    selector: 'app-escalas-list',
    imports: [CommonModule, FormsModule, RouterLink, NumeroComponent, CampoCompetenciaComponent, BarraFiltrosComponent],
    template: `
    <div class="space-y-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div class="text-xs font-extrabold uppercase tracking-wider text-brand-blue">Gestão paroquial</div>
          <h1 class="text-2xl font-black text-slate-900">Escalas litúrgicas</h1>
          <p class="text-sm text-slate-500">Cada celebração do mês, com as vagas preenchidas e as que ainda estão livres.</p>
        </div>
        <a routerLink="/escalas/nova" class="btn-primary">＋ Nova escala</a>
      </div>

      <app-barra-filtros placeholder="Buscar celebração ou escala" [(termo)]="busca" (buscar)="load()"
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
      @if (loading) {
        <div class="card p-10 text-center text-slate-500">Carregando escalas...</div>
      }
      @if (!loading && !celebracoes.length) {
        <div class="card p-10 text-center text-slate-500">Nenhuma celebração neste período.</div>
      }

      <div class="grid gap-4">
        @for (item of celebracoes; track item.escala.id + item.evento.data + item.evento.horario) {
          <article class="card p-5">
            <div class="flex items-start justify-between gap-3">
              <div>
                <div class="text-xs font-bold uppercase tracking-wider text-slate-400">{{ rotuloDia(item.evento.data) }} · {{ hora(item.evento.horario) }}</div>
                <h2 class="mt-1 text-lg font-black">{{ item.evento.celebracao || 'Missa' }}</h2>
                <div class="text-sm text-slate-500">{{ item.escala.titulo }}<app-numero [numero]="item.escala.sequencial" /> · {{ months[item.escala.mes - 1] }}</div>
              </div>
              <span class="badge" [ngClass]="statusClass(item.escala.status)">{{ status(item.escala.status) }}</span>
            </div>
            <div class="mt-3 text-sm font-semibold text-slate-600">{{ preenchidas(item.evento) }} de {{ item.evento.vagas.length }} vagas</div>
            <div class="mt-3 flex flex-wrap gap-2">
              @for (vaga of item.evento.vagas; track vaga.funcao + vaga.posicao) {
                <span class="rounded-full px-3 py-1 text-xs font-bold" [class.border]="!vaga.voluntario_id" [class.border-dashed]="!vaga.voluntario_id" [class.border-violet-300]="!vaga.voluntario_id" [class.bg-violet-50]="!vaga.voluntario_id" [class.text-violet-700]="!vaga.voluntario_id" [class.bg-slate-100]="!!vaga.voluntario_id">
                  {{ vaga.voluntario_id ? (vaga.voluntario?.nome_completo || 'Servidor') + ' · ' + funcao(vaga.funcao) : 'Vaga · ' + funcao(vaga.funcao) }}
                </span>
              }
            </div>
            <div class="mt-4 flex flex-wrap gap-2">
              <a [routerLink]="['/escalas', item.escala.id]" class="btn-primary !py-2">{{ item.escala.status === 'RASCUNHO' ? 'Completar' : 'Abrir' }}</a>
              @if (item.escala.status === 'FINALIZADA') {
                <button class="btn-secondary !py-2" (click)="exportPdf(item.escala)">PDF</button>
                <button class="btn-secondary !py-2" (click)="exportPng(item.escala)">PNG</button>
              }
              @if (item.escala.status === 'CANCELADA') {
                <button class="btn-danger !py-2" (click)="remove(item.escala)">Excluir</button>
              }
            </div>
          </article>
        }
      </div>
    </div>
    `
})
export class EscalasListComponent implements OnInit {
  busca = "";
  months = MESES;
  rows: EscalaDetalhe[] = [];
  loading = true;
  error = '';
  rotuloDia = rotuloDia;
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

  get celebracoes(): CelebracaoVista[] {
    let list = this.rows.flatMap(escala => (escala.eventos || []).map(evento => ({ escala, evento })));
    if (this.busca) {
      const termo = this.busca.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      list = list.filter(item => {
        const celebracao = (item.evento.celebracao || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        const titulo = (item.escala.titulo || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
        return celebracao.includes(termo) || titulo.includes(termo);
      });
    }
    return list.sort((a, b) => `${a.evento.data} ${a.evento.horario}`.localeCompare(`${b.evento.data} ${b.evento.horario}`));
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
    this.loading = true;
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
  hora(valor: string) { return (valor || '').slice(0, 5); }
  funcao(codigo: string) { return FUNCOES_LABEL[codigo as keyof typeof FUNCOES_LABEL] || codigo; }
  preenchidas(evento: EscalaEvento) { return evento.vagas.filter(v => v.voluntario_id).length; }

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
