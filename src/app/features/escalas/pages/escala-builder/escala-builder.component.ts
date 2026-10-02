import {firstValueFrom} from 'rxjs';
import { NotificacoesApiService, CanalNotificacao } from '../../../notificacoes/notificacoes-api.service';
import { mensagemApi } from '../../../../core/api/api-error';
import { OrientacaoToggleComponent } from '../../../../shared/components/orientacao-toggle/orientacao-toggle.component';
import { Orientacao, lerOrientacao } from '../../../../shared/export/orientacao';
import { SessaoAtual } from '../../../../core/layout/sessao-atual';
import { CommonModule } from '@angular/common';
import { NumeroComponent } from '../../../../shared/components/numero/numero.component';
import { CampoDataComponent } from '../../../../shared/components/datas/campo-data.component';
import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HasPendingChanges } from '../../../../core/guards/pending-changes.guard';
import { Marcadores, VolunteerPickerComponent } from '../../../../shared/components/volunteer-picker/volunteer-picker.component';
import { FUNCOES_LABEL, FuncaoEscala, Voluntario } from '../../../voluntarios/models/voluntario.model';
import { VoluntariosService } from '../../../voluntarios/services/voluntarios.service';
import { AuthService } from '../../../../core/auth/auth.service';
import {
  ApoioEscala, ColunaEscala, COLUNAS_PADRAO_MENSAL, COLUNAS_PADRAO_SEMANAL, EscalaDetalhe, EscalaEvento,
  EscalaVaga, LayoutEscala, MESES, STATUS_LABEL, StatusEscala, TipoEscala, vagasDoLayout, indisponivelEm
} from '../../models/escala.model';
import { TITULOS_CELEBRACAO } from '../../data/calendario-liturgico';
import { EscalasService } from '../../services/escalas.service';
import { ExportService } from '../../services/export.service';
import { LayoutsEscalaService } from '../../services/layouts-escala.service';
import { DialogoService } from '../../../../shared/services/dialogo.service';
import { ReplicarDialogComponent } from '../replicar-dialog.component';
import { AindaNaoEscaladosComponent } from '../../components/ainda-nao-escalados.component';
import { dataCurta, dataLonga, diaDaSemana, diaEData } from './formatos-data';

/** Uma linha da grade, calculada só quando os eventos mudam (PLANO-008). */
interface Linha {
  evento: EscalaEvento;
  chave: string;
  diaEData: string;
  dataLonga: string;
  diaSemana: string;
  /** Semana do mês (segunda a domingo); 0 = fora do mês (referência). */
  semana: number;
  novaSemana: boolean;
  hoje: boolean;
  fimDeSemana: 'SAB' | 'DOM' | null;
  vagasPorColuna: Record<string, EscalaVaga>;
  /** "Vela 1", "Missal": rótulo de cada vaga do cartão da mensal. */
  rotulos: Record<string, string>;
  usados: ReadonlySet<string>;
  marcadores: Marcadores | null;
  preenchidas: number;
}

interface Painel { top: number; left: number; }

const CHAVE_PAINEL = 'servire.painelEscalados';

