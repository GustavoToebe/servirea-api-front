import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CampoCompetenciaComponent } from '../../../shared/components/datas/campo-competencia.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { DialogoService } from '../../../shared/services/dialogo.service';
import { EscalaDetalhe, MESES } from '../models/escala.model';
import { EscalasService } from '../services/escalas.service';

export function tituloSemanal(ano: number, mes: number): string {
  return `Escala Semanal - ${MESES[mes - 1]} ${ano}`;
}

/** Mês seguinte ao da origem, em "AAAA-MM". */
export function mesSeguinte(ano: number, mes: number): string {
  const a = mes === 12 ? ano + 1 : ano;
  const m = mes === 12 ? 1 : mes + 1;
  return `${a}-${String(m).padStart(2, '0')}`;
}

/**
 * "Replicar para outro mês" (PLANO-006): gera a semanal do mês escolhido a partir da origem
 * (`EscalasService.replicarSemanal`), salva como rascunho e abre o builder da nova.
 */
@Component({
  selector: 'app-replicar-dialog',
  standalone: true,
  imports: [FormsModule, CampoCompetenciaComponent, ModalComponent],
  template: `
    <app-modal [aberto]="open && !!origem" titulo="Replicar para outro mês" rotulo="Replicar para outro mês" [fecharNoFundo]="false"
      (fechar)="fechar.emit()">
      <p class="text-sm text-slate-500">A partir de: {{ origem?.titulo }}</p>
      <p class="mt-4 rounded-xl bg-violet-50 p-3 text-sm text-slate-700">
        As pessoas vão para o mesmo dia da semana e a mesma semana do mês. Dias que não existem no mês novo ficam no topo
        como referência, e dias a mais ficam vazios.
      </p>
      <div class="mt-5 grid gap-4">
        <div><label class="label" for="rp-mes">Mês *</label>
          <app-campo-competencia id="rp-mes" [ngModel]="competencia" (ngModelChange)="trocarMes($event)" /></div>
        <div><label class="label" for="rp-titulo">Título *</label>
          <input id="rp-titulo" class="field" [(ngModel)]="titulo" maxlength="160" data-titulo-replica></div>
      </div>
      @if (erro) { <p class="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ erro }}</p> }
      <div rodape class="flex justify-between gap-2">
        <button type="button" class="btn-secondary" (click)="fechar.emit()">Cancelar</button>
        <button type="button" class="btn-primary" [disabled]="salvando || !competencia || !titulo.trim()" (click)="replicar()" data-replicar>
          {{ salvando ? 'Replicando...' : 'Replicar' }}
        </button>
      </div>
    </app-modal>
  `
})
export class ReplicarDialogComponent implements OnChanges {
  @Input() open = false;
  @Input() origem: EscalaDetalhe | null = null;
  @Output() fechar = new EventEmitter<void>();

  competencia = '';
  titulo = '';
  salvando = false;
  erro = '';

  constructor(private service: EscalasService, private dialogo: DialogoService, private router: Router) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open && this.origem) {
      this.trocarMes(mesSeguinte(this.origem.ano, this.origem.mes));
      this.erro = '';
    }
  }

  trocarMes(valor: string | null) {
    this.competencia = valor ?? '';
    if (!this.competencia) return;
    const [ano, mes] = this.competencia.split('-').map(Number);
    this.titulo = tituloSemanal(ano, mes);
  }

  async replicar() {
    if (!this.origem || !this.competencia) return;
    const [ano, mes] = this.competencia.split('-').map(Number);
    this.salvando = true;
    this.erro = '';
    try {
      const existentes = (await this.service.list({ ano, mes, tipo: 'SEMANAL' })).filter(e => e.status !== 'CANCELADA');
      if (existentes.length && !await this.dialogo.confirmar({
        titulo: 'Já existe uma escala',
        mensagem: `Já existe escala semanal de ${MESES[mes - 1]} ${ano} (${existentes[0].titulo}). Criar outra?`,
        confirmar: 'Criar outra'
      })) return;
      const eventos = this.service.replicarSemanal(this.origem, ano, mes);
      const nova = await this.service.save({
        titulo: this.titulo.trim(), tipo: 'SEMANAL', ano, mes, status: 'RASCUNHO', observacao: null, version: null, eventos
      });
      this.fechar.emit();
      await this.router.navigate(['/escalas', nova.id]);
    } catch (e: any) {
      this.erro = e?.message || 'Não foi possível replicar a escala.';
    } finally {
      this.salvando = false;
    }
  }
}
