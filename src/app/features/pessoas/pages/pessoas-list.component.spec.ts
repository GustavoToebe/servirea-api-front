import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { Pessoa } from '../models/pessoa.model';
import { InscricoesApiService } from '../services/inscricoes-api.service';
import { PessoasService } from '../services/pessoas.service';
import { VoluntariosApiService } from '../services/voluntarios-api.service';
import { PessoasListComponent } from './pessoas-list.component';

describe('PessoasListComponent (lista de assinatura)', () => {
  function pessoa(id: string, nome: string, tipo: 'COROINHA' | 'ACOLITO'): Pessoa {
    return {
      id, nomeCompleto: nome, sequencial: Number(id), dataNascimento: null, papeis: ['VOLUNTARIO'], responsaveis: [],
      voluntario: { tipo, funcoesHabilitadas: [] }
    } as unknown as Pessoa;
  }

  async function montar() {
    const pessoas = jasmine.createSpyObj<PessoasService>('PessoasService', ['listar']);
    pessoas.listar.and.resolveTo([pessoa('1', 'Ana', 'COROINHA'), pessoa('2', 'Bruno', 'ACOLITO'), pessoa('3', 'Carla', 'COROINHA')]);
    const voluntarios = jasmine.createSpyObj<VoluntariosApiService>('VoluntariosApiService', ['contar', 'listar']);
    voluntarios.contar.and.resolveTo(0);
    const inscricoes = jasmine.createSpyObj<InscricoesApiService>('InscricoesApiService', ['listar']);
    inscricoes.listar.and.resolveTo([]);
    TestBed.configureTestingModule({
      imports: [PessoasListComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
        { provide: PessoasService, useValue: pessoas },
        { provide: VoluntariosApiService, useValue: voluntarios },
        { provide: InscricoesApiService, useValue: inscricoes }
      ]
    });
    const fixture = TestBed.createComponent(PessoasListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('marcar todos, desmarcar um e abrir o modal só com os marcados', async () => {
    const fixture = await montar();
    const tela = fixture.componentInstance;
    const el = fixture.nativeElement as HTMLElement;
    const botao = () => Array.from(el.querySelectorAll('button')).find(b => b.textContent?.includes('Gerar lista de assinatura'))!;
    expect(botao().disabled).toBeTrue();

    const todos = el.querySelector('[data-marcar-todos]') as HTMLInputElement;
    todos.click();
    fixture.detectChanges();
    expect(tela.quantidadeMarcada).toBe(3);

    (el.querySelector('[data-marcar="2"]') as HTMLInputElement).click();
    fixture.detectChanges();
    expect(tela.quantidadeMarcada).toBe(2);
    expect(todos.indeterminate).toBeTrue();

    botao().click();
    fixture.detectChanges();
    expect(tela.itensLista.map(i => i.nome)).toEqual(['Ana', 'Carla']);
    expect(el.querySelector('[aria-label="Gerar lista de assinatura"]')).not.toBeNull();
  });

  it('o filtro de tipo esconde quem estava marcado e ele não entra na lista', async () => {
    const fixture = await montar();
    const tela = fixture.componentInstance;
    tela.marcarTodos(true);
    tela.tipo = 'COROINHA';
    fixture.detectChanges();
    expect(tela.quantidadeMarcada).toBe(2);
    expect(tela.itensMarcados().map(i => i.nome)).toEqual(['Ana', 'Carla']);
  });
});
