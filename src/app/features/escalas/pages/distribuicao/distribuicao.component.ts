import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { mensagemApi } from '../../../../core/api/api-error';
import { SessaoAtual } from '../../../../core/layout/sessao-atual';
import { CabecalhoPaginaComponent } from '../../../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { DialogoService } from '../../../../shared/services/dialogo.service';
import { DistribuicaoApiService, PreviaDistribuicao, RegrasDistribuicao } from './distribuicao-api.service';

/**
 * Distribuição por regras (F04). Gera uma prévia explicada, deixa a coordenação desmarcar sugestões e só então
 * aplica; o servidor refaz o cálculo e recusa se algo mudou depois da prévia.
 */
@Component({
  selector: 'app-distribuicao',
  imports: [CommonModule, FormsModule, RouterLink, CabecalhoPaginaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <app-cabecalho-pagina titulo="Distribuir por regras"
        subtitulo="Sugere pessoas para as vagas vazias. Nada é gravado até você aplicar.">
        <a acoes [routerLink]="['/escalas', escalaId]" class="btn-secondary">Voltar à escala</a>
      </app-cabecalho-pagina>
      @if (erro()) { <p class="card p-4 text-red-600" role="alert" data-erro>{{ erro() }}</p> }
      @if (!pode('VAGA_DISTRIBUIR')) {
        <p class="card p-4 text-red-600" role="alert">Seu perfil não permite distribuir por regras.</p>
      } @else {
        <section class="card secao-form p-6">
          <h2 class="secao-titulo">Regras</h2>
          <div class="grade-form">
            <label class="label">Máximo de participações por pessoa
              <input class="field" type="number" min="1" max="20" name="max" [(ngModel)]="regras.maximoPorPessoa"></label>
            <label class="label">Intervalo mínimo entre participações (dias)
              <input class="field" type="number" min="0" max="30" name="intervalo" [(ngModel)]="regras.intervaloDias"></label>
          </div>
          <label class="mt-3 flex items-center gap-2 text-sm">
            <input type="checkbox" name="resposta" [(ngModel)]="regras.exigirResposta">
            Só considerar quem já respondeu a disponibilidade do mês
          </label>
          <p class="mt-3 text-sm text-slate-500">
            Considera função habilitada, indisponibilidade, disponibilidade positiva, vagas em outras escalas e menor carga.
            O desempate é determinístico.
          </p>
          <div class="mt-4">
            <button type="button" class="btn-primary" [disabled]="ocupado()" (click)="gerar()" data-gerar>
              {{ ocupado() ? 'Calculando...' : 'Gerar prévia' }}
            </button>
          </div>
        </section>
        @if (previa(); as p) {
          <section class="card p-4">
            <h2 class="secao-titulo">Sugestões ({{ p.sugestoes.length }} de {{ p.vagasVazias }} vagas vazias)</h2>
            @if (p.bloqueado) {
              <p class="mb-3 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert">
                Há alocações existentes em conflito com as regras. Revise-as na escala antes de aplicar.
              </p>
            }
            <div class="tabela-rolagem">
              <table class="tabela w-full">
                <thead><tr><th></th><th>Quando</th><th>Função</th><th>Pessoa</th><th>Por quê</th></tr></thead>
                <tbody>
                  @for (s of p.sugestoes; track s.vagaId) {
                    <tr>
                      <td><input type="checkbox" [checked]="marcadas().has(s.vagaId)" (change)="alternar(s.vagaId)"
                        [attr.aria-label]="'Aplicar sugestão para ' + s.nome"></td>
                      <td>{{ s.data | date: 'dd/MM/yyyy' }} {{ s.horario.slice(0, 5) }} · {{ s.celebracao }}</td>
                      <td>{{ s.funcao }}</td>
                      <td>{{ s.nome }}</td>
                      <td class="text-sm text-slate-500">{{ s.explicacao }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
            @if (!p.sugestoes.length) { <p class="p-3 text-sm text-slate-500">Nenhuma sugestão possível com estas regras.</p> }
            <div class="mt-4 flex justify-end">
              <button type="button" class="btn-primary" data-aplicar
                [disabled]="ocupado() || p.bloqueado || !marcadas().size || !pode('VAGA_ALOCAR')" (click)="aplicar()">
                Aplicar {{ marcadas().size }} sugestões
              </button>
            </div>
          </section>
          @if (p.conflitos.length) {
            <section class="card p-4">
              <h2 class="secao-titulo">Conflitos e vagas sem candidato</h2>
              <ul class="space-y-3">
                @for (c of p.conflitos; track c.vagaId) {
                  <li class="rounded-xl border border-[var(--line)] p-3">
                    <p class="font-semibold">
                      {{ c.data | date: 'dd/MM/yyyy' }} {{ c.horario.slice(0, 5) }} · {{ c.celebracao }} · {{ c.funcao }}
                      @if (c.alocacaoExistente) { <span class="badge bg-amber-50 text-amber-700">Alocação existente</span> }
                    </p>
                    <p class="text-sm text-slate-600">{{ c.explicacao }}</p>
                    @if (c.descartes.length) {
                      <ul class="mt-1 text-sm text-slate-500">
                        @for (d of c.descartes; track d.codigo) { <li>{{ d.quantidade }} pessoa(s): {{ d.motivo }}</li> }
                      </ul>
                    }
                  </li>
                }
              </ul>
            </section>
          }
        }
      }
    </div>
  `
})
export class DistribuicaoComponent implements OnDestroy {
  private readonly api = inject(DistribuicaoApiService);
  private readonly sessao = inject(SessaoAtual);
  private readonly dialogo = inject(DialogoService);
  private readonly router = inject(Router);
  readonly escalaId = inject(ActivatedRoute).snapshot.paramMap.get('id')!;

  regras: RegrasDistribuicao = { maximoPorPessoa: 3, intervaloDias: 0, exigirResposta: false };
  readonly previa = signal<PreviaDistribuicao | null>(null);
  readonly marcadas = signal<Set<string>>(new Set());
  readonly ocupado = signal(false);
  readonly erro = signal('');
  /** Regras usadas na prévia atual; a aplicação reenvia exatamente estas, mesmo se o formulário mudar. */
  private regrasDaPrevia: RegrasDistribuicao | null = null;
  private chamada?: Subscription;

  pode(codigo: string) { return this.sessao.permissoes().includes(codigo); }

  gerar() {
    if (this.ocupado()) return;
    this.chamada?.unsubscribe();
    this.erro.set('');
    this.previa.set(null);
    this.ocupado.set(true);
    const regras = { ...this.regras };
    this.chamada = this.api.previa(this.escalaId, regras).subscribe({
      next: p => {
        this.regrasDaPrevia = regras;
        this.previa.set(p);
        this.marcadas.set(new Set(p.sugestoes.map(s => s.vagaId)));
        this.ocupado.set(false);
      },
      error: e => this.falha(e, 'Não foi possível gerar a prévia.')
    });
  }

  alternar(vagaId: string) {
    const novo = new Set(this.marcadas());
    if (!novo.delete(vagaId)) novo.add(vagaId);
    this.marcadas.set(novo);
  }

  async aplicar() {
    const p = this.previa();
    if (!p || !this.regrasDaPrevia || this.ocupado() || p.bloqueado) return;
    const escolhas = p.sugestoes.filter(s => this.marcadas().has(s.vagaId)).map(s => ({ vagaId: s.vagaId, pessoaId: s.pessoaId }));
    if (!escolhas.length) return;
    if (!await this.dialogo.confirmar({
      mensagem: `Aplicar ${escolhas.length} sugestões? As vagas ficam preenchidas no rascunho e a coordenação ainda pode ajustar.`,
      confirmar: 'Aplicar'
    })) return;
    this.ocupado.set(true);
    this.chamada = this.api.aplicar(this.escalaId, p.versao, this.regrasDaPrevia, escolhas).subscribe({
      next: () => { this.ocupado.set(false); void this.router.navigate(['/escalas', this.escalaId]); },
      error: e => { this.previa.set(null); this.falha(e, 'Não foi possível aplicar. Gere a prévia novamente.'); }
    });
  }

  private falha(e: unknown, padrao: string) {
    this.ocupado.set(false);
    this.erro.set(mensagemApi(e, padrao));
  }

  ngOnDestroy() {
    this.chamada?.unsubscribe();
    this.previa.set(null);
  }
}
