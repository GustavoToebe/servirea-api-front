import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { podeVer } from '../../core/layout/menu';
import { SessaoAtual } from '../../core/layout/sessao-atual';
import { FONTES, PALETAS, ThemeService } from '../../core/theme/theme.service';

@Component({
    selector: 'app-ajustes',
    imports: [RouterLink],
    template: `
    <div class="mx-auto max-w-3xl space-y-6">
      <div>
        <div class="text-xs font-extrabold uppercase tracking-wider text-brand-blue">Preferências</div>
        <h1 class="text-2xl font-black text-slate-900">Ajustes visuais</h1>
        <p class="text-sm text-slate-500">A cor, o modo noturno e o tamanho do texto ficam neste navegador. A coordenação pode ler a escala na secretaria ou na sacristia.</p>
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

      <section class="card p-5">
        <h2 class="text-lg font-black">Tamanho do texto</h2>
        <div class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          @for (fonte of fontes; track fonte.id) {
            <button type="button" class="rounded-2xl border px-3 py-3 text-center" [class.chip-on]="tema.fonte() === fonte.id" [style.border-color]="tema.fonte() === fonte.id ? 'transparent' : 'var(--field-line)'" (click)="tema.definirFonte(fonte.id)">
              <span class="block text-base font-black">{{ fonte.rotulo }}</span>
              <span class="block text-xs font-semibold opacity-80">{{ fonte.detalhe }}</span>
            </button>
          }
        </div>
        <div class="mt-4 rounded-2xl bg-violet-50 p-4">
          <div class="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Demonstração</div>
          <div class="mt-2 font-extrabold">Missa dominical · 08:00</div>
          <div class="text-sm text-slate-500">Cruz, missal e credência no altar principal</div>
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
  private sessao = inject(SessaoAtual);
  paletas = PALETAS;
  fontes = FONTES;

  pode(codigo: string): boolean {
    return podeVer(this.sessao.permissoes(), codigo);
  }
}
