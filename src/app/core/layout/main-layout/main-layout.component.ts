import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { ActivatedRouteSnapshot, NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgClass } from '@angular/common';
import { AuthService } from '../../auth/auth.service';
import { BARRA, CONTA, montarMenu } from '../menu';
import { SessaoAtual } from '../sessao-atual';

@Component({
    selector: 'app-main-layout',
    imports: [RouterOutlet, RouterLink, RouterLinkActive, NgClass],
    template: `
    <div class="parish min-h-screen bg-app lg:flex">
      <aside class="fixed inset-y-0 left-0 z-40 hidden bg-brand-navy text-white lg:block transition-[width] duration-200" [ngClass]="recolhido ? 'w-20' : 'w-72'">
        <div class="flex h-20 items-center gap-3 border-b border-white/10" [ngClass]="recolhido ? 'justify-center px-0' : 'px-6'">
          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-blue text-sm font-black">{{ marca() }}</div>
          @if (!recolhido) {
          <div class="min-w-0">
            <div class="text-sm font-extrabold leading-tight truncate">{{ paroquia() }}</div>
            <div class="text-xs text-violet-200/80 truncate">Coroinhas e acólitos</div>
          </div>
          }
        </div>

        <nav class="space-y-1 p-4" data-menu="lateral">
          @for (item of menu().barra; track item.url) {
            <a [routerLink]="item.url" routerLinkActive="!bg-brand-blue !text-white"
              [title]="recolhido ? item.label : ''"
              class="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-violet-100/80 hover:bg-white/10 hover:text-white"
              [ngClass]="recolhido ? 'justify-center px-0' : ''">
              <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                @switch (item.url) {
                  @case ('/dashboard') { <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"/> }
                  @case ('/escalas') { <rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/> }
                  @case ('/pessoas') { <path d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1"/><circle cx="9.5" cy="8" r="3"/><path d="M20 19v-1a3.5 3.5 0 0 0-2.5-3.35M16.5 5.1a3 3 0 0 1 0 5.8"/> }
                  @case ('/relatorios') { <path d="M5 19V9M10 19V5M15 19v-7M20 19V8"/> }
                  @case ('/ajustes') { <circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4"/> }
                }
              </svg>
              @if (!recolhido) { <span>{{ item.label }}</span> }
            </a>
          }
        </nav>
        <nav class="space-y-1 px-4" data-menu="conta">
          @for (item of menu().conta; track item.url) {
            <a [routerLink]="item.url" routerLinkActive="!bg-brand-blue !text-white"
              [title]="recolhido ? item.label : ''"
              class="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-violet-100/80 hover:bg-white/10 hover:text-white"
              [ngClass]="recolhido ? 'justify-center px-0' : ''">
              @if (recolhido) {
                <div class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100/20 text-xs font-bold">{{ item.label[0] }}</div>
              } @else {
                <span>{{ item.label }}</span>
              }
            </a>
          }
        </nav>

        <div class="absolute bottom-0 w-full border-t border-white/10 p-4" [ngClass]="recolhido ? 'px-2' : 'px-4'">
          <button type="button" class="mb-1 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-violet-100/80 hover:bg-white/10 hover:text-white" (click)="alternarRecolhido()" data-menu="recolher" [attr.aria-label]="recolhido ? 'Expandir menu' : 'Recolher menu'" [ngClass]="recolhido ? 'justify-center px-0' : ''">
            <span class="text-xl font-bold">{{ recolhido ? '»' : '«' }}</span>
          </button>
          <button type="button" class="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-violet-100/80 hover:bg-white/10 hover:text-white" (click)="logout()" [title]="recolhido ? 'Sair' : ''" [ngClass]="recolhido ? 'justify-center px-0' : ''">
            <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3"/><path d="M13 16l4-4-4-4"/><path d="M17 12H9"/></svg>
            @if (!recolhido) { <span>Sair</span> }
          </button>
        </div>
      </aside>

      <main class="min-w-0 flex-1 transition-[margin] duration-200" [ngClass]="recolhido ? 'lg:ml-20' : 'lg:ml-72'">
        <header class="parish-header sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#E7E4F5] bg-white/85 px-4 backdrop-blur md:h-20 md:px-8">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue text-xs font-black text-white lg:hidden">{{ marca() }}</div>
            <div>
              <div class="text-[11px] font-extrabold uppercase tracking-wider text-brand-blue">Servire</div>
              <div class="font-extrabold leading-tight text-brand-ink">{{ titulo() }}</div>
            </div>
          </div>
          <div class="flex items-center gap-3">
            <a routerLink="/meu-perfil" class="text-right">
              <div class="text-sm font-extrabold text-brand-ink">{{ sessao.eu()?.nome || 'Meu perfil' }}</div>
              <div class="text-xs text-slate-500">{{ sessao.eu()?.perfil }}</div>
            </a>
            <button class="rounded-full px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-white/60" (click)="logout()">Sair</button>
          </div>
        </header>
        <section class="mx-auto p-4 pb-24 md:p-8 lg:pb-8" [class.max-w-7xl]="!larguraTotal" [class.max-w-none]="larguraTotal"><router-outlet /></section>
      </main>

      @if (maisAberto) {
        <button type="button" class="fixed inset-0 z-30 bg-black/40 lg:hidden" aria-label="Fechar menu" (click)="maisAberto = false"></button>
        <div class="fixed inset-x-0 bottom-16 z-40 rounded-t-3xl bg-white p-3 shadow-xl lg:hidden" data-menu="folha" role="dialog" aria-label="Mais">
          @for (item of menu().conta; track item.url) {
            <a [routerLink]="item.url" (click)="maisAberto = false"
              class="block rounded-2xl px-4 py-3 text-sm font-extrabold text-brand-ink hover:bg-violet-50">
              {{ item.label }}
            </a>
          }
          <button type="button" class="block w-full rounded-2xl px-4 py-3 text-left text-sm font-extrabold text-slate-500 hover:bg-violet-50" (click)="logout()">Sair</button>
        </div>
      }

      <nav class="fixed inset-x-0 bottom-0 z-50 border-t border-[#E7E4F5] bg-white/95 px-2 py-1 backdrop-blur lg:hidden" data-menu="barra">
        <div class="grid" [style.grid-template-columns]="'repeat(' + (menu().barra.length + 1) + ', minmax(0, 1fr))'">
          @for (item of menu().barra; track item.url) {
            <a [routerLink]="item.url" routerLinkActive="!text-brand-blue" class="flex flex-col items-center gap-0.5 px-1 py-2 text-[11px] font-bold text-slate-400">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                @switch (item.url) {
                  @case ('/dashboard') { <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"/> }
                  @case ('/escalas') { <rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/> }
                  @case ('/pessoas') { <path d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1"/><circle cx="9.5" cy="8" r="3"/> }
                  @case ('/relatorios') { <path d="M5 19V9M10 19V5M15 19v-7M20 19V8"/> }
                  @case ('/ajustes') { <circle cx="12" cy="12" r="3"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2"/> }
                }
              </svg>
              {{ item.label }}
            </a>
          }
          <button type="button" data-menu="mais" class="flex flex-col items-center gap-0.5 px-1 py-2 text-[11px] font-bold text-slate-400"
            [class.!text-brand-blue]="maisAberto" [attr.aria-expanded]="maisAberto" (click)="maisAberto = !maisAberto">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="18" cy="12" r="1.2" fill="currentColor"/></svg>
            Mais
          </button>
        </div>
      </nav>
    </div>
    `
})
export class MainLayoutComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  sessao = inject(SessaoAtual);

  maisAberto = false;

  recolhido = false;
  /** Rota com `data.larguraTotal` (montagem da escala, PLANO-008) ocupa a largura toda. */
  larguraTotal = false;
  private destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.sessao.carregar();
    this.larguraTotal = this.rotaPedeLarguraTotal();
    this.router.events.pipe(filter(e => e instanceof NavigationEnd), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.larguraTotal = this.rotaPedeLarguraTotal());
    try {
      this.recolhido = localStorage.getItem('servire.menuRecolhido') === 'true';
    } catch (e) {}
  }

  private rotaPedeLarguraTotal(): boolean {
    let rota: ActivatedRouteSnapshot | null = this.router.routerState.snapshot.root;
    while (rota?.firstChild) rota = rota.firstChild;
    return !!rota?.data?.['larguraTotal'];
  }

  alternarRecolhido() {
    this.recolhido = !this.recolhido;
    try {
      localStorage.setItem('servire.menuRecolhido', String(this.recolhido));
    } catch (e) {}
  }

  menu() {
    return montarMenu(this.sessao.permissoes());
  }

  paroquia(): string {
    return this.auth.tenantNome() || 'São José Operário';
  }

  marca(): string {
    const partes = this.paroquia().split(' ').filter(p => p.length > 2);
    return ((partes[0]?.[0] || 'S') + (partes[1]?.[0] || '')).toUpperCase();
  }

  titulo(): string {
    const url = this.router.url;
    return [...BARRA, ...CONTA].find(item => url.startsWith(item.url))?.label || 'Escalas';
  }

  async logout() {
    this.maisAberto = false;
    await this.auth.signOut();
    await this.router.navigate(['/login']);
  }
}
