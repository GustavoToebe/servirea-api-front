import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { BackofficeApiService } from '../backoffice-api.service';
import { BackofficeLog, ParoquiaAdmin, apiMessage, formatWhen } from '../backoffice.models';

@Component({
  selector: 'app-logs-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mb-5">
      <h1 class="bo-title">Logs</h1>
      <p class="mt-1 text-sm text-neutral-400">O que o operador fez no painel: paróquias, usuários, bloqueio, pagamento e suporte.</p>
    </div>

    <div *ngIf="error" class="mb-4 rounded-lg border border-[#e10600]/40 bg-[#e10600]/10 px-4 py-3 text-sm text-[#ffb4b0]">{{ error }}</div>

    <div class="overflow-hidden rounded-lg border border-[#2a2a2a]">
      <table class="bo-table">
        <thead>
          <tr>
            <th>Quando</th>
            <th>Ação</th>
            <th>Entidade</th>
            <th>Paróquia</th>
            <th>IP</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let row of rows">
            <td>{{ when(row.createdAt) }}</td>
            <td class="font-semibold text-[#ff8a86]">{{ acao(row.acao) }}</td>
            <td>{{ row.entidade }}</td>
            <td>{{ paroquia(row.tenantAlvoId) }}</td>
            <td class="text-neutral-400">{{ row.ip || '—' }}</td>
          </tr>
        </tbody>
      </table>
      <div *ngIf="loading" class="bg-[#141414] px-4 py-10 text-center text-sm text-neutral-400">Carregando logs...</div>
      <div *ngIf="!loading && !rows.length" class="bg-[#141414] px-4 py-16 text-center text-sm text-neutral-400">Não há registro(s)</div>
    </div>
  `
})
export class LogsListComponent implements OnInit {
  rows: BackofficeLog[] = [];
  loading = true;
  error = '';
  when = formatWhen;
  private nomes = new Map<string, string>();

  constructor(private api: BackofficeApiService) {}

  ngOnInit() {
    this.api.listarParoquias({
      situacao: '', nome: '', cnpj: '', email: '', tipoEmail: '',
      contratadoDe: '', contratadoAte: '', vigenciaDe: '', vigenciaAte: ''
    }).subscribe({
      next: (paroquias: ParoquiaAdmin[]) => paroquias.forEach(paroquia => this.nomes.set(paroquia.id, paroquia.nome)),
      error: () => undefined
    });
    this.api.listarLogs().subscribe({
      next: rows => { this.rows = rows; this.loading = false; },
      error: err => { this.error = apiMessage(err); this.loading = false; }
    });
  }

  paroquia(id: string | null): string {
    if (!id) return '—';
    return this.nomes.get(id) || id.slice(0, 8);
  }

  acao(value: string): string {
    const labels: Record<string, string> = {
      CRIAR: 'Criar',
      ATUALIZAR: 'Atualizar',
      BLOQUEAR: 'Bloquear',
      DESBLOQUEAR: 'Desbloquear',
      MARCAR_PAGO: 'Marcar pago',
      SUPORTE_ENTRAR: 'Suporte',
      VINCULOS: 'Vínculos'
    };
    return labels[value] || value;
  }
}
