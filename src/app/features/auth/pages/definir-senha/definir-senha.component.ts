import { Component, inject } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { mensagemApi } from '../../../../core/api/api-error';

function senhasIguais(grupo: AbstractControl): ValidationErrors | null {
  const senha = grupo.get('senha')?.value;
  const confirmacao = grupo.get('confirmacao')?.value;
  return senha && confirmacao && senha !== confirmacao ? { diferentes: true } : null;
}

/**
 * Destino do link do convite e do "esqueci minha senha"
 * (`/reset-password?token=...`, montado pela API). Com token: define a
 * senha. Sem token: pede um link novo por e-mail. Até 25/09/2026 esta
 * rota não existia e o link caía no login — o convidado nunca conseguia
 * entrar.
 */
@Component({
  selector: 'app-definir-senha',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="parish relative grid min-h-screen place-items-center overflow-hidden bg-app p-4">
      <div class="relative w-full max-w-md rounded-3xl border border-white/70 bg-white p-8 shadow-[0_24px_60px_rgba(47,28,106,0.12)]">
        @if (token) {
          <h1 class="text-2xl font-extrabold tracking-tight text-brand-ink">Defina sua senha</h1>
          <p class="mt-2 text-sm text-slate-500">Use pelo menos 8 caracteres. Depois é só entrar com seu e-mail.</p>

          @if (concluido) {
            <div class="mt-6 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">Senha definida.</div>
            <a routerLink="/login" class="btn-primary mt-4 w-full">Entrar</a>
          } @else {
            <form [formGroup]="senhaForm" (ngSubmit)="definir()" class="mt-6 space-y-4">
              <div>
                <label class="label" for="senha">Nova senha</label>
                <input id="senha" class="field" type="password" formControlName="senha" autocomplete="new-password">
              </div>
              <div>
                <label class="label" for="confirmacao">Repita a senha</label>
                <input id="confirmacao" class="field" type="password" formControlName="confirmacao" autocomplete="new-password">
              </div>
              @if (senhaForm.hasError('diferentes')) {
                <p class="text-sm text-red-700">As senhas não são iguais.</p>
              }
              @if (erro) {
                <div class="rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ erro }}</div>
              }
              <button class="btn-primary w-full" type="submit" [disabled]="carregando || senhaForm.invalid">
                {{ carregando ? 'Salvando...' : 'Salvar senha' }}
              </button>
            </form>
          }
        } @else {
          <h1 class="text-2xl font-extrabold tracking-tight text-brand-ink">Esqueci minha senha</h1>
          <p class="mt-2 text-sm text-slate-500">Enviamos um link para você criar uma senha nova.</p>

          @if (enviado) {
            <div class="mt-6 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
              Se o e-mail estiver cadastrado, o link chega em alguns minutos. Confira também o spam.
            </div>
          } @else {
            <form [formGroup]="emailForm" (ngSubmit)="pedirLink()" class="mt-6 space-y-4">
              <div>
                <label class="label" for="email">E-mail</label>
                <input id="email" class="field" type="email" formControlName="email" autocomplete="username">
              </div>
              @if (erro) {
                <div class="rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ erro }}</div>
              }
              <button class="btn-primary w-full" type="submit" [disabled]="carregando || emailForm.invalid">
                {{ carregando ? 'Enviando...' : 'Enviar link' }}
              </button>
            </form>
          }
        }

        <p class="mt-6 text-center text-sm">
          <a routerLink="/login" class="font-semibold text-brand-blue">Voltar para o login</a>
        </p>
      </div>
    </div>
  `
})
export class DefinirSenhaComponent {
  private http = inject(HttpClient);
  private fb = inject(FormBuilder);

  readonly token = inject(ActivatedRoute).snapshot.queryParamMap.get('token') || '';
  carregando = false;
  concluido = false;
  enviado = false;
  erro = '';

  senhaForm = this.fb.nonNullable.group({
    senha: ['', [Validators.required, Validators.minLength(8)]],
    confirmacao: ['', [Validators.required]]
  }, { validators: senhasIguais });

  emailForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]]
  });

  async definir(): Promise<void> {
    if (this.senhaForm.invalid) return;
    this.carregando = true;
    this.erro = '';
    try {
      await firstValueFrom(this.http.post(`${environment.apiUrl}/auth/reset-password`, {
        token: this.token,
        novaSenha: this.senhaForm.controls.senha.value
      }));
      this.concluido = true;
    } catch (erro) {
      this.erro = mensagemApi(erro, 'Link inválido ou expirado. Peça um novo ao administrador da paróquia.');
    } finally {
      this.carregando = false;
    }
  }

  async pedirLink(): Promise<void> {
    if (this.emailForm.invalid) return;
    this.carregando = true;
    this.erro = '';
    try {
      await firstValueFrom(this.http.post(`${environment.apiUrl}/auth/forgot-password`, {
        email: this.emailForm.controls.email.value.trim()
      }));
      this.enviado = true;
    } catch (erro) {
      this.erro = mensagemApi(erro, 'Não foi possível enviar agora. Tente de novo em instantes.');
    } finally {
      this.carregando = false;
    }
  }
}
