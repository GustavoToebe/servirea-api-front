import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { initials } from '../backoffice.models';
import { BackofficeAuthService } from '../backoffice-auth.service';

@Component({
  selector: 'app-backoffice-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="bo min-h-screen">
      <header class="bo-top fixed inset-x-0 top-0 z-40 flex items-center gap-3 px-4">
        <button class="rounded-lg p-2 text-neutral-300 hover:bg-white/5 lg:hidden" (click)="menuOpen=!menuOpen" aria-label="Abrir menu">
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
        </button>
        <a routerLink="/admin/dashboard" class="flex items-center gap-2 font-extrabold tracking-tight">
          <span class="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e10600] text-sm text-white">S</span>
          <span>SERVIRE</span>
        </a>
        <span class="hidden text-xs font-medium text-neutral-500 sm:block">Operação da plataforma</span>
        <div class="ml-auto flex items-center gap-3">
          <div class="hidden text-right leading-tight sm:block">
            <div class="text-sm font-semibold">{{ email || 'Operador' }}</div>
            <div class="text-[11px] text-neutral-500">Operador</div>
          </div>
          <div class="bo-avatar h-9 w-9 text-xs ring-2 ring-[#e10600]">{{ mark }}</div>
        </div>
      </header>

      <aside class="bo-rail fixed bottom-0 left-0 top-14 z-30 flex flex-col items-center gap-1 py-3 transition-transform lg:translate-x-0"
             [class.-translate-x-full]="!menuOpen" [class.translate-x-0]="menuOpen">
        <a *ngFor="let item of nav" [routerLink]="item.url" routerLinkActive="active"
           class="flex h-11 w-11 items-center justify-center rounded-xl"
           [attr.title]="item.label" (click)="menuOpen=false">
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <ng-container *ngIf="item.id==='home'"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"/></ng-container>
            <ng-container *ngIf="item.id==='church'"><path d="M4 20V10l8-6 8 6v10"/><path d="M9 20v-6h6v6"/><path d="M12 4v3"/></ng-container>
            <ng-container *ngIf="item.id==='plans'"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/><path d="M7 15h3"/></ng-container>
            <ng-container *ngIf="item.id==='users'"><path d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1"/><circle cx="9.5" cy="8" r="3"/><path d="M20 19v-1a3.5 3.5 0 0 0-2.5-3.35"/><path d="M16.5 5.1a3 3 0 0 1 0 5.8"/></ng-container>
            <ng-container *ngIf="item.id==='logs'"><path d="M8 6h11M8 12h11M8 18h11"/><path d="M4 6h.01M4 12h.01M4 18h.01"/></ng-container>
          </svg>
        </a>
        <button class="mt-auto flex h-11 w-11 items-center justify-center rounded-xl text-neutral-400 hover:bg-[#161616] hover:text-white" title="Sair" (click)="logout()">
          <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3"/><path d="M13 16l4-4-4-4"/><path d="M17 12H9"/></svg>
        </button>
      </aside>

      <div *ngIf="menuOpen" class="fixed inset-0 z-20 bg-black/60 lg:hidden" (click)="menuOpen=false"></div>
      <main class="bo-main"><router-outlet /></main>
    </div>
  `
})
export class BackofficeLayoutComponent {
  menuOpen = false;
  email = '';
  mark = 'S';
  nav = [
    { id: 'home', label: 'Início', url: '/admin/dashboard' },
    { id: 'church', label: 'Paróquias', url: '/admin/paroquias' },
    { id: 'plans', label: 'Planos e preços', url: '/admin/planos' },
    { id: 'users', label: 'Usuários', url: '/admin/usuarios' },
    { id: 'logs', label: 'Logs', url: '/admin/logs' }
  ];

  constructor(private auth: BackofficeAuthService, private router: Router) {
    this.email = this.auth.email();
    this.mark = initials(this.email.split('@')[0]?.replace(/[._]/g, ' ') || 'S');
  }

  async logout() {
    await this.auth.logout();
    await this.router.navigate(['/admin/login']);
  }
}
