import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CabecalhoPaginaComponent } from '../../../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { BarraFiltrosComponent } from '../../../../shared/components/barra-filtros/barra-filtros.component';
import { LayoutsEscalaService } from '../../services/layouts-escala.service';
import { LayoutEscala, vagasDoLayout } from '../../models/escala.model';
import { DialogoService } from '../../../../shared/services/dialogo.service';
import { EstadoListaComponent } from '../../../../shared/components/estado-lista/estado-lista.component';

@Component({
  selector: 'app-layouts-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, CabecalhoPaginaComponent, BarraFiltrosComponent, EstadoListaComponent],
  template: `
    <div class="space-y-6">
      <app-cabecalho-pagina
        titulo="Layouts de Escala"
        subtitulo="Modelos visuais que definem o cabeçalho, as vagas e a distribuição das missas na escala e no PDF.">
        <a acoes routerLink="novo" class="btn-primary">＋ Novo layout</a>
      </app-cabecalho-pagina>

      <app-barra-filtros
        placeholder="Buscar layout por nome..."
        [termo]="termo"
        (termoChange)="termo = $event; filtrar()"
        (buscar)="filtrar()">
        <div class="flex flex-col gap-1">
          <label class="label">Situação</label>
          <select class="field" [(ngModel)]="situacao" (ngModelChange)="filtrar()" data-filtro-situacao>
            <option value="TODOS">Todos</option>
            <option value="ATIVOS">Ativos</option>
            <option value="INATIVOS">Inativos</option>
          </select>
        </div>
      </app-barra-filtros>

      <div class="tabela-rolagem">
        <table class="tabela">
          <thead>
            <tr>
              <th>Nome do Modelo</th>
              <th>Formato</th>
              <th>Vagas na Celebração</th>
              <th>Situação</th>
              <th class="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            @for (layout of layoutsFiltrados; track layout.id) {
              <tr>
                <td>
                  <div class="font-extrabold text-slate-900 flex items-center gap-2">
                    {{ layout.nome }}
                    @if (layout.sistema) {
                      <span class="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                        Padrão do Sistema
                      </span>
                    }
                    @if (layout.padrao) {
                      <span class="rounded bg-indigo-50 border border-indigo-200 px-2 py-0.5 text-[10px] font-bold text-indigo-700 uppercase tracking-wide" data-selo-padrao>
                        Layout padrão
                      </span>
                    }
                  </div>
                  @if (layout.descricao) {
                    <div class="text-[11px] text-slate-500 mt-0.5">{{ layout.descricao }}</div>
                  }
                  @if (temCabecalho(layout)) {
                    <div class="text-[11px] text-indigo-600 font-medium mt-0.5">
                      📄 Possui cabeçalho / avisos configurados
                    </div>
                  }
                </td>
                <td>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
                        [class.bg-purple-50]="layout.tipo === 'MENSAL'"
                        [class.text-purple-700]="layout.tipo === 'MENSAL'"
                        [class.border]="true"
                        [class.border-purple-200]="layout.tipo === 'MENSAL'"
                        [class.bg-sky-50]="layout.tipo === 'SEMANAL'"
                        [class.text-sky-700]="layout.tipo === 'SEMANAL'"
                        [class.border-sky-200]="layout.tipo === 'SEMANAL'">
                    {{ layout.tipo === 'SEMANAL' ? 'Semanal (Tabela)' : 'Mensal (Cartões)' }}
                  </span>
                </td>
                <td>
                  <div class="text-xs font-semibold text-slate-700">
                    <span class="font-bold text-slate-900">{{ numVagas(layout) }}</span> vaga(s)
                  </div>
                  <div class="text-[11px] text-slate-500 truncate max-w-xs mt-0.5">
                    {{ resumoVagas(layout) }}
                  </div>
                </td>
                <td>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold border"
                        [class.bg-emerald-50]="layout.ativo" [class.text-emerald-700]="layout.ativo" [class.border-emerald-200]="layout.ativo"
                        [class.bg-slate-100]="!layout.ativo" [class.text-slate-500]="!layout.ativo" [class.border-slate-200]="!layout.ativo"
                        [attr.data-situacao]="layout.ativo ? 'ativo' : 'inativo'">
                    {{ layout.ativo ? 'Ativo' : 'Inativo' }}
                  </span>
                </td>
                <td class="text-right whitespace-nowrap">
                  <button
                    type="button"
                    class="text-xs font-bold text-slate-600 hover:text-indigo-600 mr-3"
                    (click)="duplicar(layout)">
                    Duplicar
                  </button>
                  <a [routerLink]="[layout.id]" class="text-xs font-bold text-brand-blue hover:underline mr-3">
                    Editar
                  </a>
                  <button
                    type="button"
                    class="text-xs font-bold text-slate-600 hover:text-indigo-600 mr-3"
                    [attr.data-alternar-ativo]="layout.id"
                    (click)="alternarAtivo(layout)">
                    {{ layout.ativo ? 'Inativar' : 'Ativar' }}
                  </button>
                  @if (!layout.sistema) {
                    <button
                      type="button"
                      class="text-xs font-bold text-red-600 hover:underline"
                      (click)="excluir(layout)">
                      Excluir
                    </button>
                  }
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="5" class="p-0 border-0">
                  <app-estado-lista
                    [vazio]="true"
                    mensagemVazio="Nenhum layout de escala encontrado.">
                  </app-estado-lista>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `
})
export class LayoutsListComponent implements OnInit {
  private service = inject(LayoutsEscalaService);
  private dialogo = inject(DialogoService);
  private router = inject(Router);

