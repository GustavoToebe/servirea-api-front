import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { ORIENTACOES, Orientacao, salvarOrientacao } from '../../export/orientacao';

/**
 * Escolha Paisagem ou Retrato ao lado dos botões que geram PDF ou imagem. Grava a escolha por `chave` (um tipo de
 * documento); quem usa o componente começa o valor com `lerOrientacao(chave, padrão)`, para a pessoa não marcar de
 * novo a cada arquivo.
 */
@Component({
  selector: 'app-orientacao-toggle',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="inline-flex overflow-hidden rounded-xl border border-slate-300 bg-white" role="group" aria-label="Orientação do arquivo">
      @for (o of opcoes; track o.valor) {
        <button type="button" data-orientacao [attr.data-valor]="o.valor" [attr.aria-pressed]="valor() === o.valor"
          class="px-3 py-2 text-sm font-semibold transition-colors"
          [class.bg-brand-blue]="valor() === o.valor" [class.text-white]="valor() === o.valor"
          [class.text-slate-600]="valor() !== o.valor" [class.hover:bg-slate-50]="valor() !== o.valor"
          (click)="escolher(o.valor)">{{ o.rotulo }}</button>
      }
    </div>
  `
})
export class OrientacaoToggleComponent {
  readonly opcoes = ORIENTACOES;
  readonly valor = model<Orientacao>('PAISAGEM');
  /** Nome do tipo de documento, para gravar a escolha. Vazio = não grava. */
  readonly chave = input('');

  escolher(o: Orientacao): void {
    this.valor.set(o);
    if (this.chave()) salvarOrientacao(this.chave(), o);
  }
}
