import { Component, inject, OnInit, HostListener } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgClass } from '@angular/common';
import { AuthService } from '../../auth/auth.service';
import { BARRA, CONTA, montarMenu, podeVer } from '../menu';
import { SessaoAtual } from '../sessao-atual';

@Component({
    selector: 'app-main-layout',
    imports: [RouterOutlet, RouterLink, RouterLinkActive, NgClass],
    template: `
    <div class="parish min-h-screen bg-app lg:flex">
      <aside class="fixed inset-y-0 left-0 z-40 hidden flex-col overflow-x-hidden bg-brand-navy text-white lg:flex transition-[width] duration-200" [ngClass]="recolhido ? 'w-20' : 'w-72'">
        <div class="flex h-20 shrink-0 items-center gap-3 border-b border-white/10" [ngClass]="recolhido ? 'justify-center px-0' : 'px-6'">
          <div class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-brand-blue text-sm font-black">{{ marca() }}</div>
          @if (!recolhido) {
          <div class="min-w-0">
            <div class="text-sm font-extrabold leading-tight truncate">{{ paroquia() }}</div>
            <div class="text-xs text-violet-200/80 truncate">Coroinhas e acólitos</div>
          </div>
          }
        </div>

        <div class="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto [scrollbar-color:rgba(255,255,255,0.35)_transparent] [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/30">
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
                  @case ('/layouts') { <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/> }
                  @case ('/comunicados') { <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/> }
                  @case ('/paroquia') { <path d="M18 21v-8M6 21v-8M12 21v-4"/><path d="M3 9l9-6 9 6v12H3V9z"/> }
                  @case ('/perfis') { <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/> }
                  @case ('/usuarios') { <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/> }
                }
              </svg>
              @if (!recolhido) { <span>{{ item.label }}</span> }
            </a>
          }
        </nav>
        </div>

        <div class="mt-3 w-full shrink-0 border-t border-white/10 p-4" [ngClass]="recolhido ? 'px-2' : 'px-4'">
          <button type="button" class="mb-1 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold text-violet-100/80 hover:bg-white/10 hover:text-white" (click)="alternarRecolhido()" data-menu="recolher" [attr.aria-label]="recolhido ? 'Expandir menu' : 'Recolher menu'" [ngClass]="recolhido ? 'justify-center px-0' : ''">
            <span class="text-xl font-bold">{{ recolhido ? '»' : '«' }}</span>
          </button>
        </div>
      </aside>

      <main class="min-w-0 flex-1 transition-[margin] duration-200" [ngClass]="recolhido ? 'lg:ml-20' : 'lg:ml-72'">
        <header class="parish-header sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[#E7E4F5] bg-white/85 px-4 backdrop-blur md:h-20 md:px-8">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-blue text-xs font-black text-white lg:hidden">{{ marca() }}</div>
            <div>
              <div class="text-[11px] font-extrabold uppercase tracking-wider text-brand-blue">Servirea</div>
              <div class="font-extrabold leading-tight text-brand-ink">{{ titulo() }}</div>
            </div>
          </div>
          <div class="flex items-center gap-3 relative">
            <button type="button" id="perfil-menu" class="text-right flex items-center gap-3 cursor-pointer p-1 rounded-xl hover:bg-slate-100 transition"
              aria-haspopup="menu" [attr.aria-expanded]="usuarioAberto" (click)="usuarioAberto = !usuarioAberto">
              <div>
                <div class="text-sm font-extrabold text-brand-ink">{{ sessao.eu()?.nome || 'Meu perfil' }}</div>
                <div class="text-xs text-slate-500">{{ sessao.eu()?.perfil }}</div>
              </div>
              <svg class="h-4 w-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6"/></svg>
            </button>
            @if (usuarioAberto) {
              <div id="perfil-dropdown" role="menu" aria-labelledby="perfil-menu" class="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white p-2 shadow-xl border border-slate-100 z-50">
                <a routerLink="/meu-perfil" role="menuitem" (click)="usuarioAberto = false" class="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-brand-blue transition">
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  Meus dados
                </a>
                @if (podeVer('PAROQUIA')) {
                  <button type="button" role="menuitem" data-menu="minha-conta" (click)="abrirMinhaConta()" class="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-brand-blue transition cursor-pointer">
                    <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    Minha conta
                  </button>
                }
                <a routerLink="/ajustes" role="menuitem" (click)="usuarioAberto = false" class="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 hover:text-brand-blue transition">
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                  Ajustes
                </a>
                <div class="my-1 border-t border-slate-100"></div>
                <button type="button" role="menuitem" (click)="logout()" class="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-600 transition cursor-pointer">
                  <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  Sair
                </button>
              </div>
              <div class="fixed inset-0 z-40" (click)="usuarioAberto = false"></div>
            }
          </div>
        </header>
        <section class="p-4 pb-24 md:p-6 lg:pb-8"><router-outlet /></section>
      </main>

      @if (maisAberto) {
        <button type="button" class="fixed inset-0 z-30 bg-black/40 lg:hidden" aria-label="Fechar menu" (click)="maisAberto = false"></button>
        <div class="fixed inset-x-0 bottom-16 z-40 rounded-t-3xl bg-white p-3 shadow-xl lg:hidden" data-menu="folha" role="dialog" aria-label="Mais">
          @for (item of mobileMais(); track item.url) {
            <a [routerLink]="item.url" (click)="maisAberto = false"
              class="block rounded-2xl px-4 py-3 text-sm font-extrabold text-brand-ink hover:bg-violet-50">
              {{ item.label }}
            </a>
          }
          @for (item of menu().conta; track item.url) {
            <a [routerLink]="item.url" (click)="maisAberto = false"
              class="block rounded-2xl px-4 py-3 text-sm font-extrabold text-brand-ink hover:bg-violet-50">
              {{ item.label }}
            </a>
          }
          <button type="button" class="block w-full rounded-2xl px-4 py-3 text-left text-sm font-extrabold text-slate-500 hover:bg-violet-50" (click)="logout()">Sair</button>
        </div>
      }

      <router-outlet name="modal" />

      <nav class="fixed inset-x-0 bottom-0 z-50 border-t border-[#E7E4F5] bg-white/95 px-2 py-1 backdrop-blur lg:hidden" data-menu="barra">
        <div class="grid" [style.grid-template-columns]="'repeat(' + (mobileBarra().length + 1) + ', minmax(0, 1fr))'">
          @for (item of mobileBarra(); track item.url) {
            <a [routerLink]="item.url" routerLinkActive="!text-brand-blue" class="flex flex-col items-center gap-0.5 px-1 py-2 text-[11px] font-bold text-slate-400">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                @switch (item.url) {
                  @case ('/dashboard') { <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"/> }
                  @case ('/escalas') { <rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/> }
                  @case ('/pessoas') { <path d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1"/><circle cx="9.5" cy="8" r="3"/> }
                  @case ('/relatorios') { <path d="M5 19V9M10 19V5M15 19v-7M20 19V8"/> }
                  @case ('/layouts') { <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/> }
                  @case ('/comunicados') { <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/> }
                  @case ('/paroquia') { <path d="M18 21v-8M6 21v-8M12 21v-4"/> }
                  @case ('/perfis') { <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/> }
                  @case ('/usuarios') { <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/> }
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
  podeVer(exigida: string) { return podeVer(this.sessao.permissoes(), exigida); }
  @HostListener('document:keydown.escape') onKeydownHandler() {
    this.usuarioAberto = false;
    this.maisAberto = false;
  }
  private auth = inject(AuthService);
  private router = inject(Router);
  sessao = inject(SessaoAtual);

  maisAberto = false;
  usuarioAberto = false;

  recolhido = false;

  ngOnInit(): void {
    this.sessao.carregar();
    try {
      this.recolhido = localStorage.getItem('servire.menuRecolhido') === 'true';
    } catch (e) {}
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

  mobileBarra() {
    return this.menu().barra.slice(0, 4);
  }

  mobileMais() {
    return this.menu().barra.slice(4);
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

  abrirMinhaConta() {
    this.usuarioAberto = false;
    this.router.navigate([{ outlets: { modal: ['minha-conta'] } }]);
  }

  async logout() {
    this.maisAberto = false;
    this.usuarioAberto = false;
    await this.auth.signOut();
    await this.router.navigate(['/login']);
  }
}
