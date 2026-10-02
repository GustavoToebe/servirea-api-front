import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { mensagemApi } from '../../core/api/api-error';
import { CabecalhoPaginaComponent } from '../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { CheckinApiService, ResultadoCheckin } from './checkin-api.service';

/** Código que veio no link (#código). Aceita também o link inteiro colado no campo. */
export function extrairCodigo(texto: string): string {
  const t = texto.trim();
  const i = t.lastIndexOf('#');
  return (i >= 0 ? t.slice(i + 1) : t).trim();
}

/**
 * Check-in por encontro, lado da pessoa escalada (F15). Pensado para o celular: um campo, um botão. O código fica só
 * na memória da página; se a pessoa não conseguir, a coordenação registra a presença manualmente.
 */
@Component({
  selector: 'app-checkin-pessoa',
  imports: [CommonModule, FormsModule, RouterLink, CabecalhoPaginaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-md space-y-4">
      <app-cabecalho-pagina titulo="Registrar presença"
        subtitulo="Use o código que a coordenação mostrou no encontro. Só vale para quem está escalado." />
      @if (resultado(); as r) {
        <section class="card p-5 text-center" role="status" data-sucesso>
          <p class="text-lg font-black text-emerald-700">{{ r.jaRegistrado ? 'Sua presença já estava registrada' : 'Presença registrada' }}</p>
          <p class="mt-1">{{ r.celebracao }} · {{ r.data | date: 'dd/MM/yyyy' }} {{ r.horario.slice(0, 5) }}</p>
          <p class="text-sm text-slate-500">Função: {{ r.funcao }}</p>
          <a routerLink="/portal" class="btn-secondary mt-4 inline-block">Meus compromissos</a>
        </section>
      } @else {
        <form class="card secao-form" (ngSubmit)="registrar()">
          <label class="label" for="ck-codigo">Código ou link do check-in</label>
          <input id="ck-codigo" name="codigo" class="field w-full" autocomplete="off" autocapitalize="off" spellcheck="false"
            [(ngModel)]="codigo" required>
          @if (erro()) { <p class="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-700" role="alert" data-erro>{{ erro() }}</p> }
          <button type="submit" class="btn-primary mt-4 w-full" [disabled]="ocupado() || !codigo.trim()" data-registrar>
            {{ ocupado() ? 'Registrando...' : 'Registrar minha presença' }}
          </button>
          <p class="mt-3 text-sm text-slate-500">Sem o código ou sem conexão? Avise a coordenação para registrar sua presença.</p>
        </form>
      }
    </div>
  `
})
export class CheckinPessoaComponent implements OnInit, OnDestroy {
  private readonly api = inject(CheckinApiService);

  readonly resultado = signal<ResultadoCheckin | null>(null);
  readonly ocupado = signal(false);
  readonly erro = signal('');
  codigo = '';
  private chamada?: Subscription;

  ngOnInit() {
    const fragmento = window.location.hash.replace(/^#/, '');
    if (fragmento) {
      this.codigo = extrairCodigo(fragmento);
      // Tira o código da barra de endereço para não ficar no histórico nem em capturas de tela.
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }

  registrar() {
    const token = extrairCodigo(this.codigo);
    if (!token || this.ocupado()) return;
    this.ocupado.set(true);
    this.erro.set('');
    this.chamada = this.api.registrar(token).subscribe({
      next: r => { this.ocupado.set(false); this.codigo = ''; this.resultado.set(r); },
      error: e => { this.ocupado.set(false); this.erro.set(mensagemApi(e, 'Não foi possível registrar a presença.')); }
    });
  }

  ngOnDestroy() {
    this.chamada?.unsubscribe();
    this.codigo = '';
  }
}
