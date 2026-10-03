import { Component, EventEmitter, Input, Output, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface OpcaoMenu {
  id: string;
  rotulo: string;
  icone?: string;
  desabilitada?: boolean;
  dica?: string;
}

export interface FiltroAtivo {
  chave: string;
  rotulo: string;
}

@Component({
  selector: 'app-barra-filtros',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relative w-full" #container>
      <div class="flex w-full flex-col gap-4 md:flex-row">
        <!-- Campo de busca -->
        <div *ngIf="!semBusca" class="flex-1">
          <input type="text" class="field w-full" [placeholder]="placeholder"
                 [(ngModel)]="termo" (ngModelChange)="termoChange.emit($event)"
                 (keyup.enter)="emitirBuscar()" data-busca>
        </div>

        <!-- Botões Opções e Buscar: sem campo de busca ficam no canto direito -->
        <div class="flex gap-2" [class.ml-auto]="semBusca" [class.self-end]="semBusca">
          <!-- Opções -->
          <div *ngIf="opcoes.length > 0" class="relative">
            <button type="button" class="btn-secondary h-full" (click)="menuAberto = !menuAberto" data-opcoes>
              Opções ⋮
            </button>
            <div *ngIf="menuAberto" class="menu-solido absolute z-[100] mt-1 rounded border border-slate-200 shadow-lg min-w-48 right-0 md:left-0 md:right-auto py-1">
              <button *ngFor="let op of opcoes" type="button"
                      class="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      [disabled]="op.desabilitada"
                      [title]="op.dica || ''"
                      (click)="selecionarOpcao(op)"
                      [attr.data-opcao]="op.id">
                <span *ngIf="op.icone" class="mr-2">{{ op.icone }}</span>
                {{ op.rotulo }}
              </button>
            </div>
          </div>

          <!-- Botão de Ação: Cancelar/Buscar com seta -->
          <div class="flex rounded shadow-sm">
            <button type="button" class="btn h-full" [class.rounded-r-none]="temFiltros"
                    [ngClass]="aberto ? 'btn-secondary' : 'btn-primary'"
                    (click)="acaoPrincipal()" data-buscar>
              {{ aberto ? 'Cancelar' : 'Buscar' }}
            </button>
            <button *ngIf="temFiltros" type="button"
                    class="btn rounded-l-none border-l border-white/20 h-full px-2"
                    [ngClass]="aberto ? 'btn-secondary' : 'btn-primary'"
                    (click)="aberto = !aberto" data-alternar-filtros>
              ▾
            </button>
          </div>
        </div>
      </div>

      <!-- Painel de filtros -->
      <div *ngIf="aberto" class="mt-2 p-4 bg-white dark:bg-[var(--card)] border border-[var(--line)] rounded shadow">
        <div class="grid gap-3 md:grid-cols-3">
          <ng-content></ng-content>
        </div>
        <div class="mt-4 flex justify-end">
          <button type="button" class="btn-primary" (click)="buscarEFechar()" data-buscar-painel>Buscar</button>
        </div>
      </div>

      <!-- Filtros ativos -->
      <div *ngIf="filtrosAtivos.length > 0" class="mt-3 flex flex-wrap gap-2 items-center text-sm">
        <span class="text-gray-500 dark:text-gray-400">Filtrado por:</span>
        <div *ngFor="let filtro of filtrosAtivos" class="chip chip-on text-xs !py-0.5 !px-2 flex items-center gap-1">
          {{ filtro.rotulo }}
          <button type="button" class="text-xs hover:text-white" (click)="removerFiltro.emit(filtro.chave)" [attr.data-remover-filtro]="filtro.chave">×</button>
        </div>
        <button type="button" class="text-blue-500 hover:underline text-xs" (click)="removerTodos.emit()" data-remover-filtros>Remover filtros</button>
      </div>
    </div>
  `
})
export class BarraFiltrosComponent {
  @Input() placeholder = 'Pesquisar...';
  @Input() termo = '';
  @Output() termoChange = new EventEmitter<string>();

  @Input() opcoes: OpcaoMenu[] = [];
  @Output() opcao = new EventEmitter<string>();

  @Input() filtrosAtivos: FiltroAtivo[] = [];
  @Output() removerFiltro = new EventEmitter<string>();
  @Output() removerTodos = new EventEmitter<void>();

  @Output() buscar = new EventEmitter<void>();

  @Input() temFiltros = true;
  @Input() semBusca = false;

  aberto = false;
  menuAberto = false;

  constructor(private elementRef: ElementRef) {}

  @HostListener('document:click', ['$event.target'])
  onClickOutside(target: EventTarget | null) {
    if (this.menuAberto && !this.elementRef.nativeElement.contains(target)) {
      this.menuAberto = false;
    }
  }

  @HostListener('document:keydown.escape')
  onEscape() {
    this.menuAberto = false;
  }

  emitirBuscar() {
    this.buscar.emit();
  }

  acaoPrincipal() {
    if (this.aberto) {
      this.aberto = false;
    } else {
      this.emitirBuscar();
    }
  }

  buscarEFechar() {
    this.emitirBuscar();
    this.aberto = false;
  }

  selecionarOpcao(op: OpcaoMenu) {
    if (!op.desabilitada) {
      this.opcao.emit(op.id);
      this.menuAberto = false;
    }
  }
}
