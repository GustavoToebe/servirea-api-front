
import { Component, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { TurnstileComponent } from '../../../../shared/components/turnstile/turnstile.component';
import { readPhotoPreview, validatePhotoFile } from '../../../../shared/utils/photo.utils';
import { InscricaoPublicaRequest, InscricaoResponsavelRequest } from '../../../pessoas/models/inscricao.model';
import { FUNCOES_FORM, FUNCOES_LABEL, FuncaoEscala, PARENTESCOS, TIPO_LABEL } from '../../../pessoas/models/pessoa.model';
import { InscricoesApiService } from '../../../pessoas/services/inscricoes-api.service';

type InscricaoView = 'form' | 'enviando' | 'sucesso' | 'erro';

@Component({
    selector: 'app-inscricao-publica',
    imports: [ReactiveFormsModule, RouterLink, TurnstileComponent],
    template: `
    <div class="min-h-screen bg-app">
      <header class="border-b border-slate-200 bg-white">
        <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 md:px-8">
          <div class="flex items-center gap-3">
            <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-blue font-black text-white">SJ</div>
            <div>
              <div class="text-sm font-extrabold leading-tight text-slate-900">São José Operário</div>
              <div class="text-xs text-slate-500">Inscrição de coroinhas e acólitos</div>
            </div>
          </div>
          <a routerLink="/login" class="text-sm font-semibold text-brand-blue">Acesso da coordenação</a>
        </div>
      </header>
    
      <main class="mx-auto max-w-6xl space-y-6 px-4 py-8 md:px-8">
        @if (view === 'form' || view === 'enviando') {
          <div class="space-y-6">
            <div>
              <h1 class="text-2xl font-black text-slate-900">Ficha de inscrição</h1>
              <p class="text-sm text-slate-500">A coordenação analisa os dados antes de incluir a pessoa nas escalas. Responsável é opcional.</p>
            </div>
            <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-6">
              <section class="card p-6">
                <h2 class="mb-4 text-lg font-black">Quem se inscreve</h2>
                <div class="grid gap-4 md:grid-cols-2">
                  <div class="md:col-span-2"><label class="label">Nome completo *</label><input class="field" formControlName="nomeCompleto"></div>
                  <div><label class="label">Nascimento</label><input class="field" type="date" formControlName="dataNascimento"></div>
                  <div><label class="label">Sexo</label><input class="field" formControlName="sexo"></div>
                  <div><label class="label">CPF</label><input class="field" formControlName="cpf"></div>
                  <div><label class="label">RG</label><input class="field" formControlName="rg"></div>
                  <div>
                    <label class="label">Tipo *</label>
                    <select class="field" formControlName="tipo">
                      @for (t of tipos; track t) {
                        <option [value]="t">{{ tipoLabel[t] }}</option>
                      }
                    </select>
                  </div>
                </div>
              </section>
              <section class="card p-6">
                <div class="mb-4 flex items-center justify-between"><h2 class="text-lg font-black">E-mails</h2><button type="button" class="btn-secondary" (click)="addEmail()">＋</button></div>
                <div formArrayName="emails" class="space-y-3">
                  @for (g of emails.controls; track g; let i = $index) {
                    <div [formGroupName]="i" class="grid gap-3 md:grid-cols-12">
                      <input class="field md:col-span-3" formControlName="tipo" placeholder="Tipo">
                      <input class="field md:col-span-6" type="email" formControlName="email" placeholder="e-mail">
                      <label class="flex items-center gap-2 md:col-span-2"><input type="checkbox" formControlName="principal"> Principal</label>
                      <button type="button" class="text-sm text-red-600" (click)="emails.removeAt(i)">Excluir</button>
                    </div>
                  }
                </div>
              </section>
              <section class="card p-6">
                <div class="mb-4 flex items-center justify-between"><h2 class="text-lg font-black">Telefones</h2><button type="button" class="btn-secondary" (click)="addTelefone()">＋</button></div>
                <div formArrayName="telefones" class="space-y-3">
                  @for (g of telefones.controls; track g; let i = $index) {
                    <div [formGroupName]="i" class="grid gap-3 md:grid-cols-12">
                      <input class="field md:col-span-3" formControlName="tipo" placeholder="Tipo">
                      <input class="field md:col-span-6" formControlName="numero" placeholder="número">
                      <label class="flex items-center gap-2 md:col-span-2"><input type="checkbox" formControlName="principal"> Principal</label>
                      <button type="button" class="text-sm text-red-600" (click)="telefones.removeAt(i)">Excluir</button>
                    </div>
                  }
                </div>
              </section>
              <section class="card p-6">
                <div class="mb-2 flex items-center justify-between">
                  <div>
                    <h2 class="text-lg font-black">Responsáveis</h2>
                    <p class="text-sm text-slate-500">Opcional. Se informar algum, marque exatamente um como principal.</p>
                  </div>
                  <button type="button" class="btn-secondary" (click)="addResponsavel()">＋ Responsável</button>
                </div>
                <div formArrayName="responsaveis" class="space-y-4">
                  @for (g of responsaveis.controls; track g; let i = $index) {
                    <div [formGroupName]="i" class="rounded-2xl border border-slate-200 p-4">
                      <div class="grid gap-3 md:grid-cols-2">
                        <div class="md:col-span-2"><label class="label">Nome *</label><input class="field" formControlName="nome"></div>
                        <div>
                          <label class="label">É (parentesco) *</label>
                          <input class="field" formControlName="parentesco" [attr.list]="'par-'+i">
                          <datalist [id]="'par-'+i">@for (p of parentescos; track p) {
                            <option [value]="p"></option>
                          }</datalist>
                        </div>
                        <div><label class="label">De (inverso)</label><input class="field" formControlName="parentescoInverso" placeholder="Filho, Filha…"></div>
                        <div><label class="label">E-mail</label><input class="field" type="email" formControlName="email"></div>
                        <div><label class="label">Telefone</label><input class="field" formControlName="telefone"></div>
                        <label class="flex items-center gap-2"><input type="checkbox" formControlName="principal"> Principal</label>
                      </div>
                      <button type="button" class="mt-3 text-sm text-red-600" (click)="responsaveis.removeAt(i)">Remover</button>
                    </div>
                  }
                </div>
              </section>
              <section class="card p-6">
                <h2 class="mb-4 text-lg font-black">Endereço</h2>
                <div class="grid gap-4 md:grid-cols-4">
                  <div class="md:col-span-2"><label class="label">Rua</label><input class="field" formControlName="rua"></div>
                  <div><label class="label">Número</label><input class="field" formControlName="numero"></div>
                  <div><label class="label">Complemento</label><input class="field" formControlName="complemento"></div>
                  <div><label class="label">Bairro</label><input class="field" formControlName="bairro"></div>
                  <div><label class="label">CEP</label><input class="field" formControlName="cep"></div>
                  <div><label class="label">Cidade</label><input class="field" formControlName="cidade"></div>
                  <div><label class="label">UF</label><input class="field" formControlName="uf" maxlength="2"></div>
                </div>
              </section>
              <section class="card p-6">
                <h2 class="mb-4 text-lg font-black">Perfil na paróquia</h2>
                <div class="grid gap-4 md:grid-cols-2">
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
                </div>
                <div class="mt-4 grid gap-3 sm:grid-cols-3">
                  @for (f of funcoes; track f) {
                    <label class="flex items-center gap-2 rounded-xl border p-3">
                      <input type="checkbox" [checked]="hasFuncao(f)" (change)="toggleFuncao(f, $event)"> {{ funcaoLabel[f] }}
                    </label>
                  }
                </div>
                <label class="mt-4 flex items-center gap-2"><input type="checkbox" formControlName="autorizaWhatsapp"> Autoriza WhatsApp</label>
                <div class="mt-4">
                  <label class="label">Foto</label>
                  <input type="file" accept="image/jpeg,image/png,image/webp,image/heic" (change)="onPhoto($event)">
                  @if (photoPreview) {
                    <img [src]="photoPreview" class="mt-3 h-32 w-32 rounded-2xl object-cover" alt="Prévia">
                  }
                  @if (photoPreview) {
                    <button type="button" class="mt-2 text-sm text-red-600" (click)="removePhoto()">Remover foto</button>
                  }
                </div>
                <div class="mt-4"><label class="label">Observações</label><textarea class="field min-h-28" formControlName="observacoes"></textarea></div>
              </section>
              <section class="card p-6">
                <h2 class="text-lg font-black">Proteção contra envios automáticos</h2>
                <p class="mt-1 text-sm text-slate-500">Confirme que você não é um robô antes de enviar.</p>
                <div class="mt-4">
                  @if (turnstileSiteKey) {
                    <app-turnstile [siteKey]="turnstileSiteKey"></app-turnstile>
                  }
                </div>
              </section>
              @if (error) {
                <div class="rounded-xl bg-red-50 p-4 text-red-700">{{ error }}</div>
              }
              <div class="sticky bottom-4 flex flex-wrap justify-end gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
                <button type="submit" class="btn-primary" [disabled]="view === 'enviando' || form.invalid || (!!turnstileSiteKey && !turnstileToken)">
                  {{ view === 'enviando' ? 'Enviando inscrição...' : 'Enviar inscrição' }}
                </button>
              </div>
            </form>
          </div>
        }
    
        @if (view === 'sucesso') {
          <section class="card mx-auto max-w-2xl p-8 text-center">
            <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-2xl text-emerald-700">✓</div>
            <h1 class="text-2xl font-black text-slate-900">Inscrição enviada com sucesso!</h1>
            <p class="mt-3 text-sm text-slate-600">A coordenação vai analisar os dados. Guarde o código abaixo caso precise falar sobre esta inscrição.</p>
            <div class="mt-5 rounded-2xl bg-slate-50 p-4">
              <div class="text-xs font-semibold uppercase tracking-wide text-slate-400">Código da inscrição</div>
              <div class="mt-1 break-all font-mono text-sm font-bold text-slate-900">{{ inscricaoId }}</div>
            </div>
            <button type="button" class="btn-secondary mt-6" (click)="resetForm()">Enviar outra inscrição</button>
          </section>
        }
    
        @if (view === 'erro') {
          <section class="card mx-auto max-w-2xl p-8 text-center">
            <h1 class="text-2xl font-black text-slate-900">Não foi possível enviar</h1>
            <p class="mt-3 text-sm text-red-700">{{ error }}</p>
            <button type="button" class="btn-primary mt-6" (click)="view = 'form'">Voltar ao formulário</button>
          </section>
        }
      </main>
    </div>
    `
})
export class InscricaoPublicaComponent implements OnInit, OnDestroy {
  @ViewChild(TurnstileComponent) turnstile?: TurnstileComponent;
  view: InscricaoView = 'form';
  error = '';
  photoFile: File | null = null;
  photoPreview: string | null = null;
  turnstileToken = '';
  turnstileSiteKey = environment.turnstileSiteKey;
  inscricaoId = '';
  slug = environment.publicTenantSlug;
  parentescos = PARENTESCOS;
  funcoes = FUNCOES_FORM;
  funcaoLabel = FUNCOES_LABEL;
  tipos: Array<'COROINHA' | 'ACOLITO' | 'AMBOS'> = ['COROINHA', 'ACOLITO', 'AMBOS'];
  tipoLabel = TIPO_LABEL;
  form: FormGroup = this.criarForm();

  constructor(
    private fb: FormBuilder,
    private inscricoes: InscricoesApiService,
    private zone: NgZone,
    private route: ActivatedRoute
  ) {}

  get emails(): FormArray { return this.form.get('emails') as FormArray; }
  get telefones(): FormArray { return this.form.get('telefones') as FormArray; }
  get responsaveis(): FormArray { return this.form.get('responsaveis') as FormArray; }

  ngOnInit() {
    const slug = this.route.snapshot.queryParamMap.get('slug');
    if (slug?.trim()) this.slug = slug.trim();
    window.onTurnstileSuccessCallback = (token: string) => {
      this.zone.run(() => this.onTurnstileSuccess(token));
    };
    window.onTurnstileExpiredCallback = () => {
      this.zone.run(() => this.turnstileToken = '');
    };
  }

  ngOnDestroy() {
    delete window.onTurnstileSuccessCallback;
    delete window.onTurnstileExpiredCallback;
  }

  onTurnstileSuccess(token: string) {
    this.turnstileToken = token;
  }

  addEmail() { this.emails.push(this.emailGroup(false)); }
  addTelefone() { this.telefones.push(this.telefoneGroup(false)); }
  addResponsavel() {
    this.responsaveis.push(this.fb.group({
      nome: [''],
      parentesco: [''],
      parentescoInverso: [''],
      email: [''],
      telefone: [''],
      principal: [this.responsaveis.length === 0]
    }));
  }

  hasFuncao(f: FuncaoEscala) {
    return (this.form.get('funcoesHabilitadas')?.value || []).includes(f);
  }

  toggleFuncao(f: FuncaoEscala, event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    const atual = [...(this.form.get('funcoesHabilitadas')?.value || [])] as FuncaoEscala[];
    this.form.get('funcoesHabilitadas')?.setValue(checked ? [...new Set([...atual, f])] : atual.filter(x => x !== f));
  }

  async onPhoto(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const invalid = validatePhotoFile(file);
    if (invalid) {
      this.error = invalid;
      input.value = '';
      return;
    }
    this.error = '';
    this.photoFile = file;
    this.photoPreview = await readPhotoPreview(file);
  }

  removePhoto() {
    this.photoFile = null;
    this.photoPreview = null;
  }

  async submit() {
    if (this.form.get('nomeCompleto')?.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Informe o nome completo.';
      return;
    }
    if (this.turnstileSiteKey && !this.turnstileToken) {
      this.error = 'Complete a verificação de segurança antes de enviar.';
      return;
    }
    if (!this.slug) {
      this.error = 'Paróquia pública não configurada (slug).';
      return;
    }

    this.view = 'enviando';
    this.error = '';
    this.form.disable({ emitEvent: false });
    try {
      const dados = this.montarRequest();
      const result = await this.inscricoes.criarPublica(this.slug, dados, this.photoFile);
      this.inscricaoId = result.id || '';
      this.view = 'sucesso';
    } catch (err) {
      this.form.enable({ emitEvent: false });
      this.turnstileToken = '';
      this.turnstile?.reset();
      this.error = err instanceof Error && err.message ? err.message : 'Não foi possível enviar a inscrição. Tente novamente.';
      this.view = 'erro';
    }
  }

  resetForm() {
    this.form = this.criarForm();
    this.photoFile = null;
    this.photoPreview = null;
    this.turnstileToken = '';
    this.inscricaoId = '';
    this.error = '';
    this.view = 'form';
  }

  private criarForm(): FormGroup {
    return this.fb.group({
      nomeCompleto: ['', Validators.required],
      dataNascimento: [''],
      sexo: [''],
      cpf: [''],
      rg: [''],
      tipo: ['COROINHA', Validators.required],
      emails: this.fb.array([this.emailGroup(true)]),
      telefones: this.fb.array([this.telefoneGroup(true)]),
      responsaveis: this.fb.array([]),
      cep: [''],
      cidade: [''],
      uf: [''],
      rua: [''],
      numero: [''],
      complemento: [''],
      bairro: [''],
      etapaCatequese: [''],
      eucaristiaAno: [''],
      crismaAno: [''],
      horarioEstudo: [''],
      observacoes: [''],
      autorizaWhatsapp: [false],
      funcoesHabilitadas: this.fb.control<FuncaoEscala[]>([])
    });
  }

  private emailGroup(principal: boolean) {
    return this.fb.group({ tipo: ['E-mail pessoal'], email: ['', Validators.email], principal: [principal] });
  }

  private telefoneGroup(principal: boolean) {
    return this.fb.group({ tipo: ['celular'], numero: [''], principal: [principal] });
  }

  private montarRequest(): InscricaoPublicaRequest {
    const v = this.form.getRawValue();
    const blank = (s: string) => s?.trim() ? s.trim() : null;
    const emails = (v.emails as { tipo: string; email: string; principal: boolean }[])
      .filter(e => e.email?.trim())
      .map(e => ({ tipo: e.tipo.trim() || 'E-mail', email: e.email.trim(), principal: e.principal }));
    const telefones = (v.telefones as { tipo: string; numero: string; principal: boolean }[])
      .filter(t => t.numero?.trim())
      .map(t => ({ tipo: t.tipo.trim() || 'telefone', numero: t.numero.trim(), principal: t.principal }));
    const responsaveis: InscricaoResponsavelRequest[] = (v.responsaveis as {
      nome: string; parentesco: string; parentescoInverso: string; email: string; telefone: string; principal: boolean;
    }[])
      .filter(r => r.nome?.trim() && r.parentesco?.trim())
      .map(r => ({
        nome: r.nome.trim(),
        parentesco: r.parentesco.trim(),
        parentescoInverso: blank(r.parentescoInverso),
        emails: r.email?.trim() ? [{ tipo: 'E-mail pessoal', email: r.email.trim(), principal: true }] : [],
        telefones: r.telefone?.trim() ? [{ tipo: 'celular', numero: r.telefone.trim(), principal: true }] : [],
        principal: r.principal
      }));
    return {
      turnstileToken: this.turnstileToken,
      nomeCompleto: v.nomeCompleto.trim(),
      dataNascimento: blank(v.dataNascimento),
      sexo: blank(v.sexo),
      cpf: blank(v.cpf),
      rg: blank(v.rg),
      tipo: v.tipo,
      etapaCatequese: blank(v.etapaCatequese),
      eucaristiaAno: blank(v.eucaristiaAno),
      crismaAno: blank(v.crismaAno),
      emails,
      telefones,
      responsaveis,
      cep: blank(v.cep),
      cidade: blank(v.cidade),
      uf: blank(v.uf),
      rua: blank(v.rua),
      numero: blank(v.numero),
      complemento: blank(v.complemento),
      bairro: blank(v.bairro),
      horarioEstudo: blank(v.horarioEstudo) as InscricaoPublicaRequest['horarioEstudo'],
      observacoes: blank(v.observacoes),
      autorizaWhatsapp: !!v.autorizaWhatsapp,
      funcoesHabilitadas: v.funcoesHabilitadas || []
    };
  }
}
