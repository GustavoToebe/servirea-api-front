import { Component, Input, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { GRUPOS_CONDICAO, NIVEIS_TEA, CondicaoEspecial } from './condicoes';

export interface CuidadosValue {
  condicoes: CondicaoEspecial[];
  nivelSuporteTea: number | null;
  condicaoOutra: string;
  cuidados: string;
}

@Component({
  selector: 'app-cuidados',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CuidadosComponent),
      multi: true
    }
  ],
  template: `
    <section class="card bg-violet-50 text-slate-800 p-4 rounded-lg">
      <header class="mb-4">
        <h3 class="text-lg font-bold text-violet-900 mb-2">💜 Cuidado e acolhimento</h3>
        <p class="text-sm">
          Cada criança é única, e queremos que ela se sinta em casa servindo no altar.
          Se houver algo que nos ajude a cuidar melhor{{ nome ? ' de ' + nome : '' }}, conte pra gente. É opcional e fica só com a equipe da paróquia.
        </p>
      </header>

      <div class="flex gap-4 mb-4">
        <button type="button" 
                class="flex-1 py-3 px-4 rounded-md font-medium transition-colors border"
                [class.bg-white]="!isAberto"
                [class.border-slate-300]="!isAberto"
                [class.bg-violet-100]="isAberto"
                [class.border-violet-300]="isAberto"
                [class.text-violet-900]="isAberto"
                (click)="setAberto(false)">
          Não, tudo certo
        </button>
        <button type="button" 
                class="flex-1 py-3 px-4 rounded-md font-medium transition-colors border"
                [class.bg-violet-600]="isAberto"
                [class.text-white]="isAberto"
                [class.border-violet-600]="isAberto"
                [class.bg-white]="!isAberto"
                [class.border-slate-300]="!isAberto"
                (click)="setAberto(true)">
          Sim, quero contar
        </button>
      </div>

      <div *ngIf="isAberto" class="transition-all duration-300">
        <div *ngFor="let grupo of grupos" class="mb-6">
          <h4 class="font-semibold text-sm text-slate-600 mb-2 uppercase tracking-wide">{{ grupo.nome }}</h4>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div *ngFor="let item of grupo.itens" class="flex flex-col">
              <button type="button"
                      [attr.aria-pressed]="hasCondicao(item.id)"
                      (click)="toggleCondicao(item.id)"
                      class="text-left p-3 rounded-lg border-2 transition-colors relative flex items-start gap-3"
                      [class.border-violet-500]="hasCondicao(item.id)"
                      [class.bg-violet-100]="hasCondicao(item.id)"
                      [class.border-transparent]="!hasCondicao(item.id)"
                      [class.bg-white]="!hasCondicao(item.id)">
                <span class="text-2xl">{{ item.icone }}</span>
                <div class="flex-1">
                  <div class="font-bold text-slate-800">{{ item.nome }}</div>
                  <div class="text-xs text-slate-600">{{ item.descricao }}</div>
                </div>
                <div *ngIf="hasCondicao(item.id)" class="text-violet-600 font-bold text-xl">✓</div>
              </button>
              
              <div *ngIf="item.id === 'TEA' && hasCondicao('TEA')" class="mt-2 ml-10 p-2 bg-white rounded border border-violet-200">
                <div class="text-xs font-semibold mb-2">Nível de suporte:</div>
                <div class="flex flex-col gap-1">
                  <label *ngFor="let nivel of niveisTea" class="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" 
                           [name]="'nivelTea'" 
                           [value]="nivel.valor" 
                           [(ngModel)]="value.nivelSuporteTea"
                           (ngModelChange)="onModelChange()">
                    {{ nivel.rotulo }}
                  </label>
                </div>
              </div>

              <div *ngIf="item.id === 'OUTRA' && hasCondicao('OUTRA')" class="mt-2 ml-10">
                <input type="text" 
                       class="field w-full p-2 border rounded" 
                       placeholder="Qual?" 
                       maxlength="200"
                       [(ngModel)]="value.condicaoOutra"
                       (ngModelChange)="onModelChange()">
              </div>
            </div>
          </div>
        </div>

        <div class="mt-4">
          <label class="block font-semibold mb-2">Como podemos acolher melhor?</label>
          <textarea class="field w-full p-3 border rounded-lg resize-y min-h-[100px]"
                    placeholder="Ex.: não gosta de barulho alto, fica mais tranquila perto de alguém conhecido, usa abafador, se acalma quando…"
                    maxlength="1000"
                    [(ngModel)]="value.cuidados"
                    (ngModelChange)="onModelChange()"></textarea>
          <div class="text-xs text-right text-slate-500 mt-1">
            {{ value.cuidados?.length || 0 }} / 1000
          </div>
        </div>
      </div>

      <footer class="mt-4 pt-4 border-t border-violet-200/50 text-xs text-center text-violet-700">
        Nenhuma dessas condições impede ninguém de servir. 🙏
      </footer>
    </section>
  `,
  styles: []
})
export class CuidadosComponent implements ControlValueAccessor {
  @Input() nome = '';
  @Input() publico = false;

  grupos = GRUPOS_CONDICAO;
  niveisTea = NIVEIS_TEA;

  isAberto = false;

  value: CuidadosValue = {
    condicoes: [],
    nivelSuporteTea: null,
    condicaoOutra: '',
    cuidados: ''
  };

  onChange: any = () => {};
  onTouched: any = () => {};

  writeValue(val: any): void {
    if (val) {
      this.value = {
        condicoes: val.condicoes || [],
        nivelSuporteTea: val.nivelSuporteTea ?? null,
        condicaoOutra: val.condicaoOutra || '',
        cuidados: val.cuidados || ''
      };
      
      if (this.value.condicoes.length > 0 || this.value.cuidados) {
        this.isAberto = true;
      }
    } else {
      this.value = {
        condicoes: [],
        nivelSuporteTea: null,
        condicaoOutra: '',
        cuidados: ''
      };
      this.isAberto = false;
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {}

  setAberto(aberto: boolean) {
    this.isAberto = aberto;
    if (!aberto) {
      this.value = {
        condicoes: [],
        nivelSuporteTea: null,
        condicaoOutra: '',
        cuidados: ''
      };
      this.onModelChange();
    }
  }

  hasCondicao(id: CondicaoEspecial): boolean {
    return this.value.condicoes.includes(id);
  }

  toggleCondicao(id: CondicaoEspecial) {
    const idx = this.value.condicoes.indexOf(id);
    if (idx >= 0) {
      this.value.condicoes.splice(idx, 1);
      if (id === 'TEA') {
        this.value.nivelSuporteTea = null;
      }
      if (id === 'OUTRA') {
        this.value.condicaoOutra = '';
      }
    } else {
      this.value.condicoes.push(id);
      if (id === 'TEA' && this.value.nivelSuporteTea === undefined) {
        this.value.nivelSuporteTea = null;
      }
    }
    this.onModelChange();
  }

  onModelChange() {
    this.onChange({ ...this.value });
    this.onTouched();
  }
}
