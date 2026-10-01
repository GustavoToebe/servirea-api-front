import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { ModalComponent } from '../shared/components/modal/modal.component';
import { mensagemApi } from '../core/api/api-error';
import { MinhaContaCobranca, MinhaContaDados, MinhaContaService, SituacaoComercial } from './minha-conta.service';
import { ConsumoPlanoComponent } from './consumo-plano.component';

type Aba = 'cadastro' | 'plano' | 'financeiro';

/** Badges no padrão do design system: cor com significado e sempre com o texto. */
const VERDE = 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300';
const AMBAR = 'bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300';
const VERMELHO = 'bg-red-500/15 border border-red-500/30 text-red-700 dark:text-red-300';
const CINZA = 'bg-slate-100 border border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400';

const SITUACAO: Record<SituacaoComercial, { texto: string; cor: string }> = {
  ATIVA: { texto: 'Ativa', cor: VERDE },
  TRIAL: { texto: 'Em teste', cor: AMBAR },
  INADIMPLENTE: { texto: 'Inadimplente', cor: VERMELHO },
  BLOQUEADA: { texto: 'Bloqueada', cor: VERMELHO },
  CANCELADA: { texto: 'Cancelada', cor: CINZA }
};

const PERIODICIDADE: Record<string, string> = {
  MENSAL: 'Mensal',
  TRIMESTRAL: 'Trimestral',
  SEMESTRAL: 'Semestral',
  ANUAL: 'Anual'
};

