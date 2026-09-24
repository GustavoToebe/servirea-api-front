import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HasPendingChanges } from '../../../core/guards/pending-changes.guard';
import { FUNCOES_FORM, FUNCOES_LABEL, FuncaoEscala, PARENTESCOS, Pessoa, PessoaPapel, PessoaRequest, RelacaoRequest, TIPO_LABEL } from '../models/pessoa.model';
import { PessoasService } from '../services/pessoas.service';
import { VoluntariosApiService } from '../services/voluntarios-api.service';
import { readPhotoPreview, validatePhotoFile } from '../../../shared/utils/photo.utils';

@Component({
  selector: 'app-pessoa-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="mx-auto max-w-5xl space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-black">{{ id ? 'Editar pessoa' : 'Nova pessoa' }}</h1>
          <p class="text-sm text-slate-500">Identidade primeiro. Papéis podem coexistir. Responsável é opcional.</p>
        </div>
        <a routerLink="/pessoas" class="btn-secondary">Voltar</a>
      </div>

      <div *ngIf="loading" class="card p-10 text-center text-slate-500">Carregando...</div>
      <form *ngIf="!loading" [formGroup]="form" (ngSubmit)="save()" class="space-y-6">
        <section class="card p-6">
          <h2 class="mb-4 text-lg font-black">Papéis</h2>
          <div class="flex flex-wrap gap-4">
            <label class="flex items-center gap-2"><input type="checkbox" (change)="togglePapel('VOLUNTARIO', $event)" [checked]="temPapel('VOLUNTARIO')"> Voluntário (escala)</label>
            <label class="flex items-center gap-2"><input type="checkbox" (change)="togglePapel('RESPONSAVEL', $event)" [checked]="temPapel('RESPONSAVEL')"> Responsável</label>
          </div>
        </section>

        <section class="card p-6">
          <h2 class="mb-4 text-lg font-black">Identidade</h2>
          <div class="grid gap-4 md:grid-cols-2">
            <div class="md:col-span-2"><label class="label">Nome completo *</label><input class="field" formControlName="nomeCompleto"></div>
            <div><label class="label">Nascimento</label><input class="field" type="date" formControlName="dataNascimento"></div>
            <div><label class="label">Sexo</label><input class="field" formControlName="sexo"></div>
            <div><label class="label">CPF</label><input class="field" formControlName="cpf"></div>
            <div><label class="label">RG</label><input class="field" formControlName="rg"></div>
          </div>
        </section>

        <section class="card p-6">
          <div class="mb-4 flex items-center justify-between"><h2 class="text-lg font-black">E-mails</h2><button type="button" class="btn-secondary" (click)="addEmail()">＋</button></div>
          <div formArrayName="emails" class="space-y-3">
            <div *ngFor="let g of emails.controls; let i=index" [formGroupName]="i" class="grid gap-3 md:grid-cols-12">
              <input class="field md:col-span-3" formControlName="tipo" placeholder="Tipo">
              <input class="field md:col-span-6" type="email" formControlName="email" placeholder="e-mail">
              <label class="flex items-center gap-2 md:col-span-2"><input type="checkbox" formControlName="principal"> Principal</label>
              <button type="button" class="text-sm text-red-600" (click)="emails.removeAt(i)">Excluir</button>
            </div>
          </div>
        </section>

        <section class="card p-6">
          <div class="mb-4 flex items-center justify-between"><h2 class="text-lg font-black">Telefones</h2><button type="button" class="btn-secondary" (click)="addTelefone()">＋</button></div>
          <div formArrayName="telefones" class="space-y-3">
            <div *ngFor="let g of telefones.controls; let i=index" [formGroupName]="i" class="grid gap-3 md:grid-cols-12">
              <input class="field md:col-span-3" formControlName="tipo" placeholder="Tipo">
              <input class="field md:col-span-6" formControlName="numero" placeholder="número">
              <label class="flex items-center gap-2 md:col-span-2"><input type="checkbox" formControlName="principal"> Principal</label>
              <button type="button" class="text-sm text-red-600" (click)="telefones.removeAt(i)">Excluir</button>
            </div>
          </div>
        </section>

        <section class="card p-6">
          <div class="mb-2 flex items-center justify-between">
            <div>
              <h2 class="text-lg font-black">Relações (é / de)</h2>
              <p class="text-sm text-slate-500">Opcional. Adulto/ministro pode ficar sem responsável. Escolha uma pessoa já cadastrada ou crie uma nova.</p>
            </div>
            <button type="button" class="btn-secondary" (click)="addRelacao()">＋ Relação</button>
          </div>
          <div formArrayName="relacoes" class="space-y-4">
            <div *ngFor="let g of relacoes.controls; let i=index" [formGroupName]="i" class="rounded-2xl border border-slate-200 p-4">
              <div class="grid gap-3 md:grid-cols-2">
                <div class="md:col-span-2">
                  <label class="label">Pessoa já cadastrada</label>
                  <select class="field" formControlName="pessoaId">
                    <option value="">Cadastrar nova nesta ficha</option>
                    <option *ngFor="let p of candidatosRelacao" [value]="p.id">{{ p.nomeCompleto }}</option>
                  </select>
                </div>
                <div *ngIf="!g.get('pessoaId')?.value">
                  <label class="label">Nome da nova pessoa *</label>
                  <input class="field" formControlName="nomeNovo">
                </div>
                <div *ngIf="!g.get('pessoaId')?.value">
                  <label class="label">E-mail da nova pessoa</label>
                  <input class="field" type="email" formControlName="emailNovo">
                </div>
                <div>
                  <label class="label">É (parentesco) *</label>
                  <input class="field" formControlName="parentesco" [attr.list]="'par-'+i" placeholder="Mãe, Pai…">
                  <datalist [id]="'par-'+i"><option *ngFor="let p of parentescos" [value]="p"></option></datalist>
                </div>
                <div>
                  <label class="label">De (inverso)</label>
                  <input class="field" formControlName="parentescoInverso" placeholder="Filho, Filha…">
                </div>
                <label class="flex items-center gap-2"><input type="checkbox" formControlName="principal"> Principal</label>
              </div>
              <button type="button" class="mt-3 text-sm text-red-600" (click)="relacoes.removeAt(i)">Remover</button>
            </div>
          </div>
        </section>

        <section class="card p-6">
          <h2 class="mb-4 text-lg font-black">Endereço</h2>
          <div class="grid gap-4 md:grid-cols-4">
            <div class="md:col-span-2"><label class="label">Logradouro</label><input class="field" formControlName="logradouro"></div>
            <div><label class="label">Número</label><input class="field" formControlName="numero"></div>
            <div><label class="label">Complemento</label><input class="field" formControlName="complemento"></div>
            <div><label class="label">Bairro</label><input class="field" formControlName="bairro"></div>
            <div><label class="label">CEP</label><input class="field" formControlName="cep"></div>
            <div><label class="label">Cidade</label><input class="field" formControlName="cidade"></div>
            <div><label class="label">UF</label><input class="field" formControlName="uf" maxlength="2"></div>
          </div>
        </section>

        <section *ngIf="temPapel('VOLUNTARIO')" class="card p-6" formGroupName="voluntario">
          <h2 class="mb-4 text-lg font-black">Perfil de escala</h2>
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <label class="label">Tipo *</label>
              <select class="field" formControlName="tipo">
                <option *ngFor="let t of tipos" [value]="t">{{ tipoLabel[t] }}</option>
              </select>
            </div>
            <label class="flex items-center gap-2 pt-6"><input type="checkbox" formControlName="ativo"> Cadastro ativo</label>
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
            <label *ngFor="let f of funcoes" class="flex items-center gap-2 rounded-xl border p-3">
              <input type="checkbox" [checked]="hasFuncao(f)" (change)="toggleFuncao(f, $event)"> {{ funcaoLabel[f] }}
            </label>
          </div>
          <label class="mt-4 flex items-center gap-2"><input type="checkbox" formControlName="autorizaWhatsapp"> Autoriza WhatsApp</label>
          <div class="mt-4">
            <label class="label">Foto</label>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/heic" (change)="onPhoto($event)">
            <img *ngIf="photoPreview" [src]="photoPreview" class="mt-3 h-32 w-32 rounded-2xl object-cover" alt="Prévia">
          </div>
        </section>

        <section class="card p-6">
          <label class="label">Observações</label>
          <textarea class="field min-h-28" formControlName="observacoes"></textarea>
        </section>

        <div *ngIf="error" class="rounded-xl bg-red-50 p-4 text-red-700">{{ error }}</div>
        <div class="sticky bottom-4 flex justify-end gap-3 rounded-2xl border bg-white/95 p-4 shadow-lg">
          <a routerLink="/pessoas" class="btn-secondary">Cancelar</a>
          <button type="submit" class="btn-primary" [disabled]="saving">{{ saving ? 'Salvando...' : 'Salvar' }}</button>
        </div>
      </form>
    </div>
  `
})
export class PessoaFormComponent implements OnInit, HasPendingChanges {
  id: string | null = null;
  loading = true;
  saving = false;
  saved = false;
  error = '';
  photoFile: File | null = null;
  photoPreview: string | null = null;
  papeis = new Set<PessoaPapel>(['VOLUNTARIO']);
  candidatosRelacao: Pessoa[] = [];
  parentescos = PARENTESCOS;
  funcoes = FUNCOES_FORM;
  funcaoLabel = FUNCOES_LABEL;
  tipos: Array<'COROINHA' | 'ACOLITO' | 'AMBOS'> = ['COROINHA', 'ACOLITO', 'AMBOS'];
  tipoLabel = TIPO_LABEL;
  form: FormGroup = this.fb.group({
    nomeCompleto: ['', Validators.required],
    dataNascimento: [''],
    sexo: [''],
    cpf: [''],
    rg: [''],
    emails: this.fb.array([this.emailGroup(true)]),
    telefones: this.fb.array([this.telefoneGroup(true)]),
    relacoes: this.fb.array([]),
    cep: [''],
    cidade: [''],
    uf: [''],
    logradouro: [''],
    numero: [''],
    complemento: [''],
    bairro: [''],
    observacoes: [''],
    voluntario: this.fb.group({
      tipo: ['COROINHA'],
      ativo: [true],
      etapaCatequese: [''],
      eucaristiaAno: [''],
      crismaAno: [''],
      horarioEstudo: [''],
      autorizaWhatsapp: [false],
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

  get emails(): FormArray { return this.form.get('emails') as FormArray; }
  get telefones(): FormArray { return this.form.get('telefones') as FormArray; }
  get relacoes(): FormArray { return this.form.get('relacoes') as FormArray; }

  async ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');
    try {
      this.candidatosRelacao = (await this.pessoas.listar()).filter(p => p.id !== this.id);
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
    const on = (event.target as HTMLInputElement).checked;
    if (on) this.papeis.add(papel);
    else if (this.papeis.size > 1) this.papeis.delete(papel);
    this.form.markAsDirty();
  }

  addEmail() { this.emails.push(this.emailGroup(false)); this.form.markAsDirty(); }
  addTelefone() { this.telefones.push(this.telefoneGroup(false)); this.form.markAsDirty(); }
  addRelacao() {
    this.relacoes.push(this.fb.group({
      pessoaId: [''],
      nomeNovo: [''],
      emailNovo: [''],
      parentesco: ['', Validators.required],
      parentescoInverso: [''],
      principal: [this.relacoes.length === 0]
    }));
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
    if (invalid) { this.error = invalid; return; }
    this.photoFile = file;
    this.photoPreview = await readPhotoPreview(file);
    this.form.markAsDirty();
  }

  async save() {
    if (!this.papeis.size || this.form.get('nomeCompleto')?.invalid) {
      this.form.markAllAsTouched();
      this.error = 'Informe o nome e pelo menos um papel.';
      return;
    }
    this.saving = true;
    this.error = '';
    try {
      const relacoes = await this.montarRelacoes();
      const request = this.montarRequest(relacoes);
      const salvo = this.id
        ? await this.pessoas.atualizar(this.id, request)
        : await this.pessoas.criar(request);
      if (this.photoFile && this.papeis.has('VOLUNTARIO')) {
        await this.voluntarios.enviarFoto(salvo.id, this.photoFile);
      }
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
    return this.fb.group({ tipo: ['E-mail pessoal'], email: ['', Validators.email], principal: [principal] });
  }

  private telefoneGroup(principal: boolean) {
    return this.fb.group({ tipo: ['celular'], numero: [''], principal: [principal] });
  }

  private patch(p: Pessoa) {
    this.papeis = new Set(p.papeis);
    this.form.patchValue({
      nomeCompleto: p.nomeCompleto,
      dataNascimento: p.dataNascimento || '',
      sexo: p.sexo || '',
      cpf: p.cpf || '',
      rg: p.rg || '',
      cep: p.cep || '',
      cidade: p.cidade || '',
      uf: p.uf || '',
      logradouro: p.logradouro || '',
      numero: p.numero || '',
      complemento: p.complemento || '',
      bairro: p.bairro || '',
      observacoes: p.observacoes || '',
      voluntario: {
        tipo: p.voluntario?.tipo || 'COROINHA',
        ativo: p.voluntario?.ativo ?? true,
        etapaCatequese: p.voluntario?.etapaCatequese || '',
        eucaristiaAno: p.voluntario?.eucaristiaAno || '',
        crismaAno: p.voluntario?.crismaAno || '',
        horarioEstudo: p.voluntario?.horarioEstudo || '',
        autorizaWhatsapp: p.voluntario?.autorizaWhatsapp ?? false,
        funcoesHabilitadas: p.voluntario?.funcoesHabilitadas || []
      }
    });
    this.emails.clear();
    for (const e of p.emails) {
      this.emails.push(this.fb.group({ tipo: [e.tipo], email: [e.email], principal: [e.principal] }));
    }
    if (!this.emails.length) this.addEmail();
    this.telefones.clear();
    for (const t of p.telefones) {
      this.telefones.push(this.fb.group({ tipo: [t.tipo], numero: [t.numero], principal: [t.principal] }));
    }
    if (!this.telefones.length) this.addTelefone();
    this.relacoes.clear();
    for (const r of p.relacoes || []) {
      this.relacoes.push(this.fb.group({
        pessoaId: [r.pessoaId],
        nomeNovo: [''],
        emailNovo: [''],
        parentesco: [r.parentesco],
        parentescoInverso: [r.parentescoInverso || ''],
        principal: [r.principal]
      }));
    }
    this.form.markAsPristine();
  }

  private async montarRelacoes(): Promise<RelacaoRequest[]> {
    const out: RelacaoRequest[] = [];
    for (const g of this.relacoes.controls) {
      const v = g.getRawValue() as { pessoaId: string; nomeNovo: string; emailNovo: string; parentesco: string; parentescoInverso: string; principal: boolean };
      let pessoaId = v.pessoaId;
      if (!pessoaId) {
        if (!v.nomeNovo.trim()) continue;
        const emails = v.emailNovo.trim()
          ? [{ tipo: 'E-mail pessoal', email: v.emailNovo.trim(), principal: true }]
          : [];
        const criada = await this.pessoas.criar({
          papeis: ['RESPONSAVEL'],
          nomeCompleto: v.nomeNovo.trim(),
          dataNascimento: null,
          sexo: null, cpf: null, rg: null,
          emails,
          telefones: [],
          relacoes: [],
          cep: null, cidade: null, uf: null, logradouro: null, numero: null, complemento: null, bairro: null,
          observacoes: null,
          voluntario: null
        });
        pessoaId = criada.id;
      }
      out.push({
        pessoaId,
        parentesco: v.parentesco.trim(),
        parentescoInverso: v.parentescoInverso.trim() || null,
        principal: v.principal
      });
    }
    return out;
  }

  private montarRequest(relacoes: RelacaoRequest[]): PessoaRequest {
    const v = this.form.getRawValue();
    const emails = (v.emails as { tipo: string; email: string; principal: boolean }[])
      .filter(e => e.email?.trim())
      .map(e => ({ tipo: e.tipo.trim() || 'E-mail', email: e.email.trim(), principal: e.principal }));
    const telefones = (v.telefones as { tipo: string; numero: string; principal: boolean }[])
      .filter(t => t.numero?.trim())
      .map(t => ({ tipo: t.tipo.trim() || 'telefone', numero: t.numero.trim(), principal: t.principal }));
    const voluntario = this.papeis.has('VOLUNTARIO') ? {
      tipo: v.voluntario.tipo,
      ativo: !!v.voluntario.ativo,
      etapaCatequese: v.voluntario.etapaCatequese || null,
      eucaristiaAno: v.voluntario.eucaristiaAno || null,
      crismaAno: v.voluntario.crismaAno || null,
      horarioEstudo: v.voluntario.horarioEstudo || null,
      autorizaWhatsapp: !!v.voluntario.autorizaWhatsapp,
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
      relacoes,
      cep: blank(v.cep),
      cidade: blank(v.cidade),
      uf: blank(v.uf),
      logradouro: blank(v.logradouro),
      numero: blank(v.numero),
      complemento: blank(v.complemento),
      bairro: blank(v.bairro),
      observacoes: blank(v.observacoes),
      voluntario
    };
  }
}
