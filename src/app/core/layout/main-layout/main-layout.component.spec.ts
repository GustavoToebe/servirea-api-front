import { FuncionalidadesPlanoService } from '../../plano/funcionalidades-plano.service';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Component } from '@angular/core';
import { of, throwError } from 'rxjs';
import { MeuPerfil } from '../../../features/acesso/acesso.models';
import { AcessoApiService } from '../../../features/acesso/acesso-api.service';
import { AuthService } from '../../auth/auth.service';
import { BARRA, montarMenu } from '../menu';
import { MainLayoutComponent } from './main-layout.component';

function eu(permissoes: string[], perfil = 'Secretário'): MeuPerfil {
  return {
    id: '1',
    nome: 'Ana',
    email: 'ana@paroquia.test',
    tipoTelefone: null,
    telefone: null,
    perfil,
    permissoes
  };
}

@Component({ template: '' })
class Vazio {}

describe('montarMenu', () => {
  it('esconde o que o secretário não pode e mantém início, escalas e a conta', () => {
    const menu = montarMenu(['PESSOA', 'PAROQUIA', 'ESCALA', 'VAGA', 'INSCRICAO']);
    expect(menu.barra.map(item => item.label)).toEqual(['Início', 'Escalas', 'Pessoas', 'Paróquia', 'Ajuda']);
    expect(menu.conta.map(item => item.label)).toEqual(['Ajustes', 'Meu perfil']);
  });

  it('mostra relatórios, perfis e usuários para quem tem o código', () => {
    const menu = montarMenu(['AUDITORIA', 'PERFIL', 'USUARIO', 'PAROQUIA', 'PESSOA', 'ESCALA']);
    expect(menu.barra.map(item => item.label)).toEqual(['Início', 'Escalas', 'Pessoas', 'Relatórios', 'Paróquia', 'Perfis', 'Usuários', 'Ajuda']);
  });

  it('mostra Layouts e Comunicados para quem tem o código', () => {
    const menu = montarMenu(['LAYOUT', 'COMUNICADO']);
    expect(menu.barra.map(item => item.label)).toEqual(['Início', 'Layouts', 'Comunicados', 'Ajuda']);
  });

  it('sem permissão some tudo que o catálogo trava', () => {
    const menu = montarMenu([]);
    expect(menu.barra.map(item => item.label)).toEqual(['Início', 'Ajuda']);
    expect(menu.conta.map(item => item.label)).toEqual(['Ajustes', 'Meu perfil']);
  });
});

