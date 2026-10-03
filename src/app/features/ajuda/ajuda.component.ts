import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { TEMAS, TemaAjuda } from './ajuda-temas';
import { podeVer } from '../../core/layout/menu';
import { SECOES, SecaoId } from '../../core/layout/navegacao';
import { SessaoAtual } from '../../core/layout/sessao-atual';
import { CabecalhoPaginaComponent } from '../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { BarraFiltrosComponent } from '../../shared/components/barra-filtros/barra-filtros.component';

const normalizar = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

function textoDoTema(t: TemaAjuda): string {
  return [t.titulo, t.resumo, ...t.passos, ...(t.cuidados ?? []), ...(t.perguntas ?? []).flatMap(p => [p.pergunta, p.resposta])].join(' ');
}

@Component({
  selector: 'app-ajuda',
  imports: [RouterLink, CabecalhoPaginaComponent, BarraFiltrosComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-6">
      <app-cabecalho-pagina titulo="Ajuda" subtitulo="Explicações passo a passo de cada tela. Em qualquer página, o botão Ajuda abre o assunto dela." [semAjuda]="true" />
      <app-barra-filtros placeholder="Buscar uma orientação (ex.: baixa, convite, check-in)" [termo]="busca()" (termoChange)="busca.set($event)" [temFiltros]="false" />
      <p class="text-sm text-[var(--muted)]" role="status">{{ temas().length }} orientações encontradas</p>
      @if (busca()) { <button type="button" class="btn-secondary" (click)="busca.set('')">Limpar busca</button> }
      @for (grupo of grupos(); track grupo.id) {
        <section class="space-y-3" [attr.data-secao-ajuda]="grupo.id">
          <h2 class="text-xs font-extrabold uppercase tracking-widest text-[var(--muted)]">{{ grupo.titulo }}</h2>
          @for (tema of grupo.temas; track tema.id) {
            <details class="card scroll-mt-28 p-5" [open]="tema.id === temaInicial() || !!busca()" [attr.data-tema]="tema.id" [id]="'tema-' + tema.id">
              <summary class="cursor-pointer text-lg font-bold text-[var(--ink)]">{{ tema.titulo }}</summary>
              <p class="mt-3 text-sm text-[var(--ink)]" data-resumo>{{ tema.resumo }}</p>
              <h3 class="mt-4 text-sm font-bold text-[var(--ink)]">Passo a passo</h3>
              <ol class="mt-2 list-decimal space-y-3 pl-5 text-sm text-[var(--muted)]">
                @for (passo of tema.passos; track $index) { <li>{{ passo }}</li> }
              </ol>
              @if (tema.cuidados?.length) {
                <h3 class="mt-4 text-sm font-bold text-[var(--ink)]">Cuidados</h3>
                <ul class="mt-2 list-disc space-y-2 pl-5 text-sm text-[var(--muted)]" data-cuidados>
                  @for (c of tema.cuidados; track $index) { <li>{{ c }}</li> }
                </ul>
              }
              @if (tema.perguntas?.length) {
                <h3 class="mt-4 text-sm font-bold text-[var(--ink)]">Perguntas frequentes</h3>
                <dl class="mt-2 space-y-3 text-sm" data-perguntas>
                  @for (p of tema.perguntas; track $index) {
                    <div><dt class="font-semibold text-[var(--ink)]">{{ p.pergunta }}</dt><dd class="text-[var(--muted)]">{{ p.resposta }}</dd></div>
                  }
                </dl>
              }
              <div class="mt-4 flex flex-wrap items-center gap-2">
                @if (tema.url) { <a class="btn-secondary inline-flex" [routerLink]="tema.url" [attr.aria-label]="'Abrir módulo: ' + tema.titulo">Abrir módulo</a> }
                @for (r of relacionados(tema); track r.id) {
                  <a class="text-sm font-semibold text-[var(--brand)] underline" routerLink="/ajuda" [queryParams]="{ tema: r.id }" data-relacionado>Veja também: {{ r.titulo }}</a>
                }
              </div>
            </details>
          }
        </section>
      } @empty { <p class="card p-6 text-[var(--muted)]">Nenhuma orientação encontrada para esta busca.</p> }
    </div>
  `
})
export class AjudaComponent {
  private readonly sessao = inject(SessaoAtual);
  private readonly route = inject(ActivatedRoute);
  private readonly parametros = toSignal(this.route.queryParamMap, { initialValue: this.route.snapshot.queryParamMap });
  readonly temaInicial = computed(() => this.parametros().get('tema'));
  readonly busca = signal('');
  readonly temas = computed(() => {
    const termo = normalizar(this.busca().trim());
    return TEMAS.filter(t => podeVer(this.sessao.permissoes(), t.permissao) && (!termo || normalizar(textoDoTema(t)).includes(termo)));
  });
  readonly grupos = computed(() => {
    const temas = this.temas();
    return SECOES.map(s => ({ id: s.id as SecaoId, titulo: s.titulo, temas: temas.filter(t => t.secao === s.id) })).filter(g => g.temas.length);
  });
  private readonly focarTema = effect(() => {
    const id = this.temaInicial();
    if (!id || !this.temas().some(t => t.id === id)) return;
    setTimeout(() => document.getElementById(`tema-${id}`)?.scrollIntoView({ block: 'start' }), 0);
  });

  /** Relacionados que o usuário pode ver (e que existem), no máximo três. */
  relacionados(tema: TemaAjuda): TemaAjuda[] {
    const visiveis = this.temas();
    return (tema.relacionados ?? []).map(id => visiveis.find(t => t.id === id)).filter((t): t is TemaAjuda => !!t).slice(0, 3);
  }
}
