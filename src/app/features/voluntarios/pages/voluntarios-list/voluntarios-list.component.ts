import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { FUNCOES_FORM, FUNCOES_LABEL, FuncaoEscala, Voluntario, VoluntarioFilters } from '../../models/voluntario.model';
import { Inscricao, StatusInscricao } from '../../models/inscricao.model';
import { InscricoesService } from '../../services/inscricoes.service';
import { VoluntariosService } from '../../services/voluntarios.service';
import { principalDe } from '../../forms/voluntario-ficha.factory';
import { ageFromDate, formatDateTimeBr, initials, tipoLabel } from '../../utils/voluntario.utils';

type AbaVoluntarios = 'ativos' | 'aguardando' | 'inativos' | 'historico';

@Component({
  selector: 'app-voluntarios-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ConfirmDialogComponent],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-black text-slate-900">Voluntários</h1>
          <p class="text-sm text-slate-500">Cadastro interno, inscrições públicas e acesso rápido ao histórico de escalas.</p>
        </div>
        <a routerLink="/voluntarios/novo" class="btn-primary">＋ Novo cadastro</a>
      </div>

      <div class="flex flex-wrap gap-2">
        <button type="button" class="rounded-2xl px-4 py-2.5 text-sm font-bold transition" [class.bg-brand-blue]="aba==='ativos'" [class.text-white]="aba==='ativos'" [class.bg-white]="aba!=='ativos'" [class.text-slate-700]="aba!=='ativos'" [class.border]="aba!=='ativos'" [class.border-slate-200]="aba!=='ativos'" (click)="setAba('ativos')">Ativos {{ counts.ativos }}</button>
        <button type="button" class="rounded-2xl px-4 py-2.5 text-sm font-bold transition" [class.bg-brand-blue]="aba==='aguardando'" [class.text-white]="aba==='aguardando'" [class.bg-white]="aba!=='aguardando'" [class.text-slate-700]="aba!=='aguardando'" [class.border]="aba!=='aguardando'" [class.border-slate-200]="aba!=='aguardando'" (click)="setAba('aguardando')">Aguardando aprovação {{ counts.pendentes }}</button>
        <button type="button" class="rounded-2xl px-4 py-2.5 text-sm font-bold transition" [class.bg-brand-blue]="aba==='inativos'" [class.text-white]="aba==='inativos'" [class.bg-white]="aba!=='inativos'" [class.text-slate-700]="aba!=='inativos'" [class.border]="aba!=='inativos'" [class.border-slate-200]="aba!=='inativos'" (click)="setAba('inativos')">Inativos {{ counts.inativos }}</button>
        <button type="button" class="rounded-2xl px-4 py-2.5 text-sm font-bold transition" [class.bg-brand-blue]="aba==='historico'" [class.text-white]="aba==='historico'" [class.bg-white]="aba!=='historico'" [class.text-slate-700]="aba!=='historico'" [class.border]="aba!=='historico'" [class.border-slate-200]="aba!=='historico'" (click)="setAba('historico')">Histórico</button>
      </div>

      <div *ngIf="message" class="rounded-xl bg-emerald-50 p-4 text-emerald-800">{{ message }}</div>
      <div *ngIf="error" class="rounded-xl bg-red-50 p-4 text-red-700">{{ error }}</div>

      <div *ngIf="aba==='ativos' || aba==='inativos'" class="card p-5">
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div class="xl:col-span-2"><label class="label">Nome</label><input class="field" [(ngModel)]="filters.nome" (keyup.enter)="load()" placeholder="Buscar por nome"></div>
          <div><label class="label">Idade</label><input class="field" type="number" min="0" [(ngModel)]="filters.idade" (keyup.enter)="load()" placeholder="Ex.: 12"></div>
          <div><label class="label">Tipo</label><select class="field" [(ngModel)]="filters.tipo"><option value="">Todos</option><option value="COROINHA">Coroinha</option><option value="ACOLITO">Acólito</option><option value="AMBOS">Ambos</option></select></div>
          <div><label class="label">Função</label><select class="field" [(ngModel)]="filters.funcao"><option value="">Todas</option><option *ngFor="let f of funcoes" [value]="f">{{ funcaoLabel(f) }}</option></select></div>
          <div class="flex items-end gap-2 xl:col-span-4"><button class="btn-primary" (click)="load()">Filtrar</button><button class="btn-secondary" (click)="clear()">Limpar</button></div>
        </div>
      </div>

      <div *ngIf="aba==='historico'" class="flex flex-wrap gap-2">
        <button type="button" class="rounded-full px-3 py-1.5 text-sm font-bold" [class.bg-slate-900]="historicoStatus==='APROVADA'" [class.text-white]="historicoStatus==='APROVADA'" [class.bg-slate-100]="historicoStatus!=='APROVADA'" (click)="setHistorico('APROVADA')">Aprovadas</button>
        <button type="button" class="rounded-full px-3 py-1.5 text-sm font-bold" [class.bg-slate-900]="historicoStatus==='REJEITADA'" [class.text-white]="historicoStatus==='REJEITADA'" [class.bg-slate-100]="historicoStatus!=='REJEITADA'" (click)="setHistorico('REJEITADA')">Rejeitadas</button>
      </div>

      <div *ngIf="aba==='ativos' || aba==='inativos'" class="card overflow-hidden">
        <div *ngIf="loading" class="p-10 text-center text-slate-500">Carregando cadastros...</div>
        <div *ngIf="!loading && !rows.length" class="p-10 text-center text-slate-500">Nenhum cadastro encontrado.</div>
        <div *ngIf="!loading && rows.length" class="overflow-x-auto">
          <table class="w-full min-w-[850px] text-left text-sm">
            <thead class="bg-slate-100 text-xs uppercase tracking-wide text-slate-500">
              <tr><th class="px-5 py-4">Pessoa</th><th class="px-5 py-4">Idade</th><th class="px-5 py-4">Tipo</th><th class="px-5 py-4">Funções</th><th class="px-5 py-4">Status</th><th class="px-5 py-4 text-right">Ações</th></tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr *ngFor="let v of rows" class="hover:bg-slate-50">
                <td class="px-5 py-4">
                  <div class="flex items-center gap-3">
                    <img *ngIf="v.foto_url" [src]="v.foto_url" class="h-11 w-11 rounded-full object-cover" alt="Foto">
                    <div *ngIf="!v.foto_url" class="flex h-11 w-11 items-center justify-center rounded-full bg-sky-100 font-bold text-brand-blue">{{ initials(v.nome_completo) }}</div>
                    <div><div class="font-bold text-slate-900">{{ v.nome_completo }}</div><div class="text-xs text-slate-500">{{ v.celular || v.telefone || v.email || 'Sem contato direto' }}</div></div>
                  </div>
                </td>
                <td class="px-5 py-4">{{ ageFromDate(v.data_nascimento) ?? '—' }}</td>
                <td class="px-5 py-4"><span class="badge bg-sky-50 text-brand-blue">{{ tipoLabel(v.tipo) }}</span></td>
                <td class="px-5 py-4"><div class="flex max-w-sm flex-wrap gap-1"><span *ngFor="let f of v.funcoes_habilitadas" class="rounded-md bg-slate-100 px-2 py-1 text-xs">{{ funcaoLabel(f) }}</span><span *ngIf="!v.funcoes_habilitadas?.length" class="text-slate-400">—</span></div></td>
                <td class="px-5 py-4"><span class="badge" [ngClass]="v.ativo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'">{{ v.ativo ? 'Ativo' : 'Inativo' }}</span></td>
                <td class="px-5 py-4"><div class="flex justify-end gap-2"><a [routerLink]="['/voluntarios', v.id]" class="btn-secondary !px-3 !py-2">Ver</a><a [routerLink]="['/voluntarios', v.id, 'editar']" class="btn-secondary !px-3 !py-2">Editar</a></div></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div *ngIf="aba==='aguardando' || aba==='historico'">
        <div *ngIf="loading" class="card p-10 text-center text-slate-500">Carregando inscrições...</div>
        <div *ngIf="!loading && !inscricoes.length" class="card p-10 text-center text-slate-500">Nenhuma inscrição encontrada.</div>
        <div class="grid gap-4">
          <article *ngFor="let inscricao of inscricoes" class="card p-5">
            <div class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div class="flex gap-4">
                <img *ngIf="inscricao.foto_url" [src]="inscricao.foto_url" class="h-16 w-16 rounded-2xl object-cover" alt="Foto">
                <div *ngIf="!inscricao.foto_url" class="flex h-16 w-16 items-center justify-center rounded-2xl bg-sky-100 font-black text-brand-blue">{{ initials(inscricao.nome_completo) }}</div>
                <div>
                  <h2 class="text-lg font-black text-slate-900">{{ inscricao.nome_completo }}</h2>
                  <p class="text-sm text-slate-600">{{ tipoLabel(inscricao.tipo) }}</p>
                  <p class="text-sm text-slate-500">{{ ageLabel(inscricao.data_nascimento) }}</p>
                </div>
              </div>
              <div class="grid gap-4 sm:grid-cols-2 lg:min-w-[420px]">
                <div>
                  <div class="text-xs font-semibold uppercase tracking-wide text-slate-400">Responsável principal</div>
                  <div class="font-bold text-slate-900">{{ principalNome(inscricao) }}</div>
                  <div class="text-sm text-slate-600">{{ principalContato(inscricao) }}</div>
                </div>
                <div>
                  <div class="text-xs font-semibold uppercase tracking-wide text-slate-400">Inscrição realizada em</div>
                  <div class="font-bold text-slate-900">{{ formatDateTimeBr(inscricao.created_at) }}</div>
                </div>
                <div *ngIf="inscricao.status==='APROVADA'">
                  <div class="text-xs font-semibold uppercase tracking-wide text-slate-400">Cadastro gerado</div>
                  <a *ngIf="inscricao.voluntario_id" [routerLink]="['/voluntarios', inscricao.voluntario_id]" class="font-bold text-brand-blue">Abrir voluntário</a>
                  <span *ngIf="!inscricao.voluntario_id" class="text-sm text-slate-500">Sem vínculo exibido</span>
                </div>
                <div *ngIf="inscricao.status==='REJEITADA'">
                  <div class="text-xs font-semibold uppercase tracking-wide text-slate-400">Rejeição</div>
                  <div class="text-sm font-bold text-slate-900">{{ formatDateTimeBr(inscricao.data_rejeicao) }}</div>
                  <div class="text-sm text-slate-600">{{ inscricao.motivo_rejeicao || 'Sem motivo informado' }}</div>
                </div>
              </div>
            </div>
            <div class="mt-5 flex flex-wrap gap-2">
              <a [routerLink]="['/voluntarios/inscricoes', inscricao.id]" class="btn-secondary !py-2">Visualizar</a>
              <button *ngIf="inscricao.status==='PENDENTE'" type="button" class="btn-primary !py-2" (click)="openApprove(inscricao)">Aprovar</button>
              <button *ngIf="inscricao.status==='PENDENTE'" type="button" class="btn-danger !py-2" (click)="openReject(inscricao)">Rejeitar</button>
            </div>
          </article>
        </div>
      </div>
    </div>

    <app-confirm-dialog
      [open]="!!approveTarget"
      title="Aprovar inscrição"
      [message]="'Aprovar a inscrição de ' + (approveTarget?.nome_completo || '') + '? O cadastro de voluntário será criado automaticamente.'"
      confirmLabel="Aprovar inscrição"
      (cancel)="approveTarget = null"
      (confirm)="confirmApprove()">
    </app-confirm-dialog>

    <app-confirm-dialog
      #rejectDialog
      [open]="!!rejectTarget"
      title="Rejeitar inscrição"
      [message]="'Informe o motivo da rejeição de ' + (rejectTarget?.nome_completo || '') + '.'"
      confirmLabel="Rejeitar inscrição"
      reasonLabel="Motivo da rejeição"
      reasonPlaceholder="Descreva o motivo"
      [requireReason]="true"
      [danger]="true"
      (cancel)="rejectTarget = null"
      (confirm)="confirmReject($event)">
    </app-confirm-dialog>
  `
})
export class VoluntariosListComponent implements OnInit {
  @ViewChild('rejectDialog') rejectDialog?: ConfirmDialogComponent;
  aba: AbaVoluntarios = 'ativos';
  historicoStatus: Extract<StatusInscricao, 'APROVADA' | 'REJEITADA'> = 'APROVADA';
  rows: Voluntario[] = [];
  inscricoes: Inscricao[] = [];
  loading = true;
  error = '';
  message = '';
  filters: VoluntarioFilters = { nome: '', idade: null, funcao: '', status: 'ATIVO', tipo: '' };
  funcoes = FUNCOES_FORM;
  counts = { ativos: 0, inativos: 0, pendentes: 0 };
  approveTarget: Inscricao | null = null;
  rejectTarget: Inscricao | null = null;

  constructor(
    private service: VoluntariosService,
    private inscricoesService: InscricoesService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    const aba = this.route.snapshot.queryParamMap.get('aba') as AbaVoluntarios | null;
    const historico = this.route.snapshot.queryParamMap.get('status');
    if (aba === 'ativos' || aba === 'aguardando' || aba === 'inativos' || aba === 'historico') this.aba = aba;
    if (historico === 'APROVADA' || historico === 'REJEITADA') this.historicoStatus = historico;
    if (this.route.snapshot.queryParamMap.get('aprovada') === '1') {
      this.message = 'Inscrição aprovada com sucesso. O cadastro já pode aparecer nas escalas.';
    }
    void this.load();
  }

  async setAba(aba: AbaVoluntarios) {
    this.aba = aba;
    this.message = '';
    await this.router.navigate([], { queryParams: { aba, status: aba === 'historico' ? this.historicoStatus : null }, queryParamsHandling: 'merge' });
    await this.load();
  }

  async setHistorico(status: Extract<StatusInscricao, 'APROVADA' | 'REJEITADA'>) {
    this.historicoStatus = status;
    await this.router.navigate([], { queryParams: { aba: 'historico', status }, queryParamsHandling: 'merge' });
    await this.load();
  }

  async load() {
    this.loading = true;
    this.error = '';
    try {
      await this.refreshCounts();
      if (this.aba === 'ativos' || this.aba === 'inativos') {
        this.filters.status = this.aba === 'ativos' ? 'ATIVO' : 'INATIVO';
        this.rows = await this.service.list(this.filters);
        this.inscricoes = [];
      } else {
        const status: StatusInscricao = this.aba === 'aguardando' ? 'PENDENTE' : this.historicoStatus;
        this.inscricoes = await this.inscricoesService.listByStatus(status);
        this.rows = [];
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Erro ao carregar os cadastros.';
    } finally {
      this.loading = false;
    }
  }

  async refreshCounts() {
    const [ativos, inativos, pendentes] = await Promise.all([
      this.service.countByActive(true),
      this.service.countByActive(false),
      this.inscricoesService.countByStatus('PENDENTE')
    ]);
    this.counts = { ativos, inativos, pendentes };
  }

  clear() {
    this.filters = { nome: '', idade: null, funcao: '', status: this.aba === 'inativos' ? 'INATIVO' : 'ATIVO', tipo: '' };
    void this.load();
  }

  funcaoLabel(funcao: FuncaoEscala) { return FUNCOES_LABEL[funcao]; }
  tipoLabel = tipoLabel;
  initials = initials;
  ageFromDate = ageFromDate;
  formatDateTimeBr = formatDateTimeBr;

  ageLabel(date: string | null) {
    const age = ageFromDate(date);
    return age == null ? 'idade não informada' : `${age} anos`;
  }

  principalNome(inscricao: Inscricao) {
    return principalDe(inscricao.responsaveis)?.nome || 'Não informado';
  }

  principalContato(inscricao: Inscricao) {
    const principal = principalDe(inscricao.responsaveis);
    return principal?.celular || principal?.telefone || 'Sem telefone';
  }

  openApprove(inscricao: Inscricao) { this.approveTarget = inscricao; }
  openReject(inscricao: Inscricao) {
    this.rejectDialog?.resetReason();
    this.rejectTarget = inscricao;
  }

  async confirmApprove() {
    if (!this.approveTarget) return;
    const id = this.approveTarget.id;
    this.approveTarget = null;
    try {
      await this.inscricoesService.aprovar(id);
      this.message = 'Inscrição aprovada com sucesso.';
      await this.load();
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Não foi possível aprovar a inscrição.';
    }
  }

  async confirmReject(motivo: string) {
    if (!this.rejectTarget) return;
    const id = this.rejectTarget.id;
    this.rejectTarget = null;
    try {
      await this.inscricoesService.rejeitar(id, motivo);
      this.message = 'Inscrição rejeitada.';
      await this.load();
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Não foi possível rejeitar a inscrição.';
    }
  }
}
