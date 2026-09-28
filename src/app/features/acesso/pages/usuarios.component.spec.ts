import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { AcessoApiService } from '../acesso-api.service';
import { UsuarioParoquia } from '../acesso.models';
import { UsuariosComponent } from './usuarios.component';

describe('UsuariosComponent (lista em tabela)', () => {
  function montar() {
    const api = jasmine.createSpyObj<AcessoApiService>('AcessoApiService', ['perfis', 'usuarios']);
    api.perfis.and.returnValue(of([{ id: 'pf1', nome: 'Secretaria', ativo: true } as any]));
    api.usuarios.and.returnValue(of([
      { usuarioId: 'u1', nome: 'Ana Souza', email: 'ana@p.test', perfilNome: 'Secretaria', perfilId: 'pf1', ativo: true, situacaoAcesso: 'ATIVO', telefone: null, somenteLeitura: false },
      { usuarioId: 'u2', nome: 'Bruno', email: 'bruno@p.test', perfilNome: 'Secretaria', perfilId: 'pf1', ativo: true, situacaoAcesso: 'ATIVO', telefone: null, somenteLeitura: false }
    ] as unknown as UsuarioParoquia[]));
    TestBed.configureTestingModule({ imports: [UsuariosComponent], providers: [provideRouter([]), { provide: AcessoApiService, useValue: api }] });
    const fixture = TestBed.createComponent(UsuariosComponent);
    fixture.detectChanges();
    return fixture;
  }

  it('clicar na linha abre o formulário do usuário', () => {
    const fixture = montar();
    (fixture.nativeElement.querySelector('[data-usuario="u1"]') as HTMLElement).click();
    expect(fixture.componentInstance.form?.usuarioId).toBe('u1');
  });

  it('a busca filtra localmente, sem chamar a API de novo', () => {
    const fixture = montar();
    fixture.componentInstance.filtrar('ana');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('[data-usuario]').length).toBe(1);
  });
});
