import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Voluntario } from '../../voluntarios/models/voluntario.model';
import { ApoioEscala, EscalaEvento, SituacaoResposta } from '../models/escala.model';

export interface LinhaPainel {
  id: string;
  nome: string;
  situacao: SituacaoResposta | null;
  /** "não pode 19 e 20" / datas em que já está: "06/10, 18/10". */
  detalhe: string;
}

const ORDEM: Record<SituacaoResposta, number> = { COM_RESTRICAO: 0, SEM_RESTRICAO: 1, PENDENTE: 2 };
const ddmm = (iso: string) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}`;
const dia = (iso: string) => iso.slice(8, 10);

function juntar(itens: string[]): string {
  return itens.length <= 1 ? itens.join('') : `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}`;
}

/** Divide os voluntários entre ainda não escalados (com restrição primeiro) e já escalados (com as datas). */
export function montarPainel(volunteers: Voluntario[], apoio: ApoioEscala | null, eventos: EscalaEvento[],
                             tipo: '' | 'COROINHA' | 'ACOLITO', busca: string): { ainda: LinhaPainel[]; ja: LinhaPainel[] } {
  const datas = new Map<string, Set<string>>();
  for (const e of eventos) {
    if (e.referencia) continue;
    for (const v of e.vagas) {
      if (!v.voluntario_id) continue;
      const s = datas.get(v.voluntario_id) ?? new Set<string>();
      s.add(e.data);
      datas.set(v.voluntario_id, s);
    }
  }
  const porId = new Map((apoio?.voluntarios ?? []).map(a => [a.voluntarioId, a]));
  const termo = busca.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const ainda: LinhaPainel[] = [];
  const ja: LinhaPainel[] = [];
  for (const v of volunteers) {
    if (!v.ativo) continue;
    if (tipo && v.tipo !== tipo && v.tipo !== 'AMBOS') continue;
    const nome = v.nome_completo || '';
    if (termo && !nome.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().includes(termo)) continue;
    const a = porId.get(v.id);
    const escalado = datas.get(v.id);
    if (escalado?.size) {
      ja.push({ id: v.id, nome, situacao: a?.situacao ?? null, detalhe: [...escalado].sort().map(ddmm).join(', ') });
    } else {
      const naoPode = a?.indisponiveis.length ? `não pode ${juntar([...new Set(a.indisponiveis.map(i => dia(i.data)))].sort())}` : '';
      ainda.push({ id: v.id, nome, situacao: a?.situacao ?? null, detalhe: naoPode });
    }
  }
  const ordem = (x: LinhaPainel) => (x.situacao ? ORDEM[x.situacao] : 3);
  ainda.sort((x, y) => ordem(x) - ordem(y) || x.nome.localeCompare(y.nome, 'pt-BR'));
  ja.sort((x, y) => x.nome.localeCompare(y.nome, 'pt-BR'));
  return { ainda, ja };
}

/**
 * Painel "Ainda não escalados" da mensal (PLANO-007): primeiro quem tem restrição, depois quem respondeu sem
 * restrição e por último os pendentes; embaixo, quem já entrou e em quais datas. Atualiza a cada `revisao`.
 */
@Component({
  selector: 'app-ainda-nao-escalados',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="card space-y-3 p-4">
      <div class="flex flex-wrap items-center gap-2">
        <input class="field flex-1 !py-1.5 text-sm" placeholder="Buscar" [ngModel]="busca" (ngModelChange)="busca = $event; recalcular()">
        <select class="field !w-auto !py-1.5 text-sm" [ngModel]="tipo" (ngModelChange)="tipo = $event; recalcular()" aria-label="Tipo">
          <option value="">Todos</option><option value="COROINHA">Coroinhas</option><option value="ACOLITO">Acólitos</option>
        </select>
      </div>
      <h3 class="text-sm font-black uppercase tracking-wide text-slate-600">Ainda não escalados ({{ ainda.length }})</h3>
      <ul class="max-h-[50vh] space-y-1 overflow-y-auto text-sm" data-ainda>
        @for (l of ainda; track l.id) {
          <li class="flex items-baseline justify-between gap-2" [attr.data-pessoa]="l.id">
            <span class="truncate">{{ l.nome }}</span>
            @if (l.situacao === 'COM_RESTRICAO') { <span class="shrink-0 text-[11px] font-semibold text-amber-700">{{ l.detalhe }}</span> }
            @else if (l.situacao === 'PENDENTE' || !l.situacao) { <span class="shrink-0 rounded bg-slate-100 px-1.5 text-[10px] text-slate-500">não respondeu</span> }
          </li>
        } @empty {
          <li class="text-slate-500">Todos já estão na escala. 🎉</li>
        }
      </ul>
      <details>
        <summary class="cursor-pointer text-sm font-black uppercase tracking-wide text-slate-600">Já escalados ({{ ja.length }})</summary>
        <ul class="mt-2 max-h-[40vh] space-y-1 overflow-y-auto text-sm" data-ja>
          @for (l of ja; track l.id) {
            <li [attr.data-pessoa]="l.id">{{ l.nome }} <span class="text-slate-500">— {{ l.detalhe }}</span></li>
          }
        </ul>
      </details>
    </aside>
  `
})
export class AindaNaoEscaladosComponent implements OnChanges {
  @Input() apoio: ApoioEscala | null = null;
  @Input() volunteers: Voluntario[] = [];
  @Input() eventos: EscalaEvento[] = [];
  /** Muda a cada alteração da grade (os eventos são alterados no lugar). */
  @Input() revisao = 0;

  busca = '';
  tipo: '' | 'COROINHA' | 'ACOLITO' = '';
  ainda: LinhaPainel[] = [];
  ja: LinhaPainel[] = [];

  ngOnChanges(): void {
    this.recalcular();
  }

  recalcular() {
    ({ ainda: this.ainda, ja: this.ja } = montarPainel(this.volunteers, this.apoio, this.eventos, this.tipo, this.busca));
  }
}
