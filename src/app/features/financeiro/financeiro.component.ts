import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { SessaoAtual } from '../../core/layout/sessao-atual';
import { CabecalhoPaginaComponent } from '../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { BarraFiltrosComponent } from '../../shared/components/barra-filtros/barra-filtros.component';
import { EstadoListaComponent } from '../../shared/components/estado-lista/estado-lista.component';
import { CampoDataComponent } from '../../shared/components/datas/campo-data.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { RodapeFormComponent } from '../../shared/components/rodape-form/rodape-form.component';
import { DialogoService } from '../../shared/services/dialogo.service';
import { focarPrimeiroInvalido } from '../../shared/utils/foco';
import { FinanceiroApiService } from './financeiro-api.service';
import { PlanoContasListaComponent } from './plano-contas-lista.component';
import { coletarExportacao } from '../../shared/utils/coletar-exportacao';
import { TabelaExportacao } from '../../shared/utils/exportacao-tabela';
import { Categoria, CategoriaRequest, Conta, Filtros, Movimento, MovimentoRequest, ROTULO_TIPO, Resumo, Tipo } from './financeiro.models';

function hojeLocal(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
@Component({
  selector: 'app-financeiro', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CommonModule, FormsModule, CabecalhoPaginaComponent, BarraFiltrosComponent, EstadoListaComponent, CampoDataComponent, ModalComponent, RodapeFormComponent, PlanoContasListaComponent],
  templateUrl: './financeiro.component.html', styleUrl: './financeiro.component.scss'
})
export class FinanceiroComponent implements OnInit, OnDestroy {
  private filtroExportacao?: Filtros;
  readonly dadosExportacao = async (): Promise<TabelaExportacao> => {
    if (this.aba === 'plano') return { nome: 'plano-contas', titulo: 'Servirea · Plano de contas', colunas: ['Nome', 'Tipo', 'Grupo', 'Situação'], linhas: this.categorias.map(c => [c.nome, c.tipo, c.ehGrupo ? 'Grupo' : this.categorias.find(g => g.id === c.grupoId)?.nome ?? '', c.ativo ? 'Ativa' : 'Inativa']) };
    const filtro = this.filtroExportacao;
    if (!filtro) throw new Error('Busque os lançamentos antes de exportar.');
    const itens = await coletarExportacao(pagina => this.api.listar({ ...filtro, pagina }), () => !this.destruido);
    return { nome: 'lancamentos-financeiros', titulo: 'Servirea · Lançamentos financeiros', contexto: `Período: ${filtro.de} a ${filtro.ate} · Busca: ${filtro.nome || 'todas'} · Tipo: ${filtro.tipo || 'todos'} · Situação: ${filtro.situacao || 'todas'}`, colunas: ['Descrição', 'Tipo', 'Situação', 'Valor (R$)', 'Vencimento', 'Data da baixa', 'Conta/banco', 'Conta contábil'], linhas: itens.map(m => [m.descricao, m.tipo, m.situacao, m.valor, m.vencimento, m.dataPagamento, m.conta, m.categoria]) };
  };
  readonly sessao = inject(SessaoAtual);
  private readonly api = inject(FinanceiroApiService);
  private readonly cd = inject(ChangeDetectorRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly dialogo = inject(DialogoService);
  private readonly rota = inject(ActivatedRoute);
  private readonly roteador = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  @ViewChild('formulario') formulario?: NgForm;
  readonly hoje = hojeLocal();
  /** Abas por endereço: /financeiro?aba=plano-de-contas abre direto o plano de contas. */
  private static readonly ABAS: Record<string, 'movimentos' | 'plano'> = { lancamentos: 'movimentos', 'plano-de-contas': 'plano' };
  aba: 'movimentos' | 'plano' = FinanceiroComponent.ABAS[this.rota.snapshot.queryParamMap.get('aba') ?? ''] ?? 'movimentos';
  readonly rotuloTipo = ROTULO_TIPO;
  filtro: Filtros = { de: this.hoje.slice(0, 7) + '-01', ate: this.hoje, nome: '', contaId: '', categoriaId: '', situacao: '', tipo: '', pagina: 0, tamanho: 30 };
  contas: Conta[] = []; categorias: Categoria[] = []; movimentos: Movimento[] = [];
  contasAtivas: Conta[] = []; contasContabeisAtivas: Categoria[] = [];
  total = 0; resumo: Resumo | null = null;
  carregando = false; salvando = false; erro = '';
  modal: 'movimento' | 'grupo' | 'contaContabil' | 'baixa' | null = null;
  editandoId: string | null = null; baixando: Movimento | null = null; dataPagamento = this.hoje;
  categoriaForm: CategoriaRequest = { nome: '', ativo: true, tipo: 'DESPESA', grupoId: null };
  /** Grupo (ou tipo, no grupo novo) fixo na edição: o tipo não muda enquanto houver contas ou lançamentos. */
  tipoTravado = false;
  movimentoForm: MovimentoRequest = this.novoMovimento();
  private geracao = 0; private destruido = false; private debounce?: ReturnType<typeof setTimeout>;
  ngOnInit() {
    // O menu lateral troca a aba pelo endereço (?aba=): a tela acompanha sem ser recriada.
    this.rota.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(p => {
      const nova = FinanceiroComponent.ABAS[p.get('aba') ?? ''] ?? 'movimentos';
      if (nova !== this.aba) { this.aba = nova; this.cd.markForCheck(); }
    });
    void this.carregar();
  }
  ngOnDestroy() { this.destruido = true; ++this.geracao; clearTimeout(this.debounce); }
  pode(codigo: string) { return this.sessao.permissoes().includes(codigo); }
  hasPendingChanges() { return this.salvando || (!!this.modal && !!this.formulario?.dirty); }
  private novoMovimento(): MovimentoRequest { return { descricao: '', tipo: 'RECEITA', valor: 0, vencimento: this.hoje, contaId: '', categoriaId: '', observacoes: '', versao: 0 }; }
  async carregar() {
    const geracao = ++this.geracao;
    this.carregando = true; this.erro = ''; this.cd.markForCheck();
    try {
      const f = { ...this.filtro };
      const [contas, categorias, pagina, resumo] = await Promise.all([this.api.contas(), this.api.categorias(), this.api.listar(f), this.api.resumo(f.de, f.ate)]);
      if (this.destruido || geracao !== this.geracao) return;
      this.contas = contas; this.categorias = categorias;
      this.contasAtivas = contas.filter(c => c.ativo);
      this.contasContabeisAtivas = categorias.filter(c => !c.ehGrupo && c.ativo && categorias.find(g => g.id === c.grupoId)?.ativo);
      this.movimentos = pagina.itens; this.total = pagina.total; this.resumo = resumo;
      this.filtroExportacao = f;
    } catch (e) {
      if (geracao === this.geracao) { this.erro = (e as Error).message; this.movimentos = []; this.resumo = null; this.total = 0; }
    } finally { if (!this.destruido && geracao === this.geracao) { this.carregando = false; this.cd.markForCheck(); } }
  }
  buscar() { clearTimeout(this.debounce); this.filtro.pagina = 0; void this.carregar(); }
  buscarTexto() { clearTimeout(this.debounce); this.debounce = setTimeout(() => this.buscar(), 300); }
  paginar(delta: number) { this.filtro.pagina += delta; void this.carregar(); }
  abrirMovimento(m?: Movimento) {
    if (!this.pode(m ? 'FINANCEIRO_ALTERAR' : 'FINANCEIRO_CRIAR') || (m && m.situacao !== 'PENDENTE')) return;
    this.editandoId = m?.id ?? null;
    this.movimentoForm = m ? { descricao: m.descricao, tipo: m.tipo, valor: m.valor, vencimento: m.vencimento, contaId: m.contaId, categoriaId: m.categoriaId, observacoes: m.observacoes ?? '', versao: m.versao } : this.novoMovimento();
    this.modal = 'movimento';
  }
  /** Grupo: organiza o plano de contas. Sem `grupo`, é novo (com o tipo escolhido). */
  abrirGrupo(grupo?: Categoria, tipo: Tipo = 'DESPESA') {
    if (!this.pode('FINANCEIRO_CONFIGURAR')) return;
    this.editandoId = grupo?.id ?? null;
    this.categoriaForm = { nome: grupo?.nome ?? '', ativo: grupo?.ativo ?? true, tipo: grupo?.tipo ?? tipo, grupoId: null };
    this.tipoTravado = !!grupo && this.categorias.some(c => c.grupoId === grupo.id);
    this.modal = 'grupo';
  }
  /** Conta contábil: recebe lançamentos. `grupo` pré-seleciona o grupo; `conta` edita uma existente. */
  abrirContaContabil(conta?: Categoria, grupo?: Categoria) {
    if (!this.pode('FINANCEIRO_CONFIGURAR')) return;
    const grupoId = conta?.grupoId ?? grupo?.id ?? '';
    this.editandoId = conta?.id ?? null;
    this.categoriaForm = { nome: conta?.nome ?? '', ativo: conta?.ativo ?? true, tipo: this.categorias.find(g => g.id === grupoId)?.tipo ?? 'DESPESA', grupoId };
    this.modal = 'contaContabil';
  }
  get grupos() { return this.categorias.filter(c => c.ehGrupo); }
  gruposDoTipo(tipo: Tipo) { return this.grupos.filter(g => g.tipo === tipo).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')); }
  /** O tipo da conta contábil é o do grupo escolhido. */
  trocouGrupo() { this.categoriaForm.tipo = this.categorias.find(g => g.id === this.categoriaForm.grupoId)?.tipo ?? this.categoriaForm.tipo; }
  /** Contas contábeis que aceitam lançamento do tipo informado (entrada ou saída), agrupadas pelo grupo no select. */
  contasParaLancamento(tipo: Tipo) {
    return this.gruposDoTipo(tipo).map(grupo => ({ grupo, contas: this.contasContabeisAtivas.filter(c => c.grupoId === grupo.id).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR')) })).filter(g => g.contas.length);
  }
  trocouTipoLancamento() {
    if (!this.contasContabeisAtivas.some(c => c.id === this.movimentoForm.categoriaId && c.tipo === this.movimentoForm.tipo)) this.movimentoForm.categoriaId = '';
  }
  /** "Grupo › Conta" para a lista de lançamentos. */
  rotuloContaContabil(id: string) {
    const c = this.categorias.find(x => x.id === id);
    const g = c?.grupoId ? this.categorias.find(x => x.id === c.grupoId) : null;
    return c ? (g ? `${g.nome} › ${c.nome}` : c.nome) : '';
  }
  mudarAba(aba: 'movimentos' | 'plano') {
    this.aba = aba; this.cd.markForCheck();
    const nome = Object.entries(FinanceiroComponent.ABAS).find(([, v]) => v === aba)?.[0];
    void this.roteador.navigate([], { relativeTo: this.rota, queryParams: { aba: nome }, replaceUrl: true });
  }
  abrirBaixa(m: Movimento) { if (!this.pode('FINANCEIRO_BAIXAR')) return; this.baixando = m; this.dataPagamento = this.hoje; this.modal = 'baixa'; }
  async fechar() {
    if (this.salvando) return;
    if (this.formulario?.dirty && !await this.dialogo.confirmar({ mensagem: 'Descartar as alterações ainda não salvas?', confirmar: 'Descartar', perigo: true })) return;
    this.modal = null; this.cd.markForCheck();
  }
  async salvar(form: NgForm) {
    if (this.salvando) return;
    if (form.invalid) { form.control.markAllAsTouched(); focarPrimeiroInvalido(this.host.nativeElement); return; }
    this.salvando = true;
    try {
      switch (this.modal) {
        case 'grupo': case 'contaContabil': await this.api.salvarCategoria(this.editandoId, { ...this.categoriaForm, grupoId: this.modal === 'grupo' ? null : this.categoriaForm.grupoId }); break;
        case 'movimento': await this.api.salvarMovimento(this.editandoId, this.movimentoForm); break;
        case 'baixa': if (this.baixando) await this.api.baixar(this.baixando, this.dataPagamento); break;
      }
      this.modal = null; await this.carregar();
    } catch (e) { await this.dialogo.avisar((e as Error).message); }
    finally { this.salvando = false; this.cd.markForCheck(); }
  }
  async acao(m: Movimento, acao: 'estornar' | 'cancelar') {
    if (this.salvando || !this.pode(acao === 'estornar' ? 'FINANCEIRO_BAIXAR' : 'FINANCEIRO_ALTERAR')) return;
    const mensagem = acao === 'estornar' ? 'Estornar esta baixa? O lançamento voltará a pendente e o saldo será recalculado.' : 'Cancelar este lançamento pendente?';
    if (!await this.dialogo.confirmar({ mensagem, confirmar: acao === 'estornar' ? 'Estornar' : 'Cancelar lançamento', perigo: true })) return;
    this.salvando = true; this.cd.markForCheck();
    try { await this.api.acao(m, acao); await this.carregar(); }
    catch (e) { await this.dialogo.avisar((e as Error).message); }
    finally { this.salvando = false; this.cd.markForCheck(); }
  }
}
