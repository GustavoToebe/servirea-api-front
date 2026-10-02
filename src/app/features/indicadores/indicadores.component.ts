import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { Subscription } from 'rxjs';
import { SessaoAtual } from '../../core/layout/sessao-atual';
import { mensagemApi } from '../../core/api/api-error';
import { DialogoService } from '../../shared/services/dialogo.service';
import { CabecalhoPaginaComponent } from '../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { BarraFiltrosComponent } from '../../shared/components/barra-filtros/barra-filtros.component';
import { EstadoListaComponent } from '../../shared/components/estado-lista/estado-lista.component';
import { RodapeFormComponent } from '../../shared/components/rodape-form/rodape-form.component';
import { CampoDataComponent } from '../../shared/components/datas/campo-data.component';
import { IndicadoresApiService, Indicadores } from './indicadores-api.service';
@Component({ selector: 'app-indicadores', imports: [CommonModule, FormsModule, CabecalhoPaginaComponent, BarraFiltrosComponent, EstadoListaComponent, CampoDataComponent], changeDetection: ChangeDetectionStrategy.OnPush, template: `
<div class="space-y-5"><app-cabecalho-pagina titulo="Indicadores privados de participação" subtitulo="Contagens para a coordenação, em ordem alfabética. Sem pontuação ou ranking público."/><p class="card p-4">Somente vagas ocupadas de escalas finalizadas, sem linhas de referência. Alocação e confirmação não comprovam presença. Presenças pendentes incluem celebrações futuras e registros ainda não conferidos.</p>
<app-barra-filtros [(termo)]="busca" (buscar)="buscar()"><label class="label">De</label><app-campo-data [(ngModel)]="de"/><label class="label">Até</label><app-campo-data [(ngModel)]="ate"/></app-barra-filtros>@if(erro()){<p role="alert" class="card p-4 text-red-700">{{erro()}}</p>}
@if(dados();as d){<section class="card p-4"><h2 class="secao-titulo">Resumo do período e busca</h2><p>{{d.resumo.alocacoes}} alocações · {{d.resumo.presentes}} presentes · {{d.resumo.faltas}} faltas · {{d.resumo.presencasPendentes}} presenças pendentes</p><p>{{d.resumo.confirmacoes}} confirmações · {{d.resumo.recusas}} recusas</p></section><section class="card p-4"><div class="overflow-auto"><table class="tabela w-full"><thead><tr><th>Pessoa</th><th>Alocações</th><th>Presentes</th><th>Faltas</th><th>Pendentes</th><th>Confirmou</th><th>Recusou</th></tr></thead><tbody>@for(p of d.itens;track p.pessoaId){<tr><td>{{p.nome}}</td><td>{{p.contagens.alocacoes}}</td><td>{{p.contagens.presentes}}</td><td>{{p.contagens.faltas}}</td><td>{{p.contagens.presencasPendentes}}</td><td>{{p.contagens.confirmacoes}}</td><td>{{p.contagens.recusas}}</td></tr>}</tbody></table></div><app-estado-lista [carregando]="carregando()" [vazio]="!d.total"/><div class="flex gap-3 mt-4"><button class="btn-secondary" [disabled]="pagina===0||carregando()" (click)="paginar(-1)">Anterior</button><span>Página {{pagina+1}} · {{d.total}} pessoas</span><button class="btn-secondary" [disabled]="(pagina+1)*30>=d.total||carregando()" (click)="paginar(1)">Próxima</button></div></section>}@else{<app-estado-lista [carregando]="carregando()"/>}</div>` })
export class IndicadoresComponent implements OnInit, OnDestroy {
    private readonly api = inject(IndicadoresApiService);
    private leitura?: Subscription;
    readonly dados = signal<Indicadores | null>(null);
    readonly carregando = signal(false);
    readonly erro = signal('');
    busca = '';
    pagina = 0;
    private iso(d: Date) { return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, '0'), String(d.getDate()).padStart(2, '0')].join('-'); }
    de = this.iso(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
    ate = this.iso(new Date());
    ngOnInit() { this.carregar(); }
    buscar() { this.pagina = 0; this.carregar(); }
    paginar(d: number) { if (this.carregando() || this.pagina + d < 0)
        return; this.pagina += d; this.carregar(); }
    carregar() { this.leitura?.unsubscribe(); this.dados.set(null); this.erro.set(''); this.carregando.set(true); this.leitura = this.api.consultar(this.de, this.ate, this.busca, this.pagina).subscribe({ next: r => { this.dados.set(r); this.carregando.set(false); }, error: e => { this.carregando.set(false); this.erro.set(mensagemApi(e, 'Indicadores indisponíveis.')); } }); }
    ngOnDestroy() { this.leitura?.unsubscribe(); }
}
