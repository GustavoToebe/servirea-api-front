import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { mensagemApi } from '../../../core/api/api-error';
import { ParoquiaApiService } from '../paroquia-api.service';
import { ContatoEmail, ContatoTelefone, Diocese, ParoquiaRequest } from '../paroquia.models';

/**
 * Dados da paróquia (GET/PUT /tenant). A diocese é só informativa: escolhe
 * uma já usada ou digita o nome; o back reaproveita a mesma diocese sem
 * diferenciar maiúsculas.
 */
@Component({
  selector: 'app-paroquia',
  imports: [FormsModule],
  template: `
    <div class="mx-auto max-w-3xl space-y-6">
      <div>
        <div class="text-xs font-extrabold uppercase tracking-wider text-brand-blue">Cadastro</div>
        <h1 class="text-2xl font-black text-slate-900">Paróquia</h1>
        <p class="text-sm text-slate-500">Nome, diocese e contatos que aparecem para a coordenação.</p>
      </div>
      @if (erro) {
        <div class="rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ erro }}</div>
      }
      @if (aviso) {
        <div class="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{{ aviso }}</div>
      }
      @if (carregado) {
        <form class="space-y-6" (ngSubmit)="salvar()">
          <section class="card space-y-4 p-5">
            <label class="block">
              <span class="label">Nome da paróquia *</span>
              <input class="field" name="nome" [(ngModel)]="nome" required>
            </label>
            <div class="grid gap-4 md:grid-cols-2">
              <label class="block">
                <span class="label">Razão social</span>
                <input class="field" name="razaoSocial" [(ngModel)]="razaoSocial">
              </label>
              <label class="block">
                <span class="label">CNPJ</span>
                <input class="field" name="cnpj" [(ngModel)]="cnpj">
              </label>
            </div>
            <label class="block">
              <span class="label">Diocese</span>
              <input class="field" name="diocese" [(ngModel)]="diocese" list="lista-dioceses"
                placeholder="Ex.: Diocese de Cascavel" autocomplete="off">
              <datalist id="lista-dioceses">
                @for (d of dioceses; track d.id) {
                  <option [value]="d.nome"></option>
                }
              </datalist>
              <span class="mt-1 block text-xs text-slate-500">Escolha uma da lista ou digite o nome. Deixe em branco se não quiser informar.</span>
            </label>
          </section>

          <section class="card space-y-3 p-5">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-black">E-mails</h2>
              <button type="button" class="btn-secondary !px-3 !py-1.5 text-sm" (click)="addEmail()">+ E-mail</button>
            </div>
            @for (e of emails; track $index; let i = $index) {
              <div class="grid items-end gap-3 md:grid-cols-[10rem_1fr_auto_auto]">
                <label class="block"><span class="label">Tipo</span>
                  <input class="field" [name]="'emailTipo' + i" [(ngModel)]="e.tipo"></label>
                <label class="block"><span class="label">E-mail</span>
                  <input class="field" type="email" [name]="'email' + i" [(ngModel)]="e.email"></label>
                <label class="flex items-center gap-2 pb-3 text-sm font-semibold">
                  <input type="radio" name="emailPrincipal" [checked]="e.principal" (change)="principalEmail(i)"> Principal
                </label>
                <button type="button" class="pb-3 text-sm font-semibold text-red-600" (click)="removerEmail(i)">Excluir</button>
              </div>
            } @empty {
              <p class="text-sm text-slate-500">Nenhum e-mail.</p>
            }
          </section>

          <section class="card space-y-3 p-5">
            <div class="flex items-center justify-between">
              <h2 class="text-lg font-black">Telefones</h2>
              <button type="button" class="btn-secondary !px-3 !py-1.5 text-sm" (click)="addTelefone()">+ Telefone</button>
            </div>
            @for (t of telefones; track $index; let i = $index) {
              <div class="grid items-end gap-3 md:grid-cols-[10rem_1fr_auto_auto]">
                <label class="block"><span class="label">Tipo</span>
                  <input class="field" [name]="'telTipo' + i" [(ngModel)]="t.tipo"></label>
                <label class="block"><span class="label">Número</span>
                  <input class="field" [name]="'tel' + i" [(ngModel)]="t.numero"></label>
                <label class="flex items-center gap-2 pb-3 text-sm font-semibold">
                  <input type="radio" name="telPrincipal" [checked]="t.principal" (change)="principalTelefone(i)"> Principal
                </label>
                <button type="button" class="pb-3 text-sm font-semibold text-red-600" (click)="removerTelefone(i)">Excluir</button>
              </div>
            } @empty {
              <p class="text-sm text-slate-500">Nenhum telefone.</p>
            }
          </section>

          <div class="flex justify-end">
            <button class="btn-primary" type="submit" [disabled]="salvando || !nome.trim()">Salvar</button>
          </div>
        </form>
      }
    </div>
  `
})
export class ParoquiaComponent implements OnInit {
  private api = inject(ParoquiaApiService);
  private auth = inject(AuthService);

