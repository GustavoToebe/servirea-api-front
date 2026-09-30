import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { Duplicidade, MOTIVO_LABEL } from '../models/pessoa.model';

@Component({
  selector: 'app-duplicidades-dialog',
  standalone: true,
  imports: [DatePipe, ModalComponent],
  template: `
    <app-modal [aberto]="open" [titulo]="temBloqueante() ? 'Este CPF já está cadastrado' : 'Encontramos cadastros parecidos'"
      rotulo="Cadastros parecidos" (fechar)="fechar.emit()">
      @if (!temBloqueante()) {
        <p class="mb-4 text-sm text-slate-500">Confira se não é a mesma pessoa antes de continuar.</p>
      }
      <div class="flex flex-col gap-3">
        @for (item of itens; track item.id) {
          <div class="rounded-xl border border-slate-200 p-4">
            <div class="flex items-start justify-between">
              <div>
                <div class="font-bold text-slate-800">
                  {{ item.nomeCompleto }}
                  @if (item.sequencial) { <span class="font-normal text-slate-500">#{{ item.sequencial }}</span> }
                </div>
                @if (item.dataNascimento) { <div class="text-sm text-slate-500">Nasc: {{ item.dataNascimento | date:'dd/MM/yyyy' }}</div> }
              </div>
              <a [href]="'/pessoas/' + item.id" target="_blank" class="text-sm font-medium text-brand-blue hover:underline">Abrir</a>
            </div>
            <div class="mt-2 flex flex-wrap gap-1">
              @for (motivo of item.motivos; track motivo) {
                <span class="rounded-full px-2 py-0.5 text-xs font-semibold"
                      [class]="motivo === 'CPF' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'">
                  {{ motivosRotulo[motivo] }}
                </span>
              }
            </div>
          </div>
        }
      </div>
      <div rodape class="flex flex-wrap items-center justify-between gap-2">
        @if (temBloqueante()) {
          <span></span>
          <button type="button" class="btn-primary" (click)="fechar.emit()">Fechar</button>
        } @else {
          <button type="button" class="btn-secondary" (click)="fechar.emit()">Voltar</button>
          <button type="button" class="btn-primary" (click)="continuar.emit()">
            {{ acao === 'aprovar' ? 'Aprovar mesmo assim' : 'Salvar mesmo assim' }}
          </button>
        }
      </div>
    </app-modal>
  `
})
export class DuplicidadesDialogComponent {
  @Input() open = false;
  @Input() itens: Duplicidade[] = [];
  @Input() acao: 'salvar' | 'aprovar' = 'salvar';
  @Output() fechar = new EventEmitter<void>();
  @Output() continuar = new EventEmitter<void>();

  readonly motivosRotulo = MOTIVO_LABEL;

  temBloqueante(): boolean {
    return this.itens.some(i => i.bloqueia);
  }
}
