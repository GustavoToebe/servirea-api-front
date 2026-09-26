import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MascaraDirective } from './mascara.directive';

@Component({
  imports: [ReactiveFormsModule, FormsModule, MascaraDirective],
  template: `
    <input id="reativo" appMascara="cpf" [formControl]="cpf">
    <input id="modelo" appMascara="telefone" name="tel" [(ngModel)]="telefone">
  `
})
class TelaDeTeste {
  cpf = new FormControl('');
  telefone = '';
}

describe('MascaraDirective', () => {
  function digitar(input: HTMLInputElement, texto: string) {
    input.value = texto;
    input.dispatchEvent(new Event('input'));
  }

  it('formata no formulário reativo', () => {
    const fixture = TestBed.createComponent(TelaDeTeste);
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#reativo');
    digitar(input, '52998224725');
    expect(input.value).toBe('529.982.247-25');
    expect(fixture.componentInstance.cpf.value).toBe('529.982.247-25');
  });

  it('formata com ngModel', async () => {
    const fixture = TestBed.createComponent(TelaDeTeste);
    fixture.detectChanges();
    await fixture.whenStable();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('#modelo');
    digitar(input, '45999998888');
    expect(input.value).toBe('(45) 99999-8888');
    expect(fixture.componentInstance.telefone).toBe('(45) 99999-8888');
  });
});