describe('MainLayoutComponent', () => {
  let fixture: ComponentFixture<MainLayoutComponent>;
  let acesso: jasmine.SpyObj<AcessoApiService>;

  beforeEach(async () => {
    acesso = jasmine.createSpyObj('AcessoApiService', ['eu']);
    await TestBed.configureTestingModule({
      imports: [MainLayoutComponent],
      providers: [
        {provide:FuncionalidadesPlanoService,useValue:{consultar:() => of([])}},
        provideRouter([
          { path: 'ajustes', component: Vazio },
          { path: 'meu-perfil', component: Vazio },
          { path: 'pessoas', component: Vazio }
        ]),
        { provide: AcessoApiService, useValue: acesso },
        { provide: AuthService, useValue: { tenantNome: () => 'Paróquia Teste', signOut: () => Promise.resolve() } }
      ]
    }).compileComponents();
  });

  afterEach(() => {
    localStorage.removeItem('servire.menuRecolhido');
  });

  function criar(): void {
    fixture = TestBed.createComponent(MainLayoutComponent);
    fixture.detectChanges();
    fixture.detectChanges();
  }

  function el(seletor: string): HTMLElement | null {
    return fixture.nativeElement.querySelector(seletor) as HTMLElement | null;
  }

  function texto(seletor: string): string {
    return el(seletor)?.textContent ?? '';
  }

  function abrirPerfil(): void {
    el('#perfil-menu')!.click();
    fixture.detectChanges();
  }

  it('mostra e esconde o menu conforme as permissões do GET /me', () => {
    acesso.eu.and.returnValue(of(eu(['PESSOA', 'PAROQUIA', 'ESCALA', 'VAGA'])));
    criar();

    expect(texto('[data-menu="lateral"]')).toContain('Pessoas');
    expect(texto('[data-menu="lateral"]')).toContain('Escalas');
    expect(texto('[data-menu="lateral"]')).toContain('Paróquia');
    expect(texto('[data-menu="lateral"]')).not.toContain('Relatórios');
    expect(texto('[data-menu="lateral"]')).not.toContain('Ajustes');
    expect(texto('[data-menu="barra"]')).toContain('Pessoas');
    expect(texto('[data-menu="barra"]')).toContain('Mais');
    expect(texto('[data-menu="barra"]')).not.toContain('Relatórios');
    expect(el('[data-menu="folha"]')).toBeNull();
  });

  it('todo item do menu lateral tem ícone desenhado', () => {
    const todas = BARRA.flatMap(item => (item.permissao === null ? [] : typeof item.permissao === 'string' ? [item.permissao] : [...item.permissao]));
    acesso.eu.and.returnValue(of(eu(todas)));
    criar();

    const links = Array.from(fixture.nativeElement.querySelectorAll('[data-menu="lateral"] a')) as HTMLElement[];
    expect(links.length).toBe(BARRA.length);
    const semIcone = links.filter(a => (a.querySelector('svg')?.children.length ?? 0) === 0).map(a => a.getAttribute('href'));
    expect(semIcone).toEqual([]);
  });

  it('no celular, a folha "Mais" traz Ajustes, Meu perfil e Sair', () => {
    acesso.eu.and.returnValue(of(eu(['PESSOA', 'PAROQUIA', 'ESCALA', 'VAGA'])));
    criar();

    el('[data-menu="mais"]')!.click();
    fixture.detectChanges();

    expect(texto('[data-menu="folha"]')).toContain('Ajustes');
    expect(texto('[data-menu="folha"]')).toContain('Meu perfil');
    expect(texto('[data-menu="folha"]')).toContain('Sair');
  });

  it('com acesso total a folha traz o que não coube na barra do celular', () => {
    acesso.eu.and.returnValue(of(eu(['PERFIL', 'USUARIO', 'PAROQUIA', 'AUDITORIA', 'PESSOA', 'ESCALA'], 'Administrador')));
    criar();

    expect(texto('[data-menu="barra"]')).toContain('Relatórios');
    el('[data-menu="mais"]')!.click();
    fixture.detectChanges();
    expect(texto('[data-menu="folha"]')).toContain('Paróquia');
    expect(texto('[data-menu="folha"]')).toContain('Perfis');
    expect(texto('[data-menu="folha"]')).toContain('Usuários');
  });

  it('o menu do perfil traz Meus dados, Ajustes e Sair, e fecha com Esc', () => {
    acesso.eu.and.returnValue(of(eu(['PESSOA'])));
    criar();

    expect(el('#perfil-menu')!.getAttribute('aria-expanded')).toBe('false');
    abrirPerfil();
    expect(el('#perfil-menu')!.getAttribute('aria-expanded')).toBe('true');
    expect(texto('#perfil-dropdown')).toContain('Meus dados');
    expect(texto('#perfil-dropdown')).toContain('Ajustes');
    expect(texto('#perfil-dropdown')).toContain('Sair');

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(el('#perfil-dropdown')).toBeNull();
  });

  it('"Minha conta" aparece uma vez e só para quem tem PAROQUIA', () => {
    acesso.eu.and.returnValue(of(eu(['PESSOA', 'PAROQUIA'])));
    criar();
    abrirPerfil();
    expect(fixture.nativeElement.querySelectorAll('[data-menu="minha-conta"]').length).toBe(1);
  });

  it('sem PAROQUIA, o menu do perfil não oferece "Minha conta"', () => {
    acesso.eu.and.returnValue(of(eu(['PESSOA'])));
    criar();
    abrirPerfil();
    expect(el('[data-menu="minha-conta"]')).toBeNull();
    expect(texto('#perfil-dropdown')).not.toContain('Minha conta');
  });

  it('o título acompanha a página, inclusive Ajustes e Meu perfil', async () => {
    acesso.eu.and.returnValue(of(eu(['PESSOA'])));
    criar();
    const router = TestBed.inject(Router);

    await router.navigateByUrl('/ajustes');
    expect(fixture.componentInstance.titulo()).toBe('Ajustes');
    await router.navigateByUrl('/meu-perfil');
    expect(fixture.componentInstance.titulo()).toBe('Meu perfil');
    await router.navigateByUrl('/pessoas');
    expect(fixture.componentInstance.titulo()).toBe('Pessoas');
  });

  it('o subtítulo e o nome padrão da paróquia saem com acento certo', () => {
    acesso.eu.and.returnValue(of(eu(['PESSOA'])));
    criar();
    expect(texto('aside')).toContain('Coroinhas e acólitos');
    expect(texto('[data-menu="recolher"]')).toContain('«');
  });

  it('clicar em [data-menu="recolher"] alterna recolhido, aside ganha w-20 e grava no localStorage', () => {
    acesso.eu.and.returnValue(of(eu(['PESSOA', 'PAROQUIA'])));
    criar();

    el('[data-menu="recolher"]')!.click();
    fixture.detectChanges();

    expect(fixture.componentInstance.recolhido).toBeTrue();
    expect(el('aside')!.classList.contains('w-20')).toBeTrue();
    expect(localStorage.getItem('servire.menuRecolhido')).toBe('true');
  });

  it('se o GET /me falha, esconde o que depende de permissão', () => {
    acesso.eu.and.returnValue(throwError(() => new Error('sem sessão')));
    criar();
    expect(texto('[data-menu="barra"]')).not.toContain('Pessoas');
    expect(texto('[data-menu="barra"]')).not.toContain('Escalas');
    expect(texto('[data-menu="barra"]')).not.toContain('Relatórios');
    expect(texto('[data-menu="lateral"]')).not.toContain('Paróquia');
    expect(texto('[data-menu="barra"]')).toContain('Mais');
  });

  it('a área de conteúdo ocupa a largura do painel, sem max-w-7xl', () => {
    acesso.eu.and.returnValue(of(eu(['PESSOA'])));
    criar();
    const secao = el('section')!;
    expect(secao.classList).not.toContain('max-w-7xl');
    expect(secao.classList).not.toContain('mx-auto');
  });
});
