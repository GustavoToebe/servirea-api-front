import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EstadoListaComponent } from '../../shared/components/estado-lista/estado-lista.component';
import { Categoria, ROTULO_TIPO, Tipo } from './financeiro.models';

interface Secao { tipo: Tipo; rotulo: string; grupos: { grupo: Categoria; contas: Categoria[]; aberto: boolean }[]; }

/**
 * Plano de contas em árvore: Saídas (débito) e Entradas (crédito), cada uma com grupos que se expandem para as contas contábeis.
 * Só apresenta e filtra; quem grava é o Financeiro (modais de grupo e de conta).
 */
@Component({
  selector: 'app-plano-contas-lista',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, EstadoListaComponent],
  template: `
    <div class="space-y-4">
      <div class="flex flex-wrap items-end gap-3">
        <div class="min-w-48 flex-1">
          <label class="label" for="busca-plano">Buscar grupo ou conta contábil</label>
          <input id="busca-plano" class="field" type="search" placeholder="Ex.: energia, doações" [ngModel]="busca()" (ngModelChange)="busca.set($event)" data-busca-plano>
        </div>
        <div>
          <label class="label" for="situacao-plano">Situação</label>
          <select id="situacao-plano" class="field" [ngModel]="situacao()" (ngModelChange)="situacao.set($event)">
            <option value="ATIVO">Somente ativos</option><option value="INATIVO">Somente inativos</option><option value="TODOS">Todos</option>
          </select>
        </div>
        <button type="button" class="btn-secondary" (click)="alternarTodos()" data-alternar-todos>{{ todosAbertos() ? 'Recolher tudo' : 'Expandir tudo' }}</button>
      </div>
      @for (secao of secoes(); track secao.tipo) {
        <section class="card tabela-rolagem" [attr.data-secao]="secao.tipo">
          <table class="tabela">
            <thead><tr><th>{{ secao.rotulo }}</th><th>Situação</th><th>Ações</th></tr></thead>
            <tbody>
              @for (g of secao.grupos; track g.grupo.id) {
                <tr class="bg-slate-50" data-grupo>
                  <td>
                    <button type="button" class="mr-2 inline-flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-slate-200"
                      [attr.aria-expanded]="g.aberto" [attr.aria-label]="(g.aberto ? 'Recolher ' : 'Expandir ') + g.grupo.nome" (click)="alternar(g.grupo.id)">{{ g.aberto ? '▾' : '▸' }}</button>
                    <strong>{{ g.grupo.nome }}</strong>
                    <small class="ml-2 text-slate-500">{{ g.contas.length }} conta(s) contábil(is)</small>
                  </td>
                  <td>{{ g.grupo.ativo ? 'Ativo' : 'Inativo' }}</td>
                  <td>
                    @if (podeConfigurar()) {
                      <div class="flex flex-wrap gap-2">
                        <button type="button" class="btn-secondary" (click)="editarGrupo.emit(g.grupo)">Editar grupo</button>
                        <button type="button" class="btn-secondary" [disabled]="!g.grupo.ativo" (click)="novaConta.emit(g.grupo)">Nova conta</button>
                      </div>
                    }
                  </td>
                </tr>
                @if (g.aberto) {
                  @for (c of g.contas; track c.id) {
                    <tr data-conta>
                      <td class="pl-12">{{ c.nome }}</td>
                      <td>{{ c.ativo ? 'Ativo' : 'Inativo' }}</td>
                      <td>@if (podeConfigurar()) { <button type="button" class="btn-secondary" (click)="editarConta.emit(c)">Editar</button> }</td>
                    </tr>
                  } @empty {
                    <tr><td class="pl-12 text-slate-500" colspan="3">Nenhuma conta contábil neste grupo{{ filtrando() ? ' com este filtro' : '' }}.</td></tr>
                  }
                }
              }
            </tbody>
          </table>
          @if (!secao.grupos.length) {
            <p class="p-4 text-center text-sm text-slate-500" data-secao-vazia>
              {{ filtrando() ? 'Nenhum grupo ou conta encontrado com este filtro.' : 'Nenhum grupo cadastrado nesta área.' }}
              @if (podeConfigurar() && !filtrando()) { <button type="button" class="btn-secondary ml-2" (click)="novoGrupo.emit(secao.tipo)">Criar o primeiro grupo</button> }
            </p>
          }
        </section>
      }
      <app-estado-lista [carregando]="carregando()" [vazio]="false" />
    </div>
  `
})
export class PlanoContasListaComponent {
  readonly categorias = input<Categoria[]>([]);
  readonly podeConfigurar = input(false);
  readonly carregando = input(false);
  readonly novoGrupo = output<Tipo>();
  readonly editarGrupo = output<Categoria>();
  readonly novaConta = output<Categoria>();
  readonly editarConta = output<Categoria>();

  readonly busca = signal('');
  readonly situacao = signal<'ATIVO' | 'INATIVO' | 'TODOS'>('ATIVO');
  private readonly abertos = signal<ReadonlySet<string>>(new Set());
  private readonly todosAbertosForcado = signal(false);

  readonly filtrando = computed(() => this.busca().trim() !== '' || this.situacao() !== 'ATIVO');
  private static normalizar(t: string) { return t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim(); }

  readonly secoes = computed<Secao[]>(() => {
    const todas = this.categorias();
    const termo = PlanoContasListaComponent.normalizar(this.busca());
    const situacao = this.situacao();
    const passaSituacao = (c: Categoria) => situacao === 'TODOS' || (situacao === 'ATIVO' ? c.ativo : !c.ativo);
    const casa = (c: Categoria) => !termo || PlanoContasListaComponent.normalizar(c.nome).includes(termo);
    const abertos = this.abertos();
    const forcado = this.todosAbertosForcado();
    return (['DESPESA', 'RECEITA'] as Tipo[]).map(tipo => ({
      tipo, rotulo: ROTULO_TIPO[tipo],
      grupos: todas.filter(g => g.ehGrupo && g.tipo === tipo).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')).flatMap(grupo => {
        const filhas = todas.filter(c => !c.ehGrupo && c.grupoId === grupo.id).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
        const contas = filhas.filter(c => passaSituacao(c) && (casa(c) || casa(grupo)));
        const grupoVisivel = passaSituacao(grupo) && casa(grupo) || contas.length > 0;
        if (!grupoVisivel) return [];
        const aberto = forcado || abertos.has(grupo.id) || (termo !== '' && contas.length > 0);
        return [{ grupo, contas, aberto }];
      })
    }));
  });
  readonly todosAbertos = computed(() => this.todosAbertosForcado());

  alternar(id: string) {
    this.todosAbertosForcado.set(false);
    const novo = new Set(this.abertos());
    if (!novo.delete(id)) novo.add(id);
    this.abertos.set(novo);
  }
  alternarTodos() {
    if (this.todosAbertosForcado()) { this.todosAbertosForcado.set(false); this.abertos.set(new Set()); }
    else this.todosAbertosForcado.set(true);
  }
}
