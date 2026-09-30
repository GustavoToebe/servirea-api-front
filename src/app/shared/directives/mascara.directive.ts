import { Directive, ElementRef, HostListener, Input, inject } from '@angular/core';
import { NgControl } from '@angular/forms';
import { Mascara, formatar } from '../utils/formatos';

/**
 * Formata o campo enquanto digita (`<input appMascara="cpf">`). Funciona
 * com formulário reativo e com `ngModel`: grava no controle o texto já
 * formatado, que é o mesmo que a API guarda.
 */
@Directive({ selector: 'input[appMascara]' })
export class MascaraDirective {
  @Input({ required: true }) appMascara!: Mascara;

  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef);
  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  @HostListener('input')
  aoDigitar() {
    const input = this.el.nativeElement;
    const formatado = formatar(this.appMascara, input.value);
    if (formatado !== input.value) input.value = formatado;
    if (this.ngControl?.control && this.ngControl.control.value !== formatado) {
      this.ngControl.control.setValue(formatado, { emitModelToViewChange: false });
      this.ngControl.viewToModelUpdate(formatado);
    }
  }
}
