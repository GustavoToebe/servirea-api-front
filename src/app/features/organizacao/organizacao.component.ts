import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { SessaoAtual } from '../../core/layout/sessao-atual';
import { mensagemApi } from '../../core/api/api-error';
import { FuncionalidadesPlanoService } from '../../core/plano/funcionalidades-plano.service';
import { CabecalhoPaginaComponent } from '../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { RodapeFormComponent } from '../../shared/components/rodape-form/rodape-form.component';
import { CampoDataComponent } from '../../shared/components/datas/campo-data.component';
import { focarPrimeiroInvalido } from '../../shared/utils/foco';
import { OrganizacaoApiService, ModuloOrganizacao, RegistroOrganizacao, SalvarOrganizacao } from './organizacao-api.service';
@Component({selector:'app-organizacao',imports:[CommonModule,FormsModule,CabecalhoPaginaComponent,RodapeFormComponent,CampoDataComponent],changeDetection:ChangeDetectionStrategy.OnPush,
 templateUrl:'./organizacao.component.html'})
export class OrganizacaoComponent implements OnInit,OnDestroy {
 private readonly api=inject(OrganizacaoApiService);private readonly sessao=inject(SessaoAtual);private readonly plano=inject(FuncionalidadesPlanoService);private readonly host=inject(ElementRef<HTMLElement>);
 readonly tipo: ModuloOrganizacao=inject(ActivatedRoute).snapshot.data['modulo']==='mural'?'mural':'tarefas';
 readonly titulo=this.tipo==='mural'?'Mural de avisos':'Tarefas e solicitações';
 readonly permissao=this.tipo==='mural'?'MURAL':'TAREFA';
 readonly estados=this.tipo==='mural'?['PUBLICADO','ARQUIVADO']:['ABERTA','EM_ANDAMENTO','CONCLUIDA','CANCELADA'];
 readonly rotulos: Record<string,string>={PUBLICADO:'Publicado',ARQUIVADO:'Arquivado',ABERTA:'Aberta',EM_ANDAMENTO:'Em andamento',CONCLUIDA:'Concluída',CANCELADA:'Cancelada'};
 readonly cores: Record<string,string>={PUBLICADO:'bg-emerald-50 text-emerald-700',CONCLUIDA:'bg-emerald-50 text-emerald-700',ABERTA:'bg-amber-50 text-amber-700',EM_ANDAMENTO:'bg-amber-50 text-amber-700',ARQUIVADO:'bg-slate-100 text-slate-600',CANCELADA:'bg-slate-100 text-slate-600'};
 readonly itens=signal<RegistroOrganizacao[]>([]);readonly total=signal(0);readonly carregando=signal(false);readonly salvando=signal(false);readonly erro=signal('');readonly contratado=signal(false);readonly editando=signal(false);
 busca='';status='';pagina=0;id: string | null=null;dados: SalvarOrganizacao=this.vazio();private leitura?:Subscription;private direito?:Subscription;private escrita?:Subscription;
 ngOnInit() {this.carregar();this.direito=this.plano.consultar().subscribe({next:c=>this.contratado.set(c.includes(this.tipo==='mural'?'MURAL':'TAREFAS')),error:()=>this.contratado.set(false)});}
 pode(acao:string) {return this.sessao.permissoes().includes(this.permissao+acao);}
 carregar() {this.leitura?.unsubscribe();this.carregando.set(true);this.erro.set('');this.leitura=this.api.listar(this.tipo,this.busca,this.status,this.pagina).subscribe({next:p=>{this.itens.set(p.itens);this.total.set(p.total);this.carregando.set(false);},error:e=>{this.itens.set([]);this.total.set(0);this.carregando.set(false);this.erro.set(mensagemApi(e,'Não foi possível carregar os registros.'));}});}
 buscar() {this.pagina=0;this.carregar();}
 paginar(delta:number) {this.pagina+=delta;this.carregar();}
 novo() {this.id=null;this.dados=this.vazio();this.erro.set('');this.editando.set(true);}
 abrir(r:RegistroOrganizacao) {this.id=r.id;this.dados={titulo:r.titulo,descricao:r.descricao,status:r.status,prazo:r.prazo,equipe:r.equipe,versao:r.versao};this.erro.set('');this.editando.set(true);}
 cancelar() {if(!this.salvando()) this.editando.set(false);}
 salvar(form:NgForm) {if(this.salvando()||!this.contratado()||!this.pode(this.id?'_ALTERAR':'_CRIAR')) return;
  if(form.invalid) {form.control.markAllAsTouched();focarPrimeiroInvalido(this.host.nativeElement);return;}
  this.salvando.set(true);this.erro.set('');const dados={...this.dados,prazo:this.dados.prazo||null};if(this.tipo==='mural') delete dados.equipe;
  this.escrita=this.api.salvar(this.tipo,this.id,dados).subscribe({next:()=>{this.salvando.set(false);this.editando.set(false);this.carregar();},error:e=>{this.salvando.set(false);this.erro.set(mensagemApi(e,'Não foi possível salvar.'));}});
 }
 private vazio():SalvarOrganizacao {return {titulo:'',descricao:'',status:this.tipo==='mural'?'PUBLICADO':'ABERTA',prazo:null,equipe:null,versao:null};}
 ngOnDestroy() {this.leitura?.unsubscribe();this.direito?.unsubscribe();this.escrita?.unsubscribe();}
}
