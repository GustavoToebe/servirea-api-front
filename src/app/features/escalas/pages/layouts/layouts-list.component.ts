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
    <app-cabecalho-pagina titulo="Layouts de Escala">
      <a routerLink="novo" class="btn btn-primary">
        <i class="ph ph-plus"></i>
        Novo Layout
      </a>
    </app-cabecalho-pagina>

    <div class="card p-0">
      <app-barra-filtros>
        <div class="row g-3">
          <div class="col-md-4">
            <input type="text" class="form-control" placeholder="Buscar por nome..." (input)="onBusca($event)">
          </div>
        </div>
      </app-barra-filtros>

      <div class="tabela-rolagem">
        <table class="tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tipo</th>
              <th class="col-acoes">Ações</th>
            </tr>
          </thead>
          <tbody>
            @for (layout of layoutsFiltrados; track layout.id) {
              <tr>
                <td>{{ layout.nome }}
                  @if (layout.sistema) {
                    <span class="badge text-bg-secondary ms-2">Sistema</span>
                  }
                </td>
                <td>{{ layout.tipo }}</td>
                <td class="col-acoes">
                  <a [routerLink]="[layout.id]" class="btn-icone" title="Editar">
                    <i class="ph ph-pencil-simple"></i>
                  </a>
                  <button type="button" class="btn-icone text-danger" title="Excluir" (click)="excluir(layout)">
                    <i class="ph ph-trash"></i>
                  </button>
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
      this.dialogo.avisar(e.message, 'error');
    }
  }

  onBusca(event: Event) {
    this.termo = (event.target as HTMLInputElement).value;
    this.filtrar();
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
    const sim = await this.dialogo.confirmar({ titulo: 'Excluir layout', mensagem: `Tem certeza que deseja excluir o layout "${layout.nome}"?`, confirmar: 'Excluir', perigo: true });
    if (!sim) return;

    try {
      await this.service.excluir(layout.id);
      this.dialogo.avisar('Layout excluído com sucesso.', 'success');
      await this.carregar();
    } catch (e: any) {
      this.dialogo.avisar(e.message, 'error');
    }
  }
}
