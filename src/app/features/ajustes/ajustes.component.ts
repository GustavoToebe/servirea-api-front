import { AjudaLinkComponent } from '../../shared/components/ajuda-link/ajuda-link.component';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { podeVer } from '../../core/layout/menu';
import { AuthService } from '../../core/auth/auth.service';
import { SessaoAtual } from '../../core/layout/sessao-atual';
import { CONTRASTES, FONTES, PALETAS, ThemeService } from '../../core/theme/theme.service';

@Component({
    selector: 'app-ajustes',
    imports: [RouterLink, AjudaLinkComponent],
    template: `
    <div class="mx-auto max-w-3xl space-y-6">
      <div>
        <div class="text-xs font-extrabold uppercase tracking-wider text-brand-blue">Preferências</div>
        <h1 class="text-2xl font-black text-slate-900">Ajustes visuais</h1>
        <p class="text-sm text-slate-500">A cor, o modo noturno e o tamanho do texto ficam neste navegador. A coordenação pode ler a escala na secretaria ou na sacristia.</p>
        <div class="mt-2"><app-ajuda-link /></div>
      </div>

      <section class="space-y-3">
        <h2 class="text-lg font-black">Tema de cores</h2>
        <div class="grid gap-3 sm:grid-cols-2">
          @for (paleta of paletas; track paleta.id) {
            <button type="button" data-paleta [attr.data-paleta-id]="paleta.id" class="card flex w-full items-center gap-4 border-2 p-4 text-left transition"
              [style.border-color]="tema.paleta() === paleta.id ? paleta.brand : 'transparent'"
              [style.background]="tema.paleta() === paleta.id ? 'color-mix(in srgb, ' + paleta.brand + ' 7%, var(--card))' : ''"
              [attr.aria-pressed]="tema.paleta() === paleta.id" (click)="tema.escolherPaleta(paleta.id)">
              <span class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-black text-white" [style.background]="paleta.brand">{{ paleta.nome.slice(0, 1) }}</span>
              <span class="min-w-0 flex-1">
                <span class="block font-extrabold">{{ paleta.nome }}</span>
                <span class="block text-sm text-slate-500">{{ paleta.descricao }}</span>
              </span>
              @if (tema.paleta() === paleta.id) {
                <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-black text-white" [style.background]="paleta.brand" aria-label="Tema em uso">✓</span>
              }
            </button>
          }
        </div>
      </section>

      <section class="card p-5">
        <div class="flex items-start justify-between gap-4">
          <div>
            <h2 class="text-lg font-black">Modo noturno</h2>
            <p class="mt-1 text-sm text-slate-500">Fundo escuro para a sacristia e para vigílias, sem ofuscar a vista.</p>
          </div>
          <button type="button" class="relative h-7 w-12 shrink-0 rounded-full transition" [style.background]="tema.noturno() ? 'var(--brand)' : '#cbd5e1'" (click)="tema.definirNoturno(!tema.noturno())" [attr.aria-pressed]="tema.noturno()" aria-label="Alternar modo noturno">
            <span class="absolute top-0.5 h-6 w-6 rounded-full bg-white transition" [class.left-0.5]="!tema.noturno()" [class.left-5]="tema.noturno()"></span>
          </button>
        </div>
      </section>

      <!-- Contraste das bordas: Padrão ou Forte, nos dois temas -->
      <section class="card p-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 class="text-lg font-black">Contraste das bordas</h2>
            <p class="text-xs text-slate-500">Deixa as bordas de cartões, campos e divisões mais nítidas, nos temas claro e escuro.</p>
          </div>
          <div class="inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1" role="group" aria-label="Contraste das bordas" data-contraste>
            @for (c of contrastes; track c.id) {
              <button type="button"
                class="cursor-pointer rounded-lg px-4 py-1.5 text-sm font-bold transition-colors"
                [class.bg-[var(--brand)]]="tema.contraste() === c.id"
                [class.text-white]="tema.contraste() === c.id"
                [class.text-slate-600]="tema.contraste() !== c.id"
                [attr.aria-pressed]="tema.contraste() === c.id"
                (click)="tema.definirContraste(c.id)">{{ c.rotulo }}</button>
            }
          </div>
        </div>
      </section>

      <!-- Escala de Texto -->
      <section class="card p-5 space-y-4">
        <div class="flex items-center gap-2">
          <span class="rounded-md px-2 py-0.5 text-xs font-extrabold uppercase tracking-wide text-emerald-400 bg-emerald-950/60 border border-emerald-800">Tipografia</span>
          <h2 class="text-lg font-black text-slate-900 dark:text-white">Tamanho do texto</h2>
        </div>
        <p class="text-xs text-slate-500 dark:text-neutral-400">
          Ajuste a densidade visual e o conforto visual para longas sessões de operação.
        </p>

        <div class="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
          @for (fonte of fontes; track fonte.id) {
            <button
              type="button"
              class="rounded-xl border p-3 text-center transition-all cursor-pointer"
              [class.bg-[var(--brand)]]="tema.fonte() === fonte.id"
              [class.text-white]="tema.fonte() === fonte.id"
              [class.border-[var(--brand)]]="tema.fonte() === fonte.id"
              [class.bg-[#181818]]="tema.fonte() !== fonte.id && tema.noturno()"
              [class.bg-slate-50]="tema.fonte() !== fonte.id && !tema.noturno()"
              [class.text-neutral-300]="tema.fonte() !== fonte.id && tema.noturno()"
              [class.text-slate-700]="tema.fonte() !== fonte.id && !tema.noturno()"
              [class.border-[#2e2e2e]]="tema.fonte() !== fonte.id && tema.noturno()"
              [class.border-slate-200]="tema.fonte() !== fonte.id && !tema.noturno()"
              (click)="tema.definirFonte(fonte.id)">
              <span class="block text-base font-black">{{ fonte.rotulo }}</span>
              <span class="block text-[11px] font-semibold opacity-85 mt-0.5">{{ fonte.detalhe }}</span>
            </button>
          }
        </div>

        <!-- Prévia em tempo real -->
        <div class="rounded-xl border border-slate-200 bg-slate-50 p-4">
          <span class="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Prévia em tempo real</span>
          <div class="mt-2 text-base font-extrabold">{{ paroquia() }}</div>
          <div class="text-sm font-semibold mt-0.5">Missa dominical · 08:00</div>
          <div class="text-xs text-slate-500 mt-0.5">Cruz, missal e credência no altar principal</div>
          @if (sessao.eu(); as eu) {
            <div class="text-xs text-slate-500 mt-2">Conectado como {{ eu.nome }} · {{ eu.perfil }}</div>
          }
        </div>
      </section>

      <section class="card flex items-center justify-between gap-4 p-5">
        <div>
          <h2 class="text-lg font-black">Resposta ao toque</h2>
          <p class="mt-1 text-sm text-slate-500">Uma vibração curta ao mudar estes ajustes, no celular que permitir.</p>
        </div>
        <button type="button" class="relative h-7 w-12 shrink-0 rounded-full transition" [style.background]="tema.vibrar() ? 'var(--brand)' : '#cbd5e1'" (click)="tema.definirVibrar(!tema.vibrar())" [attr.aria-pressed]="tema.vibrar()" aria-label="Alternar vibração">
          <span class="absolute top-0.5 h-6 w-6 rounded-full bg-white transition" [class.left-0.5]="!tema.vibrar()" [class.left-5]="tema.vibrar()"></span>
        </button>
      </section>

      <section class="card space-y-2 p-5">
        <h2 class="text-lg font-black">Acesso da paróquia</h2>
        @if (pode('PAROQUIA')) {
          <a routerLink="/paroquia" class="block font-semibold text-brand-blue">Paróquia</a>
        }
        @if (pode('PERFIL')) {
          <a routerLink="/perfis" class="block font-semibold text-brand-blue">Perfis</a>
        }
        @if (pode('USUARIO')) {
          <a routerLink="/usuarios" class="block font-semibold text-brand-blue">Usuários</a>
        }
        <a routerLink="/meu-perfil" class="block font-semibold text-brand-blue">Meu perfil</a>
      </section>

      <button type="button" class="btn-secondary" (click)="tema.restaurar()">Restaurar padrões</button>
    </div>
    `
})
export class AjustesComponent {
  tema = inject(ThemeService);
  private auth = inject(AuthService);
  readonly sessao = inject(SessaoAtual);
  paletas = PALETAS;
  fontes = FONTES;
  contrastes = CONTRASTES;

  paroquia(): string {
    return this.auth.tenantNome() || 'Sua paróquia';
  }

  pode(codigo: string): boolean {
    return podeVer(this.sessao.permissoes(), codigo);
  }
}
