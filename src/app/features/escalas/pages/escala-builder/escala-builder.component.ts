import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HasPendingChanges } from '../../../../core/guards/pending-changes.guard';
import { VolunteerPickerComponent } from '../../../../shared/components/volunteer-picker/volunteer-picker.component';
import { FUNCOES_LABEL, FuncaoEscala, Voluntario } from '../../../voluntarios/models/voluntario.model';
import { VoluntariosService } from '../../../voluntarios/services/voluntarios.service';
import { EscalaDetalhe, EscalaEvento, MESES, STATUS_LABEL, StatusEscala, TipoEscala } from '../../models/escala.model';
import { TITULOS_CELEBRACAO } from '../../data/calendario-liturgico';
import { EscalasService } from '../../services/escalas.service';
import { ExportService } from '../../services/export.service';

@Component({
  selector: 'app-escala-builder',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, VolunteerPickerComponent],
  template: `
    <div class="space-y-6">
      <div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div><a routerLink="/escalas" class="text-sm font-semibold text-brand-blue">← Voltar para escalas</a><h1 class="mt-2 text-2xl font-black">{{ id ? 'Montagem da escala' : 'Nova escala' }}</h1><p class="text-sm text-slate-500">A grade segue o modelo escolhido. Festas em dia de semana entram na semanal; festas no fim de semana entram na mensal.</p></div>
        <div class="flex flex-wrap gap-2" *ngIf="id"><span class="badge" [ngClass]="statusClass(status)">{{ statusLabel(status) }}</span><button *ngIf="status==='FINALIZADA'" class="btn-secondary !py-2" (click)="exportPdf()">Exportar PDF</button><button *ngIf="status==='FINALIZADA'" class="btn-secondary !py-2" (click)="exportPng()">Exportar PNG</button></div>
      </div>

      <div *ngIf="loading" class="card p-10 text-center text-slate-500">Carregando escala...</div>
      <ng-container *ngIf="!loading">
        <section class="card p-5">
          <form [formGroup]="form" class="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <div class="xl:col-span-2"><label class="label">Título *</label><input class="field" formControlName="titulo" [disabled]="readOnly"></div>
            <div><label class="label">Modelo *</label><select class="field" formControlName="tipo" [attr.disabled]="readOnly ? true : null" (change)="metaChanged()"><option value="SEMANAL">Semanal (dias úteis)</option><option value="MENSAL">Mensal (sábados e domingos)</option></select></div>
            <div><label class="label">Ano *</label><input class="field" type="number" min="2020" max="2100" formControlName="ano" [readonly]="readOnly" (change)="metaChanged()"></div>
            <div><label class="label">Mês *</label><select class="field" formControlName="mes" [attr.disabled]="readOnly ? true : null" (change)="metaChanged()"><option *ngFor="let m of months; let i=index" [ngValue]="i+1">{{ m }}</option></select></div>
            <div class="md:col-span-2 xl:col-span-5"><label class="label">Observação</label><textarea class="field min-h-20" formControlName="observacao" [readonly]="readOnly"></textarea></div>
          </form>
        </section>

        <div class="rounded-2xl border border-violet-100 bg-violet-50 p-4 text-sm text-slate-700">
          <strong>Como funciona:</strong> a escala mensal fica só com sábados e domingos; a semanal, com os dias úteis. Se a festa da Igreja cair no fim de semana, o nome aparece na mensal; se cair em dia de semana, aparece na semanal. Você ainda pode adicionar ou excluir um dia na mão.
        </div>

        <section *ngIf="!readOnly" class="card p-5">
          <h2 class="mb-3 text-sm font-black uppercase tracking-wide text-slate-600">Adicionar um dia</h2>
          <div class="grid gap-3 md:grid-cols-[1fr_140px_1fr_auto] md:items-end">
            <div>
              <label class="label">Data</label>
              <div class="relative">
                <input class="field date-input-br" type="date" lang="pt-BR" [value]="addDate" (change)="setAddDate($event)">
                <span class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-800">{{ dateBr(addDate) }}</span>
              </div>
            </div>
            <div><label class="label">Horário</label><input class="field" type="time" [value]="addTime" (change)="setAddTime($event)"></div>
            <div>
              <label class="label">Celebração</label>
              <input class="field" list="celebracoes-sugeridas" [value]="addCelebration" (input)="setAddCelebration($event)" placeholder="Ex.: Missa, Páscoa">
              <datalist id="celebracoes-sugeridas"><option *ngFor="let t of celebrationOptions" [value]="t"></option></datalist>
            </div>
            <button class="btn-primary" type="button" (click)="addDay()">＋ Adicionar dia</button>
          </div>
        </section>

        <!-- Layout semanal: grade horizontal parecida com a planilha enviada -->
        <section *ngIf="form.controls.tipo.value === 'SEMANAL'" class="card overflow-visible">
          <div class="overflow-x-auto">
            <table class="w-full min-w-[1450px] text-left text-sm">
              <thead>
                <tr class="bg-red-700 text-white">
                  <th class="px-3 py-3" colspan="2">ESCALA SEMANAL</th>
                  <th class="px-3 py-3 text-center" colspan="7">{{ months[form.controls.mes.value-1] | uppercase }} {{ form.controls.ano.value }}</th>
                </tr>
                <tr class="bg-red-600 text-white">
                  <th class="w-28 px-3 py-3">Data</th>
                  <th class="w-48 px-3 py-3">Dia / horário</th>
                  <th *ngFor="let col of weeklyColumns" class="min-w-44 px-3 py-3 text-center">{{ col.label }}</th>
                  <th *ngIf="!readOnly" class="w-16 px-3 py-3"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-200">
                <tr *ngFor="let event of events" class="align-top hover:bg-slate-50">
                  <td class="px-3 py-3">
                    <div class="font-black">{{ dateShort(event.data) }}</div>
                    <div *ngIf="event.celebracao && event.celebracao !== 'Missa'" class="mt-1 text-[11px] font-bold text-red-700">{{ event.celebracao }}</div>
                  </td>
                  <td class="px-3 py-3">
                    <div class="font-bold capitalize text-brand-blue">{{ weekday(event.data) }}</div>
                    <input class="mt-1 w-24 rounded-lg border border-slate-300 px-2 py-1.5 text-xs" type="time" [value]="event.horario.slice(0,5)" [disabled]="readOnly" (change)="changeTime(event, $event)">
                    <input *ngIf="!readOnly" class="mt-1 w-full rounded-lg border border-slate-300 px-2 py-1.5 text-xs" [value]="event.celebracao" (change)="changeCelebration(event, $event)" placeholder="Celebração">
                  </td>
                  <td *ngFor="let col of weeklyColumns" class="px-2 py-2">
                    <ng-container *ngIf="slotFor(event, col.funcao, col.posicao) as slot">
                      <app-volunteer-picker [volunteers]="volunteers" [selectedId]="slot.voluntario_id" [excludeIds]="usedIds(event, slot.voluntario_id)" [disabled]="readOnly" (selectedIdChange)="selectVolunteer(event, slot, $event)" />
                    </ng-container>
                  </td>
                  <td *ngIf="!readOnly" class="px-2 py-2 align-top">
                    <button type="button" class="text-xs font-bold text-red-600 hover:underline" (click)="removeDay(event)">Excluir</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- Layout mensal/fim de semana: blocos separados por missa -->
        <section *ngIf="form.controls.tipo.value === 'MENSAL'" class="space-y-5">
          <div *ngFor="let event of events; let eventIndex=index" class="card overflow-visible">
            <div class="flex flex-col gap-3 border-b border-red-200 bg-red-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div class="text-xs font-bold uppercase tracking-wider text-red-700">{{ weekday(event.data) }}</div>
                <div class="text-lg font-black">{{ date(event.data) }} • {{ event.horario.slice(0,5) }}</div>
                <div *ngIf="event.celebracao && event.celebracao !== 'Missa'" class="mt-1 text-sm font-bold text-red-800">{{ event.celebracao }}</div>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <input class="field !w-32 !py-2" type="time" [value]="event.horario.slice(0,5)" [disabled]="readOnly" (change)="changeTime(event, $event)">
                <input class="field !w-52 !py-2" list="celebracoes-sugeridas" [value]="event.celebracao" [disabled]="readOnly" (change)="changeCelebration(event, $event)">
                <button *ngIf="!readOnly" type="button" class="btn-secondary !border-red-200 !py-2 !text-red-600" (click)="removeDay(event)">Excluir dia</button>
              </div>
            </div>

            <div class="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
              <div *ngFor="let slot of event.vagas" class="rounded-xl border border-slate-200 p-3">
                <div class="mb-2 flex items-center justify-between"><label class="text-xs font-black uppercase tracking-wide" [class.text-brand-blue]="slot.funcao==='MISSAL'" [class.text-slate-600]="slot.funcao!=='MISSAL'">{{ funcaoLabel(slot.funcao) }}{{ multiLabel(event, slot) }}</label></div>
                <app-volunteer-picker [volunteers]="volunteers" [selectedId]="slot.voluntario_id" [excludeIds]="usedIds(event, slot.voluntario_id)" [disabled]="readOnly" (selectedIdChange)="selectVolunteer(event, slot, $event)" />
              </div>
            </div>
          </div>
        </section>

        <div *ngIf="!events.length" class="card p-8 text-center text-slate-500">Nenhum evento foi gerado. Confira ano, mês e modelo.</div>
        <div *ngIf="error" class="rounded-xl bg-red-50 p-4 text-red-700">{{ error }}</div>

        <div class="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur">
          <div class="text-sm text-slate-500"><strong>{{ filledCount() }}</strong> de <strong>{{ totalSlots() }}</strong> vagas preenchidas</div>
          <div class="flex flex-wrap justify-end gap-2">
            <button *ngIf="status==='RASCUNHO'" class="btn-secondary" type="button" (click)="regenerate()">Recriar grade</button>
            <button *ngIf="status==='RASCUNHO'" class="btn-primary" type="button" [disabled]="saving || form.invalid" (click)="saveDraft()">{{ saving ? 'Salvando...' : 'Salvar rascunho' }}</button>
            <button *ngIf="status==='RASCUNHO'" class="btn-primary !bg-emerald-600 hover:!bg-emerald-700" type="button" [disabled]="saving || form.invalid" (click)="finalize()">Finalizar escala</button>
            <button *ngIf="id && status!=='CANCELADA'" class="btn-secondary !border-red-200 !text-red-600" type="button" (click)="cancelScale()">Cancelar escala</button>
            <button *ngIf="id && status==='FINALIZADA'" class="btn-secondary" type="button" (click)="reopen()">Reabrir como rascunho</button>
            <button *ngIf="id && status==='CANCELADA'" class="btn-secondary" type="button" (click)="reopen()">Restaurar como rascunho</button>
            <button *ngIf="id && status==='CANCELADA'" class="btn-danger" type="button" (click)="remove()">Excluir definitivamente</button>
          </div>
        </div>
      </ng-container>
    </div>
  `
})
export class EscalaBuilderComponent implements OnInit, HasPendingChanges {
  id: string | null = null;
  months = MESES;
  events: EscalaEvento[] = [];
  volunteers: Voluntario[] = [];
  status: StatusEscala = 'RASCUNHO';
  loading = true; saving = false; error = ''; saved = false; eventsDirty = false;
  addDate = '';
  addTime = '19:00';
  addCelebration = 'Missa';
  celebrationOptions = TITULOS_CELEBRACAO;
  currentDetail: EscalaDetalhe | null = null;
  weeklyColumns: { funcao: FuncaoEscala; posicao: number; label: string }[] = [
    { funcao: 'MISSAL', posicao: 1, label: 'Acólito Missal' },
    { funcao: 'CRUZ', posicao: 1, label: 'Cruz' },
    { funcao: 'CREDENCIA', posicao: 1, label: 'Credência' },
    { funcao: 'VELA', posicao: 1, label: 'Vela 1' },
    { funcao: 'VELA', posicao: 2, label: 'Vela 2' },
    { funcao: 'SINO', posicao: 1, label: 'Sino 1' },
    { funcao: 'SINO', posicao: 2, label: 'Sino 2' }
  ];

