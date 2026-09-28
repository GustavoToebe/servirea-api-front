import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../modal/modal.component';

@Component({
    selector: 'app-confirm-dialog',
    imports: [FormsModule, ModalComponent],
    template: `
    <app-modal [aberto]="open" [titulo]="title" tamanho="sm" (fechar)="cancel.emit()">
      <p class="text-sm text-slate-600">{{ message }}</p>
      @if (requireReason) {
        <div class="mt-4">
          <label class="label">{{ reasonLabel }}</label>
          <textarea class="field min-h-28" [(ngModel)]="reason" [placeholder]="reasonPlaceholder"></textarea>
          @if (reasonError) {
            <p class="mt-1 text-xs text-red-600">{{ reasonError }}</p>
          }
        </div>
      }
      <div rodape class="flex flex-wrap justify-between gap-2">
        <button type="button" class="btn-secondary" (click)="cancel.emit()">Cancelar</button>
        <button type="button" [class]="danger ? 'btn-danger' : 'btn-primary'" (click)="onConfirm()">{{ confirmLabel }}</button>
      </div>
    </app-modal>
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
