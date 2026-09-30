import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/auth/auth.service';
import { mensagemApi } from '../../../core/api/api-error';
import { ParoquiaApiService } from '../paroquia-api.service';
import { ContatoEmail, ContatoTelefone, Diocese, Endereco, ParoquiaRequest } from '../paroquia.models';
import { MascaraDirective } from '../../../shared/directives/mascara.directive';
import { OlhoSenhaComponent } from '../../../shared/components/olho-senha/olho-senha.component';
import { ComunicadosApiService } from '../../comunicacao/comunicados-api.service';
import { CepService } from '../../../shared/services/cep.service';
import { CabecalhoPaginaComponent } from '../../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { RodapeFormComponent } from '../../../shared/components/rodape-form/rodape-form.component';
import { UFS, cepValido, cnpjValido, emailValido, formatarCep, formatarCnpj, formatarTelefone, telefoneValido } from '../../../shared/utils/formatos';

const ENDERECO_VAZIO: Endereco = { cep: '', logradouro: '', numero: '', complemento: '', bairro: '', cidade: '', uf: '' };

/**
 * Dados da paróquia (GET/PUT /tenant). A diocese é só informativa: escolhe
 * uma já usada ou digita o nome; o back reaproveita a mesma diocese sem
 * diferenciar maiúsculas.
 */
