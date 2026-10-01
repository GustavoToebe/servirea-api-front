import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Orientacao, lerOrientacao } from '../../export/orientacao';
import { OrientacaoToggleComponent } from './orientacao-toggle.component';

@Component({
  imports: [OrientacaoToggleComponent],
  template: `<app-orientacao-toggle chave="teste" [(valor)]="orientacao" />`
})
class HostComponent { orientacao: Orientacao = lerOrientacao('teste', 'PAISAGEM'); }

describe('OrientacaoToggleComponent', () => {
  let fixture: ComponentFixture<HostComponent>;

  const botao = (valor: string) => fixture.nativeElement.querySelector(`[data-valor="${valor}"]`) as HTMLButtonElement;

  beforeEach(() => localStorage.removeItem('sv_orientacao_teste'));
  afterEach(() => localStorage.removeItem('sv_orientacao_teste'));

  function montar() {
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  }

  it('começa na orientação padrão, marcada para leitor de tela', () => {
    montar();
    expect(botao('PAISAGEM').getAttribute('aria-pressed')).toBe('true');
    expect(botao('RETRATO').getAttribute('aria-pressed')).toBe('false');
  });

  it('troca para retrato, avisa quem usa o componente e lembra a escolha', async () => {
    montar();
    botao('RETRATO').click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.orientacao).toBe('RETRATO');
    expect(botao('RETRATO').getAttribute('aria-pressed')).toBe('true');
    expect(localStorage.getItem('sv_orientacao_teste')).toBe('RETRATO');
  });

  it('usa a escolha guardada da última vez', () => {
    localStorage.setItem('sv_orientacao_teste', 'RETRATO');
    montar();
    expect(fixture.componentInstance.orientacao).toBe('RETRATO');
  });
});
