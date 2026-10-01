import { SessaoAtual } from '../../../core/layout/sessao-atual';
import { CommonModule } from '@angular/common';
import { CuidadosComponent } from '../../../shared/components/cuidados/cuidados.component';
import { Component, ElementRef, OnInit, inject } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HasPendingChanges } from '../../../core/guards/pending-changes.guard';
import { Duplicidade, DuplicidadeRequest, FUNCOES_FORM, FUNCOES_LABEL, FuncaoEscala, PARENTESCOS, PARENTESCOS_DEPENDENTE, Pessoa, PessoaPapel, PessoaRequest, Relacao, RelacaoRequest, TIPO_LABEL, TIPOS_VOLUNTARIO, TipoVoluntario } from '../models/pessoa.model';
import { PessoasService } from '../services/pessoas.service';
import { VoluntariosApiService } from '../services/voluntarios-api.service';
import { readPhotoPreview, validatePhotoFile } from '../../../shared/utils/photo.utils';
import { MascaraDirective } from '../../../shared/directives/mascara.directive';
import { CampoDataComponent } from '../../../shared/components/datas/campo-data.component';
import { CabecalhoPaginaComponent } from '../../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { OpcaoSelectBusca, SelectBuscaComponent } from '../../../shared/components/select-busca/select-busca.component';
import { RodapeFormComponent } from '../../../shared/components/rodape-form/rodape-form.component';
import { DuplicidadesDialogComponent } from './duplicidades-dialog.component';
import { hojeIso } from '../../../shared/components/datas/datas';
import { CepService } from '../../../shared/services/cep.service';
import { SEXOS, UFS, cepValido, formatarCep, formatarCpf, formatarRg, formatarTelefone, normalizarSexo } from '../../../shared/utils/formatos';
import { Validar, erroDoCampo } from '../../../shared/utils/validadores';
import { focarPrimeiroInvalido } from '../../../shared/utils/foco';

