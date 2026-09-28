import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Duplicidade, MOTIVO_LABEL } from '../models/pessoa.model';

@Component({
  selector: 'app-duplicidades-dialog',
  standalone: true,
  imports: [DatePipe],
  template: `
    @if (open) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" (click)="aoClicarFundo($event)">
        <div class="card w-full max-w-lg p-6" role="dialog" aria-modal="true" aria-label="Cadastros parecidos">
          <div class="flex items-start justify-between gap-4">
            <div>
              @if (temBloqueante()) {
                <h3 class="text-lg font-black text-slate-900">Este CPF já está cadastrado</h3>
              } @else {
                <h3 class="text-lg font-black text-slate-900">Encontramos cadastros parecidos</h3>
                <p class="mt-1 text-sm text-slate-500">Confira se não é a mesma pessoa antes de continuar.</p>
              }
            </div>
            <button type="button" class="rounded-lg px-2 py-1 text-slate-400 hover:text-slate-700" aria-label="Fechar" (click)="fechar.emit()">✕</button>
          </div>
          
          <div class="mt-5 flex flex-col gap-3 max-h-96 overflow-y-auto">
            @for (item of itens; track item.id) {
              <div class="rounded-xl border border-slate-200 p-4">
                <div class="flex justify-between items-start">
                  <div>
                    <div class="font-bold text-slate-800">
                      {{ item.nomeCompleto }}
                      @if (item.sequencial) { <span class="text-slate-500 font-normal">#{{ item.sequencial }}</span> }
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

          <div class="mt-6 flex flex-wrap items-center justify-end gap-2">
            @if (temBloqueante()) {
              <button type="button" class="btn-primary" (click)="fechar.emit()">Fechar</button>
            } @else {
              <button type="button" class="btn-secondary" (click)="fechar.emit()">Voltar</button>
              <button type="button" class="btn-primary" (click)="continuar.emit()">
                {{ acao === 'aprovar' ? 'Aprovar mesmo assim' : 'Salvar mesmo assim' }}
              </button>
            }
          </div>
        </div>
      </div>
    }
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

  aoClicarFundo(evento: MouseEvent): void {
    if (evento.target === evento.currentTarget) this.fechar.emit();
  }
}
