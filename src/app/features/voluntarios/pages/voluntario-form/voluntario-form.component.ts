import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HasPendingChanges } from '../../../../core/guards/pending-changes.guard';
import { VoluntarioFichaFieldsComponent } from '../../components/voluntario-ficha-fields/voluntario-ficha-fields.component';
import { createVoluntarioFichaForm, fichaValue, patchVoluntarioFichaForm, toVoluntarioPayload } from '../../forms/voluntario-ficha.factory';
import { Responsavel, Voluntario } from '../../models/voluntario.model';
import { VoluntariosService } from '../../services/voluntarios.service';
import { readPhotoPreview, validatePhotoFile } from '../../utils/photo.utils';

@Component({
  selector: 'app-voluntario-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, VoluntarioFichaFieldsComponent],
  template: `
    <div class="mx-auto max-w-6xl space-y-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-black text-slate-900">{{ id ? 'Editar cadastro' : 'Novo coroinha / acólito' }}</h1>
          <p class="text-sm text-slate-500">Ficha inspirada no cadastro físico da paróquia, agora organizada e pesquisável.</p>
        </div>
        <a routerLink="/voluntarios" class="btn-secondary">Voltar</a>
      </div>

      <div *ngIf="loading" class="card p-10 text-center text-slate-500">Carregando...</div>
      <form *ngIf="!loading" [formGroup]="form" (ngSubmit)="save()" class="space-y-6">
        <app-voluntario-ficha-fields
          [form]="form"
          [photoPreview]="photoPreview"
          [showAtivo]="true"
          (photoSelected)="onPhoto($event)"
          (photoRemoved)="removePhoto()">
        </app-voluntario-ficha-fields>

        <div *ngIf="error" class="rounded-xl bg-red-50 p-4 text-red-700">{{ error }}</div>
        <div class="sticky bottom-4 flex flex-wrap justify-end gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
          <a routerLink="/voluntarios" class="btn-secondary">Cancelar</a>
          <button type="submit" class="btn-primary" [disabled]="saving || form.invalid">{{ saving ? 'Salvando...' : 'Salvar cadastro' }}</button>
        </div>
      </form>
    </div>
  `
})
export class VoluntarioFormComponent implements OnInit, HasPendingChanges {
  id: string | null = null;
  loading = true;
  saving = false;
  error = '';
  saved = false;
  photoFile: File | null = null;
  photoPreview: string | null = null;
  removeExistingPhoto = false;
  form: FormGroup = createVoluntarioFichaForm(this.fb, { withInitialResponsavel: false });

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private service: VoluntariosService
  ) {}

  async ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');
    if (!this.id) {
      patchVoluntarioFichaForm(this.fb, this.form, {});
      this.loading = false;
      return;
    }
    try {
      const voluntario = await this.service.getById(this.id);
      patchVoluntarioFichaForm(this.fb, this.form, voluntario);
      this.photoPreview = voluntario.foto_url || null;
      this.form.markAsPristine();
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Erro ao carregar cadastro.';
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.error = '';
    try {
      const value = fichaValue(this.form);
      const payload = toVoluntarioPayload(value);
      const responsaveis = value.responsaveis as Responsavel[];
      let result: Voluntario;
      if (this.id) {
        result = await this.service.update(this.id, payload, responsaveis, this.photoFile, this.removeExistingPhoto);
      } else {
        result = await this.service.create(payload as Omit<Voluntario, 'id'>, responsaveis, this.photoFile);
      }
      this.saved = true;
      this.form.markAsPristine();
      await this.router.navigate(['/voluntarios', result.id]);
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Não foi possível salvar o cadastro.';
    } finally {
      this.saving = false;
    }
  }

  hasPendingChanges() {
    return !this.saved && (this.form.dirty || !!this.photoFile || this.removeExistingPhoto);
  }
}
