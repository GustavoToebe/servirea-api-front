import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { OlhoSenhaComponent } from './olho-senha.component';

@Component({
  imports: [OlhoSenhaComponent],
  template: `<div class="relative"><input #s type="password" value="123"><app-olho-senha [campo]="s" /></div>`
})
class TelaComponent {}

describe('OlhoSenhaComponent', () => {
  it('mostra e esconde a senha sem tirar o foco do campo', () => {
    const fixture = TestBed.createComponent(TelaComponent);
    fixture.detectChanges();
    const campo = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const olho = fixture.nativeElement.querySelector('app-olho-senha button') as HTMLButtonElement;
    expect(olho.getAttribute('aria-label')).toBe('Mostrar senha');

    const mousedown = new MouseEvent('mousedown', { cancelable: true });
    olho.dispatchEvent(mousedown);
    expect(mousedown.defaultPrevented).toBeTrue();

    olho.click();
    fixture.detectChanges();
    expect(campo.type).toBe('text');
    expect(olho.getAttribute('aria-label')).toBe('Esconder senha');

    olho.click();
    fixture.detectChanges();
    expect(campo.type).toBe('password');
  });
});
