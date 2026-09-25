import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VoluntariosService } from '../../../voluntarios/services/voluntarios.service';
import { EscalasService } from '../../../escalas/services/escalas.service';
import { Escala, MESES, STATUS_LABEL, StatusEscala } from '../../../escalas/models/escala.model';

@Component({
    selector: 'app-dashboard',
    imports: [CommonModule, RouterLink],
    template: `
    <div class="space-y-6">
      <div><h1 class="text-2xl font-black text-slate-900">Início</h1><p class="text-sm text-slate-500">Visão rápida da organização dos coroinhas, acólitos e escalas.</p></div>
      @if (error) {
        <div class="rounded-xl bg-red-50 p-4 text-red-700">{{ error }}</div>
      }
      <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div class="card p-5"><div class="text-sm font-semibold text-slate-500">Cadastros ativos</div><div class="mt-2 text-3xl font-black text-slate-900">{{ activeCount }}</div><a routerLink="/pessoas" class="mt-3 inline-block text-sm font-bold text-brand-blue">Ver pessoas →</a></div>
        <div class="card p-5"><div class="text-sm font-semibold text-slate-500">Coroinhas</div><div class="mt-2 text-3xl font-black text-slate-900">{{ coroinhas }}</div><div class="mt-3 text-xs text-slate-400">ativos e “ambos”</div></div>
        <div class="card p-5"><div class="text-sm font-semibold text-slate-500">Acólitos</div><div class="mt-2 text-3xl font-black text-slate-900">{{ acolitos }}</div><div class="mt-3 text-xs text-slate-400">ativos e “ambos”</div></div>
        <div class="card p-5"><div class="text-sm font-semibold text-slate-500">Rascunhos de escala</div><div class="mt-2 text-3xl font-black text-amber-600">{{ drafts }}</div><a routerLink="/escalas" class="mt-3 inline-block text-sm font-bold text-brand-blue">Continuar escalas →</a></div>
      </div>
    
      <div class="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <section class="card p-6">
          <div class="mb-4 flex items-center justify-between"><div><h2 class="text-lg font-black">Escalas recentes</h2><p class="text-sm text-slate-500">Últimos meses cadastrados.</p></div><a routerLink="/escalas" class="text-sm font-bold text-brand-blue">Ver todas</a></div>
          <div class="divide-y divide-slate-100">
            @for (e of recent; track e) {
              <a [routerLink]="['/escalas',e.id]" class="flex items-center justify-between gap-4 py-4 hover:bg-slate-50"><div><strong>{{ e.titulo }}</strong><div class="text-sm text-slate-500">{{ months[e.mes-1] }} / {{ e.ano }} • {{ e.tipo==='SEMANAL'?'Semanal':'Mensal' }}</div></div><span class="badge" [ngClass]="statusClass(e.status)">{{ status(e.status) }}</span></a>
            }
            @if (!recent.length) {
              <div class="py-8 text-center text-sm text-slate-400">Nenhuma escala cadastrada ainda.</div>
            }
          </div>
        </section>
        <section class="card p-6">
          <h2 class="text-lg font-black">Ações rápidas</h2><div class="mt-4 grid gap-3"><a routerLink="/escalas/nova" class="btn-primary">＋ Criar nova escala</a><a routerLink="/pessoas/nova" class="btn-secondary">＋ Cadastrar pessoa</a><a routerLink="/relatorios" class="btn-secondary">Exportar PDF / PNG</a></div>
          <div class="mt-6 rounded-2xl bg-violet-50 p-4 text-sm text-slate-600"><strong class="text-brand-blue">Dica</strong><br>Você pode salvar a escala como “Não finalizada” e continuar em outro dia sem perder o trabalho.</div>
        </section>
      </div>
    </div>
    `
})
export class DashboardComponent implements OnInit {
  activeCount=0;coroinhas=0;acolitos=0;drafts=0;recent:Escala[]=[];months=MESES;error='';
  constructor(private volunteers:VoluntariosService,private scales:EscalasService){}
  async ngOnInit(){try{const [v,e]=await Promise.all([this.volunteers.active(),this.scales.list()]);this.activeCount=v.length;this.coroinhas=v.filter(x=>x.tipo==='COROINHA'||x.tipo==='AMBOS').length;this.acolitos=v.filter(x=>x.tipo==='ACOLITO'||x.tipo==='AMBOS').length;this.drafts=e.filter(x=>x.status==='RASCUNHO').length;this.recent=e.slice(0,6);}catch(err:any){this.error=err?.message||'Erro ao carregar o painel.';}}
  status(s:StatusEscala){return STATUS_LABEL[s];}
  statusClass(s:StatusEscala){return s==='FINALIZADA'?'bg-emerald-50 text-emerald-700':s==='CANCELADA'?'bg-red-50 text-red-700':'bg-amber-50 text-amber-700';}
}
