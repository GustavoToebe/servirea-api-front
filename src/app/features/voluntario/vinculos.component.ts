import { ChangeDetectionStrategy,Component,OnInit,OnDestroy,inject,signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { PastoraisApiService,PessoaOpcao } from '../pastorais/pastorais-api.service';
import { AcessoApiService } from '../acesso/acesso-api.service';
import { UsuarioParoquia } from '../acesso/acesso.models';
import { mensagemApi } from '../../core/api/api-error';
import { DialogoService } from '../../shared/services/dialogo.service';
import { CabecalhoPaginaComponent } from '../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
@Component({selector:'app-vinculos',imports:[FormsModule,RouterLink,CabecalhoPaginaComponent],changeDetection:ChangeDetectionStrategy.OnPush,template:`
 <div class="space-y-5"><app-cabecalho-pagina titulo="Usuários e pessoas" subtitulo="Defina explicitamente qual pessoa acessa seus próprios compromissos."><a acoes routerLink="/usuarios" class="btn-secondary">Voltar aos usuários</a></app-cabecalho-pagina>
 @if(erro()){<div class="card bg-red-50 p-4 text-red-700" role="alert">{{erro()}}</div>}<section class="card space-y-3 p-5"><label class="label" for="v-usuario">Usuário</label><select id="v-usuario" class="field w-full" [disabled]="ocupado()" [(ngModel)]="usuarioId" (ngModelChange)="consultar()"><option value="">Selecione</option>@for(u of usuarios();track u.usuarioId){<option [value]="u.usuarioId">{{u.nome}} · {{u.email}}</option>}</select>
 @if(usuarioId){<p>{{nomeAtual() || 'Sem pessoa vinculada'}}</p><label class="label" for="v-busca">Buscar pessoa (mínimo 2 letras)</label><input id="v-busca" class="field w-full" maxlength="120" [(ngModel)]="busca"><button type="button" class="btn-secondary" [disabled]="ocupado()" (click)="pesquisar()">Buscar</button><label class="label" for="v-pessoa">Pessoa</label><select id="v-pessoa" class="field w-full" [(ngModel)]="pessoaId" [disabled]="ocupado()"><option value="">Selecione</option>@for(p of opcoes();track p.id){<option [value]="p.id">{{p.nome}}</option>}</select><button type="button" class="btn-primary" [disabled]="!pessoaId || ocupado()" (click)="salvar(pessoaId)">Vincular pessoa</button><button type="button" class="btn-danger" [disabled]="ocupado()" (click)="salvar(null)">Remover vínculo</button><p class="text-sm text-slate-500">Vincular dá acesso aos compromissos dessa pessoa. A mudança revoga o calendário anterior. Uma pessoa só pode estar vinculada a um usuário nesta paróquia.</p>}
 </section></div>`})
export class VinculosComponent implements OnInit,OnDestroy {
 private readonly api=inject(PastoraisApiService);private readonly acesso=inject(AcessoApiService);private readonly dialogo=inject(DialogoService);private lista?:Subscription;private leitura?:Subscription;private pesquisa?:Subscription;private escrita?:Subscription;private destruido=false;
 readonly usuarios=signal<UsuarioParoquia[]>([]);readonly opcoes=signal<PessoaOpcao[]>([]);readonly erro=signal('');readonly ocupado=signal(false);readonly nomeAtual=signal('');usuarioId='';pessoaId='';busca='';
 ngOnInit(){this.lista=this.acesso.usuarios().subscribe({next:u=>this.usuarios.set(u),error:e=>this.erro.set(mensagemApi(e,'Não foi possível carregar usuários.'))});}
 consultar(){this.leitura?.unsubscribe();this.pesquisa?.unsubscribe();this.nomeAtual.set('');this.opcoes.set([]);this.pessoaId='';if(this.usuarioId)this.leitura=this.api.vinculo(this.usuarioId).subscribe({next:v=>this.nomeAtual.set(v.pessoaNome||''),error:e=>this.erro.set(mensagemApi(e,'Não foi possível consultar vínculo.'))});}
 pesquisar(){this.pesquisa?.unsubscribe();this.opcoes.set([]);this.pessoaId='';if(this.busca.trim().length<2)return;this.pesquisa=this.api.pessoas(this.busca).subscribe({next:p=>this.opcoes.set(p),error:e=>this.erro.set(mensagemApi(e,'Não foi possível buscar pessoas.'))});}
 async salvar(pessoa:string|null){if(this.ocupado()||!this.usuarioId)return;const usuario=this.usuarioId;if(!await this.dialogo.confirmar({mensagem:pessoa?'Vincular este usuário à pessoa selecionada e revogar o calendário anterior?':'Remover o vínculo e revogar o calendário anterior?',confirmar:pessoa?'Vincular':'Remover vínculo',perigo:!pessoa}))return;if(this.destruido||this.ocupado()||usuario!==this.usuarioId)return;this.ocupado.set(true);this.escrita=this.api.vincular(usuario,pessoa).subscribe({next:()=>{this.ocupado.set(false);this.consultar();},error:e=>{this.ocupado.set(false);this.erro.set(mensagemApi(e,'Não foi possível alterar vínculo.'));}});}
 ngOnDestroy(){this.destruido=true;this.lista?.unsubscribe();this.leitura?.unsubscribe();this.pesquisa?.unsubscribe();this.escrita?.unsubscribe();}
}