@Component({
  selector: 'app-paroquia',
  imports: [FormsModule, MascaraDirective, OlhoSenhaComponent, CabecalhoPaginaComponent, RodapeFormComponent],
  template: `
    <div class="mx-auto max-w-3xl space-y-6">
      <app-cabecalho-pagina titulo="Paróquia" subtitulo="Nome, diocese, endereço e contatos que aparecem para a coordenação." />
      @if (erro) {
        <div class="rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ erro }}</div>
      }
      @if (aviso) {
        <div class="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{{ aviso }}</div>
      }
      @if (carregado) {
        <form class="space-y-6" (ngSubmit)="salvar()">
          <section class="card secao-form p-6">
            <h2 class="secao-titulo">Identificação</h2>
            <label class="block">
              <span class="label">Nome da paróquia *</span>
              <input class="field" name="nome" [(ngModel)]="nome" required>
            </label>
            <div class="grid gap-4 md:grid-cols-2">
              <label class="block">
                <span class="label">Razão social</span>
                <input class="field" name="razaoSocial" [(ngModel)]="razaoSocial">
              </label>
              <label class="block">
                <span class="label">CNPJ</span>
                <input class="field" name="cnpj" [(ngModel)]="cnpj" #cnpjCampo="ngModel" appMascara="cnpj" placeholder="00.000.000/0000-00">
                @if (cnpjCampo.touched && cnpj && !cnpjValido(cnpj)) { <span class="mt-1 block text-xs text-red-600">CNPJ inválido.</span> }
              </label>
            </div>
            <label class="block">
              <span class="label">Diocese</span>
              <input class="field" name="diocese" [(ngModel)]="diocese" list="lista-dioceses"
                placeholder="Ex.: Diocese de Cascavel" autocomplete="off">
              <datalist id="lista-dioceses">
                @for (d of dioceses; track d.id) {
                  <option [value]="d.nome"></option>
                }
              </datalist>
              <span class="mt-1 block text-xs text-slate-500">Escolha uma da lista ou digite o nome. Deixe em branco se não quiser informar.</span>
            </label>
          </section>

          <section class="card secao-form p-6">
            <h2 class="secao-titulo">Endereço</h2>
            <div class="grid gap-4 md:grid-cols-4">
              <label class="block"><span class="label">CEP</span>
                <input class="field" name="cep" [(ngModel)]="endereco.cep" appMascara="cep" inputmode="numeric" placeholder="00000-000"
                  (input)="buscarCep($any($event.target).value)">
                @if (avisoCep) { <span class="mt-1 block text-xs text-slate-500">{{ avisoCep }}</span> }
              </label>
              <label class="block md:col-span-2"><span class="label">Logradouro</span>
                <input class="field" name="logradouro" [(ngModel)]="endereco.logradouro" placeholder="Rua, avenida..."></label>
              <label class="block"><span class="label">Número</span>
                <input class="field" name="numero" [(ngModel)]="endereco.numero"></label>
              <label class="block"><span class="label">Complemento</span>
                <input class="field" name="complemento" [(ngModel)]="endereco.complemento"></label>
              <label class="block"><span class="label">Bairro</span>
                <input class="field" name="bairro" [(ngModel)]="endereco.bairro"></label>
              <label class="block"><span class="label">Cidade</span>
                <input class="field" name="cidade" [(ngModel)]="endereco.cidade"></label>
              <label class="block"><span class="label">UF</span>
                <select class="field" name="uf" [(ngModel)]="endereco.uf">
                  <option value="">—</option>
                  @for (uf of ufs; track uf) { <option [value]="uf">{{ uf }}</option> }
                </select></label>
            </div>
          </section>

          <section class="card secao-form p-6">
            <div class="secao-titulo flex items-center justify-between">
              <h2>E-mails</h2>
              <button type="button" class="btn-secondary !px-3 !py-1.5 text-xs font-bold cursor-pointer" (click)="addEmail()">＋ E-mail</button>
            </div>
            @for (e of emails; track $index; let i = $index) {
              <div class="grid items-end gap-3 md:grid-cols-[10rem_1fr_auto_auto]">
                <label class="block"><span class="label">Tipo</span>
                  <input class="field" [name]="'emailTipo' + i" [(ngModel)]="e.tipo"></label>
                <label class="block"><span class="label">E-mail</span>
                  <input class="field" type="email" [name]="'email' + i" [(ngModel)]="e.email" #emailCampo="ngModel" placeholder="nome@exemplo.com">
                  @if (emailCampo.touched && e.email.trim() && !emailValido(e.email)) { <span class="mt-1 block text-xs text-red-600">E-mail inválido.</span> }
                </label>
                <label class="flex items-center gap-2 pb-3 text-sm font-semibold">
                  <input type="radio" name="emailPrincipal" [checked]="e.principal" (change)="principalEmail(i)"> Principal
                </label>
                <button type="button" class="pb-3 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2 py-1 rounded-lg cursor-pointer" (click)="removerEmail(i)">🗑 Excluir</button>
              </div>
            } @empty {
              <p class="text-sm text-slate-500">Nenhum e-mail.</p>
            }
          </section>

          <section class="card secao-form p-6">
            <div class="secao-titulo flex items-center justify-between">
              <h2>Telefones</h2>
              <button type="button" class="btn-secondary !px-3 !py-1.5 text-xs font-bold cursor-pointer" (click)="addTelefone()">＋ Telefone</button>
            </div>
            @for (t of telefones; track $index; let i = $index) {
              <div class="grid items-end gap-3 md:grid-cols-[10rem_1fr_auto_auto]">
                <label class="block"><span class="label">Tipo</span>
                  <input class="field" [name]="'telTipo' + i" [(ngModel)]="t.tipo"></label>
                <label class="block"><span class="label">Número</span>
                  <input class="field" [name]="'tel' + i" [(ngModel)]="t.numero" #telCampo="ngModel" appMascara="telefone" inputmode="tel" placeholder="(00) 00000-0000">
                  @if (telCampo.touched && t.numero.trim() && !telefoneValido(t.numero)) { <span class="mt-1 block text-xs text-red-600">Telefone inválido. Informe o DDD e o número.</span> }
                </label>
                <label class="flex items-center gap-2 pb-3 text-sm font-semibold">
                  <input type="radio" name="telPrincipal" [checked]="t.principal" (change)="principalTelefone(i)"> Principal
                </label>
                <button type="button" class="pb-3 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2 py-1 rounded-lg cursor-pointer" (click)="removerTelefone(i)">🗑 Excluir</button>
              </div>
            } @empty {
              <p class="text-sm text-slate-500">Nenhum telefone.</p>
            }
          </section>

          <app-rodape-form voltarUrl="/dashboard" [carregando]="salvando" [desabilitado]="!nome.trim()" />
        </form>
      }

      <section class="card secao-form p-6" data-secao-whatsapp>
        <div>
          <h2 class="secao-titulo">WhatsApp (Evolution Go)</h2>
          <p class="mt-2 text-sm text-slate-500">A instância é criada e conectada (QR Code) no painel do Evolution Go. Aqui você só informa o nome e o token dela.</p>
        </div>
        @if (zapErro) { <div class="rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ zapErro }}</div> }
        @if (zapAviso) { <div class="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">{{ zapAviso }}</div> }
        <div class="grid gap-4 md:grid-cols-2">
          <div><label class="label" for="zap-instancia">Instância *</label>
            <input id="zap-instancia" class="field" maxlength="120" [(ngModel)]="zapInstancia" name="zapInstancia"></div>
          <div><label class="label" for="zap-token">Token</label>
            <div class="relative"><input #zapTokenCampo id="zap-token" type="password" class="field pr-11" maxlength="300" autocomplete="off"
              [(ngModel)]="zapToken" name="zapToken" [placeholder]="zapTokenConfigurado ? '•••• configurado' : ''">
              <app-olho-senha [campo]="zapTokenCampo" /></div>
            @if (zapTokenConfigurado) { <p class="mt-1 text-xs text-slate-500">Deixe vazio para manter o token atual.</p> }
          </div>
        </div>
        <label class="flex items-center gap-2 font-semibold text-slate-700">
          <input type="checkbox" class="h-4 w-4" [(ngModel)]="zapAtivo" name="zapAtivo"> Ativo (usar nos comunicados)
        </label>
        <div class="flex flex-wrap items-end justify-between gap-3">
          <div class="flex items-end gap-2">
            <div><label class="label" for="zap-teste">Telefone para teste</label>
              <input id="zap-teste" class="field" appMascara="telefone" [(ngModel)]="zapTelefoneTeste" name="zapTelefoneTeste" placeholder="(45) 99999-8888"></div>
            <button type="button" class="btn-secondary" [disabled]="zapOcupado || !zapTelefoneTeste.trim() || !zapTokenConfigurado" (click)="testarWhatsapp()">Enviar teste</button>
          </div>
          <button type="button" class="btn-primary" [disabled]="zapOcupado || !zapInstancia.trim()" (click)="salvarWhatsapp()">Salvar WhatsApp</button>
        </div>
      </section>
    </div>
  `
})
export class ParoquiaComponent implements OnInit {
  private api = inject(ParoquiaApiService);
  private auth = inject(AuthService);
  private cepService = inject(CepService);
  private comunicados = inject(ComunicadosApiService);

