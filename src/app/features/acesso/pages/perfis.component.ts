import { NumeroComponent } from '../../../shared/components/numero/numero.component';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { mensagemApi } from '../../../core/api/api-error';
import { AcessoApiService } from '../acesso-api.service';
import { Perfil, SecaoCatalogo } from '../acesso.models';

@Component({
  selector: 'app-perfis',
  imports: [FormsModule, NumeroComponent],
  template: `
    <div class="mx-auto max-w-3xl space-y-6">
      <div class="flex items-end justify-between gap-4">
        <div>
          <div class="text-xs font-extrabold uppercase tracking-wider text-brand-blue">Acesso</div>
          <h1 class="text-2xl font-black text-slate-900">Perfis</h1>
          <p class="text-sm text-slate-500">O que cada pessoa pode ver e fazer nesta paróquia.</p>
        </div>
        <button type="button" class="btn-primary" (click)="novo()">Novo perfil</button>
      </div>

      @if (erro) {
        <div class="rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ erro }}</div>
      }

      <div class="space-y-2">
        @for (perfil of perfis; track perfil.id) {
          <button type="button" class="card flex w-full items-center justify-between p-4 text-left" (click)="editar(perfil)">
            <span>
              <span class="block font-extrabold">{{ perfil.nome }}<app-numero [numero]="perfil.sequencial" /></span>
              <span class="block text-sm text-slate-500">{{ perfil.usuarios }} {{ perfil.usuarios === 1 ? 'usuário' : 'usuários' }}</span>
            </span>
            <span class="text-xs font-bold uppercase tracking-wide text-slate-400">
              {{ perfil.acessoTotal ? 'Acesso total' : (perfil.ativo ? 'Ativo' : 'Inativo') }}
            </span>
          </button>
        }
      </div>

      @if (form) {
        <form class="card space-y-4 p-5" (ngSubmit)="salvar()">
          <h2 class="text-lg font-black">{{ form.id ? 'Editar perfil' : 'Novo perfil' }}</h2>
          <label class="block text-sm font-semibold">Nome
            <input class="mt-1 w-full rounded-xl border px-3 py-2" name="nome" [(ngModel)]="form.nome" required>
          </label>
          <label class="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" name="ativo" [(ngModel)]="form.ativo" [disabled]="form.sistema">
            Ativo
          </label>
          <label class="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" name="acessoTotal" [(ngModel)]="form.acessoTotal" [disabled]="form.sistema">
            Acesso total
          </label>
          @if (!form.acessoTotal) {
            @for (secao of catalogo; track secao.nome) {
              <fieldset class="space-y-2">
                <legend class="text-sm font-black">{{ secao.nome }}</legend>
                @for (modulo of secao.modulos; track modulo.codigo) {
                  <div class="rounded-xl border p-3">
                    <label class="flex items-center gap-2 text-sm font-semibold">
                      <input type="checkbox" [checked]="tem(modulo.codigo)" (change)="alternar(modulo.codigo)">
                      {{ modulo.nome }}
                    </label>
                    <div class="mt-2 flex flex-wrap gap-3 pl-6">
                      @for (acao of modulo.acoes; track acao.codigo) {
                        <label class="flex items-center gap-2 text-sm">
                          <input type="checkbox" [checked]="tem(acao.codigo)" (change)="alternar(acao.codigo, modulo.codigo)">
                          {{ acao.nome }}
                        </label>
                      }
                    </div>
                  </div>
                }
              </fieldset>
            }
          }
          <div class="flex flex-wrap gap-2">
            <button class="btn-primary" type="submit" [disabled]="salvando">Salvar</button>
            @if (form.id) {
              <button class="btn-secondary" type="button" (click)="duplicar()">Duplicar</button>
            }
            <button class="btn-secondary" type="button" (click)="form = null">Cancelar</button>
          </div>
        </form>
      }
    </div>
  `
})
export class PerfisComponent implements OnInit {
  private api = inject(AcessoApiService);

  perfis: Perfil[] = [];
  catalogo: SecaoCatalogo[] = [];
  erro = '';
  salvando = false;
  form: { id?: string; nome: string; ativo: boolean; acessoTotal: boolean; sistema: boolean; permissoes: string[] } | null = null;

  ngOnInit(): void {
    this.api.catalogo().subscribe({
      next: secoes => this.catalogo = secoes,
      error: () => this.catalogo = []
    });
    this.carregar();
  }

  novo(): void {
    this.erro = '';
    this.form = { nome: '', ativo: true, acessoTotal: false, sistema: false, permissoes: [] };
  }

  editar(perfil: Perfil): void {
    this.erro = '';
    this.form = {
      id: perfil.id,
      nome: perfil.nome,
      ativo: perfil.ativo,
      acessoTotal: perfil.acessoTotal,
      sistema: perfil.sistema,
      permissoes: [...perfil.permissoes]
    };
  }

  tem(codigo: string): boolean {
    return !!this.form?.permissoes.includes(codigo);
  }

  alternar(codigo: string, modulo?: string): void {
    if (!this.form) return;
    const lista = this.form.permissoes;
    const i = lista.indexOf(codigo);
    if (i >= 0) {
      lista.splice(i, 1);
      return;
    }
    lista.push(codigo);
    if (modulo && !lista.includes(modulo)) {
      lista.push(modulo);
    }
  }

  salvar(): void {
    if (!this.form) return;
    this.salvando = true;
    this.erro = '';
    this.api.salvarPerfil(this.form, this.form.id).subscribe({
      next: () => {
        this.salvando = false;
        this.form = null;
        this.carregar();
      },
      error: erro => {
        this.salvando = false;
        this.erro = mensagemApi(erro, 'Não foi possível salvar o perfil.');
      }
    });
  }

  duplicar(): void {
    if (!this.form?.id) return;
    this.api.duplicarPerfil(this.form.id).subscribe({
      next: () => {
        this.form = null;
        this.carregar();
      },
      error: erro => this.erro = mensagemApi(erro, 'Não foi possível duplicar o perfil.')
    });
  }

  private carregar(): void {
    this.api.perfis().subscribe({
      next: lista => this.perfis = lista,
      error: erro => this.erro = mensagemApi(erro, 'Não foi possível carregar os perfis.')
    });
  }
}
