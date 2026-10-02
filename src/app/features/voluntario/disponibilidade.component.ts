import { ChangeDetectionStrategy,Component,OnInit,OnDestroy,ElementRef,inject,signal } from '@angular/core';
import { FormsModule,NgForm } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { SessaoAtual } from '../../core/layout/sessao-atual';
import { mensagemApi } from '../../core/api/api-error';
import { HasPendingChanges } from '../../core/guards/pending-changes.guard';
import { DialogoService } from '../../shared/services/dialogo.service';
import { focarPrimeiroInvalido } from '../../shared/utils/foco';
import { CabecalhoPaginaComponent } from '../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { CampoDataComponent } from '../../shared/components/datas/campo-data.component';
import { CampoCompetenciaComponent } from '../../shared/components/datas/campo-competencia.component';
import { RodapeFormComponent } from '../../shared/components/rodape-form/rodape-form.component';
import { DisponibilidadeApiService,BloqueioPessoal,DisponibilidadePessoal } from './disponibilidade-api.service';
@Component({selector:'app-disponibilidade-pessoal',imports:[FormsModule,RouterLink,CabecalhoPaginaComponent,CampoDataComponent,CampoCompetenciaComponent,RodapeFormComponent],changeDetection:ChangeDetectionStrategy.OnPush,template:`
 <div class="space-y-5"><app-cabecalho-pagina titulo="Minha indisponibilidade" subtitulo="Informe quando você não pode servir. A coordenação recebe estas datas para montar as escalas."><a acoes routerLink="/portal" class="btn-secondary">Meus compromissos</a></app-cabecalho-pagina>
 @if(erro()){<div class="card p-4 bg-red-50 text-red-700" role="alert">{{erro()}}</div>}@if(aviso()){<p role="status" class="card p-4 text-emerald-700">{{aviso()}}</p>}
 <section class="card p-5"><label class="label" for="disp-mes">Mês</label><app-campo-competencia idCampo="disp-mes" [ngModel]="competencia" (ngModelChange)="trocarMes($event)" [limpavel]="false" [disabled]="salvando()||confirmando()" /><button type="button" class="btn-secondary" [disabled]="salvando()||confirmando()||carregando()" (click)="recarregar()">Recarregar</button></section>
 @if(carregando()){<p role="status">Carregando suas respostas…</p>}
 @if(dados()){<form #form="ngForm" (ngSubmit)="salvar(form)"><section class="card secao-form p-5 space-y-4"><h2 class="secao-titulo">Datas e períodos</h2><p>Marque “Sem restrição” se pode em todas as datas. Sem datas e sem essa marcação, sua resposta fica pendente. Salvar não altera alocações já publicadas.</p>
 <fieldset [disabled]="salvando()||confirmando()||!podeSalvar()" class="space-y-4"><label class="label"><input type="checkbox" name="semRestricao" [checked]="semRestricao" (change)="alterarCaixa($event)"> Sem restrição neste mês</label>
 @for(i of itens;track $index){<div class="grade-form"><div><label class="label" [for]="'disp-data-'+$index">Data em que não pode servir</label><app-campo-data [idCampo]="'disp-data-'+$index" [name]="'data'+$index" required [(ngModel)]="i.data" (ngModelChange)="alterado=true" [min]="competencia+'-01'" [max]="fimDoMes" /></div><div><label class="label" [for]="'disp-periodo-'+$index">Período</label><select class="field" [id]="'disp-periodo-'+$index" [name]="'periodo'+$index" [(ngModel)]="i.periodo" (ngModelChange)="alterado=true"><option [ngValue]="null">Dia inteiro</option><option value="MANHA">Manhã</option><option value="TARDE">Tarde</option><option value="NOITE">Noite</option></select><button type="button" class="btn-secondary" (click)="remover($index)">Remover data</button></div></div>}
 <button type="button" class="btn-secondary" [disabled]="semRestricao||itens.length>=93" (click)="adicionar()">Adicionar data</button></fieldset></section>
 @if(podeSalvar()){<app-rodape-form [carregando]="salvando()" (cancelar)="recarregar()" />}
 </form>}</div>`})