  nome = '';
  razaoSocial = '';
  cnpj = '';
  diocese = '';
  emails: ContatoEmail[] = [];
  telefones: ContatoTelefone[] = [];
  dioceses: Diocese[] = [];
  erro = '';
  aviso = '';
  carregado = false;
  salvando = false;

  ngOnInit(): void {
    this.api.buscar().subscribe({
      next: p => {
        this.nome = p.nome;
        this.razaoSocial = p.razaoSocial || '';
        this.cnpj = p.cnpj || '';
        this.diocese = p.diocese || '';
        this.emails = p.emails.map(e => ({ ...e }));
        this.telefones = p.telefones.map(t => ({ ...t }));
        this.carregado = true;
      },
      error: erro => this.erro = mensagemApi(erro, 'Não foi possível carregar a paróquia.')
    });
    this.api.dioceses().subscribe({ next: lista => this.dioceses = lista, error: () => this.dioceses = [] });
  }

  addEmail(): void {
    this.emails.push({ tipo: 'Secretaria', email: '', principal: this.emails.length === 0 });
  }

  addTelefone(): void {
    this.telefones.push({ tipo: 'Secretaria', numero: '', principal: this.telefones.length === 0 });
  }

  removerEmail(i: number): void {
    this.emails.splice(i, 1);
  }

  removerTelefone(i: number): void {
    this.telefones.splice(i, 1);
  }

  principalEmail(i: number): void {
    this.emails.forEach((e, j) => e.principal = j === i);
  }

  principalTelefone(i: number): void {
    this.telefones.forEach((t, j) => t.principal = j === i);
  }

  salvar(): void {
    this.salvando = true;
    this.erro = '';
    this.aviso = '';
    this.api.salvar(montarRequisicao(this)).subscribe({
      next: p => {
        this.salvando = false;
        this.diocese = p.diocese || '';
        this.emails = p.emails.map(e => ({ ...e }));
        this.telefones = p.telefones.map(t => ({ ...t }));
        this.auth.atualizarTenantNome(p.nome);
        this.aviso = 'Dados da paróquia salvos.';
        this.api.dioceses().subscribe({ next: lista => this.dioceses = lista, error: () => undefined });
      },
      error: erro => {
        this.salvando = false;
        this.erro = mensagemApi(erro, 'Não foi possível salvar a paróquia.');
      }
    });
  }
}

/**
 * Linhas vazias ficam de fora; se sobrou contato e nenhum marcado como
 * principal, o primeiro vira principal (o back exige exatamente um).
 */
export function montarRequisicao(f: {
  nome: string; razaoSocial: string; cnpj: string; diocese: string;
  emails: ContatoEmail[]; telefones: ContatoTelefone[];
}): ParoquiaRequest {
  const vazioParaNulo = (v: string) => v.trim() ? v.trim() : null;
  const emails = f.emails
    .filter(e => e.email.trim())
    .map(e => ({ tipo: e.tipo.trim() || 'E-mail', email: e.email.trim(), principal: e.principal }));
  const telefones = f.telefones
    .filter(t => t.numero.trim())
    .map(t => ({ tipo: t.tipo.trim() || 'Telefone', numero: t.numero.trim(), principal: t.principal }));
  for (const lista of [emails, telefones] as { principal: boolean }[][]) {
    if (lista.length && !lista.some(c => c.principal)) lista[0].principal = true;
  }
  return {
    nome: f.nome.trim(),
    razaoSocial: vazioParaNulo(f.razaoSocial),
    cnpj: vazioParaNulo(f.cnpj),
    diocese: vazioParaNulo(f.diocese),
    emails,
    telefones
  };
}
