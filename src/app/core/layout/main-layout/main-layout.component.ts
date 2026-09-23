import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen bg-app lg:flex">
      <aside class="fixed inset-y-0 left-0 z-40 w-72 border-r border-slate-800 bg-slate-900 text-white transition-transform lg:translate-x-0"
             [class.-translate-x-full]="!menuOpen" [class.translate-x-0]="menuOpen">
        <div class="flex h-20 items-center gap-3 border-b border-slate-800 px-6">
          <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-blue font-black">SJ</div>
          <div>
            <div class="text-sm font-extrabold leading-tight">São José Operário</div>
            <div class="text-xs text-slate-400">Coroinhas & Acólitos</div>
          </div>
        </div>

        <nav class="space-y-2 p-4">
          <a *ngFor="let item of nav" [routerLink]="item.url" routerLinkActive="bg-slate-800 text-white"
             class="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
             (click)="menuOpen=false">
            <span class="text-lg">{{ item.icon }}</span><span>{{ item.label }}</span>
          </a>
        </nav>

        <div class="absolute bottom-0 w-full border-t border-slate-800 p-4">
          <button class="w-full rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-300 hover:bg-slate-800" (click)="logout()">
            ↪ Sair
          </button>
        </div>
      </aside>

      <div *ngIf="menuOpen" class="fixed inset-0 z-30 bg-black/40 lg:hidden" (click)="menuOpen=false"></div>

      <main class="min-w-0 flex-1 lg:ml-72">
        <header class="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-8">
          <div class="flex items-center gap-3">
            <button class="rounded-lg border border-slate-200 p-2 lg:hidden" (click)="menuOpen=!menuOpen">☰</button>
            <div>
              <div class="font-bold text-slate-900">Gestão de Escalas</div>
              <div class="text-xs text-slate-500">Paróquia São José Operário • Cascavel - PR</div>
            </div>
          </div>
          <div class="hidden rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-brand-blue sm:block">Sistema administrativo</div>
        </header>
        <section class="p-4 md:p-8"><router-outlet /></section>
      </main>
    </div>
  `
})
export class MainLayoutComponent {
  menuOpen = false;
  nav = [
    { label: 'Início', url: '/dashboard', icon: '⌂' },
    { label: 'Coroinhas / Acólitos', url: '/voluntarios', icon: '👥' },
    { label: 'Escalas', url: '/escalas', icon: '▦' },
    { label: 'Relatórios', url: '/relatorios', icon: '↧' }
  ];

  constructor(private auth: AuthService, private router: Router) {}

  async logout() {
    await this.auth.signOut();
    await this.router.navigate(['/login']);
  }
}
