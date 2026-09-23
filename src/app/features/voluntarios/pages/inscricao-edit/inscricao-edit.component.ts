import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HasPendingChanges } from '../../../../core/guards/pending-changes.guard';
import { VoluntarioFichaFieldsComponent } from '../../components/voluntario-ficha-fields/voluntario-ficha-fields.component';
import { createVoluntarioFichaForm, fichaValue, patchVoluntarioFichaForm, toInscricaoDados, toResponsaveisPayload } from '../../forms/voluntario-ficha.factory';
import { InscricoesService } from '../../services/inscricoes.service';
import { readPhotoPreview, validatePhotoFile } from '../../utils/photo.utils';

@Component({
  selector: 'app-inscricao-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, VoluntarioFichaFieldsComponent],
  template: `
    <div class="mx-auto max-w-6xl space-y-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <a *ngIf="id" [routerLink]="['/voluntarios/inscricoes', id]" class="text-sm font-semibold text-brand-blue">← Voltar para a inscrição</a>
          <h1 class="mt-2 text-2xl font-black text-slate-900">Editar inscrição</h1>
          <p class="text-sm text-slate-500">Somente inscrições pendentes podem ser alteradas. Status e dados de aprovação permanecem no servidor.</p>
        </div>
      </div>

      <div *ngIf="loading" class="card p-10 text-center text-slate-500">Carregando...</div>
      <div *ngIf="!loading && !canEdit" class="card p-6 text-amber-800">Esta inscrição já foi analisada e não pode mais ser editada.</div>

      <form *ngIf="!loading && canEdit" [formGroup]="form" (ngSubmit)="save()" class="space-y-6">
        <app-voluntario-ficha-fields
          [form]="form"
          [photoPreview]="photoPreview"
          [showAtivo]="false"
          (photoSelected)="onPhoto($event)"
          (photoRemoved)="removePhoto()">
        </app-voluntario-ficha-fields>
        <div *ngIf="error" class="rounded-xl bg-red-50 p-4 text-red-700">{{ error }}</div>
        <div class="sticky bottom-4 flex flex-wrap justify-end gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
          <a *ngIf="id" [routerLink]="['/voluntarios/inscricoes', id]" class="btn-secondary">Cancelar</a>
          <button type="submit" class="btn-primary" [disabled]="saving || form.invalid">{{ saving ? 'Salvando...' : 'Salvar inscrição' }}</button>
        </div>
      </form>
    </div>
  `
})
export class InscricaoEditComponent implements OnInit, HasPendingChanges {
  id: string | null = null;
  loading = true;
  saving = false;
  saved = false;
  canEdit = false;
  error = '';
  photoFile: File | null = null;
  photoPreview: string | null = null;
  removeExistingPhoto = false;
  form: FormGroup = createVoluntarioFichaForm(this.fb, { withInitialResponsavel: false });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private service: InscricoesService
  ) {}

  async ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');
    if (!this.id) {
      this.loading = false;
      return;
    }
    try {
      const inscricao = await this.service.getById(this.id);
      this.canEdit = inscricao.status === 'PENDENTE';
      patchVoluntarioFichaForm(this.fb, this.form, inscricao);
      this.photoPreview = inscricao.foto_url || null;
      this.form.markAsPristine();
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Erro ao carregar inscrição.';
    } finally {
      this.loading = false;
    }
  }

  async onPhoto(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const invalid = validatePhotoFile(file);
    if (invalid) {
      this.error = invalid;
      return;
    }
    this.error = '';
    this.photoFile = file;
    this.removeExistingPhoto = false;
    this.photoPreview = await readPhotoPreview(file);
    this.form.markAsDirty();
  }

  removePhoto() {
    this.photoFile = null;
    this.photoPreview = null;
    this.removeExistingPhoto = true;
    this.form.markAsDirty();
  }

  async save() {
    if (!this.id || this.form.invalid || !this.canEdit) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.error = '';
    try {
      const value = fichaValue(this.form);
      await this.service.updatePendente(
        this.id,
        toInscricaoDados(value),
        toResponsaveisPayload(value),
        this.photoFile,
        this.removeExistingPhoto
      );
      this.saved = true;
      this.form.markAsPristine();
      await this.router.navigate(['/voluntarios/inscricoes', this.id]);
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Não foi possível salvar a inscrição.';
    } finally {
      this.saving = false;
    }
  }

  hasPendingChanges() {
    return !this.saved && (this.form.dirty || !!this.photoFile || this.removeExistingPhoto);
  }
}
