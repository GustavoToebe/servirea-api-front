import { TestBed } from '@angular/core/testing';
import { EstadoListaComponent } from './estado-lista.component';

describe('EstadoListaComponent', () => {
  it('carregando mostra o esqueleto', () => {
    const fixture = TestBed.createComponent(EstadoListaComponent);
    fixture.componentRef.setInput('carregando', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('[data-esqueleto]').length).toBe(5);
  });

  it('vazio mostra a mensagem padrão ou a informada', () => {
    const fixture = TestBed.createComponent(EstadoListaComponent);
    fixture.componentRef.setInput('vazio', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nenhum registro encontrado, tente outros filtros.');
    fixture.componentRef.setInput('mensagemVazio', 'Nenhum layout.');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Nenhum layout.');
  });
});
