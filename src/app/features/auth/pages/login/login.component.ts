import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="relative grid min-h-screen place-items-center overflow-hidden bg-[#F4F5FF] p-4">
      <div class="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#673DE6]/20 blur-3xl"></div>
      <div class="pointer-events-none absolute -bottom-28 -right-16 h-80 w-80 rounded-full bg-[#2F1C6A]/15 blur-3xl"></div>

      <div class="relative w-full max-w-md rounded-3xl border border-white/70 bg-white p-8 shadow-[0_24px_60px_rgba(47,28,106,0.12)]">
        <div class="mb-8 text-center">
          <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-blue text-xl font-black text-white">SJ</div>
          <h1 class="text-2xl font-extrabold tracking-tight text-brand-ink">Escalas da Paróquia</h1>
          <p class="mt-2 text-sm text-slate-500">São José Operário • Coroinhas e acólitos</p>
        </div>

        <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
          <div>
            <label class="label">E-mail</label>
            <input class="field" type="email" formControlName="email" placeholder="seu@email.com">
          </div>
          <div>
            <label class="label">Senha</label>
            <input class="field" type="password" formControlName="password" placeholder="••••••••">
          </div>
          <div *ngIf="error" class="rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ error }}</div>
          <button class="btn-primary w-full" type="submit" [disabled]="loading || form.invalid">
            {{ loading ? 'Entrando...' : 'Entrar' }}
          </button>
        </form>

        <p class="mt-6 text-center text-sm">
          <a routerLink="/inscricao" class="font-semibold text-brand-blue">Inscrever coroinha ou acólito</a>
        </p>
        <p class="mt-3 text-center text-xs text-slate-400">Acesso restrito aos responsáveis pela organização das escalas.</p>
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
  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router) {}

  async submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    try {
      await this.auth.signIn(this.form.controls.email.value, this.form.controls.password.value);
      await this.router.navigate(['/dashboard']);
    } catch (e: any) {
      this.error = e?.message || 'Não foi possível entrar. Confira e-mail e senha.';
    } finally {
      this.loading = false;
    }
  }
}
