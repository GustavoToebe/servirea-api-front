import { CommonModule } from '@angular/common';
import { NumeroComponent } from '../../../shared/components/numero/numero.component';
import { CONDICAO_LABEL, CondicaoEspecial } from '../../../shared/components/cuidados/condicoes';
import { Component, OnInit, ViewChild } from '@angular/core';
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

type Aba = 'todas' | 'ativos' | 'inativos' | 'aguardando' | 'historico';

@Component({
    selector: 'app-pessoas-list',
    imports: [CommonModule, FormsModule, RouterLink, ConfirmDialogComponent, NumeroComponent, ListaAssinaturaDialogComponent, BarraFiltrosComponent, DuplicidadesDialogComponent],
    template: `

    <div class="space-y-6">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
        <h1 class="text-2xl font-black text-slate-900">Pessoas e ministérios</h1>
        <p class="text-sm text-slate-500">Coroinhas, acólitos e responsáveis. A ficha guarda função, idade e contato.</p>
        </div>
        <a routerLink="/pessoas/nova" class="btn-primary">＋ Novo cadastro</a>
      </div>
    
      <div class="flex flex-wrap gap-2">
        <button type="button" class="rounded-2xl px-4 py-2.5 text-sm font-bold" [class.bg-brand-blue]="aba==='todas'" [class.text-white]="aba==='todas'" [class.bg-white]="aba!=='todas'" [class.border]="aba!=='todas'" (click)="setAba('todas')">Todas {{ counts.pessoas }}</button>
        <button type="button" class="rounded-2xl px-4 py-2.5 text-sm font-bold" [class.bg-brand-blue]="aba==='ativos'" [class.text-white]="aba==='ativos'" [class.bg-white]="aba!=='ativos'" [class.border]="aba!=='ativos'" (click)="setAba('ativos')">Ativos {{ counts.ativos }}</button>
        <button type="button" class="rounded-2xl px-4 py-2.5 text-sm font-bold" [class.bg-brand-blue]="aba==='inativos'" [class.text-white]="aba==='inativos'" [class.bg-white]="aba!=='inativos'" [class.border]="aba!=='inativos'" (click)="setAba('inativos')">Inativos {{ counts.inativos }}</button>
        <button type="button" class="rounded-2xl px-4 py-2.5 text-sm font-bold" [class.bg-brand-blue]="aba==='aguardando'" [class.text-white]="aba==='aguardando'" [class.bg-white]="aba!=='aguardando'" [class.border]="aba!=='aguardando'" (click)="setAba('aguardando')">Aguardando {{ counts.pendentes }}</button>
        <button type="button" class="rounded-2xl px-4 py-2.5 text-sm font-bold" [class.bg-brand-blue]="aba==='historico'" [class.text-white]="aba==='historico'" [class.bg-white]="aba!=='historico'" [class.border]="aba!=='historico'" (click)="setAba('historico')">Histórico</button>
      </div>
    
      @if (message) {
        <div class="rounded-xl bg-emerald-50 p-4 text-emerald-800">{{ message }}</div>
      }
      @if (error) {
        <div class="rounded-xl bg-red-50 p-4 text-red-700">{{ error }}</div>
      }
    
      @if (aba==='todas' || aba==='ativos' || aba==='inativos') {
        <app-barra-filtros placeholder="Buscar por nome ou número" [(termo)]="nome" (buscar)="load()"
          [opcoes]="opcoesMenu" (opcao)="lidarComOpcao($event)"
          [filtrosAtivos]="filtrosAtivosLista" (removerFiltro)="removerFiltro($event)" (removerTodos)="removerTodosFiltros()">
          <div class="flex flex-col gap-1">
            <label class="label">Tipo</label>
            <select class="field" [(ngModel)]="tipo">
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
        <div class="overflow-x-auto">
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
              @if (loading) {
                <tr><td colspan="8" class="text-center text-slate-500 p-10">Carregando...</td></tr>
              }
              @if (!loading && !pessoasVisiveis.length) {
                <tr><td colspan="8" class="text-center text-slate-500 p-10">Nenhum cadastro.</td></tr>
              }
              @for (p of pessoasVisiveis; track p.id) {
                <tr [class.marcada]="selecao.marcado(p.id)">
                  <td class="text-center">
                    <input type="checkbox" class="tabela-check" [attr.data-marcar]="p.id" [checked]="selecao.marcado(p.id)" (change)="alternar(p.id)" [attr.aria-label]="'Selecionar ' + p.nomeCompleto">
                  </td>
                  <td>
                    <div class="flex items-center gap-3">
                      <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-xs font-bold text-brand-blue">{{ initials(p.nomeCompleto) }}</div>
                      <div>
                        <div class="font-black flex items-center gap-1">{{ p.nomeCompleto }}<app-numero [numero]="p.sequencial" />
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
                      <a [routerLink]="['/pessoas', p.id]" class="btn-secondary !px-3 !py-1.5 text-xs">Ver</a>
                      <a [routerLink]="['/pessoas', p.id, 'editar']" class="btn-secondary !px-3 !py-1.5 text-xs">Editar</a>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    
      @if (aba==='ativos' || aba==='inativos') {
        <div class="overflow-x-auto">
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
              @if (loading) {
                <tr><td colspan="7" class="text-center text-slate-500 p-10">Carregando...</td></tr>
              }
              @if (!loading && !rowsVisiveis.length) {
                <tr><td colspan="7" class="text-center text-slate-500 p-10">Nenhum cadastro.</td></tr>
              }
              @for (v of rowsVisiveis; track v.id) {
                <tr [class.marcada]="selecao.marcado(v.id)">
                  <td class="text-center">
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
                      <a [routerLink]="['/pessoas', v.id]" class="btn-secondary !px-3 !py-1.5 text-xs">Ver</a>
                      <a [routerLink]="['/pessoas', v.id, 'editar']" class="btn-secondary !px-3 !py-1.5 text-xs">Editar</a>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    
      @if (aba==='aguardando' || aba==='historico') {
        <div class="grid gap-4">
          @if (loading) {
            <div class="card p-10 text-center text-slate-500">Carregando inscrições...</div>
          }
          @if (!loading && !inscricoes.length) {
            <div class="card p-10 text-center text-slate-500">Nenhuma inscrição.</div>
          }
          @for (i of inscricoes; track i) {
            <article class="card p-5">
              <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <h2 class="text-lg font-black">{{ i.nomeCompleto }}<app-numero [numero]="i.sequencial" /></h2>
                  <p class="text-sm text-slate-500">{{ tipoLabel[i.tipo] }} · {{ ageFromDate(i.dataNascimento) ?? 'idade não informada' }} anos</p>
                  <p class="text-sm text-slate-600">Responsável: {{ principalNome(i) }}</p>
                </div>
                <div class="flex flex-wrap gap-2">
                  <a [routerLink]="['/pessoas/inscricoes', i.id]" class="btn-secondary !py-2">Ver</a>
                  @if (i.status==='PENDENTE') {
                    <button type="button" class="btn-primary !py-2" (click)="approveTarget=i">Aprovar</button>
                  }
                  @if (i.status==='PENDENTE') {
                    <button type="button" class="btn-danger !py-2" (click)="openReject(i)">Rejeitar</button>
                  }
                  @if (i.voluntarioId) {
                    <a [routerLink]="['/pessoas', i.voluntarioId]" class="btn-secondary !py-2">Abrir cadastro</a>
                  }
                </div>
              </div>
            </article>
          }
        </div>
      }
    </div>
    
    <app-duplicidades-dialog [open]="dialogOpen" [itens]="duplicidades" acao="aprovar" (fechar)="dialogOpen = false" (continuar)="doApprove(approveTargetDialog?.id!)" />
    <app-lista-assinatura-dialog [open]="listaAberta" [itens]="itensLista" (fechar)="listaAberta = false" />
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
export class PessoasListComponent implements OnInit {
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

  constructor(
    private pessoasApi: PessoasService,
    private voluntarios: VoluntariosApiService,
    private inscricoesApi: InscricoesApiService,
    private route: ActivatedRoute,
    private router: Router
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
    this.aba = aba;
    await this.router.navigate([], { queryParams: { aba }, queryParamsHandling: 'merge' });
    await this.load();
  }

  async setHistorico(status: 'APROVADA' | 'REJEITADA') {
    this.historico = status;
    await this.load();
  }

  async load() {
    this.loading = true;
    this.error = '';
    try {
      const [todas, ativos, inativos, pendentes] = await Promise.all([
        this.pessoasApi.listar(undefined, this.aba === 'todas' ? this.nome : undefined),
        this.voluntarios.contar(true),
        this.voluntarios.contar(false),
        this.inscricoesApi.listar('PENDENTE')
      ]);
      this.counts = { pessoas: todas.length, ativos, inativos, pendentes: pendentes.length };
      this.selecao.limpar();
      this.pessoas = [];
      this.rows = [];
      this.inscricoes = [];
      if (this.aba === 'todas') {
        this.pessoas = todas;
      } else if (this.aba === 'ativos' || this.aba === 'inativos') {
        this.rows = await this.voluntarios.listar({ ativo: this.aba === 'ativos', nome: this.nome });
      } else {
        this.inscricoes = await this.inscricoesApi.listar(this.aba === 'aguardando' ? 'PENDENTE' : this.historico);
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : 'Erro ao carregar.';
    } finally {
      this.loading = false;
    }
  }

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
      { id: 'comunicado', rotulo: 'Criar comunicado', icone: '✉', desabilitada: true, dica: 'Em breve' },
      { id: 'listagem', rotulo: 'Imprimir listagem', icone: '🖨', desabilitada: this.quantidadeMarcada === 0, dica: 'Marque ao menos uma pessoa' }
    ];
  }

  lidarComOpcao(id: string) {
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
    if (chave === 'tipo') { this.tipo = ''; }
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
    }
  }
}
