import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { ComunicadosApiService } from '../comunicados-api.service';
import { LayoutsApiService } from '../layouts-api.service';
import { ComunicadosListComponent } from './comunicados-list.component';
import { LayoutsListComponent } from './layouts-list.component';

/** Padrão de lista do PLANO-009: clicar na linha abre o registro; os botões da linha não. */
describe('Listas de comunicação (linha clicável)', () => {
  it('Layouts: clicar na linha abre o layout; o botão Excluir não navega', async () => {
    const api = jasmine.createSpyObj<LayoutsApiService>('LayoutsApiService', ['listar', 'excluir']);
    api.listar.and.resolveTo([{ id: 'l1', nome: 'Aviso', tipoLayout: 'TODOS', tipoEnvio: 'EMAIL', conteudo: 'x', ativo: true }]);
    TestBed.configureTestingModule({ imports: [LayoutsListComponent], providers: [provideRouter([]), { provide: LayoutsApiService, useValue: api }] });
    const fixture = TestBed.createComponent(LayoutsListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const navegar = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

    (fixture.nativeElement.querySelector('[data-layout="l1"] .btn-danger') as HTMLButtonElement).click();
    expect(navegar).not.toHaveBeenCalled();

    (fixture.nativeElement.querySelector('[data-layout="l1"]') as HTMLElement).click();
    expect(navegar).toHaveBeenCalledWith(['/layouts', 'l1']);
  });

  it('Comunicados: clicar na linha abre o detalhe', async () => {
    const api = jasmine.createSpyObj<ComunicadosApiService>('ComunicadosApiService', ['listar']);
    api.listar.and.resolveTo([{ id: 'c1', canal: 'EMAIL', layoutNome: 'Aviso', assunto: 'Reunião', enviarPara: 'PESSOA', status: 'CONCLUIDO',
      total: 1, enviados: 1, falhas: 0, createdAt: '2026-09-28T12:00:00Z', concluidoEm: null }]);
    TestBed.configureTestingModule({ imports: [ComunicadosListComponent], providers: [provideRouter([]), { provide: ComunicadosApiService, useValue: api }] });
    const fixture = TestBed.createComponent(ComunicadosListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const navegar = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    (fixture.nativeElement.querySelector('[data-comunicado="c1"]') as HTMLElement).click();
    expect(navegar).toHaveBeenCalledWith(['/comunicados', 'c1']);
    fixture.destroy();
  });
});
