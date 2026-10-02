import { ChangeDetectionStrategy,Component,OnInit,OnDestroy,inject,signal,ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule,NgForm } from '@angular/forms';
import { ActivatedRoute,RouterLink } from '@angular/router';
import { forkJoin,Subscription,Observable,firstValueFrom } from 'rxjs';
import { TrocasApiService,Troca,SituacaoTroca } from './trocas-api.service';
import { VoluntarioApiService,Compromisso } from './voluntario-api.service';
import { SessaoAtual } from '../../core/layout/sessao-atual';
import { mensagemApi } from '../../core/api/api-error';
import { DialogoService } from '../../shared/services/dialogo.service';
import { CabecalhoPaginaComponent } from '../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { BarraFiltrosComponent } from '../../shared/components/barra-filtros/barra-filtros.component';
import { CampoDataComponent } from '../../shared/components/datas/campo-data.component';
import { EstadoListaComponent } from '../../shared/components/estado-lista/estado-lista.component';
import { SelectBuscaComponent,OpcaoSelectBusca } from '../../shared/components/select-busca/select-busca.component';
import { RodapeFormComponent } from '../../shared/components/rodape-form/rodape-form.component';
import { focarPrimeiroInvalido } from '../../shared/utils/foco';
@Component({selector:'app-trocas',imports:[CommonModule,FormsModule,RouterLink,CabecalhoPaginaComponent,BarraFiltrosComponent,CampoDataComponent,EstadoListaComponent,SelectBuscaComponent,RodapeFormComponent],changeDetection:ChangeDetectionStrategy.OnPush,templateUrl:'./trocas.component.html'})
export class TrocasComponent implements OnInit,OnDestroy {
 private readonly api=inject(TrocasApiService);private readonly portal=inject(VoluntarioApiService);private readonly sessao=inject(SessaoAtual);private readonly route=inject(ActivatedRoute);private readonly dialogo=inject(DialogoService);private readonly host=inject(ElementRef<HTMLElement>);
 private leitura?:Subscription;private escrita?:Subscription;private destruido=false;
 readonly escalaId=this.route.snapshot.paramMap.get('id');readonly coordenacao=!!this.escalaId;
 readonly pedidos=signal<Troca[]>([]);readonly compromissos=signal<Compromisso[]>([]);readonly opcoesVagas=signal<OpcaoSelectBusca[]>([]);readonly total=signal(0);readonly carregando=signal(false);readonly ocupado=signal(false);readonly erro=signal('');
 pagina=0;de=new Date().toLocaleDateString('sv-SE');ate=new Date(new Date().getFullYear(),new Date().getMonth()+2,0).toLocaleDateString('sv-SE');vagaId:string|null=null;substitutoId:string|null=null;
 readonly buscarSubstitutos=async(termo:string):Promise<OpcaoSelectBusca[]>=>{if(this.destruido||termo.trim().length<2||termo.trim().length>80||!this.pode('PORTAL_TROCAR'))return [];const itens=await firstValueFrom(this.api.substitutos(termo));return this.destruido?[]:itens.map(p=>({valor:p.id,rotulo:p.nome}));};
 ngOnInit(){this.carregar();}pode(c:string){return this.sessao.permissoes().includes(c);}
 rotulo(s:SituacaoTroca){return ({AGUARDANDO_ACEITE:'Aguardando aceite',ACEITA:'Aguardando coordenação',APROVADA:'Aprovada',RECUSADA:'Recusada',CANCELADA:'Cancelada',EXPIRADA:'Expirada'})[s];}
 buscar(){this.pagina=0;this.carregar();}paginar(delta:number){this.pagina+=delta;this.carregar();}
 carregar(){
  this.leitura?.unsubscribe();this.pedidos.set([]);this.compromissos.set([]);this.opcoesVagas.set([]);this.total.set(0);this.erro.set('');this.vagaId=null;this.substitutoId=null;this.carregando.set(false);
  if(this.coordenacao&&!this.pode('VAGA_TROCA_LER')){this.erro.set('Seu perfil não permite consultar trocas.');return;}
  this.carregando.set(true);
  if(this.coordenacao)this.leitura=this.api.coordenacao(this.escalaId!,this.pagina).subscribe({next:r=>{this.pedidos.set(r.itens);this.total.set(r.total);this.carregando.set(false);},error:e=>this.falha(e)});
  else this.leitura=forkJoin({pedidos:this.api.minhas(this.pagina),portal:this.portal.consultar(this.de,this.ate)}).subscribe({next:r=>{this.pedidos.set(r.pedidos.itens);this.total.set(r.pedidos.total);const vagas=r.portal.compromissos.filter(c=>c.vagaId&&c.prazoResposta&&Date.parse(c.prazoResposta)>Date.now());this.compromissos.set(vagas);this.opcoesVagas.set(vagas.map(c=>({valor:c.vagaId!,rotulo:`${c.titulo} · ${c.inicio.replace('T',' ')} · ${c.funcao}`})));this.carregando.set(false);},error:e=>this.falha(e)});
 }
 private falha(e:unknown){this.carregando.set(false);this.erro.set(mensagemApi(e,'Não foi possível consultar trocas.'));}
 async solicitar(form:NgForm){
  if(form.invalid){form.form.markAllAsTouched();focarPrimeiroInvalido(this.host.nativeElement);return;}
  const vaga=this.compromissos().find(c=>c.vagaId===this.vagaId);if(!vaga||!this.substitutoId||!this.pode('PORTAL_TROCAR'))return;const substituto=this.substitutoId;
  await this.mutar('Solicitar esta substituição? Sua alocação permanece até o aceite e a aprovação.','Solicitar',false,()=>this.api.solicitar(vaga.vagaId!,substituto,vaga.versao!));
 }
 async responder(t:Troca,aceitar:boolean){if(this.coordenacao||!t.substituto||!t.vigente||t.situacao!=='AGUARDANDO_ACEITE'||!this.pode('PORTAL_TROCAR'))return;await this.mutar(aceitar?'Aceitar ser o substituto? A coordenação ainda precisa aprovar.':'Recusar esta substituição?',aceitar?'Aceitar':'Recusar',!aceitar,()=>this.api.responder(t.id,aceitar,t.versao));}
 async cancelar(t:Troca){if(this.coordenacao||!t.solicitante||!['AGUARDANDO_ACEITE','ACEITA'].includes(t.situacao)||!this.pode('PORTAL_TROCAR'))return;await this.mutar('Cancelar o pedido de troca?','Cancelar pedido',true,()=>this.api.cancelar(t.id,t.versao));}
 async decidir(t:Troca,aprovar:boolean){if(!this.coordenacao||!t.vigente||t.situacao!=='ACEITA'||!this.pode('VAGA_TROCA_DECIDIR'))return;await this.mutar(aprovar?'Aprovar e substituir a pessoa nesta vaga? A resposta de participação e a presença voltarão a pendentes.':'Recusar esta troca?',aprovar?'Aprovar':'Recusar',!aprovar,()=>this.api.decidir(t.id,aprovar,t.versao));}
 private async mutar(mensagem:string,confirmar:string,perigo:boolean,acao:()=>Observable<Troca>){if(this.ocupado()||!await this.dialogo.confirmar({mensagem,confirmar,perigo}))return;if(this.destruido||this.ocupado())return;this.ocupado.set(true);this.leitura?.unsubscribe();this.escrita=acao().subscribe({next:()=>{this.ocupado.set(false);this.carregar();},error:e=>{this.ocupado.set(false);this.carregar();this.erro.set(mensagemApi(e,'Não foi possível concluir. Atualize antes de tentar novamente.'));}});}
 ngOnDestroy(){this.destruido=true;this.leitura?.unsubscribe();this.escrita?.unsubscribe();this.compromissos.set([]);this.pedidos.set([]);this.vagaId=null;this.substitutoId=null;}
}