  zapInstancia = '';
  zapToken = '';
  zapAtivo = false;
  zapTokenConfigurado = false;
  zapTelefoneTeste = '';
  zapOcupado = false;
  zapErro = '';
  zapAviso = '';

  endereco: Endereco = { ...ENDERECO_VAZIO };
  avisoCep = '';
  readonly ufs = UFS;
  nome = '';
  razaoSocial = '';
  cnpj = '';
  diocese = '';
  emails: ContatoEmail[] = [];
  telefones: ContatoTelefone[] = [];
  dioceses: Diocese[] = [];
  erro = '';
  aviso = '';
  carregado = false;
  salvando = false;
  readonly cnpjValido = cnpjValido;
  readonly emailValido = emailValido;
  readonly telefoneValido = telefoneValido;

  ngOnInit(): void {
    this.api.buscar().subscribe({
      next: p => {
        this.nome = p.nome;
        this.razaoSocial = p.razaoSocial || '';
        this.cnpj = formatarCnpj(p.cnpj);
        this.diocese = p.diocese || '';
        this.emails = p.emails.map(e => ({ ...e }));
        this.telefones = p.telefones.map(t => ({ ...t, numero: formatarTelefone(t.numero) }));
        this.endereco = paraTela(p.endereco);
        this.carregado = true;
      },
      error: erro => this.erro = mensagemApi(erro, 'Não foi possível carregar a paróquia.')
    });
    this.api.dioceses().subscribe({ next: lista => this.dioceses = lista, error: () => this.dioceses = [] });
    void this.carregarWhatsapp();
  }

  async carregarWhatsapp(): Promise<void> {
    try {
      const c = await this.comunicados.whatsapp();
      this.zapInstancia = c.instancia;
      this.zapAtivo = c.ativo;
      this.zapTokenConfigurado = c.tokenConfigurado;
    } catch (e: any) {
      this.zapErro = e.message;
    }
  }

  async salvarWhatsapp(): Promise<void> {
    this.zapOcupado = true;
    this.zapErro = '';
    this.zapAviso = '';
    try {
      const c = await this.comunicados.salvarWhatsapp(this.zapInstancia.trim(), this.zapToken.trim(), this.zapAtivo);
      this.zapTokenConfigurado = c.tokenConfigurado;
      this.zapToken = '';
      this.zapAviso = 'WhatsApp salvo.';
    } catch (e: any) {
      this.zapErro = e.message;
    } finally {
      this.zapOcupado = false;
    }
  }

  async testarWhatsapp(): Promise<void> {
    this.zapOcupado = true;
    this.zapErro = '';
    this.zapAviso = '';
    try {
      await this.comunicados.testarWhatsapp(this.zapTelefoneTeste);
      this.zapAviso = 'Mensagem de teste enviada. Confira no WhatsApp.';
    } catch (e: any) {
      this.zapErro = e.message;
    } finally {
      this.zapOcupado = false;
    }
  }

  addEmail(): void {
    this.emails.push({ tipo: 'Secretaria', email: '', principal: this.emails.length === 0 });
  }

  addTelefone(): void {
    this.telefones.push({ tipo: 'Secretaria', numero: '', principal: this.telefones.length === 0 });
  }

  removerEmail(i: number): void {
    this.emails.splice(i, 1);
  }

  removerTelefone(i: number): void {
    this.telefones.splice(i, 1);
  }

  principalEmail(i: number): void {
    this.emails.forEach((e, j) => e.principal = j === i);
  }

