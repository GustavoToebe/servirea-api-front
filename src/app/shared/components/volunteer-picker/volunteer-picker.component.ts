import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TipoVoluntario, Voluntario } from '../../../features/voluntarios/models/voluntario.model';

@Component({
  selector: 'app-volunteer-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relative">
      <button type="button"
              class="flex w-full items-center gap-2 rounded-lg border bg-white px-3 py-2 text-left text-sm transition"
              [class.border-sky-400]="open"
              [class.ring-2]="open"
              [class.ring-sky-100]="open"
              [class.border-slate-300]="!open"
              [class.bg-slate-100]="disabled"
              [disabled]="disabled"
              (click)="toggleOpen()">
        <span class="min-w-0 flex-1 truncate" [class.text-slate-400]="!selectedName">{{ selectedName || 'Selecione o irmão' }}</span>
        <span *ngIf="selectedId && !disabled" class="text-slate-400 hover:text-red-500" (click)="clear($event)" title="Limpar">✕</span>
        <span class="text-slate-400">▾</span>
      </button>

      <div *ngIf="open && !disabled" class="absolute z-50 mt-1 w-full min-w-[240px] overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
        <div class="space-y-2 border-b border-slate-100 p-2">
          <div class="flex flex-wrap gap-1">
            <button *ngFor="let t of tipos" type="button"
                    class="rounded-full px-2.5 py-1 text-[11px] font-bold"
                    [class.bg-brand-blue]="tipoFiltro === t.value"
                    [class.text-white]="tipoFiltro === t.value"
                    [class.bg-slate-100]="tipoFiltro !== t.value"
                    [class.text-slate-600]="tipoFiltro !== t.value"
                    (mousedown)="$event.preventDefault()"
                    (click)="setTipo(t.value)">{{ t.label }}</button>
          </div>
          <input class="w-full rounded-md border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-sky-400"
                 [(ngModel)]="search" placeholder="Filtrar" autofocus>
        </div>
        <div class="max-h-56 overflow-auto py-1">
          <button *ngFor="let v of filtered()" type="button"
                  class="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-50"
                  [class.bg-sky-50]="v.id === selectedId"
                  [disabled]="excludeIds.includes(v.id) && v.id !== selectedId"
                  (mousedown)="$event.preventDefault()"
                  (click)="choose(v)">
            <span class="flex h-4 w-4 shrink-0 items-center justify-center rounded border"
                  [class.border-sky-500]="v.id === selectedId"
                  [class.bg-sky-500]="v.id === selectedId"
                  [class.border-slate-300]="v.id !== selectedId">
              <span *ngIf="v.id === selectedId" class="text-[10px] font-black text-white">✓</span>
            </span>
            <span class="min-w-0 truncate">{{ v.nome_completo }}</span>
            <span *ngIf="excludeIds.includes(v.id) && v.id !== selectedId" class="ml-auto text-[10px] font-semibold text-amber-600">já usado</span>
          </button>
          <div *ngIf="!filtered().length" class="px-3 py-4 text-center text-xs text-slate-400">Nenhum irmão encontrado.</div>
        </div>
      </div>
    </div>
  `
})
export class VolunteerPickerComponent implements OnChanges {
  @Input() volunteers: Voluntario[] = [];
  @Input() selectedId: string | null = null;
  @Input() excludeIds: string[] = [];
  @Input() disabled = false;
  @Output() selectedIdChange = new EventEmitter<string | null>();

  search = '';
  open = false;
  selectedName = '';
  tipoFiltro: TipoVoluntario | '' = '';
  tipos: { value: TipoVoluntario; label: string }[] = [
    { value: 'COROINHA', label: 'Coroinha' },
    { value: 'ACOLITO', label: 'Acólito' },
    { value: 'AMBOS', label: 'Acólito / Coroinha' }
  ];

  constructor(private host: ElementRef<HTMLElement>) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedId'] || changes['volunteers']) this.syncName();
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.open) return;
    if (!this.host.nativeElement.contains(event.target as Node)) this.open = false;
  }

  toggleOpen() {
    if (this.disabled) return;
    this.open = !this.open;
    if (this.open) this.search = '';
  }

  setTipo(tipo: TipoVoluntario) {
    this.tipoFiltro = this.tipoFiltro === tipo ? '' : tipo;
  }

  clear(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    this.selectedIdChange.emit(null);
    this.search = '';
    this.selectedName = '';
    this.open = false;
  }

  choose(v: Voluntario) {
    if (this.excludeIds.includes(v.id) && v.id !== this.selectedId) return;
    if (v.id === this.selectedId) {
      this.selectedIdChange.emit(null);
      this.selectedName = '';
    } else {
      this.selectedIdChange.emit(v.id);
      this.selectedName = v.nome_completo;
    }
    this.search = '';
    this.open = false;
  }

  filtered() {
    const q = this.normalize(this.search);
    return this.volunteers
      .filter(v => v.ativo)
      .filter(v => !this.tipoFiltro || v.tipo === this.tipoFiltro)
      .filter(v => !q || this.normalize(v.nome_completo).includes(q));
  }

  private syncName() { this.selectedName = this.volunteers.find(v => v.id === this.selectedId)?.nome_completo || ''; }
  private normalize(v: string) { return (v || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
}
