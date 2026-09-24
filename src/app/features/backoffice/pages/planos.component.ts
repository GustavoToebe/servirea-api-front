import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BackofficeApiService } from '../backoffice-api.service';
import {
  PERIODICIDADE,
  Periodicidade,
  Plano,
  apiMessage,
  formatMoney,
  formatWhen,
  todayIso
} from '../backoffice.models';

/**
 * Catálogo de planos (V029 da API, seção 63 do plano mestre). Preço nunca é
 * editado: reajuste é um preço novo com data de início — quem já assinou
 * mantém o valor copiado na assinatura.
 */
@Component({
  selector: 'app-planos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 class="bo-title">Planos e preços</h1>
        <p class="mt-1 text-sm text-neutral-400">Reajuste é um preço novo com data de início. Quem já assinou mantém o valor contratado.</p>
      </div>
      <button type="button" class="bo-btn" (click)="abrirPlano(null)">Novo plano</button>
    </div>

    <div *ngIf="error && !modal" class="mb-4 rounded-lg border border-[#e10600]/40 bg-[#e10600]/10 px-4 py-3 text-sm text-[#ffb4b0]">{{ error }}</div>
    <div *ngIf="notice" class="mb-4 rounded-lg border border-emerald-800/50 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">{{ notice }}</div>
    <div *ngIf="loading" class="text-sm text-neutral-400">Carregando...</div>

    <div class="grid gap-4 lg:grid-cols-2">
      <section *ngFor="let p of planos" class="bo-card p-5" [class.opacity-60]="!p.ativo">
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 class="text-lg font-bold">{{ p.nome }} <span *ngIf="!p.ativo" class="bo-mute text-xs">(inativo)</span></h2>
            <div class="text-xs text-neutral-500">{{ p.codigo }} · {{ p.limiteVoluntarios ? 'até ' + p.limiteVoluntarios + ' voluntários' : 'sem limite de voluntários' }}</div>
          </div>
          <button type="button" class="bo-link" (click)="abrirPlano(p)">Editar</button>
        </div>
        <div class="mt-4 grid grid-cols-2 gap-3">
          <div class="rounded-lg border border-[#262626] p-3">
            <div class="text-xs font-bold uppercase tracking-wider text-neutral-500">Mensal</div>
            <div class="mt-1 text-xl font-bold">{{ p.precoMensal !== null ? money(p.precoMensal) : 'Sem preço' }}</div>
          </div>
          <div class="rounded-lg border border-[#262626] p-3">
            <div class="text-xs font-bold uppercase tracking-wider text-neutral-500">Anual</div>
            <div class="mt-1 text-xl font-bold">{{ p.precoAnual !== null ? money(p.precoAnual) : 'Sem preço' }}</div>
          </div>
        </div>
        <div *ngIf="p.precos.length" class="mt-4">
          <div class="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-500">Histórico</div>
          <div *ngFor="let preco of p.precos" class="flex justify-between border-b border-[#1f1f1f] py-1 text-sm">
            <span>{{ periodicidade(preco.periodicidade) }} · desde {{ when(preco.vigenteDesde) }}</span>
            <span class="font-semibold">{{ money(preco.valor) }}</span>
          </div>
        </div>
        <button type="button" class="bo-btn-line mt-4" (click)="abrirPreco(p)">Novo preço</button>
      </section>
    </div>

    <div *ngIf="modal === 'plano'" class="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <form class="bo-card w-full max-w-md p-6" (ngSubmit)="salvarPlano()">
        <h3 class="text-lg font-bold">{{ editando ? 'Editar plano' : 'Novo plano' }}</h3>
        <div class="mt-4 grid gap-4">
          <div *ngIf="!editando">
            <label class="bo-label">Código *</label>
            <input class="bo-field" [(ngModel)]="plano.codigo" name="codigo" required placeholder="EX.: PREMIUM">
          </div>
          <div>
            <label class="bo-label">Nome *</label>
            <input class="bo-field" [(ngModel)]="plano.nome" name="nome" required>
          </div>
          <div>
            <label class="bo-label">Limite de voluntários</label>
            <input class="bo-field" type="number" min="1" [(ngModel)]="plano.limiteVoluntarios" name="limite" placeholder="Vazio = sem limite">
          </div>
          <label class="flex items-center gap-2 text-sm font-semibold text-neutral-300">
            <input type="checkbox" class="h-4 w-4 accent-[#e10600]" [(ngModel)]="plano.ativo" name="ativo"> Disponível para novas assinaturas
          </label>
        </div>
        <div *ngIf="error" class="mt-4 rounded-lg border border-[#e10600]/40 bg-[#e10600]/10 px-3 py-2 text-sm text-[#ffb4b0]">{{ error }}</div>
        <div class="mt-6 flex justify-end gap-2">
          <button type="button" class="bo-btn-ghost" (click)="modal = null">Cancelar</button>
          <button type="submit" class="bo-btn" [disabled]="saving">{{ saving ? 'Salvando...' : 'Salvar' }}</button>
        </div>
      </form>
    </div>

    <div *ngIf="modal === 'preco'" class="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <form class="bo-card w-full max-w-md p-6" (ngSubmit)="salvarPreco()">
        <h3 class="text-lg font-bold">Novo preço · {{ editando?.nome }}</h3>
        <div class="mt-4 grid gap-4">
          <div>
            <label class="bo-label">Cobrança *</label>
            <select class="bo-field" [(ngModel)]="preco.periodicidade" name="periodicidade">
              <option value="MENSAL">Mensal</option>
              <option value="ANUAL">Anual</option>
            </select>
          </div>
          <div>
            <label class="bo-label">Valor (R$) *</label>
            <input class="bo-field" type="number" min="0" step="0.01" [(ngModel)]="preco.valor" name="valor" required>
          </div>
          <div>
            <label class="bo-label">Vale a partir de *</label>
            <input class="bo-field" type="date" [(ngModel)]="preco.vigenteDesde" name="vigenteDesde" required>
          </div>
        </div>
        <div *ngIf="error" class="mt-4 rounded-lg border border-[#e10600]/40 bg-[#e10600]/10 px-3 py-2 text-sm text-[#ffb4b0]">{{ error }}</div>
        <div class="mt-6 flex justify-end gap-2">
          <button type="button" class="bo-btn-ghost" (click)="modal = null">Cancelar</button>
          <button type="submit" class="bo-btn" [disabled]="saving || preco.valor === null">{{ saving ? 'Salvando...' : 'Salvar preço' }}</button>
        </div>
      </form>
    </div>
  `
})
export class PlanosComponent implements OnInit {
  planos: Plano[] = [];
  loading = true;
  saving = false;
  error = '';
  notice = '';
  modal: 'plano' | 'preco' | null = null;
  editando: Plano | null = null;
  plano = { codigo: '', nome: '', limiteVoluntarios: null as number | null, ativo: true };
  preco = { periodicidade: 'MENSAL' as Periodicidade, valor: null as number | null, vigenteDesde: todayIso() };

  money = formatMoney;
  when = formatWhen;
  periodicidade = (p: Periodicidade) => PERIODICIDADE[p];

  constructor(private api: BackofficeApiService) {}

  ngOnInit() {
    this.carregar();
  }

  abrirPlano(p: Plano | null) {
    this.error = '';
    this.editando = p;
    this.plano = p
      ? { codigo: p.codigo, nome: p.nome, limiteVoluntarios: p.limiteVoluntarios, ativo: p.ativo }
      : { codigo: '', nome: '', limiteVoluntarios: null, ativo: true };
    this.modal = 'plano';
  }

  abrirPreco(p: Plano) {
    this.error = '';
    this.editando = p;
    this.preco = { periodicidade: 'MENSAL', valor: null, vigenteDesde: todayIso() };
    this.modal = 'preco';
  }

  salvarPlano() {
    const limite = this.plano.limiteVoluntarios;
    const body = {
      codigo: this.plano.codigo.trim() || null,
      nome: this.plano.nome.trim(),
      limiteVoluntarios: limite === null || (limite as unknown) === '' ? null : limite,
      ativo: this.plano.ativo
    };
    const request = this.editando
      ? this.api.atualizarPlano(this.editando.id, body)
      : this.api.criarPlano(body);
    this.executar(request, 'Plano salvo.');
  }

  salvarPreco() {
    if (!this.editando) return;
    this.executar(this.api.adicionarPreco(this.editando.id, this.preco), 'Preço cadastrado.');
  }

  private executar(request: ReturnType<BackofficeApiService['criarPlano']>, mensagem: string) {
    this.saving = true;
    this.error = '';
    this.notice = '';
    request.subscribe({
      next: () => {
        this.saving = false;
        this.modal = null;
        this.notice = mensagem;
        this.carregar();
      },
      error: err => { this.error = apiMessage(err); this.saving = false; }
    });
  }

  private carregar() {
    this.loading = true;
    this.api.listarPlanos().subscribe({
      next: planos => { this.planos = planos; this.loading = false; },
      error: err => { this.error = apiMessage(err); this.loading = false; }
    });
  }
}
