import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CabecalhoPaginaComponent } from '../../../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { BarraFiltrosComponent } from '../../../../shared/components/barra-filtros/barra-filtros.component';
import { LayoutsEscalaService } from '../../services/layouts-escala.service';
import { LayoutEscala } from '../../models/escala.model';
import { DialogoService } from '../../../../shared/services/dialogo.service';
import { EstadoListaComponent } from '../../../../shared/components/estado-lista/estado-lista.component';

@Component({
  selector: 'app-layouts-list',
  standalone: true,
  imports: [CommonModule, RouterLink, CabecalhoPaginaComponent, BarraFiltrosComponent, EstadoListaComponent],
  template: `
    <div class="space-y-6">
      <app-cabecalho-pagina titulo="Layouts de Escala" subtitulo="A estrutura de colunas das escalas semanal e mensal.">
        <a acoes routerLink="novo" class="btn-primary">＋ Novo layout</a>
      </app-cabecalho-pagina>

      <app-barra-filtros placeholder="Buscar por nome" [termo]="termo" (termoChange)="termo = $event; filtrar()" (buscar)="filtrar()">
      </app-barra-filtros>

      <div class="tabela-rolagem">
        <table class="tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tipo</th>
              <th class="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            @for (layout of layoutsFiltrados; track layout.id) {
              <tr>
                <td class="font-extrabold">
                  {{ layout.nome }}
                  @if (layout.sistema) {
                    <span class="ml-2 rounded bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">Sistema</span>
                  }
                </td>
                <td>{{ layout.tipo === 'SEMANAL' ? 'Semanal' : 'Mensal' }}</td>
                <td class="text-right">
                  <a [routerLink]="[layout.id]" class="text-sm font-bold text-brand-blue hover:underline mr-3">Editar</a>
                  <button type="button" class="text-sm font-bold text-red-600 hover:underline" (click)="excluir(layout)">Excluir</button>
                </td>
              </tr>
            } @empty {
              <tr>
                <td colspan="3" class="p-0 border-0">
                  <app-estado-lista
                    [vazio]="true"
                    mensagemVazio="Não há layouts de escala cadastrados no momento.">
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

  layouts: LayoutEscala[] = [];
  layoutsFiltrados: LayoutEscala[] = [];
  termo = '';

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
    if (!this.termo.trim()) {
      this.layoutsFiltrados = this.layouts;
      return;
    }
    const t = this.termo.toLowerCase();
    this.layoutsFiltrados = this.layouts.filter(l => l.nome.toLowerCase().includes(t));
  }

  async excluir(layout: LayoutEscala) {
    if (layout.sistema) {
      this.dialogo.avisar('Não é possível excluir um layout de sistema.', 'error');
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
