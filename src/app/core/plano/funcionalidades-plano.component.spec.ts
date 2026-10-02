import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, throwError, Subject } from 'rxjs';
import { FuncionalidadesPlanoComponent } from './funcionalidades-plano.component';
import { FuncionalidadesPlanoService, moduloDoPlano } from './funcionalidades-plano.service';
import { funcionalidadePlanoGuard } from './funcionalidade-plano.guard';
describe('Funcionalidades do plano', () => {
  let api:jasmine.SpyObj<FuncionalidadesPlanoService>;
  beforeEach(() => {api=jasmine.createSpyObj('FuncionalidadesPlanoService',['consultar']);api.consultar.and.returnValue(of([]));TestBed.configureTestingModule({imports:[FuncionalidadesPlanoComponent],providers:[provideRouter([]),{provide:FuncionalidadesPlanoService,useValue:api}]});});
  it('lista vazia não libera módulos e mostra somente consulta', () => {
    const f=TestBed.createComponent(FuncionalidadesPlanoComponent);f.detectChanges();expect(f.nativeElement.textContent).toContain('Somente consulta');expect(f.nativeElement.textContent).not.toContain('Incluída');
  });
  it('libera só os códigos recebidos, sem herdar dados após falha', () => {
    api.consultar.and.returnValue(of(['FINANCEIRO']));const f=TestBed.createComponent(FuncionalidadesPlanoComponent);f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Incluída');api.consultar.and.returnValue(throwError(() => new Error('rede')));f.componentInstance.buscar();f.detectChanges();
    expect(f.componentInstance.dados()).toBeNull();expect(f.nativeElement.querySelector('[role=alert]')).toBeTruthy();
  });
  it('guard de nova operação exige código explícito', async () => {
    const guard=funcionalidadePlanoGuard('EVENTOS');
    const permitido=() => TestBed.runInInjectionContext(() => guard({} as never,{} as never));
    expect(await permitido()).not.toBeTrue();api.consultar.and.returnValue(of(['EVENTOS']));expect(await permitido()).toBeTrue();
  });
  it('resposta antiga cancelada não troca o plano atualizado', () => {
    const antigo=new Subject<string[]>();api.consultar.and.returnValue(antigo);const f=TestBed.createComponent(FuncionalidadesPlanoComponent);f.detectChanges();
    api.consultar.and.returnValue(of([]));f.componentInstance.buscar();antigo.next(['FINANCEIRO']);expect(f.componentInstance.dados()).toEqual([]);f.destroy();
  });
  it('mapeia o módulo mantendo consultas acessíveis', () => {
    expect(moduloDoPlano('/escalas/123?mes=10')).toBe('ESCALAS');expect(moduloDoPlano('/pessoas/importar')).toBe('IMPORTACAO_PESSOAS');expect(moduloDoPlano('/pessoas')).toBeNull();
  });
});