@Component({
    selector: 'app-escala-builder',
    imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, OrientacaoToggleComponent, VolunteerPickerComponent, NumeroComponent, CampoDataComponent,
      ReplicarDialogComponent, AindaNaoEscaladosComponent],
    template: `
    <div class="space-y-4">
      <div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div><a routerLink="/escalas" class="text-sm font-semibold text-brand-blue">← Voltar para escalas</a>
          <h1 class="mt-1 text-2xl font-black">{{ id ? 'Montagem da escala' : 'Nova escala' }}<app-numero [numero]="currentDetail?.sequencial" /></h1></div>
        @if (id) {
          <div class="flex flex-wrap items-center gap-2"><span class="badge" [ngClass]="statusClass(status)">{{ statusLabel(status) }}</span>
            @if (status==='RASCUNHO' && sessaoRespostas.permissoes().includes('VAGA_DISTRIBUIR')) {<a class="btn-secondary !py-2" [routerLink]="['/escalas',id,'distribuicao']" data-distribuir>Distribuir por regras</a>}
            @if (status==='FINALIZADA' && sessaoRespostas.permissoes().includes('NOTIFICACAO_ENVIAR')) {<button type="button" class="btn-secondary !py-2" [disabled]="avisando" (click)="avisarEscalados('EMAIL')" data-avisar-email>Avisar escalados por e-mail</button><button type="button" class="btn-secondary !py-2" [disabled]="avisando" (click)="avisarEscalados('WHATSAPP')" data-avisar-whatsapp>Avisar por WhatsApp</button>}
            @if (sessaoRespostas.permissoes().includes('VAGA_TROCA_LER')) {<a class="btn-secondary !py-2" [routerLink]="['/escalas',id,'trocas']">Trocas</a>}
            @if (sessaoRespostas.permissoes().includes('VAGA_CANDIDATURA_LER')) {<a class="btn-secondary !py-2" [routerLink]="['/escalas',id,'candidaturas']">Candidaturas</a>}
            @if (sessaoRespostas.permissoes().includes('VAGA_RESPOSTA_LER')) {<a class="btn-secondary !py-2" [routerLink]="['/escalas',id,'respostas']">Respostas de participação</a>}
            @if (status==='FINALIZADA') {
              <app-orientacao-toggle chave="escala" [(valor)]="orientacao" />
              <button type="button" class="btn-secondary !py-2" (click)="gerarPrevia()">Gerar prévia (PDF)</button>
              <button class="btn-secondary !py-2" (click)="exportPdf()">Exportar PDF</button>
              <button class="btn-secondary !py-2" (click)="exportPng()">Exportar PNG</button>
            }
          </div>
        }
      </div>

      @if(!readOnly&&podeArrastar()){
      <section class="card space-y-3 p-4"><h2 class="secao-titulo">Alocar por arraste ou teclado</h2><p class="text-sm text-slate-500">Arraste uma pessoa para a vaga, ou selecione aqui e use “Aplicar pessoa selecionada” na vaga. Altera apenas o rascunho; salve depois. Para substituir uma pessoa, será pedida confirmação.</p><label class="label" for="busca-arraste">Buscar voluntário ativo</label><input id="busca-arraste" class="field" [(ngModel)]="buscaArraste" (ngModelChange)="buscarArraste()" placeholder="Início do nome"><div class="flex flex-wrap gap-2">@for(v of pessoasArraste;track v.id){<button type="button" class="btn-secondary" [draggable]="!saving&&!arrasteOcupado" [disabled]="saving||arrasteOcupado" [attr.aria-pressed]="pessoaArraste===v.id" (dragstart)="iniciarArraste($event,v.id)" (dragend)="encerrarArraste()" (click)="pessoaArraste=v.id">{{v.nome_completo}}</button>}</div><div class="flex gap-3"><button type="button" [disabled]="buscandoArraste||paginaArraste===0" (click)="paginarArraste(-1)">Anterior</button><span>{{paginaArraste+1}}</span><button type="button" [disabled]="buscandoArraste||!maisArraste" (click)="paginarArraste(1)">Próxima</button></div><p role="status">{{erroArraste||avisoArraste}}</p><button type="button" class="btn-secondary" (click)="pessoaArraste=null">Limpar seleção</button></section>
      }
      @if (loading) {
        <div class="space-y-3" aria-label="Carregando escala">
          <div class="h-16 animate-pulse rounded-2xl bg-slate-200"></div>
          @for (i of esqueleto; track i) { <div class="h-12 animate-pulse rounded-xl bg-slate-100"></div> }
        </div>
      } @else {
        <section class="card p-4">
          <form [formGroup]="form" class="grid gap-3 md:grid-cols-[2fr_minmax(10rem,1fr)_minmax(14rem,1.4fr)_6.5rem_minmax(9rem,1fr)]">
            <div><label class="label">Título *</label><input class="field" formControlName="titulo" [readonly]="readOnly"></div>
            <div>
              <label class="label">Layout</label>
              <select class="field" formControlName="layoutId" [attr.disabled]="metaTravada ? true : null" (change)="metaChanged()">
                <option [ngValue]="null">Padrão</option>
                @for(l of layoutsFiltrados; track l.id){
                  <option [ngValue]="l.id">{{ l.nome }}</option>
                }
              </select>
            </div>
            <div>
              <label class="label">Modelo *</label>
              <select class="field" formControlName="tipo" [attr.disabled]="metaTravada ? true : null" (change)="metaChanged()">
                <option value="SEMANAL">Semanal (dias úteis)</option>
                <option value="MENSAL">Mensal (sábados e domingos)</option>
              </select>
            </div>
            <div>
              <label class="label">Ano *</label>
              <input class="field" type="number" min="2020" max="2100" formControlName="ano" [readonly]="metaTravada" (change)="metaChanged()">
            </div>
            <div>
              <label class="label">Mês *</label>
              <select class="field" formControlName="mes" [attr.disabled]="metaTravada ? true : null" (change)="metaChanged()">
                @for (m of months; track m; let i = $index) {
                  <option [ngValue]="i+1">{{ m }}</option>
                }
              </select>
            </div>
          </form>
          @if (observacaoAberta) {
            <div class="mt-3"><label class="label">Observação</label><textarea class="field min-h-20" [formControl]="form.controls.observacao" [readonly]="readOnly"></textarea></div>
          } @else if (!readOnly) {
            <button type="button" class="mt-2 text-sm font-semibold text-brand-blue hover:underline" (click)="observacaoAberta = true">＋ Observação</button>
          }
          <details class="mt-2 text-sm text-slate-600">
            <summary class="cursor-pointer font-semibold">Como a grade é montada?</summary>
            <p class="mt-2">A escala mensal fica só com sábados e domingos; a semanal, com os dias úteis. Se a festa da Igreja cair no fim de semana, o nome aparece na mensal; se cair em dia de semana, aparece na semanal. Você ainda pode adicionar ou excluir um dia na mão.</p>
          </details>
        </section>

        <!-- Cabeçalho do Layout (Visível na Escala e no PDF) -->
        @if (textosCabecalho.length > 0) {
          <section class="card p-4 bg-gradient-to-r from-indigo-50/50 via-purple-50/30 to-indigo-50/50 border border-indigo-200/80 space-y-1.5 shadow-2xs">
            <div class="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-indigo-500 mb-1">
              <span>📄 Cabeçalho do Layout (Impresso no Topo do Documento)</span>
              <span class="text-slate-400 font-medium normal-case">Definido no modelo selecionado</span>
            </div>
            @for (t of textosCabecalho; track t.idLocal || t.conteudo) {
              @if (t.tipo === 'TITULO') {
                <div [class]="getAlignClass(t.alinhamento)" class="text-xl md:text-2xl font-black text-slate-800 tracking-tight">
                  {{ resolverTextoTag(t.conteudo) }}
                </div>
              }
              @if (t.tipo === 'SUBTITULO') {
                <div [class]="getAlignClass(t.alinhamento)" class="text-sm font-bold text-slate-600">
                  {{ resolverTextoTag(t.conteudo) }}
                </div>
              }
              @if (t.tipo === 'TEXTO_LIVRE') {
                <div [class]="getAlignClass(t.alinhamento)" class="text-xs text-slate-700 bg-white/90 border border-indigo-100 p-2.5 rounded-xl whitespace-pre-wrap leading-relaxed shadow-2xs">
                  {{ resolverTextoTag(t.conteudo) }}
                </div>
              }
            }
          </section>
        }

        <!-- Barra de ferramentas da grade -->
        <div class="flex flex-wrap items-center gap-2">
          @if (!readOnly) {
            <button type="button" class="btn-secondary !py-2" (click)="abrirNovoDia($event)" data-novo-dia>＋ Dia</button>
          <button type="button" class="btn-secondary !py-2" (click)="gerarPrevia()">Gerar prévia (PDF)</button>
          }
          @if (ehMensal) {
            @if (id) {
              <a class="btn-secondary !py-2" target="_blank" [routerLink]="['/escalas/indisponibilidades']"
                 [queryParams]="{ ano: form.controls.ano.value, mes: form.controls.mes.value }" data-indisponibilidades>
                Indisponibilidades do mês ({{ pendentes }} pendentes)</a>
            } @else {
              <span class="text-sm text-slate-500">Salve o rascunho para ver indisponibilidades e irmãos.</span>
            }
          }
          @if (ehMensal && apoio) {
            <button type="button" class="btn-secondary !py-2 lg:hidden" (click)="painelAberto = !painelAberto">Ainda não escalados</button>
          }
        </div>

        @if (!ehMensal && referenciasCount) {
          <div class="rounded-2xl border border-slate-300 bg-slate-100 p-4 text-sm text-slate-700" data-aviso-referencias>
            <strong>{{ referenciasCount }} linha(s) de referência:</strong> reponha essas pessoas em outros dias e apague a linha quando terminar.
          </div>
        }

        <!-- Semanal: visualização em cartões estruturados ou tabela clássica -->
        @if (!ehMensal) {
          <div class="space-y-3">
            <div class="flex items-center justify-between bg-slate-100/80 p-2 rounded-2xl border border-slate-200">
              <span class="text-xs font-bold text-slate-700 pl-2">Escala Semanal (Dias úteis):</span>
              <div class="inline-flex rounded-xl border border-slate-200 bg-white p-0.5 text-xs font-bold shadow-2xs">
                <button type="button" class="px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                        [class.bg-brand-blue]="modoSemanal === 'CARTOES'"
                        [class.text-white]="modoSemanal === 'CARTOES'"
                        [class.shadow-xs]="modoSemanal === 'CARTOES'"
                        [class.text-slate-600]="modoSemanal !== 'CARTOES'"
                        (click)="modoSemanal = 'CARTOES'">
                  🗂️ Cartões da Missa
                </button>
                <button type="button" class="px-3 py-1.5 rounded-lg transition-all cursor-pointer"
                        [class.bg-brand-blue]="modoSemanal === 'TABELA'"
                        [class.text-white]="modoSemanal === 'TABELA'"
                        [class.shadow-xs]="modoSemanal === 'TABELA'"
                        [class.text-slate-600]="modoSemanal !== 'TABELA'"
                        (click)="modoSemanal = 'TABELA'">
                  📊 Tabela Semanal
                </button>
              </div>
            </div>

            @if (modoSemanal === 'CARTOES') {
              <div class="space-y-4">
                @for (l of linhasSemanal; track l.chave) {
                  @if (l.novaSemana) {
                    <div class="rounded-xl bg-slate-100 px-4 py-2 text-xs font-black uppercase tracking-wider text-slate-600 border border-slate-200 flex items-center justify-between">
                      <span class="flex items-center gap-1.5"><span>📅</span> Semana {{ l.semana }}</span>
                      <span class="text-[11px] font-normal lowercase text-slate-400">Dias úteis</span>
                    </div>
                  }
                  <div class="card overflow-visible border-l-4"
                       [class.border-l-indigo-500]="!l.evento.referencia && !l.evento.ocorrenciaNova"
                       [class.border-l-amber-400]="l.evento.ocorrenciaNova"
                       [class.border-l-slate-400]="l.evento.referencia"
                       [class.bg-slate-50]="l.evento.referencia"
                       [attr.data-evento]="l.evento.data">
                    <div class="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-2.5">
                      <div class="min-w-0 truncate font-black">
                        <span class="capitalize">{{ l.diaEData }}</span> · {{ l.evento.horario.slice(0,5) }} ·
                        <span [class.text-red-700]="l.evento.celebracao !== 'Missa'">{{ l.evento.celebracao || 'Missa' }}</span>
                        @if (l.evento.referencia) {
                          <span class="ml-2 rounded bg-slate-300 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-700">Referência</span>
                        }
                        @if (l.evento.ocorrenciaNova) {
                          <span class="ml-2 rounded bg-amber-200 px-1.5 py-0.5 text-[10px] font-bold text-amber-800">Dia a mais</span>
                        }
                      </div>
                      <div class="flex shrink-0 items-center gap-2">
                        <span class="text-sm text-slate-500 font-medium">{{ l.preenchidas }}/{{ l.evento.vagas.length }} vagas</span>
                        @if (!readOnly) {
                          <button type="button" class="rounded px-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Editar dia" (click)="abrirEdicao(l, $event)" data-editar-dia>✎</button>
                        }
                      </div>
                    </div>

                    <!-- Estrutura Visual idêntica à do Layout -->
                    <div class="space-y-3 p-3 bg-slate-50/40 rounded-b-2xl">
                      @for (linha of linhasCelebracaoLayout; track linha.index) {
                        <div class="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs">
                          <div class="text-[11px] font-bold text-slate-400 mb-2 pb-1 border-b border-slate-100 flex items-center justify-between">
                            <span class="text-indigo-700 font-extrabold uppercase tracking-wide">Linha {{ linha.index + 1 }} da Missa</span>
                          </div>
                          <div class="flex flex-wrap gap-2.5 items-stretch">
                            @for (bloco of linha.elementos; track bloco.idLocal || (bloco.funcao + '-' + bloco.posicao)) {
                              @if (bloco.tipo === 'VAGA' || (!bloco.tipo && bloco.funcao)) {
                                @let slot = l.vagasPorColuna[bloco.funcao + '-' + (bloco.posicao || 1)];
                                @if (slot) {
                                  <div [style.flex]="bloco.largura === 12 ? '1 1 100%' : (bloco.largura || 1)"
                                       class="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all shadow-2xs min-w-[150px] flex flex-col justify-between">
                                    <div>
                                      <div class="flex items-center justify-between gap-1 text-[10px] font-black uppercase tracking-wider mb-1">
                                        <span class="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">{{ slot.funcao }}</span>
                                        <span class="text-slate-400">Posição {{ slot.posicao }}</span>
                                      </div>
                                      <div class="text-xs font-black text-slate-800 mb-1.5 truncate" title="{{ bloco.rotulo || l.rotulos[slot.funcao + '-' + slot.posicao] || slot.funcao }}">
                                        {{ bloco.rotulo || l.rotulos[slot.funcao + '-' + slot.posicao] || slot.funcao }}
                                      </div>
                                    </div>
                                    <div>
                                      @if (readOnly) {
                                        <span class="block truncate rounded-lg px-2 py-1.5 bg-white border border-slate-200 text-sm"
                                              [class.font-semibold]="!!slot.voluntario_id"
                                              [class.text-slate-400]="!slot.voluntario_id">
                                          {{ slot.voluntario?.nome_completo || '—' }}
                                        </span>
                                      } @else {
                                        <div class="rounded-lg border border-transparent focus-within:border-[var(--brand)]" (dragover)="permitirArraste($event)" (drop)="soltarPessoa($event,l.evento,slot)"><app-volunteer-picker [remoto]="true" (voluntarioSelecionado)="lembrarOpcao($event)" [volunteers]="volunteers" [selectedId]="slot.voluntario_id" [excludeIds]="l.usados"
                                          (selectedIdChange)="selectVolunteer(l.evento, slot, $event)" />@if(pessoaArraste&&podeArrastar()){<button type="button" class="btn-secondary mt-1 text-xs" [disabled]="saving||arrasteOcupado" (click)="aplicarArraste(l.evento,slot)">Aplicar pessoa selecionada</button>}</div>
                                      }
                                    </div>
                                  </div>
                                }
                              } @else if (bloco.tipo === 'DATA') {
                                <div [style.flex]="bloco.largura === 12 ? '1 1 100%' : (bloco.largura || 1)"
                                     class="p-2.5 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-950 flex items-center justify-between text-xs font-bold">
                                  <span>📅 Dia / Celebração: <strong class="capitalize">{{ l.diaEData }}</strong> · {{ l.evento.horario.slice(0,5) }}</span>
                                  @if (l.evento.celebracao && l.evento.celebracao !== 'Missa') {
                                    <span class="text-red-700 font-extrabold uppercase px-1.5 py-0.5 rounded bg-red-100">{{ l.evento.celebracao }}</span>
                                  }
                                </div>
                              } @else if (bloco.tipo === 'TEXTO_LIVRE') {
                                <div [style.flex]="bloco.largura === 12 ? '1 1 100%' : (bloco.largura || 1)"
                                     class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs">
                                  {{ resolverTextoTag(bloco.conteudo) }}
                                </div>
                              }
                            }
                          </div>
                        </div>
                      }
                    </div>
                  </div>
                }
              </div>
            } @else {
              <!-- Tabela Semanal clássica -->
              <section class="card overflow-hidden">
                <div class="overflow-auto" style="max-height: calc(100vh - 260px)">
                  <table class="w-full border-separate border-spacing-0 text-left text-sm">
                    <thead class="sticky top-0 z-20">
                      <tr class="bg-red-700 text-white">
                        <th class="sticky left-0 z-30 bg-red-700 px-3 py-2">ESCALA SEMANAL</th>
                        <th class="px-3 py-2 text-center" [attr.colspan]="colunasVaga.length">{{ months[form.controls.mes.value-1] | uppercase }} {{ form.controls.ano.value }}</th>
                      </tr>
                      <tr class="bg-red-600 text-white">
                        <th class="sticky left-0 z-30 w-40 bg-red-600 px-3 py-2">Dia</th>
                        @for (col of colunasVaga; track col.funcao+'-'+col.posicao) { <th class="min-w-40 px-2 py-2 text-center">{{ col.rotulo }}</th> }
                      </tr>
                    </thead>
                    <tbody>
                      @for (l of linhasSemanal; track l.chave) {
                        @if (l.novaSemana) {
                          <tr class="bg-slate-50" data-separador-semana><td class="sticky left-0 bg-slate-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-400" [attr.colspan]="colunasVaga.length + 1">Semana {{ l.semana }}</td></tr>
                        }
                        <tr class="align-top" [class.hover:bg-violet-50/40]="!l.evento.referencia" [class.bg-slate-100]="l.evento.referencia" [class.text-slate-500]="l.evento.referencia"
                            [attr.data-referencia]="l.evento.referencia ? l.evento.data : null">
                          <td class="sticky left-0 z-10 border-b border-slate-200 px-3 py-2"
                              [class.bg-white]="!l.evento.referencia" [class.bg-slate-100]="l.evento.referencia"
                              [class.border-l-4]="l.evento.ocorrenciaNova || l.hoje" [class.border-l-amber-400]="l.evento.ocorrenciaNova" [class.border-l-violet-600]="l.hoje && !l.evento.ocorrenciaNova">
                            <div class="flex items-start justify-between gap-1">
                              <div>
                                <div class="font-black capitalize">{{ l.diaEData }}</div>
                                <div class="text-[11px] text-slate-500">{{ l.evento.horario.slice(0,5) }}@if (l.evento.celebracao && l.evento.celebracao !== 'Missa') { · <span class="font-bold text-red-700">{{ l.evento.celebracao }}</span> }</div>
                              </div>
                              @if (!readOnly) {
                                <button type="button" class="rounded px-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Editar dia" (click)="abrirEdicao(l, $event)" data-editar-dia>✎</button>
                              }
                            </div>
                            @if (l.evento.referencia) {
                              <div class="mt-1 rounded bg-slate-300 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-700" data-selo-referencia>
                                Referência de {{ mesDe(l.evento.data) }} — não entra na escala</div>
                            }
                            @if (l.evento.ocorrenciaNova) {
                              <div class="mt-1 text-[11px] font-bold text-amber-700">Dia a mais — preencher à mão</div>
                            }
                          </td>
                          @for (col of colunasVaga; track col.funcao+'-'+col.posicao) {
                            <td class="border-b border-slate-200 px-1.5 py-1.5">
                              @if (l.vagasPorColuna[col.funcao+'-'+col.posicao]; as slot) {
                                @if (readOnly) {
                                  <span class="block truncate rounded-lg px-2 py-1.5" [class.font-semibold]="!!slot.voluntario_id" [class.text-slate-400]="!slot.voluntario_id">{{ slot.voluntario?.nome_completo || '—' }}</span>
                                } @else {
                                  <div class="rounded-lg border border-transparent focus-within:border-[var(--brand)]" (dragover)="permitirArraste($event)" (drop)="soltarPessoa($event,l.evento,slot)"><app-volunteer-picker [remoto]="true" (voluntarioSelecionado)="lembrarOpcao($event)" [volunteers]="volunteers" [selectedId]="slot.voluntario_id" [excludeIds]="l.usados" (selectedIdChange)="selectVolunteer(l.evento, slot, $event)" />@if(pessoaArraste&&podeArrastar()){<button type="button" class="btn-secondary mt-1 text-xs" [disabled]="saving||arrasteOcupado" (click)="aplicarArraste(l.evento,slot)">Aplicar pessoa selecionada</button>}</div>
                                }
                              }
                            </td>
                          }
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </section>
            }
          </div>
        }

        <!-- Mensal: cartões por missa + painel "Ainda não escalados" -->
        @if (ehMensal) {
          <div class="grid gap-4" [class.lg:grid-cols-[1fr_20rem]]="!!apoio && painelDesktop">
            <section class="space-y-3">
              @for (l of linhas; track l.chave) {
                <div class="card overflow-visible border-l-4" [class.border-l-violet-400]="l.fimDeSemana === 'SAB'" [class.border-l-violet-700]="l.fimDeSemana === 'DOM'" [attr.data-evento]="l.evento.data">
                  <div class="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-2.5">
                    <div class="min-w-0 truncate font-black"><span class="capitalize">{{ l.diaEData }}</span> · {{ l.evento.horario.slice(0,5) }} ·
                      <span [class.text-red-700]="l.evento.celebracao !== 'Missa'">{{ l.evento.celebracao || 'Missa' }}</span></div>
                    <div class="flex shrink-0 items-center gap-2">
                      <span class="text-sm text-slate-500">{{ l.preenchidas }}/{{ l.evento.vagas.length }} vagas</span>
                      @if (!readOnly) {
                        <button type="button" class="rounded px-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700" title="Editar dia" (click)="abrirEdicao(l, $event)" data-editar-dia>✎</button>
                      }
                    </div>
                  </div>
                  <!-- Estrutura Visual idêntica à do Layout -->
                  <div class="space-y-3 p-3 bg-slate-50/40 rounded-b-2xl">
                    @for (linha of linhasCelebracaoLayout; track linha.index) {
                      <div class="p-3 rounded-xl border border-slate-200 bg-white shadow-2xs">
                        <div class="text-[11px] font-bold text-slate-400 mb-2 pb-1 border-b border-slate-100 flex items-center justify-between">
                          <span class="text-violet-700 font-extrabold uppercase tracking-wide">Linha {{ linha.index + 1 }} da Missa</span>
                        </div>
                        <div class="flex flex-wrap gap-2.5 items-stretch">
                          @for (bloco of linha.elementos; track bloco.idLocal || (bloco.funcao + '-' + bloco.posicao)) {
                            @if (bloco.tipo === 'VAGA' || (!bloco.tipo && bloco.funcao)) {
                              @let slot = l.vagasPorColuna[bloco.funcao + '-' + (bloco.posicao || 1)];
                              @if (slot) {
                                <div [style.flex]="bloco.largura === 12 ? '1 1 100%' : (bloco.largura || 1)"
                                     class="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all shadow-2xs min-w-[150px] flex flex-col justify-between">
                                  <div>
                                    <div class="flex items-center justify-between gap-1 text-[10px] font-black uppercase tracking-wider mb-1">
                                      <span class="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                                        {{ slot.funcao }}
                                      </span>
                                      <span class="text-slate-400">Posição {{ slot.posicao }}</span>
                                    </div>
                                    <div class="text-xs font-black text-slate-800 mb-1.5 truncate" title="{{ bloco.rotulo || l.rotulos[slot.funcao + '-' + slot.posicao] || slot.funcao }}">
                                      {{ bloco.rotulo || l.rotulos[slot.funcao + '-' + slot.posicao] || slot.funcao }}
                                    </div>
                                  </div>
                                  <div>
                                    @if (readOnly) {
                                      <span class="block truncate rounded-lg px-2 py-1.5 bg-white border border-slate-200 text-sm"
                                            [class.font-semibold]="!!slot.voluntario_id"
                                            [class.text-slate-400]="!slot.voluntario_id">
                                        {{ slot.voluntario?.nome_completo || '—' }}
                                      </span>
                                    } @else {
                                      <div class="rounded-lg border border-transparent focus-within:border-[var(--brand)]" (dragover)="permitirArraste($event)" (drop)="soltarPessoa($event,l.evento,slot)"><app-volunteer-picker [remoto]="true" (voluntarioSelecionado)="lembrarOpcao($event)" [volunteers]="volunteers" [selectedId]="slot.voluntario_id" [excludeIds]="l.usados" [marcadores]="l.marcadores"
                                        (selectedIdChange)="selectVolunteer(l.evento, slot, $event)" />@if(pessoaArraste&&podeArrastar()){<button type="button" class="btn-secondary mt-1 text-xs" [disabled]="saving||arrasteOcupado" (click)="aplicarArraste(l.evento,slot)">Aplicar pessoa selecionada</button>}</div>
                                    }
                                  </div>
                                </div>
                              }
                            } @else if (bloco.tipo === 'DATA') {
                              <div [style.flex]="bloco.largura === 12 ? '1 1 100%' : (bloco.largura || 1)"
                                   class="p-2.5 rounded-xl bg-violet-50 border border-violet-200 text-violet-950 flex items-center justify-between text-xs font-bold">
                                <span>📅 Data / Celebração: <strong class="capitalize">{{ l.diaEData }}</strong> · {{ l.evento.horario.slice(0,5) }}</span>
                                @if (l.evento.celebracao && l.evento.celebracao !== 'Missa') {
                                  <span class="text-red-700 font-extrabold uppercase px-1.5 py-0.5 rounded bg-red-100">{{ l.evento.celebracao }}</span>
                                }
                              </div>
                            } @else if (bloco.tipo === 'TEXTO_LIVRE') {
                              <div [style.flex]="bloco.largura === 12 ? '1 1 100%' : (bloco.largura || 1)"
                                   class="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs">
                                {{ resolverTextoTag(bloco.conteudo) }}
                              </div>
                            }
                          }
                        </div>
                      </div>
                    }
                  </div>
                  @if (sugestaoIrmao && sugestaoIrmao.chave === l.chave) {
                    <div class="mx-3 mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-violet-50 px-3 py-2 text-sm" data-sugestao-irmao>
                      <span>👨‍👩‍👧 {{ sugestaoIrmao.nomePessoa }} tem irmão: {{ sugestaoIrmao.nomeIrmao }}.</span>
                      <div class="flex gap-2">
                        <button type="button" class="btn-secondary !px-3 !py-1 text-xs" [disabled]="!vagaLivre(l.evento)"
                                [title]="vagaLivre(l.evento) ? '' : 'Sem vaga livre nesta missa'" (click)="colocarIrmao(l.evento)" data-colocar-irmao>Colocar {{ sugestaoIrmao.nomeIrmao }} também</button>
                        <button type="button" class="text-xs text-slate-500 hover:underline" (click)="sugestaoIrmao = null">Agora não</button>
                      </div>
                    </div>
                  }
                </div>
              }
            </section>
            @if (apoio) {
              <div class="lg:block" [class.hidden]="!painelAberto">
                <div class="mb-2 hidden justify-end lg:flex">
                  <button type="button" class="text-xs font-semibold text-slate-500 hover:underline" (click)="alternarPainelDesktop()">{{ painelDesktop ? 'Recolher painel ›' : '‹ Ainda não escalados' }}</button>
                </div>
                @if (painelDesktop || painelAberto) {
                  <app-ainda-nao-escalados [parcial]="true" [apoio]="apoio" [volunteers]="volunteers" [eventos]="events" [revisao]="revisao" />
                }
              </div>
            }
          </div>
        }

        @if (!events.length) {
          <div class="card p-8 text-center text-slate-500">Nenhum evento foi gerado. Confira ano, mês e modelo.</div>
        }
        @if (error) {
          <div class="rounded-xl bg-red-50 p-4 text-red-700">{{ error }}</div>
        }

        <!-- Rodapé da escala (no final da página, não fica flutuando) -->
        <div class="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div class="min-w-48 flex-1">
            <div class="text-sm text-slate-600"><strong>{{ preenchidas }}</strong> de <strong>{{ total }}</strong> vagas</div>
            <div class="mt-1 h-2 max-w-md overflow-hidden rounded-full bg-slate-100" role="progressbar" [attr.aria-valuenow]="progresso" aria-valuemin="0" aria-valuemax="100">
              <div class="h-full transition-all" [class.bg-emerald-500]="progresso === 100" [class.bg-violet-600]="progresso < 100" [style.width.%]="progresso"></div>
            </div>
          </div>
          <div class="flex flex-wrap items-center justify-end gap-2">
            @if (status==='RASCUNHO') {
              <button class="btn-primary" type="button" [disabled]="saving || form.invalid" (click)="saveDraft()">{{ saving ? 'Salvando...' : 'Salvar rascunho' }}</button>
              <button class="btn-primary !bg-emerald-600 hover:!bg-emerald-700" type="button" [disabled]="saving || form.invalid" (click)="finalize()">Finalizar escala</button>
            }
            @if (temAcoesExtras) {
              <button type="button" class="btn-secondary !px-3" title="Mais ações" (click)="abrirMenu($event)" data-mais-acoes>⋯</button>
            }
          </div>
        </div>
      }
    </div>

    <!-- Botões flutuantes de navegação rápida (Topo / Fim da página) -->
    <aside aria-label="Navegação rápida pela página" class="fixed bottom-6 right-6 z-30 flex flex-col gap-2 rounded-2xl p-1.5 bg-white/90 backdrop-blur border border-slate-200 shadow-md">
      <button type="button"
              class="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-all cursor-pointer shadow-2xs"
              (click)="rolarParaTopo()"
              title="Ir para o início da página">
        <span class="text-xs font-black">▲</span>
      </button>
      <button type="button"
              class="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-900 transition-all cursor-pointer shadow-2xs"
              (click)="rolarParaFinal()"
              title="Ir para o final da página (Salvar / Finalizar)">
        <span class="text-xs font-black">▼</span>
      </button>
    </aside>

    <!-- Mini-painéis (o fundo transparente fecha; nenhum listener global) -->
    @if (painelAtivo) {
      <div class="fixed inset-0 z-40" (click)="fecharPaineis()"></div>
      <div class="card fixed z-50 w-72 p-3 shadow-xl" [style.top.px]="painelAtivo.top" [style.left.px]="painelAtivo.left" role="dialog">
        @if (edicao) {
          <p class="mb-2 text-sm font-black">{{ edicao.dataLonga }}</p>
          <label class="label">Horário</label>
          <input class="field mb-2" type="time" [value]="edicao.evento.horario.slice(0,5)" (change)="changeTime(edicao.evento, $event)">
          <label class="label">Celebração</label>
          <input class="field mb-3" list="celebracoes-sugeridas" [value]="edicao.evento.celebracao" (change)="changeCelebration(edicao.evento, $event)">
          <div class="flex justify-between gap-2">
            @if (edicao.evento.referencia) {
              <button type="button" class="text-sm font-bold text-red-600 hover:underline" (click)="apagarReferencia(edicao.evento)">Apagar referência</button>
            } @else {
              <button type="button" class="text-sm font-bold text-red-600 hover:underline" (click)="removeDay(edicao.evento)">Excluir dia</button>
            }
            <button type="button" class="btn-secondary !px-3 !py-1 text-sm" (click)="fecharPaineis()">Pronto</button>
          </div>
        }
        @if (novoDiaAberto) {
          <p class="mb-2 text-sm font-black">Adicionar um dia</p>
          <label class="label">Data</label>
          <app-campo-data [ngModel]="addDate" (ngModelChange)="addDate = $event" [limpavel]="false" />
          <label class="label mt-2">Horário</label>
          <input class="field" type="time" [value]="addTime" (change)="setAddTime($event)">
          <label class="label mt-2">Celebração</label>
          <input class="field mb-3" list="celebracoes-sugeridas" [value]="addCelebration" (input)="setAddCelebration($event)" placeholder="Ex.: Missa, Páscoa">
          <button class="btn-primary w-full" type="button" (click)="addDay(); fecharPaineis()">＋ Adicionar dia</button>
        }
        @if (menuAberto) {
          <div class="flex flex-col text-sm">
            @if (status==='RASCUNHO') { <button type="button" class="rounded px-2 py-2 text-left hover:bg-slate-50" (click)="fecharPaineis(); regenerate()">Recriar grade</button> }
            @if (currentDetail?.tipo==='SEMANAL' && status!=='CANCELADA') { <button type="button" class="rounded px-2 py-2 text-left hover:bg-slate-50" (click)="fecharPaineis(); replicarAberto = true" data-replicar-mes>Replicar para outro mês</button> }
            @if (id && status==='FINALIZADA') { <button type="button" class="rounded px-2 py-2 text-left hover:bg-slate-50" (click)="fecharPaineis(); reopen()">Reabrir como rascunho</button> }
            @if (id && status==='CANCELADA') { <button type="button" class="rounded px-2 py-2 text-left hover:bg-slate-50" (click)="fecharPaineis(); reopen()">Restaurar como rascunho</button> }
            @if (id && status!=='CANCELADA') { <button type="button" class="rounded px-2 py-2 text-left font-semibold text-red-600 hover:bg-red-50" (click)="fecharPaineis(); cancelScale()">Cancelar escala</button> }
            @if (id && status==='CANCELADA') { <button type="button" class="rounded px-2 py-2 text-left font-semibold text-red-600 hover:bg-red-50" (click)="fecharPaineis(); remove()">Excluir definitivamente</button> }
          </div>
        }
      </div>
    }
    <datalist id="celebracoes-sugeridas">@for (t of celebrationOptions; track t) { <option [value]="t"></option> }</datalist>
    <app-replicar-dialog [open]="replicarAberto" [origem]="currentDetail" (fechar)="replicarAberto = false" />
    `
})
export class EscalaBuilderComponent implements OnInit, HasPendingChanges {
  id: string | null = null;
  months = MESES;
  volunteers: Voluntario[] = [];
  status: StatusEscala = 'RASCUNHO';
  loading = true; saving = false; error = ''; saved = false; eventsDirty = false;
  addDate = '';
  addTime = '19:00';
  addCelebration = 'Missa';
  celebrationOptions = TITULOS_CELEBRACAO;
  currentDetail: EscalaDetalhe | null = null;
  replicarAberto = false;
  observacaoAberta = false;
  layouts: LayoutEscala[] = [];
  readonly esqueleto = [1, 2, 3, 4, 5, 6];
  colunas: ColunaEscala[] = [...COLUNAS_PADRAO_SEMANAL];
  /** Só as vagas do layout — Título, Subtítulo e Textos não viram coluna da grade. */
  get colunasVaga() { return vagasDoLayout(this.colunas); }

