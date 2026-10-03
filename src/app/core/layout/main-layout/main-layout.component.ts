import { Component, inject, OnInit, HostListener } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NgClass } from '@angular/common';
import { AuthService } from '../../auth/auth.service';
import { BARRA, CONTA, ItemMenu, montarMenu, podeVer } from '../menu';
import { BuscaGlobalComponent } from '../busca-global.component';
import { FavoritosService } from '../favoritos.service';
import { MegaMenuComponent } from '../mega-menu.component';
import { NavegacaoContextualComponent } from '../navegacao-contextual.component';
import { SECAO_DA_URL, SECOES, SecaoId, telasVisiveis } from '../navegacao';
import { SessaoAtual } from '../sessao-atual';
import { FuncionalidadesPlanoComponent } from '../../plano/funcionalidades-plano.component';

@Component({
    selector: 'app-main-layout',
    imports: [RouterOutlet, RouterLink, RouterLinkActive, NgClass, FuncionalidadesPlanoComponent, BuscaGlobalComponent, MegaMenuComponent, NavegacaoContextualComponent],
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
          @if (!recolhido && favoritosDoMenu().length) {
            <div class="px-4 pb-1 pt-1 text-[10px] font-extrabold uppercase tracking-widest text-violet-200/60">Favoritos</div>
            @for (f of favoritosDoMenu(); track f.id) {
              <a [routerLink]="[f.url]" [queryParams]="f.consulta" class="flex items-center gap-3 rounded-xl px-4 py-2 text-sm font-semibold text-violet-100/80 hover:bg-white/10 hover:text-white" data-favorito>
                <span class="text-amber-300" aria-hidden="true">★</span><span class="truncate">{{ f.rotulo }}</span>
              </a>
            }
            <div class="mx-4 my-2 border-t border-white/10"></div>
          }
          @for (grupo of grupos(); track grupo.secao.id) {
            @if (!recolhido && grupo.itens.length > 1) {
              <button type="button" class="mt-2 flex w-full items-center justify-between rounded-xl px-4 py-2 text-left text-[11px] font-extrabold uppercase tracking-widest text-violet-200/70 hover:bg-white/5 hover:text-white"
                [attr.aria-expanded]="secaoAberta(grupo.secao.id)" (click)="alternarSecao(grupo.secao.id)" data-secao-menu>
                <span>{{ grupo.secao.titulo }}</span><span aria-hidden="true">{{ secaoAberta(grupo.secao.id) ? '▾' : '▸' }}</span>
              </button>
            }
            @if (recolhido || grupo.itens.length === 1 || secaoAberta(grupo.secao.id)) {
              @for (item of grupo.itens; track item.url) {
              <a [routerLink]="item.url"
                [title]="recolhido ? item.label : ''"
                class="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-violet-100/80 hover:bg-white/10 hover:text-white"
                [ngClass]="(recolhido ? 'justify-center px-0 ' : '') + (itemAtivo() === item.url ? '!bg-brand-blue !text-white' : '')">
                <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  @switch (item.url) {
                    @case ('/dashboard') { <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z"/> }
                    @case ('/escalas') { <rect x="4" y="5" width="16" height="15" rx="2"/><path d="M8 3v4M16 3v4M4 10h16"/> }
                    @case ('/pessoas') { <path d="M16 19v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1"/><circle cx="9.5" cy="8" r="3"/><path d="M20 19v-1a3.5 3.5 0 0 0-2.5-3.35M16.5 5.1a3 3 0 0 1 0 5.8"/> }
                    @case ('/relatorios') { <path d="M5 19V9M10 19V5M15 19v-7M20 19V8"/> }
                    @case ('/layouts') { <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/> }
                    @case ('/comunicados') { <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/> }
                    @case ('/financeiro') { <path d="M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4"/> }
                    @case ('/eventos') { <rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/><path d="m9 15 2 2 4-4"/> }
                    @case ('/paroquia') { <path d="M18 21v-8M6 21v-8M12 21v-4"/><path d="M3 9l9-6 9 6v12H3V9z"/> }
                    @case ('/perfis') { <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/> }
                    @case ('/usuarios') { <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/> }
                    @case ('/entregas') { <path d="M22 2 11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/> }
                    @case ('/portal/dependentes') { <path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z"/> }
                    @case ('/portal') { <path d="M9 11l3 3 8-8"/><path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h9"/> }
                    @case ('/minhas-pastorais') { <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/> }
                    @case ('/pastorais') { <polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/> }
                    @case ('/usuarios/vinculos') { <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/> }
                    @case ('/mural') { <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/> }
                    @case ('/tarefas') { <path d="M9 6h11M9 12h11M9 18h11"/><path d="m3 6 1 1 2-2M3 12l1 1 2-2M3 18l1 1 2-2"/> }
                    @case ('/liturgia') { <path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z"/> }
                    @case ('/indicadores') { <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/> }
                    @case ('/estoque') { <path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3.3 7.5 12 12.5l8.7-5M12 22V12.5"/> }
                    @case ('/aniversarios') { <polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/> }
                    @case ('/site-paroquia') { <circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"/> }
                    @case ('/privacidade') { <rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/> }
                    @case ('/primeiros-passos') { <path d="M5 21V4M5 4h11l-2 4 2 4H5"/> }
                    @case ('/ajuda') { <circle cx="12" cy="12" r="10"/><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01"/> }
                  }
                </svg>
                @if (!recolhido) { <span>{{ item.label }}</span> }
              </a>

              }
            }
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
          <div class="mx-4 hidden max-w-md flex-1 md:block"><app-busca-global [telas]="telas()" /></div>
          <div class="flex items-center gap-3 relative">
            <button type="button" class="flex items-center gap-2 rounded-xl border border-[#E7E4F5] px-3 py-2 text-sm font-semibold text-slate-600 hover:border-brand-blue hover:text-brand-blue" aria-label="Abrir todas as telas" (click)="megaAberto = true" data-menu="completo">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
              <span class="hidden xl:inline">Todas as telas</span>
            </button>
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
        <section class="p-4 pb-24 md:p-6 lg:pb-8"><app-navegacao-contextual [telas]="telas()" (verTodas)="megaAberto = true" /><app-funcionalidades-plano [contextual]="true"/><router-outlet /></section>
      </main>

      @if (maisAberto) {
        <button type="button" class="fixed inset-0 z-30 bg-black/40 lg:hidden" aria-label="Fechar menu" (click)="maisAberto = false"></button>
        <div class="fixed inset-x-0 bottom-16 z-40 rounded-t-3xl bg-white p-3 shadow-xl lg:hidden" data-menu="folha" role="dialog" aria-label="Mais">
          <button type="button" class="mb-1 block w-full rounded-2xl bg-violet-50 px-4 py-3 text-left text-sm font-extrabold text-brand-blue" (click)="maisAberto = false; megaAberto = true" data-menu="completo-celular">Todas as telas e pesquisa</button>
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
                  @case ('/financeiro') { <path d="M4 7h16m-4-4 4 4-4 4M20 17H4m4-4-4 4 4 4"/> }
                  @case ('/eventos') { <rect x="3" y="5" width="18" height="16" rx="2"/><path d="m9 15 2 2 4-4"/> }
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
      @if (megaAberto) { <app-mega-menu [telas]="telas()" (fechar)="megaAberto = false" /> }
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

  protected readonly favoritos = inject(FavoritosService);
  maisAberto = false;
  usuarioAberto = false;
  megaAberto = false;
  /** Seções recolhidas ou abertas à mão pelo usuário. */
  private secoesManuais: Record<string, boolean> = {};

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

  telas() { return telasVisiveis(this.sessao.permissoes()); }

  /** Itens do menu lateral agrupados por seção, na ordem das seções. */
  grupos() {
    const itens = this.menu().barra;
    return SECOES.map(secao => ({ secao, itens: itens.filter((i: ItemMenu) => (SECAO_DA_URL[i.url] ?? 'inicio') === secao.id) })).filter(g => g.itens.length);
  }

  /** Todas as seções começam abertas; quem quer menos itens recolhe as que não usa (vale até recarregar). */
  secaoAberta(id: SecaoId) { return this.secoesManuais[id] ?? true; }
  alternarSecao(id: SecaoId) { this.secoesManuais = { ...this.secoesManuais, [id]: !this.secaoAberta(id) }; }
  favoritosDoMenu() { const ids = this.favoritos.ids(); return this.telas().filter(t => ids.includes(t.id)); }

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

  /** URL do item do menu que corresponde à rota atual: a mais longa que seja a própria rota ou prefixo dela (/portal não "rouba" /portal/dependentes). */
  itemAtivo(): string | null {
    const rota = this.router.url.split(/[?#(]/)[0];
    const candidatos = [...BARRA, ...CONTA].filter(item => rota === item.url || rota.startsWith(item.url + '/'));
    return candidatos.sort((a, b) => b.url.length - a.url.length)[0]?.url ?? null;
  }

  titulo(): string {
    const ativa = this.itemAtivo();
    return [...BARRA, ...CONTA].find(item => item.url === ativa)?.label || 'Escalas';
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
