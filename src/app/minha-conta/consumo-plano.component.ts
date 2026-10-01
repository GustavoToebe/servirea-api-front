import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { mensagemApi } from '../core/api/api-error';
import { ConsumoPlano, MinhaContaService } from './minha-conta.service';

@Component({
  selector: 'app-consumo-plano', changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="card space-y-3 p-5" aria-labelledby="consumo-titulo">
      <h3 id="consumo-titulo" class="secao-titulo">Consumo do plano</h3>
      <p class="text-sm text-slate-500">Pessoas incluem responsáveis e voluntários, mesmo inativos. Usuários incluem acessos ativos e convites pendentes. Uma pessoa com dois papéis conta uma vez no total.</p>
      @if (erro()) { <div class="text-sm text-red-700" role="alert">{{ erro() }}</div> }
      @if (dados(); as d) {
        @for (item of d.itens; track item.codigo) {
          <div class="border-b border-[var(--line)] py-3 last:border-0">
            <div class="flex flex-wrap justify-between gap-2"><span class="font-semibold">{{ item.nome }}</span><span>{{ item.usado }} / {{ item.limite === null ? 'Sem limite configurado' : item.limite }}</span></div>
            @if (item.estado === 'EXCEDIDO' || item.estado === 'ATINGIDO') {
              <p class="mt-1 text-sm text-red-700 dark:text-red-300">{{ item.estado === 'EXCEDIDO' ? 'Acima do limite atual. Os dados existentes continuam disponíveis.' : 'Limite atingido.' }} Ajuste o plano para ampliar.</p>
            } @else if (item.estado === 'ATENCAO') { <p class="mt-1 text-sm text-amber-700 dark:text-amber-300">Perto do limite: {{ item.disponivel }} disponíveis.</p> }
          </div>
        }
        <p class="text-xs text-slate-500">Fotos, documentos e envios ainda não têm cotas aplicadas nesta versão.</p>
      } @else if (carregando()) { <p class="text-sm text-slate-500">Consultando consumo...</p> }
      <button type="button" class="btn-secondary" [disabled]="carregando()" (click)="buscar()">Atualizar consumo</button>
    </section>
  `
})
export class ConsumoPlanoComponent implements OnInit, OnDestroy {
  private api = inject(MinhaContaService); private carga?: Subscription;
  dados = signal<ConsumoPlano | null>(null); erro = signal(''); carregando = signal(false);
  ngOnInit(): void {this.buscar();}
  buscar(): void {
    this.carga?.unsubscribe(); this.erro.set(''); this.carregando.set(true);
    this.carga = this.api.consumo().subscribe({next: d => {this.dados.set(d); this.carregando.set(false);},
      error: e => {this.dados.set(null); this.erro.set(mensagemApi(e, 'Não foi possível consultar o consumo.')); this.carregando.set(false);}});
  }
  ngOnDestroy(): void {this.carga?.unsubscribe();}
}
