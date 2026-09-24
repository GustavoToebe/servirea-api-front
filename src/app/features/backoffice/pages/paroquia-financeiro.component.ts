import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnChanges, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BackofficeApiService } from '../backoffice-api.service';
import {
  Cobranca,
  FORMA_PAGAMENTO,
  Financeiro,
  FormaPagamento,
  PERIODICIDADE,
  Periodicidade,
  Plano,
  apiMessage,
  formatCompetencia,
  formatMoney,
  formatWhen,
  todayIso
} from '../backoffice.models';

type Mes = { label: string; estado: 'paga' | 'aberta' | 'vencida' | 'isenta' | 'vazia'; titulo: string };

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

/**
 * Financeiro da paróquia no backoffice (V029 da API): assinatura, grade de
 * meses pagos/em aberto/vencidos e lançamentos com registro manual de
 * pagamento (PIX, cartão, dinheiro...). Substitui o antigo "Marcar como pago".
 * Toda ação devolve o financeiro inteiro atualizado; `alterou` avisa a ficha
 * da paróquia para recarregar status e vigência.
 */
@Component({
  selector: 'app-paroquia-financeiro',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="bo-card p-5">
      <div class="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 class="text-lg font-bold">Financeiro</h2>
          <p class="text-sm text-neutral-500">Plano, mensalidades e pagamentos registrados à mão.</p>
        </div>
        <div class="flex flex-wrap gap-2">
          <button *ngIf="dados?.assinaturaAtual" type="button" class="bo-btn-ghost" (click)="abrirGerar()">Gerar meses adiantados</button>
          <button type="button" class="bo-btn-line" (click)="abrirAssinatura()">{{ dados?.assinaturaAtual ? 'Trocar plano' : 'Nova assinatura' }}</button>
        </div>
      </div>

      <div *ngIf="error && !modal" class="mb-4 rounded-lg border border-[#e10600]/40 bg-[#e10600]/10 px-4 py-3 text-sm text-[#ffb4b0]">{{ error }}</div>
      <div *ngIf="notice" class="mb-4 rounded-lg border border-emerald-800/50 bg-emerald-950/40 px-4 py-3 text-sm text-emerald-300">{{ notice }}</div>
      <div *ngIf="loading" class="text-sm text-neutral-400">Carregando financeiro...</div>

      <ng-container *ngIf="!loading && dados">
        <div *ngIf="!dados.assinaturaAtual && !dados.cobrancas.length" class="rounded-lg border border-dashed border-[#333] px-4 py-8 text-center text-sm text-neutral-400">
          Esta paróquia ainda não tem assinatura. Crie uma para começar a gerar as mensalidades.
        </div>

        <div class="grid gap-4 lg:grid-cols-4" *ngIf="dados.assinaturaAtual || dados.cobrancas.length">
          <div class="rounded-lg border border-[#262626] p-4 lg:col-span-2">
            <div class="text-xs font-bold uppercase tracking-wider text-neutral-500">Assinatura</div>
            <ng-container *ngIf="dados.assinaturaAtual as a; else semAssinatura">
              <div class="mt-2 text-xl font-bold">{{ a.planoNome }} · {{ periodicidade(a.periodicidade) }}</div>
              <div class="mt-1 text-sm text-neutral-400">
                {{ money(a.valor) }} por {{ a.periodicidade === 'ANUAL' ? 'ano' : 'mês' }} · vence dia {{ a.diaVencimento }} · desde {{ when(a.inicio) }}
              </div>
              <div *ngIf="a.observacoes" class="mt-1 text-xs text-neutral-500">{{ a.observacoes }}</div>
              <button type="button" class="bo-link mt-3" (click)="pedirCancelarAssinatura()">Encerrar assinatura</button>
            </ng-container>
            <ng-template #semAssinatura><div class="mt-2 text-sm text-neutral-400">Sem assinatura ativa.</div></ng-template>
          </div>
          <div class="rounded-lg border p-4" [class.border-[#e10600]]="dados.resumo.vencidas" [class.border-[#262626]]="!dados.resumo.vencidas">
            <div class="text-xs font-bold uppercase tracking-wider text-neutral-500">Situação</div>
            <div *ngIf="!dados.resumo.vencidas" class="mt-2 text-xl font-bold bo-ok">Em dia</div>
            <ng-container *ngIf="dados.resumo.vencidas">
              <div class="mt-2 text-xl font-bold bo-bad">{{ dados.resumo.diasAtraso }} dia(s) de atraso</div>
              <div class="mt-1 text-sm text-neutral-400">{{ dados.resumo.vencidas }} vencida(s) · {{ money(dados.resumo.valorEmAtraso) }}</div>
            </ng-container>
            <div class="mt-1 text-xs text-neutral-500">Próximo vencimento: {{ when(dados.resumo.proximoVencimento) }}</div>
          </div>
          <div class="rounded-lg border border-[#262626] p-4">
            <div class="text-xs font-bold uppercase tracking-wider text-neutral-500">Pago em {{ anoAtual }}</div>
            <div class="mt-2 text-xl font-bold">{{ money(dados.resumo.totalPagoNoAno) }}</div>
          </div>
        </div>

        <div class="mt-6" *ngIf="dados.cobrancas.length">
          <div class="mb-3 flex items-center justify-between">
            <h3 class="font-bold">Meses de {{ ano }}</h3>
            <div class="flex items-center gap-2">
              <button type="button" class="bo-btn-ghost !px-3" (click)="ano = ano - 1" aria-label="Ano anterior">‹</button>
              <span class="w-12 text-center text-sm font-bold">{{ ano }}</span>
              <button type="button" class="bo-btn-ghost !px-3" (click)="ano = ano + 1" aria-label="Próximo ano">›</button>
            </div>
          </div>
          <div class="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-12">
            <div *ngFor="let mes of meses" [attr.title]="mes.titulo"
                 class="rounded-lg border px-2 py-3 text-center text-xs font-bold"
                 [ngClass]="{
                   'border-emerald-700 bg-emerald-950/50 text-emerald-300': mes.estado === 'paga',
                   'border-[#e10600] bg-[#e10600]/15 text-[#ff8a86]': mes.estado === 'vencida',
                   'border-[#3a3a3a] bg-[#1b1b1b] text-neutral-300': mes.estado === 'aberta',
                   'border-[#2a2a2a] text-neutral-500 line-through': mes.estado === 'isenta',
                   'border-dashed border-[#262626] text-neutral-700': mes.estado === 'vazia'
                 }">
              {{ mes.label }}
            </div>
          </div>
          <div class="mt-2 flex flex-wrap gap-4 text-xs text-neutral-500">
            <span><span class="bo-ok">■</span> Pago</span>
            <span><span class="text-neutral-300">■</span> Em aberto</span>
            <span><span class="bo-bad">■</span> Vencido</span>
            <span class="line-through">Isento</span>
          </div>
        </div>

        <div class="mt-6" *ngIf="dados.cobrancas.length">
          <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 class="font-bold">Lançamentos</h3>
            <button type="button" class="bo-btn" [disabled]="!selecionadas.size" (click)="abrirPagamento()">
              Registrar pagamento{{ selecionadas.size > 1 ? ' (' + selecionadas.size + ')' : '' }}
            </button>
          </div>
          <div class="overflow-x-auto rounded-lg border border-[#2a2a2a]">
            <table class="bo-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Competência</th>
                  <th>Vencimento</th>
                  <th>Valor</th>
                  <th>Situação</th>
                  <th>Pagamento</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let c of dados.cobrancas">
                  <td>
                    <input *ngIf="c.status === 'ABERTA'" type="checkbox" class="h-4 w-4 accent-[#e10600]"
                           [checked]="selecionadas.has(c.id)" (change)="alternar(c.id)" [attr.aria-label]="'Selecionar ' + competencia(c)">
                  </td>
                  <td class="font-semibold">{{ competencia(c) }}</td>
                  <td>{{ when(c.vencimento) }}</td>
                  <td>{{ money(c.valor) }}</td>
                  <td [ngClass]="situacaoClasse(c)">{{ situacao(c) }}</td>
                  <td>
                    <ng-container *ngIf="c.status === 'PAGA'">
                      {{ when(c.pagoEm) }} · {{ forma(c.formaPagamento) }} · {{ money(c.valorPago) }}
                    </ng-container>
                    <div *ngIf="c.observacao" class="text-xs text-neutral-500">{{ c.observacao }}</div>
                  </td>
                  <td class="whitespace-nowrap text-right">
                    <button *ngIf="c.status === 'ABERTA'" type="button" class="bo-link mr-3" (click)="pagarUma(c)">Pagar</button>
                    <button *ngIf="c.status === 'ABERTA'" type="button" class="bo-link" (click)="pedirIsentar(c)">Isentar</button>
                    <button *ngIf="c.status === 'PAGA'" type="button" class="bo-link" (click)="pedirEstornar(c)">Estornar</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </ng-container>
    </section>

    <!-- Modal: nova assinatura / trocar plano -->
    <div *ngIf="modal === 'assinatura'" class="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <form class="bo-card w-full max-w-lg p-6" (ngSubmit)="salvarAssinatura()">
        <h3 class="text-lg font-bold">{{ dados?.assinaturaAtual ? 'Trocar plano' : 'Nova assinatura' }}</h3>
        <p *ngIf="dados?.assinaturaAtual" class="mt-1 text-sm text-neutral-400">A assinatura atual é encerrada na véspera do novo início, e as cobranças em aberto a partir dessa data são canceladas.</p>
        <p *ngIf="!planos.length" class="mt-3 text-sm text-neutral-400">Nenhum plano cadastrado. <a routerLink="/admin/planos" class="bo-link">Cadastrar planos</a></p>
        <div class="mt-4 grid gap-4 sm:grid-cols-2">
          <div class="sm:col-span-2">
            <label class="bo-label">Plano *</label>
            <select class="bo-field" [(ngModel)]="novaAssinatura.planoId" name="planoId" required (ngModelChange)="sugerirValor()">
              <option value="" disabled>Escolha</option>
              <option *ngFor="let p of planosAtivos" [value]="p.id">{{ p.nome }}</option>
            </select>
          </div>
          <div>
            <label class="bo-label">Cobrança *</label>
            <select class="bo-field" [(ngModel)]="novaAssinatura.periodicidade" name="periodicidade" (ngModelChange)="sugerirValor()">
              <option value="MENSAL">Mensal</option>
              <option value="ANUAL">Anual</option>
            </select>
          </div>
          <div>
            <label class="bo-label">Valor (R$) {{ precoCatalogo !== null ? '' : '*' }}</label>
            <input class="bo-field" type="number" min="0" step="0.01" [(ngModel)]="novaAssinatura.valor" name="valor"
                   [placeholder]="precoCatalogo !== null ? 'Catálogo: ' + money(precoCatalogo) : 'Informe o valor'">
            <p class="mt-1 text-xs text-neutral-500">{{ precoCatalogo !== null ? 'Vazio usa o preço do catálogo. Preencha para dar desconto.' : 'Plano sem preço no catálogo para esta cobrança.' }}</p>
          </div>
          <div>
            <label class="bo-label">Início *</label>
            <input class="bo-field" type="date" [(ngModel)]="novaAssinatura.inicio" name="inicio" required>
          </div>
          <div>
            <label class="bo-label">Dia de vencimento *</label>
            <input class="bo-field" type="number" min="1" max="28" [(ngModel)]="novaAssinatura.diaVencimento" name="diaVencimento" required>
          </div>
          <div class="sm:col-span-2">
            <label class="bo-label">Observações</label>
            <input class="bo-field" [(ngModel)]="novaAssinatura.observacoes" name="observacoes" placeholder="Ex.: desconto de lançamento">
          </div>
        </div>
        <div *ngIf="error && modal" class="mt-4 rounded-lg border border-[#e10600]/40 bg-[#e10600]/10 px-3 py-2 text-sm text-[#ffb4b0]">{{ error }}</div>
        <div class="mt-6 flex justify-end gap-2">
          <button type="button" class="bo-btn-ghost" (click)="modal = null">Cancelar</button>
          <button type="submit" class="bo-btn" [disabled]="saving || !novaAssinatura.planoId">{{ saving ? 'Salvando...' : 'Salvar assinatura' }}</button>
        </div>
      </form>
    </div>

    <!-- Modal: registrar pagamento -->
    <div *ngIf="modal === 'pagamento'" class="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <form class="bo-card w-full max-w-md p-6" (ngSubmit)="salvarPagamento()">
        <h3 class="text-lg font-bold">Registrar pagamento</h3>
        <p class="mt-1 text-sm text-neutral-400">{{ resumoSelecao }}</p>
        <div class="mt-4 grid gap-4">
          <div>
            <label class="bo-label">Data do pagamento *</label>
            <input class="bo-field" type="date" [(ngModel)]="pagamento.pagoEm" name="pagoEm" [max]="hoje" required>
          </div>
          <div>
            <label class="bo-label">Forma *</label>
            <select class="bo-field" [(ngModel)]="pagamento.formaPagamento" name="formaPagamento">
              <option *ngFor="let f of formas" [value]="f">{{ forma(f) }}</option>
            </select>
          </div>
          <div *ngIf="selecionadas.size === 1">
            <label class="bo-label">Valor pago (R$)</label>
            <input class="bo-field" type="number" min="0" step="0.01" [(ngModel)]="pagamento.valorPago" name="valorPago" placeholder="Vazio = valor da cobrança">
          </div>
          <div>
            <label class="bo-label">Observação</label>
            <input class="bo-field" [(ngModel)]="pagamento.observacao" name="observacao" placeholder="Ex.: comprovante no WhatsApp">
          </div>
        </div>
        <div *ngIf="error && modal" class="mt-4 rounded-lg border border-[#e10600]/40 bg-[#e10600]/10 px-3 py-2 text-sm text-[#ffb4b0]">{{ error }}</div>
        <div class="mt-6 flex justify-end gap-2">
          <button type="button" class="bo-btn-ghost" (click)="modal = null">Cancelar</button>
          <button type="submit" class="bo-btn" [disabled]="saving">{{ saving ? 'Salvando...' : 'Confirmar pagamento' }}</button>
        </div>
      </form>
    </div>

    <!-- Modal: gerar adiantadas -->
    <div *ngIf="modal === 'gerar'" class="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <form class="bo-card w-full max-w-md p-6" (ngSubmit)="salvarGerar()">
        <h3 class="text-lg font-bold">Gerar meses adiantados</h3>
        <p class="mt-1 text-sm text-neutral-400">Cria as cobranças até o mês escolhido, para registrar um pagamento adiantado (até 36 meses).</p>
        <div class="mt-4">
          <label class="bo-label">Até *</label>
          <input class="bo-field" type="month" [(ngModel)]="gerarAte" name="gerarAte" required>
        </div>
        <div *ngIf="error && modal" class="mt-4 rounded-lg border border-[#e10600]/40 bg-[#e10600]/10 px-3 py-2 text-sm text-[#ffb4b0]">{{ error }}</div>
        <div class="mt-6 flex justify-end gap-2">
          <button type="button" class="bo-btn-ghost" (click)="modal = null">Cancelar</button>
          <button type="submit" class="bo-btn" [disabled]="saving || !gerarAte">Gerar</button>
        </div>
      </form>
    </div>

    <!-- Modal: confirmação (estornar / isentar / encerrar) -->
    <div *ngIf="confirmacao" class="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
      <div class="bo-card w-full max-w-md p-6">
        <h3 class="text-lg font-bold">{{ confirmacao.titulo }}</h3>
        <p class="mt-2 text-sm text-neutral-400">{{ confirmacao.mensagem }}</p>
        <div *ngIf="confirmacao.acao === 'isentar'" class="mt-4">
          <label class="bo-label">Motivo</label>
          <input class="bo-field" [(ngModel)]="motivo" name="motivo" placeholder="Ex.: cortesia de lançamento">
        </div>
        <div *ngIf="error && modal" class="mt-4 rounded-lg border border-[#e10600]/40 bg-[#e10600]/10 px-3 py-2 text-sm text-[#ffb4b0]">{{ error }}</div>
        <div class="mt-6 flex justify-end gap-2">
          <button type="button" class="bo-btn-ghost" (click)="confirmacao = null">Cancelar</button>
          <button type="button" class="bo-btn" (click)="confirmar()">Confirmar</button>
        </div>
      </div>
    </div>
  `
})
export class ParoquiaFinanceiroComponent implements OnChanges {
  @Input({ required: true }) paroquiaId!: string;
  /** Pagamento pode mudar status/vigência da paróquia — a ficha recarrega. */
  @Output() alterou = new EventEmitter<void>();

  dados: Financeiro | null = null;
  planos: Plano[] = [];
  loading = true;
  saving = false;
  error = '';
  notice = '';
  modal: 'assinatura' | 'pagamento' | 'gerar' | null = null;
  confirmacao: { acao: 'estornar' | 'isentar' | 'encerrar'; titulo: string; mensagem: string; cobrancaId?: string } | null = null;
  motivo = '';
  selecionadas = new Set<string>();
  anoAtual = new Date().getFullYear();
  ano = this.anoAtual;
  hoje = todayIso();
  gerarAte = '';
  formas = Object.keys(FORMA_PAGAMENTO) as FormaPagamento[];
  novaAssinatura = this.assinaturaVazia();
  pagamento = this.pagamentoVazio();

  money = formatMoney;
  when = formatWhen;
  periodicidade = (p: Periodicidade) => PERIODICIDADE[p];
  forma = (f: FormaPagamento | null) => (f ? FORMA_PAGAMENTO[f] : '—');

  constructor(private api: BackofficeApiService) {}

  ngOnChanges() {
    this.carregar();
  }

  get planosAtivos(): Plano[] {
    return this.planos.filter(p => p.ativo);
  }

  get precoCatalogo(): number | null {
    const plano = this.planos.find(p => p.id === this.novaAssinatura.planoId);
    if (!plano) return null;
    return this.novaAssinatura.periodicidade === 'ANUAL' ? plano.precoAnual : plano.precoMensal;
  }

  /** Grade Jan–Dez do ano escolhido. No plano anual, os 12 meses do período herdam o estado da cobrança anual. */
  get meses(): Mes[] {
    const cobrancas = this.dados?.cobrancas ?? [];
    return MESES.map((label, i) => {
      const inicioMes = `${this.ano}-${String(i + 1).padStart(2, '0')}-01`;
      const doMes = cobrancas.filter(c => c.competenciaInicio.slice(0, 7) <= inicioMes.slice(0, 7) && c.competenciaFim >= inicioMes);
      // Troca de plano pode deixar duas cobranças no mesmo mês (uma cancelada): vale a que não foi cancelada.
      const c = doMes.find(x => x.status !== 'CANCELADA') ?? doMes[0];
      if (!c) return { label, estado: 'vazia', titulo: 'Sem cobrança' };
      const estado = c.status === 'PAGA' ? 'paga' : c.status === 'CANCELADA' ? 'isenta' : c.vencida ? 'vencida' : 'aberta';
      const titulo = `${this.competencia(c)} · ${this.situacao(c)}${c.pagoEm ? ' em ' + formatWhen(c.pagoEm) : ''}`;
      return { label, estado, titulo };
    });
  }

  get resumoSelecao(): string {
    const cobrancas = (this.dados?.cobrancas ?? []).filter(c => this.selecionadas.has(c.id));
    const total = cobrancas.reduce((soma, c) => soma + c.valor, 0);
    const lista = cobrancas.map(c => this.competencia(c)).sort().join(', ');
    return `${lista} · total ${formatMoney(total)}`;
  }

  competencia(c: Cobranca): string {
    const inicio = formatCompetencia(c.competenciaInicio);
    const fim = formatCompetencia(c.competenciaFim);
    return inicio === fim ? inicio : `${inicio} a ${fim}`;
  }

  situacao(c: Cobranca): string {
    if (c.status === 'PAGA') return 'Paga';
    if (c.status === 'CANCELADA') return 'Isenta';
    return c.vencida ? 'Vencida' : 'Em aberto';
  }

  situacaoClasse(c: Cobranca): string {
    if (c.status === 'PAGA') return 'bo-ok';
    if (c.status === 'CANCELADA') return 'bo-mute';
    return c.vencida ? 'bo-bad' : 'bo-warn';
  }

  alternar(id: string) {
    if (this.selecionadas.has(id)) this.selecionadas.delete(id);
    else this.selecionadas.add(id);
  }

  abrirAssinatura() {
    this.error = '';
    this.novaAssinatura = this.assinaturaVazia();
    const atual = this.dados?.assinaturaAtual;
    if (atual) {
      this.novaAssinatura.periodicidade = atual.periodicidade;
      this.novaAssinatura.diaVencimento = atual.diaVencimento;
    }
    this.modal = 'assinatura';
    this.api.listarPlanos().subscribe({
      next: planos => this.planos = planos,
      error: err => this.error = apiMessage(err)
    });
  }

  sugerirValor() {
    this.novaAssinatura.valor = null;
  }

  salvarAssinatura() {
    const a = this.novaAssinatura;
    this.executar(this.api.criarAssinatura(this.paroquiaId, {
      planoId: a.planoId,
      periodicidade: a.periodicidade,
      valor: a.valor === null || (a.valor as unknown) === '' ? null : a.valor,
      diaVencimento: a.diaVencimento,
      inicio: a.inicio,
      observacoes: a.observacoes.trim() || null
    }), 'Assinatura salva.');
  }

  pagarUma(c: Cobranca) {
    this.selecionadas = new Set([c.id]);
    this.abrirPagamento();
  }

  abrirPagamento() {
    this.error = '';
    this.pagamento = this.pagamentoVazio();
    this.modal = 'pagamento';
  }

  salvarPagamento() {
    const p = this.pagamento;
    this.executar(this.api.registrarPagamento(this.paroquiaId, {
      cobrancaIds: [...this.selecionadas],
      pagoEm: p.pagoEm,
      formaPagamento: p.formaPagamento,
      valorPago: this.selecionadas.size === 1 && p.valorPago !== null && (p.valorPago as unknown) !== '' ? p.valorPago : null,
      observacao: p.observacao.trim() || null
    }), 'Pagamento registrado.');
  }

  abrirGerar() {
    this.error = '';
    const d = new Date();
    d.setMonth(d.getMonth() + 12);
    this.gerarAte = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    this.modal = 'gerar';
  }

  salvarGerar() {
    this.executar(this.api.gerarCobrancas(this.paroquiaId, this.gerarAte), 'Meses gerados.');
  }

  pedirEstornar(c: Cobranca) {
    this.confirmacao = {
      acao: 'estornar', cobrancaId: c.id, titulo: 'Estornar pagamento',
      mensagem: `A cobrança de ${this.competencia(c)} volta a ficar em aberto. O status da paróquia não muda sozinho.`
    };
  }

  pedirIsentar(c: Cobranca) {
    this.motivo = '';
    this.confirmacao = {
      acao: 'isentar', cobrancaId: c.id, titulo: 'Isentar cobrança',
      mensagem: `A cobrança de ${this.competencia(c)} deixa de ser devida.`
    };
  }

  pedirCancelarAssinatura() {
    this.confirmacao = {
      acao: 'encerrar', titulo: 'Encerrar assinatura',
      mensagem: 'A assinatura termina hoje. Cobranças em aberto de meses futuros são canceladas; as atuais continuam devidas.'
    };
  }

  confirmar() {
    const c = this.confirmacao;
    if (!c) return;
    this.confirmacao = null;
    if (c.acao === 'estornar' && c.cobrancaId) {
      this.executar(this.api.estornarCobranca(this.paroquiaId, c.cobrancaId), 'Pagamento estornado.');
    } else if (c.acao === 'isentar' && c.cobrancaId) {
      this.executar(this.api.isentarCobranca(this.paroquiaId, c.cobrancaId, this.motivo.trim() || null), 'Cobrança isenta.');
    } else if (c.acao === 'encerrar') {
      this.executar(this.api.cancelarAssinatura(this.paroquiaId), 'Assinatura encerrada.');
    }
  }

  private carregar() {
    this.loading = true;
    this.error = '';
    this.selecionadas.clear();
    this.api.financeiro(this.paroquiaId).subscribe({
      next: dados => { this.dados = dados; this.loading = false; },
      error: err => { this.error = apiMessage(err); this.loading = false; }
    });
  }

  private executar(request: ReturnType<BackofficeApiService['financeiro']>, mensagem: string) {
    this.saving = true;
    this.error = '';
    this.notice = '';
    request.subscribe({
      next: dados => {
        this.dados = dados;
        this.saving = false;
        this.modal = null;
        this.selecionadas.clear();
        this.notice = mensagem;
        this.alterou.emit();
      },
      error: err => { this.error = apiMessage(err); this.saving = false; }
    });
  }

  private assinaturaVazia() {
    return {
      planoId: '',
      periodicidade: 'MENSAL' as Periodicidade,
      valor: null as number | null,
      diaVencimento: 10,
      inicio: todayIso(),
      observacoes: ''
    };
  }

  private pagamentoVazio() {
    return {
      pagoEm: todayIso(),
      formaPagamento: 'PIX' as FormaPagamento,
      valorPago: null as number | null,
      observacao: ''
    };
  }
}
