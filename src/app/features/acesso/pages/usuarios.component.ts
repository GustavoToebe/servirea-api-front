import { NumeroComponent } from '../../../shared/components/numero/numero.component';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { mensagemApi } from '../../../core/api/api-error';
import { MascaraDirective } from '../../../shared/directives/mascara.directive';
import { emailValido, formatarTelefone, telefoneValido } from '../../../shared/utils/formatos';
import { AcessoApiService } from '../acesso-api.service';
import { Perfil, UsuarioParoquia } from '../acesso.models';

@Component({
  selector: 'app-usuarios-paroquia',
  imports: [FormsModule, MascaraDirective, NumeroComponent],
  template: `
    <div class="mx-auto max-w-3xl space-y-6">
      <div class="flex items-end justify-between gap-4">
        <div>
          <div class="text-xs font-extrabold uppercase tracking-wider text-brand-blue">Acesso</div>
          <h1 class="text-2xl font-black text-slate-900">Usuários</h1>
          <p class="text-sm text-slate-500">Quem entra nesta paróquia. A senha chega por convite, não por este formulário.</p>
        </div>
        <button type="button" class="btn-primary" (click)="novo()">Convidar</button>
      </div>

      @if (aviso) {
        <div class="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{{ aviso }}</div>
      }
      @if (erro) {
        <div class="rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ erro }}</div>
      }

      <div class="space-y-2">
        @for (usuario of usuarios; track usuario.usuarioId) {
          <button type="button" class="card flex w-full items-center justify-between p-4 text-left" (click)="editar(usuario)">
            <span>
              <span class="block font-extrabold">{{ usuario.nome }}<app-numero [numero]="usuario.sequencial" /></span>
              <span class="block text-sm text-slate-500">{{ usuario.email }} · {{ usuario.perfilNome }}</span>
            </span>
            <span class="text-xs font-bold uppercase tracking-wide text-slate-400">
              {{ usuario.ativo ? usuario.situacaoAcesso.replaceAll('_', ' ') : 'Inativo' }}
            </span>
          </button>
        }
      </div>

      @if (form) {
        <form class="card space-y-4 p-5" (ngSubmit)="salvar()">
          <h2 class="text-lg font-black">{{ form.usuarioId ? 'Editar usuário' : 'Convidar usuário' }}</h2>
          @if (form.somenteLeitura) {
            <p class="text-sm text-slate-500">Nome, e-mail e telefone pertencem a alguém que também acessa outra paróquia. Aqui dá para mudar o perfil e se está ativo.</p>
          }
          <label class="block text-sm font-semibold">Nome
            <input class="mt-1 w-full rounded-xl border px-3 py-2" name="nome" [(ngModel)]="form.nome" [disabled]="form.somenteLeitura" required>
          </label>
          <label class="block text-sm font-semibold">E-mail
            <input class="mt-1 w-full rounded-xl border px-3 py-2" type="email" name="email" [(ngModel)]="form.email" [disabled]="form.somenteLeitura" required
              #emailCampo="ngModel" placeholder="nome@exemplo.com">
            @if (emailCampo.touched && form.email.trim() && !emailValido(form.email)) {
              <span class="mt-1 block text-xs font-normal text-red-600">E-mail inválido.</span>
            }
          </label>
          <label class="block text-sm font-semibold">Telefone
            <input class="mt-1 w-full rounded-xl border px-3 py-2" name="telefone" [(ngModel)]="form.telefone" [disabled]="form.somenteLeitura"
              #telCampo="ngModel" appMascara="telefone" inputmode="tel" placeholder="(00) 00000-0000">
            @if (telCampo.touched && form.telefone.trim() && !telefoneValido(form.telefone)) {
              <span class="mt-1 block text-xs font-normal text-red-600">Telefone inválido. Informe o DDD e o número.</span>
            }
          </label>
          <label class="block text-sm font-semibold">Perfil
            <select class="mt-1 w-full rounded-xl border px-3 py-2" name="perfilId" [(ngModel)]="form.perfilId" required>
              <option value="" disabled>Escolha</option>
              @for (perfil of perfis; track perfil.id) {
                <option [value]="perfil.id">{{ perfil.nome }}</option>
              }
            </select>
          </label>
          <label class="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" name="ativo" [(ngModel)]="form.ativo">
            Ativo
          </label>
          <div class="flex flex-wrap gap-2">
            <button class="btn-primary" type="submit" [disabled]="salvando">Salvar</button>
            @if (form.usuarioId) {
              <button class="btn-secondary" type="button" (click)="reenviar()">Reenviar convite</button>
            }
            <button class="btn-secondary" type="button" (click)="form = null">Cancelar</button>
          </div>
        </form>
      }
    </div>
  `
})
export class UsuariosComponent implements OnInit {
  private api = inject(AcessoApiService);

  usuarios: UsuarioParoquia[] = [];
  perfis: Perfil[] = [];
  erro = '';
  aviso = '';
  salvando = false;
  readonly emailValido = emailValido;
  readonly telefoneValido = telefoneValido;
  form: {
    usuarioId?: string;
    nome: string;
    email: string;
    telefone: string;
    perfilId: string;
    ativo: boolean;
    somenteLeitura: boolean;
  } | null = null;

  ngOnInit(): void {
    this.api.perfis().subscribe({
      next: lista => this.perfis = lista.filter(p => p.ativo),
      error: () => this.perfis = []
    });
    this.carregar();
  }

  novo(): void {
    this.erro = '';
    this.aviso = '';
    this.form = { nome: '', email: '', telefone: '', perfilId: this.perfis[0]?.id || '', ativo: true, somenteLeitura: false };
  }

  editar(usuario: UsuarioParoquia): void {
    this.erro = '';
    this.aviso = '';
    this.form = {
      usuarioId: usuario.usuarioId,
      nome: usuario.nome,
      email: usuario.email,
      telefone: formatarTelefone(usuario.telefone),
      perfilId: usuario.perfilId || '',
      ativo: usuario.ativo,
      somenteLeitura: usuario.somenteLeitura
    };
  }

  salvar(): void {
    if (!this.form) return;
    if (!this.form.somenteLeitura) {
      if (!emailValido(this.form.email)) {
        this.erro = 'E-mail inválido.';
        return;
      }
      if (this.form.telefone.trim() && !telefoneValido(this.form.telefone)) {
        this.erro = 'Telefone inválido. Informe o DDD e o número.';
        return;
      }
    }
    this.salvando = true;
    this.erro = '';
    this.api.salvarUsuario({
      nome: this.form.nome,
      email: this.form.email,
      tipoTelefone: this.form.telefone ? 'CELULAR' : null,
      telefone: this.form.telefone || null,
      perfilId: this.form.perfilId,
      ativo: this.form.ativo
    }, this.form.usuarioId).subscribe({
      next: () => {
        this.salvando = false;
        this.form = null;
        this.aviso = 'Convite registrado.';
        this.carregar();
      },
      error: erro => {
        this.salvando = false;
        this.erro = mensagemApi(erro, 'Não foi possível salvar o usuário.');
      }
    });
  }

  reenviar(): void {
    if (!this.form?.usuarioId) return;
    this.api.reenviarConvite(this.form.usuarioId).subscribe({
      next: () => this.aviso = 'Convite reenviado.',
      error: erro => this.erro = mensagemApi(erro, 'Não foi possível reenviar o convite.')
    });
  }

  private carregar(): void {
    this.api.usuarios().subscribe({
      next: lista => this.usuarios = lista,
      error: erro => this.erro = mensagemApi(erro, 'Não foi possível carregar os usuários.')
    });
  }
}
