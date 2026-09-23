import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" (click)="onBackdrop($event)">
      <div class="card w-full max-w-md p-6" role="dialog" aria-modal="true">
        <h3 class="text-lg font-black text-slate-900">{{ title }}</h3>
        <p class="mt-2 text-sm text-slate-600">{{ message }}</p>
        <div *ngIf="requireReason" class="mt-4">
          <label class="label">{{ reasonLabel }}</label>
          <textarea class="field min-h-28" [(ngModel)]="reason" [placeholder]="reasonPlaceholder"></textarea>
          <p *ngIf="reasonError" class="mt-1 text-xs text-red-600">{{ reasonError }}</p>
        </div>
        <div class="mt-6 flex flex-wrap justify-end gap-2">
          <button type="button" class="btn-secondary" (click)="cancel.emit()">Cancelar</button>
          <button type="button" [class]="danger ? 'btn-danger' : 'btn-primary'" (click)="onConfirm()">{{ confirmLabel }}</button>
        </div>
      </div>
    </div>
  `
})
export class ConfirmDialogComponent {
  @Input() open = false;
  @Input() title = 'Confirmar';
  @Input() message = '';
  @Input() confirmLabel = 'Confirmar';
  @Input() requireReason = false;
  @Input() reasonLabel = 'Motivo';
  @Input() reasonPlaceholder = '';
  @Input() danger = false;
  @Output() cancel = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<string>();

  reason = '';
  reasonError = '';

  onBackdrop(event: MouseEvent) {
    if (event.target === event.currentTarget) this.cancel.emit();
  }

  resetReason() {
    this.reason = '';
    this.reasonError = '';
  }

  onConfirm() {
    if (this.requireReason) {
      const motivo = this.reason.trim();
      if (motivo.length < 5) {
        this.reasonError = 'Informe um motivo com pelo menos 5 caracteres.';
        return;
      }
      this.confirm.emit(motivo);
      return;
    }
    this.confirm.emit('');
  }
}
