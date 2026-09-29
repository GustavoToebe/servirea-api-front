import {
  ApplicationRef, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, EmbeddedViewRef, EventEmitter, Input,
  NgZone, OnChanges, OnDestroy, Output, SimpleChanges, TemplateRef, ViewChild, inject
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TipoVoluntario, Voluntario } from '../../../features/voluntarios/models/voluntario.model';
import { DialogoService } from '../../services/dialogo.service';

/** Altura aproximada do painel aberto (filtros + até 14 nomes). */
const ALTURA_PAINEL = 330;

/** Marcas por voluntário na montagem da mensal (PLANO-007). */
export interface MarcadorVoluntario {
  indisponivel?: boolean;
  vezesNoMes?: number;
  irmaoNaMissa?: string;
}

export type Marcadores = Record<string, MarcadorVoluntario>;

const SEM_EXCLUIDOS: ReadonlySet<string> = new Set();

/**
 * Seletor de voluntário de uma vaga. Numa escala cheia há 100+ destes na tela (PLANO-008): fechado, ele não tem
 * nenhum listener global (clique fora, rolagem e redimensionar só existem com o painel aberto, fora da zona do
 * Angular), é OnPush e a lista filtrada fica num campo, recalculada só quando a busca, o filtro ou as entradas mudam.
 */
