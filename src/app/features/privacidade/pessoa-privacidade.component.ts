import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { mensagemApi } from '../../core/api/api-error';
import { SessaoAtual } from '../../core/layout/sessao-atual';
import { CabecalhoPaginaComponent } from '../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { EstadoListaComponent } from '../../shared/components/estado-lista/estado-lista.component';
import { DialogoService } from '../../shared/services/dialogo.service';
import { ConsentimentoItem, PrivacidadeApiService, ROTULO_CONSENTIMENTO } from './privacidade-api.service';

/**
 * Privacidade de uma pessoa (F09): histórico de consentimentos e exportação autorizada dos dados. A exportação é
 * um arquivo JSON gerado no servidor; nada fica guardado no navegador além do download.
 */
@Component({
  selector: 'app-pessoa-privacidade',
  imports: [CommonModule, RouterLink, CabecalhoPaginaComponent, EstadoListaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <app-cabecalho-pagina titulo="Privacidade e dados pessoais"
        subtitulo="Histórico de autorizações e exportação dos dados desta pessoa." />
      <a [routerLink]="['/pessoas', pessoaId]" class="btn-secondary inline-block">Voltar à ficha</a>
      @if (erro()) { <p class="card p-4 text-red-600" role="alert" data-erro>{{ erro() }}</p> }
      @if (pode('PRIVACIDADE_EXPORTAR')) {
        <section class="card secao-form">
          <h2 class="secao-titulo">Exportar dados</h2>
          <p class="mb-3 text-sm text-slate-500">
            Gera um arquivo com cadastro, contatos, participações em escalas, histórico de autorizações e a lista de comunicações
            (sem o texto das mensagens). Cuidados e acolhimento só entram para quem tem essa permissão. A exportação fica registrada na auditoria.
          </p>
          <button type="button" class="btn-primary" [disabled]="ocupado()" (click)="exportar()" data-exportar>
            {{ ocupado() ? 'Gerando...' : 'Exportar dados (JSON)' }}
          </button>
        </section>
      }
      @if (pode('PRIVACIDADE')) {
        <section class="card p-4">
          <h2 class="secao-titulo">Histórico de autorizações</h2>
          <div class="tabela-rolagem">
            <table class="tabela w-full">
              <thead><tr><th>Quando</th><th>Autorização</th><th>Situação</th><th>Fonte</th></tr></thead>
              <tbody>
                @for (c of itens(); track $index) {
                  <tr>
                    <td>{{ c.registradoEm | date: 'dd/MM/yyyy HH:mm' }}</td>
                    <td>{{ rotulo(c) }}</td>
                    <td>
                      <span class="badge" [ngClass]="c.concedido ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'">
                        {{ c.concedido ? 'Concedida' : 'Revogada' }}
                      </span>
                    </td>
                    <td class="text-sm text-slate-500">{{ c.fonte }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <app-estado-lista [carregando]="carregando()" [vazio]="!itens().length" mensagemVazio="Nenhuma mudança de autorização registrada." />
          <div class="flex items-center gap-3">
            <button type="button" class="btn-secondary" [disabled]="pagina === 0 || carregando()" (click)="paginar(-1)">Anterior</button>
            <span>{{ total() }} registros · Página {{ pagina + 1 }}</span>
            <button type="button" class="btn-secondary" [disabled]="(pagina + 1) * 30 >= total() || carregando()" (click)="paginar(1)">Próxima</button>
          </div>
        </section>
      } @else {
        <p class="card p-4 text-red-600" role="alert">Seu perfil não permite consultar o histórico de autorizações.</p>
      }
    </div>
  `
})
export class PessoaPrivacidadeComponent implements OnInit, OnDestroy {
  private readonly api = inject(PrivacidadeApiService);
  private readonly sessao = inject(SessaoAtual);
  private readonly dialogo = inject(DialogoService);
  readonly pessoaId = inject(ActivatedRoute).snapshot.paramMap.get('id')!;

  readonly itens = signal<ConsentimentoItem[]>([]);
  readonly total = signal(0);
  readonly carregando = signal(false);
  readonly ocupado = signal(false);
  readonly erro = signal('');
  pagina = 0;
  private leitura?: Subscription;
  private download?: Subscription;

  pode(codigo: string) { return this.sessao.permissoes().includes(codigo); }
  rotulo(c: ConsentimentoItem) { return ROTULO_CONSENTIMENTO[c.tipo]; }

  ngOnInit() { if (this.pode('PRIVACIDADE')) this.carregar(); }

  paginar(delta: number) { this.pagina += delta; this.carregar(); }

  carregar() {
    this.leitura?.unsubscribe();
    this.carregando.set(true);
    this.erro.set('');
    this.leitura = this.api.consentimentos(this.pessoaId, this.pagina).subscribe({
      next: r => { this.itens.set(r.itens); this.total.set(r.total); this.carregando.set(false); },
      error: e => { this.carregando.set(false); this.erro.set(mensagemApi(e, 'Não foi possível consultar o histórico.')); }
    });
  }

  async exportar() {
    if (this.ocupado() || !this.pode('PRIVACIDADE_EXPORTAR')) return;
    if (!await this.dialogo.confirmar({
      mensagem: 'Exportar os dados pessoais desta pessoa? O arquivo contém informações pessoais: guarde e compartilhe com cuidado. A ação fica na auditoria.',
      confirmar: 'Exportar'
    })) return;
    this.ocupado.set(true);
    this.erro.set('');
    this.download = this.api.exportar(this.pessoaId).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dados-pessoa-${this.pessoaId}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.ocupado.set(false);
      },
      error: e => { this.ocupado.set(false); this.erro.set(mensagemApi(e, 'Não foi possível exportar os dados.')); }
    });
  }

  ngOnDestroy() {
    this.leitura?.unsubscribe();
    this.download?.unsubscribe();
  }
}
