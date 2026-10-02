import { ChangeDetectionStrategy,Component,OnInit,OnDestroy,inject,signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute,RouterLink } from '@angular/router';
import { forkJoin,Subscription,Observable } from 'rxjs';
import { CandidaturasApiService,Candidatura,VagaAberta,SituacaoCandidatura } from './candidaturas-api.service';
import { SessaoAtual } from '../../core/layout/sessao-atual';
import { mensagemApi } from '../../core/api/api-error';
import { DialogoService } from '../../shared/services/dialogo.service';
import { CabecalhoPaginaComponent } from '../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { BarraFiltrosComponent } from '../../shared/components/barra-filtros/barra-filtros.component';
import { CampoDataComponent } from '../../shared/components/datas/campo-data.component';
import { EstadoListaComponent } from '../../shared/components/estado-lista/estado-lista.component';

@Component({selector:'app-candidaturas',imports:[CommonModule,FormsModule,RouterLink,CabecalhoPaginaComponent,BarraFiltrosComponent,CampoDataComponent,EstadoListaComponent],changeDetection:ChangeDetectionStrategy.OnPush,templateUrl:'./candidaturas.component.html'})
export class CandidaturasComponent implements OnInit,OnDestroy {
 private readonly api=inject(CandidaturasApiService);private readonly sessao=inject(SessaoAtual);private readonly route=inject(ActivatedRoute);private readonly dialogo=inject(DialogoService);
 private leitura?:Subscription;private escrita?:Subscription;private destruido=false;
 readonly escalaId=this.route.snapshot.paramMap.get('id');readonly coordenacao=!!this.escalaId;
 readonly vagas=signal<VagaAberta[]>([]);readonly pedidos=signal<Candidatura[]>([]);readonly totalVagas=signal(0);readonly totalPedidos=signal(0);readonly carregando=signal(false);readonly ocupado=signal(false);readonly erro=signal('');
 paginaVagas=0;paginaPedidos=0;de=new Date().toLocaleDateString('sv-SE');ate=new Date(new Date().getFullYear(),new Date().getMonth()+2,0).toLocaleDateString('sv-SE');
 ngOnInit(){this.carregar();}pode(codigo:string){return this.sessao.permissoes().includes(codigo);}
 rotulo(s:SituacaoCandidatura){return ({PENDENTE:'Pendente',APROVADA:'Aprovada',RECUSADA:'Recusada',DESISTIDA:'Desistida',EXPIRADA:'Expirada'})[s];}
 buscar(){this.paginaVagas=0;this.carregar();}
 paginarVagas(delta:number){this.paginaVagas+=delta;this.carregar();}paginarPedidos(delta:number){this.paginaPedidos+=delta;this.carregar();}
 carregar(){
  this.leitura?.unsubscribe();this.vagas.set([]);this.pedidos.set([]);this.totalVagas.set(0);this.totalPedidos.set(0);this.erro.set('');this.carregando.set(false);
  if(this.coordenacao&&!this.pode('VAGA_CANDIDATURA_LER')){this.erro.set('Seu perfil não permite consultar candidaturas.');return;}
  this.carregando.set(true);
  if(this.coordenacao)this.leitura=this.api.coordenacao(this.escalaId!,this.paginaPedidos).subscribe({next:p=>{this.pedidos.set(p.itens);this.totalPedidos.set(p.total);this.carregando.set(false);},error:e=>this.falha(e)});
  else this.leitura=forkJoin({vagas:this.api.vagas(this.de,this.ate,this.paginaVagas),pedidos:this.api.minhas(this.paginaPedidos)}).subscribe({next:r=>{this.vagas.set(r.vagas.itens);this.totalVagas.set(r.vagas.total);this.pedidos.set(r.pedidos.itens);this.totalPedidos.set(r.pedidos.total);this.carregando.set(false);},error:e=>this.falha(e)});
 }
 private falha(e:unknown){this.carregando.set(false);this.erro.set(mensagemApi(e,'Não foi possível consultar candidaturas.'));}
 async candidatar(v:VagaAberta){if(!v.elegivel||!this.pode('PORTAL_CANDIDATAR'))return;await this.mutar('Candidatar-se a esta vaga? O pedido depende da aprovação da coordenação.','Candidatar-se',false,()=>this.api.candidatar(v.vagaId,v.versao));}
 async desistir(c:Candidatura){if(c.situacao!=='PENDENTE'||!this.pode('PORTAL_CANDIDATAR'))return;await this.mutar('Desistir desta candidatura?','Desistir',true,()=>this.api.desistir(c.id,c.versao));}
 async decidir(c:Candidatura,aprovar:boolean){if(!c.vigente||!this.pode('VAGA_CANDIDATURA_DECIDIR'))return;await this.mutar(aprovar?'Aprovar a candidatura e alocar esta pessoa na vaga? Outros pedidos desta vaga serão encerrados.':'Recusar esta candidatura?',aprovar?'Aprovar':'Recusar',!aprovar,()=>this.api.decidir(c.id,aprovar,c.versao));}
 private async mutar(mensagem:string,confirmar:string,perigo:boolean,acao:()=>Observable<Candidatura>){
  if(this.ocupado()||!await this.dialogo.confirmar({mensagem,confirmar,perigo}))return;
  if(this.destruido||this.ocupado())return;this.ocupado.set(true);this.erro.set('');this.leitura?.unsubscribe();
  this.escrita=acao().subscribe({next:()=>{this.ocupado.set(false);this.carregar();},error:e=>{this.ocupado.set(false);this.carregar();this.erro.set(mensagemApi(e,'Não foi possível concluir. Atualize antes de tentar novamente.'));}});
 }
 ngOnDestroy(){this.destruido=true;this.leitura?.unsubscribe();this.escrita?.unsubscribe();}
}