@Component({
    selector: 'app-pessoa-form',
    imports: [CuidadosComponent, CommonModule, ReactiveFormsModule, RouterLink, MascaraDirective, CampoDataComponent, DuplicidadesDialogComponent, CabecalhoPaginaComponent, SelectBuscaComponent, RodapeFormComponent],
    template: `
    <app-duplicidades-dialog [open]="dialogOpen" [itens]="duplicidades" (fechar)="dialogOpen = false" (continuar)="confirmarSave()"></app-duplicidades-dialog>
    <div class="mx-auto max-w-5xl space-y-6">
      <app-cabecalho-pagina [titulo]="id ? 'Editar pessoa' : 'Nova pessoa'" subtitulo="Identidade primeiro. Papéis podem coexistir. Responsável é opcional.">
        <a acoes routerLink="/pessoas" class="btn-secondary">Voltar</a>
      </app-cabecalho-pagina>

      @if (loading) {
        <div class="card p-10 text-center text-slate-500">Carregando...</div>
      }
      @if (!loading) {
        <form [formGroup]="form" (ngSubmit)="save()" class="space-y-6">
          <section class="card p-6">
            <h2 class="mb-4 text-lg font-black">Identidade</h2>
            <div class="flex flex-col items-center gap-6 md:flex-row md:items-start">
            <div class="flex shrink-0 flex-col items-center gap-2" data-bloco="foto">
              <div class="relative h-36 w-36">
                @if (photoPreview) {
                  <img [src]="photoPreview" class="h-36 w-36 rounded-full object-cover ring-4 ring-[var(--line)]" alt="Foto de {{ form.get('nomeCompleto')?.value || 'pessoa' }}" data-foto="imagem">
                } @else {
                  <div class="flex h-36 w-36 items-center justify-center rounded-full text-4xl font-black ring-4 ring-[var(--line)]"
                    [style.background]="'color-mix(in srgb, var(--brand) 15%, transparent)'" [style.color]="'var(--brand)'" data-foto="iniciais">{{ iniciais }}</div>
                }
                @if (temPapel('VOLUNTARIO')) {
                  <label class="absolute bottom-1 right-1 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-white shadow-lg ring-4 ring-[var(--card,white)]"
                    [style.background]="'var(--brand)'" title="Trocar foto" data-foto="trocar">
                    <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13" r="3.5"/></svg>
                    <span class="sr-only">Trocar foto</span>
                    <input type="file" class="sr-only" accept="image/jpeg,image/png,image/webp,image/heic" (change)="onPhoto($event)">
                  </label>
                }
              </div>
              @if (erroFoto) {
                <p class="max-w-40 text-center text-xs text-red-600" data-foto="erro">{{ erroFoto }}</p>
              } @else if (!temPapel('VOLUNTARIO')) {
                <p class="max-w-40 text-center text-xs text-slate-500">A foto é do cadastro de voluntário.</p>
              }
            </div>
            <div class="grid w-full gap-4 md:grid-cols-2">
              <div class="md:col-span-2"><label class="label">Nome completo *</label><input class="field" formControlName="nomeCompleto">
                @if (form.get('nomeCompleto')?.invalid && form.get('nomeCompleto')?.touched) { <p class="mt-1 text-xs text-red-600">Informe o nome.</p> }</div>
              <div><label class="label">Nascimento</label><app-campo-data formControlName="dataNascimento" [max]="hoje" /></div>
              <div>
                <label class="label">Sexo</label>
                <select class="field" formControlName="sexo">
                  <option value="">—</option>
                  @for (s of sexos; track s) {
                    <option [value]="s">{{ s }}</option>
                  }
                </select>
              </div>
              <div>
                <label class="label">CPF</label>
                <input class="field" formControlName="cpf" appMascara="cpf" inputmode="numeric" placeholder="000.000.000-00">
                @if (erro(form.get('cpf')); as e) { <p class="mt-1 text-xs text-red-600">{{ e }}</p> }
              </div>
              <div>
                <label class="label">RG</label>
                <input class="field" formControlName="rg" appMascara="rg" placeholder="00.000.000-0">
                @if (erro(form.get('rg')); as e) { <p class="mt-1 text-xs text-red-600">{{ e }}</p> }
              </div>
            </div>
            </div>
          </section>
          <section class="card p-6">
            <h2 class="mb-4 text-lg font-black">Papéis</h2>
            <div class="flex flex-wrap gap-4">
              <label class="flex items-center gap-2"><input type="checkbox" (change)="togglePapel('VOLUNTARIO', $event)" [checked]="temPapel('VOLUNTARIO')" [disabled]="papeisOriginais.has('VOLUNTARIO')"> Voluntário (escala)</label>
              <label class="flex items-center gap-2"><input type="checkbox" (change)="togglePapel('RESPONSAVEL', $event)" [checked]="temPapel('RESPONSAVEL')" [disabled]="papeisOriginais.has('RESPONSAVEL')"> Responsável</label>
            </div>
            @if (papeisOriginais.size) {
              <p class="mt-2 text-xs text-slate-500">Dá para acrescentar papel; os que a pessoa já tem não podem ser removidos.</p>
            }
          </section>
          @if (sessao.permissoes().includes('PESSOA_CUIDADOS_ALTERAR')) { <app-cuidados formControlName="cuidados" [nome]="primeiroNome"></app-cuidados> }
          <section class="card p-6">
            <div class="mb-4 flex items-center justify-between"><h2 class="text-lg font-black">E-mails</h2><button type="button" class="btn-secondary" (click)="addEmail()">＋</button></div>
            <div formArrayName="emails" class="space-y-3">
              @for (g of emails.controls; track g; let i = $index) {
                <div [formGroupName]="i" class="grid gap-3 md:grid-cols-12">
                  <input class="field md:col-span-3" formControlName="tipo" placeholder="Tipo">
                  <div class="md:col-span-6">
                    <input class="field" type="email" formControlName="email" placeholder="nome@exemplo.com">
                    @if (erro(g.get('email')); as e) { <p class="mt-1 text-xs text-red-600">{{ e }}</p> }
                  </div>
                  <label class="flex items-center gap-2 md:col-span-2"><input type="checkbox" formControlName="principal"> Principal</label>
                  <button type="button" class="text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2 py-1 rounded-lg cursor-pointer" (click)="emails.removeAt(i)">🗑 Excluir</button>
                </div>
              }
            </div>
          </section>
          <section class="card p-6">
            <div class="mb-4 flex items-center justify-between"><h2 class="text-lg font-black text-[var(--ink)]">Telefones</h2><button type="button" class="btn-secondary" (click)="addTelefone()">＋</button></div>
            <div formArrayName="telefones" class="space-y-3">
              @for (g of telefones.controls; track g; let i = $index) {
                <div [formGroupName]="i" class="grid gap-3 md:grid-cols-12">
                  <input class="field md:col-span-3" formControlName="tipo" placeholder="Tipo">
                  <div class="md:col-span-6">
                    <input class="field" formControlName="numero" appMascara="telefone" inputmode="tel" placeholder="(00) 00000-0000">
                    @if (erro(g.get('numero')); as e) { <p class="mt-1 text-xs text-red-600">{{ e }}</p> }
                  </div>
                  <label class="flex items-center gap-2 md:col-span-2"><input type="checkbox" formControlName="principal"> Principal</label>
                  <button type="button" class="text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2 py-1 rounded-lg cursor-pointer" (click)="telefones.removeAt(i)">🗑 Excluir</button>
                </div>
              }
            </div>
          </section>
          @if (temPapel('VOLUNTARIO')) {
            <section class="card p-6">
              <div class="mb-2 flex items-center justify-between">
                <div>
                  <h2 class="text-lg font-black">Responsáveis</h2>
                  <p class="text-sm text-slate-500">Quem responde por esta pessoa. Opcional — adulto/ministro pode ficar sem. Escolha alguém já cadastrado como responsável ou cadastre um novo aqui.</p>
                </div>
                <button type="button" class="btn-secondary" (click)="addRelacao('responsaveis')">＋ Responsável</button>
              </div>
              <ng-container *ngTemplateOutlet="relacoesTpl; context: { $implicit: responsaveis, lado: 'responsaveis' }"></ng-container>
            </section>
          }
          @if (temPapel('RESPONSAVEL')) {
            <section class="card p-6">
              <div class="mb-2 flex items-center justify-between">
                <div>
                  <h2 class="text-lg font-black">Dependentes</h2>
                  <p class="text-sm text-slate-500">Voluntários por quem esta pessoa responde. O voluntário precisa estar cadastrado.</p>
                </div>
                <button type="button" class="btn-secondary" (click)="addRelacao('dependentes')">＋ Dependente</button>
              </div>
              <ng-container *ngTemplateOutlet="relacoesTpl; context: { $implicit: dependentes, lado: 'dependentes' }"></ng-container>
            </section>
          }
          <ng-template #relacoesTpl let-lista let-lado="lado">
            <div class="space-y-4">
              @for (g of $any(lista).controls; track g; let i = $index) {
                <div [formGroup]="$any(g)" class="rounded-2xl border border-slate-200 p-4">
                  <div class="grid gap-3 md:grid-cols-2">
                    <div class="md:col-span-2">
                      <label class="label">{{ lado === 'responsaveis' ? 'Responsável' : 'Dependente' }}</label>
                      <app-select-busca formControlName="pessoaId" [attr.data-relacao]="lado"
                        [opcoes]="lado === 'responsaveis' ? opcoesResponsaveis : opcoesDependentes"
                        [placeholder]="lado === 'responsaveis' ? 'Cadastrar novo responsável nesta ficha' : 'Escolha um voluntário'" />
                    </div>
                    @if (lado === 'responsaveis' && !g.get('pessoaId')?.value) {
                      <div class="md:col-span-2">
                        <label class="label">Nome do novo responsável *</label>
                        <input class="field" formControlName="nomeNovo">
                      </div>
                      <div>
                        <label class="label">E-mail</label>
                        <input class="field" type="email" formControlName="emailNovo" placeholder="nome@exemplo.com">
                        @if (erro(g.get('emailNovo')); as e) { <p class="mt-1 text-xs text-red-600">{{ e }}</p> }
                      </div>
                      <div>
                        <label class="label">Telefone</label>
                        <input class="field" formControlName="telefoneNovo" appMascara="telefone" inputmode="tel" placeholder="(00) 00000-0000">
                        @if (erro(g.get('telefoneNovo')); as e) { <p class="mt-1 text-xs text-red-600">{{ e }}</p> }
                      </div>
                    }
                    <div>
                      <label class="label">{{ lado === 'responsaveis' ? 'O responsável é *' : 'O dependente é *' }}</label>
                      <input class="field" formControlName="parentesco" [attr.list]="lado + '-par-' + i"
                        [placeholder]="lado === 'responsaveis' ? 'Mãe, Pai…' : 'Filho, Neta…'">
                        <datalist [id]="lado + '-par-' + i">
                          @for (p of (lado === 'responsaveis' ? parentescos : parentescosDependente); track p) {
                            <option [value]="p"></option>
                          }
                        </datalist>
                      </div>
                      <div>
                        <label class="label">Esta pessoa é</label>
                        <input class="field" formControlName="parentescoInverso"
                          [placeholder]="lado === 'responsaveis' ? 'Filho, Filha…' : 'Mãe, Pai…'">
                        </div>
                        <label class="flex items-center gap-2">
                          <input type="checkbox" formControlName="principal">
                          {{ lado === 'responsaveis' ? 'Responsável principal' : 'Sou o responsável principal' }}
                        </label>
                      </div>
                      <button type="button" class="mt-3 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 px-2 py-1 rounded-lg cursor-pointer" (click)="removerRelacao($any(lista), i)">🗑 Remover</button>
                    </div>
                  }
                  @if (!$any(lista).length) {
                    <p class="text-sm text-slate-400">Nenhum.</p>
                  }
                </div>
              </ng-template>
              <section class="card p-6">
                <h2 class="mb-4 text-lg font-black">Endereço</h2>
                <div class="grid gap-4 md:grid-cols-4">
                  <div>
                    <label class="label">CEP</label>
                    <input class="field" formControlName="cep" appMascara="cep" inputmode="numeric" placeholder="00000-000" (input)="buscarCep($any($event.target).value)">
                    @if (erro(form.get('cep')); as e) { <p class="mt-1 text-xs text-red-600">{{ e }}</p> }
                    @else if (avisoCep) { <p class="mt-1 text-xs text-slate-500">{{ avisoCep }}</p> }
                  </div>
                  <div class="md:col-span-2"><label class="label">Logradouro</label><input class="field" formControlName="logradouro"></div>
                  <div><label class="label">Número</label><input class="field" formControlName="numero"></div>
                  <div><label class="label">Complemento</label><input class="field" formControlName="complemento"></div>
                  <div><label class="label">Bairro</label><input class="field" formControlName="bairro"></div>
                  <div><label class="label">Cidade</label><input class="field" formControlName="cidade"></div>
                  <div>
                    <label class="label">UF</label>
                    <select class="field" formControlName="uf">
                      <option value="">—</option>
                      @for (uf of ufs; track uf) {
                        <option [value]="uf">{{ uf }}</option>
                      }
                    </select>
                  </div>
                </div>
              </section>
              @if (temPapel('VOLUNTARIO')) {
                <section class="card p-6" formGroupName="voluntario">
                  <h2 class="mb-4 text-lg font-black">Perfil de escala</h2>
                  <div class="grid gap-4 md:grid-cols-2">
                    <div>
                      <label class="label">Tipo *</label>
                      <select class="field" formControlName="tipo">
                        @for (t of tipos; track t) {
                          <option [value]="t">{{ tipoLabel[t] }}</option>
                        }
                      </select>
                    </div>
                    <div><label class="label">Catequese</label><input class="field" formControlName="etapaCatequese"></div>
                    <div>
                      <label class="label">Horário de estudo</label>
                      <select class="field" formControlName="horarioEstudo">
                        <option value="">—</option>
                        <option value="MANHA">Manhã</option>
                        <option value="TARDE">Tarde</option>
                        <option value="NOITE">Noite</option>
                      </select>
                    </div>
                    <div><label class="label">Eucaristia</label><input class="field" formControlName="eucaristiaAno"></div>
                    <div><label class="label">Crisma</label><input class="field" formControlName="crismaAno"></div>
                    <div><label class="label">Investidura do mandato</label><app-campo-data formControlName="mandatoInicio" /></div>
                    <div><label class="label">Vencimento do mandato</label><app-campo-data formControlName="mandatoFim" /></div>
                  </div>
                  <p class="mt-3 text-sm text-slate-500">O mandato vale sobretudo para o ministro da comunhão. As duas datas são opcionais.</p>
                  <div class="mt-4 grid gap-3 sm:grid-cols-3">
                    @for (f of funcoes; track f) {
                      <label class="flex items-center gap-2 rounded-xl border p-3">
                        <input type="checkbox" [checked]="hasFuncao(f)" (change)="toggleFuncao(f, $event)"> {{ funcaoLabel[f] }}
                      </label>
                    }
                  </div>
                  <label class="mt-4 flex items-center gap-2"><input type="checkbox" formControlName="autorizaWhatsapp"> Autoriza WhatsApp</label>
                </section>
              }
              <section class="card p-6">
                <label class="label">Observações</label>
                <textarea class="field min-h-28" formControlName="observacoes"></textarea>
              </section>
              @if (error) {
                <div class="rounded-xl bg-red-50 p-4 text-red-700">{{ error }}</div>
              }
              <app-rodape-form voltarUrl="/pessoas" [carregando]="saving" />
            </form>
          }
        </div>
    `
})
export class PessoaFormComponent implements OnInit, HasPendingChanges {
  readonly sessao = inject(SessaoAtual);
  readonly hoje = hojeIso();
  id: string | null = null;
  loading = true;
  saving = false;
  saved = false;
  error = '';
  dialogOpen = false;
  duplicidades: Duplicidade[] = [];
  photoFile: File | null = null;
  photoPreview: string | null = null;
  erroFoto = '';

