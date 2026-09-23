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
      <aside class="fixed inset-y-0 left-0 z-40 w-72 bg-brand-navy text-white transition-transform lg:translate-x-0"
             [class.-translate-x-full]="!menuOpen" [class.translate-x-0]="menuOpen">
        <div class="flex h-20 items-center gap-3 border-b border-white/10 px-6">
          <div class="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-blue text-sm font-black">SJ</div>
          <div>
            <div class="text-sm font-extrabold leading-tight">São José Operário</div>
            <div class="text-xs text-violet-200/80">Coroinhas e acólitos</div>
          </div>
        </div>

        <nav class="space-y-1 p-4">
          <a *ngFor="let item of nav" [routerLink]="item.url" routerLinkActive="bg-brand-blue text-white"
             class="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-violet-100/80 hover:bg-white/10 hover:text-white"
             (click)="menuOpen=false">
            <svg *ngIf="item.url==='/dashboard'" class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"/></svg>
            <svg *ngIf="item.url==='/voluntarios'" class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1"/><circle cx="9.5" cy="8" r="3"/><path d="M20 19v-1a3.5 3.5 0 0 0-2.5-3.35"/><path d="M16.5 5.1a3 3 0 0 1 0 5.8"/></svg>
            <svg *ngIf="item.url==='/escalas'" class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/></svg>
            <svg *ngIf="item.url==='/relatorios'" class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 4v10"/><path d="m8 10 4 4 4-4"/><path d="M5 19h14"/></svg>
            <span>{{ item.label }}</span>
          </a>
        </nav>

        <div class="absolute bottom-0 w-full border-t border-white/10 p-4">
          <button class="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-violet-100/80 hover:bg-white/10 hover:text-white" (click)="logout()">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3"/><path d="M13 16l4-4-4-4"/><path d="M17 12H9"/></svg>
            Sair
          </button>
        </div>
      </aside>

      <div *ngIf="menuOpen" class="fixed inset-0 z-30 bg-brand-navy/50 lg:hidden" (click)="menuOpen=false"></div>

      <main class="min-w-0 flex-1 lg:ml-72">
        <header class="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-[#E7E4F5] bg-white/90 px-4 backdrop-blur md:px-8">
          <div class="flex items-center gap-3">
            <button class="rounded-xl border border-[#E7E4F5] p-2 text-brand-navy lg:hidden" (click)="menuOpen=!menuOpen" aria-label="Abrir menu">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
            </button>
            <div>
              <div class="font-extrabold text-brand-ink">Gestão de Escalas</div>
              <div class="text-xs text-slate-500">Paróquia São José Operário • Cascavel - PR</div>
            </div>
          </div>
          <div class="hidden rounded-full bg-[#F4F5FF] px-3 py-1.5 text-xs font-semibold text-brand-blue sm:block">Coordenação</div>
        </header>
        <section class="p-4 md:p-8"><router-outlet /></section>
      </main>
    </div>
  `
})
export class MainLayoutComponent {
  menuOpen = false;
  nav = [
    { label: 'Início', url: '/dashboard' },
    { label: 'Coroinhas / Acólitos', url: '/voluntarios' },
    { label: 'Escalas', url: '/escalas' },
    { label: 'Relatórios', url: '/relatorios' }
  ];

  constructor(private auth: AuthService, private router: Router) {}

  async logout() {
    await this.auth.signOut();
    await this.router.navigate(['/login']);
  }
}
