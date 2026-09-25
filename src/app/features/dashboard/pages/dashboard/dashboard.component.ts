import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
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
    imports: [CommonModule, RouterLink],
    template: `
    <div class="space-y-6">
      <div>
        <div class="inline-flex rounded-full bg-violet-50 px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-brand-blue">{{ liturgia }}</div>
        <h1 class="mt-3 text-2xl font-black text-slate-900">Paz e Bem</h1>
        <p class="text-sm text-slate-500">O que está pronto para as próximas celebrações e o que ainda tem vaga.</p>
      </div>

      @if (error) {
        <div class="rounded-xl bg-red-50 p-4 text-red-700">{{ error }}</div>
      }

      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div class="card p-5">
          <div class="text-xs font-extrabold uppercase tracking-wider text-slate-500">Servidores ativos</div>
          <div class="mt-2 text-3xl font-black">{{ activeCount }}</div>
          <div class="mt-2 text-xs text-slate-500">{{ coroinhas }} coroinhas · {{ acolitos }} acólitos · {{ mesc }} ministros</div>
          <div class="mt-1 text-xs text-amber-800">{{ mandatosAVencer }} mandatos a vencer em 90 dias</div>
          <a routerLink="/pessoas" class="mt-3 inline-block text-sm font-bold text-brand-blue">Ver pessoas →</a>
        </div>
        <div class="card p-5">
          <div class="text-xs font-extrabold uppercase tracking-wider text-slate-500">Próxima missa</div>
          @if (proxima) {
            <div class="mt-2 text-xl font-black text-brand-blue">{{ proxima.horario }}</div>
            <div class="mt-1 text-sm text-slate-500">{{ proxima.celebracao }} · {{ rotuloDia(proxima.data) }}</div>
            <span class="badge mt-3" [ngClass]="proxima.preenchidas === proxima.total && proxima.total ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'">
              {{ proxima.preenchidas }}/{{ proxima.total }} vagas
            </span>
          } @else {
            <div class="mt-2 text-sm text-slate-500">Nenhuma celebração à frente neste mês.</div>
          }
        </div>
        <div class="card p-5">
          <div class="text-xs font-extrabold uppercase tracking-wider text-slate-500">Presenças</div>
          @if (presencaPct === null) {
            <div class="mt-2 text-sm text-slate-500">Ainda não há presença marcada nas escalas deste mês.</div>
          } @else {
            <div class="mt-2 text-3xl font-black text-emerald-700">{{ presencaPct }}%</div>
            <div class="mt-2 text-xs text-slate-500">Quem foi marcado como presente, entre as presenças já lançadas.</div>
          }
        </div>
        <div class="card p-5">
          <div class="text-xs font-extrabold uppercase tracking-wider text-slate-500">Vagas abertas</div>
          <div class="mt-2 text-3xl font-black" [class.text-amber-600]="vagasAbertas > 0">{{ vagasAbertas }}</div>
          <a routerLink="/escalas" class="mt-3 inline-block text-sm font-bold text-brand-blue">Completar escalas →</a>
        </div>
      </div>

      <div class="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <section class="space-y-3">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-black">Próximas celebrações</h2>
            <a routerLink="/escalas" class="text-sm font-bold text-brand-blue">Ver todas</a>
          </div>
          @for (missa of proximas; track missa.escalaId + missa.data + missa.horario) {
            <article class="card p-5">
              <div class="flex items-start justify-between gap-3">
                <div>
                  <div class="text-xs font-bold uppercase tracking-wider text-slate-400">{{ rotuloDia(missa.data) }} · {{ missa.horario }}</div>
                  <h3 class="mt-1 text-lg font-black">{{ missa.celebracao }}</h3>
                  <div class="text-sm text-slate-500">{{ missa.titulo }}</div>
                </div>
                <span class="badge" [ngClass]="statusClass(missa.status)">{{ status(missa.status) }}</span>
              </div>
              <div class="mt-4 flex flex-wrap gap-2">
                @for (vaga of missa.vagas.slice(0, 6); track vaga.funcao + vaga.nome) {
                  <span class="rounded-full px-3 py-1 text-xs font-bold" [class.border]="vaga.livre" [class.border-dashed]="vaga.livre" [class.border-violet-300]="vaga.livre" [class.bg-violet-50]="vaga.livre" [class.text-violet-700]="vaga.livre" [class.bg-slate-100]="!vaga.livre">
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
            <div class="card p-8 text-center text-sm text-slate-400">Nenhuma celebração futura neste mês e no próximo.</div>
          }
        </section>

        <section class="card h-fit p-6">
          <h2 class="text-lg font-black">Ações rápidas</h2>
          <div class="mt-4 grid gap-3">
            <a routerLink="/escalas/nova" class="btn-primary">＋ Criar nova escala</a>
            <a routerLink="/pessoas/nova" class="btn-secondary">＋ Cadastrar pessoa</a>
            <a routerLink="/relatorios" class="btn-secondary">Exportar PDF / PNG</a>
          </div>
          <div class="mt-6 rounded-2xl bg-violet-50 p-4 text-sm text-slate-600">
            <strong class="text-brand-blue">Antes da missa</strong><br>
            Feche as vagas da próxima celebração e só então marque a escala como finalizada.
          </div>
        </section>
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
    return (escala.eventos || []).map(evento => this.vista(escala, evento));
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
    const vagas = escalas.flatMap(e => e.eventos || []).flatMap(ev => ev.vagas || []);
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
