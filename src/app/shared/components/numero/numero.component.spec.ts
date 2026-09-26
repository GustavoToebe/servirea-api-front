import { TestBed } from '@angular/core/testing';
import { NumeroComponent } from './numero.component';

describe('NumeroComponent', () => {
  it('mostra (número) e copia ao clicar sem propagar o clique', async () => {
    const copiar = spyOn(navigator.clipboard, 'writeText').and.resolveTo();
    const fixture = TestBed.createComponent(NumeroComponent);
    fixture.componentRef.setInput('numero', 2108);
    fixture.detectChanges();
    const botao = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(botao.textContent?.trim()).toBe('(2108)');

    const linha = jasmine.createSpy('linha');
    fixture.nativeElement.addEventListener('click', linha);
    botao.click();
    await new Promise(r => setTimeout(r));
    fixture.detectChanges();

    expect(copiar).toHaveBeenCalledWith('2108');
    expect(linha).not.toHaveBeenCalled();
    expect(botao.textContent).toContain('copiado');
  });

  it('sem número não mostra nada', () => {
    const fixture = TestBed.createComponent(NumeroComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });
});
