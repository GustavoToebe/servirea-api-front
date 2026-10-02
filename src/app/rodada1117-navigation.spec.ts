import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router, RouterOutlet, provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { routes } from './app.routes';
import { AuthService } from './core/auth/auth.service';
import { SessaoAtual } from './core/layout/sessao-atual';
import { DialogoService } from './shared/services/dialogo.service';
import { LiturgiaComponent } from './features/liturgia/liturgia.component';
import { EstoqueComponent } from './features/estoque/estoque.component';
@Component({ imports: [RouterOutlet], template: '<router-outlet/>' })
class ShellTeste {
}
@Component({ template: 'Página inicial' })
class InicioTeste {
}
describe('Navegação dos módulos com rotas e guards reais', () => {
    let logged = true;
    let http: HttpTestingController;
    let dialogo: jasmine.SpyObj<DialogoService>;
    beforeEach(() => {
        logged = true;
        dialogo = jasmine.createSpyObj('dialogo', ['confirmar', 'avisar']);
        dialogo.confirmar.and.resolveTo(false);
        const app = routes.find(r => r.path === '')!;
        TestBed.configureTestingModule({ providers: [provideRouter([{ path: 'login', component: InicioTeste }, { ...app, loadComponent: undefined, component: ShellTeste, children: [{ path: 'dashboard', component: InicioTeste }, ...(app.children ?? []).filter(r => ['liturgia', 'estoque', 'indicadores'].includes(r.path ?? ''))] }]), provideHttpClient(), provideHttpClientTesting(), { provide: AuthService, useValue: { isLoggedIn: () => logged, restaurarSessao: () => Promise.resolve(false) } }, { provide: SessaoAtual, useValue: { permissoes: () => ['LITURGIA', 'LITURGIA_EDITAR', 'ESTOQUE', 'ESTOQUE_EDITAR', 'ESTOQUE_MOVIMENTAR', 'ESTOQUE_AJUSTAR', 'INDICADORES', 'ESCALA'] } }, { provide: DialogoService, useValue: dialogo }] });
        http = TestBed.inject(HttpTestingController);
    });
    afterEach(() => http.verify());
    it('sem sessão redireciona para login antes de consultar dados', async () => { logged = false; const h = await RouterTestingHarness.create(); await h.navigateByUrl('/estoque'); expect(TestBed.inject(Router).url).toBe('/login'); http.expectNone(r => r.url.includes('/estoque')); });
    it('abre liturgia e estoque pelas rotas lazy reais', async () => { const h = await RouterTestingHarness.create(); await h.navigateByUrl('/liturgia'); http.expectOne(r => r.url.endsWith('/liturgia/referencias')).flush({ itens: [], total: 0, pagina: 0, tamanho: 30 }); await h.navigateByUrl('/estoque'); http.expectOne(r => r.url.endsWith('/estoque')).flush({ itens: [], total: 0, pagina: 0, tamanho: 30 }); h.detectChanges(); expect(h.routeNativeElement?.textContent).toContain('Estoque'); });
    it('cancelar saída mantém formulário litúrgico e confirmar permite navegar', async () => { const h = await RouterTestingHarness.create(); await h.navigateByUrl('/liturgia'); http.expectOne(r => r.url.endsWith('/liturgia/referencias')).flush({ itens: [], total: 0, pagina: 0, tamanho: 30 }); const c = h.routeDebugElement!.query(d => d.componentInstance instanceof LiturgiaComponent).componentInstance as LiturgiaComponent; await c.abrirReferencia(); c.alterado.set(true); await h.navigateByUrl('/dashboard'); expect(TestBed.inject(Router).url).toBe('/liturgia'); expect(c.referencia).not.toBeNull(); dialogo.confirmar.and.resolveTo(true); await h.navigateByUrl('/dashboard'); expect(TestBed.inject(Router).url).toBe('/dashboard'); });
    it('protege alterações do estoque ao trocar de tela', async () => { const h = await RouterTestingHarness.create(); await h.navigateByUrl('/estoque'); http.expectOne(r => r.url.endsWith('/estoque')).flush({ itens: [], total: 0, pagina: 0, tamanho: 30 }); const c = h.routeDebugElement!.query(d => d.componentInstance instanceof EstoqueComponent).componentInstance as EstoqueComponent; await c.abrir(); http.expectOne(r => r.url.endsWith('/estoque/responsaveis')).flush([]); c.alterado.set(true); await h.navigateByUrl('/dashboard'); expect(TestBed.inject(Router).url).toBe('/estoque'); });
    it('erro de indicadores não exibe participação zero', async () => { const h = await RouterTestingHarness.create(); await h.navigateByUrl('/indicadores'); http.expectOne(r => r.url.endsWith('/indicadores/participacao')).flush({ message: 'Falha' }, { status: 503, statusText: 'Sem serviço' }); h.detectChanges(); expect(h.routeNativeElement?.querySelector('[role=alert]')).not.toBeNull(); expect(h.routeNativeElement?.textContent).not.toContain('0 alocações'); });
});