  form = this.fb.nonNullable.group({
    titulo: ['', Validators.required],
    tipo: ['MENSAL' as TipoEscala, Validators.required],
    ano: [new Date().getFullYear(), [Validators.required, Validators.min(2020)]],
    mes: [new Date().getMonth()+1, [Validators.required, Validators.min(1), Validators.max(12)]],
    observacao: ['']
  });

  get readOnly() { return this.status !== 'RASCUNHO'; }

  constructor(private fb: FormBuilder, private route: ActivatedRoute, private router: Router, private service: EscalasService, private volunteersService: VoluntariosService, private exporter: ExportService) {}

  async ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');
    try {
      this.volunteers = await this.volunteersService.active();
      if (this.id) {
        const d = await this.service.getById(this.id); this.currentDetail = d; this.status = d.status;
        this.form.setValue({ titulo:d.titulo, tipo:d.tipo, ano:d.ano, mes:d.mes, observacao:d.observacao||'' });
        this.events = d.eventos.map(e => ({...e, vagas:e.vagas.map(v=>({...v}))}));
        if (this.status !== 'RASCUNHO') this.form.disable({ emitEvent: false });
      } else {
        const type = this.form.controls.tipo.value; const year=this.form.controls.ano.value; const month=this.form.controls.mes.value;
        this.form.controls.titulo.setValue(`Escala ${type==='SEMANAL'?'Semanal':'Mensal'} - ${MESES[month-1]} ${year}`);
        this.events = this.service.buildDefaultEvents(type, year, month);
      }
      this.form.markAsPristine(); this.eventsDirty=false;
      this.syncAddDate();
    } catch(e:any){this.error=e?.message||'Erro ao carregar a tela de escala.';}
    finally{this.loading=false;}
  }

  metaChanged() {
    if (this.readOnly) return;
    this.form.markAsDirty();
    const {tipo,ano,mes}=this.form.getRawValue();
    if (!this.id && !this.eventsDirty) {
      this.events=this.service.buildDefaultEvents(tipo,ano,mes);
      this.form.controls.titulo.setValue(`Escala ${tipo==='SEMANAL'?'Semanal':'Mensal'} - ${MESES[mes-1]} ${ano}`);
    }
    this.syncAddDate();
  }

  regenerate() {
    if (this.readOnly) return;
    const filled=this.filledCount();
    if (filled && !confirm(`A grade possui ${filled} vaga(s) preenchida(s). Recriar a grade apagará essas seleções. Deseja continuar?`)) return;
    const {tipo,ano,mes}=this.form.getRawValue(); this.events=this.service.buildDefaultEvents(tipo,ano,mes); this.eventsDirty=true;
  }

  selectVolunteer(event: EscalaEvento, slot: any, id: string | null) {
    if (id && this.usedIds(event, slot.voluntario_id).includes(id)) { alert('Esta pessoa já está alocada em outra função nesta mesma missa.'); return; }
    slot.voluntario_id=id; slot.voluntario=id?this.volunteers.find(v=>v.id===id)||null:null; this.eventsDirty=true;
  }
  usedIds(event: EscalaEvento, current: string | null) { return event.vagas.map(v=>v.voluntario_id).filter((x):x is string=>!!x && x!==current); }
  changeTime(e: EscalaEvento, ev: Event){e.horario=(ev.target as HTMLInputElement).value;this.eventsDirty=true;}
  changeCelebration(e: EscalaEvento, ev: Event){e.celebracao=(ev.target as HTMLInputElement).value;this.eventsDirty=true;}
  setAddDate(ev: Event){this.addDate=(ev.target as HTMLInputElement).value;}
  setAddTime(ev: Event){this.addTime=(ev.target as HTMLInputElement).value;}
  setAddCelebration(ev: Event){this.addCelebration=(ev.target as HTMLInputElement).value;}

  addDay() {
    if (this.readOnly) return;
    if (!this.addDate || !this.addTime) { alert('Informe a data e o horário.'); return; }
    const time = this.addTime.slice(0, 5);
    if (this.events.some(e => e.data === this.addDate && e.horario.slice(0, 5) === time)) {
      alert('Já existe uma celebração neste dia e horário.');
      return;
    }
    const { tipo } = this.form.getRawValue();
    this.events = [...this.events, this.service.createEvent(tipo, this.addDate, time, this.addCelebration || 'Missa')]
      .sort((a, b) => `${a.data} ${a.horario}`.localeCompare(`${b.data} ${b.horario}`));
    this.eventsDirty = true;
  }

  removeDay(event: EscalaEvento) {
    if (this.readOnly) return;
    if (!confirm(`Excluir ${this.date(event.data)} às ${event.horario.slice(0, 5)} (${event.celebracao}) desta escala?`)) return;
    this.events = this.events.filter(e => e !== event);
    this.eventsDirty = true;
  }

  private syncAddDate() {
    const { ano, mes } = this.form.getRawValue();
    this.addDate = `${ano}-${String(mes).padStart(2, '0')}-01`;
  }

  async saveDraft() { await this.persist('RASCUNHO', false); }
  async finalize() {
    const missing=this.totalSlots()-this.filledCount();
    if (missing>0 && !confirm(`Ainda existem ${missing} vaga(s) sem nome. Deseja finalizar mesmo assim?`)) return;
    if (!confirm('Tem certeza que deseja finalizar esta escala? Ela ficará bloqueada para edição até ser reaberta.')) return;
    await this.persist('FINALIZADA', true);
  }

  private async persist(status: StatusEscala, navigate: boolean) {
    if(this.form.invalid)return;this.saving=true;this.error='';
    try{
      const m=this.form.getRawValue();
      const result=await this.service.save({id:this.id||undefined,titulo:m.titulo,tipo:m.tipo,ano:m.ano,mes:m.mes,status,observacao:m.observacao||null,eventos:this.events});
      this.id=result.id;this.currentDetail=result;this.status=result.status;this.events=result.eventos;this.saved=true;this.form.markAsPristine();this.eventsDirty=false;
      if(navigate) await this.router.navigate(['/escalas',result.id]);
      else if(this.route.snapshot.paramMap.get('id')===null) await this.router.navigate(['/escalas',result.id]);
    }catch(e:any){this.error=e?.message||'Não foi possível salvar a escala.';}finally{this.saving=false;}
  }

  async cancelScale(){if(!this.id)return;if(!confirm(`Tem certeza que deseja cancelar a escala ${MESES[this.form.controls.mes.value-1]} / ${this.form.controls.ano.value}?`))return;try{await this.service.setStatus(this.id,'CANCELADA');this.status='CANCELADA';this.form.disable({emitEvent:false});this.saved=true;}catch(e:any){this.error=e?.message||'Erro ao cancelar escala.';}}
  async reopen(){if(!this.id)return;if(!confirm('Deseja reabrir esta escala como não finalizada? Ela voltará a aceitar alterações.'))return;try{await this.service.setStatus(this.id,'RASCUNHO');this.status='RASCUNHO';this.form.enable({emitEvent:false});this.saved=true;}catch(e:any){this.error=e?.message||'Erro ao reabrir escala.';}}
  async remove(){if(!this.id)return;if(!confirm(`Tem certeza que deseja excluir definitivamente a escala de ${MESES[this.form.controls.mes.value-1]} / ${this.form.controls.ano.value}? Esta ação não pode ser desfeita.`))return;try{await this.service.deleteCancelled(this.id);this.saved=true;await this.router.navigate(['/escalas']);}catch(e:any){this.error=e?.message||'Erro ao excluir escala.';}}
  async exportPdf(){if(!this.id)return;try{await this.exporter.exportPdf(await this.service.getById(this.id));}catch(e:any){this.error=e?.message||'Erro ao exportar PDF.';}}
  async exportPng(){if(!this.id)return;try{await this.exporter.exportPng(await this.service.getById(this.id));}catch(e:any){this.error=e?.message||'Erro ao exportar PNG.';}}

  totalSlots(){return this.events.reduce((n,e)=>n+e.vagas.length,0);}
  filledCount(){return this.events.reduce((n,e)=>n+e.vagas.filter(v=>!!v.voluntario_id).length,0);}
  funcaoLabel(f:FuncaoEscala){return FUNCOES_LABEL[f];}
  multiLabel(e:EscalaEvento,slot:any){const count=e.vagas.filter(v=>v.funcao===slot.funcao).length;return count>1?` ${slot.posicao}`:'';}
  slotFor(e: EscalaEvento, funcao: FuncaoEscala, posicao: number) { return e.vagas.find(v => v.funcao === funcao && v.posicao === posicao) || null; }
  date(v:string){return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(`${v}T12:00:00`));}
  dateBr(v:string){return v ? this.date(v) : 'dd/mm/aaaa';}
  dateShort(v:string){return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'short'}).format(new Date(`${v}T12:00:00`)).replace('.','');}
  weekday(v:string){return new Intl.DateTimeFormat('pt-BR',{weekday:'long'}).format(new Date(`${v}T12:00:00`));}
  statusLabel(s:StatusEscala){return STATUS_LABEL[s];}
  statusClass(s:StatusEscala){return s==='FINALIZADA'?'bg-emerald-50 text-emerald-700':s==='CANCELADA'?'bg-red-50 text-red-700':'bg-amber-50 text-amber-700';}
  hasPendingChanges(){return this.status==='RASCUNHO' && (this.form.dirty||this.eventsDirty);}
}
