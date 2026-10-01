import { ChangeDetectionStrategy, Component, computed, inject, Injectable, OnInit, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { mensagemApi } from '../../../core/api/api-error';

export interface Aniversariante {
  id: string;
  nome: string;
  dia: number;
}

@Injectable({ providedIn: 'root' })
export class AniversariantesService {
  private http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  /** Sem mês, a API usa o mês corrente no fuso de Brasília. */
  doMes(): Observable<Aniversariante[]> {
    return this.http.get<Aniversariante[]>(`${this.api}/pessoas/aniversariantes`);
  }
}

const LIMITE = 8;

/** Cartão do Início: quem faz aniversário no mês, só dia e nome. */
@Component({
  selector: 'app-aniversariantes-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="card h-fit p-6 space-y-4" data-cartao="aniversariantes">
      <div class="flex items-center gap-2">
        <span class="px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider text-white shadow-xs" [style.background]="'var(--brand)'">Mês</span>
        <h2 class="text-lg font-black text-[var(--ink)]">Aniversariantes de {{ nomeDoMes }}</h2>
      </div>

      @if (erro(); as mensagem) {
        <p class="text-sm font-semibold text-red-700 dark:text-red-300" data-estado="erro">{{ mensagem }}</p>
      } @else if (lista(); as todos) {
        @if (todos.length) {
          <ul class="divide-y divide-[var(--line)]">
            @for (p of visiveis(); track p.id) {
              <li class="flex items-center gap-3 py-2" data-aniversariante>
                <span class="w-9 shrink-0 text-center text-lg font-black tabular-nums" [style.color]="'var(--brand)'">{{ p.dia < 10 ? '0' + p.dia : p.dia }}</span>
                <span class="min-w-0 flex-1 truncate text-sm font-semibold text-[var(--ink)]">{{ p.nome }}</span>
                @if (p.dia === hoje) {
                  <span class="badge font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300">Hoje</span>
                }
              </li>
            }
          </ul>
          @if (todos.length > limite) {
            <button type="button" class="text-sm font-bold hover:underline" [style.color]="'var(--brand)'" data-acao="ver-todos" (click)="expandido.set(!expandido())">
              {{ expandido() ? 'Mostrar menos' : 'Ver todos (' + todos.length + ')' }}
            </button>
          }
        } @else {
          <p class="text-sm text-[var(--muted)]" data-estado="vazio">Nenhum aniversariante este mês.</p>
        }
      } @else {
        <p class="animate-pulse text-sm text-[var(--muted)]" data-estado="carregando">Carregando...</p>
      }
    </section>
  `
})
export class AniversariantesCardComponent implements OnInit {
  private servico = inject(AniversariantesService);

  readonly limite = LIMITE;
  readonly hoje = new Date().getDate();
  readonly nomeDoMes = new Date().toLocaleDateString('pt-BR', { month: 'long' });
  readonly lista = signal<Aniversariante[] | null>(null);
  readonly erro = signal<string | null>(null);
  readonly expandido = signal(false);
  readonly visiveis = computed(() => {
    const todos = this.lista() ?? [];
    return this.expandido() ? todos : todos.slice(0, LIMITE);
  });

  ngOnInit(): void {
    this.servico.doMes().subscribe({
      next: lista => this.lista.set(lista),
      error: erro => this.erro.set(mensagemApi(erro, 'Não foi possível carregar os aniversariantes.'))
    });
  }
}
