import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';
import { TenantResumo } from '../../../../core/auth/auth.models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="relative grid min-h-screen place-items-center overflow-hidden bg-[#F4F5FF] p-4">
      <div class="relative w-full max-w-md rounded-3xl border border-white/70 bg-white p-8 shadow-[0_24px_60px_rgba(47,28,106,0.12)]">
        <div class="mb-8 text-center">
          <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-blue text-xl font-black text-white">SJ</div>
          <h1 class="text-2xl font-extrabold tracking-tight text-brand-ink">Escalas da Paróquia</h1>
          <p class="mt-2 text-sm text-slate-500">Acesso da coordenação</p>
        </div>

        <form *ngIf="!tenants.length" [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
          <div>
            <label class="label">E-mail</label>
            <input class="field" type="email" formControlName="email" autocomplete="username">
          </div>
          <div>
            <label class="label">Senha</label>
            <input class="field" type="password" formControlName="senha" autocomplete="current-password">
          </div>
          <div *ngIf="error" class="rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ error }}</div>
          <button class="btn-primary w-full" type="submit" [disabled]="loading || form.invalid">
            {{ loading ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>

        <div *ngIf="tenants.length" class="space-y-3">
          <p class="text-sm text-slate-600">Escolha a paróquia:</p>
          <button *ngFor="let t of tenants" type="button" class="btn-secondary w-full" [disabled]="loading" (click)="escolher(t)">
            {{ t.nome }}
          </button>
          <div *ngIf="error" class="rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ error }}</div>
        </div>

        <p class="mt-6 text-center text-sm">
          <a routerLink="/inscricao" class="font-semibold text-brand-blue">Inscrever coroinha ou acólito</a>
        </p>
        <p class="mt-6 text-center text-xs">
          <a routerLink="/admin/login" class="font-semibold text-slate-400 hover:text-brand-navy">Painel da plataforma</a>
        </p>
      </div>
    </div>
  `
})
export class LoginComponent {
  loading = false;
  error = '';
  tenants: TenantResumo[] = [];
  tokenSelecao = '';
  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(6)]]
  });

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  async submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    try {
      const resposta = await this.auth.login(this.form.controls.email.value, this.form.controls.senha.value);
      if (resposta.precisaSelecionarTenant) {
        this.tokenSelecao = resposta.tokenSelecaoTenant || '';
        this.tenants = resposta.tenantsDisponiveis || [];
        return;
      }
      await this.router.navigate(['/dashboard']);
    } catch (e: unknown) {
      this.error = e instanceof Error ? e.message : 'Não foi possível entrar.';
    } finally {
      this.loading = false;
    }
  }

  async escolher(tenant: TenantResumo) {
    this.loading = true;
    this.error = '';
    try {
      await this.auth.selecionarTenant(this.tokenSelecao, tenant.id);
      await this.router.navigate(['/dashboard']);
    } catch (e: unknown) {
      this.error = e instanceof Error ? e.message : 'Não foi possível escolher a paróquia.';
    } finally {
      this.loading = false;
    }
  }
}
