import { ChangeDetectionStrategy,Component,OnInit,OnDestroy,inject,signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { VoluntarioApiService,Portal,Compromisso,HistoricoResposta } from './voluntario-api.service';
import { SessaoAtual } from '../../core/layout/sessao-atual';
import { mensagemApi } from '../../core/api/api-error';
import { environment } from '../../../environments/environment';
import { DialogoService } from '../../shared/services/dialogo.service';
import { CabecalhoPaginaComponent } from '../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { CampoDataComponent } from '../../shared/components/datas/campo-data.component';
const hoje=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
@Component({selector:'app-portal-voluntario',imports:[CommonModule,RouterLink,FormsModule,CabecalhoPaginaComponent,CampoDataComponent],changeDetection:ChangeDetectionStrategy.OnPush,template:`
 <div class="space-y-5"><app-cabecalho-pagina titulo="Meus compromissos" subtitulo="Suas escalas finalizadas e eventos em que você está inscrito. Horários de Brasília."><a acoes routerLink="/ajuda" [queryParams]="{tema:'portal'}" class="btn-secondary">Ajuda do portal</a></app-cabecalho-pagina>
 <a routerLink="/portal/indisponibilidades" class="btn-secondary inline-block">Minha indisponibilidade</a>
 <a routerLink="/portal/trocas" class="btn-secondary inline-block">Trocas de escala</a>
 <a routerLink="/portal/vagas" class="btn-secondary inline-block">Vagas e candidaturas</a>
 @if(erro()){<div class="card bg-red-50 p-4 text-red-700" role="alert">{{erro()}}</div>}
 <form class="card flex flex-wrap items-end gap-3 p-4" (ngSubmit)="carregar()"><div><label class="label" for="portal-de">De</label><app-campo-data idCampo="portal-de" name="de" [(ngModel)]="de" /></div><div><label class="label" for="portal-ate">Até</label><app-campo-data idCampo="portal-ate" name="ate" [(ngModel)]="ate" /></div><button type="submit" class="btn-secondary" [disabled]="carregando()">Consultar</button></form>
 @if(carregando()){<p role="status">Carregando seus compromissos…</p>}
 @if(dados();as d){@if(!d.vinculado){<section class="card p-5"><p>Seu usuário ainda não está vinculado a uma pessoa. Peça ao administrador da paróquia para fazer o vínculo.</p></section>}@else{
 <div class="card tabela-rolagem"><table class="tabela w-full"><thead><tr><th>Quando</th><th>Compromisso</th><th>Função / local</th><th>Participação</th></tr></thead><tbody>@for(c of d.compromissos;track c.id){<tr><td>{{c.inicio | date:'dd/MM/yyyy HH:mm'}}</td><td>{{c.titulo}} <span class="badge bg-slate-100 text-slate-600">{{c.tipo==='ESCALA'?'Escala':'Evento'}}</span></td><td>{{c.funcao || c.local || '—'}}</td><td>
 @if(c.vagaId){<span class="badge" [ngClass]="{'bg-emerald-50 text-emerald-700':c.resposta==='CONFIRMADA','bg-red-50 text-red-700':c.resposta==='RECUSADA','bg-amber-50 text-amber-700':c.resposta==='PENDENTE'}">{{rotulo(c.resposta)}}</span>
 @if(podeResponder(c)){<div class="mt-2 flex gap-2"><button type="button" class="btn-secondary" [disabled]="ocupado()" (click)="responder(c,'CONFIRMADA')">Confirmar</button><button type="button" class="btn-danger" [disabled]="ocupado()" (click)="responder(c,'RECUSADA')">Recusar</button></div>}@else{<p class="text-xs text-slate-500">Resposta até o início da celebração; exige permissão.</p>}
 <button type="button" class="btn-secondary mt-2" (click)="abrirHistorico(c)">Histórico</button>
 }@else{<span>—</span>}
 </td></tr>}</tbody></table></div>
 <p class="text-sm text-slate-500">A resposta indica intenção de participar. Recusar mantém sua alocação para a coordenação providenciar substituição.</p>
 @if(historicoVaga()){<section class="card space-y-3 p-5"><h2 class="secao-titulo">Histórico: {{historicoTitulo()}}</h2><button type="button" class="btn-secondary" (click)="fecharHistorico()">Fechar</button>@if(historicoCarregando()){<p role="status">Carregando histórico…</p>}@for(h of historico();track h.id){<p>{{rotulo(h.resposta)}} · {{h.respondidoEm | date:'dd/MM/yyyy HH:mm'}}</p>}@if(!historicoCarregando()&&!historico().length){<p>Nenhuma resposta registrada.</p>}<div class="flex gap-2"><button type="button" class="btn-secondary" [disabled]="historicoPagina===0||historicoCarregando()" (click)="paginarHistorico(-1)">Anterior</button><button type="button" class="btn-secondary" [disabled]="(historicoPagina+1)*30>=historicoTotal()||historicoCarregando()" (click)="paginarHistorico(1)">Próxima</button></div></section>}
 @if(!d.compromissos.length){<p>Nenhum compromisso neste período.</p>}
 @if(podeCalendario()){<section class="card space-y-3 p-5"><h2 class="secao-titulo">Calendário privado</h2><p class="text-sm text-slate-500">O link permite consultar seus compromissos sem login. Guarde-o com cuidado. Gerar um novo substitui o anterior. Revogar bloqueia novas consultas; cópias já importadas continuam no seu calendário.</p><div class="flex flex-wrap gap-2"><button type="button" class="btn-primary" [disabled]="ocupado()" (click)="gerar()">Gerar link</button><button type="button" class="btn-danger" [disabled]="ocupado()" (click)="revogar()">Revogar link</button></div>@if(link()){<label class="label" for="link-calendario">Link de assinatura</label><input id="link-calendario" class="field w-full" readonly [value]="link()"><button type="button" class="btn-secondary" (click)="copiar()">Copiar link</button><p>Expira em {{expira() | date:'dd/MM/yyyy'}}. Adicione como calendário por URL no seu aplicativo. A frequência de atualização depende dele.</p>}</section>}
 }}
 </div>`})
export class PortalComponent implements OnInit,OnDestroy {
 private readonly api=inject(VoluntarioApiService);private readonly sessao=inject(SessaoAtual);private readonly dialogo=inject(DialogoService);private leitura?:Subscription;private escrita?:Subscription;private destruido=false;private historia?:Subscription;
 readonly historico=signal<HistoricoResposta[]>([]);readonly historicoVaga=signal('');readonly historicoTitulo=signal('');readonly historicoTotal=signal(0);readonly historicoCarregando=signal(false);historicoPagina=0;
 readonly dados=signal<Portal|null>(null);readonly erro=signal('');readonly carregando=signal(false);readonly ocupado=signal(false);readonly link=signal('');readonly expira=signal('');de=hoje();ate=new Date(new Date().getFullYear(),new Date().getMonth()+2,0).toISOString().slice(0,10);
 ngOnInit(){this.carregar();}podeCalendario(){return this.sessao.permissoes().includes('CALENDARIO');}
 carregar(){this.leitura?.unsubscribe();this.carregando.set(true);this.erro.set('');this.dados.set(null);this.leitura=this.api.consultar(this.de,this.ate).subscribe({next:d=>{this.dados.set(d);this.carregando.set(false);},error:e=>{this.carregando.set(false);this.erro.set(mensagemApi(e,'Não foi possível carregar os compromissos.'));}});}
 rotulo(resposta:string|null){return resposta==='CONFIRMADA'?'Confirmada':resposta==='RECUSADA'?'Recusada':'Pendente';}
 podeResponder(c:Compromisso){return this.sessao.permissoes().includes('PORTAL_RESPONDER')&&!!c.vagaId&&c.versao!==null&&!!c.prazoResposta&&Date.parse(c.prazoResposta)>Date.now();}
 async responder(c:Compromisso,resposta:'CONFIRMADA'|'RECUSADA'){
  if(this.ocupado()||!this.podeResponder(c))return;
  const mensagem=resposta==='CONFIRMADA'?'Confirmar sua participação nesta celebração?':'Recusar participação? Você continuará alocado até a coordenação providenciar a substituição.';
  if(!await this.dialogo.confirmar({mensagem,confirmar:resposta==='CONFIRMADA'?'Confirmar':'Recusar',perigo:resposta==='RECUSADA'}))return;
  if(this.destruido||this.ocupado()||!this.podeResponder(c))return;
  this.ocupado.set(true);this.erro.set('');this.leitura?.unsubscribe();
  this.escrita=this.api.responder(c.vagaId!,resposta,c.versao!).subscribe({next:()=>{this.ocupado.set(false);this.fecharHistorico();this.carregar();},error:e=>{this.ocupado.set(false);this.carregar();this.erro.set(mensagemApi(e,'Não foi possível responder. Atualize o compromisso.'));}});
 }
 abrirHistorico(c:Compromisso){if(!c.vagaId)return;this.historicoVaga.set(c.vagaId);this.historicoTitulo.set(c.titulo);this.historicoPagina=0;this.carregarHistorico();}
 carregarHistorico(){this.historia?.unsubscribe();this.historico.set([]);this.historicoTotal.set(0);this.historicoCarregando.set(true);this.historia=this.api.historico(this.historicoVaga(),this.historicoPagina).subscribe({next:p=>{this.historico.set(p.itens);this.historicoTotal.set(p.total);this.historicoCarregando.set(false);},error:e=>{this.historicoCarregando.set(false);this.erro.set(mensagemApi(e,'Não foi possível consultar o histórico.'));}});}
 paginarHistorico(delta:number){this.historicoPagina+=delta;this.carregarHistorico();}
 fecharHistorico(){this.historia?.unsubscribe();this.historicoVaga.set('');this.historico.set([]);this.historicoCarregando.set(false);}
 async gerar(){if(this.ocupado()||!await this.dialogo.confirmar({mensagem:'Gerar um novo link e invalidar o anterior?',confirmar:'Gerar link'}))return;if(this.destruido||this.ocupado())return;this.ocupado.set(true);this.link.set('');this.erro.set('');this.escrita=this.api.criarCalendario().subscribe({next:r=>{this.link.set(new URL(`${environment.apiUrl.replace(/\/$/,'')}/public/calendario/${r.token}.ics`,location.origin).href);this.expira.set(r.expiraEm);this.ocupado.set(false);},error:e=>{this.ocupado.set(false);this.erro.set(mensagemApi(e,'Não foi possível gerar o calendário.'));}});}
 async revogar(){if(this.ocupado()||!await this.dialogo.confirmar({mensagem:'Revogar o link do calendário? Novas consultas deixarão de funcionar.',confirmar:'Revogar',perigo:true}))return;if(this.destruido||this.ocupado())return;this.ocupado.set(true);this.escrita=this.api.revogarCalendario().subscribe({next:()=>{this.link.set('');this.expira.set('');this.ocupado.set(false);},error:e=>{this.ocupado.set(false);this.erro.set(mensagemApi(e,'Não foi possível revogar.'));}});}
 async copiar(){try{await navigator.clipboard.writeText(this.link());}catch{await this.dialogo.avisar('Selecione e copie o link no campo.');}}
 ngOnDestroy(){this.destruido=true;this.fecharHistorico();this.leitura?.unsubscribe();this.escrita?.unsubscribe();this.link.set('');this.expira.set('');}
}
