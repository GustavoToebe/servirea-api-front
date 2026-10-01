import { RouterLink } from '@angular/router';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
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
import { Categoria, Conta, Filtros, Movimento, MovimentoRequest, Resumo } from './financeiro.models';

function hojeLocal(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
@Component({
  selector: 'app-financeiro', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, CommonModule, FormsModule, CabecalhoPaginaComponent, BarraFiltrosComponent, EstadoListaComponent, CampoDataComponent, ModalComponent, RodapeFormComponent],
  templateUrl: './financeiro.component.html', styleUrl: './financeiro.component.scss'
})
export class FinanceiroComponent implements OnInit, OnDestroy {
  readonly sessao = inject(SessaoAtual);
  private readonly api = inject(FinanceiroApiService);
  private readonly cd = inject(ChangeDetectorRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly dialogo = inject(DialogoService);
  @ViewChild('formulario') formulario?: NgForm;
  readonly hoje = hojeLocal();
  aba: 'movimentos' | 'contas' | 'categorias' = 'movimentos';
  filtro: Filtros = { de: this.hoje.slice(0, 7) + '-01', ate: this.hoje, nome: '', contaId: '', categoriaId: '', situacao: '', tipo: '', pagina: 0, tamanho: 30 };
  contas: Conta[] = []; categorias: Categoria[] = []; movimentos: Movimento[] = [];
  contasAtivas: Conta[] = []; categoriasAtivas: Categoria[] = [];
  total = 0; resumo: Resumo | null = null;
  carregando = false; salvando = false; erro = '';
  modal: 'movimento' | 'conta' | 'categoria' | 'baixa' | null = null;
  editandoId: string | null = null; baixando: Movimento | null = null; dataPagamento = this.hoje;
  contaForm: Omit<Conta, 'id'> = { nome: '', saldoInicial: 0, dataSaldoInicial: this.hoje, ativo: true };
  categoriaForm: Omit<Categoria, 'id'> = { nome: '', ativo: true };
  movimentoForm: MovimentoRequest = this.novoMovimento();
  private geracao = 0; private destruido = false; private debounce?: ReturnType<typeof setTimeout>;
  ngOnInit() { void this.carregar(); }
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
      this.contasAtivas = contas.filter(c => c.ativo); this.categoriasAtivas = categorias.filter(c => c.ativo);
      this.movimentos = pagina.itens; this.total = pagina.total; this.resumo = resumo;
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
  abrirConta(c?: Conta) {
    if (!this.pode('FINANCEIRO_CONFIGURAR')) return;
    this.editandoId = c?.id ?? null;
    this.contaForm = c ? { nome: c.nome, saldoInicial: c.saldoInicial, dataSaldoInicial: c.dataSaldoInicial, ativo: c.ativo } : { nome: '', saldoInicial: 0, dataSaldoInicial: this.hoje, ativo: true };
    this.modal = 'conta';
  }
  abrirCategoria(c?: Categoria) {
    if (!this.pode('FINANCEIRO_CONFIGURAR')) return;
    this.editandoId = c?.id ?? null; this.categoriaForm = { nome: c?.nome ?? '', ativo: c?.ativo ?? true }; this.modal = 'categoria';
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
        case 'conta': await this.api.salvarConta(this.editandoId, this.contaForm); break;
        case 'categoria': await this.api.salvarCategoria(this.editandoId, this.categoriaForm); break;
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
