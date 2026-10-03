import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Subscription, firstValueFrom } from 'rxjs';
import { coletarExportacao } from '../../shared/utils/coletar-exportacao';
import { TabelaExportacao } from '../../shared/utils/exportacao-tabela';
import { SessaoAtual } from '../../core/layout/sessao-atual';
import { mensagemApi } from '../../core/api/api-error';
import { DialogoService } from '../../shared/services/dialogo.service';
import { CabecalhoPaginaComponent } from '../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { BarraFiltrosComponent } from '../../shared/components/barra-filtros/barra-filtros.component';
import { EstadoListaComponent } from '../../shared/components/estado-lista/estado-lista.component';
import { RodapeFormComponent } from '../../shared/components/rodape-form/rodape-form.component';
import { EstoqueApiService, ItemEstoque, MovimentoEstoque, MovimentarEstoque } from './estoque-api.service';
@Component({ selector: 'app-estoque', imports: [CommonModule, FormsModule, CabecalhoPaginaComponent, BarraFiltrosComponent, EstadoListaComponent, RodapeFormComponent], changeDetection: ChangeDetectionStrategy.OnPush, templateUrl: './estoque.component.html' })
export class EstoqueComponent implements OnInit, OnDestroy {
    private buscaExportacao = '';
    readonly dadosExportacao = async (): Promise<TabelaExportacao> => {
      const item = this.atual(), busca = this.buscaExportacao;
      if (item) {
        const itens = await coletarExportacao(p => firstValueFrom(this.api.historico(item.id, p)), () => !this.destruido);
        return { nome: 'historico-estoque', titulo: `Servirea · ${item.nome}`, colunas: ['Data', 'Tipo', 'Quantidade', 'Saldo anterior', 'Saldo posterior', 'Motivo', 'Responsável'], linhas: itens.map(m => [m.registradoEm, m.tipo, m.quantidade, m.saldoAntes, m.saldoDepois, m.motivo, m.responsavelNome ?? '']) };
      }
      const itens = await coletarExportacao(p => firstValueFrom(this.api.listar(busca, p)), () => !this.destruido);
      return { nome: 'estoque-patrimonio', titulo: 'Servirea · Estoque e patrimônio', contexto: `Busca: ${busca || 'todos'}`, colunas: ['Código', 'Nome', 'Tipo', 'Unidade', 'Local', 'Responsável', 'Saldo', 'Situação'], linhas: itens.map(i => [i.codigo, i.nome, i.tipo, i.unidade, i.local, i.responsavelNome ?? '', i.saldo, i.ativo ? 'Ativo' : 'Inativo']) };
    };
    private readonly api = inject(EstoqueApiService);
    private readonly sessao = inject(SessaoAtual);
    private readonly dialogo = inject(DialogoService);
    private leitura?: Subscription;
    private detalhe?: Subscription;
    private escrita?: Subscription;
    private diretorio?: Subscription;
    private historicoCarga?: Subscription;
    private destruido = false;
    readonly itens = signal<ItemEstoque[]>([]);
    readonly total = signal(0);
    readonly historico = signal<MovimentoEstoque[]>([]);
    readonly totalHistorico = signal(0);
    readonly responsaveis = signal<{
        id: string;
        nome: string;
    }[]>([]);
    readonly erro = signal('');
    readonly aviso = signal('');
    readonly carregando = signal(false);
    readonly ocupado = signal(false);
    readonly alterado = signal(false);
    readonly atual = signal<ItemEstoque | null>(null);
    busca = '';
    pagina = 0;
    paginaHistorico = 0;
    buscaResponsavel = '';
    form: ItemEstoque | null = null;
    movimento: MovimentarEstoque | null = null;
    private pedido: MovimentarEstoque | null = null;
    ngOnInit() { this.carregar(); }
    pode(c: string) { return this.sessao.permissoes().includes(c); }
    hasPendingChanges() { return this.alterado(); }
    carregar() { this.buscaExportacao = this.busca; this.leitura?.unsubscribe(); this.carregando.set(true); this.erro.set(''); this.leitura = this.api.listar(this.busca, this.pagina).subscribe({ next: r => { this.itens.set(r.itens); this.total.set(r.total); this.carregando.set(false); }, error: e => { this.itens.set([]); this.total.set(0); this.carregando.set(false); this.erro.set(mensagemApi(e, 'Não foi possível consultar estoque.')); } }); }
    buscar() { this.pagina = 0; this.carregar(); }
    paginar(d: number) { if (this.carregando() || this.pagina + d < 0)
        return; this.pagina += d; this.carregar(); }
    async abrir(item?: ItemEstoque) { if (!await this.fechar() || this.destruido)
        return; if (!item) {
        if (!this.pode('ESTOQUE_EDITAR'))
            return;
        this.form = { id: '', versao: 0, nome: '', codigo: '', tipo: 'CONSUMIVEL', unidade: 'unidade', local: null, responsavelUsuarioId: null, ativo: true, saldo: 0 };
        this.buscarResponsaveis();
        return;
    } this.ocupado.set(true); this.detalhe?.unsubscribe(); this.detalhe = this.api.buscar(item.id).subscribe({ next: r => { this.atual.set(r); this.form = { ...r }; this.ocupado.set(false); this.paginaHistorico = 0; this.carregarHistorico(); this.buscarResponsaveis(); }, error: e => { this.ocupado.set(false); this.erro.set(mensagemApi(e, 'Item indisponível.')); } }); }
    async fechar() { if (this.ocupado())
        return false; if (this.alterado() && !await this.dialogo.confirmar({ mensagem: 'Descartar as alterações não salvas?', confirmar: 'Descartar', perigo: true }))
        return false; if (this.destruido)
        return false; this.detalhe?.unsubscribe(); this.historicoCarga?.unsubscribe(); this.form = null; this.movimento = null; this.pedido = null; this.atual.set(null); this.historico.set([]); this.totalHistorico.set(0); this.alterado.set(false); return true; }
    buscarResponsaveis() { this.diretorio?.unsubscribe(); this.diretorio = this.api.responsaveis(this.buscaResponsavel).subscribe({ next: r => this.responsaveis.set(r), error: e => { this.responsaveis.set([]); this.erro.set(mensagemApi(e, 'Diretório indisponível.')); } }); }
    carregarHistorico(d = 0) { const a = this.atual(); if (!a || this.paginaHistorico + d < 0)
        return; this.paginaHistorico += d; this.historicoCarga?.unsubscribe(); this.historicoCarga = this.api.historico(a.id, this.paginaHistorico).subscribe({ next: r => { this.historico.set(r.itens); this.totalHistorico.set(r.total); }, error: e => { this.historico.set([]); this.totalHistorico.set(0); this.erro.set(mensagemApi(e, 'Histórico indisponível.')); } }); }
    salvar(f: NgForm) { if (!this.form || this.movimento || this.ocupado() || !this.pode('ESTOQUE_EDITAR'))
        return; if (f.invalid) {
        f.control.markAllAsTouched();
        return;
    } this.ocupado.set(true); this.erro.set(''); this.escrita = this.api.salvar({ ...this.form }).subscribe({ next: r => { this.form = { ...r }; this.atual.set(r); this.alterado.set(false); this.ocupado.set(false); this.aviso.set('Item salvo. Saldo só muda por movimento.'); this.carregar(); }, error: e => { this.ocupado.set(false); this.erro.set(mensagemApi(e, 'Não foi possível salvar. Atualize se houver conflito.')); } }); }
    iniciarMovimento() { const a = this.atual(); if (!a || !a.ativo || this.ocupado() || this.alterado() || !this.pode('ESTOQUE_MOVIMENTAR'))
        return; this.movimento = { versao: a.versao, chave: crypto.randomUUID(), tipo: 'ENTRADA', quantidade: 1, motivo: '', responsavelUsuarioId: a.responsavelUsuarioId }; this.pedido = null; }
    async registrar(f: NgForm) { const a = this.atual(); if (!a || !this.movimento || this.ocupado() || !this.pode('ESTOQUE_MOVIMENTAR') || this.movimento.tipo === 'AJUSTE' && !this.pode('ESTOQUE_AJUSTAR'))
        return; if (f.invalid) {
        f.control.markAllAsTouched();
        return;
    } const r = this.pedido ?? { ...this.movimento }; this.ocupado.set(true); try {
        if (!await this.dialogo.confirmar({ mensagem: r.tipo === 'AJUSTE' ? 'Definir o saldo contado e registrar o ajuste no histórico?' : 'Registrar esta movimentação no histórico?', confirmar: 'Registrar' }) || this.destruido) {
            this.ocupado.set(false);
            return;
        }
        this.pedido = r;
        this.escrita = this.api.movimentar(a.id, r).subscribe({ next: () => { this.movimento = null; this.pedido = null; this.ocupado.set(false); this.alterado.set(false); void this.abrir(a); this.carregar(); this.aviso.set('Movimento registrado.'); }, error: e => { this.ocupado.set(false); this.erro.set(mensagemApi(e, 'Resultado não confirmado. Tentar novamente reapresenta o mesmo pedido; não edite a quantidade até conferir o histórico.')); } });
    }
    catch {
        this.ocupado.set(false);
    } }
    pedidoPendente() { return !!this.pedido; }
    async cancelarMovimento() { if (this.ocupado())
        return; if (this.pedido && !await this.dialogo.confirmar({ mensagem: 'O resultado do pedido anterior pode ser desconhecido. Confira o histórico antes de iniciar outro movimento. Fechar este formulário?', confirmar: 'Fechar' }))
        return; if (this.destruido)
        return; this.movimento = null; this.pedido = null; this.alterado.set(false); }
    ngOnDestroy() { this.destruido = true; this.leitura?.unsubscribe(); this.detalhe?.unsubscribe(); this.escrita?.unsubscribe(); this.diretorio?.unsubscribe(); this.historicoCarga?.unsubscribe(); }
}
