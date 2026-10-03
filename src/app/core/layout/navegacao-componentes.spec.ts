import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { BuscaGlobalComponent } from './busca-global.component';
import { FavoritosService } from './favoritos.service';
import { MegaMenuComponent } from './mega-menu.component';
import { NavegacaoContextualComponent } from './navegacao-contextual.component';
import { telasVisiveis } from './navegacao';

@Component({ template: '' })
class Vazio {}

const rotas = [
  { path: 'financeiro', component: Vazio }, { path: 'pessoas', component: Vazio }, { path: 'dashboard', component: Vazio },
];
const telas = telasVisiveis(['FINANCEIRO', 'PESSOA']);

describe('Favoritos', () => {
  beforeEach(() => { try { localStorage.removeItem('servire.favoritos'); } catch { /* sem armazenamento */ } });

  it('alterna, persiste e relê do armazenamento', () => {
    TestBed.configureTestingModule({});
    const f = TestBed.inject(FavoritosService);
    expect(f.eFavorito('/pessoas')).toBeFalse();
    f.alternar('/pessoas');
    expect(f.eFavorito('/pessoas')).toBeTrue();
    expect(JSON.parse(localStorage.getItem('servire.favoritos')!)).toEqual(['/pessoas']);
    f.alternar('/pessoas');
    expect(f.ids()).toEqual([]);
  });

  it('ignora armazenamento corrompido', () => {
    localStorage.setItem('servire.favoritos', '{isso não é json');
    TestBed.configureTestingModule({});
    expect(TestBed.inject(FavoritosService).ids()).toEqual([]);
  });
});

describe('Busca global', () => {
  beforeEach(() => {
    try { localStorage.removeItem('servire.favoritos'); } catch { /* sem armazenamento */ }
    TestBed.configureTestingModule({ imports: [BuscaGlobalComponent], providers: [provideRouter(rotas)] });
  });

  function montar() {
    const fixture = TestBed.createComponent(BuscaGlobalComponent);
    fixture.componentRef.setInput('telas', telas);
    fixture.detectChanges();
    return fixture;
  }
  const resultados = (f: ReturnType<typeof montar>) => Array.from(f.nativeElement.querySelectorAll('[data-resultado]') as NodeListOf<HTMLElement>).map(e => e.textContent!.trim());

  it('mostra resultados ao digitar e abre a tela com Enter', async () => {
    const f = montar();
    f.componentInstance.digitou('plano');
    f.detectChanges();
    expect(resultados(f)[0]).toContain('Plano de contas');
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    const campo = f.nativeElement.querySelector('[data-busca-global]') as HTMLInputElement;
    campo.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    expect(router.navigate).toHaveBeenCalledWith(['/financeiro'], { queryParams: { aba: 'plano-de-contas' } });
    expect(f.componentInstance.termo()).toBe('');
  });

  it('as setas percorrem os resultados e Esc fecha', () => {
    const f = montar();
    f.componentInstance.digitou('conta');
    f.detectChanges();
    const campo = f.nativeElement.querySelector('[data-busca-global]') as HTMLInputElement;
    campo.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
    expect(f.componentInstance.indice()).toBe(1);
    campo.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
    expect(f.componentInstance.indice()).toBe(0);
    campo.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(f.componentInstance.aberto()).toBeFalse();
  });

  it('sem resultado explica; sem texto mostra os favoritos', () => {
    const f = montar();
    f.componentInstance.digitou('zzzz');
    f.detectChanges();
    expect(f.nativeElement.querySelector('[data-sem-resultado]').textContent).toContain('Nenhuma tela encontrada');
    TestBed.inject(FavoritosService).alternar('/pessoas');
    f.componentInstance.digitou('');
    f.detectChanges();
    expect(resultados(f)[0]).toContain('Pessoas');
  });

  it('Ctrl+K leva o cursor para a busca', () => {
    const f = montar();
    document.body.appendChild(f.nativeElement);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    expect(document.activeElement).toBe(f.nativeElement.querySelector('[data-busca-global]'));
    f.nativeElement.remove();
  });
});

