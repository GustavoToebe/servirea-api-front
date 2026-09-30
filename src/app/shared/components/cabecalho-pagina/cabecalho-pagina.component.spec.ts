import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { CabecalhoPaginaComponent } from './cabecalho-pagina.component';

@Component({
  imports: [CabecalhoPaginaComponent],
  template: `<app-cabecalho-pagina titulo="Pessoas" subtitulo="Cadastros da paróquia" icone="👥"><button acoes data-acao>Novo</button></app-cabecalho-pagina>`
})
class HostComponent {}

describe('CabecalhoPaginaComponent', () => {
  it('renderiza título, subtítulo e o conteúdo projetado', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('[data-titulo]')!.textContent).toContain('Pessoas');
    expect(el.querySelector('[data-subtitulo]')!.textContent).toContain('Cadastros da paróquia');
    expect(el.querySelector('[data-acao]')).toBeTruthy();
  });
});
