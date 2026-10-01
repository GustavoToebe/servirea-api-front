import { ChangeDetectionStrategy, Component, OnDestroy, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { SessaoAtual } from '../../../core/layout/sessao-atual';
import { mensagemApi } from '../../../core/api/api-error';
import { CabecalhoPaginaComponent } from '../../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { RodapeFormComponent } from '../../../shared/components/rodape-form/rodape-form.component';
import { ImportacoesPessoasService, PreviaImportacao } from '../services/importacoes-pessoas.service';

@Component({selector:'app-importar-pessoas',changeDetection:ChangeDetectionStrategy.OnPush,
  imports:[RouterLink,CabecalhoPaginaComponent,RodapeFormComponent],
  template:`
    <div class="space-y-6">
      <app-cabecalho-pagina titulo="Importar pessoas" subtitulo="Confira o lote antes de criar os cadastros.">
        <a acoes routerLink="/pessoas" class="btn-secondary">Pessoas</a>
      </app-cabecalho-pagina>
      @if (!permitido) { <div class="card p-5" role="alert">É necessário acesso a Pessoas e permissão para criar cadastros.</div> }
      @else {
        <form ngNoForm (submit)="$event.preventDefault();confirmar()" class="space-y-6">
          <section class="card secao-form">
            <h2 class="secao-titulo">Arquivo CSV</h2>
            <p class="text-sm">Até 100 pessoas e 512 KiB por lote, UTF-8, separado por ponto e vírgula ou vírgula. Cabeçalho: <code>nome;papel;cpf;email;telefone</code>. Papel: RESPONSAVEL, COROINHA, ACOLITO, AMBOS ou MESC. CPF, e-mail e telefone podem ficar vazios. Não usar células com múltiplas linhas.</p>
            <p class="mt-2 text-sm text-slate-500">Possíveis duplicidades por nome ou CPF bloqueiam o lote para revisão. A importação cria novas fichas, sem alterar as existentes. Voluntários não recebem autorização de WhatsApp automaticamente. Um lote confirmado consome uma importação mensal; prévias e repetições da mesma confirmação não consomem outra.</p>
            <label class="label mt-4" for="arquivo-csv">Selecionar CSV</label>
            <input id="arquivo-csv" type="file" accept=".csv,text/csv" class="field" [disabled]="ocupado()" (change)="selecionar($event)">
            <button type="button" class="btn-secondary mt-3" [disabled]="!arquivo || ocupado()" (click)="conferir()">{{ ocupado() ? 'Processando...' : 'Gerar prévia' }}</button>
          </section>
          @if (erro()) {<div role="alert" class="card p-4 text-red-700 dark:text-red-300">{{ erro() }}</div>}
          @if (sucesso()) {<div role="status" class="card p-4 text-emerald-700 dark:text-emerald-300">{{ sucesso() }}</div>}
          @if (previa(); as p) {
            <section class="card p-5">
              <h2 class="secao-titulo">Prévia: {{ p.quantidade }} pessoa(s)</h2>
              <p class="text-sm mb-3">{{ p.podeConfirmar ? 'Arquivo pronto para confirmar. O lote inteiro será validado novamente.' : 'Corrija o arquivo e gere uma nova prévia. Nenhum cadastro foi criado.' }}</p>
              <div class="tabela-rolagem"><table class="tabela">
                <thead><tr><th>Linha</th><th>Nome</th><th>Conferência</th></tr></thead>
                <tbody>@for (linha of p.linhas;track linha.linha) {
                  <tr><td>{{ linha.linha }}</td><td>{{ linha.nome }}</td><td>
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
  private api=inject(ImportacoesPessoasService);private sessao=inject(SessaoAtual);private carga?:Subscription;
  arquivo:File|null=null; private chave=''; previa=signal<PreviaImportacao|null>(null);
  ocupado=signal(false);erro=signal('');sucesso=signal('');
  get permitido() {const p=this.sessao.permissoes();return p.includes('PESSOA') && p.includes('PESSOA_CRIAR');}
  selecionar(event:Event) {
    if(this.ocupado() || !this.permitido) return;
    this.carga?.unsubscribe();this.previa.set(null);this.erro.set('');this.sucesso.set('');
    const arquivo=(event.target as HTMLInputElement).files?.[0] ?? null;
    this.arquivo=null;
    if(!arquivo) return;
    if(arquivo.size>524288 || !arquivo.name.toLowerCase().endsWith('.csv')) {this.erro.set('Selecione um CSV de até 512 KiB.');return;}
    this.arquivo=arquivo;this.chave=crypto.randomUUID();
  }
  conferir() {
    if(!this.arquivo || this.ocupado() || !this.permitido) return;
    this.ocupado.set(true);this.erro.set('');this.previa.set(null);
    this.carga=this.api.previa(this.arquivo).subscribe({next:p => {this.previa.set(p);this.ocupado.set(false);},error:e => {this.erro.set(mensagemApi(e,'Não foi possível conferir o CSV.'));this.ocupado.set(false);}});
  }
  confirmar() {
    const p=this.previa();if(!this.arquivo || !p?.podeConfirmar || this.ocupado() || this.sucesso() || !this.permitido) return;
    this.ocupado.set(true);this.erro.set('');
    this.carga=this.api.confirmar(this.arquivo,this.chave,p.hash).subscribe({next:r => {
      this.sucesso.set(`${r.quantidade} cadastro(s) importado(s).${r.repetida ? ' Confirmação anterior recuperada, sem duplicar.' : ''}`);
      this.ocupado.set(false);this.arquivo=null;this.previa.set(null);
    },error:e => {this.erro.set(mensagemApi(e,'Não foi possível importar. Nenhum lote parcial será criado.'));this.ocupado.set(false);}});
  }
  hasPendingChanges() {return !!this.arquivo && !this.sucesso();}
  ngOnDestroy() {this.carga?.unsubscribe();this.arquivo=null;}
}
