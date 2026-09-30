import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { MeuPerfil } from '../../../features/acesso/acesso.models';
import { AcessoApiService } from '../../../features/acesso/acesso-api.service';
import { AuthService } from '../../auth/auth.service';
import { montarMenu } from '../menu';
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

describe('montarMenu', () => {
  it('esconde o que o secretário não pode e mantém início, ajustes, meu perfil e escalas', () => {
    const menu = montarMenu(['PESSOA', 'PAROQUIA', 'ESCALA', 'VAGA', 'INSCRICAO']);
    expect(menu.barra.map(item => item.label)).toEqual(['Início', 'Escalas', 'Pessoas', 'Ajustes']);
    expect(menu.conta.map(item => item.label)).toEqual(['Paróquia', 'Meu perfil']);
  });

  it('mostra relatórios, perfis e usuários para quem tem o código', () => {
    const menu = montarMenu(['AUDITORIA', 'PERFIL', 'USUARIO', 'PAROQUIA', 'PESSOA', 'ESCALA']);
    expect(menu.barra.map(item => item.label)).toContain('Relatórios');
    expect(menu.conta.map(item => item.label)).toEqual(['Paróquia', 'Perfis', 'Usuários', 'Meu perfil']);
  });

  it('mostra Layouts para quem tem LAYOUT', () => {
    const menu = montarMenu(['LAYOUT', 'PAROQUIA']);
    expect(menu.conta.map(item => item.label)).toEqual(['Layouts', 'Paróquia', 'Meu perfil']);
  });

  it('sem permissão some tudo que o catálogo trava', () => {
    const menu = montarMenu([]);
    expect(menu.barra.map(item => item.label)).toEqual(['Início', 'Ajustes']);
    expect(menu.conta.map(item => item.label)).toEqual(['Meu perfil']);
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
        provideRouter([]),
        { provide: AcessoApiService, useValue: acesso },
        { provide: AuthService, useValue: { tenantNome: () => 'Paróquia Teste', signOut: () => Promise.resolve() } }
      ]
    }).compileComponents();
  });

  function criar(): void {
    fixture = TestBed.createComponent(MainLayoutComponent);
    fixture.detectChanges();
    fixture.detectChanges();
  }

  function texto(seletor: string): string {
    return (fixture.nativeElement.querySelector(seletor) as HTMLElement).textContent ?? '';
  }

  it('mostra e esconde o menu conforme as permissões do GET /me', () => {
    acesso.eu.and.returnValue(of(eu(['PESSOA', 'PAROQUIA', 'ESCALA', 'VAGA'])));
    criar();

    expect(texto('[data-menu="lateral"]')).toContain('Pessoas');
    expect(texto('[data-menu="lateral"]')).toContain('Escalas');
    expect(texto('[data-menu="lateral"]')).not.toContain('Relatórios');
    expect(texto('[data-menu="conta"]')).toContain('Paróquia');
    expect(texto('[data-menu="conta"]')).toContain('Meu perfil');
    expect(texto('[data-menu="conta"]')).not.toContain('Perfis');
    expect(texto('[data-menu="conta"]')).not.toContain('Usuários');
    expect(texto('[data-menu="barra"]')).toContain('Pessoas');
    expect(texto('[data-menu="barra"]')).toContain('Mais');
    expect(texto('[data-menu="barra"]')).not.toContain('Relatórios');
    expect(fixture.nativeElement.querySelector('[data-menu="folha"]')).toBeNull();

    (fixture.nativeElement.querySelector('[data-menu="mais"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(texto('[data-menu="folha"]')).toContain('Paróquia');
    expect(texto('[data-menu="folha"]')).toContain('Meu perfil');
    expect(texto('[data-menu="folha"]')).toContain('Sair');
    expect(texto('[data-menu="folha"]')).not.toContain('Perfis');
    expect(texto('[data-menu="folha"]')).not.toContain('Usuários');
  });

  it('com acesso total a folha traz perfis e usuários', () => {
    acesso.eu.and.returnValue(of(eu(['PERFIL', 'USUARIO', 'PAROQUIA', 'AUDITORIA', 'PESSOA', 'ESCALA'], 'Administrador')));
    criar();
    (fixture.nativeElement.querySelector('[data-menu="mais"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(texto('[data-menu="folha"]')).toContain('Perfis');
    expect(texto('[data-menu="folha"]')).toContain('Usuários');
    expect(texto('[data-menu="barra"]')).toContain('Relatórios');
  });

  it('clicar em [data-menu="recolher"] alterna recolhido, aside ganha w-20 e grava no localStorage', () => {
    acesso.eu.and.returnValue(of(eu(['PESSOA', 'PAROQUIA'])));
    criar();
    
    const btn = fixture.nativeElement.querySelector('[data-menu="recolher"]');
    btn.click();
    fixture.detectChanges();
    
    expect(fixture.componentInstance.recolhido).toBeTrue();
    const aside = fixture.nativeElement.querySelector('aside');
    expect(aside.classList.contains('w-20')).toBeTrue();
    expect(localStorage.getItem('servire.menuRecolhido')).toBe('true');
  });

  afterEach(() => {
    localStorage.removeItem('servire.menuRecolhido');
  });

  it('se o GET /me falha, esconde o que depende de permissão', () => {
    acesso.eu.and.returnValue(throwError(() => new Error('sem sessão')));
    criar();
    expect(texto('[data-menu="barra"]')).not.toContain('Pessoas');
    expect(texto('[data-menu="barra"]')).not.toContain('Escalas');
    expect(texto('[data-menu="barra"]')).not.toContain('Relatórios');
    expect(texto('[data-menu="conta"]')).not.toContain('Paróquia');
    expect(texto('[data-menu="conta"]')).toContain('Meu perfil');
    expect(texto('[data-menu="barra"]')).toContain('Mais');
  });

  it('a área de conteúdo ocupa a largura do painel, sem max-w-7xl', () => {
    acesso.eu.and.returnValue(of(eu(['PESSOA'])));
    criar();
    const secao = fixture.nativeElement.querySelector('section') as HTMLElement;
    expect(secao.classList).not.toContain('max-w-7xl');
    expect(secao.classList).not.toContain('mx-auto');
  });
});
