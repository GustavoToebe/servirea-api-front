import { CommonModule } from '@angular/common';
import { CONDICAO_LABEL, CondicaoEspecial } from '../../../shared/components/cuidados/condicoes';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { ItemAssinatura } from '../services/lista-assinatura.service';
import { ListaAssinaturaDialogComponent } from './lista-assinatura-dialog.component';
import { Inscricao, StatusInscricao } from '../models/inscricao.model';
import { Duplicidade, Pessoa, TIPO_LABEL, TipoVoluntario, FUNCOES_LABEL, VoluntarioLista, ageFromDate, initials, mandatoRotulo, tipoBadgeClass } from '../models/pessoa.model';
import { InscricoesApiService } from '../services/inscricoes-api.service';
import { PessoasService } from '../services/pessoas.service';
import { BarraFiltrosComponent, OpcaoMenu, FiltroAtivo } from '../../../shared/components/barra-filtros/barra-filtros.component';
import { Selecao } from '../../../shared/utils/selecao';
import { VoluntariosApiService } from '../services/voluntarios-api.service';

import { DuplicidadesDialogComponent } from './duplicidades-dialog.component';
import { ComunicadoDialogComponent } from '../../comunicacao/components/comunicado-dialog.component';
import { SessaoAtual } from '../../../core/layout/sessao-atual';
import { CabecalhoPaginaComponent } from '../../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { EstadoListaComponent } from '../../../shared/components/estado-lista/estado-lista.component';

type Aba = 'todas' | 'ativos' | 'inativos' | 'aguardando' | 'historico';

