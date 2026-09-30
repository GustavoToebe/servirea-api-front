import { NumeroComponent } from '../../../shared/components/numero/numero.component';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { mensagemApi } from '../../../core/api/api-error';
import { MascaraDirective } from '../../../shared/directives/mascara.directive';
import { emailValido, formatarTelefone, telefoneValido } from '../../../shared/utils/formatos';
import { AcessoApiService } from '../acesso-api.service';
import { Perfil, UsuarioParoquia } from '../acesso.models';
import { CabecalhoPaginaComponent } from '../../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { BarraFiltrosComponent } from '../../../shared/components/barra-filtros/barra-filtros.component';
import { EstadoListaComponent } from '../../../shared/components/estado-lista/estado-lista.component';
import { OpcaoSelectBusca, SelectBuscaComponent } from '../../../shared/components/select-busca/select-busca.component';
import { RodapeFormComponent } from '../../../shared/components/rodape-form/rodape-form.component';

@Component({
  selector: 'app-usuarios-paroquia',
  imports: [FormsModule, MascaraDirective, NumeroComponent, CabecalhoPaginaComponent, BarraFiltrosComponent, EstadoListaComponent,
    SelectBuscaComponent, RodapeFormComponent],
  template: `
    <div class="space-y-6">
      <app-cabecalho-pagina titulo="Usuários" subtitulo="Quem entra nesta paróquia. A senha chega por convite, não por este formulário.">
        <button acoes type="button" class="btn-primary" (click)="novo()">＋ Convidar</button>
      </app-cabecalho-pagina>

      @if (aviso) {
        <div class="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{{ aviso }}</div>
      }
      @if (erro) {
        <div class="rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ erro }}</div>
      }

      <app-barra-filtros placeholder="Buscar por nome ou e-mail" [termo]="busca" (termoChange)="filtrar($event)" [temFiltros]="false" (buscar)="filtrar(busca)" />

      <div class="tabela-rolagem">
        <table class="tabela">
          <thead><tr><th>Nome</th><th class="hidden md:table-cell">E-mail</th><th>Perfil</th><th>Situação</th></tr></thead>
          <tbody>
            @for (usuario of visiveis; track usuario.usuarioId) {
              <tr class="clicavel" tabindex="0" (click)="editar(usuario)" (keydown.enter)="editar(usuario)" [attr.data-usuario]="usuario.usuarioId">
                <td class="font-extrabold">{{ usuario.nome }}</td>
                <td class="hidden md:table-cell">{{ usuario.email }}</td>
                <td>{{ usuario.perfilNome }}</td>
                <td class="text-xs font-bold uppercase tracking-wide text-slate-500">{{ usuario.ativo ? usuario.situacaoAcesso.replaceAll('_', ' ') : 'Inativo' }}</td>
              </tr>
            }
          </tbody>
        </table>
        <app-estado-lista [carregando]="carregando" [vazio]="!carregando && !visiveis.length" />
      </div>

      @if (form) {
        <form class="card space-y-4 p-5" (ngSubmit)="salvar()">
          <h2 class="text-lg font-black">{{ form.usuarioId ? 'Editar usuário' : 'Convidar usuário' }}<app-numero [numero]="form.sequencial" /></h2>
          @if (form.somenteLeitura) {
            <p class="text-sm text-slate-500">Nome, e-mail e telefone pertencem a alguém que também acessa outra paróquia. Aqui dá para mudar o perfil e se está ativo.</p>
          }
          <label class="block text-sm font-semibold">Nome
            <input class="mt-1 w-full rounded-xl border px-3 py-2" name="nome" [(ngModel)]="form.nome" [disabled]="form.somenteLeitura" required>
          </label>
          <label class="block text-sm font-semibold">E-mail
            <input class="mt-1 w-full rounded-xl border px-3 py-2" type="email" name="email" [(ngModel)]="form.email" [disabled]="form.somenteLeitura" required
              #emailCampo="ngModel" placeholder="nome@exemplo.com">
            @if (emailCampo.touched && form.email.trim() && !emailValido(form.email)) {
              <span class="mt-1 block text-xs font-normal text-red-600">E-mail inválido.</span>
            }
          </label>
          <label class="block text-sm font-semibold">Telefone
            <input class="mt-1 w-full rounded-xl border px-3 py-2" name="telefone" [(ngModel)]="form.telefone" [disabled]="form.somenteLeitura"
              #telCampo="ngModel" appMascara="telefone" inputmode="tel" placeholder="(00) 00000-0000">
            @if (telCampo.touched && form.telefone.trim() && !telefoneValido(form.telefone)) {
              <span class="mt-1 block text-xs font-normal text-red-600">Telefone inválido. Informe o DDD e o número.</span>
            }
          </label>
          <div class="block text-sm font-semibold">Perfil
            <app-select-busca class="mt-1 block" name="perfilId" [(ngModel)]="form.perfilId" [opcoes]="opcoesPerfil" placeholder="Escolha o perfil" [limpavel]="false" />
          </div>
          <label class="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" name="ativo" [(ngModel)]="form.ativo">
            Ativo
          </label>
          <app-rodape-form [carregando]="salvando" (cancelar)="form = null">
            @if (form.usuarioId) {
              <button class="btn-secondary" type="button" (click)="reenviar()">Reenviar convite</button>
            }
          </app-rodape-form>
        </form>
      }
    </div>
  `
})
export class UsuariosComponent implements OnInit {
  private api = inject(AcessoApiService);

