import {BarraFiltrosComponent} from '../../shared/components/barra-filtros/barra-filtros.component';
import {Component,ChangeDetectionStrategy,OnInit,OnDestroy,inject,signal} from '@angular/core';
import {Subscription} from 'rxjs';import {PastoraisApiService,Equipe,Membro} from './pastorais-api.service';
import {SessaoAtual} from '../../core/layout/sessao-atual';import {mensagemApi} from '../../core/api/api-error';import {DialogoService} from '../../shared/services/dialogo.service';
import {CabecalhoPaginaComponent} from '../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
@Component({selector:'app-coordenacao',imports:[BarraFiltrosComponent,CabecalhoPaginaComponent],changeDetection:ChangeDetectionStrategy.OnPush,template:`
<div class="space-y-5"><app-cabecalho-pagina titulo="Minhas pastorais" subtitulo="Equipes em que você está vinculado como coordenador ativo." />
@if(erro()){<p role="alert" class="text-red-700">{{erro()}}</p>}
<app-barra-filtros [semBusca]="true" [temFiltros]="false" (buscar)="carregar()" /><div class="card tabela-rolagem"><table class="tabela"><thead><tr><th>Pastoral/equipe</th></tr></thead><tbody>@for(e of equipes();track e.id){<tr class="clicavel" tabindex="0" (click)="abrir(e)" (keydown.enter)="abrir(e)"><td>{{e.nome}}</td></tr>}</tbody></table>
@if(!equipes().length){<p>Nenhuma equipe nesta página. O vínculo de coordenação é cadastrado pela paróquia.</p>}
<div class="flex gap-3"><button class="btn-secondary" [disabled]="pagina===0||ocupado()" (click)="paginar(-1)">Anterior</button><button class="btn-secondary" [disabled]="equipes().length<30||ocupado()" (click)="paginar(1)">Próxima</button></div></div>
@if(equipe();as e){<section class="card p-4"><h2>{{e.nome}}</h2><p>Cadastro e nomeação de coordenadores ficam com a administração da paróquia.</p><div class="tabela-rolagem"><table class="tabela"><thead><tr><th>Participante</th><th>Papel</th><th>Situação</th><th>Ação</th></tr></thead><tbody>
@for(m of membros();track m.id){<tr><td>{{m.nome}}</td><td>{{m.papel==='COORDENADOR'?'Coordenador':'Membro'}}</td><td><span class="badge" [class]="m.ativo?'bg-emerald-50 text-emerald-700':'bg-slate-100 text-slate-600'">{{m.ativo?'Ativo':'Inativo'}}</span></td><td>@if(podeGerenciar()&&m.papel!=='COORDENADOR'){<button class="btn-secondary" [disabled]="ocupado()" (click)="alterar(m)">{{m.ativo?'Inativar':'Reativar'}}</button>}</td></tr>}</tbody></table></div>
<div class="flex gap-3"><button class="btn-secondary" [disabled]="paginaMembros===0||ocupado()" (click)="paginarMembros(-1)">Anterior</button><button class="btn-secondary" [disabled]="(paginaMembros+1)*30>=total()||ocupado()" (click)="paginarMembros(1)">Próxima</button></div></section>}
</div>`})
export class CoordenacaoComponent implements OnInit,OnDestroy {
 private api=inject(PastoraisApiService);private sessao=inject(SessaoAtual);private dialogo=inject(DialogoService);private lista?:Subscription;private leitura?:Subscription;private escrita?:Subscription;private destruido=false;
 readonly equipes=signal<Equipe[]>([]);readonly equipe=signal<Equipe|null>(null);readonly membros=signal<Membro[]>([]);readonly total=signal(0);readonly erro=signal('');readonly ocupado=signal(false);pagina=0;paginaMembros=0;
 ngOnInit(){this.carregar();}podeGerenciar(){return this.sessao.permissoes().includes('PASTORAL_COORDENACAO_GERENCIAR');}
 carregar(){if(this.ocupado())return;this.lista?.unsubscribe();this.leitura?.unsubscribe();this.equipe.set(null);this.equipes.set([]);this.membros.set([]);this.erro.set('');this.lista=this.api.minhasEquipes(this.pagina).subscribe({next:p=>this.equipes.set(p),error:e=>this.erro.set(mensagemApi(e,'Não foi possível consultar suas equipes.'))});}
 paginar(d:number){if(this.ocupado())return;this.pagina+=d;this.carregar();}
 abrir(e:Equipe){if(this.ocupado())return;this.equipe.set(e);this.paginaMembros=0;this.carregarMembros();}
 carregarMembros(){const e=this.equipe();if(!e)return;this.leitura?.unsubscribe();this.membros.set([]);this.total.set(0);this.leitura=this.api.membrosProprios(e.id,this.paginaMembros).subscribe({next:p=>{this.membros.set(p.itens);this.total.set(p.total);},error:x=>{this.erro.set(mensagemApi(x,'Acesso indisponível. Atualize suas equipes.'));}});}
 paginarMembros(d:number){if(this.ocupado())return;this.paginaMembros+=d;this.carregarMembros();}
 async alterar(m:Membro){const e=this.equipe();if(!e||this.ocupado()||!this.podeGerenciar()||m.papel==='COORDENADOR')return;
 if(!await this.dialogo.confirmar({mensagem:`${m.ativo?'Inativar':'Reativar'} ${m.nome} nesta equipe?`,confirmar:'Salvar situação'}))return;
 if(this.destruido||this.ocupado()||this.equipe()?.id!==e.id)return;this.ocupado.set(true);this.escrita=this.api.alterarProprio(e.id,m).subscribe({next:()=>{this.ocupado.set(false);this.carregarMembros();},error:x=>{this.ocupado.set(false);this.carregarMembros();this.erro.set(mensagemApi(x,'Não foi possível alterar o participante.'));}});
 }
 ngOnDestroy(){this.destruido=true;this.lista?.unsubscribe();this.leitura?.unsubscribe();this.escrita?.unsubscribe();}
}