@Component({
    selector: 'app-pessoas-list',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [CommonModule, FormsModule, RouterLink, ConfirmDialogComponent, ListaAssinaturaDialogComponent, BarraFiltrosComponent, DuplicidadesDialogComponent, ComunicadoDialogComponent, CabecalhoPaginaComponent, EstadoListaComponent],
    template: `

    <div class="space-y-6">
      <app-cabecalho-pagina titulo="Pessoas e ministérios" subtitulo="Coroinhas, acólitos e responsáveis. A ficha guarda função, idade e contato.">
        
        @if (podeImportar) {<a acoes routerLink="/pessoas/importar" class="btn-secondary">Importar pessoas</a>}
        <a acoes routerLink="/pessoas/nova" class="btn-primary">＋ Novo cadastro</a>
      </app-cabecalho-pagina>

      <div class="flex flex-wrap gap-2 pb-6">
        <button type="button" class="rounded-2xl px-4 py-2.5 text-sm font-bold" [class.bg-brand-blue]="aba==='todas'" [class.text-white]="aba==='todas'" [class.bg-white]="aba!=='todas'" [class.border]="aba!=='todas'" (click)="setAba('todas')">Todas {{ counts.pessoas }}</button>
        <button type="button" class="rounded-2xl px-4 py-2.5 text-sm font-bold" [class.bg-brand-blue]="aba==='ativos'" [class.text-white]="aba==='ativos'" [class.bg-white]="aba!=='ativos'" [class.border]="aba!=='ativos'" (click)="setAba('ativos')">Ativos {{ counts.ativos }}</button>
        <button type="button" class="rounded-2xl px-4 py-2.5 text-sm font-bold" [class.bg-brand-blue]="aba==='inativos'" [class.text-white]="aba==='inativos'" [class.bg-white]="aba!=='inativos'" [class.border]="aba!=='inativos'" (click)="setAba('inativos')">Inativos {{ counts.inativos }}</button>
        <button type="button" class="rounded-2xl px-4 py-2.5 text-sm font-bold" [class.bg-brand-blue]="aba==='aguardando'" [class.text-white]="aba==='aguardando'" [class.bg-white]="aba!=='aguardando'" [class.border]="aba!=='aguardando'" (click)="setAba('aguardando')">Aguardando {{ counts.pendentes }}</button>
        <button type="button" class="rounded-2xl px-4 py-2.5 text-sm font-bold" [class.bg-brand-blue]="aba==='historico'" [class.text-white]="aba==='historico'" [class.bg-white]="aba!=='historico'" [class.border]="aba!=='historico'" (click)="setAba('historico')">Histórico</button>
      </div>

      @if (message) {
        <div class="rounded-xl bg-emerald-50 p-4 text-emerald-800">{{ message }}</div>
      }
      @if (comunicadoCriado) {
        <div class="rounded-xl bg-emerald-50 p-4 text-emerald-800" data-sucesso-comunicado>
          <b>Sucesso</b> — As mensagens foram adicionadas à fila de envio!
          Acompanhe em <a class="font-bold underline" [routerLink]="['/comunicados', comunicadoCriado]">Comunicados</a>.
        </div>
      }
      @if (error) {
        <div class="rounded-xl bg-red-50 p-4 text-red-700">{{ error }}</div>
      }

      @if (aba==='todas' || aba==='ativos' || aba==='inativos') {
        <app-barra-filtros placeholder="Buscar por nome ou número" [termo]="nome" (termoChange)="buscaDigitada($event)" (buscar)="load()"
          [opcoes]="opcoesMenu" (opcao)="lidarComOpcao($event)"
          [filtrosAtivos]="filtrosAtivosLista" (removerFiltro)="removerFiltro($event)" (removerTodos)="removerTodosFiltros()">
          <div class="flex flex-col gap-1">
            <label class="label">Tipo</label>
            <select class="field" [(ngModel)]="tipo" (ngModelChange)="load()">
              <option value="">Todos</option>
              <option value="COROINHA">Coroinhas</option>
              <option value="ACOLITO">Acólitos</option>
              <option value="AMBOS">Coroinha / acólito</option>
              @if (aba==='todas') {
                <option value="RESPONSAVEL">Responsáveis</option>
              }
            </select>
          </div>
        </app-barra-filtros>
        @if (quantidadeMarcada > 0) {
          <div class="text-sm text-slate-500 mt-2">{{ quantidadeMarcada }} selecionado(s)</div>
        }
      }

      @if (aba==='historico') {
        <app-barra-filtros [semBusca]="true" (buscar)="load()" [filtrosAtivos]="filtrosAtivosHistorico">
          <div class="flex flex-col gap-1">
            <label class="label">Situação</label>
            <select class="field" [(ngModel)]="historico">
              <option value="APROVADA">Aprovadas</option>
              <option value="REJEITADA">Rejeitadas</option>
            </select>
          </div>
        </app-barra-filtros>
      }

      @if (aba==='todas') {
        <div class="tabela-rolagem">
          <table class="tabela">
            <thead>
              <tr>
                <th class="w-12 text-center"><input type="checkbox" class="tabela-check" data-marcar-todos [checked]="todosMarcados" [indeterminate]="algunsMarcados" (change)="marcarTodos($any($event.target).checked)"></th>
                <th>Nome</th>
                <th>Tipo</th>
                <th class="hidden md:table-cell">CPF</th>
                <th class="hidden md:table-cell">Telefone</th>
                <th class="hidden md:table-cell">E-mail</th>
                <th>Idade</th>
                <th class="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              @for (p of pessoasVisiveis; track p.id) {
                <tr class="clicavel" tabindex="0" [class.marcada]="selecao.marcado(p.id)" (click)="abrir(p.id)" (keydown.enter)="abrir(p.id)" [attr.data-linha]="p.id">
                  <td class="text-center" (click)="$event.stopPropagation()">
                    <input type="checkbox" class="tabela-check" [attr.data-marcar]="p.id" [checked]="selecao.marcado(p.id)" (change)="alternar(p.id)" [attr.aria-label]="'Selecionar ' + p.nomeCompleto">
                  </td>
                  <td>
                    <div class="flex items-center gap-3">
                      <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-brand-blue">{{ initials(p.nomeCompleto) }}</div>
                      <div>
                        <div class="font-black flex items-center gap-1">{{ p.nomeCompleto }}
                          @if (temCuidado(p)) { <span class="text-violet-600 ml-1" [title]="formatarCondicoes(p)">💜</span> }
                        </div>
                        @if (responsavelDe(p)) {
                          <div class="text-xs text-slate-500">Responsável: {{ responsavelDe(p) }}</div>
                        }
                      </div>
                    </div>
                  </td>
                  <td>
                    <div class="flex flex-wrap gap-1">
                      @if (p.voluntario) {
                        <span class="badge" [ngClass]="tipoBadgeClass(p.voluntario.tipo)">{{ tipoLabel[p.voluntario.tipo] }}</span>
                      }
                      @if (p.papeis.includes('RESPONSAVEL')) {
                        <span class="badge bg-slate-100 text-slate-600">Responsável</span>
                      }
                    </div>
                  </td>
                  <td class="hidden md:table-cell">{{ p.cpf || '—' }}</td>
                  <td class="hidden md:table-cell">{{ p.telefones?.[0]?.numero || '—' }}</td>
                  <td class="hidden md:table-cell">{{ p.emails?.[0]?.email || '—' }}</td>
                  <td>{{ ageFromDate(p.dataNascimento) ?? '—' }}</td>
                  <td class="text-right">
                    <div class="flex justify-end gap-2">
                      <a [routerLink]="['/pessoas', p.id]" class="btn-secondary !px-3 !py-1.5 text-xs" (click)="$event.stopPropagation()">Ver</a>
                      <a [routerLink]="['/pessoas', p.id, 'editar']" class="btn-secondary !px-3 !py-1.5 text-xs" (click)="$event.stopPropagation()">Editar</a>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
          <app-estado-lista [carregando]="loading" [vazio]="!loading && !pessoasVisiveis.length" />
        </div>
      }

      @if (aba==='ativos' || aba==='inativos') {
        <div class="tabela-rolagem">
          <table class="tabela">
            <thead>
              <tr>
                <th class="w-12 text-center"><input type="checkbox" class="tabela-check" data-marcar-todos [checked]="todosMarcados" [indeterminate]="algunsMarcados" (change)="marcarTodos($any($event.target).checked)"></th>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Idade</th>
                <th class="hidden md:table-cell">Funções</th>
                <th>Status</th>
                <th class="text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              @for (v of rowsVisiveis; track v.id) {
                <tr class="clicavel" tabindex="0" [class.marcada]="selecao.marcado(v.id)" (click)="abrir(v.id)" (keydown.enter)="abrir(v.id)" [attr.data-linha]="v.id">
                  <td class="text-center" (click)="$event.stopPropagation()">
                    <input type="checkbox" class="tabela-check" [attr.data-marcar]="v.id" [checked]="selecao.marcado(v.id)" (change)="alternar(v.id)" [attr.aria-label]="'Selecionar ' + v.nomeCompleto">
                  </td>
                  <td>
                    <div class="flex items-center gap-3">
                      <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-brand-blue">{{ initials(v.nomeCompleto) }}</div>
                      <div class="font-black flex items-center gap-1">{{ v.nomeCompleto }}
                        @if (temCuidado(v)) { <span class="text-violet-600 ml-1" [title]="formatarCondicoes(v)">💜</span> }
                      </div>
                    </div>
                  </td>
                  <td><span class="badge" [ngClass]="tipoBadgeClass(v.tipo)">{{ tipoLabel[v.tipo] }}</span></td>
                  <td>{{ ageFromDate(v.dataNascimento) ?? '—' }}</td>
                  <td class="hidden md:table-cell">
                    <div class="flex flex-wrap gap-1">
                      @for (funcao of v.funcoesHabilitadas; track funcao) {
                        <span class="badge bg-violet-50 text-violet-800">{{ funcoesLabel[funcao] }}</span>
                      }
                    </div>
                  </td>
                  <td><span class="badge" [ngClass]="v.ativo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'">{{ v.ativo ? 'Ativo' : 'Inativo' }}</span></td>
                  <td class="text-right">
                    <div class="flex justify-end gap-2">
                      @if (podeAtivar) {
                        <button type="button" class="btn-secondary !px-3 !py-1.5 text-xs" (click)="$event.stopPropagation(); alternarAtivo(v)">{{ v.ativo ? 'Inativar' : 'Ativar' }}</button>
                      }
                      <a [routerLink]="['/pessoas', v.id]" class="btn-secondary !px-3 !py-1.5 text-xs" (click)="$event.stopPropagation()">Ver</a>
                      <a [routerLink]="['/pessoas', v.id, 'editar']" class="btn-secondary !px-3 !py-1.5 text-xs" (click)="$event.stopPropagation()">Editar</a>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
          <app-estado-lista [carregando]="loading" [vazio]="!loading && !rowsVisiveis.length" />
        </div>
      }

      @if (aba==='aguardando' || aba==='historico') {
        <div class="tabela-rolagem">
          <table class="tabela">
            <thead>
              <tr><th>Nome</th><th>Tipo</th><th>Idade</th><th class="hidden md:table-cell">Responsável</th><th class="hidden md:table-cell">Decisão em</th><th class="text-right">Ações</th></tr>
            </thead>
            <tbody>
              @for (i of inscricoes; track i.id) {
                <tr class="clicavel" tabindex="0" (click)="abrirInscricao(i.id)" (keydown.enter)="abrirInscricao(i.id)" [attr.data-inscricao]="i.id">
                  <td class="font-black">{{ i.nomeCompleto }}</td>
                  <td>{{ tipoLabel[i.tipo] }}</td>
                  <td>{{ ageFromDate(i.dataNascimento) ?? '—' }}</td>
                  <td class="hidden md:table-cell">{{ principalNome(i) }}</td>
                  <td class="hidden md:table-cell">{{ (i.dataAprovacao || i.dataRejeicao) ? ((i.dataAprovacao || i.dataRejeicao) | date:'dd/MM/yyyy') : '—' }}</td>
                  <td class="text-right" (click)="$event.stopPropagation()">
                    <div class="flex justify-end gap-2">
                      @if (i.status==='PENDENTE') {
                        <button type="button" class="btn-primary !px-3 !py-1.5 text-xs" (click)="approveTarget=i">Aprovar</button>
                        <button type="button" class="btn-danger !px-3 !py-1.5 text-xs" (click)="openReject(i)">Rejeitar</button>
                      }
                      @if (i.voluntarioId) {
                        <a [routerLink]="['/pessoas', i.voluntarioId]" class="btn-secondary !px-3 !py-1.5 text-xs">Abrir cadastro</a>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
          <app-estado-lista [carregando]="loading" [vazio]="!loading && !inscricoes.length" mensagemVazio="Nenhuma inscrição." />
        </div>
      }
    </div>

    <nav aria-label="Páginas da lista" class="flex flex-wrap items-center justify-between gap-3 my-4">
      <p class="text-sm text-slate-500">{{ total }} registro(s) · Página {{ pagina + 1 }} de {{ paginas || 1 }}. A seleção vale para esta página.</p>
      <div class="flex gap-2">
        <button class="btn-secondary" type="button" [disabled]="loading || pagina === 0" (click)="mudarPagina(-1)">Anterior</button>
        <button class="btn-secondary" type="button" [disabled]="loading || pagina + 1 >= paginas" (click)="mudarPagina(1)">Próxima</button>
      </div>
    </nav>
    <app-duplicidades-dialog [open]="dialogOpen" [itens]="duplicidades" acao="aprovar" (fechar)="dialogOpen = false" (continuar)="doApprove(approveTargetDialog?.id!)" />
    <app-lista-assinatura-dialog [open]="listaAberta" [itens]="itensLista" (fechar)="listaAberta = false" />
    <app-comunicado-dialog [open]="comunicadoAberto" [pessoaIds]="idsComunicado" (fechar)="comunicadoAberto = false"
      (enviado)="comunicadoCriado = $event.id" />
    <app-confirm-dialog [open]="!!approveTarget" title="Aprovar inscrição"
      [message]="'Aprovar ' + (approveTarget?.nomeCompleto || '') + '? O cadastro será criado em /pessoas.'"
      confirmLabel="Aprovar" (cancel)="approveTarget=null" (confirm)="confirmApprove()">
    </app-confirm-dialog>
    <app-confirm-dialog #rejectDialog [open]="!!rejectTarget" title="Rejeitar" [danger]="true"
      [message]="'Motivo da rejeição de ' + (rejectTarget?.nomeCompleto || '') + '.'"
      confirmLabel="Rejeitar" reasonLabel="Motivo" [requireReason]="true"
      (cancel)="rejectTarget=null" (confirm)="confirmReject($event)">
    </app-confirm-dialog>
`
})
export class PessoasListComponent implements OnInit, OnDestroy {
  CONDICAO_LABEL = CONDICAO_LABEL;

