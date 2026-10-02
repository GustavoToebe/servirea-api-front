import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AcessoApiService } from '../../../acesso/acesso-api.service';
import { SessaoAtual } from '../../../../core/layout/sessao-atual';
import { VoluntariosService } from '../../../voluntarios/services/voluntarios.service';
import { EscalasService } from '../../../escalas/services/escalas.service';
import { AniversariantesService } from '../../components/aniversariantes-card.component';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let acesso: jasmine.SpyObj<AcessoApiService>;

  beforeEach(async () => {
    acesso = jasmine.createSpyObj('AcessoApiService', ['eu']);
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: AcessoApiService, useValue: acesso },
        { provide: VoluntariosService, useValue: { active: () => Promise.resolve([]) } },
        { provide: EscalasService, useValue: { list: () => Promise.resolve([]) } },
        { provide: AniversariantesService, useValue: { doMes: () => of([{ id: 'a', nome: 'Ana', dia: 5 }]) } }
      ]
    }).compileComponents();
  });

  function criarCom(permissoes: string[]): void {
    acesso.eu.and.returnValue(of({ id: '1', nome: 'Ana', email: 'a@p.test', tipoTelefone: null, telefone: null, perfil: 'Secretário', permissoes }));
    TestBed.inject(SessaoAtual).carregar();
    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
  }

  it('com PESSOA mostra o cartão de aniversariantes', () => {
    criarCom(['PESSOA', 'ESCALA']);
    expect(fixture.nativeElement.querySelector('[data-cartao="aniversariantes"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Ana');
  });

  it('sem PESSOA o cartão nem aparece (a API daria 403)', () => {
    criarCom(['ESCALA']);
    expect(fixture.nativeElement.querySelector('[data-cartao="aniversariantes"]')).toBeNull();
  });
  it('mostra os primeiros passos somente com ONBOARDING', () => {
    criarCom(['ONBOARDING']);
    expect(fixture.nativeElement.querySelector('a[href="/primeiros-passos"]')).not.toBeNull();
  });
  it('oculta os primeiros passos sem ONBOARDING', () => {
    criarCom([]);
    expect(fixture.nativeElement.querySelector('a[href="/primeiros-passos"]')).toBeNull();
  });
});
