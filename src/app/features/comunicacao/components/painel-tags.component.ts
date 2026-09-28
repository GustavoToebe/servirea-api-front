import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TagLayout } from '../comunicacao.models';

function semAcento(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** Lista pesquisável de tags, como no SIN: código em destaque, descrição embaixo; clicar emite o código. */
@Component({
  selector: 'app-painel-tags',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card flex h-full flex-col p-3">
      <input class="field mb-2" placeholder="Tags..." [(ngModel)]="filtro" data-filtro-tags>
      <div class="max-h-96 flex-1 space-y-1 overflow-y-auto">
        @for (tag of filtradas; track tag.codigo) {
          <button type="button" class="w-full rounded-lg px-2 py-1.5 text-left hover:bg-violet-50"
                  [attr.data-tag]="tag.codigo" (click)="escolher.emit(tag.codigo)">
            <span class="block font-mono text-sm font-bold text-brand-blue">{{ tag.codigo }}</span>
            <span class="block text-xs text-slate-500">{{ tag.descricao }}</span>
          </button>
        } @empty {
          <p class="px-2 py-4 text-center text-sm text-slate-500">Nenhuma tag encontrada.</p>
        }
      </div>
    </div>
  `
})
export class PainelTagsComponent {
  @Input() tags: TagLayout[] = [];
  @Output() escolher = new EventEmitter<string>();
  filtro = '';

  get filtradas(): TagLayout[] {
    const termo = semAcento(this.filtro.trim());
    if (!termo) return this.tags;
    return this.tags.filter(t => semAcento(t.codigo).includes(termo) || semAcento(t.descricao).includes(termo));
  }
}