  temCuidado(p: { condicoes?: CondicaoEspecial[], cuidados?: string | null }): boolean {
    return (p.condicoes && p.condicoes.length > 0) || !!p.cuidados;
  }

  formatarCondicoes(p: { condicoes?: CondicaoEspecial[], cuidados?: string | null }): string {
    const labels = (p.condicoes || []).map(c => CONDICAO_LABEL[c]);
    if (p.cuidados && labels.length === 0) return 'Cuidado e acolhimento';
    return labels.join(' · ');
  }

  @ViewChild('rejectDialog') rejectDialog?: ConfirmDialogComponent;
  aba: Aba = 'todas';
  historico: Extract<StatusInscricao, 'APROVADA' | 'REJEITADA'> = 'APROVADA';
  nome = '';
  pagina = 0;
  paginas = 0;
  total = 0;
  pessoas: Pessoa[] = [];
  rows: VoluntarioLista[] = [];
  inscricoes: Inscricao[] = [];
  loading = true;
  error = '';
  message = '';
  counts = { pessoas: 0, ativos: 0, inativos: 0, pendentes: 0 };
  tipo: '' | 'COROINHA' | 'ACOLITO' | 'AMBOS' | 'RESPONSAVEL' = '';
  funcoesLabel = FUNCOES_LABEL;
  approveTarget: Inscricao | null = null;
  rejectTarget: Inscricao | null = null;
  tipoLabel = TIPO_LABEL;
  tipoBadgeClass = tipoBadgeClass;
  mandatoDe = mandatoRotulo;
  initials = initials;
  ageFromDate = ageFromDate;
  /** Seleção para a lista de assinatura (27/09/2026): ids das pessoas marcadas na aba atual. */
  selecao = new Selecao();
  listaAberta = false;
  itensLista: ItemAssinatura[] = [];
  comunicadoAberto = false;
  idsComunicado: string[] = [];
  comunicadoCriado: string | null = null;