  // ---- Modelo de tela pré-calculado (PLANO-008)
  linhas: Linha[] = [];
  linhasSemanal: Linha[] = [];
  preenchidas = 0;
  total = 0;
  referenciasCount = 0;
  revisao = 0;

  // ---- Apoio à mensal (PLANO-007)
  apoio: ApoioEscala | null = null;
  sugestaoIrmao: { chave: string; irmaoId: string; nomeIrmao: string; nomePessoa: string } | null = null;
  painelAberto = false;
  painelDesktop = true;
  modoSemanal: 'CARTOES' | 'TABELA' = 'CARTOES';

  // ---- Mini-painéis
  painelAtivo: Painel | null = null;
  edicao: Linha | null = null;
  novoDiaAberto = false;
  menuAberto = false;

  private _events: EscalaEvento[] = [];

  form = this.fb.nonNullable.group({
    titulo: ['', Validators.required],
    tipo: ['MENSAL' as TipoEscala, Validators.required],
    layoutId: [null as string | null],
    ano: [new Date().getFullYear(), [Validators.required, Validators.min(2020)]],
    mes: [new Date().getMonth()+1, [Validators.required, Validators.min(1), Validators.max(12)]],
    observacao: ['']
  });

  get events(): EscalaEvento[] { return this._events; }
  /** Trocar os eventos recalcula as linhas da grade. */
  set events(valor: EscalaEvento[]) { this._events = valor; this.recalcular(); }

