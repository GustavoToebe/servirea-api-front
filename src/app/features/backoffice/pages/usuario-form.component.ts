
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { BackofficeApiService } from '../backoffice-api.service';
import {
  ParoquiaAdmin,
  ROLE_LABEL,
  RoleUsuario,
  VinculoForm,
  apiMessage,
  initials
} from '../backoffice.models';

@Component({
    selector: 'app-usuario-form',
    imports: [FormsModule, RouterLink],
    template: `
    <div class="mb-6">
      <a routerLink="/admin/usuarios" class="bo-link">← Usuários</a>
      <h1 class="bo-title mt-2">{{ id ? 'Editar usuário' : 'Novo usuário' }}</h1>
    </div>
    
    @if (error) {
      <div class="mb-4 rounded-lg border border-[#e10600]/40 bg-[#e10600]/10 px-4 py-3 text-sm text-[#ffb4b0]">{{ error }}</div>
    }
    @if (notice) {
      <div class="mb-4 rounded-lg border border-emerald-800/50 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">{{ notice }}</div>
    }
    @if (loading) {
      <div class="text-sm text-neutral-400">Carregando...</div>
    }
    
    @if (!loading) {
      <form class="space-y-8" (ngSubmit)="save()">
        <section class="grid gap-6 lg:grid-cols-[160px_1fr]">
          <div class="bo-avatar mx-auto h-28 w-28 text-3xl ring-2 ring-[#e10600]/70">{{ initials(nome || 'U') }}</div>
          <div class="grid gap-4 md:grid-cols-2">
            <div class="md:col-span-2"><label class="bo-label">Nome completo *</label><input class="bo-field" [(ngModel)]="nome" name="nome" required></div>
            <div><label class="bo-label">E-mail *</label><input class="bo-field" type="email" [(ngModel)]="email" name="email" required></div>
            <div>
              <label class="bo-label">{{ id ? 'Nova senha' : 'Senha *' }}</label>
              <input class="bo-field" type="password" [(ngModel)]="senha" name="senha" [required]="!id" minlength="8" [placeholder]="id ? 'Em branco mantém a atual' : ''">
            </div>
            <label class="flex cursor-pointer items-center gap-3 text-sm font-semibold md:col-span-2" (click)="ativo=!ativo">
              <span class="bo-switch" [class.on]="ativo"><span></span></span>
              Usuário ativo
            </label>
          </div>
        </section>
        <section>
          <div class="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 class="text-lg font-bold">Paróquias</h2>
              <p class="text-sm text-neutral-500">Em quais paróquias este usuário pode entrar, e com qual papel.</p>
            </div>
            <button type="button" class="bo-link" (click)="addVinculo()">Adicionar paróquia</button>
          </div>
          <div class="overflow-hidden rounded-lg border border-[#2a2a2a]">
            <table class="bo-table">
              <thead>
                <tr><th>Paróquia</th><th>Papel</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                @for (vinculo of vinculos; track vinculo; let i = $index) {
                  <tr>
                    <td>
                      <select class="bo-field" [(ngModel)]="vinculo.tenantId" [name]="'tenant'+i">
                        <option value="">Selecione</option>
                        @for (paroquia of paroquias; track paroquia) {
                          <option [value]="paroquia.id">{{ paroquia.nome }}</option>
                        }
                      </select>
                    </td>
                    <td>
                      <select class="bo-field" [(ngModel)]="vinculo.role" [name]="'role'+i">
                        @for (role of roles; track role) {
                          <option [value]="role">{{ roleLabel[role] }}</option>
                        }
                      </select>
                    </td>
                    <td>
                      <select class="bo-field" [(ngModel)]="vinculo.status" [name]="'status'+i">
                        <option value="ATIVO">Ativo</option>
                        <option value="INATIVO">Inativo</option>
                      </select>
                    </td>
                    <td class="text-right"><button type="button" class="bo-link" (click)="vinculos.splice(i, 1)">Remover</button></td>
                  </tr>
                }
              </tbody>
            </table>
            @if (!vinculos.length) {
              <div class="bg-[#141414] px-4 py-10 text-center text-sm text-neutral-400">Nenhuma paróquia vinculada</div>
            }
          </div>
        </section>
        <div class="flex flex-wrap items-center justify-between gap-3 border-t border-[#2a2a2a] pt-5">
          <a routerLink="/admin/usuarios" class="bo-btn-ghost">Cancelar</a>
          <button class="bo-btn" type="submit" [disabled]="saving">{{ saving ? 'Salvando...' : (id ? 'Salvar usuário' : 'Criar usuário') }}</button>
        </div>
      </form>
    }
    `
})
export class UsuarioFormComponent implements OnInit {
  id: string | null = null;
  loading = false;
  saving = false;
  error = '';
  notice = '';
  nome = '';
  email = '';
  senha = '';
  ativo = true;
  vinculos: VinculoForm[] = [];
  paroquias: ParoquiaAdmin[] = [];
  roles: RoleUsuario[] = ['ADMIN', 'COORDENADOR', 'VISUALIZADOR'];
  roleLabel = ROLE_LABEL;
  initials = initials;

