import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { OpcaoSelectBusca, SelectBuscaComponent } from './select-busca.component';

@Component({
  imports: [FormsModule, SelectBuscaComponent],
  template: `<app-select-busca [opcoes]="opcoes" [(ngModel)]="valor" />`
})
class HostComponent {
  valor: string | null = null;
  opcoes: OpcaoSelectBusca[] = [
    { valor: '1', rotulo: 'João da Silva', detalhe: 'nº 12' },
    { valor: '2', rotulo: 'Maria Conceição', detalhe: 'nº 7' },
    { valor: '3', rotulo: 'Pedro Araújo' }
  ];
}

describe('SelectBuscaComponent', () => {
  function montar() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  }

  function abrir(fixture: ReturnType<typeof montar>): HTMLInputElement {
    (fixture.nativeElement.querySelector('[data-select-busca]') as HTMLButtonElement).click();
    fixture.detectChanges();
    return document.body.querySelector('[data-busca-opcao]') as HTMLInputElement;
  }

  it('filtra sem acento e sem diferenciar maiúsculas', () => {
    const fixture = montar();
    const campo = abrir(fixture);
    campo.value = 'CONCEICAO';
    campo.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    const itens = document.body.querySelectorAll('li[role="option"]');
    expect(itens.length).toBe(1);
    expect(itens[0].textContent).toContain('Maria Conceição');
    fixture.destroy();
  });

  it('Enter escolhe o destacado e fecha', () => {
    const fixture = montar();
    const campo = abrir(fixture);
    campo.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    campo.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.valor).toBe('2');
    expect(document.body.querySelector('[data-busca-opcao]')).toBeNull();
    fixture.destroy();
  });

  it('✕ limpa e emite null', async () => {
    const fixture = montar();
    fixture.componentInstance.valor = '1';
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('[data-limpar]') as HTMLElement).click();
    expect(fixture.componentInstance.valor).toBeNull();
  });

  it('fechado não registra listener global', () => {
    const add = spyOn(document, 'addEventListener').and.callThrough();
    const fixture = montar();
    expect(add.calls.allArgs().map(a => a[0])).not.toContain('mousedown');
    abrir(fixture);
    expect(add.calls.allArgs().map(a => a[0])).toContain('mousedown');
    fixture.destroy();
  });
});