  get readOnly() { return this.status !== 'RASCUNHO'; }
  /** Numa escala já salva, modelo/ano/mês não mudam pela tela (apagaria a grade); para outro mês existe o Replicar. */
  get metaTravada() { return this.readOnly || !!this.id; }
  /** Só layouts ativos do modelo; o já escolhido numa escala existente fica mesmo se foi inativado depois. */
  get layoutsFiltrados() {
    const atual = this.form.controls.layoutId.value;
    return this.layouts.filter(l => l.tipo === this.form.controls.tipo.value && (l.ativo || l.id === atual));
  }
  get ehMensal() { return this.form.controls.tipo.value === 'MENSAL'; }
  get progresso() { return this.total ? Math.round((this.preenchidas / this.total) * 100) : 0; }
  get pendentes() { return this.apoio?.voluntarios.filter(v => v.situacao === 'PENDENTE').length ?? 0; }
  get temAcoesExtras() { return this.status === 'RASCUNHO' || !!this.id; }

  private dialogo = inject(DialogoService);
  private authService = inject(AuthService);
  private notificacoes = inject(NotificacoesApiService);
  avisando = false;

  /** Enfileira a escala finalizada para cada pessoa escalada com contato (e, no WhatsApp, autorização). */
  async avisarEscalados(canal: CanalNotificacao) {
    if (!this.id || this.avisando) return;
    const nome = canal === 'EMAIL' ? 'e-mail' : 'WhatsApp';
    if (!await this.dialogo.confirmar({ mensagem: `Avisar por ${nome} cada pessoa escalada? As mensagens entram na fila de comunicados e esta versão da escala não é avisada de novo por este canal.`, confirmar: 'Avisar' })) return;
    this.avisando = true;
    try {
      const r = await firstValueFrom(this.notificacoes.notificarEscala(this.id, canal));
      await this.dialogo.avisar(`${r.total} mensagens na fila.${r.ignorados ? ` ${r.ignorados} pessoas sem contato ou autorização foram ignoradas.` : ''}`, 'Escalados avisados');
    } catch (e) {
      await this.dialogo.avisar(mensagemApi(e, 'Não foi possível avisar os escalados.'));
    } finally {
      this.avisando = false;
    }
  }
  readonly sessaoRespostas = inject(SessaoAtual);