  constructor(
    private pessoasApi: PessoasService,
    private voluntarios: VoluntariosApiService,
    private inscricoesApi: InscricoesApiService,
    private route: ActivatedRoute,
    private router: Router,
    private sessao: SessaoAtual,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const aba = this.route.snapshot.queryParamMap.get('aba') as Aba | null;
    if (aba === 'todas' || aba === 'ativos' || aba === 'inativos' || aba === 'aguardando' || aba === 'historico') this.aba = aba;
    void this.load();
  }

  async setAba(aba: Aba) {
    if ((aba === 'ativos' || aba === 'inativos') && this.tipo === 'RESPONSAVEL') {
      this.tipo = '';
    }
    this.pedido++;
    this.aba = aba;
    await this.router.navigate([], { queryParams: { aba }, queryParamsHandling: 'merge' });
    await this.load();
  }

  async setHistorico(status: 'APROVADA' | 'REJEITADA') {
    this.historico = status;
    await this.load();
  }

  /** Clique na linha abre a ficha (checkbox, links e botões da linha param o clique). */
  abrir(id: string) {
    void this.router.navigate(['/pessoas', id]);
  }

  abrirInscricao(id: string) {
    void this.router.navigate(['/pessoas/inscricoes', id]);
  }

  private espera: ReturnType<typeof setTimeout> | null = null;
  private pedido = 0;

