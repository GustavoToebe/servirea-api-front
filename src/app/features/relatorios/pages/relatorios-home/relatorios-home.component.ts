import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Escala, EscalaFilters, MESES } from '../../../escalas/models/escala.model';
import { EscalasService } from '../../../escalas/services/escalas.service';
import { ExportService } from '../../../escalas/services/export.service';

@Component({
  selector: 'app-relatorios-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <div>
        <h1 class="text-2xl font-black">Relatórios e exportações</h1>
        <p class="text-sm text-slate-500">Ao abrir, a lista já vem no mês atual. Troque o filtro se quiser ver outro período.</p>
      </div>

      <section class="card p-5">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label class="label">Ano</label>
            <select class="field" [(ngModel)]="filters.ano">
              <option [ngValue]="null">Todos</option>
              <option *ngFor="let y of years" [ngValue]="y">{{ y }}</option>
            </select>
          </div>
          <div>
            <label class="label">Mês</label>
            <select class="field" [(ngModel)]="filters.mes">
              <option [ngValue]="null">Todos</option>
              <option *ngFor="let m of months; let i=index" [ngValue]="i+1">{{ m }}</option>
            </select>
          </div>
          <div>
            <label class="label">Tipo de escala</label>
            <select class="field" [(ngModel)]="filters.tipo">
              <option value="">Todos</option>
              <option value="SEMANAL">Semanal</option>
              <option value="MENSAL">Mensal / fim de semana</option>
            </select>
          </div>
          <div class="flex items-end gap-2">
            <button class="btn-primary" type="button" (click)="load()">Filtrar</button>
            <button class="btn-secondary" type="button" (click)="clear()">Limpar</button>
          </div>
        </div>
      </section>

      <section class="card p-6">
        <div class="mb-5">
          <h2 class="text-lg font-black">Escalas finalizadas</h2>
          <p class="text-sm text-slate-500">Somente escalas finalizadas aparecem aqui. O PDF e a imagem PNG saem no formato da planilha, com os dias separados e as funções coloridas.</p>
        </div>
        <div *ngIf="loading" class="py-8 text-center text-slate-500">Carregando...</div>
        <div *ngIf="error" class="rounded-xl bg-red-50 p-4 text-red-700">{{ error }}</div>
        <div class="divide-y divide-slate-100">
          <div *ngFor="let e of rows" class="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <strong>{{ e.titulo }}</strong>
              <div class="text-sm text-slate-500">{{ months[e.mes-1] }} / {{ e.ano }} • {{ e.tipo==='SEMANAL' ? 'Semanal' : 'Mensal / fim de semana' }}</div>
            </div>
            <div class="flex gap-2">
              <button class="btn-primary !py-2" (click)="pdf(e)">Baixar PDF</button>
              <button class="btn-secondary !py-2" (click)="png(e)">Baixar PNG</button>
            </div>
          </div>
          <div *ngIf="!loading && !rows.length" class="py-8 text-center text-sm text-slate-400">Nenhuma escala finalizada neste filtro.</div>
        </div>
      </section>
    </div>
  `
})
export class RelatoriosHomeComponent implements OnInit {
  rows: Escala[] = [];
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

  ngOnInit() { void this.load(); }

  async load() {
    this.loading = true;
    this.error = '';
    try {
      this.rows = await this.service.list({ ...this.filters, status: 'FINALIZADA' });
    } catch (e: any) {
      this.error = e?.message || 'Erro ao carregar relatórios.';
    } finally {
      this.loading = false;
    }
  }

  clear() {
    this.filters = { ano: null, mes: null, tipo: '', status: 'FINALIZADA' };
    void this.load();
  }

  async pdf(e: Escala) {
    try { await this.exporter.exportPdf(await this.service.getById(e.id)); }
    catch (err: any) { this.error = err?.message || 'Erro ao gerar PDF.'; }
  }

  async png(e: Escala) {
    try { await this.exporter.exportPng(await this.service.getById(e.id)); }
    catch (err: any) { this.error = err?.message || 'Erro ao gerar PNG.'; }
  }
}
