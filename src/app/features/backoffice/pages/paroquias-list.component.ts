
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BackofficeApiService } from '../backoffice-api.service';
import {
  FiltroParoquia,
  PERIODICIDADE,
  ParoquiaAdmin,
  Periodicidade,
  STATUS_PAROQUIA,
  apiMessage,
  formatWhen,
  initials,
  statusClass
} from '../backoffice.models';

@Component({
    selector: 'app-paroquias-list',
    imports: [FormsModule, RouterLink],
    template: `
    <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h1 class="bo-title flex items-center gap-3">
        <svg class="h-7 w-7 text-[#e10600]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 20V10l8-6 8 6v10"/><path d="M9 20v-6h6v6"/></svg>
        Paróquias
      </h1>
      <a routerLink="/admin/paroquias/nova" class="bo-btn">Nova paróquia</a>
    </div>
    
    <div class="mb-3 flex flex-col gap-3 lg:flex-row">
      <input class="bo-field lg:flex-1" [(ngModel)]="filtro.nome" placeholder="Pesquisar paróquia" (keyup.enter)="load()">
      <select class="bo-field lg:w-56" [(ngModel)]="filtro.situacao">
        <option value="">Todas as situações</option>
        <option value="ATIVOS">Ativos</option>
        <option value="INADIMPLENTES">Inadimplentes</option>
        <option value="INATIVOS">Inativos</option>
      </select>
      <button class="bo-btn" type="button" (click)="load()">Buscar</button>
    </div>
    
    <div class="bo-card mb-4 grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-4">
      <div><label class="bo-label">CNPJ</label><input class="bo-field" [(ngModel)]="filtro.cnpj" placeholder="00.000.000/0000-00"></div>
      <div><label class="bo-label">E-mail</label><input class="bo-field" [(ngModel)]="filtro.email" placeholder="contato@paroquia.org"></div>
      <div>
        <label class="bo-label">Tipo de e-mail</label>
        <select class="bo-field" [(ngModel)]="filtro.tipoEmail">
          <option value="">Todos</option>
          <option value="CONTATO">Contato</option>
          <option value="FINANCEIRO">Financeiro</option>
          <option value="ADMINISTRATIVO">Administrativo</option>
        </select>
      </div>
      <div class="flex items-end justify-between gap-3">
        <label class="flex cursor-pointer items-center gap-2 pb-2 text-sm font-semibold text-neutral-300">
          <input type="checkbox" class="h-4 w-4 accent-[#e10600]" [(ngModel)]="filtro.emAtraso" (ngModelChange)="load()">
          Só em atraso
        </label>
        <button class="bo-link pb-2" type="button" (click)="clear()">Remover filtros</button>
      </div>
      <div><label class="bo-label">Contratou de</label><input class="bo-field" type="date" [(ngModel)]="filtro.contratadoDe"></div>
      <div><label class="bo-label">Contratou até</label><input class="bo-field" type="date" [(ngModel)]="filtro.contratadoAte"></div>
      <div><label class="bo-label">Vigência de</label><input class="bo-field" type="date" [(ngModel)]="filtro.vigenciaDe"></div>
      <div><label class="bo-label">Vigência até</label><input class="bo-field" type="date" [(ngModel)]="filtro.vigenciaAte"></div>
    </div>
    
    @if (error) {
      <div class="mb-4 rounded-lg border border-[#e10600]/40 bg-[#e10600]/10 px-4 py-3 text-sm text-[#ffb4b0]">{{ error }}</div>
    }
    
    <div class="overflow-hidden rounded-lg border border-[#2a2a2a]">
      <table class="bo-table">
        <thead>
          <tr>
            <th>Paróquia</th>
            <th>CNPJ</th>
            <th>E-mail</th>
            <th>Plano</th>
            <th>Vigência</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          @for (row of rows; track row) {
            <tr class="cursor-pointer" [routerLink]="['/admin/paroquias', row.id]">
              <td>
                <div class="flex items-center gap-3">
                  <span class="bo-avatar h-9 w-9 text-xs">{{ initials(row.nome) }}</span>
                  <div>
                    <div class="font-semibold">{{ row.nome }}</div>
                    <div class="text-xs text-neutral-500">{{ row.slug }}</div>
                  </div>
                </div>
              </td>
              <td>{{ row.cnpj || '—' }}</td>
              <td>{{ row.email || '—' }}</td>
              <td>
                @if (row.planoNome) {
                  <span>{{ row.planoNome }} · {{ periodicidade(row.periodicidade) }}</span>
                } @else {
                  <span class="text-neutral-500">—</span>
                }
              </td>
              <td>{{ when(row.vigenciaAte) }}</td>
              <td>
                <div [class]="statusClass(row.status)">{{ statusLabel(row.status) }}</div>
                @if (row.cobrancasVencidas) {
                  <div class="bo-bad text-xs">Em atraso {{ row.diasAtraso }}d · {{ row.cobrancasVencidas }} venc.</div>
                }
              </td>
            </tr>
          }
        </tbody>
      </table>
      @if (loading) {
        <div class="bg-[#141414] px-4 py-10 text-center text-sm text-neutral-400">Carregando paróquias...</div>
      }
      @if (!loading && !rows.length) {
        <div class="bg-[#141414] px-4 py-16 text-center text-sm text-neutral-400">Não há paróquia(s)</div>
      }
    </div>
    `
})
export class ParoquiasListComponent implements OnInit {
  rows: ParoquiaAdmin[] = [];
  loading = true;
  error = '';
  filtro: FiltroParoquia = this.emptyFilter();
  initials = initials;
  statusClass = statusClass;
  when = formatWhen;
  statusLabel = (status: ParoquiaAdmin['status']) => STATUS_PAROQUIA[status];
  periodicidade = (p: Periodicidade | null) => (p ? PERIODICIDADE[p] : '');

  constructor(private api: BackofficeApiService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.error = '';
    this.api.listarParoquias(this.filtro).subscribe({
      next: rows => { this.rows = rows; this.loading = false; },
      error: err => { this.error = apiMessage(err); this.loading = false; }
    });
  }

  clear() {
    this.filtro = this.emptyFilter();
    this.load();
  }

  private emptyFilter(): FiltroParoquia {
    return {
      situacao: '',
      nome: '',
      cnpj: '',
      email: '',
      tipoEmail: '',
      contratadoDe: '',
      contratadoAte: '',
      vigenciaDe: '',
      vigenciaAte: '',
      emAtraso: false
    };
  }
}
