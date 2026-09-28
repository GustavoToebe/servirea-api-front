import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ModalComponent } from './modal.component';

@Component({
  imports: [ModalComponent],
  template: `
    <app-modal [aberto]="aberto" titulo="Teste" [fecharNoFundo]="fecharNoFundo" (fechar)="fechou = fechou + 1">
      <p>Corpo</p>
      <div rodape><button type="button">Ação</button></div>
    </app-modal>`
})
class HostComponent {
  aberto = true;
  fecharNoFundo = true;
  fechou = 0;
}

@Component({
  imports: [ModalComponent],
  template: `
    <app-modal [aberto]="true" titulo="Fundo" (fechar)="fundo = fundo + 1" />
    <app-modal [aberto]="confirmacao" titulo="Confirmação" [camada]="60" (fechar)="confirmacao = false; topo = topo + 1" />`
})
class DoisModaisComponent {
  confirmacao = true;
  fundo = 0;
  topo = 0;
}

describe('ModalComponent', () => {
  function montar() {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('Esc emite fechar', () => {
    const fixture = montar();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(fixture.componentInstance.fechou).toBe(1);
  });

  it('clique no fundo só fecha com fecharNoFundo', () => {
    const fixture = montar();
    (fixture.nativeElement.querySelector('[data-fundo]') as HTMLElement).click();
    expect(fixture.componentInstance.fechou).toBe(1);
    fixture.componentInstance.fecharNoFundo = false;
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('[data-fundo]') as HTMLElement).click();
    expect(fixture.componentInstance.fechou).toBe(1);
  });

  it('o foco vai para dentro ao abrir e o diálogo tem nome acessível', () => {
    const fixture = TestBed.createComponent(HostComponent);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    const dialogo = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(dialogo.getAttribute('aria-modal')).toBe('true');
    expect(document.getElementById(dialogo.getAttribute('aria-labelledby')!)!.textContent).toContain('Teste');
    expect(dialogo.contains(document.activeElement)).toBeTrue();
    fixture.nativeElement.remove();
  });

  it('com um modal sobre outro, Esc fecha só o de cima', () => {
    const fixture = TestBed.createComponent(DoisModaisComponent);
    fixture.detectChanges();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(fixture.componentInstance.topo).toBe(1);
    expect(fixture.componentInstance.fundo).toBe(0);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(fixture.componentInstance.fundo).toBe(1);
  });
});
