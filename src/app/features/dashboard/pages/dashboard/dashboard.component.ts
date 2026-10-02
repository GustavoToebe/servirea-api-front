import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SessaoAtual } from '../../../../core/layout/sessao-atual';
import { AniversariantesCardComponent } from '../../components/aniversariantes-card.component';
import { VoluntariosService } from '../../../voluntarios/services/voluntarios.service';
import { EscalasService } from '../../../escalas/services/escalas.service';
import { EscalaDetalhe, EscalaEvento, STATUS_LABEL, StatusEscala } from '../../../escalas/models/escala.model';
import { FUNCOES_LABEL, mandatoNoPrazo } from '../../../pessoas/models/pessoa.model';
import { Voluntario } from '../../../voluntarios/models/voluntario.model';
import { rotuloDia, tempoLiturgico } from '../../../escalas/data/calendario-liturgico';

interface MissaVista {
  escalaId: string;
  titulo: string;
  status: StatusEscala;
  data: string;
  horario: string;
  celebracao: string;
  preenchidas: number;
  total: number;
  vagas: { nome: string; funcao: string; livre: boolean }[];
}

@Component({
    selector: 'app-dashboard',
    imports: [CommonModule, RouterLink, AniversariantesCardComponent],
    template: `
    <div class="space-y-6">
      <div>
        <div class="inline-flex rounded-md bg-indigo-600 text-white px-2.5 py-1 text-xs font-black uppercase tracking-wider shadow-xs">{{ liturgia }}</div>
        <h1 class="mt-3 text-2xl font-black text-[var(--ink)]">Paz e Bem</h1>
        <p class="text-sm text-[var(--muted)]">O que está pronto para as próximas celebrações e o que ainda tem vaga.</p>
      </div>

      @if(veOnboarding()){<section class="card p-5"><h2 class="text-lg font-bold">Primeiros passos</h2><p class="text-sm text-[var(--muted)]">Configure a paróquia e registre o progresso da equipe.</p><a routerLink="/primeiros-passos" class="btn-secondary mt-3 inline-block">Abrir checklist e retomar</a></section>}

      @if (error) {
        <div class="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-4 text-rose-700 dark:text-rose-300">{{ error }}</div>
      }

      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div class="card p-5">
          <div class="text-xs font-extrabold uppercase tracking-wider text-[var(--muted)]">Servidores ativos</div>
          <div class="mt-2 text-3xl font-black text-[var(--ink)]">{{ activeCount }}</div>
          <div class="mt-2 text-xs text-[var(--muted)]">{{ quantidade(coroinhas, 'coroinha', 'coroinhas') }} · {{ quantidade(acolitos, 'acólito', 'acólitos') }} · {{ quantidade(mesc, 'ministro', 'ministros') }}</div>
          <div class="mt-1 text-xs text-amber-700 dark:text-amber-400 font-semibold">{{ quantidade(mandatosAVencer, 'mandato', 'mandatos') }} a vencer em 90 dias</div>
          <a routerLink="/pessoas" class="mt-3 inline-block text-sm font-bold hover:underline" [style.color]="'var(--brand)'">Ver pessoas →</a>
        </div>
        <div class="card p-5">
          <div class="text-xs font-extrabold uppercase tracking-wider text-[var(--muted)]">Próxima missa</div>
          @if (proxima) {
            <div class="mt-2 text-xl font-black" [style.color]="'var(--brand)'">{{ proxima.horario }}</div>
            <div class="mt-1 text-sm text-[var(--muted)]">{{ proxima.celebracao }} · {{ rotuloDia(proxima.data) }}</div>
            <span class="badge mt-3" [ngClass]="proxima.preenchidas === proxima.total && proxima.total ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold' : 'bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-300 font-bold'">
              {{ proxima.preenchidas }}/{{ proxima.total }} vagas
            </span>
          } @else {
            <div class="mt-2 text-sm text-[var(--muted)]">Nenhuma celebração à frente neste mês.</div>
          }
        </div>
        <div class="card p-5">
          <div class="text-xs font-extrabold uppercase tracking-wider text-[var(--muted)]">Presenças</div>
          @if (presencaPct === null) {
            <div class="mt-2 text-sm text-[var(--muted)]">Ainda não há presença marcada nas escalas deste mês.</div>
          } @else {
            <div class="mt-2 text-3xl font-black text-emerald-600 dark:text-emerald-400">{{ presencaPct }}%</div>
            <div class="mt-2 text-xs text-[var(--muted)]">Quem foi marcado como presente, entre as presenças já lançadas.</div>
          }
        </div>
        <div class="card p-5">
          <div class="text-xs font-extrabold uppercase tracking-wider text-[var(--muted)]">Vagas abertas</div>
          <div class="mt-2 text-3xl font-black" [class.text-amber-600]="vagasAbertas > 0" [class.text-emerald-600]="vagasAbertas === 0">{{ vagasAbertas }}</div>
          <a routerLink="/escalas" class="mt-3 inline-block text-sm font-bold hover:underline" [style.color]="'var(--brand)'">Completar escalas →</a>
        </div>
      </div>

      <div class="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <section class="space-y-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider bg-emerald-600 text-white shadow-xs">Celebrações</span>
              <h2 class="text-lg font-black text-[var(--ink)]">Próximas celebrações</h2>
            </div>
            <a routerLink="/escalas" class="text-sm font-bold hover:underline" [style.color]="'var(--brand)'">Ver todas</a>
          </div>
          @for (missa of proximas; track missa.escalaId + missa.data + missa.horario) {
            <article class="card p-5">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">{{ rotuloDia(missa.data) }} · {{ missa.horario }}</div>
                  <h3 class="mt-1 text-lg font-black text-[var(--ink)]">{{ missa.celebracao }}</h3>
                  <div class="text-sm text-[var(--muted)]">{{ missa.titulo }}</div>
                </div>
                <span class="badge" [ngClass]="statusClass(missa.status)">{{ status(missa.status) }}</span>
              </div>
              <div class="mt-4 flex flex-wrap gap-2">
                @for (vaga of missa.vagas.slice(0, 6); track vaga.funcao + vaga.nome) {
                  <span class="rounded-full px-3 py-1 text-xs font-bold"
                        [class.border]="vaga.livre"
                        [class.border-dashed]="vaga.livre"
                        [class.border-emerald-500/40]="vaga.livre"
                        [class.bg-emerald-500/10]="vaga.livre"
                        [class.text-emerald-700]="vaga.livre"
                        [class.dark:text-emerald-300]="vaga.livre"
                        [class.bg-[var(--app-bg)]]="!vaga.livre"
                        [class.border]="!vaga.livre"
                        [class.border-[var(--line)]]="!vaga.livre">
                    {{ vaga.livre ? 'Vaga · ' + vaga.funcao : vaga.nome + ' · ' + vaga.funcao }}
                  </span>
                }
              </div>
              <div class="mt-4">
                <a [routerLink]="['/escalas', missa.escalaId]" class="btn-primary !py-2">{{ missa.status === 'RASCUNHO' ? 'Completar escala' : 'Abrir escala' }}</a>
              </div>
            </article>
          }
          @if (!loading && !proximas.length) {
            <div class="card p-8 text-center text-sm text-[var(--muted)]">Nenhuma celebração futura neste mês e no próximo.</div>
          }
        </section>

        <div class="space-y-6">
        @if (veAniversariantes()) {
          <app-aniversariantes-card />
        }
        <section class="card h-fit p-6 space-y-4">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider text-white shadow-xs" [style.background]="'var(--brand)'">Ações</span>
            <h2 class="text-lg font-black text-[var(--ink)]">Ações rápidas</h2>
          </div>
          <div class="grid gap-3">
            <a routerLink="/escalas/nova" class="btn-primary cursor-pointer">＋ Criar nova escala</a>
            <a routerLink="/pessoas/nova" class="btn-secondary cursor-pointer">＋ Cadastrar pessoa</a>
            <a routerLink="/relatorios" class="btn-secondary cursor-pointer">Exportar PDF / PNG</a>
          </div>
          <div class="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-4 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
            <strong class="text-amber-950 dark:text-amber-100 font-black">💡 Dica litúrgica:</strong><br>
            Feche as vagas da próxima celebração e só então marque a escala como finalizada.
          </div>
        </section>
        </div>
      </div>
    </div>
    `
})
export class DashboardComponent implements OnInit {
  activeCount = 0;
  coroinhas = 0;
  acolitos = 0;
  mesc = 0;
  mandatosAVencer = 0;
  vagasAbertas = 0;
  presencaPct: number | null = null;
  liturgia = '';
  proxima: MissaVista | null = null;
  proximas: MissaVista[] = [];
  loading = true;
  error = '';
  rotuloDia = rotuloDia;
  private sessao = inject(SessaoAtual);
  /** A API exige PERM_PESSOA; sem ela o cartão nem aparece. */
  readonly veOnboarding = computed(() => this.sessao.permissoes().includes('ONBOARDING'));
  readonly veAniversariantes = computed(() => this.sessao.permissoes().includes('PESSOA'));

