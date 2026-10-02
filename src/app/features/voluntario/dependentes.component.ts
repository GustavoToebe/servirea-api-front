import {BarraFiltrosComponent} from '../../shared/components/barra-filtros/barra-filtros.component';
import {Component,ChangeDetectionStrategy,OnInit,OnDestroy,inject,signal} from '@angular/core';
import {CommonModule} from '@angular/common';import {FormsModule} from '@angular/forms';import {Subscription} from 'rxjs';
import {VoluntarioApiService,Portal,Compromisso} from './voluntario-api.service';import {SessaoAtual} from '../../core/layout/sessao-atual';
import {mensagemApi} from '../../core/api/api-error';import {DialogoService} from '../../shared/services/dialogo.service';
import {CabecalhoPaginaComponent} from '../../shared/components/cabecalho-pagina/cabecalho-pagina.component';import {CampoDataComponent} from '../../shared/components/datas/campo-data.component';
@Component({selector:'app-dependentes',imports:[BarraFiltrosComponent,CommonModule,FormsModule,CabecalhoPaginaComponent,CampoDataComponent],changeDetection:ChangeDetectionStrategy.OnPush,template:`
<div class="space-y-5"><app-cabecalho-pagina titulo="Compromissos dos dependentes" subtitulo="Somente pessoas expressamente autorizadas pela paróquia." />
@if(erro()){<p role="alert" class="text-red-700">{{erro()}}</p>}
<app-barra-filtros [semBusca]="true" [temFiltros]="false" (buscar)="carregar()" /><div class="card tabela-rolagem"><table class="tabela"><thead><tr><th>Dependente</th><th>Acesso</th></tr></thead><tbody>@for(d of dependentes();track d.pessoaId){<tr class="clicavel" tabindex="0" (click)="selecionar(d)" (keydown.enter)="selecionar(d)"><td>{{d.nome}}</td><td>{{d.podeResponder?'Consultar e responder':'Consultar'}}</td></tr>}</tbody></table>
@if(!dependentes().length){<p>Nenhum dependente autorizado nesta página. Peça a conferência do vínculo e da autorização à paróquia.</p>}
<div class="flex gap-3"><button class="btn-secondary" [disabled]="pagina===0||ocupado()" (click)="paginar(-1)">Anterior</button><button class="btn-secondary" [disabled]="dependentes().length<30||ocupado()" (click)="paginar(1)">Próxima</button></div></div>
@if(selecionado();as d){<form class="card flex flex-wrap gap-3 p-4" (ngSubmit)="consultar()"><h2>{{d.nome}}</h2><div><label class="label" for="dep-de">De</label><app-campo-data idCampo="dep-de" name="de" [(ngModel)]="de" /></div><div><label class="label" for="dep-ate">Até</label><app-campo-data idCampo="dep-ate" name="ate" [(ngModel)]="ate" /></div><button class="btn-secondary" [disabled]="ocupado()">Consultar</button></form>
@if(dados();as p){<div class="card tabela-rolagem"><table class="tabela"><thead><tr><th>Quando</th><th>Compromisso</th><th>Participação</th></tr></thead><tbody>@for(c of p.compromissos;track c.id){<tr><td>{{c.inicio|date:'dd/MM/yyyy HH:mm'}}</td><td>{{c.titulo}}</td><td>{{c.resposta||'—'}} @if(podeResponder(c)){<button type="button" class="btn-secondary" [disabled]="ocupado()" (click)="responder(c,'CONFIRMADA')">Confirmar</button><button type="button" class="btn-danger" [disabled]="ocupado()" (click)="responder(c,'RECUSADA')">Recusar</button>}</td></tr>}</tbody></table></div>@if(!p.compromissos.length){<p>Nenhum compromisso neste período.</p>}}}
</div>`})
export class DependentesComponent implements OnInit,OnDestroy {
 private api=inject(VoluntarioApiService);private sessao=inject(SessaoAtual);private dialogo=inject(DialogoService);private lista?:Subscription;private leitura?:Subscription;private escrita?:Subscription;private destruido=false;
 dependentes=signal<{pessoaId:string;nome:string;podeResponder:boolean}[]>([]);selecionado=signal<{pessoaId:string;nome:string;podeResponder:boolean}|null>(null);dados=signal<Portal|null>(null);erro=signal('');ocupado=signal(false);pagina=0;
 de=new Date().toLocaleDateString('sv-SE');ate=new Date(new Date().getFullYear(),new Date().getMonth()+2,0).toLocaleDateString('sv-SE');
 ngOnInit(){this.carregar();}
 carregar(){if(this.ocupado())return;this.lista?.unsubscribe();this.leitura?.unsubscribe();this.dependentes.set([]);this.selecionado.set(null);this.dados.set(null);this.lista=this.api.dependentes(this.pagina).subscribe({next:d=>this.dependentes.set(d),error:e=>this.erro.set(mensagemApi(e,'Não foi possível consultar dependentes.'))});}
 paginar(delta:number){if(this.ocupado())return;this.pagina+=delta;this.carregar();}
 selecionar(d:{pessoaId:string;nome:string;podeResponder:boolean}){if(this.ocupado())return;this.selecionado.set(d);this.consultar();}
 consultar(){const d=this.selecionado();if(!d)return;this.leitura?.unsubscribe();this.dados.set(null);this.erro.set('');this.leitura=this.api.consultarDependente(d.pessoaId,this.de,this.ate).subscribe({next:p=>this.dados.set(p),error:e=>this.erro.set(mensagemApi(e,'Autorização indisponível. Atualize os dependentes.'))});}
 podeResponder(c:Compromisso){return !!this.selecionado()?.podeResponder&&this.sessao.permissoes().includes('PORTAL_RESPONDER')&&!!c.vagaId&&c.versao!==null&&!!c.prazoResposta&&Date.parse(c.prazoResposta)>Date.now();}
 async responder(c:Compromisso,resposta:'CONFIRMADA'|'RECUSADA'){const d=this.selecionado();if(!d||this.ocupado()||!this.podeResponder(c))return;
 if(!await this.dialogo.confirmar({mensagem:`${resposta==='CONFIRMADA'?'Confirmar':'Recusar'} a participação de ${d.nome}? Recusar preserva a alocação.`,confirmar:'Registrar resposta'}))return;
 if(this.destruido||this.ocupado()||this.selecionado()?.pessoaId!==d.pessoaId)return;this.ocupado.set(true);
 this.escrita=this.api.responderDependente(d.pessoaId,c.vagaId!,resposta,c.versao!).subscribe({next:()=>{this.ocupado.set(false);this.consultar();},error:e=>{this.ocupado.set(false);this.consultar();this.erro.set(mensagemApi(e,'Não foi possível responder.'));}});}
 ngOnDestroy(){this.destruido=true;this.lista?.unsubscribe();this.leitura?.unsubscribe();this.escrita?.unsubscribe();}
}