describe('Menu completo', () => {
  beforeEach(() => {
    try { localStorage.removeItem('servire.favoritos'); } catch { /* sem armazenamento */ }
    TestBed.configureTestingModule({ imports: [MegaMenuComponent], providers: [provideRouter(rotas)] });
  });

  function montar() {
    const fixture = TestBed.createComponent(MegaMenuComponent);
    fixture.componentRef.setInput('telas', telas);
    fixture.detectChanges();
    return fixture;
  }

  it('mostra as seções em colunas e favorita com a estrela', () => {
    const f = montar();
    expect(f.nativeElement.querySelector('[data-secao="financeiro"]')).not.toBeNull();
    expect(f.nativeElement.querySelector('[data-secao="cadastro"]').textContent).toContain('Pessoas');
    (f.nativeElement.querySelector('[data-secao="cadastro"] [data-favoritar]') as HTMLElement).click();
    f.detectChanges();
    expect(TestBed.inject(FavoritosService).ids().length).toBe(1);
    expect((f.nativeElement.querySelector('[data-secao="cadastro"] [data-favoritar]') as HTMLElement).getAttribute('aria-pressed')).toBe('true');
  });

  it('a busca troca as colunas por uma lista e escolher uma tela navega e fecha', () => {
    const f = montar();
    f.componentInstance.termo.set('plano');
    f.detectChanges();
    expect(f.nativeElement.querySelector('[data-mega-resultados]')).not.toBeNull();
    const fechou = jasmine.createSpy('fechou');
    f.componentInstance.fechar.subscribe(fechou);
    const router = TestBed.inject(Router);
    spyOn(router, 'navigate').and.resolveTo(true);
    (f.nativeElement.querySelector('[data-mega-resultados] li button:last-child') as HTMLElement).click();
    expect(router.navigate).toHaveBeenCalledWith(['/financeiro'], { queryParams: { aba: 'plano-de-contas' } });
    expect(fechou).toHaveBeenCalled();
    f.componentInstance.termo.set('zzzz');
    f.detectChanges();
    expect(f.nativeElement.querySelector('[data-mega-sem-resultado]')).not.toBeNull();
  });

  it('Esc e o X fecham', () => {
    const f = montar();
    const fechou = jasmine.createSpy('fechou');
    f.componentInstance.fechar.subscribe(fechou);
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    (f.nativeElement.querySelector('[data-mega-fechar]') as HTMLElement).click();
    expect(fechou).toHaveBeenCalledTimes(2);
  });
});

describe('Navegação contextual', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [NavegacaoContextualComponent], providers: [provideRouter(rotas)] }));

  async function montar(endereco: string) {
    const f = TestBed.createComponent(NavegacaoContextualComponent);
    f.componentRef.setInput('telas', telasVisiveis(['FINANCEIRO', 'PESSOA', 'PESSOA_CRIAR']));
    await TestBed.inject(Router).navigateByUrl(endereco);
    f.detectChanges();
    return f;
  }
  const chips = (f: Awaited<ReturnType<typeof montar>>) => Array.from(f.nativeElement.querySelectorAll('[data-irma]') as NodeListOf<HTMLElement>).map(e => e.textContent!.trim());

  it('no financeiro mostra as abas como atalhos e não repete o item principal', async () => {
    const f = await montar('/financeiro?aba=plano-de-contas');
    expect(f.nativeElement.querySelector('[data-tela-atual]').textContent).toContain('Plano de contas');
    expect(chips(f)).toEqual(['Lançamentos financeiros', 'Contas / bancos']);
  });

  it('numa tela de seção com várias telas lista as irmãs', async () => {
    const f = await montar('/pessoas');
    expect(f.nativeElement.querySelector('[data-navegacao-contextual]')).not.toBeNull();
    expect(f.nativeElement.textContent).toContain('Cadastro');
  });

  it('some no Início, que não tem irmãs', async () => {
    const f = await montar('/dashboard');
    expect(f.nativeElement.querySelector('[data-navegacao-contextual]')).toBeNull();
  });
});