export class DisponibilidadeComponent implements OnInit,OnDestroy,HasPendingChanges {
 private readonly api=inject(DisponibilidadeApiService);private readonly sessao=inject(SessaoAtual);private readonly dialogo=inject(DialogoService);private readonly host=inject(ElementRef<HTMLElement>);
 private leitura?:Subscription;private escrita?:Subscription;private destruido=false;
 readonly dados=signal<DisponibilidadePessoal|null>(null);readonly erro=signal('');readonly aviso=signal('');readonly carregando=signal(false);readonly salvando=signal(false);readonly confirmando=signal(false);
 competencia=new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit'}).format(new Date());itens:BloqueioPessoal[]=[];semRestricao=false;alterado=false;
 get fimDoMes(){const [ano,mes]=this.competencia.split('-').map(Number);return this.competencia+'-'+new Date(ano,mes,0).getDate();}
 ngOnInit(){this.carregar();}hasPendingChanges(){return this.alterado;}podeSalvar(){return this.sessao.permissoes().includes('PORTAL_DISPONIBILIDADE');}
 carregar(){this.leitura?.unsubscribe();this.dados.set(null);this.carregando.set(true);this.erro.set('');const [ano,mes]=this.competencia.split('-').map(Number);this.leitura=this.api.consultar(ano,mes).subscribe({next:d=>{this.aplicar(d);this.carregando.set(false);},error:e=>{this.carregando.set(false);this.erro.set(mensagemApi(e,'Não foi possível consultar sua resposta.'));}});}
 private aplicar(d:DisponibilidadePessoal){this.dados.set(d);this.itens=d.itens.map(i=>({...i}));this.semRestricao=d.semRestricao;this.alterado=false;}
 async recarregar(){if(this.salvando()||this.confirmando()||this.carregando()||!await this.podeDescartar()||this.destruido)return;this.aviso.set('');this.carregar();}
 async trocarMes(valor:string|null){if(!valor||valor===this.competencia||this.salvando()||this.confirmando()||!await this.podeDescartar()||this.destruido)return;this.competencia=valor;this.aviso.set('');this.carregar();}
 private async podeDescartar(){return !this.alterado||await this.dialogo.confirmar({mensagem:'Descartar suas alterações não salvas?',confirmar:'Descartar',perigo:true});}
 adicionar(){if(this.semRestricao||this.itens.length>=93)return;this.itens=[...this.itens,{data:'',periodo:null}];this.alterado=true;}
 remover(i:number){this.itens=this.itens.filter((_,n)=>n!==i);this.alterado=true;}
 async alterarCaixa(evento:Event){const caixa=evento.target as HTMLInputElement;this.confirmando.set(true);try{await this.alternarSem(caixa.checked);}finally{caixa.checked=this.semRestricao;this.confirmando.set(false);}}
 async alternarSem(valor:boolean){if(valor&&this.itens.length&&!await this.dialogo.confirmar({mensagem:'Remover as datas e informar sem restrição?',confirmar:'Sem restrição'}))return;if(this.destruido)return;this.semRestricao=valor;if(valor)this.itens=[];this.alterado=true;}
 salvar(form:NgForm){const d=this.dados();if(!d||this.salvando()||this.confirmando()||this.carregando()||!this.podeSalvar())return;if(form.invalid){form.control.markAllAsTouched();focarPrimeiroInvalido(this.host.nativeElement);return;}
  this.salvando.set(true);this.erro.set('');this.aviso.set('');this.escrita=this.api.salvar(d.ano,d.mes,{versao:d.versao,semRestricao:this.semRestricao,itens:this.itens.map(i=>({...i}))}).subscribe({next:r=>{this.aplicar(r);this.salvando.set(false);this.aviso.set('Sua resposta foi salva.');},error:e=>{this.salvando.set(false);this.erro.set(mensagemApi(e,'Não foi possível salvar. Recarregue o mês se outra resposta foi registrada.'));}});
 }
 ngOnDestroy(){this.destruido=true;this.leitura?.unsubscribe();this.escrita?.unsubscribe();}
}