/** Dados da contratação da paróquia, vindos da Central pelo GET /minha-conta. Aberto pelo menu do perfil. */
@Component({
  selector: 'app-minha-conta-modal',
  imports: [ModalComponent, CurrencyPipe, DatePipe, ConsumoPlanoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal [aberto]="true" (fechar)="fechar()" titulo="Minha conta" tamanho="lg">
      @if (erro(); as mensagem) {
        <div class="flex flex-col items-center gap-4 p-8 text-center" data-estado="erro">
          <p class="font-semibold text-red-700 dark:text-red-300">{{ mensagem }}</p>
          <button type="button" class="btn-primary" (click)="buscar()">Tentar de novo</button>
        </div>
      } @else if (dados(); as d) {
        <div class="flex flex-col gap-5">
          <div class="flex gap-6 border-b border-[var(--line)]" role="tablist">
            <button type="button" role="tab" data-aba="cadastro" [attr.aria-selected]="aba() === 'cadastro'" (click)="aba.set('cadastro')"
              class="-mb-px border-b-2 pb-2 text-sm font-bold transition"
              [class]="aba() === 'cadastro' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-slate-500 hover:text-slate-700'">Cadastro</button>
            <button type="button" role="tab" data-aba="plano" [attr.aria-selected]="aba() === 'plano'" (click)="aba.set('plano')"
              class="-mb-px border-b-2 pb-2 text-sm font-bold transition"
              [class]="aba() === 'plano' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-slate-500 hover:text-slate-700'">Meu plano</button>
            <button type="button" role="tab" data-aba="financeiro" [attr.aria-selected]="aba() === 'financeiro'" (click)="aba.set('financeiro')"
              class="-mb-px border-b-2 pb-2 text-sm font-bold transition"
              [class]="aba() === 'financeiro' ? 'border-brand-blue text-brand-blue' : 'border-transparent text-slate-500 hover:text-slate-700'">Financeiro</button>
          </div>

          @switch (aba()) {
            @case ('cadastro') {
              <div class="card p-5" data-bloco="cadastro">
                <h3 class="secao-titulo mb-4">Dados do cliente</h3>
                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <div class="label">Nome / razão social</div>
                    <div class="font-semibold">{{ d.cliente.nome }}</div>
                  </div>
                  <div>
                    <div class="label">Documento</div>
                    <div class="font-semibold">{{ d.cliente.documento }}</div>
                  </div>
                  <div class="sm:col-span-2" data-campo="endereco">
                    <div class="label">Endereço</div>
                    @if (d.cliente.endereco.logradouro) {
                      <div class="text-sm font-medium">
                        {{ d.cliente.endereco.logradouro }}@if (d.cliente.endereco.numero) {, {{ d.cliente.endereco.numero }}}@if (d.cliente.endereco.complemento) { – {{ d.cliente.endereco.complemento }}}
                      </div>
                      <div class="text-sm text-slate-500">
                        {{ d.cliente.endereco.bairro }}@if (d.cliente.endereco.cidade) { – {{ d.cliente.endereco.cidade }}/{{ d.cliente.endereco.uf }}}@if (d.cliente.endereco.cep) { · CEP {{ d.cliente.endereco.cep }}}
                      </div>
                    } @else {
                      <div class="text-sm text-slate-500">Não informado</div>
                    }
                  </div>
                </div>
              </div>
              <div class="card p-5" data-bloco="contatos">
                <h3 class="secao-titulo mb-3">Contatos</h3>
                @for (c of d.cliente.contatos; track $index) {
                  <div class="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-[var(--line)] py-2 text-sm last:border-0">
                    <span class="font-semibold">{{ c.nome }}</span>
                    @if (c.principal) { <span class="badge font-bold {{ verde }}">Principal</span> }
                    <span class="text-slate-500">{{ c.email }}@if (c.email && c.telefone) { · }{{ c.telefone }}</span>
                  </div>
                } @empty {
                  <p class="text-sm text-slate-500">Nenhum contato cadastrado.</p>
                }
              </div>
            }
            @case ('plano') {
              <div class="card flex flex-wrap items-center justify-between gap-3 p-5" data-bloco="plano">
                <div>
                  <div class="label">Plano</div>
                  <div class="text-xl font-black">{{ d.contratacao.planoNome }}</div>
                </div>
                <span class="badge font-bold {{ corSituacao(d.contratacao.situacaoComercial) }}" data-campo="situacao">{{ textoSituacao(d.contratacao.situacaoComercial) }}</span>
              </div>
              <div class="card grid gap-4 p-5 sm:grid-cols-2">
                <div>
                  <div class="label">Valor</div>
                  <div class="font-semibold">{{ d.contratacao.valor | currency:'BRL' }} · {{ textoPeriodicidade(d.contratacao.periodicidade) }}</div>
                </div>
                <div>
                  <div class="label">Vencimento</div>
                  <div class="font-semibold">Todo dia {{ d.contratacao.diaVencimento }}</div>
                </div>
                <div>
                  <div class="label">Início</div>
                  <div class="font-semibold">{{ d.contratacao.inicio | date:'dd/MM/yyyy' }}</div>
                </div>
                <div>
                  <div class="label">Vigente até</div>
                  <div class="font-semibold">{{ d.contratacao.vigenteAte ? (d.contratacao.vigenteAte | date:'dd/MM/yyyy') : 'Sem data de término' }}</div>
                </div>
                <div class="sm:col-span-2">
                  <div class="label">Instância</div>
                  <div class="font-semibold">{{ d.contratacao.nomeInstancia }}</div>
                </div>
              </div>
              @if (d.contratacao.adicionais.length) {
                <div class="card p-5" data-bloco="adicionais">
                  <h3 class="secao-titulo mb-3">Adicionais</h3>
                  @for (a of d.contratacao.adicionais; track a.nome) {
                    <div class="flex justify-between border-b border-[var(--line)] py-2 text-sm last:border-0">
                      <span>{{ a.nome }}</span>
                      <span class="font-semibold">{{ a.quantidade }}</span>
                    </div>
                  }
                </div>
              }
            }
            @case ('financeiro') {
              <div class="flex flex-col gap-3" data-bloco="financeiro">
                @for (cob of d.cobrancas; track cob.id) {
                  <div class="card flex items-center justify-between gap-4 p-4" data-cobranca>
                    <div>
                      <div class="font-bold">{{ cob.valor | currency:'BRL' }}</div>
                      <div class="text-sm text-slate-500">
                        Competência {{ cob.competenciaInicio | date:'MM/yyyy' }} · vence em {{ cob.vencimento | date:'dd/MM/yyyy' }}
                        @if (cob.pagoEm) { · paga em {{ cob.pagoEm | date:'dd/MM/yyyy' }} }
                      </div>
                    </div>
                    <span class="badge font-bold {{ corCobranca(cob) }}">{{ textoCobranca(cob) }}</span>
                  </div>
                } @empty {
                  <div class="card p-8 text-center text-slate-500">Nenhuma cobrança ainda.</div>
                }
              </div>
            }
          }
        </div>
      } @else {
        <div class="flex items-center justify-center p-12" data-estado="carregando">
          <p class="animate-pulse font-semibold text-slate-400">Buscando as informações da sua conta...</p>
        </div>
      }

      <app-consumo-plano />
      <div rodape class="flex justify-end">
        <button type="button" class="btn-secondary" (click)="fechar()">Fechar</button>
      </div>
    </app-modal>
  `
})
export class MinhaContaModalComponent implements OnInit {
  private router = inject(Router);
  private servico = inject(MinhaContaService);

  readonly verde = VERDE;
  readonly aba = signal<Aba>('cadastro');
  readonly dados = signal<MinhaContaDados | null>(null);
  readonly erro = signal<string | null>(null);

  ngOnInit(): void {
    this.buscar();
  }

  buscar(): void {
    this.erro.set(null);
    this.dados.set(null);
    this.servico.buscar().subscribe({
      next: dados => this.dados.set(dados),
      error: erro => this.erro.set(mensagemApi(erro, 'Não foi possível consultar sua conta agora. Tente de novo em instantes.'))
    });
  }

  fechar(): void {
    this.router.navigate([{ outlets: { modal: null } }]);
  }

  textoSituacao(situacao: SituacaoComercial): string {
    return SITUACAO[situacao]?.texto ?? situacao;
  }

  corSituacao(situacao: SituacaoComercial): string {
    return SITUACAO[situacao]?.cor ?? CINZA;
  }

  textoPeriodicidade(periodicidade: string): string {
    return PERIODICIDADE[periodicidade] ?? periodicidade;
  }

  textoCobranca(cob: MinhaContaCobranca): string {
    if (cob.situacao === 'ABERTA') return cob.vencida ? 'Vencida' : 'Aberta';
    return { PAGA: 'Paga', CANCELADA: 'Cancelada', ISENTA: 'Isenta' }[cob.situacao];
  }

  corCobranca(cob: MinhaContaCobranca): string {
    if (cob.situacao === 'PAGA') return VERDE;
    if (cob.situacao === 'ABERTA') return cob.vencida ? VERMELHO : AMBAR;
    return CINZA;
  }
}
