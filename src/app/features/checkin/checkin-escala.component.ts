import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subscription, firstValueFrom } from 'rxjs';
import { mensagemApi } from '../../core/api/api-error';
import { SessaoAtual } from '../../core/layout/sessao-atual';
import { CabecalhoPaginaComponent } from '../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { DialogoService } from '../../shared/services/dialogo.service';
import { EscalaEvento } from '../escalas/models/escala.model';
import { EscalasService } from '../escalas/services/escalas.service';
import { CheckinApiService, CheckinAberto, EstadoCheckin } from './checkin-api.service';

/** Link que a pessoa escalada abre; o código vai no fragmento (#) para não aparecer em logs de acesso. */
export function linkDeCheckin(origem: string, token: string) {
  return `${origem}/portal/checkin#${token}`;
}

/**
 * Check-in por encontro, lado da coordenação (F15). Cada celebração da escala finalizada pode abrir um código
 * de validade curta; abrir de novo invalida o anterior. O registro manual de presença continua na montagem da escala.
 */
@Component({
  selector: 'app-checkin-escala',
  imports: [CommonModule, FormsModule, RouterLink, CabecalhoPaginaComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-4">
      <app-cabecalho-pagina titulo="Check-in dos encontros"
        subtitulo="Abra um código por celebração. Cada pessoa escalada registra a própria presença uma única vez.">
        <a acoes [routerLink]="['/escalas', escalaId]" class="btn-secondary">Voltar à escala</a>
      </app-cabecalho-pagina>
      @if (erro()) { <p class="card p-4 text-red-600" role="alert" data-erro>{{ erro() }}</p> }
      @if (!pode('CHECKIN')) {
        <p class="card p-4 text-red-600" role="alert">Seu perfil não permite consultar o check-in.</p>
      }
      @for (e of eventos(); track e.id) {
        <section class="card secao-form p-6" [attr.data-evento]="e.id">
          <h2 class="secao-titulo">{{ e.data | date: 'dd/MM/yyyy' }} {{ e.horario.slice(0, 5) }} · {{ e.celebracao }}</h2>
          @if (estados()[e.id!]; as s) {
            <p class="text-sm">{{ s.presentes }} presentes de {{ s.escalados }} escalados.
              @if (s.ativa) { <span class="badge bg-emerald-50 text-emerald-700">Aberto até {{ s.expiraEm | date: 'HH:mm' }}</span> }
              @else { <span class="badge bg-slate-100 text-slate-600">Fechado</span> }
            </p>
            @if (s.registros.length) {
              <ul class="mt-2 text-sm text-slate-600">
                @for (r of s.registros; track $index) { <li>{{ r.registradoEm | date: 'HH:mm' }} · {{ r.nome }} ({{ r.funcao }})</li> }
              </ul>
            }
          }
          @if (abertos()[e.id!]; as a) {
            <div class="mt-3 rounded-xl bg-violet-50 p-3 text-sm" data-codigo>
              <p class="font-semibold">Código exibido só agora. Mostre ou envie o link para quem está escalado:</p>
              <p class="mt-1 break-all font-mono">{{ link(a) }}</p>
              <div class="mt-2 flex flex-wrap gap-2">
                <button type="button" class="btn-secondary" (click)="copiar(a)">Copiar link</button>
              </div>
            </div>
          }
          @if (pode('CHECKIN_GERENCIAR')) {
            <div class="mt-3 flex flex-wrap items-end gap-2">
              <label class="label">Validade
                <select class="field" [(ngModel)]="minutos" name="minutos">
                  <option [ngValue]="60">1 hora</option><option [ngValue]="120">2 horas</option><option [ngValue]="180">3 horas</option>
                </select>
              </label>
              <button type="button" class="btn-primary" [disabled]="ocupado()" (click)="abrir(e)" data-abrir>
                {{ estados()[e.id!]?.ativa ? 'Gerar novo código' : 'Abrir check-in' }}
              </button>
              @if (estados()[e.id!]?.ativa) {
                <button type="button" class="btn-danger" [disabled]="ocupado()" (click)="encerrar(e)" data-encerrar>Encerrar</button>
              }
            </div>
          }
        </section>
      }
      @if (!eventos().length && !carregando()) { <p class="card p-4 text-slate-500">Esta escala não tem celebrações com vagas.</p> }
    </div>
  `
})
export class CheckinEscalaComponent implements OnInit, OnDestroy {
  private readonly api = inject(CheckinApiService);
  private readonly escalasService = inject(EscalasService);
  private readonly sessao = inject(SessaoAtual);
  private readonly dialogo = inject(DialogoService);
  readonly escalaId = inject(ActivatedRoute).snapshot.paramMap.get('id')!;

  readonly eventos = signal<EscalaEvento[]>([]);
  readonly estados = signal<Record<string, EstadoCheckin>>({});
  readonly abertos = signal<Record<string, CheckinAberto>>({});
  readonly carregando = signal(true);
  readonly ocupado = signal(false);
  readonly erro = signal('');
  minutos = 180;
  private destruido = false;
  private leituras: Subscription[] = [];

  pode(codigo: string) { return this.sessao.permissoes().includes(codigo); }
  link(a: CheckinAberto) { return linkDeCheckin(window.location.origin, a.token); }

  async ngOnInit() {
    try {
      const escala = await this.escalasService.getById(this.escalaId);
      if (this.destruido) return;
      if (escala.status !== 'FINALIZADA') {
        this.erro.set('O check-in só abre para escala finalizada.');
        this.carregando.set(false);
        return;
      }
      this.eventos.set(escala.eventos.filter(e => !e.referencia && !!e.id && e.vagas.some(v => v.voluntario_id)));
      await Promise.all(this.eventos().map(e => this.atualizar(e.id!)));
    } catch (e) {
      this.erro.set(mensagemApi(e, 'Não foi possível carregar a escala.'));
    } finally {
      this.carregando.set(false);
    }
  }

  private async atualizar(eventoId: string) {
    if (!this.pode('CHECKIN')) return;
    const estado = await firstValueFrom(this.api.estado(eventoId));
    if (!this.destruido) this.estados.set({ ...this.estados(), [eventoId]: estado });
  }

  async abrir(e: EscalaEvento) {
    if (this.ocupado() || !e.id || !this.pode('CHECKIN_GERENCIAR')) return;
    if (this.estados()[e.id]?.ativa && !await this.dialogo.confirmar({
      mensagem: 'Gerar um novo código invalida o anterior. Continuar?', confirmar: 'Gerar novo código'
    })) return;
    this.ocupado.set(true);
    this.erro.set('');
    try {
      const aberto = await firstValueFrom(this.api.abrir(e.id, this.minutos));
      this.abertos.set({ ...this.abertos(), [e.id]: aberto });
      await this.atualizar(e.id);
    } catch (x) {
      this.erro.set(mensagemApi(x, 'Não foi possível abrir o check-in.'));
    } finally {
      this.ocupado.set(false);
    }
  }

  async encerrar(e: EscalaEvento) {
    if (this.ocupado() || !e.id || !this.pode('CHECKIN_GERENCIAR')) return;
    if (!await this.dialogo.confirmar({ mensagem: 'Encerrar o check-in desta celebração? O código atual deixa de valer.', confirmar: 'Encerrar', perigo: true })) return;
    this.ocupado.set(true);
    try {
      await firstValueFrom(this.api.encerrar(e.id));
      const { [e.id]: _removido, ...resto } = this.abertos();
      this.abertos.set(resto);
      await this.atualizar(e.id);
    } catch (x) {
      this.erro.set(mensagemApi(x, 'Não foi possível encerrar o check-in.'));
    } finally {
      this.ocupado.set(false);
    }
  }

  async copiar(a: CheckinAberto) {
    try {
      await navigator.clipboard.writeText(this.link(a));
    } catch {
      await this.dialogo.avisar('Não foi possível copiar. Selecione o link e copie manualmente.');
    }
  }

  ngOnDestroy() {
    this.destruido = true;
    this.leituras.forEach(s => s.unsubscribe());
    this.abertos.set({});
  }
}