  /** Busca que vai à API: espera 300 ms depois da última tecla e descarta respostas antigas. */
  buscaDigitada(termo: string) {
    this.nome = termo;
    this.pedido++;
    if (this.espera) clearTimeout(this.espera);
    this.espera = setTimeout(() => { this.espera = null; void this.load(); }, 300);
  }

  async load(reiniciar = true) {
    const pedido = ++this.pedido;
    if (reiniciar) this.pagina = 0;
    this.loading = true; this.error = ''; this.cdr.markForCheck();
    const aba = this.aba;
    try {
      const daAba = aba === 'aguardando' || aba === 'historico'
        ? this.inscricoesApi.pagina(aba === 'aguardando' ? 'PENDENTE' : this.historico, this.pagina)
        : this.pessoasApi.pagina({ nome: this.nome,
            papel: aba === 'ativos' || aba === 'inativos' ? 'VOLUNTARIO' : this.tipo === 'RESPONSAVEL' ? 'RESPONSAVEL' : undefined,
            tipo: this.tipo && this.tipo !== 'RESPONSAVEL' ? this.tipo : undefined,
            ativo: aba === 'ativos' ? true : aba === 'inativos' ? false : undefined }, this.pagina);
      const [resumo, pagina] = await Promise.all([this.pessoasApi.resumo(), daAba]);
      if (pedido !== this.pedido) return;
      this.counts = resumo; this.total = pagina.total; this.paginas = pagina.paginas;
      this.selecao.limpar(); this.pessoas = []; this.rows = []; this.inscricoes = [];
      if (aba === 'aguardando' || aba === 'historico') this.inscricoes = pagina.itens as Inscricao[];
      else if (aba === 'todas') this.pessoas = pagina.itens as Pessoa[];
      else this.rows = (pagina.itens as Pessoa[]).filter(p => !!p.voluntario).map(p => {
        const v=p.voluntario!;
        return { id:p.id,nomeCompleto:p.nomeCompleto,nome_completo:p.nomeCompleto,tipo:v.tipo,ativo:v.ativo ?? false,
          fotoPath:v.fotoPath ?? null,etapaCatequese:v.etapaCatequese ?? null,eucaristiaAno:v.eucaristiaAno ?? null,
          crismaAno:v.crismaAno ?? null,horarioEstudo:v.horarioEstudo ?? null,autorizaWhatsapp:v.autorizaWhatsapp,
          funcoesHabilitadas:v.funcoesHabilitadas,mandatoInicio:v.mandatoInicio,mandatoFim:v.mandatoFim,
          dataNascimento:p.dataNascimento,condicoes:p.condicoes,cuidados:p.cuidados };
      });
    } catch (err) {
      if (pedido === this.pedido) this.error = err instanceof Error ? err.message : 'Erro ao carregar.';
    } finally {
      if (pedido === this.pedido) { this.loading = false; this.cdr.markForCheck(); }
    }
  }
  async mudarPagina(delta: number) {
    const destino=this.pagina+delta;
    if (this.loading || destino<0 || destino>=this.paginas) return;
    this.pagina=destino; await this.load(false);
  }
  ngOnDestroy(): void { this.pedido++; if (this.espera) clearTimeout(this.espera); }

