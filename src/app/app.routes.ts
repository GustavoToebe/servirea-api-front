import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { pendingChangesGuard } from './core/guards/pending-changes.guard';
import { backofficeGuard } from './features/backoffice/backoffice.guard';

export const routes: Routes = [
  {
    path: 'admin/login',
    loadComponent: () => import('./features/backoffice/pages/backoffice-login.component').then(m => m.BackofficeLoginComponent)
  },
  {
    path: 'admin',
    canActivate: [backofficeGuard],
    loadComponent: () => import('./features/backoffice/layout/backoffice-layout.component').then(m => m.BackofficeLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./features/backoffice/pages/backoffice-dashboard.component').then(m => m.BackofficeDashboardComponent) },
      { path: 'paroquias', loadComponent: () => import('./features/backoffice/pages/paroquias-list.component').then(m => m.ParoquiasListComponent) },
      { path: 'paroquias/nova', loadComponent: () => import('./features/backoffice/pages/paroquia-form.component').then(m => m.ParoquiaFormComponent) },
      { path: 'paroquias/:id', loadComponent: () => import('./features/backoffice/pages/paroquia-form.component').then(m => m.ParoquiaFormComponent) },
      { path: 'usuarios', loadComponent: () => import('./features/backoffice/pages/usuarios-list.component').then(m => m.UsuariosListComponent) },
      { path: 'usuarios/novo', loadComponent: () => import('./features/backoffice/pages/usuario-form.component').then(m => m.UsuarioFormComponent) },
      { path: 'usuarios/:id', loadComponent: () => import('./features/backoffice/pages/usuario-form.component').then(m => m.UsuarioFormComponent) },
      { path: 'logs', loadComponent: () => import('./features/backoffice/pages/logs-list.component').then(m => m.LogsListComponent) }
    ]
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'inscricao',
    loadComponent: () => import('./features/inscricoes/pages/inscricao-publica/inscricao-publica.component').then(m => m.InscricaoPublicaComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./core/layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/pages/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'voluntarios', loadComponent: () => import('./features/voluntarios/pages/voluntarios-list/voluntarios-list.component').then(m => m.VoluntariosListComponent) },
      { path: 'voluntarios/novo', canDeactivate: [pendingChangesGuard], loadComponent: () => import('./features/voluntarios/pages/voluntario-form/voluntario-form.component').then(m => m.VoluntarioFormComponent) },
      { path: 'voluntarios/inscricoes/:id/editar', canDeactivate: [pendingChangesGuard], loadComponent: () => import('./features/voluntarios/pages/inscricao-edit/inscricao-edit.component').then(m => m.InscricaoEditComponent) },
      { path: 'voluntarios/inscricoes/:id', loadComponent: () => import('./features/voluntarios/pages/inscricao-detail/inscricao-detail.component').then(m => m.InscricaoDetailComponent) },
      { path: 'voluntarios/:id/editar', canDeactivate: [pendingChangesGuard], loadComponent: () => import('./features/voluntarios/pages/voluntario-form/voluntario-form.component').then(m => m.VoluntarioFormComponent) },
      { path: 'voluntarios/:id', loadComponent: () => import('./features/voluntarios/pages/voluntario-detail/voluntario-detail.component').then(m => m.VoluntarioDetailComponent) },
      { path: 'escalas', loadComponent: () => import('./features/escalas/pages/escalas-list/escalas-list.component').then(m => m.EscalasListComponent) },
      { path: 'escalas/nova', canDeactivate: [pendingChangesGuard], loadComponent: () => import('./features/escalas/pages/escala-builder/escala-builder.component').then(m => m.EscalaBuilderComponent) },
      { path: 'escalas/:id', canDeactivate: [pendingChangesGuard], loadComponent: () => import('./features/escalas/pages/escala-builder/escala-builder.component').then(m => m.EscalaBuilderComponent) },
      { path: 'relatorios', loadComponent: () => import('./features/relatorios/pages/relatorios-home/relatorios-home.component').then(m => m.RelatoriosHomeComponent) }
    ]
  },
  { path: '**', redirectTo: '' }
];