  get linhasCelebracaoLayout(): { index: number; elementos: ColunaEscala[] }[] {
    const celBlocos = (this.colunas || []).filter(c => (c.escopo || 'CELEBRACAO') === 'CELEBRACAO');
    const temLinhas = celBlocos.some(c => c.linha !== undefined);
    if (!temLinhas) {
      const vagas = vagasDoLayout(this.colunas);
      if (!vagas.length) return [];
      const res: { index: number; elementos: ColunaEscala[] }[] = [];
      res.push({ index: 0, elementos: [{ tipo: 'DATA', escopo: 'CELEBRACAO', linha: 0, coluna: 0, largura: 12, conteudo: '#DATA_HORA#' }] });
      let lin = 1;
      for (let i = 0; i < vagas.length; i += 3) {
        const pedaco = vagas.slice(i, i + 3).map((v, col) => ({
          ...v,
          tipo: 'VAGA' as const,
          escopo: 'CELEBRACAO' as const,
          linha: lin,
          coluna: col,
          largura: 1
        }));
        res.push({ index: lin, elementos: pedaco });
        lin++;
      }
      return res;
    }
    const maxLinha = celBlocos.reduce((max, e) => Math.max(max, e.linha || 0), -1);
    const result: { index: number; elementos: ColunaEscala[] }[] = [];
    for (let i = 0; i <= maxLinha; i++) {
      const els = celBlocos.filter(e => (e.linha || 0) === i).sort((a, b) => (a.coluna || 0) - (b.coluna || 0));
      if (els.length > 0) result.push({ index: i, elementos: els });
    }
    return result;
  }

  get textosCabecalho(): ColunaEscala[] {
    return (this.colunas || [])
      .filter(c => c.escopo === 'DOCUMENTO' && c.tipo && c.tipo !== 'VAGA')
      .sort((a, b) => (a.linha || 0) - (b.linha || 0) || (a.coluna || 0) - (b.coluna || 0));
  }

  getAlignClass(align?: string) {
    if (align === 'center') return 'text-center';
    if (align === 'right') return 'text-right';
    return 'text-left';
  }

  resolverTextoTag(texto?: string): string {
    const { titulo, mes, ano } = this.form.getRawValue();
    const paroquia = this.authService.tenantNome() || 'Paróquia';
    const mesAno = `${MESES[mes - 1]} ${ano}`;
    return (texto || '')
      .replaceAll('#TITULO_ESCALA#', titulo || '')
      .replaceAll('#MES_ANO#', mesAno)
      .replaceAll('#PAROQUIA#', paroquia);
  }

  constructor(private fb: FormBuilder, private route: ActivatedRoute, private router: Router, private service: EscalasService, private volunteersService: VoluntariosService, private exporter: ExportService, private layoutsService: LayoutsEscalaService) {}

