import { ChangeDetectionStrategy,Component,OnInit,OnDestroy,inject,signal,ElementRef } from '@angular/core';
import { FormsModule,NgForm } from '@angular/forms';
import { Subscription, firstValueFrom } from 'rxjs';
import { coletarExportacao } from '../../shared/utils/coletar-exportacao';
import { TabelaExportacao } from '../../shared/utils/exportacao-tabela';
import { PastoraisApiService,Equipe,Membro,PessoaOpcao } from './pastorais-api.service';
import { SessaoAtual } from '../../core/layout/sessao-atual';
import { mensagemApi } from '../../core/api/api-error';
import { CabecalhoPaginaComponent } from '../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { BarraFiltrosComponent } from '../../shared/components/barra-filtros/barra-filtros.component';
import { RodapeFormComponent } from '../../shared/components/rodape-form/rodape-form.component';
import { focarPrimeiroInvalido } from '../../shared/utils/foco';
@Component({selector:'app-pastorais',imports:[FormsModule,CabecalhoPaginaComponent,BarraFiltrosComponent,RodapeFormComponent],changeDetection:ChangeDetectionStrategy.OnPush,templateUrl:'./pastorais.component.html'})
export class PastoraisComponent implements OnInit,OnDestroy {
 private destruido=false;private buscaExportacao='';
 readonly dadosExportacao=async():Promise<TabelaExportacao>=>{
  const equipe=this.equipe(),busca=this.buscaExportacao;
  if(equipe){const itens=await coletarExportacao(p=>firstValueFrom(this.api.membros(equipe.id,p)),()=>!this.destruido);return {nome:'participantes-pastoral',titulo:`Servirea · ${equipe.nome}`,colunas:['Pessoa','Papel','Situação'],linhas:itens.map(m=>[m.nome,m.papel==='COORDENADOR'?'Coordenador':'Participante',m.ativo?'Ativo':'Inativo'])};}
  const itens=await coletarExportacao(p=>firstValueFrom(this.api.equipes(busca,p)),()=>!this.destruido);return {nome:'pastorais-equipes',titulo:'Servirea · Pastorais e equipes',contexto:`Busca: ${busca||'todas'}`,colunas:['Nome','Descrição','Situação'],linhas:itens.map(e=>[e.nome,e.descricao,e.ativo?'Ativa':'Inativa'])};
 };
 private readonly api=inject(PastoraisApiService);private readonly sessao=inject(SessaoAtual);private readonly host=inject(ElementRef<HTMLElement>);private lista?:Subscription;private detalhe?:Subscription;private buscaPessoas?:Subscription;private escrita?:Subscription;
 readonly equipes=signal<Equipe[]>([]);readonly membros=signal<Membro[]>([]);readonly opcoes=signal<PessoaOpcao[]>([]);readonly equipe=signal<Equipe|null>(null);readonly erro=signal('');readonly carregando=signal(false);readonly ocupado=signal(false);readonly total=signal(0);readonly totalMembros=signal(0);
 busca='';pagina=0;paginaMembros=0;form:{nome:string;descricao:string|null;ativo:boolean;versao:number|null}|null=null;id:string|null=null;buscaPessoa='';pessoaId='';papel='MEMBRO';
 ngOnInit(){this.carregar();}pode(c:string){return this.sessao.permissoes().includes(c);}
 carregar(){this.buscaExportacao=this.busca;this.lista?.unsubscribe();this.carregando.set(true);this.lista=this.api.equipes(this.busca,this.pagina).subscribe({next:p=>{this.equipes.set(p.itens);this.total.set(p.total);this.carregando.set(false);},error:e=>{this.carregando.set(false);this.erro.set(mensagemApi(e,'Não foi possível carregar equipes.'));}});}
 buscar(){this.pagina=0;this.carregar();}paginar(delta:number){this.pagina+=delta;this.carregar();}
 novo(){this.equipe.set(null);this.id=null;this.form={nome:'',descricao:null,ativo:true,versao:null};this.erro.set('');}
 editar(e:Equipe){this.id=e.id;this.form={nome:e.nome,descricao:e.descricao,ativo:e.ativo,versao:e.versao};}
 salvar(f:NgForm){if(this.ocupado()||!this.form)return;if(f.invalid){f.control.markAllAsTouched();focarPrimeiroInvalido(this.host.nativeElement);return;}this.ocupado.set(true);this.escrita=this.api.salvar(this.form,this.id).subscribe({next:salva=>{this.form=null;this.ocupado.set(false);this.equipe.set(salva);this.paginaMembros=0;this.carregarMembros();this.carregar();},error:e=>{this.ocupado.set(false);this.erro.set(mensagemApi(e,'Não foi possível salvar equipe.'));}});}
 abrir(e:Equipe){this.equipe.set(e);this.paginaMembros=0;this.form=null;this.carregarMembros();}
 carregarMembros(){const e=this.equipe();if(!e)return;this.detalhe?.unsubscribe();this.membros.set([]);this.detalhe=this.api.membros(e.id,this.paginaMembros).subscribe({next:p=>{this.membros.set(p.itens);this.totalMembros.set(p.total);},error:x=>this.erro.set(mensagemApi(x,'Não foi possível carregar participantes.'))});}
 paginarMembros(delta:number){this.paginaMembros+=delta;this.carregarMembros();}
 pesquisar(){this.buscaPessoas?.unsubscribe();this.pessoaId='';this.opcoes.set([]);if(this.buscaPessoa.trim().length<2)return;this.buscaPessoas=this.api.pessoas(this.buscaPessoa).subscribe({next:p=>this.opcoes.set(p),error:e=>this.erro.set(mensagemApi(e,'Não foi possível buscar pessoas.'))});}
 adicionar(){if(!this.pessoaId||this.ocupado()||!this.equipe())return;this.gravarMembro({pessoaId:this.pessoaId,papel:this.papel,ativo:true,versao:null});}
 alterar(m:Membro,papel:string,ativo:boolean){this.gravarMembro({pessoaId:m.pessoaId,papel,ativo,versao:m.versao});}
 private gravarMembro(d:{pessoaId:string;papel:string;ativo:boolean;versao:number|null}){const e=this.equipe();if(!e||this.ocupado())return;this.ocupado.set(true);this.escrita=this.api.membro(e.id,d).subscribe({next:()=>{this.ocupado.set(false);this.pessoaId='';this.carregarMembros();},error:x=>{this.ocupado.set(false);this.erro.set(mensagemApi(x,'Não foi possível alterar participante.'));}});}
 voltar(){this.detalhe?.unsubscribe();this.buscaPessoas?.unsubscribe();this.equipe.set(null);this.form=null;this.membros.set([]);this.opcoes.set([]);this.pessoaId='';}
 ngOnDestroy(){this.destruido=true;this.lista?.unsubscribe();this.detalhe?.unsubscribe();this.buscaPessoas?.unsubscribe();this.escrita?.unsubscribe();}
}
