import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { pendingChangesGuard } from './core/guards/pending-changes.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'suporte',
    loadComponent: () => import('./features/acesso/pages/suporte.component').then(m => m.SuporteComponent)
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
      { path: 'pessoas', loadComponent: () => import('./features/pessoas/pages/pessoas-list.component').then(m => m.PessoasListComponent) },
      { path: 'pessoas/nova', canDeactivate: [pendingChangesGuard], loadComponent: () => import('./features/pessoas/pages/pessoa-form.component').then(m => m.PessoaFormComponent) },
      { path: 'pessoas/inscricoes/:id', loadComponent: () => import('./features/pessoas/pages/inscricao-detail.component').then(m => m.InscricaoDetailComponent) },
      { path: 'pessoas/:id/editar', canDeactivate: [pendingChangesGuard], loadComponent: () => import('./features/pessoas/pages/pessoa-form.component').then(m => m.PessoaFormComponent) },
      { path: 'pessoas/:id', loadComponent: () => import('./features/pessoas/pages/pessoa-detail.component').then(m => m.PessoaDetailComponent) },
      { path: 'voluntarios', pathMatch: 'full', redirectTo: 'pessoas' },
      { path: 'voluntarios/novo', redirectTo: 'pessoas/nova' },
      { path: 'voluntarios/:id/editar', redirectTo: 'pessoas/:id/editar' },
      { path: 'voluntarios/:id', redirectTo: 'pessoas/:id' },
      { path: 'escalas', loadComponent: () => import('./features/escalas/pages/escalas-list/escalas-list.component').then(m => m.EscalasListComponent) },
      { path: 'escalas/nova', canDeactivate: [pendingChangesGuard], loadComponent: () => import('./features/escalas/pages/escala-builder/escala-builder.component').then(m => m.EscalaBuilderComponent) },
      { path: 'escalas/:id', canDeactivate: [pendingChangesGuard], loadComponent: () => import('./features/escalas/pages/escala-builder/escala-builder.component').then(m => m.EscalaBuilderComponent) },
      { path: 'relatorios', loadComponent: () => import('./features/relatorios/pages/relatorios-home/relatorios-home.component').then(m => m.RelatoriosHomeComponent) },
      { path: 'ajustes', loadComponent: () => import('./features/ajustes/ajustes.component').then(m => m.AjustesComponent) },
      { path: 'perfis', loadComponent: () => import('./features/acesso/pages/perfis.component').then(m => m.PerfisComponent) },
      { path: 'usuarios', loadComponent: () => import('./features/acesso/pages/usuarios.component').then(m => m.UsuariosComponent) },
      { path: 'meu-perfil', loadComponent: () => import('./features/acesso/pages/meu-perfil.component').then(m => m.MeuPerfilComponent) }
    ]
  },
  { path: '**', redirectTo: '' }
];
