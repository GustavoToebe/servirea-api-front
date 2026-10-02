import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, ViewChild, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SelectBuscaComponent, OpcaoSelectBusca } from '../../../shared/components/select-busca/select-busca.component';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { SessaoAtual } from '../../../core/layout/sessao-atual';
import { mensagemApi } from '../../../core/api/api-error';
import { CabecalhoPaginaComponent } from '../../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { RodapeFormComponent } from '../../../shared/components/rodape-form/rodape-form.component';
import { ImportacoesPessoasService, PreviaImportacao, EstruturaImportacao, OpcoesImportacao } from '../services/importacoes-pessoas.service';

@Component({selector:'app-importar-pessoas',changeDetection:ChangeDetectionStrategy.OnPush,
  imports:[FormsModule,SelectBuscaComponent,RouterLink,CabecalhoPaginaComponent,RodapeFormComponent],
  template:`
    <div class="space-y-6">
      <app-cabecalho-pagina titulo="Importar pessoas" subtitulo="Confira o lote antes de criar os cadastros.">
        <a acoes routerLink="/pessoas" class="btn-secondary">Pessoas</a>
      </app-cabecalho-pagina>
      @if (!permitido) { <div class="card p-5" role="alert">É necessário acesso a Pessoas e permissão para criar cadastros.</div> }
      @else {
        <form ngNoForm (submit)="$event.preventDefault();confirmar()" class="space-y-6">
          <section class="card secao-form">
            <h2 class="secao-titulo">Arquivo CSV ou XLSX</h2>
            <p class="text-sm">Até 100 pessoas, 30 colunas e 512 KiB por lote. CSV em UTF-8, separado por ponto e vírgula ou vírgula. No XLSX, selecione uma aba. A primeira linha preenchida será o cabeçalho (nas primeiras 20 linhas).</p>
            <p class="mt-2 text-sm">Papel: RESPONSAVEL, COROINHA, ACOLITO, AMBOS ou MESC. CPF, e-mail e telefone são opcionais. No Excel, mantenha CPF e telefone como texto desde a origem, preservando zeros. Substitua fórmulas por valores; remova macros, vínculos externos e células mescladas.</p>
            <p class="mt-2 text-sm text-slate-500">Duplicidades por nome ou CPF bloqueiam o lote para revisão. Nenhuma ficha existente será alterada. Voluntários não recebem autorização de WhatsApp automaticamente. Um lote confirmado consome uma importação mensal; prévias e repetições da mesma confirmação não consomem outra.</p>
            <a class="btn-secondary inline-block mt-3" download="modelo-pessoas.csv" href="data:text/csv;charset=utf-8,%EF%BB%BFnome%3Bpapel%3Bcpf%3Bemail%3Btelefone%0AAna%3BRESPONSAVEL%3B%3B%3B%0A">Baixar modelo CSV</a>
            <label class="label mt-4" for="arquivo-csv">Selecionar arquivo</label>
            <input #entradaArquivo id="arquivo-csv" type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" class="field" [disabled]="ocupado()" (change)="selecionar($event)">
            <button type="button" class="btn-secondary mt-3" [disabled]="!arquivo || ocupado()" (click)="analisar()">{{ ocupado() ? 'Processando...' : 'Ler colunas' }}</button>
          </section>
          @if (estrutura(); as e) {
            <section class="card secao-form">
              <h2 class="secao-titulo">Mapear colunas</h2>
              @if (e.linhaCabecalho) {<p class="text-sm mb-3">Cabeçalho na linha {{ e.linhaCabecalho }}. Confira a sugestão e escolha uma coluna diferente para cada campo. Colunas não selecionadas serão ignoradas.</p>}
              @else {<p class="text-sm mb-3">Esta aba está vazia. Selecione outra aba com cabeçalho e pessoas.</p>}
              @if (e.abas.length > 1) {
                <label class="label" for="aba-importacao">Aba da planilha</label>
                <select id="aba-importacao" class="field mb-4" [disabled]="ocupado()" [ngModel]="aba" [ngModelOptions]="{standalone:true}" (ngModelChange)="trocarAba(+$event)">
                  @for (a of e.abas;track a.indice) {<option [ngValue]="a.indice">{{ a.nome }}</option>}
                </select>
              }
              <div class="grade-form">
                @for (campo of campos;track campo.codigo) {
                  <div role="group" [attr.aria-labelledby]="'rotulo-importar-'+campo.codigo">
                    <span class="label" [id]="'rotulo-importar-'+campo.codigo">{{ campo.rotulo }}{{ campo.obrigatorio ? ' *' : '' }}</span>
                    <app-select-busca [opcoes]="colunas(e,campo.obrigatorio)" [ngModel]="mapeamento()[campo.codigo]" [ngModelOptions]="{standalone:true}" (ngModelChange)="mapear(campo.codigo,$event)" [disabled]="ocupado()" [limpavel]="false" placeholder="Selecione uma coluna" />
                  </div>
                }
              </div>
              @if (!mapeamentoValido()) {<p class="text-sm text-red-700 mt-3" role="alert">Selecione nome e papel, sem repetir colunas.</p>}
              <button type="button" class="btn-secondary mt-3" [disabled]="ocupado() || !mapeamentoValido()" (click)="conferir()">Gerar prévia</button>
            </section>
          }
          @if (erro()) {<div role="alert" class="card p-4 text-red-700 dark:text-red-300">{{ erro() }}</div>}
          @if (sucesso()) {<div role="status" class="card p-4 text-emerald-700 dark:text-emerald-300">{{ sucesso() }}</div>}
          @if (previa(); as p) {
            <section class="card p-5">
              <h2 class="secao-titulo">Prévia: {{ p.quantidade }} pessoa(s)</h2>
              <p class="text-sm mb-3">{{ p.podeConfirmar ? 'Arquivo pronto para confirmar. O lote inteiro será validado novamente.' : 'Corrija o arquivo e gere uma nova prévia. Nenhum cadastro foi criado.' }}</p>
              <div class="tabela-rolagem"><table class="tabela">
                <thead><tr><th>Linha</th><th>Nome</th><th>Papel</th><th>CPF</th><th>E-mail</th><th>Telefone</th><th>Conferência</th></tr></thead>
                <tbody>@for (linha of p.linhas;track linha.linha) {
                  <tr><td>{{ linha.linha }}</td><td>{{ linha.nome }}</td><td>{{ linha.papel || '—' }}</td><td>{{ linha.cpf || '—' }}</td><td>{{ linha.email || '—' }}</td><td>{{ linha.telefone || '—' }}</td><td>
                    <span class="badge" [class.bg-red-50]="!!linha.erro" [class.text-red-700]="!!linha.erro" [class.bg-emerald-50]="!linha.erro" [class.text-emerald-700]="!linha.erro">{{ linha.erro ? 'Revisar' : 'Pronta' }}</span>
                    @if (linha.erro) {<p class="text-sm">{{ linha.erro }}</p>}
                  </td></tr>
                }</tbody>
              </table></div>
            </section>
          }
          <app-rodape-form voltarUrl="/pessoas" rotuloSalvar="Confirmar importação" [carregando]="ocupado()" [desabilitado]="!previa()?.podeConfirmar || !!sucesso()" />
        </form>
      }
    </div>
  `})
