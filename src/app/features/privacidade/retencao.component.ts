import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { mensagemApi } from '../../core/api/api-error';
import { SessaoAtual } from '../../core/layout/sessao-atual';
import { CabecalhoPaginaComponent } from '../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { DialogoService } from '../../shared/services/dialogo.service';
import { PrivacidadeApiService, Retencao } from './privacidade-api.service';

/**
 * Retenção de comunicados (F09). O prazo é opcional e nada roda sozinho: a execução é uma ação manual, confirmada,
 * que anonimiza destinatário, contato e texto de comunicados concluídos mais antigos que o prazo.
 */
@Component({
  selector: 'app-retencao',
  imports: [CommonModule, FormsModule, CabecalhoPaginaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <app-cabecalho-pagina titulo="Retenção de dados"
        subtitulo="Por quanto tempo guardar o texto e o contato dos comunicados já enviados. A execução é manual." />
      @if (erro()) { <p class="card p-4 text-red-600" role="alert" data-erro>{{ erro() }}</p> }
      @if (resultado()) { <p class="card p-4 text-emerald-700" role="status" data-resultado>{{ resultado() }}</p> }
      @if (dados(); as r) {
        <section class="card secao-form p-6">
          <h2 class="secao-titulo">Comunicados enviados</h2>
          <label class="label">Guardar por (dias; vazio = não aplicar retenção)
            <input class="field" type="number" min="30" max="3650" name="dias" [(ngModel)]="dias" [disabled]="!pode('PRIVACIDADE_RETENCAO') || ocupado()"></label>
          <p class="mt-2 text-sm text-slate-500">
            Mínimo de 30 dias. A anonimização troca nome, contato e texto por um marcador e desliga o vínculo com a pessoa; contagens e datas continuam.
            Não há como desfazer.
          </p>
          @if (r.comunicadosDias) { <p class="mt-2 text-sm">{{ r.elegiveis }} destinatários seriam anonimizados agora.</p> }
          @if (pode('PRIVACIDADE_RETENCAO')) {
            <div class="mt-4 flex flex-wrap gap-2">
              <button type="button" class="btn-primary" [disabled]="ocupado()" (click)="salvar()" data-salvar>Salvar prazo</button>
              <button type="button" class="btn-danger" [disabled]="ocupado() || !r.comunicadosDias || !r.elegiveis" (click)="executar()" data-executar>
                Anonimizar agora
              </button>
            </div>
          }
        </section>
        <section class="card p-4">
          <h2 class="secao-titulo">Execuções recentes</h2>
          <ul class="space-y-1 text-sm">
            @for (e of r.execucoes; track e.executadoEm) {
              <li>{{ e.executadoEm | date: 'dd/MM/yyyy HH:mm' }} · {{ e.comunicadosAnonimizados }} anonimizados · corte {{ e.corte | date: 'dd/MM/yyyy' }}</li>
            }
          </ul>
          @if (!r.execucoes.length) { <p class="text-sm text-slate-500">Nenhuma execução.</p> }
        </section>
      }
    </div>
  `
})
export class RetencaoComponent implements OnInit, OnDestroy {
  private readonly api = inject(PrivacidadeApiService);
  private readonly sessao = inject(SessaoAtual);
  private readonly dialogo = inject(DialogoService);

  readonly dados = signal<Retencao | null>(null);
  readonly ocupado = signal(false);
  readonly erro = signal('');
  readonly resultado = signal('');
  dias: number | null = null;
  private chamada?: Subscription;

  pode(codigo: string) { return this.sessao.permissoes().includes(codigo); }

  ngOnInit() { this.carregar(); }

  carregar() {
    this.chamada?.unsubscribe();
    this.chamada = this.api.retencao().subscribe({
      next: r => { this.dados.set(r); this.dias = r.comunicadosDias; },
      error: e => this.erro.set(mensagemApi(e, 'Não foi possível consultar a política de retenção.'))
    });
  }

  salvar() {
    const r = this.dados();
    if (!r || this.ocupado() || !this.pode('PRIVACIDADE_RETENCAO')) return;
    this.ocupado.set(true);
    this.erro.set('');
    this.resultado.set('');
    this.chamada = this.api.definirRetencao(this.dias || null, r.versao).subscribe({
      next: nova => { this.dados.set(nova); this.dias = nova.comunicadosDias; this.ocupado.set(false); },
      error: e => { this.ocupado.set(false); this.erro.set(mensagemApi(e, 'Não foi possível salvar o prazo. Atualize a página.')); }
    });
  }

  async executar() {
    const r = this.dados();
    if (!r || this.ocupado() || !r.comunicadosDias || !this.pode('PRIVACIDADE_RETENCAO')) return;
    if (!await this.dialogo.confirmar({
      mensagem: `Anonimizar ${r.elegiveis} destinatários de comunicados com mais de ${r.comunicadosDias} dias? Esta ação não pode ser desfeita.`,
      confirmar: 'Anonimizar', perigo: true
    })) return;
    this.ocupado.set(true);
    this.erro.set('');
    this.chamada = this.api.executarRetencao(r.versao).subscribe({
      next: x => {
        this.ocupado.set(false);
        this.resultado.set(`${x.comunicadosAnonimizados} destinatários anonimizados.`);
        this.carregar();
      },
      error: e => { this.ocupado.set(false); this.erro.set(mensagemApi(e, 'Não foi possível executar a retenção.')); }
    });
  }

  ngOnDestroy() { this.chamada?.unsubscribe(); }
}
