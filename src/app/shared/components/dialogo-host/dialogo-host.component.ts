import { Component, inject } from '@angular/core';
import { DialogoService } from '../../services/dialogo.service';
import { ModalComponent } from '../modal/modal.component';

/** Mostra o diálogo pedido ao `DialogoService` no esqueleto do `app-modal` (Esc e clique no fundo respondem "não"). */
@Component({
  selector: 'app-dialogo-host',
  imports: [ModalComponent],
  template: `
    @if (dialogo.aberto(); as d) {
      <div class="parish">
        <app-modal [aberto]="true" [titulo]="d.titulo" tamanho="sm" papel="alertdialog" [camada]="60" [mostrarFechar]="false"
          idDescricao="dialogo-mensagem" (fechar)="dialogo.responder(false)">
          <p id="dialogo-mensagem" class="whitespace-pre-line text-sm text-slate-600">{{ d.mensagem }}</p>
          <div rodape class="flex flex-wrap justify-between gap-2">
            @if (d.cancelar) {
              <button type="button" class="btn-secondary" (click)="dialogo.responder(false)">{{ d.cancelar }}</button>
            } @else {
              <span></span>
            }
            <button type="button" [class]="d.perigo ? 'btn-danger' : 'btn-primary'" (click)="dialogo.responder(true)"
              data-dialogo-confirmar>{{ d.confirmar }}</button>
          </div>
        </app-modal>
      </div>
    }
  `
})
export class DialogoHostComponent {
  readonly dialogo = inject(DialogoService);
}
