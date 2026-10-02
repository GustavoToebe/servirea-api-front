import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { Subscription } from 'rxjs';
import { DatePipe, DecimalPipe } from '@angular/common';
import { SessaoAtual } from '../core/layout/sessao-atual';
import { mensagemApi } from '../core/api/api-error';
import { ConsumoPlano, MinhaContaService } from './minha-conta.service';

@Component({
  selector: 'app-consumo-plano', changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe,DatePipe],
  template: `
    <section class="card space-y-3 p-5" aria-labelledby="consumo-titulo">
      <h3 id="consumo-titulo" class="secao-titulo">Consumo do plano</h3>
      <p class="text-sm text-slate-500">Pessoas incluem responsáveis e voluntários, mesmo inativos. Usuários incluem acessos ativos e convites pendentes. Uma pessoa com dois papéis conta uma vez no total.</p>
      @if (erro()) { <div class="text-sm text-red-700" role="alert">{{ erro() }}</div> }
      @if (dados(); as d) {
        @for (item of d.itens; track item.codigo) {
          <div class="border-b border-[var(--line)] py-3 last:border-0">
            <div class="flex flex-wrap justify-between gap-2"><span class="font-semibold">{{ item.nome }}</span>
              @if (item.unidade === 'bytes') { <span>{{ item.usado / 1048576 | number:'1.0-2' }} MB conhecidos / {{ item.limite === null ? 'Sem limite configurado' : ((item.limite / 1048576 | number:'1.0-2') + ' MB') }}</span> }
              @else { <span>{{ item.usado }} / {{ item.limite === null ? 'Sem limite configurado' : item.limite }}</span> }
            </div>
            @if (item.competencia) { <p class="text-xs text-slate-500">Competência {{ item.competencia }} (horário de Brasília). @if (item.codigo === 'importacoes_mes') { Cada lote CSV confirmado conta uma vez, até 100 pessoas; prévias e repetição da confirmação não gastam outra unidade. } @else { Cada mensagem conta na primeira tentativa; reenvios da mesma mensagem não contam novamente. }</p> }
            @if (item.estado === 'INVENTARIO_PENDENTE') {
              <p class="mt-1 text-sm text-amber-700 dark:text-amber-300">{{ item.pendentes }} foto(s) antigas sem tamanho confirmado. O consumo é parcial; planos com cota exigem conferir antes de novos uploads.</p>
              @if (sessao.permissoes().includes('PAROQUIA_ALTERAR')) { <button type="button" class="btn-secondary mt-2" [disabled]="conferindo()" (click)="conferir()">{{ conferindo() ? 'Conferindo...' : 'Conferir fotos antigas' }}</button> }
            } @else if (item.estado === 'EXCEDIDO' || item.estado === 'ATINGIDO') {
              <p class="mt-1 text-sm text-red-700 dark:text-red-300">{{ item.estado === 'EXCEDIDO' ? 'Acima do limite atual. Os dados existentes continuam disponíveis.' : 'Limite atingido.' }} Ajuste o plano para ampliar.</p>
            } @else if (item.estado === 'ATENCAO') { <p class="mt-1 text-sm text-amber-700 dark:text-amber-300">Perto do limite: @if (item.unidade === 'bytes') { {{ (item.disponivel ?? 0) / 1048576 | number:'1.0-2' }} MB disponíveis. } @else { {{ item.disponivel }} disponíveis. }</p> }
          </div>
        }
        <p class="text-xs text-slate-500">Armazenamento inclui fotos vinculadas e anexos ainda retidos nos comunicados. Fotos compartilhadas contam uma vez. MB = 1.048.576 bytes; não representa toda a ocupação do provedor. Cotas mensais incluem mensagens da fila, confirmações e lembretes de eventos; ao atingir o teto, novos envios aguardam disponibilidade. Falhas também consomem a unidade reservada. E-mails de acesso e recuperação e teste técnico do WhatsApp ficam fora. Importação CSV de pessoas tem cota de lotes mensais. XLSX e importação de documentos gerais ainda não aplicadas.</p>
      } @else if (carregando()) { <p class="text-sm text-slate-500">Consultando consumo...</p> }
      <button type="button" class="btn-secondary" [disabled]="carregando()" (click)="buscar()">Atualizar consumo</button>
      <button type="button" class="btn-secondary" [disabled]="carregandoHistorico()" (click)="buscarHistorico()">Ver histórico de 90 dias</button><p class="text-xs text-slate-500">Última consulta bem-sucedida de cada dia. Dias sem consulta não representam consumo zero. Limites e competências são os da data observada.</p>
      @if(erroHistorico()){<p role="alert" class="text-red-700">{{erroHistorico()}}</p>}
      @for(p of historico();track p.dia){<details class="border-b py-2"><summary>{{p.dia | date:'dd/MM/yyyy':'UTC'}} · {{p.consumo.planoNome||'Plano não informado'}}</summary>@for(i of p.consumo.itens;track i.codigo){<p>{{i.nome}}: {{i.unidade==='bytes'?(i.usado/1048576|number:'1.0-2'):i.usado}} {{i.unidade==='bytes'?'MB':'unidades'}} · {{i.estado}} @if(i.competencia){ · {{i.competencia}}}</p>}</details>}
      @if(historicoConsultado()&&!historico().length&&!erroHistorico()){<p>Nenhuma consulta registrada neste período.</p>}
      @if (aviso()) { <p class="text-sm text-amber-700" role="status">{{ aviso() }}</p> }
    </section>
  `
})
export class ConsumoPlanoComponent implements OnInit, OnDestroy {
  readonly sessao=inject(SessaoAtual);
  private api = inject(MinhaContaService); private carga?: Subscription;
  dados = signal<ConsumoPlano | null>(null); erro = signal(''); carregando = signal(false);
  conferindo = signal(false); aviso=signal(''); private conferencia?:Subscription; private inicioConferencia=0;
  readonly historico=signal<{dia:string;consumo:ConsumoPlano}[]>([]);readonly erroHistorico=signal('');readonly carregandoHistorico=signal(false);readonly historicoConsultado=signal(false);private historicoCarga?:Subscription;
  buscarHistorico(){this.historicoCarga?.unsubscribe();this.erroHistorico.set('');this.carregandoHistorico.set(true);this.historicoCarga=this.api.historicoConsumo().subscribe({next:r=>{this.historico.set(r);this.carregandoHistorico.set(false);this.historicoConsultado.set(true);},error:e=>{this.historico.set([]);this.carregandoHistorico.set(false);this.erroHistorico.set(mensagemApi(e,'Histórico indisponível.'));}});}
  ngOnInit(): void {this.buscar();}
  buscar(): void {
    this.carga?.unsubscribe(); this.erro.set(''); this.carregando.set(true);
    this.carga = this.api.consumo().subscribe({next: d => {this.dados.set(d); this.carregando.set(false);},
      error: e => {this.dados.set(null); this.erro.set(mensagemApi(e, 'Não foi possível consultar o consumo.')); this.carregando.set(false);}});
  }
  conferir(): void {
    if (this.conferindo() || !this.sessao.permissoes().includes('PAROQUIA_ALTERAR')) return;
    this.conferindo.set(true); this.aviso.set('');
    this.conferencia=this.api.conferirArmazenamento(this.inicioConferencia).subscribe({next:r => {
      this.inicioConferencia=r.proximoInicio ?? 0; this.conferindo.set(false); this.aviso.set(`${r.conferidos} conferidas; ${r.falhas} falhas; ${r.pendentes} pendentes. Cada conferência verifica até 5 fotos. Se houver falhas, confira a configuração do Storage.`); this.buscar();
    }, error:e => {this.conferindo.set(false);this.erro.set(mensagemApi(e,'Não foi possível conferir as fotos antigas.'));}});
  }
  ngOnDestroy(): void {this.carga?.unsubscribe();this.conferencia?.unsubscribe();this.historicoCarga?.unsubscribe();}
}
