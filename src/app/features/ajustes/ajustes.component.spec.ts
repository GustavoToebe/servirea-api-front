import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { PALETAS, ThemeService } from '../../core/theme/theme.service';
import { AjustesComponent } from './ajustes.component';

describe('AjustesComponent', () => {
  beforeEach(() => {
    localStorage.removeItem('sv_aparencia');
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
  });
  afterEach(() => { TestBed.inject(ThemeService).restaurar(); localStorage.removeItem('sv_aparencia'); });

  it('mostra todas as paletas em cartões, em grade de duas colunas', () => {
    const fixture = TestBed.createComponent(AjustesComponent);
    fixture.detectChanges();
    const cartoes = fixture.nativeElement.querySelectorAll('[data-paleta]');
    expect(cartoes.length).toBe(PALETAS.length);
    expect(cartoes[0].parentElement.className).toContain('sm:grid-cols-2');
  });

  it('clicar num cartão troca o tema e marca só esse como em uso', () => {
    const fixture = TestBed.createComponent(AjustesComponent);
    fixture.detectChanges();
    const cartao = fixture.nativeElement.querySelector('[data-paleta-id="ROSA"]') as HTMLButtonElement;
    cartao.click();
    fixture.detectChanges();
    expect(TestBed.inject(ThemeService).paleta()).toBe('ROSA');
    expect(cartao.getAttribute('aria-pressed')).toBe('true');
    expect(fixture.nativeElement.querySelectorAll('[data-paleta][aria-pressed="true"]').length).toBe(1);
  });

  it('permite alternar entre contraste padrao e forte das bordas', () => {
    const fixture = TestBed.createComponent(AjustesComponent);
    fixture.detectChanges();
    const service = TestBed.inject(ThemeService);
    expect(service.contraste()).toBe('padrao');
    service.definirContraste('forte');
    expect(service.contraste()).toBe('forte');
    service.definirContraste('padrao');
    expect(service.contraste()).toBe('padrao');
  });
});
