import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { FUNCOES_FORM, FUNCOES_LABEL, FuncaoEscala, PARENTESCOS, TIPO_VOLUNTARIO_LABEL } from '../../models/voluntario.model';
import { createResponsavelGroup } from '../../forms/voluntario-ficha.factory';

@Component({
  selector: 'app-voluntario-ficha-fields',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div [formGroup]="form" class="space-y-6">
      <section class="card p-6">
        <div class="mb-5 flex items-center justify-between">
          <h2 class="text-lg font-black">Dados principais</h2>
          <span class="text-xs text-slate-400">* campos obrigatórios</span>
        </div>
        <div class="grid gap-5 lg:grid-cols-[180px_1fr]">
          <div>
            <div class="mx-auto flex h-40 w-40 items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50">
              <img *ngIf="photoPreview" [src]="photoPreview" class="h-full w-full object-cover" alt="Prévia da foto">
              <span *ngIf="!photoPreview" class="text-center text-sm text-slate-400">Foto<br>do cadastro</span>
            </div>
            <label *ngIf="!disabled" class="btn-secondary mt-3 w-full cursor-pointer !px-3 !py-2 text-sm">
              Selecionar foto
              <input class="hidden" type="file" accept="image/jpeg,image/png,image/webp,image/heic" (change)="photoSelected.emit($event)">
            </label>
            <button *ngIf="photoPreview && !disabled" type="button" class="mt-2 w-full text-xs font-semibold text-red-600" (click)="photoRemoved.emit()">Remover foto</button>
          </div>
          <div class="grid gap-4 md:grid-cols-2">
            <div class="md:col-span-2">
              <label class="label">Nome completo *</label>
              <input class="field" formControlName="nome_completo">
              <p *ngIf="form.get('nome_completo')?.touched && form.get('nome_completo')?.invalid" class="mt-1 text-xs text-red-600">Informe o nome e o sobrenome.</p>
            </div>
            <div><label class="label">Data de nascimento</label><input class="field" type="date" formControlName="data_nascimento"></div>
            <div>
              <label class="label">Tipo *</label>
              <select class="field" formControlName="tipo">
                <option value="COROINHA">{{ tipoLabel('COROINHA') }}</option>
                <option value="ACOLITO">{{ tipoLabel('ACOLITO') }}</option>
                <option value="AMBOS">Coroinha e Acólito</option>
              </select>
            </div>
            <div><label class="label">Etapa da catequese</label><input class="field" formControlName="etapa_catequese" placeholder="Ex.: 2º ano"></div>
            <div>
              <label class="label">Horário que estuda</label>
              <select class="field" formControlName="horario_estudo">
                <option value="">Não informado</option>
                <option value="MANHA">Manhã</option>
                <option value="TARDE">Tarde</option>
                <option value="NOITE">Noite</option>
              </select>
            </div>
            <div><label class="label">Eucaristia</label><input class="field" formControlName="eucaristia_ano" placeholder="Ex.: 2º ano"></div>
            <div><label class="label">Crisma</label><input class="field" formControlName="crisma_ano" placeholder="Ex.: 4º ano"></div>
            <label *ngIf="showAtivo" class="flex items-center gap-3 rounded-xl bg-slate-50 p-3 md:col-span-2">
              <input type="checkbox" formControlName="ativo" class="h-4 w-4">
              <span class="font-semibold">Cadastro ativo</span>
            </label>
          </div>
        </div>
      </section>

      <section class="card p-6">
        <h2 class="mb-5 text-lg font-black">Endereço e contato</h2>
        <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div class="lg:col-span-2"><label class="label">Rua</label><input class="field" formControlName="rua"></div>
          <div><label class="label">Número</label><input class="field" formControlName="numero"></div>
          <div><label class="label">Bairro</label><input class="field" formControlName="bairro"></div>
          <div><label class="label">Telefone</label><input class="field" formControlName="telefone"></div>
          <div><label class="label">Celular</label><input class="field" formControlName="celular"></div>
          <div class="md:col-span-2"><label class="label">E-mail</label><input class="field" type="email" formControlName="email"></div>
        </div>
      </section>

      <section class="card p-6">
        <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-lg font-black">Responsáveis</h2>
            <p class="text-sm text-slate-500">Adicione pai, mãe, avó, avô, tia ou qualquer outro responsável. A estrela indica o contato principal. É obrigatório ter pelo menos um responsável e exatamente um principal.</p>
          </div>
          <button *ngIf="!disabled" type="button" class="btn-secondary" (click)="addResponsavel()">＋ Adicionar responsável</button>
        </div>

        <div formArrayName="responsaveis" class="space-y-4">
          <div *ngFor="let group of responsaveis.controls; let i=index" [formGroupName]="i" class="rounded-2xl border border-slate-200 p-4">
            <div class="mb-4 flex items-center justify-between gap-3">
              <button type="button" class="flex items-center gap-2 text-sm font-bold" (click)="setPrincipal(i)" [disabled]="disabled" title="Marcar como principal">
                <span class="text-2xl" [class.text-amber-400]="group.get('principal')?.value" [class.text-slate-300]="!group.get('principal')?.value">★</span>
                {{ group.get('principal')?.value ? 'Contato principal' : 'Marcar principal' }}
              </button>
              <button *ngIf="!disabled" type="button" class="text-sm font-semibold text-red-600 disabled:opacity-40" [disabled]="responsaveis.length <= 1" (click)="removeResponsavel(i)">Excluir</button>
            </div>
            <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div>
                <label class="label">Parentesco *</label>
                <input class="field" formControlName="parentesco" [attr.list]="'parentescos-' + i" placeholder="Digite ou selecione">
                <datalist [id]="'parentescos-' + i"><option *ngFor="let p of parentescos" [value]="p"></option></datalist>
              </div>
              <div class="lg:col-span-2"><label class="label">Nome *</label><input class="field" formControlName="nome" placeholder="Nome do responsável"></div>
              <div><label class="label">Telefone</label><input class="field" formControlName="telefone"></div>
              <div><label class="label">Celular</label><input class="field" formControlName="celular"></div>
              <div><label class="label">E-mail</label><input class="field" type="email" formControlName="email"></div>
            </div>
          </div>
          <div *ngIf="!responsaveis.length" class="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">Nenhum responsável adicionado.</div>
          <p *ngIf="responsaveis.errors?.['responsavelObrigatorio'] && (responsaveis.touched || responsaveis.dirty)" class="text-sm text-red-600">Adicione pelo menos um responsável.</p>
          <p *ngIf="responsaveis.errors?.['principalUnico'] && (responsaveis.touched || responsaveis.dirty)" class="text-sm text-red-600">Defina exatamente um responsável principal.</p>
        </div>
      </section>

      <section class="card p-6">
        <h2 class="mb-1 text-lg font-black">Funções habilitadas</h2>
        <p class="mb-4 text-sm text-slate-500">Registro das funções que a pessoa já exerce. Na montagem da escala, o suggest filtra por Coroinha, Acólito ou Acólito/Coroinha e pelo nome.</p>
        <div class="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <label *ngFor="let f of funcoes" class="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 p-3 hover:bg-slate-50">
            <input type="checkbox" [checked]="hasFuncao(f)" [disabled]="disabled" (change)="toggleFuncao(f, $event)">
            <span class="font-semibold">{{ funcaoLabel(f) }}</span>
          </label>
        </div>
      </section>

      <section class="card p-6">
        <div class="grid gap-4 md:grid-cols-2">
          <label class="flex items-start gap-3 rounded-xl bg-sky-50 p-4">
            <input type="checkbox" formControlName="autoriza_whatsapp" class="mt-1 h-4 w-4">
            <span><strong>Autorização para grupo de WhatsApp</strong><br><span class="text-sm text-slate-600">Registro da autorização indicada na ficha física.</span></span>
          </label>
          <div><label class="label">Observações</label><textarea class="field min-h-28" formControlName="observacoes"></textarea></div>
        </div>
      </section>
    </div>
  `
})
export class VoluntarioFichaFieldsComponent {
  @Input({ required: true }) form!: FormGroup;
  @Input() photoPreview: string | null = null;
  @Input() showAtivo = false;
  @Input() disabled = false;
  @Output() photoSelected = new EventEmitter<Event>();
  @Output() photoRemoved = new EventEmitter<void>();

  funcoes = FUNCOES_FORM;
  parentescos = PARENTESCOS;

  constructor(private fb: FormBuilder) {}

  get responsaveis(): FormArray {
    return this.form.get('responsaveis') as FormArray;
  }

  tipoLabel(tipo: 'COROINHA' | 'ACOLITO' | 'AMBOS') {
    return TIPO_VOLUNTARIO_LABEL[tipo];
  }

  funcaoLabel(funcao: FuncaoEscala) {
    return FUNCOES_LABEL[funcao];
  }

  hasFuncao(funcao: FuncaoEscala) {
    return (this.form.get('funcoes_habilitadas')?.value || []).includes(funcao);
  }

  toggleFuncao(funcao: FuncaoEscala, event: Event) {
    if (this.disabled) return;
    const checked = (event.target as HTMLInputElement).checked;
    const current = [...(this.form.get('funcoes_habilitadas')?.value || [])] as FuncaoEscala[];
    const next = checked ? [...new Set([...current, funcao])] : current.filter(item => item !== funcao);
    this.form.get('funcoes_habilitadas')?.setValue(next);
    this.form.markAsDirty();
  }

  addResponsavel() {
    if (this.disabled) return;
    this.responsaveis.push(createResponsavelGroup(this.fb, undefined, this.responsaveis.length === 0));
    this.form.markAsDirty();
  }

  removeResponsavel(index: number) {
    if (this.disabled || this.responsaveis.length <= 1) return;
    const wasPrincipal = !!this.responsaveis.at(index).get('principal')?.value;
    this.responsaveis.removeAt(index);
    if (wasPrincipal && this.responsaveis.length) {
      this.setPrincipal(0);
    }
    this.form.markAsDirty();
  }

  setPrincipal(index: number) {
    if (this.disabled) return;
    this.responsaveis.controls.forEach((group, i) => group.get('principal')?.setValue(i === index));
    this.form.markAsDirty();
  }
}
