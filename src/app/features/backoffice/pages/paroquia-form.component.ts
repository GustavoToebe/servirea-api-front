import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BackofficeApiService } from '../backoffice-api.service';
import {
  ParoquiaAdmin,
  STATUS_PAROQUIA,
  StatusParoquia,
  TipoEmail,
  apiMessage,
  blankToNull,
  formatWhen,
  initials,
  statusClass
} from '../backoffice.models';

@Component({
  selector: 'app-paroquia-form',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <a routerLink="/admin/paroquias" class="bo-link">← Paróquias</a>
        <h1 class="bo-title mt-2">{{ id ? 'Editar paróquia' : 'Nova paróquia' }}</h1>
        <p *ngIf="codigo" class="mt-1 text-xs text-neutral-500">{{ codigo }} · {{ slug }}</p>
      </div>
      <div *ngIf="status" class="text-sm" [class]="statusClass(status)">{{ statusLabel(status) }}</div>
    </div>

    <div *ngIf="error" class="mb-4 rounded-lg border border-[#e10600]/40 bg-[#e10600]/10 px-4 py-3 text-sm text-[#ffb4b0]">{{ error }}</div>
    <div *ngIf="notice" class="mb-4 rounded-lg border border-emerald-800/50 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">{{ notice }}</div>
    <div *ngIf="loading" class="text-sm text-neutral-400">Carregando...</div>

    <form *ngIf="!loading" class="space-y-8" (ngSubmit)="save()">
      <section class="grid gap-6 lg:grid-cols-[180px_1fr]">
        <div class="flex flex-col items-center gap-3">
          <div class="bo-avatar h-28 w-28 text-3xl ring-2 ring-[#e10600]/70">{{ initials(form.nome || 'P') }}</div>
        </div>
        <div class="grid gap-4 md:grid-cols-2">
          <div class="md:col-span-2"><label class="bo-label">Nome da paróquia *</label><input class="bo-field" [(ngModel)]="form.nome" name="nome" required></div>
          <div *ngIf="!id"><label class="bo-label">Código *</label><input class="bo-field" [(ngModel)]="form.codigo" name="codigo" required></div>
          <div *ngIf="!id"><label class="bo-label">Slug *</label><input class="bo-field" [(ngModel)]="form.slug" name="slug" required placeholder="sao-jose"></div>
          <div><label class="bo-label">Razão social</label><input class="bo-field" [(ngModel)]="form.razaoSocial" name="razaoSocial"></div>
          <div><label class="bo-label">CNPJ</label><input class="bo-field" [(ngModel)]="form.cnpj" name="cnpj"></div>
          <div><label class="bo-label">E-mail</label><input class="bo-field" type="email" [(ngModel)]="form.email" name="email"></div>
          <div><label class="bo-label">Telefone</label><input class="bo-field" [(ngModel)]="form.telefone" name="telefone"></div>
          <div>
            <label class="bo-label">Tipo de e-mail</label>
            <select class="bo-field" [(ngModel)]="form.tipoEmail" name="tipoEmail">
              <option value="">Não informado</option>
              <option value="CONTATO">Contato</option>
              <option value="FINANCEIRO">Financeiro</option>
              <option value="ADMINISTRATIVO">Administrativo</option>
            </select>
          </div>
          <div *ngIf="id"><label class="bo-label">Vigência até</label><input class="bo-field" type="date" [(ngModel)]="form.vigenciaAte" name="vigenciaAte"></div>
        </div>
      </section>

      <section>
        <h2 class="text-lg font-bold">Endereço</h2>
        <p class="mb-4 text-sm text-neutral-500">Onde a paróquia fica.</p>
        <div class="grid gap-4 md:grid-cols-4">
          <div><label class="bo-label">CEP</label><input class="bo-field" [(ngModel)]="form.cep" name="cep"></div>
          <div class="md:col-span-2"><label class="bo-label">Cidade</label><input class="bo-field" [(ngModel)]="form.cidade" name="cidade"></div>
          <div><label class="bo-label">UF</label><input class="bo-field" [(ngModel)]="form.uf" name="uf" maxlength="2"></div>
          <div><label class="bo-label">Bairro</label><input class="bo-field" [(ngModel)]="form.bairro" name="bairro"></div>
          <div class="md:col-span-2"><label class="bo-label">Logradouro</label><input class="bo-field" [(ngModel)]="form.logradouro" name="logradouro"></div>
          <div><label class="bo-label">Número</label><input class="bo-field" [(ngModel)]="form.numero" name="numero"></div>
          <div class="md:col-span-2"><label class="bo-label">Complemento</label><input class="bo-field" [(ngModel)]="form.complemento" name="complemento"></div>
        </div>
      </section>

      <section>
        <label class="bo-label">Observações</label>
        <textarea class="bo-field min-h-28" [(ngModel)]="form.observacoes" name="observacoes"></textarea>
        <p *ngIf="pagamento" class="mt-2 text-xs text-neutral-500">Último pagamento: {{ when(pagamento) }}</p>
      </section>

      <section *ngIf="!id" class="bo-card p-5">
        <h2 class="text-lg font-bold">Primeiro administrador</h2>
        <p class="mb-4 text-sm text-neutral-500">Quem vai entrar no sistema da paróquia. A paróquia nasce em trial.</p>
        <div class="grid gap-4 md:grid-cols-3">
          <div><label class="bo-label">Nome *</label><input class="bo-field" [(ngModel)]="form.adminNome" name="adminNome" required></div>
          <div><label class="bo-label">E-mail *</label><input class="bo-field" type="email" [(ngModel)]="form.adminEmail" name="adminEmail" required></div>
          <div><label class="bo-label">Senha *</label><input class="bo-field" type="password" [(ngModel)]="form.adminSenha" name="adminSenha" required minlength="8"></div>
        </div>
      </section>

      <div *ngIf="id" class="flex flex-wrap gap-2">
        <button *ngIf="status !== 'BLOQUEADO' && status !== 'CANCELADO'" type="button" class="bo-btn-line" (click)="ask('bloquear')">Bloquear</button>
        <button *ngIf="status === 'BLOQUEADO'" type="button" class="bo-btn-line" (click)="ask('desbloquear')">Desbloquear</button>
        <button *ngIf="status !== 'CANCELADO'" type="button" class="bo-btn-line" (click)="ask('pago')">Marcar como pago</button>
        <button *ngIf="status === 'ATIVO' || status === 'TRIAL'" type="button" class="bo-btn-ghost" (click)="ask('suporte')">Entrar em suporte</button>
      </div>

      <div class="flex flex-wrap items-center justify-between gap-3 border-t border-[#2a2a2a] pt-5">
        <a routerLink="/admin/paroquias" class="bo-btn-ghost">Cancelar</a>
        <button class="bo-btn" type="submit" [disabled]="saving">{{ saving ? 'Salvando...' : (id ? 'Salvar paróquia' : 'Criar paróquia') }}</button>
      </div>
    </form>

    <div *ngIf="confirm" class="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div class="bo-card w-full max-w-md p-6">
        <h3 class="text-lg font-bold">{{ confirm.title }}</h3>
        <p class="mt-2 text-sm text-neutral-400">{{ confirm.message }}</p>
        <div class="mt-6 flex justify-end gap-2">
          <button type="button" class="bo-btn-ghost" (click)="confirm=null">Cancelar</button>
          <button type="button" class="bo-btn" (click)="runConfirm()">Confirmar</button>
        </div>
      </div>
    </div>
  `
})
export class ParoquiaFormComponent implements OnInit {
  id: string | null = null;
  loading = false;
  saving = false;
  error = '';
  notice = '';
  status: StatusParoquia | null = null;
  codigo = '';
  slug = '';
  pagamento: string | null = null;
  initials = initials;
  statusClass = statusClass;
  when = formatWhen;
  statusLabel = (status: StatusParoquia) => STATUS_PAROQUIA[status];
  confirm: { title: string; message: string; action: 'bloquear' | 'desbloquear' | 'pago' | 'suporte' } | null = null;
  form = this.empty();

  constructor(private api: BackofficeApiService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      this.id = params.get('id');
      this.notice = '';
      this.error = '';
      if (this.id) this.load(this.id);
      else {
        this.form = this.empty();
        this.status = null;
      }
    });
  }

  save() {
    this.saving = true;
    this.error = '';
    this.notice = '';
    const common = {
      nome: this.form.nome.trim(),
      razaoSocial: blankToNull(this.form.razaoSocial),
      cnpj: blankToNull(this.form.cnpj),
      email: blankToNull(this.form.email),
      telefone: blankToNull(this.form.telefone),
      cep: blankToNull(this.form.cep),
      cidade: blankToNull(this.form.cidade),
      uf: blankToNull(this.form.uf),
      bairro: blankToNull(this.form.bairro),
      logradouro: blankToNull(this.form.logradouro),
      numero: blankToNull(this.form.numero),
      complemento: blankToNull(this.form.complemento),
      observacoes: blankToNull(this.form.observacoes),
      tipoEmail: blankToNull(this.form.tipoEmail)
    };
    const request = this.id
      ? this.api.atualizarParoquia(this.id, { ...common, vigenciaAte: this.form.vigenciaAte || null })
      : this.api.criarParoquia({
          ...common,
          codigo: this.form.codigo.trim(),
          slug: this.form.slug.trim(),
          admin: {
            nome: this.form.adminNome.trim(),
            email: this.form.adminEmail.trim(),
            senha: this.form.adminSenha
          }
        });
    request.subscribe({
      next: paroquia => {
        this.saving = false;
        if (!this.id) {
          void this.router.navigate(['/admin/paroquias', paroquia.id]);
          return;
        }
        this.apply(paroquia);
        this.notice = 'Paróquia salva.';
      },
      error: err => { this.error = apiMessage(err); this.saving = false; }
    });
  }

  ask(action: 'bloquear' | 'desbloquear' | 'pago' | 'suporte') {
    const copy = {
      bloquear: ['Bloquear paróquia', 'A paróquia fica inadimplente e perde o acesso até ser desbloqueada.'],
      desbloquear: ['Desbloquear paróquia', 'A paróquia volta ao status ativa.'],
      pago: ['Marcar como pago', 'Registra o PIX manual e deixa a paróquia ativa.'],
      suporte: ['Entrar em suporte', 'Emite um acesso de suporte nesta paróquia. O app da paróquia ainda entra pelo login da coordenação.']
    } as const;
    this.confirm = { action, title: copy[action][0], message: copy[action][1] };
  }

  runConfirm() {
    if (!this.id || !this.confirm) return;
    const action = this.confirm.action;
    const id = this.id;
    this.confirm = null;
    this.error = '';
    this.notice = '';
    const done = {
      next: (paroquia: ParoquiaAdmin) => {
        this.apply(paroquia);
        this.notice = 'Situação atualizada.';
      },
      error: (err: unknown) => this.error = apiMessage(err)
    };
    if (action === 'bloquear') this.api.bloquear(id).subscribe(done);
    else if (action === 'desbloquear') this.api.desbloquear(id).subscribe(done);
    else if (action === 'pago') this.api.marcarPago(id).subscribe(done);
    else this.api.entrarEmSuporte(id).subscribe({
      next: result => this.notice = `Acesso de suporte emitido para ${result.tenantAtual.nome}.`,
      error: (err: unknown) => this.error = apiMessage(err)
    });
  }

  private load(id: string) {
    this.loading = true;
    this.api.buscarParoquia(id).subscribe({
      next: paroquia => { this.apply(paroquia); this.loading = false; },
      error: err => { this.error = apiMessage(err); this.loading = false; }
    });
  }

  private apply(paroquia: ParoquiaAdmin) {
    this.status = paroquia.status;
    this.codigo = paroquia.codigo;
    this.slug = paroquia.slug;
    this.pagamento = paroquia.ultimoPagamentoEm;
    this.form = {
      ...this.empty(),
      codigo: paroquia.codigo,
      slug: paroquia.slug,
      nome: paroquia.nome,
      razaoSocial: paroquia.razaoSocial || '',
      cnpj: paroquia.cnpj || '',
      email: paroquia.email || '',
      telefone: paroquia.telefone || '',
      tipoEmail: (paroquia.tipoEmail as TipoEmail) || '',
      cep: paroquia.cep || '',
      cidade: paroquia.cidade || '',
      uf: paroquia.uf || '',
      bairro: paroquia.bairro || '',
      logradouro: paroquia.logradouro || '',
      numero: paroquia.numero || '',
      complemento: paroquia.complemento || '',
      observacoes: paroquia.observacoes || '',
      vigenciaAte: paroquia.vigenciaAte || ''
    };
  }

  private empty() {
    return {
      codigo: '', slug: '', nome: '', razaoSocial: '', cnpj: '', email: '', telefone: '',
      tipoEmail: '' as TipoEmail, cep: '', cidade: '', uf: '', bairro: '', logradouro: '',
      numero: '', complemento: '', observacoes: '', vigenciaAte: '',
      adminNome: '', adminEmail: '', adminSenha: ''
    };
  }
}