@Component({
  selector: 'app-volunteer-picker',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative">
      <button type="button"
        class="flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition"
        [class.picker-preenchido]="!!selectedId"
        [class.picker-vazio]="!selectedId"
        [class.border-violet-400]="open"
        [class.ring-2]="open"
        [class.ring-violet-100]="open"
        [class.bg-slate-100]="disabled"
        [disabled]="disabled"
        (click)="toggleOpen()">
        <span class="min-w-0 flex-1 truncate" [class.font-semibold]="!!selectedName" [class.text-slate-400]="!selectedName">{{ selectedName || 'Selecione o irmão' }}</span>
        @if (selectedId && !disabled) {
          <span class="text-slate-400 hover:text-red-500" (click)="clear($event)" title="Limpar">✕</span>
        }
        <span class="text-slate-400">▾</span>
      </button>

      <ng-template #painelTpl>
        <div class="fixed z-50 min-w-[240px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
          [style.left.px]="painel.left" [style.width.px]="painel.width"
          [style.top.px]="painel.top" [style.bottom.px]="painel.bottom">
          <div class="space-y-2 border-b border-slate-100 p-2">
            <div class="flex flex-wrap gap-1">
              @for (t of tipos; track t.value) {
                <button type="button"
                  class="rounded-full px-2.5 py-1 text-[11px] font-bold"
                  [class.bg-brand-blue]="tipoFiltro === t.value"
                  [class.text-white]="tipoFiltro === t.value"
                  [class.bg-slate-100]="tipoFiltro !== t.value"
                  [class.text-slate-600]="tipoFiltro !== t.value"
                  (mousedown)="$event.preventDefault()"
                (click)="setTipo(t.value)">{{ t.label }}</button>
              }
            </div>
            <input class="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-violet-500"
              [ngModel]="search" (ngModelChange)="buscar($event)" placeholder="Filtrar" autofocus>
          </div>
          <div class="max-h-56 overflow-auto py-1">
            @for (v of lista; track v.id) {
              <button type="button"
                class="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"
                [class.bg-violet-50]="v.id === selectedId"
                [disabled]="excluidos.has(v.id) && v.id !== selectedId"
                [attr.data-voluntario]="v.id"
                (mousedown)="$event.preventDefault()"
                (click)="choose(v)">
                <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded border"
                  [class.border-violet-600]="v.id === selectedId"
                  [class.bg-violet-600]="v.id === selectedId"
                  [class.border-slate-300]="v.id !== selectedId">
                  @if (v.id === selectedId) {
                    <span class="text-[10px] font-black text-white">✓</span>
                  }
                </span>
                <span class="min-w-0 truncate" [class.text-red-700]="marcadores?.[v.id]?.indisponivel">{{ nomeDe(v) }}</span>
                @if (excluidos.has(v.id) && v.id !== selectedId) {
                  <span class="ml-auto text-[10px] font-semibold text-amber-600">já usado</span>
                } @else if (marcadores?.[v.id]; as m) {
                  <span class="ml-auto flex shrink-0 items-center gap-1 text-[10px] font-semibold">
                    @if (m.indisponivel) { <span class="text-red-600">⛔ não pode neste dia</span> }
                    @if (m.irmaoNaMissa) { <span class="text-violet-700">👨‍👩‍👧 irmão de {{ m.irmaoNaMissa }}</span> }
                    @if (m.vezesNoMes) { <span class="text-slate-400">{{ m.vezesNoMes }}× no mês</span> }
                  </span>
                }
              </button>
            }
            @if (!lista.length) {
              <div class="px-3 py-4 text-center text-xs text-slate-400">Nenhum irmão encontrado.</div>
            }
          </div>
        </div>
      </ng-template>
    </div>
    `
})
export class VolunteerPickerComponent implements OnChanges, OnDestroy {
  @Input() volunteers: Voluntario[] = [];
  @Input() selectedId: string | null = null;
  @Input() excludeIds: ReadonlySet<string> | readonly string[] = [];
  @Input() disabled = false;
  /** Mensal (PLANO-007): ⛔ indisponível vai para o fim e pede confirmação; "N× no mês"; irmão já nesta missa. */
  @Input() marcadores: Marcadores | null = null;
  @Output() selectedIdChange = new EventEmitter<string | null>();

  search = '';
  open = false;
  painel: { left: number; width: number; top: number | null; bottom: number | null } = { left: 0, width: 0, top: 0, bottom: null };
  selectedName = '';
  tipoFiltro: TipoVoluntario | '' = '';
  tipos: { value: TipoVoluntario; label: string }[] = [
    { value: 'COROINHA', label: 'Coroinha' },
    { value: 'ACOLITO', label: 'Acólito' },
    { value: 'AMBOS', label: 'Acólito / Coroinha' }
  ];
  /** Lista mostrada no painel, recalculada só quando algo que a afeta muda. */
  lista: Voluntario[] = [];
  excluidos: ReadonlySet<string> = SEM_EXCLUIDOS;

  private nomesNormalizados = new Map<string, string>();
  private readonly zone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly dialogo = inject(DialogoService);
  private readonly appRef = inject(ApplicationRef);
  private viewPainel: EmbeddedViewRef<void> | null = null;

  @ViewChild('painelTpl') painelTpl?: TemplateRef<void>;
  private escutando = false;

  constructor(private host: ElementRef<HTMLElement>) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['volunteers']) {
      this.nomesNormalizados = new Map(this.volunteers.map(v => [v.id, this.normalize(this.nomeDe(v))]));
    }
    if (changes['excludeIds']) {
      const e = this.excludeIds;
      this.excluidos = e instanceof Set ? e : new Set(e as readonly string[]);
    }
    if (changes['selectedId'] || changes['volunteers']) this.syncName();
    if (changes['volunteers'] || changes['marcadores'] || changes['excludeIds']) this.atualizarLista();
  }

  /** Clique fora fecha. Público para o spec. */
  onDocumentClick(event: MouseEvent) {
    if (!this.open) return;
    if (!this.dentro(event.target)) this.fechar();
  }

  toggleOpen() {
    if (this.disabled) return;
    if (this.open) {
      this.fechar();
      return;
    }
    this.open = true;
    this.search = '';
    this.atualizarLista();
    this.posicionar();
    this.montarPainel();
    this.escutar();
    this.cdr.markForCheck();
  }

  /**
   * O painel é uma view anexada ao `body`, fora do cartão do dia: ali o
   * `overflow-hidden` cortava a lista e o `backdrop-filter` do `.card` fazia
   * o `fixed` abrir no canto da tela. A view não volta para o componente a
   * cada tecla, senão o campo de filtro perde o foco.
   */
  private montarPainel() {
    if (this.viewPainel || !this.painelTpl) return;
    const view = this.painelTpl.createEmbeddedView(undefined as void);
    this.viewPainel = view;
    this.appRef.attachView(view);
    view.detectChanges();
    this.painelNoBody = view.rootNodes[0] as HTMLElement;
    document.body.appendChild(this.painelNoBody);
  }

  private desmontarPainel() {
    const view = this.viewPainel;
    this.viewPainel = null;
    const raiz = this.painelNoBody;
    this.painelNoBody = null;
    if (!view) {
      raiz?.remove();
      return;
    }
    this.appRef.detachView(view);
    view.destroy();
    raiz?.remove();
  }

  private painelNoBody: HTMLElement | null = null;

  /** Posição calculada pelo botão; sem espaço embaixo, abre para cima. */
  posicionar() {
    const botao = this.host.nativeElement.querySelector('button')?.getBoundingClientRect();
    if (!botao) return;
    const alturaJanela = window.innerHeight;
    const abreParaCima = alturaJanela - botao.bottom < ALTURA_PAINEL && botao.top > alturaJanela - botao.bottom;
    this.painel = {
      left: botao.left,
      width: botao.width,
      top: abreParaCima ? null : botao.bottom + 4,
      bottom: abreParaCima ? alturaJanela - botao.top + 4 : null
    };
  }

  private readonly aoClicar = (evento: MouseEvent) => {
    if (this.open && !this.dentro(evento.target)) this.zone.run(() => this.fechar());
  };

  /** Captura: a página rola num container, não na janela; a lista interna do painel não conta. */
  private readonly aoRolar = (evento: Event) => {
    if (!this.open || this.dentro(evento.target)) return;
    this.zone.run(() => { this.posicionar(); this.cdr.markForCheck(); });
  };

  private readonly aoRedimensionar = () => {
    if (this.open) this.zone.run(() => { this.posicionar(); this.cdr.markForCheck(); });
  };

  private escutar() {
    if (this.escutando) return;
    this.escutando = true;
    this.zone.runOutsideAngular(() => {
      document.addEventListener('mousedown', this.aoClicar);
      document.addEventListener('scroll', this.aoRolar, true);
      window.addEventListener('resize', this.aoRedimensionar);
    });
  }

  private pararDeEscutar() {
    if (!this.escutando) return;
    this.escutando = false;
    document.removeEventListener('mousedown', this.aoClicar);
    document.removeEventListener('scroll', this.aoRolar, true);
    window.removeEventListener('resize', this.aoRedimensionar);
  }

  private fechar() {
    this.open = false;
    this.search = '';
    this.pararDeEscutar();
    this.desmontarPainel();
    this.cdr.markForCheck();
  }

  private dentro(alvo: EventTarget | null): boolean {
    return alvo instanceof Node
      && (this.host.nativeElement.contains(alvo) || !!this.painelNoBody?.contains(alvo));
  }

  ngOnDestroy() {
    this.pararDeEscutar();
    this.desmontarPainel();
  }

  buscar(texto: string) {
    this.search = texto;
    this.atualizarLista();
    this.viewPainel?.detectChanges();
  }

  setTipo(tipo: TipoVoluntario) {
    this.tipoFiltro = this.tipoFiltro === tipo ? '' : tipo;
    this.atualizarLista();
    this.viewPainel?.detectChanges();
  }

  clear(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.selectedIdChange.emit(null);
    this.selectedName = '';
    this.fechar();
  }

  async choose(v: Voluntario) {
    if (this.excluidos.has(v.id) && v.id !== this.selectedId) return;
    if (v.id === this.selectedId) {
      this.selectedIdChange.emit(null);
      this.selectedName = '';
      this.fechar();
      return;
    }
    if (this.marcadores?.[v.id]?.indisponivel) {
      this.fechar();
      const ok = await this.dialogo.confirmar({
        titulo: 'Indisponível',
        mensagem: `${this.nomeDe(v)} avisou que não pode neste dia. Escalar mesmo assim?`,
        confirmar: 'Escalar mesmo assim'
      });
      if (!ok) return;
    }
    this.selectedIdChange.emit(v.id);
    this.selectedName = this.nomeDe(v);
    this.fechar();
  }

  /** Só ativos, pelo tipo e pelo nome (sem acento); com marcadores, os indisponíveis vão para o fim. */
  filtered(): Voluntario[] {
    const q = this.normalize(this.search);
    const base = this.volunteers
      .filter(v => v.ativo)
      .filter(v => !this.tipoFiltro || v.tipo === this.tipoFiltro)
      .filter(v => !q || (this.nomesNormalizados.get(v.id) ?? this.normalize(this.nomeDe(v))).includes(q));
    const m = this.marcadores;
    if (!m) return base;
    return [...base.filter(v => !m[v.id]?.indisponivel), ...base.filter(v => m[v.id]?.indisponivel)];
  }

  nomeDe(v: Voluntario): string {
    return v.nome_completo || (v as Voluntario & { nomeCompleto?: string }).nomeCompleto || '';
  }

  private atualizarLista() {
    this.lista = this.filtered();
  }

  private syncName() {
    const encontrado = this.volunteers.find(v => v.id === this.selectedId);
    this.selectedName = encontrado ? this.nomeDe(encontrado) : '';
  }
  private normalize(v: string) { return (v || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
}
