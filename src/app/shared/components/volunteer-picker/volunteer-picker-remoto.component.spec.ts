import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Subject, of } from 'rxjs';
import { VolunteerPickerComponent } from './volunteer-picker.component';
import { VoluntariosService } from '../../../features/voluntarios/services/voluntarios.service';
import { Voluntario } from '../../../features/voluntarios/models/voluntario.model';
describe('Seletor paginado de escala', () => {
    let api: jasmine.SpyObj<VoluntariosService>;
    beforeEach(() => { api = jasmine.createSpyObj('v', ['opcoes']); api.opcoes.and.returnValue(of({ itens: [], pagina: 0, tamanho: 30, temMais: false })); TestBed.configureTestingModule({ imports: [VolunteerPickerComponent], providers: [{ provide: VoluntariosService, useValue: api }] }); });
    it('fechado não consulta; busca cancela resposta antiga e fecha cancelando', fakeAsync(() => { const antiga = new Subject<{
        itens: Voluntario[];
        pagina: number;
        tamanho: number;
        temMais: boolean;
    }>(); api.opcoes.and.returnValue(antiga); const f = TestBed.createComponent(VolunteerPickerComponent); f.componentRef.setInput('remoto', true); f.detectChanges(); expect(api.opcoes).not.toHaveBeenCalled(); f.componentInstance.toggleOpen(); expect(antiga.observed).toBeTrue(); api.opcoes.and.returnValue(of({ itens: [], pagina: 0, tamanho: 30, temMais: false })); f.componentInstance.buscar('Ana'); expect(antiga.observed).toBeFalse(); tick(300); expect(api.opcoes).toHaveBeenCalledWith('Ana', 0, ''); f.componentInstance.toggleOpen(); f.destroy(); }));
    it('pagina preserva filtro e não chama lista completa', () => { api.opcoes.and.returnValue(of({ itens: [], pagina: 0, tamanho: 30, temMais: true })); const f = TestBed.createComponent(VolunteerPickerComponent); f.componentRef.setInput('remoto', true); f.detectChanges(); f.componentInstance.toggleOpen(); f.componentInstance.setTipo('COROINHA'); f.componentInstance.paginar(1); expect(api.opcoes).toHaveBeenCalledWith('', 1, 'COROINHA'); f.destroy(); });
    it('seleção entrega dados mínimos antes de emitir o id', async () => { const f = TestBed.createComponent(VolunteerPickerComponent); const c = f.componentInstance; const ordem: string[] = []; c.voluntarioSelecionado.subscribe(() => ordem.push('dados')); c.selectedIdChange.subscribe(() => ordem.push('id')); await c.choose({ id: 'v', nome_completo: 'Ana', ativo: true } as Voluntario); expect(ordem).toEqual(['dados', 'id']); });
});
