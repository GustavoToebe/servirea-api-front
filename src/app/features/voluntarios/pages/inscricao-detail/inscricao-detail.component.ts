import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ConfirmDialogComponent } from '../../../../shared/components/confirm-dialog/confirm-dialog.component';
import { FUNCOES_LABEL, FuncaoEscala } from '../../models/voluntario.model';
import { Inscricao, STATUS_INSCRICAO_LABEL } from '../../models/inscricao.model';
import { InscricoesService } from '../../services/inscricoes.service';
import { ageFromDate, formatDateBr, formatDateTimeBr, initials, studyLabel, tipoLabel } from '../../utils/voluntario.utils';

@Component({
  selector: 'app-inscricao-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, ConfirmDialogComponent],
  template: `
    <div class="mx-auto max-w-6xl space-y-6">
      <div *ngIf="loading" class="card p-10 text-center text-slate-500">Carregando inscrição...</div>
      <div *ngIf="!loading && error && !inscricao" class="card p-6 text-red-600">{{ error }}</div>

      <ng-container *ngIf="!loading && inscricao">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <a routerLink="/voluntarios" [queryParams]="{ aba: inscricao.status === 'PENDENTE' ? 'aguardando' : 'historico' }" class="text-sm font-semibold text-brand-blue">← Voltar para cadastros</a>
            <h1 class="mt-2 text-2xl font-black">Inscrição</h1>
          </div>
          <span class="badge w-fit" [ngClass]="statusClass(inscricao.status)">{{ statusLabel(inscricao.status) }}</span>
        </div>

        <div *ngIf="message" class="rounded-xl bg-emerald-50 p-4 text-emerald-800">{{ message }}</div>
        <div *ngIf="error" class="rounded-xl bg-red-50 p-4 text-red-700">{{ error }}</div>

        <section class="card p-6">
          <h2 class="mb-5 text-lg font-black">Dados do voluntário</h2>
          <div class="flex flex-col gap-6 md:flex-row md:items-start">
            <img *ngIf="inscricao.foto_url" [src]="inscricao.foto_url" class="h-40 w-40 rounded-3xl object-cover" alt="Foto">
            <div *ngIf="!inscricao.foto_url" class="flex h-40 w-40 shrink-0 items-center justify-center rounded-3xl bg-sky-100 text-4xl font-black text-brand-blue">{{ initials(inscricao.nome_completo) }}</div>
            <div class="flex-1">
              <h3 class="text-3xl font-black text-slate-900">{{ inscricao.nome_completo }}</h3>
              <p class="mt-2 text-slate-500">{{ tipoLabel(inscricao.tipo) }} • {{ ageLabel(inscricao.data_nascimento) }}</p>
              <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                <div class="rounded-xl bg-slate-50 p-3"><div class="text-xs text-slate-400">Nascimento</div><strong>{{ formatDateBr(inscricao.data_nascimento) }}</strong></div>
                <div class="rounded-xl bg-slate-50 p-3"><div class="text-xs text-slate-400">Catequese</div><strong>{{ inscricao.etapa_catequese || '—' }}</strong></div>
                <div class="rounded-xl bg-slate-50 p-3"><div class="text-xs text-slate-400">Eucaristia</div><strong>{{ inscricao.eucaristia_ano || '—' }}</strong></div>
                <div class="rounded-xl bg-slate-50 p-3"><div class="text-xs text-slate-400">Crisma</div><strong>{{ inscricao.crisma_ano || '—' }}</strong></div>
                <div class="rounded-xl bg-slate-50 p-3"><div class="text-xs text-slate-400">Estudo</div><strong>{{ studyLabel(inscricao.horario_estudo) }}</strong></div>
                <div class="rounded-xl bg-slate-50 p-3"><div class="text-xs text-slate-400">WhatsApp</div><strong>{{ inscricao.autoriza_whatsapp ? 'Autorizado' : 'Não registrado' }}</strong></div>
                <div class="rounded-xl bg-slate-50 p-3 sm:col-span-2"><div class="text-xs text-slate-400">Inscrição realizada em</div><strong>{{ formatDateTimeBr(inscricao.created_at) }}</strong></div>
              </div>
            </div>
          </div>
        </section>

        <div class="grid gap-6 lg:grid-cols-2">
          <section class="card p-6">
            <h3 class="mb-4 text-lg font-black">Endereço e contatos</h3>
            <div class="space-y-3 text-sm">
              <p><span class="text-slate-400">Endereço:</span> {{ address() }}</p>
              <p><span class="text-slate-400">Celular:</span> {{ inscricao.celular || '—' }}</p>
              <p><span class="text-slate-400">Telefone:</span> {{ inscricao.telefone || '—' }}</p>
              <p><span class="text-slate-400">E-mail:</span> {{ inscricao.email || '—' }}</p>
            </div>
          </section>
          <section class="card p-6">
            <h3 class="mb-4 text-lg font-black">Funções</h3>
            <div class="flex flex-wrap gap-2">
              <span *ngFor="let funcao of inscricao.funcoes_habilitadas" class="badge bg-sky-50 text-brand-blue">{{ funcaoLabel(funcao) }}</span>
              <span *ngIf="!inscricao.funcoes_habilitadas?.length" class="text-sm text-slate-400">Nenhuma função configurada.</span>
            </div>
            <p class="mt-4 text-sm"><span class="text-slate-400">Observações:</span> {{ inscricao.observacoes || '—' }}</p>
          </section>
        </div>

        <section class="card p-6">
          <h3 class="mb-4 text-lg font-black">Responsáveis</h3>
          <div class="grid gap-4 md:grid-cols-2">
            <div *ngFor="let responsavel of inscricao.responsaveis" class="rounded-2xl border border-slate-200 p-4">
              <div class="flex items-center gap-2">
                <span *ngIf="responsavel.principal" class="text-amber-400">★</span>
                <strong>{{ responsavel.nome }}</strong>
                <span class="text-xs text-slate-400">• {{ responsavel.parentesco }}</span>
                <span *ngIf="responsavel.principal" class="badge bg-amber-50 text-amber-700">Principal</span>
              </div>
              <div class="mt-2 text-sm text-slate-600">{{ responsavel.celular || responsavel.telefone || 'Sem telefone' }}<br>{{ responsavel.email || 'Sem e-mail' }}</div>
            </div>
            <div *ngIf="!inscricao.responsaveis?.length" class="text-sm text-slate-400">Nenhum responsável cadastrado.</div>
          </div>
        </section>

        <section *ngIf="inscricao.status === 'APROVADA'" class="card p-6">
          <h3 class="mb-2 text-lg font-black">Vínculo após aprovação</h3>
          <p *ngIf="inscricao.voluntario_id" class="text-sm">Cadastro gerado: <a [routerLink]="['/voluntarios', inscricao.voluntario_id]" class="font-bold text-brand-blue">abrir voluntário</a></p>
          <p *ngIf="!inscricao.voluntario_id" class="text-sm text-slate-500">Inscrição aprovada, mas o vínculo com o cadastro ainda não apareceu.</p>
        </section>

        <section *ngIf="inscricao.status === 'REJEITADA'" class="card p-6">
          <h3 class="mb-2 text-lg font-black">Rejeição</h3>
          <p class="text-sm"><span class="text-slate-400">Data:</span> {{ formatDateTimeBr(inscricao.data_rejeicao) }}</p>
          <p class="mt-2 text-sm"><span class="text-slate-400">Motivo:</span> {{ inscricao.motivo_rejeicao || '—' }}</p>
        </section>

        <div class="sticky bottom-4 flex flex-wrap justify-end gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
          <a *ngIf="inscricao.status === 'PENDENTE'" [routerLink]="['/voluntarios/inscricoes', inscricao.id, 'editar']" class="btn-secondary">Editar</a>
          <button *ngIf="inscricao.status === 'PENDENTE'" type="button" class="btn-danger" [disabled]="busy" (click)="openReject()">Rejeitar inscrição</button>
          <button *ngIf="inscricao.status === 'PENDENTE'" type="button" class="btn-primary" [disabled]="busy" (click)="openApprove()">Aprovar inscrição</button>
        </div>
      </ng-container>
    </div>

    <app-confirm-dialog
      [open]="approveOpen"
      title="Aprovar inscrição"
      message="A inscrição será convertida em cadastro de voluntário. Esta pessoa poderá entrar nas escalas depois da aprovação."
      confirmLabel="Aprovar inscrição"
      (cancel)="approveOpen = false"
      (confirm)="confirmApprove()">
    </app-confirm-dialog>

    <app-confirm-dialog
      #rejectDialog
      [open]="rejectOpen"
      title="Rejeitar inscrição"
      message="A inscrição permanece no histórico. Informe o motivo da rejeição."
      confirmLabel="Rejeitar inscrição"
      reasonLabel="Motivo da rejeição"
      reasonPlaceholder="Descreva o motivo"
      [requireReason]="true"
      [danger]="true"
      (cancel)="rejectOpen = false"
      (confirm)="confirmReject($event)">
    </app-confirm-dialog>
  `
})
export class InscricaoDetailComponent implements OnInit {
  @ViewChild('rejectDialog') rejectDialog?: ConfirmDialogComponent;
  loading = true;
  busy = false;
  error = '';
  message = '';
  inscricao: Inscricao | null = null;
  approveOpen = false;
  rejectOpen = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private service: InscricoesService
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading = false;
      this.error = 'Inscrição não encontrada.';
      return;
    }
    try {
      this.inscricao = await this.service.getById(id);
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Erro ao carregar inscrição.';
    } finally {
      this.loading = false;
    }
  }

  initials = initials;
  tipoLabel = tipoLabel;
  studyLabel = studyLabel;
  formatDateBr = formatDateBr;
  formatDateTimeBr = formatDateTimeBr;

  ageLabel(date: string | null) {
    const age = ageFromDate(date);
    return age == null ? 'idade não informada' : `${age} anos`;
  }

  funcaoLabel(funcao: FuncaoEscala) {
    return FUNCOES_LABEL[funcao];
  }

  statusLabel(status: Inscricao['status']) {
    return STATUS_INSCRICAO_LABEL[status];
  }

  statusClass(status: Inscricao['status']) {
    return status === 'PENDENTE'
      ? 'bg-amber-50 text-amber-700'
      : status === 'APROVADA'
        ? 'bg-emerald-50 text-emerald-700'
        : 'bg-red-50 text-red-700';
  }

  address() {
    if (!this.inscricao) return '—';
    return [this.inscricao.rua, this.inscricao.numero, this.inscricao.bairro].filter(Boolean).join(', ') || '—';
  }

  openApprove() { this.approveOpen = true; }
  openReject() {
    this.rejectDialog?.resetReason();
    this.rejectOpen = true;
  }

  async confirmApprove() {
    if (!this.inscricao) return;
    this.approveOpen = false;
    this.busy = true;
    this.error = '';
    try {
      await this.service.aprovar(this.inscricao.id);
      this.message = 'Inscrição aprovada com sucesso.';
      await this.router.navigate(['/voluntarios'], { queryParams: { aba: 'aguardando', aprovada: '1' } });
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Não foi possível aprovar a inscrição.';
    } finally {
      this.busy = false;
    }
  }

  async confirmReject(motivo: string) {
    if (!this.inscricao) return;
    this.rejectOpen = false;
    this.busy = true;
    this.error = '';
    try {
      await this.service.rejeitar(this.inscricao.id, motivo);
      this.message = 'Inscrição rejeitada.';
      await this.router.navigate(['/voluntarios'], { queryParams: { aba: 'historico', status: 'REJEITADA' } });
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Não foi possível rejeitar a inscrição.';
    } finally {
      this.busy = false;
    }
  }
}
