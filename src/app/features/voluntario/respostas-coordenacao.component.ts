import { ChangeDetectionStrategy,Component,OnInit,OnDestroy,inject,signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute,RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { VoluntarioApiService,RespostaParticipacao,RespostaCoordenacao } from './voluntario-api.service';
import { SessaoAtual } from '../../core/layout/sessao-atual';
import { mensagemApi } from '../../core/api/api-error';
import { CabecalhoPaginaComponent } from '../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { BarraFiltrosComponent } from '../../shared/components/barra-filtros/barra-filtros.component';
import { EstadoListaComponent } from '../../shared/components/estado-lista/estado-lista.component';

@Component({selector:'app-respostas-coordenacao',imports:[CommonModule,FormsModule,RouterLink,CabecalhoPaginaComponent,BarraFiltrosComponent,EstadoListaComponent],changeDetection:ChangeDetectionStrategy.OnPush,template:`
 <div class="space-y-5"><app-cabecalho-pagina titulo="Respostas de participação" subtitulo="A recusa mantém a alocação até a coordenação providenciar substituição. Horários de Brasília." /><a class="btn-secondary inline-block" [routerLink]="['/escalas',id]">Voltar à escala</a>
 @if(erro()){<div class="card bg-red-50 p-4 text-red-700" role="alert">{{erro()}}</div>}
 <section class="card p-4"><app-barra-filtros [semBusca]="true" [temFiltros]="true" (buscar)="buscar()"><label class="label" for="f-resposta">Participação</label><select class="field" id="f-resposta" [(ngModel)]="filtro"><option value="">Todas</option><option value="PENDENTE">Pendente</option><option value="CONFIRMADA">Confirmada</option><option value="RECUSADA">Recusada</option></select></app-barra-filtros></section>
 <div class="card tabela-rolagem"><table class="tabela w-full"><thead><tr><th>Pessoa</th><th>Celebração</th><th>Quando</th><th>Função</th><th>Participação</th></tr></thead><tbody>@for(r of itens();track r.vagaId){<tr><td>{{r.pessoaNome}}</td><td>{{r.celebracao}}</td><td>{{r.inicio | date:'dd/MM/yyyy HH:mm'}}</td><td>{{r.funcao}}</td><td><span class="badge" [ngClass]="{'bg-emerald-50 text-emerald-700':r.resposta==='CONFIRMADA','bg-red-50 text-red-700':r.resposta==='RECUSADA','bg-amber-50 text-amber-700':r.resposta==='PENDENTE'}">{{r.resposta==='CONFIRMADA'?'Confirmada':r.resposta==='RECUSADA'?'Recusada':'Pendente'}}</span>@if(r.respondidoEm){<p class="text-xs">{{r.respondidoEm | date:'dd/MM/yyyy HH:mm'}}</p>}</td></tr>}</tbody></table></div>
 <app-estado-lista [carregando]="carregando()" [vazio]="!itens().length" mensagemVazio="Nenhuma alocação neste filtro." />
 <div class="flex items-center gap-3"><button type="button" class="btn-secondary" [disabled]="pagina===0||carregando()" (click)="paginar(-1)">Anterior</button><span>{{total()}} alocações · Página {{pagina+1}}</span><button type="button" class="btn-secondary" [disabled]="(pagina+1)*30>=total()||carregando()" (click)="paginar(1)">Próxima</button></div></div>`})
export class RespostasCoordenacaoComponent implements OnInit,OnDestroy {
 private readonly api=inject(VoluntarioApiService);private readonly sessao=inject(SessaoAtual);private readonly route=inject(ActivatedRoute);private leitura?:Subscription;
 readonly itens=signal<RespostaCoordenacao[]>([]);readonly total=signal(0);readonly carregando=signal(false);readonly erro=signal('');readonly id=this.route.snapshot.paramMap.get('id')||'';pagina=0;filtro:RespostaParticipacao|''='';
 ngOnInit(){this.carregar();}
 buscar(){this.pagina=0;this.carregar();}paginar(delta:number){this.pagina+=delta;this.carregar();}
 carregar(){this.leitura?.unsubscribe();this.itens.set([]);this.total.set(0);this.erro.set('');if(!this.sessao.permissoes().includes('VAGA_RESPOSTA_LER')){this.erro.set('Seu perfil não permite consultar respostas de participação.');return;}this.carregando.set(true);this.leitura=this.api.coordenacao(this.id,this.pagina,this.filtro).subscribe({next:p=>{this.itens.set(p.itens);this.total.set(p.total);this.carregando.set(false);},error:e=>{this.carregando.set(false);this.erro.set(mensagemApi(e,'Não foi possível carregar as respostas.'));}});}
 ngOnDestroy(){this.leitura?.unsubscribe();}
}
