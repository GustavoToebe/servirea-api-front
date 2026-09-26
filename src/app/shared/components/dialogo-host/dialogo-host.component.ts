import { Component, HostListener, inject } from '@angular/core';
import { DialogoService } from '../../services/dialogo.service';

/** Mostra o diálogo pedido ao `DialogoService`, com o visual do `app-confirm-dialog`. */
@Component({
  selector: 'app-dialogo-host',
  template: `
    @if (dialogo.aberto(); as d) {
      <div class="parish">
        <div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" (click)="fundo($event)">
          <div class="card w-full max-w-md p-6" role="alertdialog" aria-modal="true"
            [attr.aria-labelledby]="'dialogo-titulo'" [attr.aria-describedby]="'dialogo-mensagem'">
            <h3 id="dialogo-titulo" class="text-lg font-black text-slate-900">{{ d.titulo }}</h3>
            <p id="dialogo-mensagem" class="mt-2 whitespace-pre-line text-sm text-slate-600">{{ d.mensagem }}</p>
            <div class="mt-6 flex flex-wrap justify-end gap-2">
              @if (d.cancelar) {
                <button type="button" class="btn-secondary" (click)="dialogo.responder(false)">{{ d.cancelar }}</button>
              }
              <button type="button" [class]="d.perigo ? 'btn-danger' : 'btn-primary'" (click)="dialogo.responder(true)"
                data-dialogo-confirmar>{{ d.confirmar }}</button>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class DialogoHostComponent {
  readonly dialogo = inject(DialogoService);

  fundo(event: MouseEvent) {
    if (event.target === event.currentTarget) this.dialogo.responder(false);
  }

  @HostListener('document:keydown.escape')
  esc() {
    this.dialogo.responder(false);
  }
}
