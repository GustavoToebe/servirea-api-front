import { Routes } from '@angular/router';
import { authGuard } from './core/auth/auth.guard';
import { pendingChangesGuard } from './core/guards/pending-changes.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'reset-password',
    loadComponent: () => import('./features/auth/pages/definir-senha/definir-senha.component').then(m => m.DefinirSenhaComponent)
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
      { path: 'escalas/indisponibilidades', canDeactivate: [pendingChangesGuard], loadComponent: () => import('./features/escalas/pages/indisponibilidades/indisponibilidades.component').then(m => m.IndisponibilidadesComponent) },
      { path: 'escalas/layouts', loadComponent: () => import('./features/escalas/pages/layouts/layouts-list.component').then(m => m.LayoutsListComponent), data: { breadcrumb: 'Layouts' } },
      { path: 'escalas/layouts/novo', loadComponent: () => import('./features/escalas/pages/layouts/layout-form.component').then(m => m.LayoutFormComponent) },
      { path: 'escalas/layouts/:id', loadComponent: () => import('./features/escalas/pages/layouts/layout-form.component').then(m => m.LayoutFormComponent) },
      { path: 'escalas/nova', data: { larguraTotal: true }, canDeactivate: [pendingChangesGuard], loadComponent: () => import('./features/escalas/pages/escala-builder/escala-builder.component').then(m => m.EscalaBuilderComponent) },
      { path: 'escalas/:id', data: { larguraTotal: true }, canDeactivate: [pendingChangesGuard], loadComponent: () => import('./features/escalas/pages/escala-builder/escala-builder.component').then(m => m.EscalaBuilderComponent) },
      { path: 'financeiro', canDeactivate: [pendingChangesGuard], loadComponent: () => import('./features/financeiro/financeiro.component').then(m => m.FinanceiroComponent) },
      { path: 'relatorios', loadComponent: () => import('./features/relatorios/pages/relatorios-home/relatorios-home.component').then(m => m.RelatoriosHomeComponent) },
      { path: 'ajustes', loadComponent: () => import('./features/ajustes/ajustes.component').then(m => m.AjustesComponent) },
      { path: 'layouts', loadComponent: () => import('./features/comunicacao/pages/layouts-list.component').then(m => m.LayoutsListComponent) },
      { path: 'layouts/novo', canDeactivate: [pendingChangesGuard], loadComponent: () => import('./features/comunicacao/pages/layout-form.component').then(m => m.LayoutFormComponent) },
      { path: 'layouts/:id', canDeactivate: [pendingChangesGuard], loadComponent: () => import('./features/comunicacao/pages/layout-form.component').then(m => m.LayoutFormComponent) },
      { path: 'comunicados', loadComponent: () => import('./features/comunicacao/pages/comunicados-list.component').then(m => m.ComunicadosListComponent) },
      { path: 'comunicados/:id', loadComponent: () => import('./features/comunicacao/pages/comunicado-detail.component').then(m => m.ComunicadoDetailComponent) },
      { path: 'eventos', loadComponent: () => import('./features/eventos/pages/eventos-list.component').then(m => m.EventosListComponent) },
      { path: 'eventos/novo', loadComponent: () => import('./features/eventos/pages/evento-ficha.component').then(m => m.EventoFichaComponent) },
      { path: 'eventos/:id', loadComponent: () => import('./features/eventos/pages/evento-ficha.component').then(m => m.EventoFichaComponent) },
      { path: 'paroquia', loadComponent: () => import('./features/acesso/pages/paroquia.component').then(m => m.ParoquiaComponent) },
      { path: 'perfis', loadComponent: () => import('./features/acesso/pages/perfis.component').then(m => m.PerfisComponent) },
      { path: 'usuarios', loadComponent: () => import('./features/acesso/pages/usuarios.component').then(m => m.UsuariosComponent) },
      { path: 'meu-perfil', loadComponent: () => import('./features/acesso/pages/meu-perfil.component').then(m => m.MeuPerfilComponent) },
      { path: 'minha-conta', outlet: 'modal', loadComponent: () => import('./minha-conta/minha-conta-modal.component').then(m => m.MinhaContaModalComponent) }
    ]
  },
  { path: '**', redirectTo: '' }
];
