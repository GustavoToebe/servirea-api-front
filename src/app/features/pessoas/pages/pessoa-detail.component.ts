
import { CommonModule } from '@angular/common';
import { NumeroComponent } from '../../../shared/components/numero/numero.component';
import { CONDICAO_LABEL } from '../../../shared/components/cuidados/condicoes';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Pessoa, TIPO_LABEL, ageFromDate, contatoPrincipalEmail, contatoPrincipalTelefone, initials, mandatoRotulo, tipoBadgeClass } from '../models/pessoa.model';
import { PessoasService } from '../services/pessoas.service';
import { VoluntariosApiService } from '../services/voluntarios-api.service';

@Component({
    selector: 'app-pessoa-detail',
    imports: [CommonModule, RouterLink, NumeroComponent],
    template: `
    @if (pessoa) {
      <div class="mx-auto max-w-5xl space-y-6">
        <div class="flex items-center justify-between">
          <a routerLink="/pessoas" class="text-sm font-semibold text-brand-blue">← Voltar</a>
          <a [routerLink]="['/pessoas', pessoa.id, 'editar']" class="btn-primary">Editar</a>
        </div>
        <section class="card p-6">
          <div class="flex flex-col gap-6 md:flex-row">
            @if (fotoUrl) {
              <img [src]="fotoUrl" class="h-40 w-40 rounded-3xl object-cover" alt="Foto">
            }
            @if (!fotoUrl) {
              <div class="flex h-40 w-40 items-center justify-center rounded-3xl border border-[var(--line)] bg-[var(--app-bg)] text-4xl font-black shadow-xs" [style.color]="'var(--brand)'">{{ initials(pessoa.nomeCompleto) }}</div>
            }
            <div>
              <div class="flex flex-wrap gap-2">
                <h1 class="text-3xl font-black text-[var(--ink)]">{{ pessoa.nomeCompleto }}<app-numero [numero]="pessoa.sequencial" /></h1>
                @for (p of pessoa.papeis; track p) {
                  <span class="badge" [ngClass]="p === 'VOLUNTARIO' ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold' : 'bg-indigo-500/15 border border-indigo-500/30 text-indigo-700 dark:text-indigo-300 font-bold'">
                    {{ p === 'VOLUNTARIO' ? 'Voluntário' : 'Responsável' }}
                  </span>
                }
              </div>
              <p class="mt-2 text-sm text-[var(--muted)]">{{ ageFromDate(pessoa.dataNascimento) ?? '—' }} anos</p>
              <p class="text-sm text-[var(--muted)]">{{ contatoPrincipalEmail(pessoa) || 'sem e-mail' }} · {{ contatoPrincipalTelefone(pessoa) || 'sem telefone' }}</p>
              @if (pessoa.voluntario) {
                <p class="mt-2"><span class="badge" [ngClass]="tipoBadgeClass(pessoa.voluntario.tipo)">{{ tipoLabel[pessoa.voluntario.tipo] }}</span></p>
                @if (mandatoDe(pessoa.voluntario.mandatoInicio, pessoa.voluntario.mandatoFim)) {
                  <p class="mt-2 text-sm text-amber-700 dark:text-amber-400 font-medium">{{ mandatoDe(pessoa.voluntario.mandatoInicio, pessoa.voluntario.mandatoFim) }}</p>
                }
              }
            </div>
          </div>
        </section>
        @if (pessoa.responsaveis.length) {
          <section class="card p-6">
            <h2 class="mb-4 text-lg font-black text-[var(--ink)]">Responsáveis</h2>
            <div class="space-y-2">
              @for (r of pessoa.responsaveis; track r) {
                <a [routerLink]="['/pessoas', r.pessoaId]" class="block rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 hover:border-[var(--brand)] transition-all shadow-2xs">
                  <strong class="text-[var(--ink)]">{{ r.nomeCompleto }}</strong>
                  <span class="text-sm text-[var(--muted)]"> · {{ r.parentesco }}</span>
                  @if (r.principal) {
                    <span class="ml-2 text-amber-600 dark:text-amber-400 font-bold">★ principal</span>
                  }
                </a>
              }
            </div>
          </section>
        }
        <section class="card p-6">
          <h2 class="mb-4 text-lg font-black text-[var(--ink)]">Privacidade</h2>
          <a class="btn-secondary" [routerLink]="['/pessoas',pessoa.id,'privacidade']" data-privacidade>Autorizações e exportação de dados</a>
        </section>
        @if (pessoa.dependentes.length) {
          <section class="card p-6">
            <h2 class="mb-4 text-lg font-black text-[var(--ink)]">Dependentes</h2><a class="btn-secondary" [routerLink]="['/pessoas',pessoa.id,'acessos-dependentes']">Autorizações de acesso</a>
            <div class="space-y-2">
              @for (r of pessoa.dependentes; track r) {
                <a [routerLink]="['/pessoas', r.pessoaId]" class="block rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 hover:border-[var(--brand)] transition-all shadow-2xs">
                  <strong class="text-[var(--ink)]">{{ r.nomeCompleto }}</strong>
                  <span class="text-sm text-[var(--muted)]"> · {{ r.parentesco }}</span>
                  @if (r.principal) {
                    <span class="ml-2 text-amber-600 dark:text-amber-400 font-bold">★ responsável principal</span>
                  }
                </a>
              }
            </div>
          </section>
        }
        <section class="card p-6">
          <h2 class="mb-2 text-lg font-black text-[var(--ink)]">Endereço</h2>
          <p class="text-sm text-[var(--muted)]">{{ endereco(pessoa) }}</p>
          @if (pessoa.observacoes) {
            <p class="mt-4 text-sm text-[var(--ink)]">{{ pessoa.observacoes }}</p>
          }
        </section>
      </div>
    }
    @if (error) {
      <div class="rounded-xl bg-red-50 p-4 text-red-700">{{ error }}</div>
    }
    `
})
export class PessoaDetailComponent implements OnInit {
  pessoa: Pessoa | null = null;
  fotoUrl: string | null = null;
  error = '';
  initials = initials;
  ageFromDate = ageFromDate;
  contatoPrincipalEmail = contatoPrincipalEmail;
  contatoPrincipalTelefone = contatoPrincipalTelefone;
  tipoLabel = TIPO_LABEL;
  tipoBadgeClass = tipoBadgeClass;
  mandatoDe = mandatoRotulo;
  private readonly destroyRef = inject(DestroyRef);

  endereco(p: Pessoa): string {
    return [p.logradouro, p.numero, p.bairro, p.cidade, p.uf].filter(parte => !!parte).join(', ') || '—';
  }

  constructor(
    private route: ActivatedRoute,
    private pessoas: PessoasService,
    private voluntarios: VoluntariosApiService
  ) {}

  /**
   * `paramMap` e não `snapshot`: os links de responsável/dependente levam de
   * `/pessoas/A` para `/pessoas/B` e o Angular reaproveita o componente.
   */
  ngOnInit() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(params => {
      const id = params.get('id');
      if (id) void this.carregar(id);
    });
  }

  private async carregar(id: string) {
    this.error = '';
    this.fotoUrl = null;
    try {
      this.pessoa = await this.pessoas.buscar(id);
      if (this.pessoa.voluntario?.fotoPath) {
        this.fotoUrl = await this.voluntarios.fotoUrl(id);
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Não encontrado.';
    }
  }
}
