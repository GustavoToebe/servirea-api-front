import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BarraFiltrosComponent, FiltroAtivo } from '../../../shared/components/barra-filtros/barra-filtros.component';
import { Layout, TIPO_ENVIO_LABEL, TIPO_LAYOUT_LABEL, TipoEnvio, TipoLayout } from '../comunicacao.models';
import { LayoutsApiService } from '../layouts-api.service';
import { DialogoService } from '../../../shared/services/dialogo.service';
import { CabecalhoPaginaComponent } from '../../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { EstadoListaComponent } from '../../../shared/components/estado-lista/estado-lista.component';

@Component({
  selector: 'app-layouts-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, BarraFiltrosComponent, CabecalhoPaginaComponent, EstadoListaComponent],
  template: `
    <div class="space-y-6">
      <app-cabecalho-pagina titulo="Layouts" [exportacao]="dadosExportacao" [exportacaoOcupada]="carregando" subtitulo="Modelos de e-mail e WhatsApp com tags trocadas pelos dados de cada pessoa.">
        <a acoes routerLink="/layouts/novo" class="btn-primary">＋ Novo layout</a>
      </app-cabecalho-pagina>

      @if (error) {
        <div class="rounded-xl bg-red-50 p-4 text-red-700">{{ error }}</div>
      }

      <app-barra-filtros
        placeholder="Buscar por nome"
        [(termo)]="nome"
        (buscar)="load()"
        [filtrosAtivos]="filtrosAtivos"
        (removerFiltro)="removerFiltro($event)"
        (removerTodos)="removerTodos()">
        <div class="flex flex-col gap-1">
          <label class="label">Tipo layout</label>
          <select class="field" [(ngModel)]="tipoLayout" (ngModelChange)="load()">
            <option value="">Todos</option>
            @for (entry of tipoLayoutEntries; track entry.key) {
              <option [value]="entry.key">{{ entry.label }}</option>
            }
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <label class="label">Tipo de envio</label>
          <select class="field" [(ngModel)]="tipoEnvio" (ngModelChange)="load()">
            <option value="">Todos</option>
            <option value="EMAIL">E-mail</option>
            <option value="WHATSAPP">WhatsApp</option>
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <label class="label">Status</label>
          <select class="field" [(ngModel)]="ativo" (ngModelChange)="load()">
            <option [ngValue]="true">Ativo</option>
            <option [ngValue]="false">Inativo</option>
            <option [ngValue]="null">Todos</option>
          </select>
        </div>
      </app-barra-filtros>

      <div class="tabela-rolagem">
        <table class="tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tipo layout</th>
              <th>Tipo de envio</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            @for (layout of layouts; track layout.id) {
              <tr class="clicavel" tabindex="0" (click)="abrir(layout.id)" (keydown.enter)="abrir(layout.id)" [attr.data-layout]="layout.id">
                <td>{{ layout.nome }}</td>
                <td>{{ tipoLayoutLabel(layout.tipoLayout) }}</td>
                <td>
                  {{ layout.tipoEnvio === 'EMAIL' ? '✉' : '💬' }}
                  {{ tipoEnvioLabel(layout.tipoEnvio) }}
                </td>
                <td>
                  @if (layout.ativo) {
                    <span class="badge bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold">Ativo</span>
                  } @else {
                    <span class="badge bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold">Inativo</span>
                  }
                </td>
                <td (click)="$event.stopPropagation()">
                  <div class="flex gap-2">
                    <a [routerLink]="['/layouts', layout.id]" class="btn-secondary !px-3 !py-1 text-xs font-bold">Editar</a>
                    <button type="button" class="btn-danger !px-3 !py-1 text-xs font-bold cursor-pointer" (click)="excluir(layout)">🗑 Excluir</button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
        <app-estado-lista [carregando]="carregando" [vazio]="!carregando && !layouts.length" />
      </div>
    </div>
  `
})
export class LayoutsListComponent implements OnInit {
  readonly dadosExportacao = () => ({ nome: 'layouts-comunicacao', titulo: 'Servirea · Layouts de comunicação', colunas: ['Nome', 'Tipo', 'Canal', 'Situação'], linhas: this.layouts.map(l => [l.nome, l.tipoLayout, l.tipoEnvio, l.ativo ? 'Ativo' : 'Inativo']) });
  layouts: Layout[] = [];
  nome = '';
  tipoLayout: TipoLayout | '' = '';
  tipoEnvio: TipoEnvio | '' = '';
  ativo: boolean | null = true;
  error = '';
  carregando = true;

  tipoLayoutEntries = Object.entries(TIPO_LAYOUT_LABEL).map(([key, label]) => ({ key: key as TipoLayout, label }));

  get filtrosAtivos(): FiltroAtivo[] {
    const f: FiltroAtivo[] = [];
    if (this.tipoLayout) f.push({ chave: 'tipoLayout', rotulo: 'Tipo: ' + TIPO_LAYOUT_LABEL[this.tipoLayout] });
    if (this.tipoEnvio) f.push({ chave: 'tipoEnvio', rotulo: 'Envio: ' + TIPO_ENVIO_LABEL[this.tipoEnvio] });
    if (this.ativo !== null) f.push({ chave: 'ativo', rotulo: this.ativo ? 'Ativo' : 'Inativo' });
    return f;
  }

  constructor(
    private api: LayoutsApiService,
    private dialogo: DialogoService,
    private router: Router
  ) {}

  async ngOnInit() {
    await this.load();
  }

  async load() {
    this.carregando = true;
    try {
      this.layouts = await this.api.listar(this.tipoLayout || undefined, this.tipoEnvio || undefined, this.ativo ?? undefined, this.nome);
      this.error = '';
    } catch (e: any) {
      this.error = e.message;
    } finally {
      this.carregando = false;
    }
  }

  abrir(id: string) {
    void this.router.navigate(['/layouts', id]);
  }

  async excluir(layout: Layout) {
    const ok = await this.dialogo.confirmar({
      titulo: 'Excluir layout',
      mensagem: `Deseja excluir o layout "${layout.nome}"? Esta ação não pode ser desfeita.`,
      confirmar: 'Excluir',
      perigo: true
    });
    if (!ok) return;
    try {
      await this.api.excluir(layout.id);
      await this.load();
    } catch (e: any) {
      this.error = e.message;
    }
  }

  removerFiltro(chave: string) {
    if (chave === 'tipoLayout') this.tipoLayout = '';
    if (chave === 'tipoEnvio') this.tipoEnvio = '';
    if (chave === 'ativo') this.ativo = null;
    this.load();
  }

  removerTodos() {
    this.tipoLayout = '';
    this.tipoEnvio = '';
    this.ativo = null;
    this.nome = '';
    this.load();
  }

  tipoLayoutLabel(tipo: TipoLayout): string {
    return TIPO_LAYOUT_LABEL[tipo] ?? tipo;
  }

  tipoEnvioLabel(tipo: TipoEnvio): string {
    return TIPO_ENVIO_LABEL[tipo] ?? tipo;
  }
}
