import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed, fakeAsync, flushMicrotasks, tick } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { SessaoAtual } from '../../../core/layout/sessao-atual';
import { Pessoa } from '../models/pessoa.model';
import { InscricoesApiService } from '../services/inscricoes-api.service';
import { PessoasService } from '../services/pessoas.service';
import { VoluntariosApiService } from '../services/voluntarios-api.service';
import { PessoasListComponent } from './pessoas-list.component';

/** Padrão de lista do PLANO-009: linha clicável e busca com espera de 300 ms. */
describe('PessoasListComponent (linha clicável e busca)', () => {
  let pessoas: jasmine.SpyObj<PessoasService>;

  function configurar() {
    pessoas = jasmine.createSpyObj<PessoasService>('PessoasService', ['listar', 'emCache']);
    pessoas.emCache.and.returnValue(null);
    pessoas.listar.and.resolveTo([
      { id: 'p1', nomeCompleto: 'Ana', papeis: ['VOLUNTARIO'], responsaveis: [], dependentes: [], emails: [], telefones: [],
        voluntario: { tipo: 'COROINHA' } } as unknown as Pessoa
    ]);
    const voluntarios = jasmine.createSpyObj<VoluntariosApiService>('VoluntariosApiService', ['contagens', 'listar', 'emCache']);
    voluntarios.contagens.and.resolveTo({ ativos: 0, inativos: 0 });
    voluntarios.emCache.and.returnValue(null);
    const inscricoes = jasmine.createSpyObj<InscricoesApiService>('InscricoesApiService', ['listar']);
    inscricoes.listar.and.resolveTo([]);
    TestBed.configureTestingModule({
      imports: [PessoasListComponent],
      providers: [
        provideRouter([]), provideHttpClient(), provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
        { provide: PessoasService, useValue: pessoas },
        { provide: VoluntariosApiService, useValue: voluntarios },
        { provide: InscricoesApiService, useValue: inscricoes },
        { provide: SessaoAtual, useValue: { permissoes: () => [] } }
      ]
    });
  }

  it('clicar na linha navega para o registro e clicar no checkbox não navega', async () => {
    configurar();
    const fixture = TestBed.createComponent(PessoasListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const navegar = spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);

    (fixture.nativeElement.querySelector('[data-marcar="p1"]') as HTMLInputElement).click();
    expect(navegar).not.toHaveBeenCalled();

    (fixture.nativeElement.querySelector('[data-linha="p1"]') as HTMLElement).click();
    expect(navegar).toHaveBeenCalledWith(['/pessoas', 'p1']);
  });

  it('digitar 3 letras seguidas faz uma chamada à API depois de 300 ms', fakeAsync(() => {
    configurar();
    const fixture = TestBed.createComponent(PessoasListComponent);
    fixture.detectChanges();
    flushMicrotasks();
    const antes = pessoas.listar.calls.count();

    const tela = fixture.componentInstance;
    tela.buscaDigitada('A');
    tick(100);
    tela.buscaDigitada('An');
    tick(100);
    tela.buscaDigitada('Ana');
    tick(299);
    expect(pessoas.listar.calls.count()).toBe(antes);
    tick(1);
    flushMicrotasks();
    expect(pessoas.listar.calls.count()).toBe(antes + 1);
    expect(pessoas.listar.calls.mostRecent().args[1]).toBe('Ana');
  }));
});
