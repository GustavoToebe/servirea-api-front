import { CommonModule } from '@angular/common';
import { Component, NgZone, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { TurnstileComponent } from '../../../../shared/components/turnstile/turnstile.component';
import { VoluntarioFichaFieldsComponent } from '../../../voluntarios/components/voluntario-ficha-fields/voluntario-ficha-fields.component';
import { createVoluntarioFichaForm, fichaValue, toInscricaoDados, toResponsaveisPayload } from '../../../voluntarios/forms/voluntario-ficha.factory';
import { InscricoesService } from '../../../voluntarios/services/inscricoes.service';
import { readPhotoPreview, validatePhotoFile } from '../../../voluntarios/utils/photo.utils';

type InscricaoView = 'form' | 'enviando' | 'sucesso' | 'erro';

@Component({
  selector: 'app-inscricao-publica',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, VoluntarioFichaFieldsComponent, TurnstileComponent],
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
        <div *ngIf="view === 'form' || view === 'enviando'" class="space-y-6">
          <div>
            <h1 class="text-2xl font-black text-slate-900">Ficha de inscrição</h1>
            <p class="text-sm text-slate-500">Preencha os mesmos dados do cadastro da paróquia. A coordenação analisa a inscrição antes de incluir a pessoa nas escalas.</p>
          </div>

          <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-6">
            <app-voluntario-ficha-fields
              [form]="form"
              [photoPreview]="photoPreview"
              [showAtivo]="false"
              [disabled]="view === 'enviando'"
              (photoSelected)="onPhoto($event)"
              (photoRemoved)="removePhoto()">
            </app-voluntario-ficha-fields>

            <section class="card p-6">
              <h2 class="text-lg font-black">Proteção contra envios automáticos</h2>
              <p class="mt-1 text-sm text-slate-500">Confirme que você não é um robô antes de enviar.</p>
              <div class="mt-4">
                <app-turnstile *ngIf="turnstileSiteKey" [siteKey]="turnstileSiteKey"></app-turnstile>
              </div>
            </section>

            <div *ngIf="error" class="rounded-xl bg-red-50 p-4 text-red-700">{{ error }}</div>

            <div class="sticky bottom-4 flex flex-wrap justify-end gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
              <button type="submit" class="btn-primary" [disabled]="view === 'enviando' || form.invalid || !turnstileToken">
                {{ view === 'enviando' ? 'Enviando inscrição...' : 'Enviar inscrição' }}
              </button>
            </div>
          </form>
        </div>

        <section *ngIf="view === 'sucesso'" class="card mx-auto max-w-2xl p-8 text-center">
          <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-2xl text-emerald-700">✓</div>
          <h1 class="text-2xl font-black text-slate-900">Inscrição enviada com sucesso!</h1>
          <p class="mt-3 text-sm text-slate-600">A coordenação vai analisar os dados. Guarde o código abaixo caso precise falar sobre esta inscrição.</p>
          <div class="mt-5 rounded-2xl bg-slate-50 p-4">
            <div class="text-xs font-semibold uppercase tracking-wide text-slate-400">Código da inscrição</div>
            <div class="mt-1 break-all font-mono text-sm font-bold text-slate-900">{{ inscricaoId }}</div>
          </div>
          <button type="button" class="btn-secondary mt-6" (click)="resetForm()">Enviar outra inscrição</button>
        </section>

        <section *ngIf="view === 'erro'" class="card mx-auto max-w-2xl p-8 text-center">
          <h1 class="text-2xl font-black text-slate-900">Não foi possível enviar</h1>
          <p class="mt-3 text-sm text-red-700">{{ error }}</p>
          <button type="button" class="btn-primary mt-6" (click)="view = 'form'">Voltar ao formulário</button>
        </section>
      </main>
    </div>
  `
})
export class InscricaoPublicaComponent implements OnInit, OnDestroy {
  @ViewChild(TurnstileComponent) turnstile?: TurnstileComponent;
  form: FormGroup = createVoluntarioFichaForm(this.fb);
  view: InscricaoView = 'form';
  error = '';
  photoFile: File | null = null;
  photoPreview: string | null = null;
  turnstileToken = '';
  turnstileSiteKey = environment.turnstileSiteKey;
  inscricaoId = '';

  constructor(private fb: FormBuilder, private inscricoes: InscricoesService, private zone: NgZone) {}

  ngOnInit() {
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
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (this.turnstileSiteKey && !this.turnstileToken) {
      this.error = 'Complete a verificação de segurança antes de enviar.';
      return;
    }

    this.view = 'enviando';
    this.error = '';
    this.form.disable({ emitEvent: false });
    try {
      const value = fichaValue(this.form);
      const result = await this.inscricoes.enviarPublica(
        toInscricaoDados(value),
        toResponsaveisPayload(value),
        this.turnstileToken,
        this.photoFile
      );
      this.inscricaoId = result.id || '';
      this.view = 'sucesso';
    } catch (err) {
      this.form.enable({ emitEvent: false });
      this.turnstileToken = '';
      this.turnstile?.reset();
      this.error = this.publicErrorMessage(err);
      this.view = 'erro';
    }
  }

  resetForm() {
    this.form = createVoluntarioFichaForm(this.fb);
    this.photoFile = null;
    this.photoPreview = null;
    this.turnstileToken = '';
    this.inscricaoId = '';
    this.error = '';
    this.view = 'form';
  }

  private publicErrorMessage(err: unknown): string {
    if (err instanceof TypeError) return 'Não foi possível enviar a inscrição. Tente novamente.';
    if (err instanceof Error && err.message) return err.message;
    return 'Não foi possível enviar a inscrição. Tente novamente.';
  }
}
