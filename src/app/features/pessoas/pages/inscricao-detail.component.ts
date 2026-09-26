
import { NumeroComponent } from '../../../shared/components/numero/numero.component';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { Inscricao } from '../models/inscricao.model';
import { TIPO_LABEL } from '../models/pessoa.model';
import { InscricoesApiService } from '../services/inscricoes-api.service';

@Component({
    selector: 'app-inscricao-detail',
    imports: [RouterLink, ConfirmDialogComponent, NumeroComponent],
    template: `
    @if (inscricao) {
      <div class="mx-auto max-w-4xl space-y-6">
        <a routerLink="/pessoas" [queryParams]="{ aba: inscricao.status === 'PENDENTE' ? 'aguardando' : 'historico' }" class="text-sm font-semibold text-brand-blue">← Voltar</a>
        <section class="card p-6">
          <h1 class="text-3xl font-black">{{ inscricao.nomeCompleto }}<app-numero [numero]="inscricao.sequencial" /></h1>
          <p class="text-slate-500">{{ tipoLabel[inscricao.tipo] }} · {{ inscricao.status }}</p>
          <p class="mt-2 text-sm">{{ inscricao.emails.length ? inscricao.emails[0].email : 'sem e-mail' }}</p>
        </section>
        @if (inscricao.responsaveis.length) {
          <section class="card p-6">
            <h2 class="mb-3 text-lg font-black">Responsáveis</h2>
            @for (r of inscricao.responsaveis; track r) {
              <div class="rounded-2xl border p-4">
                <strong>{{ r.nome }}</strong> <span class="text-sm text-slate-500">{{ r.parentesco }}</span>
                @if (r.principal) {
                  <span class="text-amber-500"> ★</span>
                }
              </div>
            }
          </section>
        }
        @if (inscricao.status==='PENDENTE') {
          <div class="flex gap-2">
            <button type="button" class="btn-primary" (click)="approve=true">Aprovar</button>
            <button type="button" class="btn-danger" (click)="openReject()">Rejeitar</button>
          </div>
        }
        @if (inscricao.voluntarioId) {
          <a [routerLink]="['/pessoas', inscricao.voluntarioId]" class="btn-secondary">Abrir cadastro gerado</a>
        }
      </div>
    }
    @if (error) {
      <div class="rounded-xl bg-red-50 p-4 text-red-700">{{ error }}</div>
    }
    <app-confirm-dialog [open]="approve" title="Aprovar" [message]="'Criar o cadastro de ' + (inscricao?.nomeCompleto || '') + '?'"
    confirmLabel="Aprovar" (cancel)="approve=false" (confirm)="doApprove()"></app-confirm-dialog>
    <app-confirm-dialog #rejectDialog [open]="reject" title="Rejeitar" [danger]="true" [requireReason]="true"
    message="Informe o motivo." confirmLabel="Rejeitar" (cancel)="reject=false" (confirm)="doReject($event)"></app-confirm-dialog>
    `
})
export class InscricaoDetailComponent implements OnInit {
  @ViewChild('rejectDialog') rejectDialog?: ConfirmDialogComponent;
  inscricao: Inscricao | null = null;
  error = '';
  approve = false;
  reject = false;
  tipoLabel = TIPO_LABEL;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: InscricoesApiService
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    try {
      this.inscricao = await this.api.buscar(id);
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Não encontrada.';
    }
  }

  openReject() {
    this.rejectDialog?.resetReason();
    this.reject = true;
  }

  async doApprove() {
    this.approve = false;
    if (!this.inscricao) return;
    try {
      this.inscricao = await this.api.aprovar(this.inscricao.id);
      if (this.inscricao.voluntarioId) {
        await this.router.navigate(['/pessoas', this.inscricao.voluntarioId]);
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Falha ao aprovar.';
    }
  }

  async doReject(motivo: string) {
    this.reject = false;
    if (!this.inscricao) return;
    try {
      this.inscricao = await this.api.rejeitar(this.inscricao.id, motivo);
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Falha ao rejeitar.';
    }
  }
}
