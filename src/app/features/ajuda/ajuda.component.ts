import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TEMAS } from './ajuda-temas';
import { podeVer } from '../../core/layout/menu';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { SessaoAtual } from '../../core/layout/sessao-atual';
import { CabecalhoPaginaComponent } from '../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { BarraFiltrosComponent } from '../../shared/components/barra-filtros/barra-filtros.component';

const normalizar=(texto:string) => texto.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

@Component({
  selector:'app-ajuda',
  imports:[RouterLink,CabecalhoPaginaComponent,BarraFiltrosComponent],
  changeDetection:ChangeDetectionStrategy.OnPush,
  template:`
    <div class="space-y-6">
      <app-cabecalho-pagina titulo="Ajuda" subtitulo="Orientações rápidas para as rotinas da paróquia." />
      <app-barra-filtros placeholder="Buscar uma orientação" [termo]="busca()" (termoChange)="busca.set($event)" [temFiltros]="false" />
      <p class="text-sm text-[var(--muted)]" role="status">{{temas().length}} orientações encontradas</p>
      @if(busca()){<button type="button" class="btn-secondary" (click)="busca.set('')">Limpar busca</button>}
      @for(tema of temas();track tema.id) {
        <details class="card p-5" [open]="tema.id===temaInicial()" [attr.data-tema]="tema.id">
          <summary class="cursor-pointer text-lg font-bold text-[var(--ink)]">{{ tema.titulo }}</summary>
          <ol class="mt-4 list-decimal space-y-3 pl-5 text-sm text-[var(--muted)]">
            @for(passo of tema.passos;track $index){<li>{{ passo }}</li>}
          </ol>
          @if(tema.url){<a class="btn-secondary mt-4 inline-flex" [routerLink]="tema.url" [attr.aria-label]="'Abrir módulo: '+tema.titulo">Abrir módulo</a>}
        </details>
      } @empty {<p class="card p-6 text-[var(--muted)]">Nenhuma orientação encontrada para esta busca.</p>}
    </div>
  `
})
export class AjudaComponent {
  private readonly sessao=inject(SessaoAtual);
  private readonly route=inject(ActivatedRoute);
  private readonly parametros=toSignal(this.route.queryParamMap,{initialValue:this.route.snapshot.queryParamMap});
  readonly temaInicial=computed(()=>this.parametros().get('tema'));
  readonly busca=signal('');
  readonly temas=computed(() => {
    const termo=normalizar(this.busca().trim());
    return TEMAS.filter(t => podeVer(this.sessao.permissoes(),t.permissao) &&
      (!termo || normalizar(t.titulo+' '+t.passos.join(' ')).includes(termo)));
  });
}
