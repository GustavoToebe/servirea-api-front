import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Escala, EscalaFilters, MESES, STATUS_LABEL, StatusEscala } from '../../models/escala.model';
import { EscalasService } from '../../services/escalas.service';
import { ExportService } from '../../services/export.service';

@Component({
    selector: 'app-escalas-list',
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
    <div class="space-y-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h1 class="text-2xl font-black text-slate-900">Escalas</h1><p class="text-sm text-slate-500">Ao abrir, a lista já vem no mês atual. Troque o filtro se quiser ver outro período.</p></div>
        <a routerLink="/escalas/nova" class="btn-primary">＋ Criar escala</a>
      </div>
    
      <section class="card p-5">
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div><label class="label">Ano</label><select class="field" [(ngModel)]="filters.ano"><option [ngValue]="null">Todos</option>@for (y of years; track y) {
          <option [ngValue]="y">{{ y }}</option>
        }</select></div>
        <div><label class="label">Mês</label><select class="field" [(ngModel)]="filters.mes"><option [ngValue]="null">Todos</option>@for (m of months; track m; let i = $index) {
        <option [ngValue]="i+1">{{ m }}</option>
      }</select></div>
      <div><label class="label">Modelo</label><select class="field" [(ngModel)]="filters.tipo"><option value="">Todos</option><option value="SEMANAL">Semanal</option><option value="MENSAL">Mensal / fim de semana</option></select></div>
      <div><label class="label">Status</label><select class="field" [(ngModel)]="filters.status"><option value="">Todos</option><option value="RASCUNHO">Não finalizada</option><option value="FINALIZADA">Finalizada</option><option value="CANCELADA">Cancelada</option></select></div>
      <div class="flex items-end gap-2"><button class="btn-primary" (click)="load()">Filtrar</button><button class="btn-secondary" (click)="clear()">Limpar</button></div>
    </div>
    </section>
    
    @if (error) {
      <div class="rounded-xl bg-red-50 p-4 text-red-700">{{ error }}</div>
    }
    @if (loading) {
      <div class="card p-10 text-center text-slate-500">Carregando escalas...</div>
    }
    @if (!loading && !rows.length) {
      <div class="card p-10 text-center text-slate-500">Nenhuma escala encontrada.</div>
    }
    
    @if (!loading) {
      <div class="grid gap-4 xl:grid-cols-2">
        @for (e of rows; track e) {
          <article class="card p-5">
            <div class="flex items-start justify-between gap-4">
              <div><div class="text-xs font-bold uppercase tracking-wider text-slate-400">{{ e.tipo === 'SEMANAL' ? 'Escala semanal' : 'Escala mensal / fim de semana' }}</div><h2 class="mt-1 text-lg font-black">{{ e.titulo }}</h2><div class="mt-1 text-sm text-slate-500">{{ months[e.mes-1] }} de {{ e.ano }}</div></div>
              <span class="badge" [ngClass]="statusClass(e.status)">{{ status(e.status) }}</span>
            </div>
            <div class="mt-5 flex flex-wrap gap-2">
              <a [routerLink]="['/escalas', e.id]" class="btn-primary !py-2">{{ e.status === 'RASCUNHO' ? 'Continuar' : 'Abrir' }}</a>
              @if (e.status === 'FINALIZADA') {
                <button class="btn-secondary !py-2" (click)="exportPdf(e)">PDF</button>
              }
              @if (e.status === 'FINALIZADA') {
                <button class="btn-secondary !py-2" (click)="exportPng(e)">PNG</button>
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
    `
})
export class EscalasListComponent implements OnInit {
  months = MESES; rows: Escala[] = []; loading = true; error = '';
  filters: EscalaFilters = { ano: new Date().getFullYear(), mes: new Date().getMonth() + 1, tipo: '', status: '' };
  years = Array.from({length: 8}, (_,i) => new Date().getFullYear()+2-i);
  constructor(private service: EscalasService, private exporter: ExportService) {}
  ngOnInit(){ void this.load(); }
  async load(){this.loading=true;this.error='';try{this.rows=await this.service.list(this.filters);}catch(e:any){this.error=e?.message||'Erro ao carregar escalas.';}finally{this.loading=false;}}
  clear(){this.filters={ano:null,mes:null,tipo:'',status:''};void this.load();}
  status(s: StatusEscala){return STATUS_LABEL[s];}
  statusClass(s: StatusEscala){return s==='FINALIZADA'?'bg-emerald-50 text-emerald-700':s==='CANCELADA'?'bg-red-50 text-red-700':'bg-amber-50 text-amber-700';}
  async remove(e: Escala){if(!confirm(`Tem certeza que deseja excluir definitivamente a escala "${e.titulo}"? Esta ação não pode ser desfeita.`))return;try{await this.service.deleteCancelled(e.id);await this.load();}catch(err:any){this.error=err?.message||'Não foi possível excluir.';}}
  async exportPdf(e: Escala){try{await this.exporter.exportPdf(await this.service.getById(e.id));}catch(err:any){this.error=err?.message||'Erro ao exportar PDF.';}}
  async exportPng(e: Escala){try{await this.exporter.exportPng(await this.service.getById(e.id));}catch(err:any){this.error=err?.message||'Erro ao exportar PNG.';}}
}