  constructor(private volunteers: VoluntariosService, private scales: EscalasService) {}

  async ngOnInit() {
    this.liturgia = tempoLiturgico(new Date()).rotulo;
    const hoje = inicioDoDia(new Date());
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth() + 1;
    const seguinte = mes === 12 ? { ano: ano + 1, mes: 1 } : { ano, mes: mes + 1 };
    try {
      const [voluntarios, esteMes, proximoMes] = await Promise.all([
        this.volunteers.active(),
        this.scales.list({ ano, mes }),
        this.scales.list({ ano: seguinte.ano, mes: seguinte.mes })
      ]);
      this.contarPessoas(voluntarios);
      const missas = [...esteMes, ...proximoMes]
        .filter(escala => escala.status !== 'CANCELADA')
        .flatMap(escala => this.missasDe(escala))
        .filter(missa => dataIso(missa.data) >= hoje)
        .sort((a, b) => `${a.data} ${a.horario}`.localeCompare(`${b.data} ${b.horario}`));
      this.proximas = missas.slice(0, 4);
      this.proxima = missas[0] || null;
      this.vagasAbertas = missas.reduce((soma, missa) => soma + (missa.total - missa.preenchidas), 0);
      this.presencaPct = this.taxaPresenca([...esteMes, ...proximoMes]);
    } catch (err: unknown) {
      this.error = err instanceof Error ? err.message : 'Erro ao carregar o painel.';
    } finally {
      this.loading = false;
    }
  }

