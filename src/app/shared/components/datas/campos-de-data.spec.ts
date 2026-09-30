import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CampoCompetenciaComponent } from './campo-competencia.component';
import { CampoDataComponent } from './campo-data.component';

@Component({
  imports: [ReactiveFormsModule, CampoDataComponent, CampoCompetenciaComponent],
  template: `
    <div class="card" style="overflow: hidden; height: 40px" [formGroup]="form">
      <app-campo-data formControlName="nascimento" max="2026-12-31" />
      <app-campo-competencia formControlName="competencia" />
    </div>
  `
})
class TelaComponent {
  form = new FormGroup({
    nascimento: new FormControl('2026-09-05', Validators.required),
    competencia: new FormControl('2026-09')
  });
}

describe('campos de data', () => {
  async function montar() {
    const fixture = TestBed.createComponent(TelaComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  function painel(): HTMLElement {
    return document.body.querySelector(':scope > .cal-flutuante') as HTMLElement;
  }

  afterEach(() => document.body.querySelectorAll(':scope > .cal-flutuante').forEach(e => e.remove()));

  it('data: mostra DD/MM/AAAA, aceita digitado e escolhe no calendário aberto no body', async () => {
    const fixture = await montar();
    const form = fixture.componentInstance.form;
    const campo = fixture.nativeElement.querySelector('app-campo-data input') as HTMLInputElement;
    expect(campo.value).toBe('05/09/2026');

    campo.value = '10102026';
    campo.dispatchEvent(new Event('input'));
    expect(campo.value).toBe('10/10/2026');
    expect(form.value.nascimento).toBe('2026-10-10');

    campo.click();
    fixture.detectChanges();
    expect(painel()).not.toBeNull();
    expect(fixture.nativeElement.contains(painel())).toBeFalse();
    expect((painel().querySelector('[data-dia="2027-01-01"]') as HTMLButtonElement | null)?.disabled ?? true).toBeTrue();
    (painel().querySelector('[data-dia="2026-10-20"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(form.value.nascimento).toBe('2026-10-20');
    expect(painel()).toBeNull();
  });

  it('data: limpar deixa o form control vazio (e inválido quando obrigatório)', async () => {
    const fixture = await montar();
    const form = fixture.componentInstance.form;
    (fixture.nativeElement.querySelector('app-campo-data .campo-x') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(form.value.nascimento).toBe('');
    expect(form.controls.nascimento.invalid).toBeTrue();
  });

  it('competência: mostra MM/AAAA e escolhe o mês pelo número', async () => {
    const fixture = await montar();
    const campo = fixture.nativeElement.querySelector('app-campo-competencia input') as HTMLInputElement;
    expect(campo.value).toBe('09/2026');

    campo.click();
    fixture.detectChanges();
    expect(painel().textContent).not.toContain('setembro');
    (painel().querySelector('[data-mes="11"]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.form.value.competencia).toBe('2026-11');
    expect(campo.value).toBe('11/2026');
  });
});
