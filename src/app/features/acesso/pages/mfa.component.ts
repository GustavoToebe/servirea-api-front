import { Component, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../core/auth/auth.service';
import { mensagemApi } from '../../../core/api/api-error';
import { OlhoSenhaComponent } from '../../../shared/components/olho-senha/olho-senha.component';

@Component({
 selector:'app-mfa', imports:[FormsModule,OlhoSenhaComponent], changeDetection:ChangeDetectionStrategy.OnPush,
 template:`<section class="card secao-form p-6">
 <h2 class="secao-titulo">Verificação em duas etapas</h2>
 <p class="text-sm">Proteja sua conta com um aplicativo autenticador. O código muda a cada 30 segundos.</p>
 @if(erro){<p role="alert" class="text-red-700">{{erro}}</p>}
 @if(recuperacao.length){
 <p>Guarde estes códigos em um lugar seguro. Cada um funciona uma vez e não será exibido novamente.</p>
 <pre class="overflow-auto select-all">{{recuperacao.join('\n')}}</pre>
 <button type="button" class="btn-primary" (click)="sair()">Guardei os códigos e vou entrar novamente</button>
 } @else if(status){
 <p class="text-sm">{{status.ativo ? 'Proteção ativa' : 'Proteção desativada'}} · {{status.codigosRestantes}} códigos restantes</p>
 @if(!status.configurado){<p>O administrador precisa configurar as chaves de proteção no servidor.</p>}
 <form (ngSubmit)="acao(status.ativo ? 'desativar' : segredo ? 'ativar' : 'preparar')" class="mt-4 space-y-3">
 <div><label class="label" for="mfa-senha">Senha atual</label>
 <div class="relative"><input #senhaCampo id="mfa-senha" class="field pr-11" type="password" name="mfaSenha" [(ngModel)]="senha" autocomplete="current-password" required maxlength="72"><app-olho-senha [campo]="senhaCampo" /></div></div>
 @if(segredo){<p>Cadastre manualmente no autenticador: conta Servirea, TOTP, seis dígitos, intervalo de 30 segundos.</p>
 <p class="break-all font-mono select-all">{{segredo}}</p><p>Preparação válida por dez minutos.</p>}
 @if(status.ativo || segredo){<div><label class="label" for="mfa-codigo">Código do autenticador{{status.ativo ? ' ou de recuperação' : ''}}</label>
 <input id="mfa-codigo" class="field" name="mfaCodigo" [(ngModel)]="codigo" autocomplete="one-time-code" required maxlength="64"></div>}
 <button class="btn-primary" type="submit" [disabled]="ocupado || !status.configurado || !senha || ((status.ativo || !!segredo) && !codigo)">
 {{ocupado ? 'Aguarde...' : status.ativo ? 'Desativar proteção e sair' : segredo ? 'Confirmar ativação' : 'Preparar autenticador'}}</button>
 @if(status.ativo){<button class="btn-secondary" type="button" [disabled]="ocupado || !senha || !codigo" (click)="acao('recuperacao')">Gerar novos códigos e encerrar sessões</button>}
 </form>}
 </section>`
})
export class MfaComponent implements OnInit,OnDestroy {
 private http=inject(HttpClient);private cd=inject(ChangeDetectorRef);private auth=inject(AuthService);private router=inject(Router);
 status:{ativo:boolean;configurado:boolean;codigosRestantes:number}|null=null;
 senha='';codigo='';segredo='';recuperacao:string[]=[];erro='';ocupado=false;private destruido=false;
 async ngOnInit(){try{const s=await firstValueFrom(this.http.get<NonNullable<typeof this.status>>(`${environment.apiUrl}/me/mfa`));if(!this.destruido)this.status=s;}catch(e){if(!this.destruido)this.erro=mensagemApi(e,'Não foi possível consultar a proteção.');}finally{if(!this.destruido)this.cd.markForCheck();}}
 async acao(tipo:'preparar'|'ativar'|'desativar'|'recuperacao'){
  if(this.ocupado)return;this.ocupado=true;this.erro='';
  try{
   if(tipo==='preparar'){const r=await firstValueFrom(this.http.post<{segredo:string}>(`${environment.apiUrl}/me/mfa/preparar`,{senha:this.senha}));if(!this.destruido)this.segredo=r.segredo;}
   else if(tipo==='ativar' || tipo==='recuperacao'){const r=await firstValueFrom(this.http.post<{codigos:string[]}>(`${environment.apiUrl}/me/mfa/${tipo}`,{senha:this.senha,codigo:this.codigo}));if(!this.destruido){this.recuperacao=r.codigos;this.segredo='';}}
   else {await firstValueFrom(this.http.post(`${environment.apiUrl}/me/mfa/desativar`,{senha:this.senha,codigo:this.codigo}));await this.sair();}
  }catch(e){if(!this.destruido)this.erro=mensagemApi(e,'Não foi possível alterar a proteção.');}
  finally{this.senha='';this.codigo='';this.ocupado=false;if(!this.destruido)this.cd.markForCheck();}
 }
 async sair(){this.limpar();await this.auth.logout();await this.router.navigate(['/login']);}
 private limpar(){this.senha='';this.codigo='';this.segredo='';this.recuperacao=[];}
 ngOnDestroy(){this.destruido=true;this.limpar();}
}