  async ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');
    try {
      this.painelDesktop = localStorage.getItem(CHAVE_PAINEL) !== 'recolhido';
    } catch { /* sem localStorage: painel aberto */ }
    try {

      await this.carregarArraste();
      this.layouts = await this.layoutsService.listar();


      if (this.id) {
        const d = await this.service.getById(this.id); this.currentDetail = d; this.status = d.status;
        this.form.setValue({ titulo:d.titulo, tipo:d.tipo, ano:d.ano, mes:d.mes, observacao:d.observacao||'', layoutId: d.layoutId || null });
        this.colunas = d.colunas || [];
        if ((!this.colunas || !this.colunas.length) && d.layoutId) {
          const l = this.layouts.find(x => x.id === d.layoutId);
          if (l) this.colunas = l.colunas;
        }
        if (!this.colunas || !this.colunas.length) {
          this.atualizarColunasNovo();
        }

        this.observacaoAberta = !!d.observacao;
        this.events = d.eventos.map(e => ({...e, vagas:e.vagas.map(v=>({...v}))}));
        if (this.status !== 'RASCUNHO') this.form.disable({ emitEvent: false });
        if (d.tipo === 'MENSAL') await this.carregarApoio();

      } else {
        const type = this.form.controls.tipo.value; const year=this.form.controls.ano.value; const month=this.form.controls.mes.value;
        this.form.controls.titulo.setValue(`Escala ${type==='SEMANAL'?'Semanal':'Mensal'} - ${MESES[month-1]} ${year}`);
        this.atualizarColunasNovo();
        this.events = this.service.buildDefaultEvents(type, year, month, (vagasDoLayout(this.colunas) as any));
      }

      const ids=this.events.flatMap(e=>e.vagas.flatMap(v=>v.voluntario_id?[v.voluntario_id]:[]));
      const irmaos=(this.apoio?.voluntarios??[]).filter(v=>ids.includes(v.voluntarioId)).flatMap(v=>v.irmaos);
      for(const v of await this.volunteersService.resolverOpcoes([...ids,...irmaos]))this.lembrarVoluntario(v);
      this.form.markAsPristine(); this.eventsDirty=false;
      this.syncAddDate();
    } catch(e:any){this.error=e?.message||'Erro ao carregar a tela de escala.';}
    finally{this.loading=false;}
  }

  private async carregarApoio() {
    if (!this.id) return;
    try {
      this.apoio = await this.service.apoio(this.id);
      this.recalcular();
    } catch {
      this.apoio = null;
    }
  }

  // ---- Linhas da grade

  /** Recalcula as linhas (textos, vagas por coluna, usados, marcadores e contagens). Só quando os eventos mudam. */
  recalcular() {
    const anterior = new Map(this.linhas.map(l => [l.chave, l]));
    const hoje = new Date();
    const hojeIso = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
    const { ano, mes } = this.form.getRawValue();
    const primeiroSeg = (new Date(ano, mes - 1, 1).getDay() + 6) % 7;
    const vezes = this.vezesNoMes();
    const nomes = new Map(this.volunteers.map(v => [v.id, v.nome_completo]));
    let preenchidas = 0; let total = 0; let refs = 0;
    const repetidas = new Map<string, number>();
    this.linhas = this._events.map(evento => {
      const base = `${evento.data}|${evento.horario}${evento.referencia ? '|ref' : ''}`;
      const n = repetidas.get(base) ?? 0;
      repetidas.set(base, n + 1);
      const chave = n ? `${base}|${n}` : base;
      const vagasPorColuna: Record<string, EscalaVaga> = {};
      const rotulos: Record<string, string> = {};
      const usados = new Set<string>();
      let cheias = 0;
      for (const v of evento.vagas) {
        vagasPorColuna[`${v.funcao}-${v.posicao}`] = v;
        rotulos[`${v.funcao}-${v.posicao}`] = this.funcaoLabel(v.funcao) + this.multiLabel(evento, v);
        if (v.voluntario_id) { usados.add(v.voluntario_id); cheias++; }
      }
      if (evento.referencia) refs++; else { preenchidas += cheias; total += evento.vagas.length; }
      const dia = Number(evento.data.slice(8, 10));
      const doMes = Number(evento.data.slice(0, 4)) === ano && Number(evento.data.slice(5, 7)) === mes;
      const dow = new Date(`${evento.data}T12:00:00`).getDay();
      // Mantém o mesmo Set quando os usados não mudaram: o seletor não refaz nada.
      const velho = anterior.get(chave);
      const mesmos = !!velho && velho.usados.size === usados.size && [...usados].every(u => velho.usados.has(u));
      const linha: Linha = {
        evento, chave,
        diaEData: diaEData(evento.data), dataLonga: dataLonga(evento.data), diaSemana: diaDaSemana(evento.data),
        semana: doMes && !evento.referencia ? Math.floor((dia - 1 + primeiroSeg) / 7) + 1 : 0,
        novaSemana: false,
        hoje: evento.data === hojeIso,
        fimDeSemana: dow === 6 ? 'SAB' : dow === 0 ? 'DOM' : null,
        vagasPorColuna,
        rotulos,
        usados: mesmos ? velho!.usados : usados,
        marcadores: this.marcadoresDo(evento, usados, vezes, nomes),
        preenchidas: cheias
      };
      return linha;
    });
    const refsPrimeiro = [...this.linhas.filter(l => l.evento.referencia), ...this.linhas.filter(l => !l.evento.referencia)];
    let semanaAnterior = 0;
    for (const l of refsPrimeiro) {
      l.novaSemana = l.semana > 1 && semanaAnterior > 0 && l.semana !== semanaAnterior;
      if (l.semana) semanaAnterior = l.semana;
    }
    this.linhasSemanal = refsPrimeiro;
    this.preenchidas = preenchidas;
    this.total = total;
    this.referenciasCount = refs;
    this.revisao++;
  }

  /** Quantas vagas reais (não referência) de cada pessoa há no rascunho atual. */
  private vezesNoMes(): Map<string, number> {
    const m = new Map<string, number>();
    for (const e of this._events) {
      if (e.referencia) continue;
      for (const v of e.vagas) if (v.voluntario_id) m.set(v.voluntario_id, (m.get(v.voluntario_id) ?? 0) + 1);
    }
    return m;
  }

  /** Marcas da mensal (PLANO-007): ⛔ indisponível na data/horário, "N× no mês" e irmão já nesta missa. */
  private marcadoresDo(evento: EscalaEvento, usados: Set<string>, vezes: Map<string, number>, nomes: Map<string, string>): Marcadores | null {
    if (!this.apoio || this.form.controls.tipo.value !== 'MENSAL') return null;
    const m: Marcadores = {};
    for (const v of this.apoio.voluntarios) {
      const indisponivel = indisponivelEm(this.apoio, v.voluntarioId, evento.data, evento.horario);
      const irmao = v.irmaos.find(i => usados.has(i));
      const n = vezes.get(v.voluntarioId) ?? 0;
      if (indisponivel || irmao || n) {
        m[v.voluntarioId] = { indisponivel, vezesNoMes: n || undefined, irmaoNaMissa: irmao ? nomes.get(irmao) : undefined };
      }
    }
    return m;
  }

  // ---- Ações da grade


  async metaChanged() {
    if (this.metaTravada) return;
    this.form.markAsDirty();
    const { tipo, ano, mes } = this.form.getRawValue();
    this.atualizarColunasNovo();

    if (!this.id && !this.eventsDirty) {
      this.events = this.service.buildDefaultEvents(tipo, ano, mes, (vagasDoLayout(this.colunas) as any));
      this.form.controls.titulo.setValue(`Escala ${tipo === 'SEMANAL' ? 'Semanal' : 'Mensal'} - ${MESES[mes - 1]} ${ano}`);
    } else {
      this.adaptarVagasDosEventos();
    }
    this.syncAddDate();
  }

  private atualizarColunasNovo() {
    const { tipo, layoutId } = this.form.getRawValue();
    if (layoutId) {
      const l = this.layouts.find(x => x.id === layoutId);
      if (l && vagasDoLayout(l.colunas).length) {
        this.colunas = l.colunas || [];
        return;
      }
    }
    const padrao = this.layouts.find(x => x.tipo === tipo && x.padrao && x.ativo)
      ?? this.layouts.find(x => x.tipo === tipo && x.sistema && x.ativo);
    this.colunas = padrao ? padrao.colunas : (tipo === 'MENSAL' ? COLUNAS_PADRAO_MENSAL : COLUNAS_PADRAO_SEMANAL);
  }

  private adaptarVagasDosEventos() {
    const layoutVagas = vagasDoLayout(this.colunas);
    this._events = this._events.map(e => {
      const novasVagas: EscalaVaga[] = layoutVagas.map(lv => {
        const existente = e.vagas.find(v => v.funcao === lv.funcao && v.posicao === (lv.posicao || 1));
        return {
          funcao: lv.funcao!,
          posicao: lv.posicao || 1,
          voluntario_id: existente?.voluntario_id || null,
          voluntario: existente?.voluntario || null
        };
      });
      return { ...e, vagas: novasVagas };
    });
    this.recalcular();
  }



  rolarParaTopo(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  rolarParaFinal(): void {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  }

  async gerarEstrutura() {
    if (this.readOnly) return;
    const filled = this.filledCount();
    if (filled > 0) {
      const sim = await this.dialogo.confirmar({
        titulo: 'Gerar dias da escala?',
        mensagem: `A grade já possui ${filled} vaga(s) preenchida(s). Gerar os dias novamente irá recriar as celebrações com o layout selecionado. Deseja continuar?`,
        confirmar: 'Sim, gerar',
        perigo: true
      });
      if (!sim) return;
    }
    const { tipo, ano, mes, layoutId } = this.form.getRawValue();
    this.atualizarColunasNovo();
    this.events = this.service.buildDefaultEvents(tipo, ano, mes, vagasDoLayout(this.colunas) as any);
    this.form.controls.titulo.setValue(`Escala ${tipo === 'SEMANAL' ? 'Semanal' : 'Mensal'} - ${MESES[mes - 1]} ${ano}`);
    this.eventsDirty = true;
    this.syncAddDate();
    const lNome = layoutId ? this.layouts.find(x => x.id === layoutId)?.nome : 'Padrão';
    this.dialogo.avisar(`Dias e estrutura gerados com sucesso para ${MESES[mes - 1]}/${ano} com o layout "${lNome}"!`, 'success');
  }

  async regenerate() {
    if (this.readOnly) return;
    const filled=this.filledCount();
    if (filled && !await this.dialogo.confirmar({ titulo: 'Recriar a grade?', mensagem: `A grade possui ${filled} vaga(s) preenchida(s). Recriar a grade apagará essas seleções.`, confirmar: 'Recriar', perigo: true })) return;
    const {tipo,ano,mes}=this.form.getRawValue(); this.atualizarColunasNovo(); this.events=this.service.buildDefaultEvents(tipo,ano,mes, (vagasDoLayout(this.colunas) as any)); this.eventsDirty=true;
  }


  paginaArraste=0;maisArraste=false;buscandoArraste=false;erroArraste='';private rodadaArraste=0;private timerArraste?:ReturnType<typeof setTimeout>;
  private destruidoSeletores=false;
  ngOnDestroy(){this.destruidoSeletores=true;this.rodadaArraste++;clearTimeout(this.timerArraste);}
  lembrarVoluntario(v:Voluntario){this.volunteers=[...this.volunteers.filter(x=>x.id!==v.id),v];this.recalcular();}
  lembrarOpcao(v:Voluntario){this.lembrarVoluntario(v);const ids=this.apoio?.voluntarios.find(x=>x.voluntarioId===v.id)?.irmaos??[];if(!ids.length)return;
    void this.volunteersService.resolverOpcoes(ids).then(rows=>{if(this.destruidoSeletores)return;for(const r of rows)this.lembrarVoluntario(r);const evento=this.events.find(e=>e.vagas.some(s=>s.voluntario_id===v.id));if(evento)this.sugerirIrmao(evento,v.id);}).catch(()=>{this.avisoArraste='Não foi possível consultar irmãos desta pessoa.';});
  }
  buscarArraste(){clearTimeout(this.timerArraste);this.rodadaArraste++;this.pessoasArraste=[];this.timerArraste=setTimeout(()=>{this.paginaArraste=0;void this.carregarArraste();},300);}
  paginarArraste(d:number){if(this.buscandoArraste||this.paginaArraste+d<0||d>0&&!this.maisArraste)return;this.paginaArraste+=d;void this.carregarArraste();}
  async carregarArraste(){const rodada=++this.rodadaArraste;this.buscandoArraste=true;this.erroArraste='';
    try{const r=await firstValueFrom(this.volunteersService.opcoes(this.buscaArraste,this.paginaArraste));if(this.destruidoSeletores||rodada!==this.rodadaArraste)return;
      const selecionados=new Set(this.events.flatMap(e=>e.vagas.flatMap(v=>v.voluntario_id?[v.voluntario_id]:[])));
      for(const a of this.apoio?.voluntarios??[])if(selecionados.has(a.voluntarioId))for(const id of a.irmaos)selecionados.add(id);
      this.volunteers=this.volunteers.filter(v=>selecionados.has(v.id)||v.id===this.pessoaArraste);for(const v of r.itens)this.lembrarVoluntario(v);this.pessoasArraste=r.itens;this.maisArraste=r.temMais;
    }catch{if(rodada===this.rodadaArraste){this.pessoasArraste=[];this.maisArraste=false;this.erroArraste='Busca indisponível. Tente novamente.';}}
    finally{if(rodada===this.rodadaArraste)this.buscandoArraste=false;}
  }
  buscaArraste='';pessoasArraste:Voluntario[]=[];pessoaArraste:string|null=null;avisoArraste='';arrasteOcupado=false;private arrastada:string|null=null;
  podeArrastar(){return this.sessaoRespostas.permissoes().includes(this.id?'ESCALA_ALTERAR':'ESCALA_CRIAR');}
  filtrarArraste(){const q=this.buscaArraste.trim().toLocaleLowerCase('pt-BR');this.pessoasArraste=this.volunteers.filter(v=>v.ativo&&v.nome_completo.toLocaleLowerCase('pt-BR').includes(q)).slice(0,30);}
  iniciarArraste(e:DragEvent,id:string){if(this.readOnly||this.saving||this.arrasteOcupado||!this.podeArrastar()||!this.volunteers.some(v=>v.id===id&&v.ativo)){e.preventDefault();return;}this.arrastada=id;this.pessoaArraste=id;e.dataTransfer?.setData('application/x-servirea-voluntario',id);if(e.dataTransfer)e.dataTransfer.effectAllowed='copy';}
  encerrarArraste(){this.arrastada=null;}
  permitirArraste(e:DragEvent){if(this.arrastada&&!this.readOnly&&!this.saving&&this.podeArrastar())e.preventDefault();}
  soltarPessoa(e:DragEvent,event:EscalaEvento,slot:EscalaVaga){e.preventDefault();const id=this.arrastada;this.arrastada=null;if(!id||e.dataTransfer?.getData('application/x-servirea-voluntario')!==id)return;this.pessoaArraste=id;void this.aplicarArraste(event,slot);}
  private impedimentoArraste(event:EscalaEvento,slot:EscalaVaga,id:string):string|null{
    if(this.readOnly||this.saving||!this.podeArrastar())return 'A escala não está disponível para edição.';
    if(!this.events.includes(event)||!event.vagas.includes(slot)||event.referencia)return 'Escolha uma vaga deste rascunho, sem referência.';
    const v=this.volunteers.find(v=>v.id===id);if(!v?.ativo)return 'Voluntário não está ativo.';
    if(!v.funcoes_habilitadas?.includes(slot.funcao))return 'Voluntário não está habilitado para esta função.';
    if(this.usedIds(event,slot.voluntario_id).includes(id))return 'Esta pessoa já está alocada em outra função nesta mesma missa.';
    if(indisponivelEm(this.apoio,id,event.data,event.horario))return 'A pessoa informou indisponibilidade nesta data e período.';
    if(this.events.some(e=>e!==event&&!e.referencia&&e.data===event.data&&e.horario.slice(0,5)===event.horario.slice(0,5)&&e.vagas.some(v=>v.voluntario_id===id)))return 'A pessoa já está em outra celebração deste rascunho no mesmo horário.';
    return null;
  }
  async aplicarArraste(event:EscalaEvento,slot:EscalaVaga){const id=this.pessoaArraste;if(!id||this.arrasteOcupado)return;let erro=this.impedimentoArraste(event,slot,id);if(erro){this.avisoArraste=erro;return;}if(slot.voluntario_id===id)return;
    this.arrasteOcupado=true;const anterior=slot.voluntario_id;
    try{if(anterior&&!await this.dialogo.confirmar({mensagem:'Substituir a pessoa desta vaga no rascunho?',confirmar:'Substituir'}))return;
      erro=this.impedimentoArraste(event,slot,id);if(erro||slot.voluntario_id!==anterior){this.avisoArraste=erro||'A vaga mudou. Confira novamente.';return;}
      this.selectVolunteer(event,slot,id);this.avisoArraste='Pessoa alocada no rascunho. Salve para registrar.';this.pessoaArraste=null;
    }finally{this.arrasteOcupado=false;}
  }
  selectVolunteer(event: EscalaEvento, slot: EscalaVaga, id: string | null) {
    if (id && this.usedIds(event, slot.voluntario_id).includes(id)) { void this.dialogo.avisar('Esta pessoa já está alocada em outra função nesta mesma missa.'); return; }
    slot.voluntario_id=id; slot.voluntario=id?this.volunteers.find(v=>v.id===id)||null:null; this.eventsDirty=true;
    this.recalcular();
    this.sugerirIrmao(event, id);
  }

  /** Irmão fora desta missa: só sugere, com botão; nunca coloca sozinho. */
  private sugerirIrmao(event: EscalaEvento, id: string | null) {
    this.sugestaoIrmao = null;
    if (!id || !this.apoio) return;
    const irmaos = this.apoio.voluntarios.find(v => v.voluntarioId === id)?.irmaos ?? [];
    const usados = new Set(event.vagas.map(v => v.voluntario_id).filter(Boolean));
    const fora = irmaos.find(i => !usados.has(i) && this.volunteers.some(v => v.id === i));
    if (!fora) return;
    this.sugestaoIrmao = {
      chave: this.linhas.find(l => l.evento === event)?.chave ?? '',
      irmaoId: fora,
      nomeIrmao: this.volunteers.find(v => v.id === fora)?.nome_completo ?? '',
      nomePessoa: this.volunteers.find(v => v.id === id)?.nome_completo ?? ''
    };
  }

  /** Primeira vaga livre do evento, na ordem das colunas. */
  vagaLivre(event: EscalaEvento): EscalaVaga | null {
    return event.vagas.find(v => !v.voluntario_id) ?? null;
  }

  colocarIrmao(event: EscalaEvento) {
    const s = this.sugestaoIrmao;
    const vaga = this.vagaLivre(event);
    if (!s || !vaga) return;
    this.sugestaoIrmao = null;
    this.selectVolunteer(event, vaga, s.irmaoId);
  }

  usedIds(event: EscalaEvento, current: string | null) { return event.vagas.map(v=>v.voluntario_id).filter((x):x is string=>!!x && x!==current); }
  changeTime(e: EscalaEvento, ev: Event){e.horario=(ev.target as HTMLInputElement).value;this.eventsDirty=true;this.recalcular();}
  changeCelebration(e: EscalaEvento, ev: Event){e.celebracao=(ev.target as HTMLInputElement).value;this.eventsDirty=true;this.recalcular();}
  setAddTime(ev: Event){this.addTime=(ev.target as HTMLInputElement).value;}
  setAddCelebration(ev: Event){this.addCelebration=(ev.target as HTMLInputElement).value;}

  addDay() {
    if (this.readOnly) return;
    if (!this.addDate || !this.addTime) { void this.dialogo.avisar('Informe a data e o horário.'); return; }
    const time = this.addTime.slice(0, 5);
    if (this.events.some(e => e.data === this.addDate && e.horario.slice(0, 5) === time)) {
      void this.dialogo.avisar('Já existe uma celebração neste dia e horário.');
      return;
    }
    const { tipo } = this.form.getRawValue();
    this.events = [...this.events, this.service.createEvent(tipo, this.addDate, time, this.addCelebration || 'Missa', (vagasDoLayout(this.colunas) as any))]
      .sort((a, b) => `${a.data} ${a.horario}`.localeCompare(`${b.data} ${b.horario}`));
    this.eventsDirty = true;
  }

  async removeDay(event: EscalaEvento) {
    if (this.readOnly) return;
    this.fecharPaineis();
    if (!await this.dialogo.confirmar({ titulo: 'Excluir celebração?', mensagem: `Excluir ${this.date(event.data)} às ${event.horario.slice(0, 5)} (${event.celebracao}) desta escala?`, confirmar: 'Excluir', perigo: true })) return;
    this.events = this.events.filter(e => e !== event);
    this.eventsDirty = true;
  }

  apagarReferencia(event: EscalaEvento) {
    this.fecharPaineis();
    this.events = this.events.filter(e => e !== event);
    this.eventsDirty = true;
  }

  private syncAddDate() {
    const { ano, mes } = this.form.getRawValue();
    this.addDate = `${ano}-${String(mes).padStart(2, '0')}-01`;
  }

  // ---- Mini-painéis e painel lateral

  private posicao(evento: Event): Painel {
    const r = (evento.currentTarget as HTMLElement).getBoundingClientRect();
    const left = Math.max(8, Math.min(r.left, window.innerWidth - 300));
    const top = r.bottom + 330 > window.innerHeight ? Math.max(8, r.top - 330) : r.bottom + 4;
    return { top, left };
  }

  abrirEdicao(linha: Linha, evento: Event) { this.fecharPaineis(); this.edicao = linha; this.painelAtivo = this.posicao(evento); }
  abrirNovoDia(evento: Event) { this.fecharPaineis(); this.novoDiaAberto = true; this.painelAtivo = this.posicao(evento); }
  abrirMenu(evento: Event) {
    this.fecharPaineis();
    this.menuAberto = true;
    const p = this.posicao(evento);
    this.painelAtivo = { top: Math.max(8, p.top - 230), left: Math.max(8, p.left - 230) };
  }
  fecharPaineis() { this.painelAtivo = null; this.edicao = null; this.novoDiaAberto = false; this.menuAberto = false; }

  alternarPainelDesktop() {
    this.painelDesktop = !this.painelDesktop;
    try { localStorage.setItem(CHAVE_PAINEL, this.painelDesktop ? 'aberto' : 'recolhido'); } catch { /* sem localStorage */ }
  }

  // ---- Salvar, finalizar e status

  async saveDraft() { await this.persist('RASCUNHO', false); }
  async finalize() {
    const refs=this.referenciasCount;
    if (refs>0) {
      if (!await this.dialogo.confirmar({ titulo: 'Linhas de referência', mensagem: `Ainda há ${refs} linha(s) de referência. Apagar e finalizar?`, confirmar: 'Apagar e finalizar' })) return;
      this.events=this.events.filter(e=>!e.referencia); this.eventsDirty=true;
    }
    const missing=this.totalSlots()-this.filledCount();
    if (missing>0 && !await this.dialogo.confirmar({ titulo: 'Vagas sem nome', mensagem: `Ainda existem ${missing} vaga(s) sem nome. Deseja finalizar mesmo assim?`, confirmar: 'Continuar' })) return;
    if (!await this.dialogo.confirmar({ titulo: 'Finalizar escala?', mensagem: 'A escala ficará bloqueada para edição até ser reaberta.', confirmar: 'Finalizar' })) return;
    await this.persist('FINALIZADA', true);
  }

  private async persist(status: StatusEscala, navigate: boolean) {
    if(this.form.invalid)return;this.saving=true;this.error='';
    try{
      const m=this.form.getRawValue();
      const eraNova=!this.id;

      const result=await this.service.save({id:this.id||undefined,titulo:m.titulo,tipo:m.tipo,ano:m.ano,mes:m.mes,status,observacao:m.observacao||null,version:this.currentDetail?.version??null,eventos:this.events, layoutId: m.layoutId || null, colunas: this.colunas});

      this.id=result.id;this.currentDetail=result;this.status=result.status;this.events=result.eventos;this.saved=true;this.form.markAsPristine();this.eventsDirty=false;
      if (this.readOnly) this.form.disable({ emitEvent: false });
      if (eraNova && m.tipo==='MENSAL') await this.carregarApoio();
      if(navigate) await this.router.navigate(['/escalas',result.id]);
      else if(this.route.snapshot.paramMap.get('id')===null) await this.router.navigate(['/escalas',result.id]);
    }catch(e:any){this.error=e?.message||'Não foi possível salvar a escala.';}finally{this.saving=false;}
  }

  async cancelScale(){if(!this.id)return;if(!await this.dialogo.confirmar({ titulo: 'Cancelar escala?', mensagem: `Tem certeza que deseja cancelar a escala ${MESES[this.form.controls.mes.value-1]} / ${this.form.controls.ano.value}?`, confirmar: 'Cancelar escala', cancelar: 'Voltar', perigo: true }))return;try{this.currentDetail=await this.service.setStatus(this.id,'CANCELADA');this.status='CANCELADA';this.form.disable({emitEvent:false});this.saved=true;}catch(e:any){this.error=e?.message||'Erro ao cancelar escala.';}}
  async reopen(){if(!this.id)return;if(!await this.dialogo.confirmar({ titulo: 'Reabrir escala?', mensagem: 'A escala volta a ser não finalizada e aceita alterações de novo.', confirmar: 'Reabrir' }))return;try{this.currentDetail=await this.service.setStatus(this.id,'RASCUNHO');this.status='RASCUNHO';this.form.enable({emitEvent:false});this.saved=true;}catch(e:any){this.error=e?.message||'Erro ao reabrir escala.';}}
  async remove(){if(!this.id)return;if(!await this.dialogo.confirmar({ titulo: 'Excluir escala?', mensagem: `Excluir definitivamente a escala de ${MESES[this.form.controls.mes.value-1]} / ${this.form.controls.ano.value}? Esta ação não pode ser desfeita.`, confirmar: 'Excluir', perigo: true }))return;try{await this.service.deleteCancelled(this.id);this.saved=true;await this.router.navigate(['/escalas']);}catch(e:any){this.error=e?.message||'Erro ao excluir escala.';}}

  orientacao: Orientacao = lerOrientacao('escala', 'PAISAGEM');

  async gerarPrevia() {
    const { titulo, tipo, ano, mes } = this.form.getRawValue();
    const mockDetail: EscalaDetalhe = {
      id: '', titulo, tipo, ano, mes, status: 'RASCUNHO', observacao: null, version: null, colunas: this.colunas,
      eventos: this.events.filter(e => !e.referencia)
    };
    try {
      await this.exporter.exportPdf(mockDetail, this.orientacao);
    } catch(e:any) { this.error=e?.message||'Erro ao gerar prévia.'; }
  }

  async exportPdf(){if(!this.id)return;try{await this.exporter.exportPdf(await this.service.getById(this.id), this.orientacao);}catch(e:any){this.error=e?.message||'Erro ao exportar PDF.';}}
  async exportPng(){if(!this.id)return;try{await this.exporter.exportPng(await this.service.getById(this.id), this.orientacao);}catch(e:any){this.error=e?.message||'Erro ao exportar PNG.';}}

  /** Referência (escala replicada) não conta em vagas: nunca é publicada. Lê o que `recalcular` já contou. */
  totalSlots(){return this.total;}
  filledCount(){return this.preenchidas;}
  referencias(){return this.events.filter(e=>!!e.referencia);}
  funcaoLabel(f:FuncaoEscala){return FUNCOES_LABEL[f];}
  multiLabel(e:EscalaEvento,slot:EscalaVaga){const count=e.vagas.filter(v=>v.funcao===slot.funcao).length;return count>1?` ${slot.posicao}`:'';}
  slotFor(e: EscalaEvento, funcao: FuncaoEscala, posicao: number) { return e.vagas.find(v => v.funcao === funcao && v.posicao === posicao) || null; }
  mesDe(v:string){return MESES[Number(v.slice(5,7))-1].toLowerCase();}
  date(v:string){return dataLonga(v);}
  dateShort(v:string){return dataCurta(v);}
  weekday(v:string){return diaDaSemana(v);}
  statusLabel(s:StatusEscala){return STATUS_LABEL[s];}
  statusClass(s:StatusEscala){return s==='FINALIZADA'?'bg-emerald-50 text-emerald-700':s==='CANCELADA'?'bg-red-50 text-red-700':'bg-amber-50 text-amber-700';}
  hasPendingChanges(){return this.status==='RASCUNHO' && (this.form.dirty||this.eventsDirty);}
}