  usuarios: UsuarioParoquia[] = [];
  /** Lista filtrada pela busca local (recalculada só quando a busca ou os dados mudam). */
  visiveis: UsuarioParoquia[] = [];
  busca = '';
  carregando = true;
  perfis: Perfil[] = [];
  opcoesPerfil: OpcaoSelectBusca[] = [];
  erro = '';
  aviso = '';
  salvando = false;
  readonly emailValido = emailValido;
  readonly telefoneValido = telefoneValido;
  form: {
    usuarioId?: string;
    nome: string;
    email: string;
    telefone: string;
    perfilId: string;
    ativo: boolean;
    sequencial?: number;
    somenteLeitura: boolean;
  } | null = null;

  ngOnInit(): void {
    this.api.perfis().subscribe({
      next: lista => {
        this.perfis = lista.filter(p => p.ativo);
        this.opcoesPerfil = this.perfis.map(p => ({ valor: p.id, rotulo: p.nome }));
      },
      error: () => this.perfis = []
    });
    this.carregar();
  }

  novo(): void {
    this.erro = '';
    this.aviso = '';
    this.form = { nome: '', email: '', telefone: '', perfilId: this.perfis[0]?.id || '', ativo: true, somenteLeitura: false };
  }

  editar(usuario: UsuarioParoquia): void {
    this.erro = '';
    this.aviso = '';
    this.form = {
      usuarioId: usuario.usuarioId,
      nome: usuario.nome,
      email: usuario.email,
      telefone: formatarTelefone(usuario.telefone),
      perfilId: usuario.perfilId || '',
      ativo: usuario.ativo,
      sequencial: usuario.sequencial,
      somenteLeitura: usuario.somenteLeitura
    };
  }

  salvar(): void {
    if (!this.form) return;
    if (!this.form.somenteLeitura) {
      if (!emailValido(this.form.email)) {
        this.erro = 'E-mail inválido.';
        return;
      }
      if (this.form.telefone.trim() && !telefoneValido(this.form.telefone)) {
        this.erro = 'Telefone inválido. Informe o DDD e o número.';
        return;
      }
    }
    this.salvando = true;
    this.erro = '';
    this.api.salvarUsuario({
      nome: this.form.nome,
      email: this.form.email,
      tipoTelefone: this.form.telefone ? 'CELULAR' : null,
      telefone: this.form.telefone || null,
      perfilId: this.form.perfilId,
      ativo: this.form.ativo
    }, this.form.usuarioId).subscribe({
      next: () => {
        this.salvando = false;
        this.form = null;
        this.aviso = 'Convite registrado.';
        this.carregar();
      },
      error: erro => {
        this.salvando = false;
        this.erro = mensagemApi(erro, 'Não foi possível salvar o usuário.');
      }
    });
  }

  reenviar(): void {
    if (!this.form?.usuarioId) return;
    this.api.reenviarConvite(this.form.usuarioId).subscribe({
      next: () => this.aviso = 'Convite reenviado.',
      error: erro => this.erro = mensagemApi(erro, 'Não foi possível reenviar o convite.')
    });
  }

  filtrar(termo: string): void {
    this.busca = termo;
    const t = termo.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
    this.visiveis = !t ? this.usuarios : this.usuarios.filter(u =>
      `${u.nome} ${u.email}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().includes(t));
  }

  private carregar(): void {
    this.carregando = true;
    this.api.usuarios().subscribe({
      next: lista => { this.usuarios = lista; this.filtrar(this.busca); this.carregando = false; },
      error: erro => { this.erro = mensagemApi(erro, 'Não foi possível carregar os usuários.'); this.carregando = false; }
    });
  }
}
