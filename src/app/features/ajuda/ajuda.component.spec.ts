import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, ActivatedRoute, convertToParamMap } from '@angular/router';
import { AjudaComponent } from './ajuda.component';
import { SessaoAtual } from '../../core/layout/sessao-atual';
describe('AjudaComponent',() => {
  it('mostra só orientações dos módulos permitidos e busca sem acentos',() => {
    TestBed.configureTestingModule({imports:[AjudaComponent],providers:[provideRouter([]),
      {provide:ActivatedRoute,useValue:{queryParamMap:of(convertToParamMap({tema:'financeiro'})),snapshot:{queryParamMap:convertToParamMap({tema:'financeiro'})}}},
      {provide:SessaoAtual,useValue:{permissoes:signal(['PESSOA'])}}]});
    const fixture=TestBed.createComponent(AjudaComponent);fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-tema="financeiro"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-tema="pessoas"]')).not.toBeNull();
    fixture.componentInstance.busca.set('responsaveis');fixture.detectChanges();
    expect(fixture.componentInstance.temas().map(t => t.id)).toEqual(['pessoas']);
    expect(fixture.nativeElement.querySelector('a').getAttribute('href')).toBe('/pessoas');
  });
});
