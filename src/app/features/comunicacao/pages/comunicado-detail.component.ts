import { DatePipe } from '@angular/common';
import { Component, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { tamanhoLegivel } from '../components/comunicado-dialog.component';
import {
  ComunicadoDetalhe, DestinatarioLinha, ENVIAR_PARA_LABEL, STATUS_COMUNICADO_LABEL, STATUS_ENVIO_LABEL, StatusEnvio, TIPO_ENVIO_LABEL
} from '../comunicacao.models';
import { ComunicadosApiService } from '../comunicados-api.service';
import { CabecalhoPaginaComponent } from '../../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { TOM_STATUS_COMUNICADO } from './comunicados-list.component';

const TOM_ENVIO: Record<StatusEnvio, string> = {
  PENDENTE: 'bg-slate-100 text-slate-700',
  ENVIADO: 'bg-emerald-50 text-emerald-700',
  FALHA: 'bg-red-50 text-red-700'
};

/** Detalhe de um comunicado: números, progresso, anexos e o status de cada destinatário. */
@Component({
  selector: 'app-comunicado-detail',
  standalone: true,
  imports: [FormsModule, DatePipe, RouterLink, CabecalhoPaginaComponent],
  template: `
    <div class="space-y-6">
      <app-cabecalho-pagina titulo="Comunicado">
        <a acoes routerLink="/comunicados" class="btn-secondary">Voltar</a>
      </app-cabecalho-pagina>
      @if (error) { <div class="rounded-xl bg-red-50 p-4 text-red-700">{{ error }}</div> }
      @if (d; as d) {
        <section class="card space-y-4 p-6">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="text-sm text-slate-500">{{ d.comunicado.createdAt | date:'dd/MM/yyyy HH:mm' }} · {{ rotuloCanal[d.comunicado.canal] }} ·
                para {{ rotuloPara[d.comunicado.enviarPara] }}</p>
              <h2 class="text-lg font-black">{{ d.comunicado.assunto || d.comunicado.layoutNome }}</h2>
              <p class="text-sm text-slate-500">Layout: {{ d.comunicado.layoutNome }}</p>
            </div>
            <span [class]="'badge ' + tomComunicado[d.comunicado.status]">{{ rotuloStatus[d.comunicado.status] }}</span>
          </div>
          <div class="grid grid-cols-3 gap-3 text-center">
            <div><p class="text-2xl font-black">{{ d.comunicado.total }}</p><p class="text-xs text-slate-500">Total</p></div>
            <div><p class="text-2xl font-black text-emerald-700">{{ d.comunicado.enviados }}</p><p class="text-xs text-slate-500">Enviados</p></div>
            <div><p class="text-2xl font-black text-red-600">{{ d.comunicado.falhas }}</p><p class="text-xs text-slate-500">Falhas</p></div>
          </div>
          <div class="h-2 overflow-hidden rounded-full bg-slate-100" role="progressbar" [attr.aria-valuenow]="progresso" aria-valuemin="0" aria-valuemax="100">
            <div class="h-full bg-[var(--brand)] transition-all" [style.width.%]="progresso"></div>
          </div>
          @if (d.anexos.length) {
            <p class="text-sm"><b>Anexos:</b>
              @for (a of d.anexos; track a.id; let ultimo = $last) { {{ a.nome }} ({{ tamanho(a.tamanho) }}){{ ultimo ? '' : ', ' }} }
            </p>
          }
        </section>

        <div class="flex flex-wrap items-center justify-between gap-3">
          <select class="field max-w-xs" [(ngModel)]="filtro" aria-label="Filtrar por situação">
            <option value="">Todas as situações</option>
            @for (s of situacoes; track s) { <option [value]="s">{{ rotuloEnvio[s] }}</option> }
          </select>
          @if (d.comunicado.falhas > 0) {
            <button type="button" class="btn-primary" [disabled]="reenviando" (click)="reenviar()" data-reenviar>Reenviar falhas</button>
          }
        </div>

        <div class="tabela-rolagem">
          <table class="tabela">
            <thead><tr><th>Nome</th><th>Destino</th><th>Situação</th><th>Erro</th><th>Enviado em</th></tr></thead>
            <tbody>
              @for (x of visiveis; track x.id) {
                <tr>
                  <td>{{ x.nome }}</td><td>{{ x.destino }}</td>
                  <td><span [class]="'badge ' + tomEnvio[x.status]">{{ rotuloEnvio[x.status] }}</span></td>
                  <td class="text-sm text-red-700">{{ x.erro || '' }}</td>
                  <td class="whitespace-nowrap">{{ x.enviadoEm ? (x.enviadoEm | date:'dd/MM/yyyy HH:mm') : '—' }}</td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="p-6 text-center text-slate-500">Nenhum destinatário nesta situação.</td></tr>
              }
            </tbody>
          </table>
        </div>
      } @else if (!error) {
        <div class="card p-10 text-center text-slate-500">Carregando...</div>
      }
    </div>
  `
})
export class ComunicadoDetailComponent implements OnInit, OnDestroy {
  readonly rotuloCanal = TIPO_ENVIO_LABEL;
  readonly rotuloPara = ENVIAR_PARA_LABEL;
  readonly rotuloStatus = STATUS_COMUNICADO_LABEL;
  readonly rotuloEnvio = STATUS_ENVIO_LABEL;
  readonly tomComunicado = TOM_STATUS_COMUNICADO;
  readonly tomEnvio = TOM_ENVIO;
  readonly situacoes = Object.keys(STATUS_ENVIO_LABEL) as StatusEnvio[];

  d: ComunicadoDetalhe | null = null;
  filtro: StatusEnvio | '' = '';
  reenviando = false;
  error = '';
  private id = '';
  private timer: ReturnType<typeof setInterval> | null = null;
  private zone = inject(NgZone);

  constructor(private api: ComunicadosApiService, private route: ActivatedRoute) {}

  ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id') ?? '';
    void this.load();
    // Fora da zona: o relógio não dispara detecção de mudanças sozinho (e o whenStable dos testes termina).
    this.zone.runOutsideAngular(() => {
      this.timer = setInterval(() => this.zone.run(() => {
        if (this.d && this.d.comunicado.status !== 'CONCLUIDO') void this.load();
      }), 10_000);
    });
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  get progresso(): number {
    if (!this.d || !this.d.comunicado.total) return 0;
    return Math.round(((this.d.comunicado.enviados + this.d.comunicado.falhas) / this.d.comunicado.total) * 100);
  }

  get visiveis(): DestinatarioLinha[] {
    if (!this.d) return [];
    return this.filtro ? this.d.destinatarios.filter(x => x.status === this.filtro) : this.d.destinatarios;
  }

  tamanho(bytes: number): string {
    return tamanhoLegivel(bytes);
  }

  async load() {
    try {
      this.d = await this.api.detalhe(this.id);
      this.error = '';
    } catch (e: any) {
      this.error = e.message;
    }
  }

  async reenviar() {
    this.reenviando = true;
    try {
      await this.api.reenviarFalhas(this.id);
      await this.load();
    } catch (e: any) {
      this.error = e.message;
    } finally {
      this.reenviando = false;
    }
  }
}