  layouts: LayoutEscala[] = [];
  layoutsFiltrados: LayoutEscala[] = [];
  termo = '';
  situacao: 'TODOS' | 'ATIVOS' | 'INATIVOS' = 'TODOS';

  async ngOnInit() {
    await this.carregar();
  }

  async carregar() {
    try {
      this.layouts = await this.service.listar();
      this.filtrar();
    } catch (e: any) {
      this.dialogo.avisar(e.message || 'Não foi possível listar os layouts.', 'error');
    }
  }

  filtrar() {
    const t = this.termo.trim().toLowerCase();
    this.layoutsFiltrados = this.layouts.filter(l =>
      (this.situacao === 'TODOS' || (this.situacao === 'ATIVOS') === l.ativo) &&
      (!t || l.nome.toLowerCase().includes(t) || (l.descricao || '').toLowerCase().includes(t)));
  }

  async alternarAtivo(layout: LayoutEscala) {
    const inativar = layout.ativo;
    if (inativar) {
      const sim = await this.dialogo.confirmar({
        titulo: 'Inativar layout',
        mensagem: `"${layout.nome}" deixa de aparecer ao montar uma escala. As escalas que já usam esse layout continuam como estão. Você pode ativá-lo de novo quando quiser.`,
        confirmar: 'Inativar'
      });
      if (!sim) return;
    }
    try {
      await this.service.salvar({ ...layout, ativo: !inativar });
      await this.carregar();
    } catch (e: any) {
      this.dialogo.avisar(e.message || 'Não foi possível alterar a situação do layout.', 'error');
    }
  }

  numVagas(layout: LayoutEscala): number {
    return vagasDoLayout(layout.colunas).length;
  }

  resumoVagas(layout: LayoutEscala): string {
    const vagas = vagasDoLayout(layout.colunas);
    if (!vagas.length) return 'Nenhuma vaga definida';
    return vagas.map(v => v.rotulo || v.funcao).join(', ');
  }

  temCabecalho(layout: LayoutEscala): boolean {
    return (layout.colunas || []).some(c => c.escopo === 'DOCUMENTO');
  }

  async duplicar(layout: LayoutEscala) {
    try {
      const copia = await this.service.salvar({
        nome: `${layout.nome} (Cópia)`,
        descricao: layout.descricao ?? null,
        tipo: layout.tipo,
        sistema: false,
        ativo: true,
        padrao: false,
        colunas: layout.colunas.map((c, i) => ({
          ...c,
          idLocal: 'copia-' + Date.now() + '-' + i
        }))
      });
      await this.dialogo.avisar('Layout duplicado com sucesso!', 'success');
      await this.carregar();
      this.router.navigate(['/escalas/layouts', copia.id]);
    } catch (e: any) {
      this.dialogo.avisar(e.message || 'Erro ao duplicar layout.', 'error');
    }
  }

  async excluir(layout: LayoutEscala) {
    if (layout.sistema) {
      this.dialogo.avisar('Não é possível excluir um layout padrão do sistema.', 'error');
      return;
    }
    const sim = await this.dialogo.confirmar({
      titulo: 'Excluir layout',
      mensagem: `Tem certeza que deseja excluir o layout "${layout.nome}"?`,
      confirmar: 'Excluir',
      perigo: true
    });
    if (!sim) return;

    try {
      await this.service.excluir(layout.id);
      this.dialogo.avisar('Layout excluído com sucesso.', 'success');
      await this.carregar();
    } catch (e: any) {
      this.dialogo.avisar(e.message || 'Não foi possível excluir o layout.', 'error');
    }
  }
}
