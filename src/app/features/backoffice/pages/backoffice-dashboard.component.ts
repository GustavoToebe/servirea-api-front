import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { apiMessage, DashboardResponse } from '../backoffice.models';
import { BackofficeApiService } from '../backoffice-api.service';

@Component({
  selector: 'app-backoffice-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="bo-title">Início</h1>
        <p class="mt-1 text-sm text-neutral-400">Situação das paróquias na plataforma.</p>
      </div>
      <a routerLink="/admin/paroquias/nova" class="bo-btn">Nova paróquia</a>
    </div>

    <div *ngIf="error" class="mb-4 rounded-lg border border-[#e10600]/40 bg-[#e10600]/10 px-4 py-3 text-sm text-[#ffb4b0]">{{ error }}</div>
    <div *ngIf="loading" class="text-sm text-neutral-400">Carregando...</div>

    <div *ngIf="!loading && data" class="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <a *ngFor="let card of cards" [routerLink]="card.url" class="bo-card block p-5 transition hover:border-[#e10600]/60">
        <div class="text-xs font-bold uppercase tracking-wider text-neutral-500">{{ card.label }}</div>
        <div class="mt-3 text-3xl font-black" [class.text-[#ff5a54]]="card.warn">{{ card.value }}</div>
      </a>
    </div>

    <section class="bo-card mt-6 p-6">
      <h2 class="text-lg font-bold">Ações do operador</h2>
      <div class="mt-4 flex flex-wrap gap-3">
        <a routerLink="/admin/paroquias" class="bo-btn">Paróquias</a>
        <a routerLink="/admin/usuarios/novo" class="bo-btn-ghost">Novo usuário</a>
        <a routerLink="/admin/logs" class="bo-btn-line">Ver logs</a>
      </div>
      <p class="mt-5 max-w-2xl text-sm leading-6 text-neutral-400">Bloqueio, liberação e “marcar como pago” ficam na ficha de cada paróquia. O pagamento é manual, via PIX, até existir um gateway.</p>
    </section>
  `
})
export class BackofficeDashboardComponent implements OnInit {
  loading = true;
  error = '';
  data: DashboardResponse | null = null;

  constructor(private api: BackofficeApiService) {}

  ngOnInit() {
    this.api.dashboard().subscribe({
      next: data => { this.data = data; this.loading = false; },
      error: err => { this.error = apiMessage(err); this.loading = false; }
    });
  }

  get cards() {
    const data = this.data;
    if (!data) return [];
    return [
      { label: 'Total', value: data.total, url: '/admin/paroquias', warn: false },
      { label: 'Ativas', value: data.ativas, url: '/admin/paroquias', warn: false },
      { label: 'Trial', value: data.trial, url: '/admin/paroquias', warn: false },
      { label: 'Inadimplentes', value: data.bloqueadas, url: '/admin/paroquias', warn: true },
      { label: 'Inativas', value: data.canceladas, url: '/admin/paroquias', warn: false }
    ];
  }
}
