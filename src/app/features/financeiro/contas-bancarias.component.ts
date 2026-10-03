import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SessaoAtual } from '../../core/layout/sessao-atual';
import { CabecalhoPaginaComponent } from '../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { BarraFiltrosComponent, FiltroAtivo } from '../../shared/components/barra-filtros/barra-filtros.component';
import { EstadoListaComponent } from '../../shared/components/estado-lista/estado-lista.component';
import { FinanceiroApiService } from './financeiro-api.service';
import { Conta, ROTULO_TIPO_CONTA } from './financeiro.models';

type Situacao = 'ATIVA' | 'INATIVA' | '';
const sem = (x: string) => x.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

/** Lista das contas bancárias e do caixa. O cadastro e a edição abrem em página própria (conta-bancaria-form). */
@Component({
  selector: 'app-contas-bancarias', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, RouterLink, CabecalhoPaginaComponent, BarraFiltrosComponent, EstadoListaComponent],
  template: `
<div class="space-y-5">
  <app-cabecalho-pagina titulo="Contas bancárias" [exportacao]="dadosExportacao" [exportacaoOcupada]="carregando" subtitulo="O caixa e as contas bancárias da paróquia: banco, titular, agência, conta e chaves PIX." icone="🏦">
    @if (pode('FINANCEIRO_CONFIGURAR')) { <a acoes class="btn-primary" routerLink="/contas-bancarias/nova" data-nova-conta>Nova conta</a> }
  </app-cabecalho-pagina>
  @if (erro) { <div class="card p-4 text-red-600" role="alert">{{ erro }} <button class="btn-secondary ml-3" (click)="carregar()">Tentar novamente</button></div> }
  <section class="card p-4 space-y-4">
    <app-barra-filtros placeholder="Pesquisar conta, banco ou titular" [(termo)]="busca" (buscar)="aplicar()" [temFiltros]="true"
      [filtrosAtivos]="filtrosAtivos()" (removerFiltro)="remover($event)" (removerTodos)="remover()">
      <div><label class="label" for="situacaoConta">Situação</label>
        <select id="situacaoConta" class="field" [(ngModel)]="situacao" (ngModelChange)="aplicar()"><option value="ATIVA">Ativas</option><option value="INATIVA">Inativas</option><option value="">Todas</option></select></div>
    </app-barra-filtros>
    <div class="tabela-rolagem"><table class="tabela" data-contas>
      <thead><tr><th>Conta</th><th>Banco</th><th>Titular</th><th>Agência</th><th>Nº da conta</th><th>Saldo inicial</th><th>Situação</th><th>Ações</th></tr></thead>
      <tbody>
        @for (c of visiveis(); track c.id) {
          <tr><td>{{ c.nome }}<small class="block text-slate-500">{{ rotuloTipo(c) }}</small></td>
            <td>{{ c.banco || '—' }}</td><td>{{ c.titular || '—' }}</td><td>{{ c.agencia || '—' }}</td><td>{{ c.numeroConta || '—' }}</td>
            <td>{{ c.saldoInicial | currency:'BRL' }}</td>
            <td><span class="situacao" [class.pago]="c.ativo">{{ c.ativo ? 'Ativa' : 'Inativa' }}</span></td>
            <td>@if (pode('FINANCEIRO_CONFIGURAR')) { <a class="btn-secondary" [routerLink]="['/contas-bancarias', c.id]">Editar</a> }</td></tr>
        }
      </tbody></table></div>
    <app-estado-lista [carregando]="carregando" [vazio]="!visiveis().length" mensagemVazio="Nenhuma conta encontrada, tente outros filtros." />
  </section>
</div>`
})
export class ContasBancariasComponent implements OnInit {
  readonly dadosExportacao = () => ({ nome: 'contas-bancarias', titulo: 'Servirea · Contas bancárias', colunas: ['Nome', 'Banco', 'Tipo', 'Situação'], linhas: this.visiveis().map(c => [c.nome, c.banco ?? '', c.tipoConta ?? 'OUTRA', c.ativo ? 'Ativa' : 'Inativa']) });
  private readonly sessao = inject(SessaoAtual);
  private readonly api = inject(FinanceiroApiService);
  private readonly cd = inject(ChangeDetectorRef);
  contas: Conta[] = [];
  /** O que está aplicado na lista (só muda ao buscar); `busca` e `situacao` são o que está digitado. */
  private aplicado = { texto: '', situacao: 'ATIVA' as Situacao };
  busca = ''; situacao: Situacao = 'ATIVA';
  carregando = false; erro = '';

  ngOnInit() { void this.carregar(); }
  pode(codigo: string) { return this.sessao.permissoes().includes(codigo); }
  rotuloTipo(c: Conta) { return ROTULO_TIPO_CONTA[c.tipoConta ?? 'OUTRA']; }

  async carregar() {
    this.carregando = true; this.erro = ''; this.cd.markForCheck();
    try { this.contas = await this.api.contas(); }
    catch (e) { this.contas = []; this.erro = (e as Error).message; }
    finally { this.carregando = false; this.cd.markForCheck(); }
  }

  aplicar() { this.aplicado = { texto: this.busca, situacao: this.situacao }; this.cd.markForCheck(); }
  remover(chave?: string) {
    if (!chave || chave === 'texto') this.busca = '';
    if (!chave || chave === 'situacao') this.situacao = '';
    this.aplicar();
  }

  filtrosAtivos(): FiltroAtivo[] {
    const lista: FiltroAtivo[] = [];
    if (this.aplicado.situacao) lista.push({ chave: 'situacao', rotulo: `Situação: ${this.aplicado.situacao === 'ATIVA' ? 'Ativa' : 'Inativa'}` });
    if (this.aplicado.texto.trim()) lista.push({ chave: 'texto', rotulo: `Busca: ${this.aplicado.texto.trim()}` });
    return lista;
  }

  visiveis(): Conta[] {
    const t = sem(this.aplicado.texto);
    return this.contas.filter(c =>
      (!this.aplicado.situacao || c.ativo === (this.aplicado.situacao === 'ATIVA')) &&
      (!t || sem([c.nome, c.banco, c.titular, c.agencia, c.numeroConta].filter(Boolean).join(' ')).includes(t)));
  }
}
