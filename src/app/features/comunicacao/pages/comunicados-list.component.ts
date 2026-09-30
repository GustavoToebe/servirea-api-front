import { DatePipe } from '@angular/common';
import { Component, NgZone, OnDestroy, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { BarraFiltrosComponent, FiltroAtivo } from '../../../shared/components/barra-filtros/barra-filtros.component';
import { Comunicado, STATUS_COMUNICADO_LABEL, StatusComunicado, TIPO_ENVIO_LABEL, TipoEnvio } from '../comunicacao.models';
import { ComunicadosApiService } from '../comunicados-api.service';
import { CabecalhoPaginaComponent } from '../../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { EstadoListaComponent } from '../../../shared/components/estado-lista/estado-lista.component';

export const TOM_STATUS_COMUNICADO: Record<StatusComunicado, string> = {
  NA_FILA: 'bg-slate-100 text-slate-700',
  ENVIANDO: 'bg-amber-50 text-amber-800',
  CONCLUIDO: 'bg-emerald-50 text-emerald-700'
};

/** Histórico dos comunicados (PLANO-005). Recarrega a cada 10 s enquanto algum está na fila ou enviando. */
@Component({
  selector: 'app-comunicados-list',
  standalone: true,
  imports: [FormsModule, DatePipe, BarraFiltrosComponent, CabecalhoPaginaComponent, EstadoListaComponent],
  template: `
    <div class="space-y-6">
      <app-cabecalho-pagina titulo="Comunicados" subtitulo="Histórico dos envios por e-mail e WhatsApp. Crie um novo em Pessoas → Opções." />
      @if (error) { <div class="rounded-xl bg-red-50 p-4 text-red-700">{{ error }}</div> }

      <app-barra-filtros [semBusca]="true" (buscar)="load()" [filtrosAtivos]="filtrosAtivos"
        (removerFiltro)="removerFiltro($event)" (removerTodos)="canal = ''; status = ''; load()">
        <div class="flex flex-col gap-1">
          <label class="label">Canal</label>
          <select class="field" [(ngModel)]="canal">
            <option value="">Todos</option><option value="EMAIL">E-mail</option><option value="WHATSAPP">WhatsApp</option>
          </select>
        </div>
        <div class="flex flex-col gap-1">
          <label class="label">Situação</label>
          <select class="field" [(ngModel)]="status">
            <option value="">Todas</option>
            @for (s of situacoes; track s) { <option [value]="s">{{ rotuloStatus[s] }}</option> }
          </select>
        </div>
      </app-barra-filtros>

      <div class="tabela-rolagem">
        <table class="tabela">
          <thead><tr>
            <th>Data/hora</th><th>Canal</th><th>Layout</th><th>Assunto</th><th class="text-right">Total</th>
            <th class="text-right">Enviados</th><th class="text-right">Falhas</th><th>Situação</th>
          </tr></thead>
          <tbody>
            @for (c of comunicados; track c.id) {
              <tr class="clicavel" tabindex="0" (click)="abrir(c.id)" (keydown.enter)="abrir(c.id)" [attr.data-comunicado]="c.id">
                <td class="whitespace-nowrap">{{ c.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
                <td>{{ c.canal === 'EMAIL' ? '✉' : '💬' }} {{ rotuloCanal[c.canal] }}</td>
                <td>{{ c.layoutNome }}</td>
                <td>{{ c.assunto || '—' }}</td>
                <td class="text-right">{{ c.total }}</td>
                <td class="text-right">{{ c.enviados }}</td>
                <td class="text-right" [class.text-red-600]="c.falhas > 0">{{ c.falhas }}</td>
                <td><span [class]="'badge ' + tom[c.status]">{{ rotuloStatus[c.status] }}</span></td>
              </tr>
            }
          </tbody>
        </table>
        <app-estado-lista [carregando]="carregando" [vazio]="!carregando && !comunicados.length" mensagemVazio="Nenhum comunicado enviado ainda." />
      </div>
    </div>
  `
})
export class ComunicadosListComponent implements OnInit, OnDestroy {
  readonly rotuloCanal = TIPO_ENVIO_LABEL;
  readonly rotuloStatus = STATUS_COMUNICADO_LABEL;
  readonly tom = TOM_STATUS_COMUNICADO;
  readonly situacoes = Object.keys(STATUS_COMUNICADO_LABEL) as StatusComunicado[];

  comunicados: Comunicado[] = [];
  canal: TipoEnvio | '' = '';
  status: StatusComunicado | '' = '';
  carregando = true;
  error = '';
  private timer: ReturnType<typeof setInterval> | null = null;
  private zone = inject(NgZone);

  constructor(private api: ComunicadosApiService, private router: Router) {}

  ngOnInit() {
    void this.load();
    // Fora da zona: o relógio não dispara detecção de mudanças sozinho (e o whenStable dos testes termina).
    this.zone.runOutsideAngular(() => {
      this.timer = setInterval(() => this.zone.run(() => {
        if (this.comunicados.some(c => c.status !== 'CONCLUIDO')) void this.load(true);
      }), 10_000);
    });
  }

  ngOnDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  get filtrosAtivos(): FiltroAtivo[] {
    const f: FiltroAtivo[] = [];
    if (this.canal) f.push({ chave: 'canal', rotulo: 'Canal: ' + TIPO_ENVIO_LABEL[this.canal] });
    if (this.status) f.push({ chave: 'status', rotulo: 'Situação: ' + STATUS_COMUNICADO_LABEL[this.status] });
    return f;
  }

  async load(silencioso = false) {
    if (!silencioso) this.carregando = true;
    try {
      this.comunicados = await this.api.listar(this.canal, this.status);
      this.error = '';
    } catch (e: any) {
      this.error = e.message;
    } finally {
      this.carregando = false;
    }
  }

  removerFiltro(chave: string) {
    if (chave === 'canal') this.canal = '';
    if (chave === 'status') this.status = '';
    void this.load();
  }

  abrir(id: string) {
    void this.router.navigate(['/comunicados', id]);
  }
}