  principalNome(i: Inscricao): string {
    const p = i.responsaveis.find(r => r.principal) || i.responsaveis[0];
    return p?.nome || '—';
  }

  get pessoasVisiveis(): Pessoa[] {
    if (!this.tipo) return this.pessoas;
    if (this.tipo === 'RESPONSAVEL') return this.pessoas.filter(p => p.papeis.includes('RESPONSAVEL'));
    return this.pessoas.filter(p => p.voluntario?.tipo === this.tipo);
  }

  get rowsVisiveis(): VoluntarioLista[] {
    if (!this.tipo) return this.rows;
    return this.rows.filter(v => v.tipo === this.tipo);
  }

  /** Ids da lista que está na tela (aba e filtro de tipo). */
  get idsVisiveis(): string[] {
    if (this.aba === 'todas') return this.pessoasVisiveis.map(p => p.id);
    if (this.aba === 'ativos' || this.aba === 'inativos') return this.rowsVisiveis.map(v => v.id);
    return [];
  }

  get quantidadeMarcada(): number {
    return this.selecao.quantidade(this.idsVisiveis);
  }

  get todosMarcados(): boolean {
    return this.selecao.todos(this.idsVisiveis);
  }

  get algunsMarcados(): boolean {
    return this.selecao.alguns(this.idsVisiveis);
  }

  alternar(id: string) {
    this.selecao.alternar(id);
  }

  marcarTodos(marcar: boolean) {
    this.selecao.marcarTodos(this.idsVisiveis, marcar);
  }

  /** Só quem está visível e marcado entra (o filtro de tipo pode ter escondido alguém marcado antes). */
  itensMarcados(): ItemAssinatura[] {
    if (this.aba === 'todas') {
      return this.selecao.marcadosEm(this.pessoasVisiveis, p => p.id).map(p => ({
        nome: p.nomeCompleto, numero: p.sequencial ?? null, nascimento: p.dataNascimento,
        tipo: p.voluntario ? this.tipoLabel[p.voluntario.tipo] : 'Responsável'
      }));
    }
    return this.selecao.marcadosEm(this.rowsVisiveis, v => v.id).map(v => ({
      nome: v.nomeCompleto, nascimento: v.dataNascimento ?? null, tipo: this.tipoLabel[v.tipo]
    }));
  }

  get opcoesMenu(): OpcaoMenu[] {
    return [
      {
        id: 'comunicado', rotulo: 'Criar comunicado', icone: '✉',
        desabilitada: this.quantidadeMarcada === 0 || !this.podeComunicar,
        dica: !this.podeComunicar ? 'Sem permissão para enviar comunicados' : this.quantidadeMarcada === 0 ? 'Marque ao menos uma pessoa' : ''
      },
      { id: 'listagem', rotulo: 'Imprimir listagem', icone: '🖨', desabilitada: this.quantidadeMarcada === 0, dica: 'Marque ao menos uma pessoa' }
    ];
  }

  get podeImportar(): boolean {return this.sessao.permissoes().includes('PESSOA') && this.sessao.permissoes().includes('PESSOA_CRIAR');}

