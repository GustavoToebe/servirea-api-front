import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TabelaExportacao } from '../../shared/utils/exportacao-tabela';
import { coletarExportacao } from '../../shared/utils/coletar-exportacao';
import { firstValueFrom, Subscription } from 'rxjs';
import { mensagemApi } from '../../core/api/api-error';
import { SessaoAtual } from '../../core/layout/sessao-atual';
import { CabecalhoPaginaComponent } from '../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { EstadoListaComponent } from '../../shared/components/estado-lista/estado-lista.component';
import { DialogoService } from '../../shared/services/dialogo.service';
import {
  CanalNotificacao, ConfigNotificacao, EntregaNotificacao, NotificacoesApiService, OrigemNotificacao
} from './notificacoes-api.service';

/**
 * Centro de entregas (F05/F13): gatilhos automáticos por origem e canal, desligados por padrão, e o histórico das
 * notificações enfileiradas com a situação de cada envio. A fila e as tentativas são as dos comunicados.
 */
@Component({
  selector: 'app-entregas',
  imports: [CommonModule, FormsModule, RouterLink, CabecalhoPaginaComponent, EstadoListaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <app-cabecalho-pagina [exportacao]="exportacao" [exportacaoOcupada]="carregando()" titulo="Centro de entregas"
        subtitulo="Avisos de escala e mural enfileirados. ENVIADO indica aceitação do provedor, não leitura.">
        <a acoes routerLink="/comunicados" class="btn-secondary">Comunicados</a>
      </app-cabecalho-pagina>
      @if (erro()) { <p class="card p-4 text-red-600" role="alert" data-erro>{{ erro() }}</p> }
      <section class="card secao-form p-6">
        <h2 class="secao-titulo">Gatilhos automáticos</h2>
        <p class="mb-3 text-sm text-slate-500">
          Desligados por padrão. Só enviam para quem tem contato e, no WhatsApp, autorização. Cada versão é avisada uma única vez por canal.
        </p>
        <ul class="space-y-2">
          @for (c of configs(); track c.origem + c.canal) {
            <li class="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] p-3">
              <span>{{ rotuloOrigem(c.origem) }} · {{ rotuloCanal(c.canal) }}</span>
              <label class="flex items-center gap-2 text-sm">
                <input type="checkbox" [checked]="c.ativo" [disabled]="ocupado() || !pode('NOTIFICACAO_CONFIGURAR')"
                  (change)="alternar(c)" [attr.aria-label]="'Gatilho ' + rotuloOrigem(c.origem) + ' ' + rotuloCanal(c.canal)">
                {{ c.ativo ? 'Ligado' : 'Desligado' }}
              </label>
            </li>
          }
        </ul>
      </section>
      <section class="card p-4">
        <div class="mb-3 flex items-center justify-between gap-3">
          <h2 class="secao-titulo !mb-0">Histórico</h2>
          <select class="field !w-auto" [(ngModel)]="origem" (ngModelChange)="buscar()" aria-label="Origem">
            <option value="">Todas as origens</option>
            <option value="ESCALA">Escalas</option>
            <option value="MURAL">Mural</option>
            <option value="ESCALA_LEMBRETE">Lembretes de escala</option>
          </select>
        </div>
        <div class="tabela-rolagem">
          <table class="tabela w-full">
            <thead><tr><th>Quando</th><th>Origem</th><th>Canal</th><th>Gatilho</th><th>Destinatários</th><th>Situação</th></tr></thead>
            <tbody>
              @for (e of itens(); track e.id) {
                <tr>
                  <td>{{ e.criadoEm | date: 'dd/MM/yyyy HH:mm' }}</td>
                  <td>{{ rotuloOrigem(e.origem) }}: {{ e.titulo || 'removido' }}</td>
                  <td>{{ rotuloCanal(e.canal) }}</td>
                  <td>{{ e.gatilho === 'AUTOMATICO' ? 'Automático' : 'Manual' }}</td>
                  <td>{{ e.total }} @if (e.ignorados) { <span class="text-slate-500">(+{{ e.ignorados }} sem contato/autorização)</span> }</td>
                  <td>
                    @if (e.pendentes) { <span class="badge bg-amber-50 text-amber-700">{{ e.pendentes }} na fila</span> }
                    @if (e.enviados) { <span class="badge bg-emerald-50 text-emerald-700">{{ e.enviados }} enviados</span> }
                    @if (e.falhas) { <span class="badge bg-red-50 text-red-700">{{ e.falhas }} falhas</span> }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <app-estado-lista [carregando]="carregando()" [vazio]="!itens().length" mensagemVazio="Nenhuma notificação registrada." />
        <div class="flex items-center gap-3">
          <button type="button" class="btn-secondary" [disabled]="pagina === 0 || carregando()" (click)="paginar(-1)">Anterior</button>
          <span>{{ total() }} notificações · Página {{ pagina + 1 }}</span>
          <button type="button" class="btn-secondary" [disabled]="(pagina + 1) * 30 >= total() || carregando()" (click)="paginar(1)">Próxima</button>
        </div>
      </section>
    </div>
  `
})
export class EntregasComponent implements OnInit, OnDestroy {
  private readonly api = inject(NotificacoesApiService);
  private readonly sessao = inject(SessaoAtual);
  private readonly dialogo = inject(DialogoService);

  readonly configs = signal<ConfigNotificacao[]>([]);
  readonly itens = signal<EntregaNotificacao[]>([]);
  readonly total = signal(0);
  readonly carregando = signal(false);
  readonly ocupado = signal(false);
  readonly erro = signal('');
  private destruido = false;
  private origemAplicada: OrigemNotificacao | '' = '';
  readonly exportacao = async (): Promise<TabelaExportacao> => {
    const origem = this.origemAplicada;
    const itens = await coletarExportacao(p => firstValueFrom(this.api.entregas(origem, p)), () => !this.destruido);
    return { nome: 'entregas', titulo: 'Centro de entregas', contexto: origem || 'Todas as origens',
      colunas: ['Quando', 'Origem', 'Título', 'Canal', 'Gatilho', 'Destinatários', 'Ignorados', 'Pendentes', 'Enviados', 'Falhas'],
      linhas: itens.map(e => [e.criadoEm, this.rotuloOrigem(e.origem), e.titulo ?? '', this.rotuloCanal(e.canal), e.gatilho, e.total, e.ignorados, e.pendentes, e.enviados, e.falhas]) };
  };
  origem: OrigemNotificacao | '' = '';
  pagina = 0;
  private leitura?: Subscription;
  private escrita?: Subscription;

  pode(codigo: string) { return this.sessao.permissoes().includes(codigo); }
  rotuloOrigem(o: OrigemNotificacao) { return ({ ESCALA: 'Escala finalizada', MURAL: 'Mural', ESCALA_LEMBRETE: 'Lembrete de escala' })[o]; }
  rotuloCanal(c: CanalNotificacao) { return c === 'EMAIL' ? 'E-mail' : 'WhatsApp'; }

  ngOnInit() {
    this.api.configuracoes().subscribe({ next: c => this.configs.set(c), error: e => this.erro.set(mensagemApi(e, 'Não foi possível consultar os gatilhos.')) });
    this.carregar();
  }

  buscar() { this.pagina = 0; this.carregar(); }
  paginar(delta: number) { this.pagina += delta; this.carregar(); }

  carregar() {
    this.leitura?.unsubscribe();
    this.carregando.set(true);
    const origem = this.origem;
    this.leitura = this.api.entregas(origem, this.pagina).subscribe({
      next: r => { this.origemAplicada = origem; this.itens.set(r.itens); this.total.set(r.total); this.carregando.set(false); },
      error: e => { this.carregando.set(false); this.erro.set(mensagemApi(e, 'Não foi possível consultar as entregas.')); }
    });
  }

  async alternar(c: ConfigNotificacao) {
    if (this.ocupado() || !this.pode('NOTIFICACAO_CONFIGURAR')) return;
    const ligar = !c.ativo;
    if (ligar && !await this.dialogo.confirmar({
      mensagem: `Ligar o gatilho de ${this.rotuloOrigem(c.origem)} por ${this.rotuloCanal(c.canal)}? As próximas publicações passam a enfileirar mensagens automaticamente.`,
      confirmar: 'Ligar'
    })) { this.configs.set([...this.configs()]); return; }
    this.ocupado.set(true);
    this.erro.set('');
    this.escrita = this.api.configurar(c.origem, c.canal, ligar, c.versao).subscribe({
      next: nova => {
        this.configs.set(this.configs().map(x => x.origem === nova.origem && x.canal === nova.canal ? nova : x));
        this.ocupado.set(false);
      },
      error: e => {
        this.ocupado.set(false);
        this.erro.set(mensagemApi(e, 'Não foi possível salvar o gatilho. Atualize a página.'));
        this.api.configuracoes().subscribe(l => this.configs.set(l));
      }
    });
  }

  ngOnDestroy() {
    this.destruido = true;
    this.leitura?.unsubscribe();
    this.escrita?.unsubscribe();
  }
}
