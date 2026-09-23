import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { pendingChangesGuard } from './core/guards/pending-changes.guard';

export const routes: Routes = [
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
