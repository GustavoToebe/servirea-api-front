import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { mensagemApi } from '../../../core/api/api-error';
import { AcessoApiService } from '../acesso-api.service';

@Component({
  selector: 'app-meu-perfil',
  imports: [FormsModule],
  template: `
    <div class="mx-auto max-w-xl space-y-6">
      <div>
        <div class="text-xs font-extrabold uppercase tracking-wider text-brand-blue">Conta</div>
        <h1 class="text-2xl font-black text-slate-900">Meu perfil</h1>
        <p class="text-sm text-slate-500">{{ perfilNome }}</p>
      </div>
      @if (erro) {
        <div class="rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ erro }}</div>
      }
      @if (aviso) {
        <div class="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{{ aviso }}</div>
      }
      @if (carregado) {
        <form class="card space-y-4 p-5" (ngSubmit)="salvar()">
          <label class="block text-sm font-semibold">Nome
            <input class="mt-1 w-full rounded-xl border px-3 py-2" name="nome" [(ngModel)]="nome" required>
          </label>
          <label class="block text-sm font-semibold">E-mail
            <input class="mt-1 w-full rounded-xl border px-3 py-2" [value]="email" disabled>
          </label>
          <label class="block text-sm font-semibold">Telefone
            <input class="mt-1 w-full rounded-xl border px-3 py-2" name="telefone" [(ngModel)]="telefone">
          </label>
          <label class="block text-sm font-semibold">Nova senha
            <input class="mt-1 w-full rounded-xl border px-3 py-2" type="password" name="senha" [(ngModel)]="senha" autocomplete="new-password">
          </label>
          <button class="btn-primary" type="submit" [disabled]="salvando">Salvar</button>
        </form>
      }
    </div>
  `
})
export class MeuPerfilComponent implements OnInit {
  private api = inject(AcessoApiService);

  nome = '';
  email = '';
  telefone = '';
  senha = '';
  perfilNome = '';
  erro = '';
  aviso = '';
  carregado = false;
  salvando = false;

  ngOnInit(): void {
    this.api.eu().subscribe({
      next: eu => {
        this.nome = eu.nome;
        this.email = eu.email;
        this.telefone = eu.telefone || '';
        this.perfilNome = eu.perfil;
        this.carregado = true;
      },
      error: erro => this.erro = mensagemApi(erro, 'Não foi possível carregar o perfil.')
    });
  }

  salvar(): void {
    this.salvando = true;
    this.erro = '';
    this.aviso = '';
    this.api.salvarEu({
      nome: this.nome,
      tipoTelefone: this.telefone ? 'CELULAR' : null,
      telefone: this.telefone || null,
      senha: this.senha || null
    }).subscribe({
      next: eu => {
        this.salvando = false;
        this.senha = '';
        this.perfilNome = eu.perfil;
        this.aviso = 'Perfil atualizado.';
      },
      error: erro => {
        this.salvando = false;
        this.erro = mensagemApi(erro, 'Não foi possível salvar.');
      }
    });
  }
}