  principalTelefone(i: number): void {
    this.telefones.forEach((t, j) => t.principal = j === i);
  }

  /** CEP completo preenche logradouro, bairro, cidade e UF (número e complemento ficam com a pessoa). */
  async buscarCep(valor: string): Promise<void> {
    this.avisoCep = '';
    if (!cepValido(valor)) return;
    this.avisoCep = 'Buscando endereço…';
    const achado = await this.cepService.buscar(valor);
    if (!achado) {
      this.avisoCep = 'CEP não encontrado. Preencha o endereço.';
      return;
    }
    this.avisoCep = '';
    if (achado.logradouro) this.endereco.logradouro = achado.logradouro;
    if (achado.bairro) this.endereco.bairro = achado.bairro;
    if (achado.cidade) this.endereco.cidade = achado.cidade;
    if (achado.uf) this.endereco.uf = achado.uf;
  }

  salvar(): void {
    this.aviso = '';
    this.erro = problemaNosDados(this) ?? '';
    if (this.erro) return;
    this.salvando = true;
    this.api.salvar(montarRequisicao(this)).subscribe({
      next: p => {
        this.salvando = false;
        this.diocese = p.diocese || '';
        this.emails = p.emails.map(e => ({ ...e }));
        this.telefones = p.telefones.map(t => ({ ...t }));
        this.endereco = paraTela(p.endereco);
        this.auth.atualizarTenantNome(p.nome);
        this.aviso = 'Dados da paróquia salvos.';
        this.api.dioceses().subscribe({ next: lista => this.dioceses = lista, error: () => undefined });
      },
      error: erro => {
        this.salvando = false;
        this.erro = mensagemApi(erro, 'Não foi possível salvar a paróquia.');
      }
    });
  }
}

/** Mesmas regras da API: o primeiro problema, ou null. */
export function problemaNosDados(f: {
  cnpj: string; emails: ContatoEmail[]; telefones: ContatoTelefone[]; endereco?: Endereco;
}): string | null {
  if (f.cnpj.trim() && !cnpjValido(f.cnpj)) return 'CNPJ inválido.';
  const cep = f.endereco?.cep?.trim();
  if (cep && !cepValido(cep)) return 'CEP inválido.';
  if (f.emails.some(e => e.email.trim() && !emailValido(e.email))) return 'Há um e-mail inválido.';
  if (f.telefones.some(t => t.numero.trim() && !telefoneValido(t.numero))) {
    return 'Há um telefone inválido. Informe o DDD e o número.';
  }
  return null;
}

/**
 * Linhas vazias ficam de fora; se sobrou contato e nenhum marcado como
 * principal, o primeiro vira principal (o back exige exatamente um).
 */
export function montarRequisicao(f: {
  nome: string; razaoSocial: string; cnpj: string; diocese: string;
  emails: ContatoEmail[]; telefones: ContatoTelefone[]; endereco?: Endereco;
}): ParoquiaRequest {
  const vazioParaNulo = (v: string) => v.trim() ? v.trim() : null;
  const e = f.endereco ?? ENDERECO_VAZIO;
  const emails = f.emails
    .filter(e => e.email.trim())
    .map(e => ({ tipo: e.tipo.trim() || 'E-mail', email: e.email.trim(), principal: e.principal }));
  const telefones = f.telefones
    .filter(t => t.numero.trim())
    .map(t => ({ tipo: t.tipo.trim() || 'Telefone', numero: t.numero.trim(), principal: t.principal }));
  for (const lista of [emails, telefones] as { principal: boolean }[][]) {
    if (lista.length && !lista.some(c => c.principal)) lista[0].principal = true;
  }
  return {
    nome: f.nome.trim(),
    razaoSocial: vazioParaNulo(f.razaoSocial),
    cnpj: vazioParaNulo(f.cnpj),
    diocese: vazioParaNulo(f.diocese),
    emails,
    telefones,
    endereco: {
      cep: vazioParaNulo(e.cep ?? ''), logradouro: vazioParaNulo(e.logradouro ?? ''), numero: vazioParaNulo(e.numero ?? ''),
      complemento: vazioParaNulo(e.complemento ?? ''), bairro: vazioParaNulo(e.bairro ?? ''),
      cidade: vazioParaNulo(e.cidade ?? ''), uf: vazioParaNulo(e.uf ?? '')
    }
  };
}

/** Endereço da API (nulos) para os campos da tela (texto). */
function paraTela(e: Endereco | null): Endereco {
  return {
    cep: formatarCep(e?.cep ?? ''), logradouro: e?.logradouro ?? '', numero: e?.numero ?? '',
    complemento: e?.complemento ?? '', bairro: e?.bairro ?? '', cidade: e?.cidade ?? '', uf: e?.uf ?? ''
  };
}