  status(s: StatusEscala) { return STATUS_LABEL[s]; }
  quantidade(n: number, um: string, varios: string) {
    return `${n} ${n === 1 ? um : varios}`;
  }
  statusClass(s: StatusEscala) {
    return s === 'FINALIZADA' ? 'bg-emerald-50 text-emerald-700' : s === 'CANCELADA' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700';
  }

  private contarPessoas(voluntarios: Voluntario[]) {
    this.activeCount = voluntarios.length;
    this.coroinhas = voluntarios.filter(v => v.tipo === 'COROINHA' || v.tipo === 'AMBOS').length;
    this.acolitos = voluntarios.filter(v => v.tipo === 'ACOLITO' || v.tipo === 'AMBOS').length;
    this.mesc = voluntarios.filter(v => v.tipo === 'MESC').length;
    this.mandatosAVencer = voluntarios.filter(v => mandatoNoPrazo(v.mandato_fim)).length;
  }

  private missasDe(escala: EscalaDetalhe): MissaVista[] {
    return (escala.eventos || []).filter(evento => !evento.referencia).map(evento => this.vista(escala, evento));
  }

  private vista(escala: EscalaDetalhe, evento: EscalaEvento): MissaVista {
    const vagas = evento.vagas || [];
    return {
      escalaId: escala.id,
      titulo: escala.titulo,
      status: escala.status,
      data: evento.data,
      horario: (evento.horario || '').slice(0, 5),
      celebracao: evento.celebracao || 'Missa',
      preenchidas: vagas.filter(v => v.voluntario_id).length,
      total: vagas.length,
      vagas: vagas.map(v => ({
        nome: v.voluntario?.nome_completo || '',
        funcao: FUNCOES_LABEL[v.funcao] || v.funcao,
        livre: !v.voluntario_id
      }))
    };
  }

  private taxaPresenca(escalas: EscalaDetalhe[]): number | null {
    const vagas = escalas.flatMap(e => (e.eventos || []).filter(ev => !ev.referencia)).flatMap(ev => ev.vagas || []);
    const marcadas = vagas.filter(v => v.presenca === 'PRESENTE' || v.presenca === 'FALTOU');
    if (!marcadas.length) return null;
    return Math.round(100 * marcadas.filter(v => v.presenca === 'PRESENTE').length / marcadas.length);
  }
}

function inicioDoDia(data: Date): Date {
  return new Date(data.getFullYear(), data.getMonth(), data.getDate(), 12);
}

function dataIso(iso: string): Date {
  const [ano, mes, dia] = iso.slice(0, 10).split('-').map(Number);
  return new Date(ano, mes - 1, dia, 12);
}