export class ImportarPessoasComponent implements OnDestroy {
  @ViewChild('entradaArquivo') private entradaArquivo?:ElementRef<HTMLInputElement>;
  private api=inject(ImportacoesPessoasService);private sessao=inject(SessaoAtual);private carga?:Subscription;
  arquivo:File|null=null; private chave=''; private opcoesDaPrevia?:OpcoesImportacao;
  aba=0;estrutura=signal<EstruturaImportacao|null>(null);mapeamento=signal<Record<string,string>>({});
  readonly campos=[{codigo:'nome',rotulo:'Nome',obrigatorio:true},{codigo:'papel',rotulo:'Papel',obrigatorio:true},{codigo:'cpf',rotulo:'CPF',obrigatorio:false},{codigo:'email',rotulo:'E-mail',obrigatorio:false},{codigo:'telefone',rotulo:'Telefone',obrigatorio:false}];
  previa=signal<PreviaImportacao|null>(null);
  ocupado=signal(false);erro=signal('');sucesso=signal('');
  get permitido() {const p=this.sessao.permissoes();return p.includes('PESSOA') && p.includes('PESSOA_CRIAR');}
  selecionar(event:Event) {
    if(this.ocupado() || !this.permitido) return;
    this.carga?.unsubscribe();this.previa.set(null);this.estrutura.set(null);this.opcoesDaPrevia=undefined;this.aba=0;this.mapeamento.set({});this.erro.set('');this.sucesso.set('');
    const arquivo=(event.target as HTMLInputElement).files?.[0] ?? null;
    this.arquivo=null;
    if(!arquivo) return;
    if(arquivo.size>524288 || !/\.(csv|xlsx)$/i.test(arquivo.name)) {this.erro.set('Selecione CSV ou XLSX de até 512 KiB.');return;}
    this.arquivo=arquivo;this.chave=crypto.randomUUID();
  }
  analisar() {
    if(!this.arquivo || this.ocupado() || !this.permitido) return;
    this.carga?.unsubscribe();this.ocupado.set(true);this.erro.set('');this.previa.set(null);this.estrutura.set(null);this.opcoesDaPrevia=undefined;this.sucesso.set('');this.chave=crypto.randomUUID();
    this.carga=this.api.estrutura(this.arquivo,this.aba).subscribe({next:e => {
      this.estrutura.set(e);this.mapeamento.set(Object.fromEntries(this.campos.map(c => [c.codigo,String(e.sugestao[c.codigo] ?? -1)])));this.ocupado.set(false);
    },error:e => {this.erro.set(mensagemApi(e,'Não foi possível ler as colunas.'));this.ocupado.set(false);}});
  }
  trocarAba(aba:number) {if(this.ocupado()) return;this.aba=aba;this.analisar();}
  colunas(e:EstruturaImportacao,obrigatorio:boolean):OpcaoSelectBusca[] {
    return [...(obrigatorio ? [] : [{valor:'-1',rotulo:'Não importar este campo'}]),...e.colunas.map(c => ({valor:String(c.indice),rotulo:`${c.indice+1} — ${c.titulo || '(sem título)'}`}))];
  }
  mapear(campo:string,valor:string|null) {
    if(this.ocupado()) return;
    this.mapeamento.update(m => ({...m,[campo]:valor ?? '-1'}));this.previa.set(null);this.opcoesDaPrevia=undefined;this.chave=crypto.randomUUID();this.erro.set('');
  }
  mapeamentoValido() {
    const m=this.mapeamento();if(!this.estrutura() || +m['nome']<0 || +m['papel']<0) return false;
    const valores=this.campos.map(c => +m[c.codigo]);
    return valores.every(v => Number.isInteger(v) && v>=-1 && v<this.estrutura()!.colunas.length) && new Set(valores.filter(v => v>=0)).size===valores.filter(v => v>=0).length;
  }
  private opcoes():OpcoesImportacao {
    const m=this.mapeamento();return {aba:this.aba,nome:+m['nome'],papel:+m['papel'],cpf:+m['cpf'],email:+m['email'],telefone:+m['telefone']};
  }
  conferir() {
    if(!this.arquivo || this.ocupado() || !this.permitido || !this.mapeamentoValido()) return;
    const opcoes=this.opcoes();this.ocupado.set(true);this.erro.set('');this.previa.set(null);this.opcoesDaPrevia=undefined;
    this.carga=this.api.previa(this.arquivo,opcoes).subscribe({next:p => {this.previa.set(p);this.opcoesDaPrevia=opcoes;this.ocupado.set(false);},error:e => {this.erro.set(mensagemApi(e,'Não foi possível conferir o lote.'));this.ocupado.set(false);}});
  }
  confirmar() {
    const p=this.previa();if(!this.arquivo || !p?.podeConfirmar || !this.opcoesDaPrevia || this.ocupado() || this.sucesso() || !this.permitido) return;
    this.ocupado.set(true);this.erro.set('');
    this.carga=this.api.confirmar(this.arquivo,this.chave,p.hash,this.opcoesDaPrevia).subscribe({next:r => {
      this.sucesso.set(`${r.quantidade} cadastro(s) importado(s).${r.repetida ? ' Confirmação anterior recuperada, sem duplicar.' : ''}`);
      this.ocupado.set(false);this.arquivo=null;this.previa.set(null);this.estrutura.set(null);this.mapeamento.set({});this.opcoesDaPrevia=undefined;
      if(this.entradaArquivo) this.entradaArquivo.nativeElement.value='';
    },error:e => {this.erro.set(mensagemApi(e,'Não foi possível importar. Nenhum lote parcial será criado.'));this.ocupado.set(false);}});
  }
  hasPendingChanges() {return !!this.arquivo && !this.sucesso();}
  ngOnDestroy() {this.carga?.unsubscribe();this.arquivo=null;}
}