  constructor(private api: BackofficeApiService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.api.listarParoquias({
      situacao: '', nome: '', cnpj: '', email: '', tipoEmail: '',
      contratadoDe: '', contratadoAte: '', vigenciaDe: '', vigenciaAte: ''
    }).subscribe({
      next: rows => this.paroquias = rows,
      error: err => this.error = apiMessage(err)
    });
    this.route.paramMap.subscribe(params => {
      this.id = params.get('id');
      this.notice = '';
      this.error = '';
      this.senha = '';
      if (this.id) this.load(this.id);
      else {
        this.nome = '';
        this.email = '';
        this.ativo = true;
        this.vinculos = [];
      }
    });
  }

  addVinculo() {
    this.vinculos = [...this.vinculos, { tenantId: '', role: 'COORDENADOR', status: 'ATIVO' }];
  }

  save() {
    if (this.vinculos.some(vinculo => !vinculo.tenantId)) {
      this.error = 'Escolha a paróquia de cada vínculo, ou remova a linha vazia.';
      return;
    }
    this.saving = true;
    this.error = '';
    this.notice = '';
    const vinculos = this.vinculos.map(vinculo => ({
      tenantId: vinculo.tenantId,
      role: vinculo.role,
      status: vinculo.status
    }));
    if (!this.id) {
      this.api.criarUsuario({
        nome: this.nome.trim(),
        email: this.email.trim(),
        senha: this.senha,
        ativo: this.ativo,
        vinculos
      }).subscribe({
        next: usuario => { this.saving = false; void this.router.navigate(['/admin/usuarios', usuario.id]); },
        error: err => { this.error = apiMessage(err); this.saving = false; }
      });
      return;
    }
    const id = this.id;
    forkJoin([
      this.api.atualizarUsuario(id, {
        nome: this.nome.trim(),
        email: this.email.trim(),
        senha: this.senha.trim() ? this.senha : null,
        ativo: this.ativo
      }),
      this.api.substituirVinculos(id, vinculos)
    ]).subscribe({
      next: () => { this.saving = false; this.senha = ''; this.notice = 'Usuário salvo.'; },
      error: err => { this.error = apiMessage(err); this.saving = false; }
    });
  }

  private load(id: string) {
    this.loading = true;
    this.api.buscarUsuario(id).subscribe({
      next: usuario => {
        this.nome = usuario.nome;
        this.email = usuario.email;
        this.ativo = usuario.ativo;
        this.vinculos = usuario.vinculos.map(vinculo => ({
          tenantId: vinculo.tenantId,
          role: vinculo.role,
          status: vinculo.status
        }));
        this.loading = false;
      },
      error: err => { this.error = apiMessage(err); this.loading = false; }
    });
  }
}
