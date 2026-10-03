import { AuthService } from '../../../core/auth/auth.service';
import { Router } from '@angular/router';
import { MfaComponent } from './mfa.component';
import { OlhoSenhaComponent } from '../../../shared/components/olho-senha/olho-senha.component';
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { mensagemApi } from '../../../core/api/api-error';
import { MascaraDirective } from '../../../shared/directives/mascara.directive';
import { formatarTelefone, telefoneValido } from '../../../shared/utils/formatos';
import { CabecalhoPaginaComponent } from '../../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { RodapeFormComponent } from '../../../shared/components/rodape-form/rodape-form.component';
import { AcessoApiService } from '../acesso-api.service';

@Component({
  selector: 'app-meu-perfil',
  imports: [MfaComponent, FormsModule, MascaraDirective, OlhoSenhaComponent, CabecalhoPaginaComponent, RodapeFormComponent],
  template: `
    <div class="w-full min-w-0 space-y-6">
      <app-cabecalho-pagina titulo="Meu perfil" [subtitulo]="perfilNome" />
      @if (erro) {
        <div class="rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ erro }}</div>
      }
      @if (aviso) {
        <div class="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{{ aviso }}</div>
      }
      @if (carregado) {
        <form class="space-y-6" (ngSubmit)="salvar()">
          <section class="card secao-form p-6">
            <h2 class="secao-titulo">Dados pessoais</h2>
            <div class="grade-form">
              <div><label class="label" for="mp-nome">Nome</label>
                <input id="mp-nome" class="field" name="nome" [(ngModel)]="nome" required></div>
              <div><label class="label" for="mp-email">E-mail</label>
                <input id="mp-email" class="field" [value]="email" disabled></div>
              <div><label class="label" for="mp-telefone">Telefone</label>
                <input id="mp-telefone" class="field" name="telefone" [(ngModel)]="telefone" #telCampo="ngModel"
                  appMascara="telefone" inputmode="tel" placeholder="(00) 00000-0000">
                @if (telCampo.touched && telefone.trim() && !telefoneValido(telefone)) {
                  <span class="mt-1 block text-xs font-normal text-red-600">Telefone inválido. Informe o DDD e o número.</span>
                }
              </div>
            </div>
          </section>
          <section class="card secao-form p-6">
            <h2 class="secao-titulo">Senha</h2>
            <div class="grade-form">
              <div><label class="label" for="mp-senha">Nova senha</label>
                <div class="relative"><input #campoSenha id="mp-senha" class="field pr-11" type="password" name="senha" [(ngModel)]="senha"
                  autocomplete="new-password"><app-olho-senha [campo]="campoSenha" /></div>
                <span class="mt-1 block text-xs text-slate-500">Deixe em branco para manter a atual.</span></div>
              <div><label class="label" for="mp-atual">Senha atual para trocar a senha</label>
                <div class="relative"><input #atualCampo id="mp-atual" class="field pr-11" type="password" name="senhaAtual" [(ngModel)]="senhaAtual" autocomplete="current-password"><app-olho-senha [campo]="atualCampo" /></div></div>
              <div><label class="label" for="mp-codigo">Código do autenticador ou recuperação, se ativo</label>
                <input id="mp-codigo" class="field" name="codigoMfa" [(ngModel)]="codigoMfa" autocomplete="one-time-code" maxlength="64"></div>
            </div>
          </section>
          <app-rodape-form voltarUrl="/dashboard" [carregando]="salvando" />
        </form>
        <app-mfa />
      }
    </div>
  `
})
export class MeuPerfilComponent implements OnInit, OnDestroy {
  private api = inject(AcessoApiService);
  private auth=inject(AuthService);
  private router=inject(Router);

  nome = '';
  email = '';
  telefone = '';
  senha = '';
  senhaAtual = '';
  codigoMfa = '';
  perfilNome = '';
  erro = '';
  aviso = '';
  carregado = false;
  salvando = false;
  readonly telefoneValido = telefoneValido;

  ngOnInit(): void {
    this.api.eu().subscribe({
      next: eu => {
        this.nome = eu.nome;
        this.email = eu.email;
        this.telefone = formatarTelefone(eu.telefone);
        this.perfilNome = eu.perfil;
        this.carregado = true;
      },
      error: erro => this.erro = mensagemApi(erro, 'Não foi possível carregar o perfil.')
    });
  }

  ngOnDestroy(): void {this.senha='';this.senhaAtual='';this.codigoMfa='';}

  salvar(): void {
    this.aviso = '';
    if (this.telefone.trim() && !telefoneValido(this.telefone)) {
      this.erro = 'Telefone inválido. Informe o DDD e o número.';
      return;
    }
    this.salvando = true;
    this.erro = '';
    const trocouSenha=!!this.senha;
    this.api.salvarEu({
      nome: this.nome,
      tipoTelefone: this.telefone ? 'CELULAR' : null,
      telefone: this.telefone || null,
      senha: this.senha || null,
      senhaAtual:this.senhaAtual || null,
      codigoMfa:this.codigoMfa || null
    }).subscribe({
      next: eu => {
        this.salvando = false;
        this.senha = '';
        this.senhaAtual='';this.codigoMfa='';
        this.perfilNome = eu.perfil;
        this.aviso = trocouSenha ? 'Senha alterada. Entre novamente.' : 'Perfil atualizado.';
        if(trocouSenha) void this.auth.logout().then(()=>this.router.navigate(['/login']));
      },
      error: erro => {
        this.salvando = false;
        this.senha='';this.senhaAtual='';this.codigoMfa='';
        this.erro = mensagemApi(erro, 'Não foi possível salvar.');
      }
    });
  }
}
