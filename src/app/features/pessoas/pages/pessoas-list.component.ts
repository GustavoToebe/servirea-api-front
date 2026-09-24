import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { Inscricao, StatusInscricao } from '../models/inscricao.model';
import { Pessoa, TIPO_LABEL, VoluntarioLista, ageFromDate, initials } from '../models/pessoa.model';
import { InscricoesApiService } from '../services/inscricoes-api.service';
import { PessoasService } from '../services/pessoas.service';
import { VoluntariosApiService } from '../services/voluntarios-api.service';

type Aba = 'todas' | 'ativos' | 'inativos' | 'aguardando' | 'historico';

@Component({
  selector: 'app-pessoas-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ConfirmDialogComponent],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-black text-slate-900">Pessoas</h1>
          <p class="text-sm text-slate-500">Cadastro pessoa-primeiro. Voluntário e responsável podem ser a mesma pessoa.</p>
        </div>
        <a routerLink="/pessoas/nova" class="btn-primary">＋ Novo cadastro</a>
      </div>

      <div class="flex flex-wrap gap-2">
        <button type="button" class="rounded-2xl px-4 py-2.5 text-sm font-bold" [class.bg-brand-blue]="aba==='todas'" [class.text-white]="aba==='todas'" [class.bg-white]="aba!=='todas'" [class.border]="aba!=='todas'" (click)="setAba('todas')">Todas {{ counts.pessoas }}</button>
        <button type="button" class="rounded-2xl px-4 py-2.5 text-sm font-bold" [class.bg-brand-blue]="aba==='ativos'" [class.text-white]="aba==='ativos'" [class.bg-white]="aba!=='ativos'" [class.border]="aba!=='ativos'" (click)="setAba('ativos')">Ativos {{ counts.ativos }}</button>
        <button type="button" class="rounded-2xl px-4 py-2.5 text-sm font-bold" [class.bg-brand-blue]="aba==='inativos'" [class.text-white]="aba==='inativos'" [class.bg-white]="aba!=='inativos'" [class.border]="aba!=='inativos'" (click)="setAba('inativos')">Inativos {{ counts.inativos }}</button>
        <button type="button" class="rounded-2xl px-4 py-2.5 text-sm font-bold" [class.bg-brand-blue]="aba==='aguardando'" [class.text-white]="aba==='aguardando'" [class.bg-white]="aba!=='aguardando'" [class.border]="aba!=='aguardando'" (click)="setAba('aguardando')">Aguardando {{ counts.pendentes }}</button>
        <button type="button" class="rounded-2xl px-4 py-2.5 text-sm font-bold" [class.bg-brand-blue]="aba==='historico'" [class.text-white]="aba==='historico'" [class.bg-white]="aba!=='historico'" [class.border]="aba!=='historico'" (click)="setAba('historico')">Histórico</button>
      </div>

      <div *ngIf="message" class="rounded-xl bg-emerald-50 p-4 text-emerald-800">{{ message }}</div>
      <div *ngIf="error" class="rounded-xl bg-red-50 p-4 text-red-700">{{ error }}</div>

      <div *ngIf="aba==='todas' || aba==='ativos' || aba==='inativos'" class="card p-5">
        <div class="grid gap-4 md:grid-cols-3">
          <div class="md:col-span-2"><label class="label">Nome</label><input class="field" [(ngModel)]="nome" (keyup.enter)="load()" placeholder="Buscar por nome"></div>
          <div class="flex items-end gap-2"><button class="btn-primary" (click)="load()">Filtrar</button></div>
        </div>
      </div>

      <div *ngIf="aba==='historico'" class="flex gap-2">
        <button type="button" class="rounded-full px-3 py-1.5 text-sm font-bold" [class.bg-slate-900]="historico==='APROVADA'" [class.text-white]="historico==='APROVADA'" [class.bg-slate-100]="historico!=='APROVADA'" (click)="setHistorico('APROVADA')">Aprovadas</button>
        <button type="button" class="rounded-full px-3 py-1.5 text-sm font-bold" [class.bg-slate-900]="historico==='REJEITADA'" [class.text-white]="historico==='REJEITADA'" [class.bg-slate-100]="historico!=='REJEITADA'" (click)="setHistorico('REJEITADA')">Rejeitadas</button>
      </div>

      <div *ngIf="aba==='todas'" class="card overflow-hidden">
        <div *ngIf="loading" class="p-10 text-center text-slate-500">Carregando...</div>
        <div *ngIf="!loading && !pessoas.length" class="p-10 text-center text-slate-500">Nenhum cadastro.</div>
        <table *ngIf="!loading && pessoas.length" class="w-full min-w-[700px] text-left text-sm">
          <thead class="bg-slate-100 text-xs uppercase text-slate-500"><tr><th class="px-5 py-4">Pessoa</th><th class="px-5 py-4">Papéis</th><th class="px-5 py-4 text-right">Ações</th></tr></thead>
          <tbody class="divide-y divide-slate-100">
            <tr *ngFor="let p of pessoas" class="hover:bg-slate-50">
              <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                  <div class="flex h-11 w-11 items-center justify-center rounded-full bg-violet-100 font-bold text-brand-blue">{{ initials(p.nomeCompleto) }}</div>
                  <div class="font-bold">{{ p.nomeCompleto }}</div>
                </div>
              </td>
              <td class="px-5 py-4">
                <span *ngFor="let papel of p.papeis" class="badge mr-1 bg-violet-50 text-brand-blue">{{ papel === 'VOLUNTARIO' ? 'Voluntário' : 'Responsável' }}</span>
              </td>
              <td class="px-5 py-4 text-right">
                <a [routerLink]="['/pessoas', p.id]" class="btn-secondary !px-3 !py-2">Ver</a>
                <a [routerLink]="['/pessoas', p.id, 'editar']" class="btn-secondary ml-2 !px-3 !py-2">Editar</a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="aba==='ativos' || aba==='inativos'" class="card overflow-hidden">
        <div *ngIf="loading" class="p-10 text-center text-slate-500">Carregando...</div>
        <div *ngIf="!loading && !rows.length" class="p-10 text-center text-slate-500">Nenhum cadastro.</div>
        <table *ngIf="!loading && rows.length" class="w-full min-w-[700px] text-left text-sm">
          <thead class="bg-slate-100 text-xs uppercase text-slate-500"><tr><th class="px-5 py-4">Pessoa</th><th class="px-5 py-4">Tipo</th><th class="px-5 py-4">Status</th><th class="px-5 py-4 text-right">Ações</th></tr></thead>
          <tbody class="divide-y divide-slate-100">
            <tr *ngFor="let v of rows" class="hover:bg-slate-50">
              <td class="px-5 py-4">
                <div class="flex items-center gap-3">
                  <div class="flex h-11 w-11 items-center justify-center rounded-full bg-violet-100 font-bold text-brand-blue">{{ initials(v.nomeCompleto) }}</div>
                  <div class="font-bold">{{ v.nomeCompleto }}</div>
                </div>
              </td>
              <td class="px-5 py-4"><span class="badge bg-violet-50 text-brand-blue">{{ tipoLabel[v.tipo] }}</span></td>
              <td class="px-5 py-4"><span class="badge" [ngClass]="v.ativo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'">{{ v.ativo ? 'Ativo' : 'Inativo' }}</span></td>
              <td class="px-5 py-4 text-right">
                <a [routerLink]="['/pessoas', v.id]" class="btn-secondary !px-3 !py-2">Ver</a>
                <a [routerLink]="['/pessoas', v.id, 'editar']" class="btn-secondary ml-2 !px-3 !py-2">Editar</a>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="aba==='aguardando' || aba==='historico'" class="grid gap-4">
        <div *ngIf="loading" class="card p-10 text-center text-slate-500">Carregando inscrições...</div>
        <div *ngIf="!loading && !inscricoes.length" class="card p-10 text-center text-slate-500">Nenhuma inscrição.</div>
        <article *ngFor="let i of inscricoes" class="card p-5">
          <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 class="text-lg font-black">{{ i.nomeCompleto }}</h2>
              <p class="text-sm text-slate-500">{{ tipoLabel[i.tipo] }} · {{ ageFromDate(i.dataNascimento) ?? 'idade não informada' }} anos</p>
              <p class="text-sm text-slate-600">Responsável: {{ principalNome(i) }}</p>
            </div>
            <div class="flex flex-wrap gap-2">
              <a [routerLink]="['/pessoas/inscricoes', i.id]" class="btn-secondary !py-2">Ver</a>
              <button *ngIf="i.status==='PENDENTE'" type="button" class="btn-primary !py-2" (click)="approveTarget=i">Aprovar</button>
              <button *ngIf="i.status==='PENDENTE'" type="button" class="btn-danger !py-2" (click)="openReject(i)">Rejeitar</button>
              <a *ngIf="i.voluntarioId" [routerLink]="['/pessoas', i.voluntarioId]" class="btn-secondary !py-2">Abrir cadastro</a>
            </div>
          </div>
        </article>
      </div>
    </div>

    <app-confirm-dialog [open]="!!approveTarget" title="Aprovar inscrição"
      [message]="'Aprovar ' + (approveTarget?.nomeCompleto || '') + '? O cadastro será criado em /pessoas.'"
      confirmLabel="Aprovar" (cancel)="approveTarget=null" (confirm)="confirmApprove()">
    </app-confirm-dialog>
    <app-confirm-dialog #rejectDialog [open]="!!rejectTarget" title="Rejeitar" [danger]="true"
      [message]="'Motivo da rejeição de ' + (rejectTarget?.nomeCompleto || '') + '.'"
      confirmLabel="Rejeitar" reasonLabel="Motivo" [requireReason]="true"
      (cancel)="rejectTarget=null" (confirm)="confirmReject($event)">
    </app-confirm-dialog>
  `
})
export class PessoasListComponent implements OnInit {
  @ViewChild('rejectDialog') rejectDialog?: ConfirmDialogComponent;
  aba: Aba = 'todas';
  historico: Extract<StatusInscricao, 'APROVADA' | 'REJEITADA'> = 'APROVADA';
  nome = '';
  pessoas: Pessoa[] = [];
  rows: VoluntarioLista[] = [];
  inscricoes: Inscricao[] = [];
  loading = true;
  error = '';
  message = '';
  counts = { pessoas: 0, ativos: 0, inativos: 0, pendentes: 0 };
  approveTarget: Inscricao | null = null;
  rejectTarget: Inscricao | null = null;
  tipoLabel = TIPO_LABEL;
  initials = initials;
  ageFromDate = ageFromDate;

  constructor(
    private pessoasApi: PessoasService,
    private voluntarios: VoluntariosApiService,
    private inscricoesApi: InscricoesApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const aba = this.route.snapshot.queryParamMap.get('aba') as Aba | null;
    if (aba === 'todas' || aba === 'ativos' || aba === 'inativos' || aba === 'aguardando' || aba === 'historico') this.aba = aba;
    void this.load();
  }

  async setAba(aba: Aba) {
    this.aba = aba;
    await this.router.navigate([], { queryParams: { aba }, queryParamsHandling: 'merge' });
    await this.load();
  }

  async setHistorico(status: 'APROVADA' | 'REJEITADA') {
    this.historico = status;
    await this.load();
  }

  async load() {
    this.loading = true;
    this.error = '';
    try {
      const [todas, ativos, inativos, pendentes] = await Promise.all([
        this.pessoasApi.listar(undefined, this.aba === 'todas' ? this.nome : undefined),
        this.voluntarios.contar(true),
        this.voluntarios.contar(false),
        this.inscricoesApi.listar('PENDENTE')
      ]);
      this.counts = { pessoas: todas.length, ativos, inativos, pendentes: pendentes.length };
      this.pessoas = [];
      this.rows = [];
      this.inscricoes = [];
      if (this.aba === 'todas') {
        this.pessoas = todas;
      } else if (this.aba === 'ativos' || this.aba === 'inativos') {
        this.rows = await this.voluntarios.listar({ ativo: this.aba === 'ativos', nome: this.nome });
      } else {
        this.inscricoes = await this.inscricoesApi.listar(this.aba === 'aguardando' ? 'PENDENTE' : this.historico);
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Erro ao carregar.';
    } finally {
      this.loading = false;
    }
  }

  principalNome(i: Inscricao): string {
    const p = i.responsaveis.find(r => r.principal) || i.responsaveis[0];
    return p?.nome || '—';
  }

  openReject(i: Inscricao) {
    this.rejectDialog?.resetReason();
    this.rejectTarget = i;
  }

  async confirmApprove() {
    if (!this.approveTarget) return;
    const id = this.approveTarget.id;
    this.approveTarget = null;
    try {
      await this.inscricoesApi.aprovar(id);
      this.message = 'Inscrição aprovada.';
      await this.load();
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Falha ao aprovar.';
    }
  }

  async confirmReject(motivo: string) {
    if (!this.rejectTarget) return;
    const id = this.rejectTarget.id;
    this.rejectTarget = null;
    try {
      await this.inscricoesApi.rejeitar(id, motivo);
      this.message = 'Inscrição rejeitada.';
      await this.load();
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Falha ao rejeitar.';
    }
  }
}
