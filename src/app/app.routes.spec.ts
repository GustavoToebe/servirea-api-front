import { authGuard } from './core/auth/auth.guard';
import { pendingChangesGuard } from './core/guards/pending-changes.guard';
import { backofficeGuard } from './features/backoffice/backoffice.guard';
import { routes } from './app.routes';

describe('rotas da aplicação', () => {
  it('protege o app da paróquia e o backoffice', () => {
    const app = routes.find(r => r.path === '');
    const admin = routes.find(r => r.path === 'admin');
    expect(app?.canActivate).toEqual([authGuard]);
    expect(admin?.canActivate).toEqual([backofficeGuard]);
  });

  it('pede confirmação ao sair da ficha e do builder com alterações', () => {
    const filhos = routes.find(r => r.path === '')?.children || [];
    const comGuard = filhos.filter(r => r.canDeactivate?.includes(pendingChangesGuard)).map(r => r.path);
    expect(comGuard).toEqual(jasmine.arrayContaining([
      'pessoas/nova',
      'pessoas/:id/editar',
      'escalas/nova',
      'escalas/:id'
    ]));
  });

  it('expõe login, inscrição pública e atalhos antigos de voluntários', () => {
    expect(routes.some(r => r.path === 'login')).toBeTrue();
    expect(routes.some(r => r.path === 'inscricao')).toBeTrue();
    expect(routes.some(r => r.path === 'admin/login')).toBeTrue();
    const filhos = routes.find(r => r.path === '')?.children || [];
    expect(filhos.find(r => r.path === 'voluntarios')?.redirectTo).toBe('pessoas');
  });
});
