import { AjudaLinkComponent } from '../../../../shared/components/ajuda-link/ajuda-link.component';
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HasPendingChanges } from '../../../../core/guards/pending-changes.guard';
import { CampoCompetenciaComponent } from '../../../../shared/components/datas/campo-competencia.component';
import { DialogoService } from '../../../../shared/services/dialogo.service';
import { Voluntario } from '../../../voluntarios/models/voluntario.model';
import { VoluntariosService } from '../../../voluntarios/services/voluntarios.service';
import { Indisponibilidade, MESES, PERIODO_LABEL, PeriodoDia, SITUACAO_LABEL, SituacaoResposta } from '../../models/escala.model';
import { EscalasService } from '../../services/escalas.service';

const FMT_DIA = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' });

interface Coluna { data: string; rotulo: string; }

/** Sábados e domingos do mês, com o rótulo "sáb 03". */
export function fimDeSemanaDoMes(ano: number, mes: number): Coluna[] {
  const dias = new Date(ano, mes, 0).getDate();
  const colunas: Coluna[] = [];
  for (let d = 1; d <= dias; d++) {
    const data = new Date(ano, mes - 1, d, 12);
    if (data.getDay() !== 0 && data.getDay() !== 6) continue;
    const iso = `${ano}-${String(mes).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    colunas.push({ data: iso, rotulo: `${FMT_DIA.format(data).replace('.', '')} ${String(d).padStart(2, '0')}` });
  }
  return colunas;
}

/**
 * Indisponibilidades do mês (PLANO-007): a equipe marca em quais sábados/domingos cada voluntário NÃO pode
 * (dia inteiro ou um período) e quem respondeu "sem restrição". Quem não respondeu fica pendente.
 */
@Component({
  selector: 'app-indisponibilidades',
  standalone: true,
  imports: [FormsModule, CampoCompetenciaComponent, AjudaLinkComponent],
  template: `
    <div class="space-y-5 pb-24">
      <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <h1 class="text-2xl font-black text-slate-900">Indisponibilidades — {{ meses[mes - 1] }} {{ ano }}</h1>
        <div class="flex flex-wrap items-end gap-2">
          <app-ajuda-link />
          <div><label class="label">Mês</label>
            <app-campo-competencia [ngModel]="competencia" (ngModelChange)="trocarMes($event)" [limpavel]="false" [disabled]="salvando" /></div>
          <div><label class="label" for="ind-busca">Buscar</label>
            <input id="ind-busca" class="field" placeholder="Nome" [(ngModel)]="busca"></div>
          <div><label class="label" for="ind-tipo">Tipo</label>
            <select id="ind-tipo" class="field" [(ngModel)]="tipo">
              <option value="">Todos</option><option value="COROINHA">Coroinhas</option><option value="ACOLITO">Acólitos</option>
            </select></div>
        </div>
      </div>
      @if (error) { <div class="rounded-xl bg-red-50 p-4 text-red-700">{{ error }}</div> }
      @if (aviso) { <div class="rounded-xl bg-emerald-50 p-4 text-emerald-800">{{ aviso }}</div> }
      <p class="text-sm text-slate-500">Clique na data em que a pessoa <b>não pode</b>. Quem avisou que pode em todas, marque "Sem restrição". Quem não respondeu fica pendente.</p>

      <div class="overflow-x-auto">
        <!-- Colunas de largura fixa e marcação do mesmo tamanho da célula vazia: marcar uma data não alarga a
             coluna nem empurra "Situação" para fora da tela (29/09/2026). -->
        <table class="tabela table-fixed" [style.min-width.rem]="14 + colunas.length * 4.5 + 8 + 8.5">
          <colgroup>
            <col class="w-56">
            @for (c of colunas; track c.data) { <col class="w-[4.5rem]"> }
            <col class="w-32"><col class="w-[8.5rem]">
          </colgroup>
          <thead><tr>
            <th class="sticky left-0 z-10">Nome</th>
            @for (c of colunas; track c.data) { <th class="!px-1 text-center">{{ c.rotulo }}</th> }
            <th class="!text-center">Sem restrição</th><th>Situação</th>
          </tr></thead>
          <tbody>
            @for (v of visiveis; track v.id) {
              <tr>
                <td class="sticky left-0 bg-[var(--card)] font-semibold">{{ v.nome_completo }}</td>
                @for (c of colunas; track c.data) {
                  <td class="!px-1 text-center">
                    @if (marca(v.id, c.data); as m) {
                      <div class="relative mx-auto flex h-10 w-16 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/40 px-1 text-xs font-bold leading-tight text-rose-700 dark:text-rose-300 ring-1 ring-rose-200 dark:ring-rose-800"
                           [attr.data-marcada]="v.id + '|' + c.data">
                        {{ m.rotulo }}
                        <!-- O seletor fica por cima, invisível: o clique no quadrinho abre as opções. -->
                        <select class="absolute inset-0 h-full w-full cursor-pointer opacity-0" [ngModel]="m.periodo ?? ''" (ngModelChange)="trocarPeriodo(v.id, c.data, $event)" aria-label="Período">
                          <option value="">Dia inteiro</option>
                          @for (p of periodos; track p) { <option [value]="p">{{ rotuloPeriodo[p] }}</option> }
                          <option value="TIRAR">Tirar</option>
                        </select>
                      </div>
                    } @else {
                      <!-- Clicar abre as opções; a data só é marcada quando uma delas é escolhida. -->
                      <div class="relative mx-auto h-10 w-16 rounded-lg border border-dashed border-[var(--field-line)] hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors">
                        <select class="absolute inset-0 h-full w-full cursor-pointer opacity-0" [attr.data-celula]="v.id + '|' + c.data"
                                [attr.aria-label]="'Não pode em ' + c.rotulo" (change)="escolher(v.id, c.data, $any($event.target).value)">
                          <option value="" disabled selected hidden></option>
                          <option value="DIA">Dia inteiro</option>
                          @for (p of periodos; track p) { <option [value]="p">{{ rotuloPeriodo[p] }}</option> }
                        </select>
                      </div>
                    }
                  </td>
                }
                <td class="text-center"><input type="checkbox" class="tabela-check" [checked]="semRestricao.has(v.id)" (change)="alternarSemRestricao(v.id, $event)" [attr.data-sem-restricao]="v.id"></td>
                <td><span [class]="'badge ' + tom[situacao(v.id)]" [attr.data-situacao]="v.id">{{ rotuloSituacao[situacao(v.id)] }}</span></td>
              </tr>
            } @empty {
              <tr><td [attr.colspan]="colunas.length + 3" class="p-8 text-center text-slate-500">{{ carregando ? 'Carregando...' : 'Nenhum voluntário.' }}</td></tr>
            }
          </tbody>
        </table>
      </div>

      <div class="sticky bottom-16 z-20 rounded-2xl border border-[var(--line)] bg-[var(--card)] px-4 py-3 shadow-lg backdrop-blur lg:bottom-4">
        <div class="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <p class="text-sm text-[var(--muted)]"><strong class="text-amber-600 dark:text-amber-400">{{ contagem.COM_RESTRICAO }}</strong> com restrição · <strong class="text-emerald-600 dark:text-emerald-400">{{ contagem.SEM_RESTRICAO }}</strong> sem restrição · <strong class="text-[var(--ink)]">{{ contagem.PENDENTE }}</strong> pendentes</p>
          <button type="button" class="btn-primary" [disabled]="salvando || carregando || !consultaPronta" (click)="salvar()" data-salvar>{{ salvando ? 'Salvando...' : 'Salvar' }}</button><button type="button" class="btn-secondary" [disabled]="salvando || carregando" (click)="recarregar()">Recarregar mês</button>
        </div>
      </div>
    </div>
  `
})
export class IndisponibilidadesComponent implements OnInit, OnDestroy, HasPendingChanges {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private escalas = inject(EscalasService);
  private voluntariosService = inject(VoluntariosService);
  private dialogo = inject(DialogoService);

  readonly meses = MESES;
  readonly periodos: PeriodoDia[] = ['MANHA', 'TARDE', 'NOITE'];
  readonly rotuloPeriodo = PERIODO_LABEL;
  readonly rotuloSituacao = SITUACAO_LABEL;
  readonly tom: Record<SituacaoResposta, string> = {
    COM_RESTRICAO: 'bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold',
    SEM_RESTRICAO: 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold',
    PENDENTE: 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-bold'
  };

  private geracao=0;private destruido=false;
  consultaPronta=false;
  versao = 0;
  ano = new Date().getFullYear();
  mes = new Date().getMonth() + 1;
  colunas: Coluna[] = [];
  voluntarios: Voluntario[] = [];
  /** voluntarioId → (data → período ou null = dia inteiro). */
  marcas = new Map<string, Map<string, PeriodoDia | null>>();
  private originais: Indisponibilidade[]=[];
  private datasEditadas = new Set<string>();
  semRestricao = new Set<string>();
  busca = '';
  tipo: '' | 'COROINHA' | 'ACOLITO' = '';
  carregando = false;
  salvando = false;
  alterado = false;
  error = '';
  aviso = '';

  get competencia(): string {
    return `${this.ano}-${String(this.mes).padStart(2, '0')}`;
  }

  get visiveis(): Voluntario[] {
    const termo = this.busca.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
    return this.voluntarios.filter(v =>
      (!this.tipo || v.tipo === this.tipo || v.tipo === 'AMBOS')
      && (!termo || (v.nome_completo || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().includes(termo)));
  }

  get contagem(): Record<SituacaoResposta, number> {
    const c = { COM_RESTRICAO: 0, SEM_RESTRICAO: 0, PENDENTE: 0 };
    for (const v of this.voluntarios) c[this.situacao(v.id)]++;
    return c;
  }

  async ngOnInit() {
    const q = this.route.snapshot.queryParamMap;
    const ano = Number(q.get('ano'));
    const mes = Number(q.get('mes'));
    if (ano >= 2020 && mes >= 1 && mes <= 12) { this.ano = ano; this.mes = mes; }
    try {
      this.voluntarios = (await this.voluntariosService.ativosLeves())
        .slice().sort((a, b) => (a.nome_completo || '').localeCompare(b.nome_completo || '', 'pt-BR'));
    } catch (e: any) {
      this.error = e?.message || 'Não foi possível carregar os voluntários.';
    }
    await this.carregar();
  }

  hasPendingChanges(): boolean {
    return this.alterado;
  }

  async trocarMes(valor: string | null) {
    if (!valor || valor === this.competencia || this.salvando || this.destruido) return;
    if (this.alterado && !await this.dialogo.confirmar({
      titulo: 'Trocar de mês?', mensagem: 'As marcações deste mês ainda não foram salvas.', confirmar: 'Trocar sem salvar', perigo: true
    })) return;
    if(this.destruido||this.salvando)return;
    [this.ano, this.mes] = valor.split('-').map(Number);
    void this.router.navigate([], { queryParams: { ano: this.ano, mes: this.mes }, replaceUrl: true });
    await this.carregar();
  }

  async carregar() {
    if(this.destruido||this.salvando)return;this.consultaPronta=false;const geracao=++this.geracao;const ano=this.ano;const mes=this.mes;
    this.colunas = fimDeSemanaDoMes(this.ano, this.mes);
    this.carregando = true;
    try {
      const dados = await this.escalas.indisponibilidades(ano, mes);
      if(this.destruido||geracao!==this.geracao)return;
      this.versao = dados.versao;this.originais=dados.itens;this.datasEditadas.clear();
      this.marcas = new Map();
      for (const i of dados.itens) this.definir(i.voluntarioId, i.data, i.periodo);
      this.semRestricao = new Set(dados.semRestricao);
      this.consultaPronta=true;
      this.alterado = false;
      this.error = '';
    } catch (e: any) {
      if(!this.destruido&&geracao===this.geracao)this.error = e?.message;
    } finally {
      if(!this.destruido&&geracao===this.geracao)this.carregando = false;
    }
  }

  marca(voluntarioId: string, data: string): { periodo: PeriodoDia | null;rotulo:string } | null {
    const m = this.marcas.get(voluntarioId);
    if(!m?.has(data))return null;const periodo=m.get(data)!;const originais=this.originais.filter(i=>i.voluntarioId===voluntarioId&&i.data===data);
    const rotulo=!this.datasEditadas.has(voluntarioId+'|'+data)&&originais.length>1?originais.map(i=>i.periodo?this.rotuloPeriodo[i.periodo]:'Dia inteiro').join(' + '):periodo?this.rotuloPeriodo[periodo]:'Dia inteiro';return {periodo,rotulo};
  }

  situacao(voluntarioId: string): SituacaoResposta {
    if (this.marcas.get(voluntarioId)?.size) return 'COM_RESTRICAO';
    return this.semRestricao.has(voluntarioId) ? 'SEM_RESTRICAO' : 'PENDENTE';
  }

  /** Marcar uma data tira o "sem restrição" da linha. */
  marcar(voluntarioId: string, data: string) {
    this.datasEditadas.add(voluntarioId+'|'+data);
    this.definir(voluntarioId, data, null);
    this.semRestricao.delete(voluntarioId);
    this.alterado = true;
  }

  /** Opção escolhida numa data vazia: "DIA" marca o dia inteiro, o resto é o período. */
  escolher(voluntarioId: string, data: string, valor: string) {
    if (!valor) return;
    this.marcar(voluntarioId, data);
    if (valor !== 'DIA') this.trocarPeriodo(voluntarioId, data, valor);
  }

  trocarPeriodo(voluntarioId: string, data: string, valor: string) {
    this.datasEditadas.add(voluntarioId+'|'+data);
    if (valor === 'TIRAR') {
      const m = this.marcas.get(voluntarioId);
      m?.delete(data);
      if (m && !m.size) this.marcas.delete(voluntarioId);
    } else {
      this.definir(voluntarioId, data, (valor || null) as PeriodoDia | null);
    }
    this.alterado = true;
  }

  /** "Sem restrição" limpa as datas da linha (pergunta se havia alguma). */
  async alternarSemRestricao(voluntarioId: string, evento: Event) {
    const caixa = evento.target as HTMLInputElement;
    if (!caixa.checked) {
      this.semRestricao.delete(voluntarioId);
      this.alterado = true;
      return;
    }
    const datas = this.marcas.get(voluntarioId)?.size ?? 0;
    if (datas && !await this.dialogo.confirmar({
      titulo: 'Sem restrição', mensagem: `Tirar as ${datas} data(s) marcadas desta pessoa?`, confirmar: 'Tirar as datas'
    })) {
      caixa.checked = false;
      return;
    }
    this.marcas.delete(voluntarioId);
    this.semRestricao.add(voluntarioId);
    this.alterado = true;
  }

  corpo(): { itens: Indisponibilidade[]; semRestricao: string[]; versao:number } {
    const itens: Indisponibilidade[] = [];
    for (const [voluntarioId, datas] of this.marcas) {
      for (const [data, periodo] of datas) {
        const originais=this.originais.filter(i=>i.voluntarioId===voluntarioId&&i.data===data);
        if(!this.datasEditadas.has(voluntarioId+'|'+data)&&originais.length)itens.push(...originais);
        else itens.push({voluntarioId,data,periodo,observacao:null});
      }
    }
    itens.sort((a, b) => a.data.localeCompare(b.data) || a.voluntarioId.localeCompare(b.voluntarioId));
    return { itens, semRestricao: [...this.semRestricao], versao:this.versao };
  }

  async recarregar(){if(this.destruido||this.salvando||this.carregando)return;if(this.alterado&&!await this.dialogo.confirmar({titulo:'Recarregar mês?',mensagem:'Descartar suas marcações não salvas e carregar as respostas atuais?',confirmar:'Recarregar',perigo:true}))return;await this.carregar();}

  async salvar() {
    if(this.salvando||this.carregando||!this.consultaPronta)return;
    this.salvando = true;
    this.aviso = '';
    try {
      const salvo = await this.escalas.salvarIndisponibilidades(this.ano, this.mes, this.corpo());
      this.versao = salvo.versao;this.originais=salvo.itens;this.datasEditadas.clear();
      this.alterado = false;
      this.aviso = 'Indisponibilidades salvas.';
      this.error = '';
    } catch (e: any) {
      this.error = e?.message;
    } finally {
      this.salvando = false;
    }
  }

  ngOnDestroy(){this.destruido=true;++this.geracao;}

  private definir(voluntarioId: string, data: string, periodo: PeriodoDia | null) {
    const m = this.marcas.get(voluntarioId) ?? new Map<string, PeriodoDia | null>();
    m.set(data, periodo);
    this.marcas.set(voluntarioId, m);
  }
}
