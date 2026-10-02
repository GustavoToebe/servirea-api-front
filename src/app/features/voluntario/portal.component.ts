import { ChangeDetectionStrategy,Component,OnInit,OnDestroy,inject,signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { VoluntarioApiService,Portal } from './voluntario-api.service';
import { SessaoAtual } from '../../core/layout/sessao-atual';
import { mensagemApi } from '../../core/api/api-error';
import { environment } from '../../../environments/environment';
import { DialogoService } from '../../shared/services/dialogo.service';
import { CabecalhoPaginaComponent } from '../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { CampoDataComponent } from '../../shared/components/datas/campo-data.component';
const hoje=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
@Component({selector:'app-portal-voluntario',imports:[CommonModule,FormsModule,CabecalhoPaginaComponent,CampoDataComponent],changeDetection:ChangeDetectionStrategy.OnPush,template:`
 <div class="space-y-5"><app-cabecalho-pagina titulo="Meus compromissos" subtitulo="Suas escalas finalizadas e eventos em que você está inscrito. Horários de Brasília." />
 @if(erro()){<div class="card bg-red-50 p-4 text-red-700" role="alert">{{erro()}}</div>}
 <form class="card flex flex-wrap items-end gap-3 p-4" (ngSubmit)="carregar()"><div><label class="label" for="portal-de">De</label><app-campo-data idCampo="portal-de" name="de" [(ngModel)]="de" /></div><div><label class="label" for="portal-ate">Até</label><app-campo-data idCampo="portal-ate" name="ate" [(ngModel)]="ate" /></div><button type="submit" class="btn-secondary" [disabled]="carregando()">Consultar</button></form>
 @if(carregando()){<p role="status">Carregando seus compromissos…</p>}
 @if(dados();as d){@if(!d.vinculado){<section class="card p-5"><p>Seu usuário ainda não está vinculado a uma pessoa. Peça ao administrador da paróquia para fazer o vínculo.</p></section>}@else{
 <div class="card tabela-rolagem"><table class="tabela w-full"><thead><tr><th>Quando</th><th>Compromisso</th><th>Função / local</th></tr></thead><tbody>@for(c of d.compromissos;track c.id){<tr><td>{{c.inicio | date:'dd/MM/yyyy HH:mm'}}</td><td>{{c.titulo}} <span class="badge bg-slate-100 text-slate-600">{{c.tipo==='ESCALA'?'Escala':'Evento'}}</span></td><td>{{c.funcao || c.local || '—'}}</td></tr>}</tbody></table></div>
 @if(!d.compromissos.length){<p>Nenhum compromisso neste período.</p>}
 @if(podeCalendario()){<section class="card space-y-3 p-5"><h2 class="secao-titulo">Calendário privado</h2><p class="text-sm text-slate-500">O link permite consultar seus compromissos sem login. Guarde-o com cuidado. Gerar um novo substitui o anterior. Revogar bloqueia novas consultas; cópias já importadas continuam no seu calendário.</p><div class="flex flex-wrap gap-2"><button type="button" class="btn-primary" [disabled]="ocupado()" (click)="gerar()">Gerar link</button><button type="button" class="btn-danger" [disabled]="ocupado()" (click)="revogar()">Revogar link</button></div>@if(link()){<label class="label" for="link-calendario">Link de assinatura</label><input id="link-calendario" class="field w-full" readonly [value]="link()"><button type="button" class="btn-secondary" (click)="copiar()">Copiar link</button><p>Expira em {{expira() | date:'dd/MM/yyyy'}}. Adicione como calendário por URL no seu aplicativo. A frequência de atualização depende dele.</p>}</section>}
 }}
 </div>`})
export class PortalComponent implements OnInit,OnDestroy {
 private readonly api=inject(VoluntarioApiService);private readonly sessao=inject(SessaoAtual);private readonly dialogo=inject(DialogoService);private leitura?:Subscription;private escrita?:Subscription;private destruido=false;
 readonly dados=signal<Portal|null>(null);readonly erro=signal('');readonly carregando=signal(false);readonly ocupado=signal(false);readonly link=signal('');readonly expira=signal('');de=hoje();ate=new Date(new Date().getFullYear(),new Date().getMonth()+2,0).toISOString().slice(0,10);
 ngOnInit(){this.carregar();}podeCalendario(){return this.sessao.permissoes().includes('CALENDARIO');}
 carregar(){this.leitura?.unsubscribe();this.carregando.set(true);this.erro.set('');this.dados.set(null);this.leitura=this.api.consultar(this.de,this.ate).subscribe({next:d=>{this.dados.set(d);this.carregando.set(false);},error:e=>{this.carregando.set(false);this.erro.set(mensagemApi(e,'Não foi possível carregar os compromissos.'));}});}
 async gerar(){if(this.ocupado()||!await this.dialogo.confirmar({mensagem:'Gerar um novo link e invalidar o anterior?',confirmar:'Gerar link'}))return;if(this.destruido||this.ocupado())return;this.ocupado.set(true);this.link.set('');this.erro.set('');this.escrita=this.api.criarCalendario().subscribe({next:r=>{this.link.set(new URL(`${environment.apiUrl.replace(/\/$/,'')}/public/calendario/${r.token}.ics`,location.origin).href);this.expira.set(r.expiraEm);this.ocupado.set(false);},error:e=>{this.ocupado.set(false);this.erro.set(mensagemApi(e,'Não foi possível gerar o calendário.'));}});}
 async revogar(){if(this.ocupado()||!await this.dialogo.confirmar({mensagem:'Revogar o link do calendário? Novas consultas deixarão de funcionar.',confirmar:'Revogar',perigo:true}))return;if(this.destruido||this.ocupado())return;this.ocupado.set(true);this.escrita=this.api.revogarCalendario().subscribe({next:()=>{this.link.set('');this.expira.set('');this.ocupado.set(false);},error:e=>{this.ocupado.set(false);this.erro.set(mensagemApi(e,'Não foi possível revogar.'));}});}
 async copiar(){try{await navigator.clipboard.writeText(this.link());}catch{await this.dialogo.avisar('Selecione e copie o link no campo.');}}
 ngOnDestroy(){this.destruido=true;this.leitura?.unsubscribe();this.escrita?.unsubscribe();this.link.set('');this.expira.set('');}
}
