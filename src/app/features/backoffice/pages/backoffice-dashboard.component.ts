
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { apiMessage, DashboardResponse, Diocese, formatMoney } from '../backoffice.models';
import { BackofficeApiService } from '../backoffice-api.service';

@Component({
    selector: 'app-backoffice-dashboard',
    imports: [FormsModule, RouterLink],
    template: `
    <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <div class="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[#e10600]">Operação</div>
        <h1 class="bo-title">Paróquias na plataforma</h1>
        <p class="mt-1 text-sm text-neutral-400">Situação das paróquias na plataforma.</p>
      </div>
      <a routerLink="/admin/paroquias/nova" class="bo-btn">Nova paróquia</a>
    </div>
    
    @if (error) {
      <div class="mb-4 rounded-lg border border-[#e10600]/40 bg-[#e10600]/10 px-4 py-3 text-sm text-[#ffb4b0]">{{ error }}</div>
    }
    @if (loading) {
      <div class="text-sm text-neutral-400">Carregando...</div>
    }
    
    @if (!loading && data) {
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        @for (card of cards; track card) {
          <a [routerLink]="card.url" class="bo-card block p-5 transition hover:border-[#e10600]/60">
            <div class="text-xs font-bold uppercase tracking-wider text-neutral-500">{{ card.label }}</div>
            <div class="mt-3 text-3xl font-black tabular-nums" [class.text-[#ff5a54]]="card.warn">{{ card.value }}</div>
            @if (card.hint) {
              <div class="mt-2 text-xs text-neutral-500">{{ card.hint }}</div>
            }
          </a>
        }
      </div>
    }
    
    @if (!loading) {
      <section class="bo-card mt-6 p-6">
        <h2 class="text-lg font-bold">Cota por diocese</h2>
        <p class="mt-1 max-w-2xl text-sm text-neutral-400">Teto de servidores ativos somados nas paróquias da diocese. Em branco, a diocese não tem teto. Quem já está ativo permanece; o limite vale na próxima ativação.</p>
        @if (!dioceses.length) {
          <p class="mt-4 text-sm text-neutral-500">Nenhuma diocese cadastrada.</p>
        }
        <div class="mt-4 space-y-3">
          @for (d of dioceses; track d.id) {
            <div class="grid items-end gap-3 border-b border-white/10 pb-3 md:grid-cols-[1fr_80px_140px_auto]">
              <div>
                <div class="font-bold">{{ d.nome }}{{ d.uf ? ' · ' + d.uf : '' }}</div>
                <div class="text-xs text-neutral-500">{{ d.voluntariosAtivos }} ativos{{ d.cotaVoluntarios ? ' de ' + d.cotaVoluntarios : ' · sem teto' }}</div>
              </div>
              <div>
                <label class="bo-label">UF</label>
                <input class="bo-field" maxlength="2" [(ngModel)]="d.uf" [name]="'uf-' + d.id">
              </div>
              <div>
                <label class="bo-label">Cota</label>
                <input class="bo-field" type="number" min="1" [(ngModel)]="d.cotaVoluntarios" [name]="'cota-' + d.id" placeholder="Sem teto">
              </div>
              <button type="button" class="bo-btn-ghost" (click)="salvarDiocese(d)">Salvar</button>
            </div>
          }
        </div>
        <form class="mt-5 grid items-end gap-3 md:grid-cols-[1fr_80px_140px_auto]" (ngSubmit)="criarDiocese()">
          <div>
            <label class="bo-label">Nova diocese</label>
            <input class="bo-field" [(ngModel)]="nova.nome" name="novaNome" required placeholder="Diocese de Cascavel">
          </div>
          <div>
            <label class="bo-label">UF</label>
            <input class="bo-field" maxlength="2" [(ngModel)]="nova.uf" name="novaUf" placeholder="PR">
          </div>
          <div>
            <label class="bo-label">Cota</label>
            <input class="bo-field" type="number" min="1" [(ngModel)]="nova.cota" name="novaCota" placeholder="Sem teto">
          </div>
          <button class="bo-btn" type="submit">Adicionar</button>
        </form>
      </section>
    }

    <section class="bo-card mt-6 p-6">
      <h2 class="text-lg font-bold">Ações do operador</h2>
      <div class="mt-4 flex flex-wrap gap-3">
        <a routerLink="/admin/paroquias" class="bo-btn">Paróquias</a>
        <a routerLink="/admin/planos" class="bo-btn-ghost">Planos e preços</a>
        <a routerLink="/admin/usuarios/novo" class="bo-btn-ghost">Novo usuário</a>
        <a routerLink="/admin/logs" class="bo-btn-line">Ver logs</a>
      </div>
      <p class="mt-5 max-w-2xl text-sm leading-6 text-neutral-400">Assinatura, mensalidades e registro de pagamento (PIX, cartão, dinheiro...) ficam no Financeiro de cada paróquia. O pagamento é registrado à mão até existir um gateway. Atraso só é sinalizado: bloquear continua manual.</p>
    </section>
    `
})
export class BackofficeDashboardComponent implements OnInit {
  loading = true;
  error = '';
  data: DashboardResponse | null = null;
  dioceses: Diocese[] = [];
  nova = { nome: '', uf: '', cota: null as number | null };

  constructor(private api: BackofficeApiService) {}

  ngOnInit() {
    this.api.dashboard().subscribe({
      next: data => { this.data = data; this.loading = false; },
      error: err => { this.error = apiMessage(err); this.loading = false; }
    });
    this.carregarDioceses();
  }

  criarDiocese() {
    const nome = this.nova.nome.trim();
    if (!nome) return;
    this.api.criarDiocese({
      nome,
      uf: this.nova.uf.trim() || null,
      cotaVoluntarios: this.nova.cota || null
    }).subscribe({
      next: () => {
        this.nova = { nome: '', uf: '', cota: null };
        this.carregarDioceses();
      },
      error: err => this.error = apiMessage(err)
    });
  }

  salvarDiocese(diocese: Diocese) {
    this.api.atualizarDiocese(diocese.id, {
      nome: diocese.nome,
      uf: diocese.uf?.trim() || null,
      cotaVoluntarios: diocese.cotaVoluntarios || null
    }).subscribe({
      next: () => this.carregarDioceses(),
      error: err => this.error = apiMessage(err)
    });
  }

  private carregarDioceses() {
    this.api.listarDioceses().subscribe({
      next: rows => this.dioceses = rows,
      error: err => this.error = apiMessage(err)
    });
  }

  get cards() {
    const data = this.data;
    if (!data) return [];
    return [
      { label: 'Total', value: data.total, hint: 'Paróquias cadastradas', url: '/admin/paroquias', warn: false },
      { label: 'Ativas', value: data.ativas, hint: 'Em uso', url: '/admin/paroquias', warn: false },
      { label: 'Trial', value: data.trial, hint: 'Ainda em experiência', url: '/admin/paroquias', warn: false },
      { label: 'Inadimplentes', value: data.bloqueadas, hint: 'Bloqueio manual', url: '/admin/paroquias', warn: true },
      { label: 'Inativas', value: data.canceladas, hint: 'Contrato encerrado', url: '/admin/paroquias', warn: false },
      { label: 'Em atraso', value: data.emAtraso, hint: 'Cobrança vencida', url: '/admin/paroquias', warn: data.emAtraso > 0 },
      { label: 'Recebido no mês', value: formatMoney(data.recebidoNoMes), hint: 'Pagamentos lançados', url: '/admin/paroquias', warn: false }
    ];
  }
}
