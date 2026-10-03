import { NumeroComponent } from '../../../shared/components/numero/numero.component';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { mensagemApi } from '../../../core/api/api-error';
import { AcessoApiService } from '../acesso-api.service';
import { Perfil, SecaoCatalogo } from '../acesso.models';
import { CabecalhoPaginaComponent } from '../../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { BarraFiltrosComponent } from '../../../shared/components/barra-filtros/barra-filtros.component';
import { EstadoListaComponent } from '../../../shared/components/estado-lista/estado-lista.component';
import { RodapeFormComponent } from '../../../shared/components/rodape-form/rodape-form.component';

@Component({
  selector: 'app-perfis',
  imports: [FormsModule, NumeroComponent, CabecalhoPaginaComponent, BarraFiltrosComponent, EstadoListaComponent, RodapeFormComponent],
  template: `
    <div class="space-y-6">
      <app-cabecalho-pagina titulo="Perfis" [exportacao]="dadosExportacao" [exportacaoOcupada]="carregando" subtitulo="O que cada pessoa pode ver e fazer nesta paróquia.">
        <button acoes type="button" class="btn-primary" (click)="novo()">＋ Novo perfil</button>
      </app-cabecalho-pagina>

      @if (erro) {
        <div class="rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ erro }}</div>
      }

      <app-barra-filtros placeholder="Buscar perfil" [termo]="busca" (termoChange)="filtrar($event)" [temFiltros]="false" (buscar)="filtrar(busca)" />

      <div class="tabela-rolagem">
        <table class="tabela">
          <thead><tr><th>Nome</th><th>Usuários</th><th>Situação</th></tr></thead>
          <tbody>
            @for (perfil of visiveis; track perfil.id) {
              <tr class="clicavel" tabindex="0" (click)="editar(perfil)" (keydown.enter)="editar(perfil)" [attr.data-perfil]="perfil.id">
                <td class="font-extrabold">{{ perfil.nome }}</td>
                <td>{{ perfil.usuarios }} {{ perfil.usuarios === 1 ? 'usuário' : 'usuários' }}</td>
                <td class="text-xs font-bold uppercase tracking-wide text-slate-500">{{ perfil.acessoTotal ? 'Acesso total' : (perfil.ativo ? 'Ativo' : 'Inativo') }}</td>
              </tr>
            }
          </tbody>
        </table>
        <app-estado-lista [carregando]="carregando" [vazio]="!carregando && !visiveis.length" />
      </div>

      @if (form) {
        <form class="card secao-form p-6" (ngSubmit)="salvar()">
          <h2 class="secao-titulo">{{ form.id ? 'Editar perfil' : 'Novo perfil' }}<app-numero [numero]="form.sequencial" /></h2>
          <label class="block text-sm font-semibold">Nome
            <input class="field mt-1" name="nome" [(ngModel)]="form.nome" required>
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
          <app-rodape-form [carregando]="salvando" (cancelar)="form = null">
            @if (form.id) {
              <button class="btn-secondary" type="button" (click)="duplicar()">Duplicar</button>
            }
          </app-rodape-form>
        </form>
      }
    </div>
  `
})
export class PerfisComponent implements OnInit {
  readonly dadosExportacao = () => ({ nome: 'perfis', titulo: 'Servirea · Perfis', colunas: ['Nome', 'Situação', 'Acesso total', 'Usuários'], linhas: this.visiveis.map(p => [p.nome, p.ativo ? 'Ativo' : 'Inativo', p.acessoTotal ? 'Sim' : 'Não', p.usuarios]) });
  private api = inject(AcessoApiService);

  perfis: Perfil[] = [];
  /** Lista filtrada pela busca local (recalculada só quando a busca ou os dados mudam). */
  visiveis: Perfil[] = [];
  busca = '';
  carregando = true;
  catalogo: SecaoCatalogo[] = [];
  erro = '';
  salvando = false;
  form: { id?: string; nome: string; ativo: boolean; acessoTotal: boolean; sistema: boolean; permissoes: string[]; sequencial?: number } | null = null;

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
      sequencial: perfil.sequencial,
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

  filtrar(termo: string): void {
    this.busca = termo;
    const t = termo.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
    this.visiveis = !t ? this.perfis : this.perfis.filter(p =>
      p.nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().includes(t));
  }

  private carregar(): void {
    this.carregando = true;
    this.api.perfis().subscribe({
      next: lista => { this.perfis = lista; this.filtrar(this.busca); this.carregando = false; },
      error: erro => { this.erro = mensagemApi(erro, 'Não foi possível carregar os perfis.'); this.carregando = false; }
    });
  }
}
