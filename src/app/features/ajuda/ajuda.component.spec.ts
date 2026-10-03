import { of } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter, ActivatedRoute, convertToParamMap, Route } from '@angular/router';
import { AjudaComponent } from './ajuda.component';
import { TEMAS } from './ajuda-temas';
import { ajudaDaRota } from './ajuda-da-rota';
import { SessaoAtual } from '../../core/layout/sessao-atual';
import { SECOES } from '../../core/layout/navegacao';
import { routes } from '../../app.routes';

function montar(permissoes: string[], tema = 'financeiro') {
  TestBed.configureTestingModule({ imports: [AjudaComponent], providers: [provideRouter([]),
    { provide: ActivatedRoute, useValue: { queryParamMap: of(convertToParamMap({ tema })), snapshot: { queryParamMap: convertToParamMap({ tema }) } } },
    { provide: SessaoAtual, useValue: { permissoes: signal(permissoes) } }] });
  const fixture = TestBed.createComponent(AjudaComponent);
  fixture.detectChanges();
  return fixture;
}

describe('AjudaComponent', () => {
  it('mostra só orientações dos módulos permitidos e busca sem acentos', () => {
    const fixture = montar(['PESSOA']);
    expect(fixture.nativeElement.querySelector('[data-tema="financeiro"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-tema="pessoas"]')).not.toBeNull();
    fixture.componentInstance.busca.set('responsaveis'); fixture.detectChanges();
    expect(fixture.componentInstance.temas().map(t => t.id)).toContain('pessoas');
    expect(fixture.nativeElement.querySelector('a[aria-label^="Abrir módulo"]').getAttribute('href')).toBe('/pessoas');
  });

  it('mostra resumo, cuidados, perguntas frequentes e temas relacionados, agrupados por seção', () => {
    const fixture = montar(['FINANCEIRO', 'ESCALA']);
    const tema = fixture.nativeElement.querySelector('[data-tema="financeiro"]') as HTMLElement;
    expect(tema.hasAttribute('open')).toBeTrue();
    expect(tema.querySelector('[data-resumo]')!.textContent).toContain('dinheiro');
    expect(tema.querySelector('[data-cuidados]')).not.toBeNull();
    expect(tema.querySelector('[data-perguntas]')!.textContent).toContain('conta contábil');
    expect(tema.textContent).toContain('Plano de contas');
    expect(fixture.nativeElement.querySelector('[data-secao-ajuda="financeiro"]')).not.toBeNull();
  });

  it('a busca também olha cuidados e perguntas', () => {
    const fixture = montar(['FINANCEIRO']);
    fixture.componentInstance.busca.set('estornar'); fixture.detectChanges();
    expect(fixture.componentInstance.temas().map(t => t.id)).toContain('financeiro');
  });
});

describe('Conteúdo da Ajuda', () => {
  const ids = TEMAS.map(t => t.id);

  it('cada tema é completo e consistente', () => {
    expect(new Set(ids).size).toBe(ids.length);
    for (const t of TEMAS) {
      expect(SECOES.some(s => s.id === t.secao)).withContext(t.id).toBeTrue();
      expect(t.resumo.length).withContext(t.id + ' resumo').toBeGreaterThan(30);
      expect(t.passos.length).withContext(t.id + ' passos').toBeGreaterThanOrEqual(2);
      expect((t.relacionados ?? []).every(r => ids.includes(r) && r !== t.id)).withContext(t.id + ' relacionados').toBeTrue();
    }
  });

  it('o financeiro explica o plano de contas, não "categorias"', () => {
    const f = TEMAS.find(t => t.id === 'financeiro')!;
    expect(f.titulo).toContain('plano de contas');
    expect(f.passos.join(' ')).toContain('conta contábil');
    expect(JSON.stringify(f)).not.toContain('ategoria');
  });

  it('toda tela do painel aponta para um tema que existe', () => {
    const filhas = (rs: Route[]): Route[] => rs.flatMap(r => [r, ...(r.children ? filhas(r.children) : [])]);
    const caminhos = filhas(routes as Route[])
      .filter(r => r.loadComponent && r.path && !['login', 'reset-password', 'suporte', 'inscricao', 'p/:slug', '**', 'minha-conta', 'funcionalidade-indisponivel'].includes(r.path))
      .map(r => '/' + r.path!.replace(/:id/g, '123').replace(/:slug/g, 'x'));
    expect(caminhos.length).toBeGreaterThan(30);
    for (const c of caminhos) {
      if (c === '/ajuda') { expect(ajudaDaRota(c)).toBeNull(); continue; }
      const tema = ajudaDaRota(c);
      expect(tema).withContext(c).not.toBeNull();
      expect(ids).withContext(c).toContain(tema!);
    }
  });

  it('resolve sub-telas de uma escala e ignora consulta e barra final', () => {
    expect(ajudaDaRota('/escalas/7/distribuicao')).toBe('distribuicao');
    expect(ajudaDaRota('/escalas/7/respostas')).toBe('coordenacao');
    expect(ajudaDaRota('/escalas/7')).toBe('escalas');
    expect(ajudaDaRota('/financeiro?aba=plano-de-contas')).toBe('financeiro');
    expect(ajudaDaRota('/pessoas/importar/')).toBe('importacao');
    expect(ajudaDaRota('/pessoas/9/privacidade')).toBe('privacidade');
    expect(ajudaDaRota('/ajuda?tema=x')).toBeNull();
    expect(ajudaDaRota('/')).toBeNull();
  });
});
