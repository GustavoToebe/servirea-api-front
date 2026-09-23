import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CompromissoVoluntario, FUNCOES_LABEL, TipoVoluntario, Voluntario } from '../../models/voluntario.model';
import { VoluntariosService } from '../../services/voluntarios.service';

@Component({
  selector: 'app-voluntario-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="mx-auto max-w-6xl space-y-6">
      <div *ngIf="loading" class="card p-10 text-center text-slate-500">Carregando...</div>
      <ng-container *ngIf="!loading && v">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div><a routerLink="/voluntarios" class="text-sm font-semibold text-brand-blue">← Voltar para cadastros</a><h1 class="mt-2 text-2xl font-black">Perfil</h1></div>
          <a [routerLink]="['/voluntarios', v.id, 'editar']" class="btn-primary">Editar cadastro</a>
        </div>

        <section class="card p-6">
          <div class="flex flex-col gap-6 md:flex-row md:items-start">
            <img *ngIf="v.foto_url" [src]="v.foto_url" class="h-40 w-40 rounded-3xl object-cover" alt="Foto">
            <div *ngIf="!v.foto_url" class="flex h-40 w-40 shrink-0 items-center justify-center rounded-3xl bg-violet-100 text-4xl font-black text-brand-blue">{{ initials(v.nome_completo) }}</div>
            <div class="flex-1">
              <div class="flex flex-wrap items-center gap-2"><h2 class="text-3xl font-black text-slate-900">{{ v.nome_completo }}</h2><span class="badge" [ngClass]="v.ativo ? 'bg-emerald-50 text-emerald-700':'bg-slate-100 text-slate-500'">{{ v.ativo ? 'Ativo':'Inativo' }}</span></div>
              <p class="mt-2 text-slate-500">{{ tipoLabel(v.tipo) }} • {{ age(v.data_nascimento) ?? 'idade não informada' }}{{ age(v.data_nascimento) != null ? ' anos' : '' }}</p>
              <div class="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                <div class="rounded-xl bg-slate-50 p-3"><div class="text-xs text-slate-400">Nascimento</div><strong>{{ date(v.data_nascimento) }}</strong></div>
                <div class="rounded-xl bg-slate-50 p-3"><div class="text-xs text-slate-400">Catequese</div><strong>{{ v.etapa_catequese || '—' }}</strong></div>
                <div class="rounded-xl bg-slate-50 p-3"><div class="text-xs text-slate-400">Estudo</div><strong>{{ study(v.horario_estudo) }}</strong></div>
                <div class="rounded-xl bg-slate-50 p-3"><div class="text-xs text-slate-400">WhatsApp</div><strong>{{ v.autoriza_whatsapp ? 'Autorizado' : 'Não registrado' }}</strong></div>
              </div>
            </div>
          </div>
        </section>

        <div class="grid gap-6 lg:grid-cols-2">
          <section class="card p-6"><h3 class="mb-4 text-lg font-black">Contato e endereço</h3><div class="space-y-3 text-sm"><p><span class="text-slate-400">Endereço:</span> {{ address() }}</p><p><span class="text-slate-400">Celular:</span> {{ v.celular || '—' }}</p><p><span class="text-slate-400">Telefone:</span> {{ v.telefone || '—' }}</p><p><span class="text-slate-400">E-mail:</span> {{ v.email || '—' }}</p></div></section>
          <section class="card p-6"><h3 class="mb-4 text-lg font-black">Funções habilitadas</h3><div class="flex flex-wrap gap-2"><span *ngFor="let f of v.funcoes_habilitadas" class="badge bg-violet-50 text-brand-blue">{{ funcao(f) }}</span><span *ngIf="!v.funcoes_habilitadas.length" class="text-sm text-slate-400">Nenhuma função configurada.</span></div></section>
        </div>

        <section class="card p-6">
          <h3 class="mb-4 text-lg font-black">Responsáveis</h3>
          <div class="grid gap-4 md:grid-cols-2">
            <div *ngFor="let r of v.responsaveis" class="rounded-2xl border border-slate-200 p-4"><div class="flex items-center gap-2"><span *ngIf="r.principal" class="text-amber-400">★</span><strong>{{ r.nome }}</strong><span class="text-xs text-slate-400">• {{ r.parentesco }}</span></div><div class="mt-2 text-sm text-slate-600">{{ r.celular || r.telefone || 'Sem telefone' }}<br>{{ r.email || 'Sem e-mail' }}</div></div>
            <div *ngIf="!v.responsaveis?.length" class="text-sm text-slate-400">Nenhum responsável cadastrado.</div>
          </div>
        </section>

        <section class="card p-6">
          <div class="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><h3 class="text-lg font-black">Compromissos nas escalas</h3><p class="text-sm text-slate-500">Lista puxada automaticamente das escalas em que esta pessoa foi alocada.</p></div>
            <div><label class="label">Filtrar mês</label><select class="field min-w-52" [(ngModel)]="monthFilter"><option value="">Todos os meses</option><option *ngFor="let m of monthOptions" [value]="m.key">{{ m.label }}</option></select></div>
          </div>
          <div *ngFor="let g of groupedCommitments()" class="mb-5 last:mb-0">
            <div class="mb-2 font-black text-brand-blue">{{ g.label }}</div>
            <div class="divide-y divide-slate-100 rounded-2xl border border-slate-200">
              <div *ngFor="let c of g.items" class="grid gap-1 p-4 text-sm sm:grid-cols-[120px_1fr_180px]"><strong>{{ dateShort(c.data) }} • {{ weekday(c.data) }}</strong><span>{{ c.celebracao }} às {{ c.horario.slice(0,5) }}</span><span class="font-semibold text-brand-blue">{{ funcao(c.funcao) }}</span></div>
            </div>
          </div>
          <div *ngIf="!groupedCommitments().length" class="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">Nenhum compromisso encontrado para o filtro selecionado.</div>
        </section>
      </ng-container>
      <div *ngIf="error" class="card p-6 text-red-600">{{ error }}</div>
    </div>
  `
})
export class VoluntarioDetailComponent implements OnInit {
  loading = true; error = ''; v: Voluntario | null = null; commitments: CompromissoVoluntario[] = []; monthFilter = '';
  constructor(private route: ActivatedRoute, private service: VoluntariosService) {}
  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    try { [this.v, this.commitments] = await Promise.all([this.service.getById(id), this.service.commitments(id)]); }
    catch (e: any) { this.error = e?.message || 'Erro ao carregar perfil.'; }
    finally { this.loading = false; }
  }
  get monthOptions() {
    const keys = [...new Set(this.commitments.map(c => c.data.slice(0,7)))].sort().reverse();
    return keys.map(key => ({ key, label: new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(new Date(`${key}-01T12:00:00`)) }));
  }
  groupedCommitments() {
    const rows = this.monthFilter ? this.commitments.filter(c => c.data.startsWith(this.monthFilter)) : this.commitments;
    const map = new Map<string, CompromissoVoluntario[]>();
    rows.forEach(c => { const key=c.data.slice(0,7); map.set(key,[...(map.get(key)||[]),c]); });
    return [...map.entries()].sort((a,b)=>b[0].localeCompare(a[0])).map(([key,items])=>({key,label:new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(new Date(`${key}-01T12:00:00`)),items}));
  }
  funcao(f: any) { return FUNCOES_LABEL[f as keyof typeof FUNCOES_LABEL] || f; }
  tipoLabel(t: TipoVoluntario) { return t==='COROINHA'?'Coroinha':t==='ACOLITO'?'Acólito':'Coroinha / Acólito'; }
  initials(n:string){return n.split(' ').filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();}
  date(v:string|null){return v?new Intl.DateTimeFormat('pt-BR').format(new Date(`${v}T12:00:00`)):'—';}
  dateShort(v:string){return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'2-digit'}).format(new Date(`${v}T12:00:00`));}
  weekday(v:string){return new Intl.DateTimeFormat('pt-BR',{weekday:'short'}).format(new Date(`${v}T12:00:00`)).replace('.','');}
  study(v:string|null){return v==='MANHA'?'Manhã':v==='TARDE'?'Tarde':v==='NOITE'?'Noite':'—';}
  address(){if(!this.v)return '—'; return [this.v.rua,this.v.numero,this.v.bairro].filter(Boolean).join(', ') || '—';}
  age(d:string|null){if(!d)return null;const x=new Date(`${d}T12:00:00`),n=new Date();let a=n.getFullYear()-x.getFullYear();if(n.getMonth()<x.getMonth()||(n.getMonth()===x.getMonth()&&n.getDate()<x.getDate()))a--;return a;}
}
