import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { NEVER, of, throwError } from 'rxjs';
import { Aniversariante, AniversariantesCardComponent, AniversariantesService } from './aniversariantes-card.component';

describe('AniversariantesCardComponent', () => {
  let fixture: ComponentFixture<AniversariantesCardComponent>;
  let servico: jasmine.SpyObj<AniversariantesService>;

  beforeEach(async () => {
    servico = jasmine.createSpyObj('AniversariantesService', ['doMes']);
    await TestBed.configureTestingModule({
      imports: [AniversariantesCardComponent],
      providers: [{ provide: AniversariantesService, useValue: servico }]
    }).compileComponents();
  });

  function criar(): void {
    fixture = TestBed.createComponent(AniversariantesCardComponent);
    fixture.detectChanges();
  }

  function linhas(): string[] {
    return Array.from(fixture.nativeElement.querySelectorAll('[data-aniversariante]') as NodeListOf<HTMLElement>)
      .map(li => Array.from(li.querySelectorAll('span:not(.badge)')).map(s => s.textContent!.trim()).join(' '));
  }

  /** Mesmo formato do GET /pessoas/aniversariantes (já ordenado por dia e nome pela API). */
  function pessoas(n: number, dia = 5): Aniversariante[] {
    return Array.from({ length: n }, (_, i) => ({ id: `p${i}`, nome: `Pessoa ${i + 1}`, dia }));
  }

  it('mostra carregando enquanto a API não responde', () => {
    servico.doMes.and.returnValue(NEVER);
    criar();
    expect(fixture.nativeElement.querySelector('[data-estado="carregando"]')).not.toBeNull();
  });

  it('lista dia com dois dígitos e nome, no título o mês atual', () => {
    servico.doMes.and.returnValue(of([{ id: 'a', nome: 'Ana', dia: 5 }, { id: 'c', nome: 'Carla', dia: 20 }]));
    criar();

    expect(linhas()).toEqual(['05 Ana', '20 Carla']);
    const mes = new Date().toLocaleDateString('pt-BR', { month: 'long' });
    expect(fixture.nativeElement.textContent).toContain(`Aniversariantes de ${mes}`);
  });

  it('marca "Hoje" só no aniversário do dia', () => {
    const hoje = new Date().getDate();
    const outroDia = hoje === 1 ? 2 : 1;
    servico.doMes.and.returnValue(of([{ id: 'x', nome: 'Outro', dia: outroDia }, { id: 'h', nome: 'Hoje Sim', dia: hoje }]));
    criar();

    const itens = fixture.nativeElement.querySelectorAll('[data-aniversariante]');
    const doDia = Array.from(itens as NodeListOf<HTMLElement>).find(li => li.textContent!.includes('Hoje Sim'))!;
    const outro = Array.from(itens as NodeListOf<HTMLElement>).find(li => li.textContent!.includes('Outro'))!;
    expect(doDia.querySelector('.badge')?.textContent?.trim()).toBe('Hoje');
    expect(outro.querySelector('.badge')).toBeNull();
  });

  it('com mais de 8 mostra os 8 primeiros e "Ver todos (N)" expande', () => {
    servico.doMes.and.returnValue(of(pessoas(11)));
    criar();

    expect(linhas().length).toBe(8);
    const botao = fixture.nativeElement.querySelector('[data-acao="ver-todos"]') as HTMLButtonElement;
    expect(botao.textContent).toContain('Ver todos (11)');
    botao.click();
    fixture.detectChanges();
    expect(linhas().length).toBe(11);
    expect(botao.textContent).toContain('Mostrar menos');
  });

  it('até 8 não oferece "Ver todos"', () => {
    servico.doMes.and.returnValue(of(pessoas(8)));
    criar();
    expect(fixture.nativeElement.querySelector('[data-acao="ver-todos"]')).toBeNull();
  });

  it('mês sem aniversariantes mostra o vazio', () => {
    servico.doMes.and.returnValue(of([]));
    criar();
    expect(fixture.nativeElement.querySelector('[data-estado="vazio"]').textContent).toContain('Nenhum aniversariante este mês.');
  });

  it('erro da API aparece no cartão', () => {
    servico.doMes.and.returnValue(throwError(() => new HttpErrorResponse({ status: 500, error: { message: 'Falha ao consultar.' } })));
    criar();
    expect(fixture.nativeElement.querySelector('[data-estado="erro"]').textContent).toContain('Falha ao consultar.');
  });
});