  /** Sem foto, o círculo mostra as iniciais (primeiro e último nome). */
  get iniciais(): string {
    const partes = String(this.form.get('nomeCompleto')?.value || '').trim().split(/\s+/).filter(Boolean);
    if (!partes.length) return '?';
    const ultima = partes.length > 1 ? partes[partes.length - 1][0] : '';
    return (partes[0][0] + ultima).toUpperCase();
  }
  papeis = new Set<PessoaPapel>(['VOLUNTARIO']);
  /** Papéis que a pessoa já tinha — a API não deixa remover. */
  papeisOriginais = new Set<PessoaPapel>();
  pessoasCadastradas: Pessoa[] = [];
  /** Opções dos campos de responsável e dependente (com o número no detalhe), calculadas quando as pessoas chegam. */
  opcoesResponsaveis: OpcaoSelectBusca[] = [];
  opcoesDependentes: OpcaoSelectBusca[] = [];
  parentescos = PARENTESCOS;
  parentescosDependente = PARENTESCOS_DEPENDENTE;
  funcoes = FUNCOES_FORM;
  funcaoLabel = FUNCOES_LABEL;
  tipos: TipoVoluntario[] = TIPOS_VOLUNTARIO;
  tipoLabel = TIPO_LABEL;
  sexos = SEXOS;
  ufs = UFS;
  avisoCep = '';
  readonly erro = erroDoCampo;
  private cepService = inject(CepService);
  private host = inject(ElementRef<HTMLElement>);
  form: FormGroup = this.fb.group({
    nomeCompleto: ['', Validators.required],
    dataNascimento: [''],
    sexo: [''],
    cpf: ['', Validar.cpf],
    rg: ['', Validar.rg],
    emails: this.fb.array([this.emailGroup(true)]),
    telefones: this.fb.array([this.telefoneGroup(true)]),
    responsaveis: this.fb.array([]),
    dependentes: this.fb.array([]),
    cep: ['', Validar.cep],
    cidade: [''],
    uf: ['', Validar.uf],
    logradouro: [''],
    numero: [''],
    complemento: [''],
    bairro: [''],
    observacoes: [''],
    cuidados: [null],
    voluntario: this.fb.group({
      tipo: ['COROINHA'],
      etapaCatequese: [''],
      eucaristiaAno: [''],
      crismaAno: [''],
      horarioEstudo: [''],
      autorizaWhatsapp: [false],
      mandatoInicio: [''],
      mandatoFim: [''],
      funcoesHabilitadas: this.fb.control<FuncaoEscala[]>([])
    })
  });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private pessoas: PessoasService,
    private voluntarios: VoluntariosApiService
  ) {}

  get primeiroNome(): string { return (this.form.get('nomeCompleto')?.value || '').split(' ')[0]; }
  get emails(): FormArray { return this.form.get('emails') as FormArray; }
  get telefones(): FormArray { return this.form.get('telefones') as FormArray; }
  get responsaveis(): FormArray { return this.form.get('responsaveis') as FormArray; }
  get dependentes(): FormArray { return this.form.get('dependentes') as FormArray; }

  async ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');
    try {
      this.pessoasCadastradas = (await this.pessoas.listar()).filter(p => p.id !== this.id);
      const opcao = (p: Pessoa): OpcaoSelectBusca => ({ valor: p.id, rotulo: p.nomeCompleto, detalhe: p.sequencial ? `nº ${p.sequencial}` : undefined });
      this.opcoesResponsaveis = this.candidatos('responsaveis').map(opcao);
      this.opcoesDependentes = this.candidatos('dependentes').map(opcao);
      if (this.id) {
        const p = await this.pessoas.buscar(this.id);
        this.patch(p);
        if (p.voluntario?.fotoPath) {
          this.photoPreview = await this.voluntarios.fotoUrl(p.id);
        }
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Erro ao carregar.';
    } finally {
      this.loading = false;
    }
  }

  temPapel(papel: PessoaPapel): boolean {
    return this.papeis.has(papel);
  }

  togglePapel(papel: PessoaPapel, event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.checked) {
      this.papeis.add(papel);
    } else if (this.papeisOriginais.has(papel) || this.papeis.size === 1) {
      // Papel existente não pode ser removido (a API recusa) e sempre fica ao menos um.
      input.checked = true;
      return;
    } else {
      this.papeis.delete(papel);
    }
    this.form.markAsDirty();
  }

  /** Responsáveis só entre quem já tem o papel; dependentes só entre voluntários. */
  candidatos(lado: 'responsaveis' | 'dependentes'): Pessoa[] {
    const papel: PessoaPapel = lado === 'responsaveis' ? 'RESPONSAVEL' : 'VOLUNTARIO';
    return this.pessoasCadastradas.filter(p => p.papeis.includes(papel));
  }

  addEmail() { this.emails.push(this.emailGroup(false)); this.form.markAsDirty(); }
  addTelefone() { this.telefones.push(this.telefoneGroup(false)); this.form.markAsDirty(); }
  addRelacao(lado: 'responsaveis' | 'dependentes') {
    const lista = lado === 'responsaveis' ? this.responsaveis : this.dependentes;
    lista.push(this.relacaoGroup({ principal: lado === 'responsaveis' && lista.length === 0 }));
    this.form.markAsDirty();
  }

  removerRelacao(lista: FormArray, i: number) {
    lista.removeAt(i);
    this.form.markAsDirty();
  }

  hasFuncao(f: FuncaoEscala) {
    return (this.form.get('voluntario.funcoesHabilitadas')?.value || []).includes(f);
  }

  toggleFuncao(f: FuncaoEscala, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    const atual = [...(this.form.get('voluntario.funcoesHabilitadas')?.value || [])] as FuncaoEscala[];
    const next = checked ? [...new Set([...atual, f])] : atual.filter(x => x !== f);
    this.form.get('voluntario.funcoesHabilitadas')?.setValue(next);
    this.form.markAsDirty();
  }

  async onPhoto(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const invalid = validatePhotoFile(file);
    if (invalid) { this.erroFoto = invalid; return; }
    this.erroFoto = '';
    this.photoFile = file;
    this.photoPreview = await readPhotoPreview(file);
    this.form.markAsDirty();
  }

  /** CEP completo preenche logradouro, bairro, cidade e UF (o número fica com o usuário). */
  async buscarCep(valor: string) {
    this.avisoCep = '';
    if (!cepValido(valor)) return;
    this.avisoCep = 'Buscando endereço…';
    const endereco = await this.cepService.buscar(valor);
    if (!endereco) {
      this.avisoCep = 'CEP não encontrado. Preencha o endereço.';
      return;
    }
    this.avisoCep = '';
    const campos: Record<string, string> = {
      logradouro: endereco.logradouro, bairro: endereco.bairro, cidade: endereco.cidade, uf: endereco.uf
    };
    for (const [campo, valor] of Object.entries(campos)) {
      if (valor) this.form.get(campo)!.setValue(valor);
    }
    this.form.markAsDirty();
  }

  async save() {
    if (!this.papeis.size || this.form.get('nomeCompleto')?.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Informe o nome e pelo menos um papel.';
      focarPrimeiroInvalido(this.host.nativeElement);
      return;
    }
    const campos = ['cpf', 'rg', 'cep', 'uf', 'emails', 'telefones'];
    if (campos.some(c => this.form.get(c)?.invalid)) {
      campos.forEach(c => this.form.get(c)?.markAllAsTouched());
      this.error = 'Corrija os campos marcados em vermelho.';
      focarPrimeiroInvalido(this.host.nativeElement);
      return;
    }
    const listasVisiveis = [
      ...(this.papeis.has('VOLUNTARIO') ? [this.responsaveis] : []),
      ...(this.papeis.has('RESPONSAVEL') ? [this.dependentes] : [])
    ];
    if (listasVisiveis.some(lista => lista.invalid)) {
      listasVisiveis.forEach(lista => lista.markAllAsTouched());
      this.error = 'Preencha o parentesco (e e-mail e telefone válidos, se informados) em cada relação.';
      focarPrimeiroInvalido(this.host.nativeElement);
      return;
    }
    if (this.dependentes.controls.some(g => !g.get('pessoaId')?.value) && this.papeis.has('RESPONSAVEL')) {
      this.error = 'Escolha o voluntário de cada dependente (ou remova a linha).';
      return;
    }

    this.saving = true;
    this.error = '';

    const req = this.montarRequest();

    // Check duplicidades
    const dupReq: DuplicidadeRequest = {
      ignorarId: this.id,
      nomeCompleto: req.nomeCompleto,
      cpf: req.cpf,
      dataNascimento: req.dataNascimento,
      telefones: req.telefones.map(t => t.numero),
      nomesResponsaveis: []
    };

    if (this.papeis.has('VOLUNTARIO')) {
      for (const g of this.responsaveis.controls) {
        const pId = g.get('pessoaId')?.value;
        const pNome = g.get('nomeNovo')?.value;
        if (pId) {
          const respEncontrado = this.pessoasCadastradas.find(p => p.id === pId);
          if (respEncontrado) dupReq.nomesResponsaveis.push(respEncontrado.nomeCompleto);
        } else if (pNome) {
          dupReq.nomesResponsaveis.push(pNome);
        }
      }
    }

    try {
      const duplicidades = await this.pessoas.duplicidades(dupReq);
      if (duplicidades.length > 0) {
        this.duplicidades = duplicidades;
        this.dialogOpen = true;
        this.saving = false;
        return;
      }
    } catch (e) {
      // API error fetching duplicidades, continue saving anyway
    }

    await this.confirmarSave();
  }

  async confirmarSave() {
    this.dialogOpen = false;
    this.saving = true;
    this.error = '';
    try {
      const request = this.montarRequest();
      const foto = this.papeis.has('VOLUNTARIO') ? this.photoFile : null;
      const salvo = this.id
        ? await this.pessoas.atualizar(this.id, request, foto)
        : await this.pessoas.criar(request, foto);
      this.saved = true;
      await this.router.navigate(['/pessoas', salvo.id]);
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Não foi possível salvar.';
    } finally {
      this.saving = false;
    }
  }

  hasPendingChanges() {
    return !this.saved && (this.form.dirty || !!this.photoFile);
  }

  private emailGroup(principal: boolean) {
    return this.fb.group({ tipo: ['E-mail pessoal'], email: ['', Validar.email], principal: [principal] });
  }

  private telefoneGroup(principal: boolean) {
    return this.fb.group({ tipo: ['celular'], numero: ['', Validar.telefone], principal: [principal] });
  }

  private relacaoGroup(r: Partial<Relacao> = {}) {
    return this.fb.group({
      pessoaId: [r.pessoaId || ''],
      nomeNovo: [''],
      emailNovo: ['', Validar.email],
      telefoneNovo: ['', Validar.telefone],
      parentesco: [r.parentesco || '', Validators.required],
      parentescoInverso: [r.parentescoInverso || ''],
      principal: [!!r.principal]
    });
  }

  private patch(p: Pessoa) {
    this.papeis = new Set(p.papeis);
    this.papeisOriginais = new Set(p.papeis);
    this.form.patchValue({
      nomeCompleto: p.nomeCompleto,
      dataNascimento: p.dataNascimento || '',
      sexo: normalizarSexo(p.sexo),
      cpf: formatarCpf(p.cpf),
      rg: formatarRg(p.rg),
      cep: formatarCep(p.cep),
      cidade: p.cidade || '',
      uf: (p.uf || '').toUpperCase(),
      logradouro: p.logradouro || '',
      numero: p.numero || '',
      complemento: p.complemento || '',
      bairro: p.bairro || '',
      observacoes: p.observacoes || '',
      cuidados: { condicoes: p.condicoes ?? [], nivelSuporteTea: p.nivelSuporteTea ?? null, condicaoOutra: p.condicaoOutra ?? '', cuidados: p.cuidados ?? '' },
      voluntario: {
        tipo: p.voluntario?.tipo || 'COROINHA',
        etapaCatequese: p.voluntario?.etapaCatequese || '',
        eucaristiaAno: p.voluntario?.eucaristiaAno || '',
        crismaAno: p.voluntario?.crismaAno || '',
        horarioEstudo: p.voluntario?.horarioEstudo || '',
        autorizaWhatsapp: p.voluntario?.autorizaWhatsapp ?? false,
        mandatoInicio: p.voluntario?.mandatoInicio || '',
        mandatoFim: p.voluntario?.mandatoFim || '',
        funcoesHabilitadas: p.voluntario?.funcoesHabilitadas || []
      }
    });
    this.emails.clear();
    for (const e of p.emails) {
      this.emails.push(this.fb.group({ tipo: [e.tipo], email: [e.email, Validar.email], principal: [e.principal] }));
    }
    if (!this.emails.length) this.addEmail();
    this.telefones.clear();
    for (const t of p.telefones) {
      this.telefones.push(this.fb.group({ tipo: [t.tipo], numero: [formatarTelefone(t.numero), Validar.telefone], principal: [t.principal] }));
    }
    if (!this.telefones.length) this.addTelefone();
    this.responsaveis.clear();
    for (const r of p.responsaveis || []) this.responsaveis.push(this.relacaoGroup(r));
    this.dependentes.clear();
    for (const r of p.dependentes || []) this.dependentes.push(this.relacaoGroup(r));
    this.form.markAsPristine();
  }

  /**
   * Responsável novo vai como `novaPessoa` e é criado pela API na mesma
   * transação do cadastro — se o salvar falhar, não sobra pessoa órfã.
   */
  private montarRelacoes(lista: FormArray): RelacaoRequest[] {
    const out: RelacaoRequest[] = [];
    for (const g of lista.controls) {
      const v = g.getRawValue() as {
        pessoaId: string; nomeNovo: string; emailNovo: string; telefoneNovo: string;
        parentesco: string; parentescoInverso: string; principal: boolean;
      };
      const base = {
        parentesco: v.parentesco.trim(),
        parentescoInverso: v.parentescoInverso.trim() || null,
        principal: v.principal
      };
      if (v.pessoaId) {
        out.push({ ...base, pessoaId: v.pessoaId });
      } else if (v.nomeNovo.trim()) {
        out.push({
          ...base,
          novaPessoa: {
            nomeCompleto: v.nomeNovo.trim(),
            email: v.emailNovo.trim() || null,
            telefone: v.telefoneNovo.trim() || null
          }
        });
      }
    }
    return out;
  }

  private montarRequest(): PessoaRequest {
    const v = this.form.getRawValue();
    const emails = (v.emails as { tipo: string; email: string; principal: boolean }[])
      .filter(e => e.email?.trim())
      .map(e => ({ tipo: e.tipo.trim() || 'E-mail', email: e.email.trim(), principal: e.principal }));
    const telefones = (v.telefones as { tipo: string; numero: string; principal: boolean }[])
      .filter(t => t.numero?.trim())
      .map(t => ({ tipo: t.tipo.trim() || 'telefone', numero: t.numero.trim(), principal: t.principal }));
    const voluntario = this.papeis.has('VOLUNTARIO') ? {
      tipo: v.voluntario.tipo,
      etapaCatequese: v.voluntario.etapaCatequese || null,
      eucaristiaAno: v.voluntario.eucaristiaAno || null,
      crismaAno: v.voluntario.crismaAno || null,
      horarioEstudo: v.voluntario.horarioEstudo || null,
      autorizaWhatsapp: !!v.voluntario.autorizaWhatsapp,
      mandatoInicio: v.voluntario.mandatoInicio || null,
      mandatoFim: v.voluntario.mandatoFim || null,
      funcoesHabilitadas: v.voluntario.funcoesHabilitadas || []
    } : null;
    const blank = (s: string) => s?.trim() ? s.trim() : null;
    return {
      papeis: [...this.papeis],
      nomeCompleto: v.nomeCompleto.trim(),
      dataNascimento: blank(v.dataNascimento),
      sexo: blank(v.sexo),
      cpf: blank(v.cpf),
      rg: blank(v.rg),
      emails,
      telefones,
      responsaveis: this.papeis.has('VOLUNTARIO') ? this.montarRelacoes(this.responsaveis) : [],
      dependentes: this.papeis.has('RESPONSAVEL') ? this.montarRelacoes(this.dependentes) : [],
      cep: blank(v.cep),
      cidade: blank(v.cidade),
      uf: blank(v.uf),
      logradouro: blank(v.logradouro),
      numero: blank(v.numero),
      complemento: blank(v.complemento),
      bairro: blank(v.bairro),
      observacoes: blank(v.observacoes),
      ...(this.sessao.permissoes().includes('PESSOA_CUIDADOS_ALTERAR') ? { condicoes: v.cuidados?.condicoes ?? [], nivelSuporteTea: v.cuidados?.nivelSuporteTea ?? null, condicaoOutra: blank(v.cuidados?.condicaoOutra), cuidados: blank(v.cuidados?.cuidados) } : {}),
      voluntario
    };
  }
}


