import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { apiMessage } from '../backoffice.models';
import { BackofficeAuthService } from '../backoffice-auth.service';

@Component({
  selector: 'app-backoffice-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="bo relative grid min-h-screen place-items-center overflow-hidden p-4">
      <div class="pointer-events-none absolute left-1/2 top-0 h-64 w-[36rem] -translate-x-1/2 rounded-full bg-[#e10600]/20 blur-3xl"></div>
      <div class="relative w-full max-w-md rounded-2xl border border-[#2a2a2a] border-t-[3px] border-t-[#e10600] bg-[#111] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div class="mb-8">
          <div class="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#e10600] text-lg font-black">S</div>
          <h1 class="text-2xl font-extrabold tracking-tight">Painel Servire</h1>
          <p class="mt-2 text-sm text-neutral-400">Acesso do operador da plataforma. As paróquias entram por outro endereço.</p>
        </div>
        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
          <div>
            <label class="bo-label">E-mail</label>
            <input class="bo-field" type="email" formControlName="email" placeholder="suporte@servirea.com.br" autocomplete="username">
          </div>
          <div>
            <label class="bo-label">Senha</label>
            <input class="bo-field" type="password" formControlName="senha" placeholder="••••••••" autocomplete="current-password">
          </div>
          <div *ngIf="error" class="rounded-lg border border-[#e10600]/40 bg-[#e10600]/10 px-3 py-2 text-sm text-[#ffb4b0]">{{ error }}</div>
          <button class="bo-btn w-full" type="submit" [disabled]="loading || form.invalid">{{ loading ? 'Entrando...' : 'Entrar' }}</button>
        </form>
        <p class="mt-6 text-center text-xs text-neutral-500">
          <a routerLink="/login" class="font-semibold text-neutral-400 hover:text-white">Ir para o sistema da paróquia</a>
        </p>
      </div>
    </div>
  `
})
export class BackofficeLoginComponent {
  loading = false;
  error = '';
  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(8)]]
  });

  constructor(private fb: FormBuilder, private auth: BackofficeAuthService, private router: Router) {
    if (this.auth.isLoggedIn()) void this.router.navigate(['/admin/dashboard']);
  }

  async submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    try {
      await this.auth.login(this.form.controls.email.value, this.form.controls.senha.value);
      await this.router.navigate(['/admin/dashboard']);
    } catch (err) {
      this.error = apiMessage(err);
    } finally {
      this.loading = false;
    }
  }
}
