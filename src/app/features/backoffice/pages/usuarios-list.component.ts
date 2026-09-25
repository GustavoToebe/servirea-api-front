
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BackofficeApiService } from '../backoffice-api.service';
import { ROLE_LABEL, UsuarioAdmin, apiMessage, initials } from '../backoffice.models';

@Component({
    selector: 'app-usuarios-list',
    imports: [FormsModule, RouterLink],
    template: `
    <div class="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h1 class="bo-title flex items-center gap-3">
        <svg class="h-7 w-7 text-[#e10600]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1"/><circle cx="9.5" cy="8" r="3"/></svg>
        Usuários
      </h1>
      <a routerLink="/admin/usuarios/novo" class="bo-btn">Novo usuário</a>
    </div>
    
    <div class="mb-4 flex flex-col gap-3 lg:flex-row">
      <input class="bo-field lg:flex-1" [(ngModel)]="busca" placeholder="Pesquisar usuário" (keyup.enter)="load()">
      <select class="bo-field lg:w-48" [(ngModel)]="ativo">
        <option value="">Todos</option>
        <option value="true">Ativo</option>
        <option value="false">Inativo</option>
      </select>
      <button class="bo-btn" type="button" (click)="load()">Buscar</button>
    </div>
    
    @if (error) {
      <div class="mb-4 rounded-lg border border-[#e10600]/40 bg-[#e10600]/10 px-4 py-3 text-sm text-[#ffb4b0]">{{ error }}</div>
    }
    
    <div class="overflow-hidden rounded-lg border border-[#2a2a2a]">
      <table class="bo-table">
        <thead>
          <tr>
            <th>Usuário</th>
            <th>E-mail</th>
            <th>Paróquias</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          @for (row of rows; track row) {
            <tr class="cursor-pointer" [routerLink]="['/admin/usuarios', row.id]">
              <td>
                <div class="flex items-center gap-3">
                  <span class="bo-avatar h-9 w-9 text-xs">{{ initials(row.nome) }}</span>
                  <div>
                    <div class="font-semibold">{{ row.nome }}</div>
                    <div class="text-xs text-neutral-500">{{ papel(row) }}</div>
                  </div>
                </div>
              </td>
              <td>{{ row.email }}</td>
              <td>{{ row.vinculos.length }}</td>
              <td [class]="row.ativo ? 'bo-ok' : 'bo-mute'">{{ row.ativo ? 'Ativo' : 'Inativo' }}</td>
            </tr>
          }
        </tbody>
      </table>
      @if (loading) {
        <div class="bg-[#141414] px-4 py-10 text-center text-sm text-neutral-400">Carregando usuários...</div>
      }
      @if (!loading && !rows.length) {
        <div class="bg-[#141414] px-4 py-16 text-center text-sm text-neutral-400">Não há usuário(s)</div>
      }
    </div>
    `
})
export class UsuariosListComponent implements OnInit {
  rows: UsuarioAdmin[] = [];
  loading = true;
  error = '';
  busca = '';
  ativo = '';
  initials = initials;

  constructor(private api: BackofficeApiService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.error = '';
    const ativo = this.ativo === '' ? null : this.ativo === 'true';
    this.api.listarUsuarios(ativo, this.busca).subscribe({
      next: rows => { this.rows = rows; this.loading = false; },
      error: err => { this.error = apiMessage(err); this.loading = false; }
    });
  }

  papel(row: UsuarioAdmin): string {
    const first = row.vinculos[0];
    if (!first) return 'Sem paróquia';
    const extra = row.vinculos.length > 1 ? ` +${row.vinculos.length - 1}` : '';
    return `${ROLE_LABEL[first.role]} · ${first.tenantNome}${extra}`;
  }
}
