import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RodapeFormComponent } from './rodape-form.component';

describe('RodapeFormComponent', () => {
  it('Cancelar emite e Salvar fica desabilitado com carregando', () => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(RodapeFormComponent);
    const emit = spyOn(fixture.componentInstance.cancelar, 'emit');
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('[data-cancelar]') as HTMLButtonElement).click();
    expect(emit).toHaveBeenCalled();

    fixture.componentRef.setInput('carregando', true);
    fixture.detectChanges();
    const salvar = fixture.nativeElement.querySelector('[data-salvar]') as HTMLButtonElement;
    expect(salvar.disabled).toBeTrue();
    expect(salvar.textContent).toContain('Salvando');
  });
});
