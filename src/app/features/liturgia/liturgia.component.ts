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
import { LiturgiaApiService, Referencia, Roteiro } from './liturgia-api.service';
@Component({ selector: 'app-liturgia', imports: [CommonModule, FormsModule, CabecalhoPaginaComponent, BarraFiltrosComponent, EstadoListaComponent, RodapeFormComponent], changeDetection: ChangeDetectionStrategy.OnPush, templateUrl: './liturgia.component.html' })
export class LiturgiaComponent implements OnInit, OnDestroy {
    private buscaExportacao = '';
    readonly dadosExportacao = async (): Promise<TabelaExportacao> => {
      const busca = this.buscaExportacao;
      if (this.aba === 'referencias') {
        const itens = await coletarExportacao(p => firstValueFrom(this.api.referencias(busca, p)), () => !this.destruido);
        return { nome: 'referencias-liturgicas', titulo: 'Servirea · Referências litúrgicas', contexto: `Busca: ${busca || 'todas'}`, colunas: ['Título', 'Fonte', 'Endereço', 'Observação', 'Situação'], linhas: itens.map(r => [r.titulo, r.fonte, r.url, r.observacao, r.ativo ? 'Ativa' : 'Inativa']) };
      }
      const itens = await coletarExportacao(p => firstValueFrom(this.api.roteiros(busca, p)), () => !this.destruido);
      return { nome: 'roteiros-liturgicos', titulo: 'Servirea · Roteiros litúrgicos', contexto: `Busca: ${busca || 'todos'}`, colunas: ['Título', 'Celebração', 'Sequência', 'Situação'], linhas: itens.map(r => [r.titulo, r.celebracao, r.passos.map((p, i) => `${i + 1}. ${p.titulo}${p.observacao ? ` — ${p.observacao}` : ''}`).join('\n'), r.ativo ? 'Ativo' : 'Inativo']) };
    };
    private readonly api = inject(LiturgiaApiService);
    private readonly sessao = inject(SessaoAtual);
    private readonly dialogo = inject(DialogoService);
    private leitura?: Subscription;
    private escrita?: Subscription;
    private diretorio?: Subscription;
    private destruido = false;
    readonly referencias = signal<Referencia[]>([]);
    readonly roteiros = signal<Roteiro[]>([]);
    readonly opcoes = signal<Referencia[]>([]);
    readonly total = signal(0);
    readonly erro = signal('');
    readonly aviso = signal('');
    readonly carregando = signal(false);
    readonly ocupado = signal(false);
    readonly alterado = signal(false);
    aba: 'referencias' | 'roteiros' = 'referencias';
    busca = '';
    pagina = 0;
    buscaReferencia = '';
    paginaReferencia = 0;
    totalReferencias = 0;
    referencia: Referencia | null = null;
    roteiro: Roteiro | null = null;
    ngOnInit() { this.carregar(); }
    podeEditar() { return this.sessao.permissoes().includes('LITURGIA_EDITAR'); }
    hasPendingChanges() { return this.alterado(); }
    carregar() { this.buscaExportacao = this.busca; this.leitura?.unsubscribe(); this.erro.set(''); this.carregando.set(true); if (this.aba === 'referencias') {
        this.leitura = this.api.referencias(this.busca, this.pagina).subscribe({ next: p => { this.referencias.set(p.itens); this.total.set(p.total); this.carregando.set(false); }, error: e => this.falhaLista(e) });
    }
    else {
        this.leitura = this.api.roteiros(this.busca, this.pagina).subscribe({ next: p => { this.roteiros.set(p.itens); this.total.set(p.total); this.carregando.set(false); }, error: e => this.falhaLista(e) });
    } }
    private falhaLista(e: unknown) { this.referencias.set([]); this.roteiros.set([]); this.total.set(0); this.carregando.set(false); this.erro.set(mensagemApi(e, 'Não foi possível consultar.')); }
    buscar() { this.pagina = 0; this.carregar(); }
    paginar(d: number) { if (this.carregando() || this.pagina + d < 0)
        return; this.pagina += d; this.carregar(); }
    async trocar(aba: 'referencias' | 'roteiros') { if (await this.fechar()) {
        this.aba = aba;
        this.busca = '';
        this.pagina = 0;
        this.carregar();
    } }
    async abrirReferencia(r?: Referencia) { if (!await this.fechar() || this.destruido)
        return; this.referencia = r ? { ...r } : { id: '', versao: 0, titulo: '', fonte: '', url: null, observacao: null, ativo: true }; }
    async abrirRoteiro(r?: Roteiro) { if (!await this.fechar() || this.destruido)
        return; this.roteiro = r ? { ...r, passos: r.passos.map(p => ({ ...p })) } : { id: '', versao: 0, titulo: '', celebracao: '', passos: [{ titulo: '', referenciaId: null, observacao: null }], ativo: true }; this.buscarReferencias(); }
    async fechar() { if (this.ocupado())
        return false; if (this.alterado() && !await this.dialogo.confirmar({ mensagem: 'Descartar as alterações não salvas?', confirmar: 'Descartar', perigo: true }))
        return false; if (this.destruido)
        return false; this.referencia = null; this.roteiro = null; this.alterado.set(false); return true; }
    buscarReferencias(pagina = 0) { this.paginaReferencia = pagina; this.diretorio?.unsubscribe(); this.diretorio = this.api.referencias(this.buscaReferencia, pagina).subscribe({ next: p => { this.opcoes.set(p.itens); this.totalReferencias = p.total; }, error: e => { this.opcoes.set([]); this.erro.set(mensagemApi(e, 'Busca de referências indisponível.')); } }); }
    nomeReferencia(id: string) { const r = this.opcoes().find(r => r.id === id); return r ? `${r.titulo} · ${r.fonte}` : 'Referência selecionada (use a busca para consultar o cadastro)'; }
    adicionarPasso() { if (!this.podeEditar() || this.ocupado() || !this.roteiro || this.roteiro.passos.length >= 50)
        return; this.roteiro.passos.push({ titulo: '', referenciaId: null, observacao: null }); this.alterado.set(true); }
    mover(i: number, d: number) { if (!this.podeEditar() || this.ocupado() || !this.roteiro)
        return; const p = this.roteiro.passos; const j = i + d; if (j < 0 || j >= p.length)
        return; [p[i], p[j]] = [p[j], p[i]]; this.alterado.set(true); }
    removerPasso(i: number) { if (!this.podeEditar() || this.ocupado() || !this.roteiro || this.roteiro.passos.length <= 1)
        return; this.roteiro.passos.splice(i, 1); this.alterado.set(true); }
    salvar(form: NgForm) { if (!this.podeEditar() || this.ocupado())
        return; if (form.invalid) {
        form.control.markAllAsTouched();
        return;
    } this.erro.set(''); this.ocupado.set(true); const sucesso = () => { this.ocupado.set(false); this.alterado.set(false); this.referencia = null; this.roteiro = null; this.aviso.set('Registro salvo.'); this.carregar(); }; const falha = (e: unknown) => { this.ocupado.set(false); this.erro.set(mensagemApi(e, 'Não foi possível salvar. Atualize se houver conflito.')); }; if (this.referencia)
        this.escrita = this.api.salvarReferencia({ ...this.referencia }).subscribe({ next: sucesso, error: falha });
    else if (this.roteiro)
        this.escrita = this.api.salvarRoteiro({ ...this.roteiro, passos: this.roteiro.passos.map(p => ({ ...p })) }).subscribe({ next: sucesso, error: falha });
    else
        this.ocupado.set(false); }
    ngOnDestroy() { this.destruido = true; this.leitura?.unsubscribe(); this.escrita?.unsubscribe(); this.diretorio?.unsubscribe(); }
}