  get podeComunicar(): boolean {
    return this.sessao.permissoes().includes('COMUNICADO_ENVIAR');
  }

  /** Quem só edita a ficha não liga nem desliga o cadastro. */
  get podeAtivar(): boolean {
    return this.sessao.permissoes().includes('PESSOA_ATIVAR_INATIVAR');
  }

  async alternarAtivo(v: VoluntarioLista) {
    this.error = '';
    try {
      await this.voluntarios.setAtivo(v.id, !v.ativo);
      await this.load();
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Não foi possível alterar o status.';
      this.cdr.markForCheck();
    }
  }

  /** Nas abas Todas, Ativos e Inativos o id da linha é o da pessoa (o voluntário usa o mesmo id). */
  abrirComunicado() {
    const visiveis = this.aba === 'todas' ? this.pessoasVisiveis.map(p => p.id) : this.rowsVisiveis.map(v => v.id);
    this.idsComunicado = visiveis.filter(id => this.selecao.marcado(id));
    if (!this.idsComunicado.length) return;
    this.comunicadoCriado = null;
    this.comunicadoAberto = true;
  }

  lidarComOpcao(id: string) {
    if (id === 'comunicado') {
      this.abrirComunicado();
      return;
    }
    if (id === 'listagem') {
      this.abrirLista();
    }
  }

  get filtrosAtivosLista(): FiltroAtivo[] {
    const f: FiltroAtivo[] = [];
    if (this.nome) f.push({ chave: 'nome', rotulo: 'Nome: ' + this.nome });
    if (this.tipo) {
      const rt = this.tipo === 'RESPONSAVEL' ? 'Responsáveis' :
                 this.tipo === 'COROINHA' ? 'Coroinhas' :
                 this.tipo === 'ACOLITO' ? 'Acólitos' : 'Coroinha / acólito';
      f.push({ chave: 'tipo', rotulo: 'Tipo: ' + rt });
    }
    return f;
  }

  get filtrosAtivosHistorico(): FiltroAtivo[] {
    return [{ chave: 'historico', rotulo: 'Situação: ' + (this.historico === 'APROVADA' ? 'Aprovadas' : 'Rejeitadas') }];
  }

  removerFiltro(chave: string) {
    if (chave === 'nome') { this.nome = ''; this.load(); }
    if (chave === 'tipo') { this.tipo = ''; void this.load(); }
  }

  removerTodosFiltros() {
    this.nome = '';
    this.tipo = '';
    this.load();
  }

  abrirLista() {
    this.itensLista = this.itensMarcados();
    this.listaAberta = true;
  }

  responsavelDe(pessoa: Pessoa): string {
    const relacao = pessoa.responsaveis.find(r => r.principal) || pessoa.responsaveis[0];
    return relacao?.nomeCompleto || '';
  }

  openReject(i: Inscricao) {
    this.rejectDialog?.resetReason();
    this.rejectTarget = i;
  }

  dialogOpen = false;
  duplicidades: Duplicidade[] = [];
  approveTargetDialog: Inscricao | null = null;

  async confirmApprove() {
    if (!this.approveTarget) return;
    const id = this.approveTarget.id;

    try {
      const duplicidades = await this.inscricoesApi.duplicidades(id);
      if (duplicidades.length > 0) {
        this.duplicidades = duplicidades;
        this.dialogOpen = true;
        this.approveTargetDialog = this.approveTarget;
        this.approveTarget = null;
        this.cdr.markForCheck();
        return;
      }
    } catch (err) {
      // Ignore or show error? The instruction says "Um 409 da API mostra a mensagem em error." which refers to the aprovar call itself.
    }

    const t = this.approveTarget;
    this.approveTarget = null;
    await this.doApprove(id);
  }

  async doApprove(id: string) {
    this.dialogOpen = false;
    this.approveTargetDialog = null;
    try {
      await this.inscricoesApi.aprovar(id);
      this.message = 'Inscrição aprovada.';
      await this.load();
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Falha ao aprovar.';
      this.cdr.markForCheck();
    }
  }

  async confirmReject(motivo: string) {
    if (!this.rejectTarget) return;
    const id = this.rejectTarget.id;
    this.rejectTarget = null;
    try {
      await this.inscricoesApi.rejeitar(id, motivo);
      this.message = 'Inscrição rejeitada.';
      await this.load();
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Falha ao rejeitar.';
      this.cdr.markForCheck();
    }
  }
}
