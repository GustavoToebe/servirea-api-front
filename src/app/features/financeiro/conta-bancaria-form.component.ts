import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CabecalhoPaginaComponent } from '../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { CampoDataComponent } from '../../shared/components/datas/campo-data.component';
import { RodapeFormComponent } from '../../shared/components/rodape-form/rodape-form.component';
import { DialogoService } from '../../shared/services/dialogo.service';
import { focarPrimeiroInvalido } from '../../shared/utils/foco';
import { FinanceiroApiService } from './financeiro-api.service';
import { ChavePix, ContaRequest, ROTULO_TIPO_CHAVE, ROTULO_TIPO_CONTA, TipoChavePix, TipoConta } from './financeiro.models';

function hojeLocal(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

/** Formulário de uma conta bancária ou caixa: dados do banco, chaves PIX e saldo inicial. */
@Component({
  selector: 'app-conta-bancaria-form', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, CabecalhoPaginaComponent, CampoDataComponent, RodapeFormComponent],
  template: `
<div class="space-y-5">
  <app-cabecalho-pagina [titulo]="id ? 'Editar conta bancária' : 'Nova conta bancária'" subtitulo="Dados do banco, chaves PIX e saldo inicial." icone="🏦">
    <label acoes class="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" name="ativoTopo" [(ngModel)]="form.ativo" [ngModelOptions]="{ standalone: true }" (ngModelChange)="marcarPendente()" data-ativo /> Conta ativa</label>
  </app-cabecalho-pagina>
  @if (erro) { <div class="card p-4 text-red-600" role="alert">{{ erro }}</div> }
  @if (carregando) { <p class="card p-6 text-slate-500" role="status">Carregando…</p> } @else {
  <form #formulario="ngForm" (ngSubmit)="salvar(formulario)" class="space-y-6">
    <section class="card p-5 space-y-4">
      <div class="grade-form">
        <div><label class="label" for="nome">Nome da conta</label><input id="nome" name="nome" class="field" [(ngModel)]="form.nome" required maxlength="120" placeholder="Ex.: Banco do Brasil — Principal" /></div>
        <div><label class="label" for="tipoConta">Tipo de conta</label>
          <select id="tipoConta" name="tipoConta" class="field" [(ngModel)]="form.tipoConta">@for (t of tiposConta; track t) { <option [value]="t">{{ rotuloTipoConta[t] }}</option> }</select></div>
      </div>
      <div class="grade-form">
        <div><label class="label" for="banco">Banco{{ exigeBanco() ? ' *' : '' }}</label><input id="banco" name="banco" class="field" [(ngModel)]="form.banco" [required]="exigeBanco()" maxlength="120" /></div>
        <div><label class="label" for="agencia">Agência{{ exigeBanco() ? ' *' : '' }}</label><input id="agencia" name="agencia" class="field" [(ngModel)]="form.agencia" [required]="exigeBanco()" maxlength="20" /></div>
        <div><label class="label" for="numeroConta">Conta{{ exigeBanco() ? ' *' : '' }}</label><input id="numeroConta" name="numeroConta" class="field" [(ngModel)]="form.numeroConta" [required]="exigeBanco()" maxlength="30" /></div>
      </div>
      <div class="grade-form">
        <div><label class="label" for="titular">Titular{{ exigeBanco() ? ' *' : '' }}</label><input id="titular" name="titular" class="field" [(ngModel)]="form.titular" [required]="exigeBanco()" maxlength="120" /></div>
        <div><label class="label" for="dataAbertura">Abertura</label><app-campo-data idCampo="dataAbertura" name="dataAbertura" [(ngModel)]="form.dataAbertura" [max]="hoje" /></div>
        <div><label class="label" for="dataEncerramento">Encerramento</label><app-campo-data idCampo="dataEncerramento" name="dataEncerramento" [(ngModel)]="form.dataEncerramento" [min]="form.dataAbertura ?? ''" /></div>
      </div>
    </section>

    <section class="card p-5 space-y-4">
      <div class="flex items-center justify-between"><h2 class="secao-titulo">Saldo inicial</h2></div>
      <div class="grade-form">
        <div><label class="label" for="saldoInicial">Saldo inicial (R$)</label><input id="saldoInicial" name="saldoInicial" class="field" type="number" inputmode="decimal" step="0.01" min="-999999999999.99" max="999999999999.99" [(ngModel)]="form.saldoInicial" required /></div>
        <div><label class="label" for="dataSaldo">Data do saldo inicial</label><app-campo-data idCampo="dataSaldo" name="dataSaldo" [(ngModel)]="form.dataSaldoInicial" [max]="hoje" required /></div>
      </div>
      <p class="text-xs text-slate-500">Informe o saldo antes das primeiras baixas. Saldo e data inicial ficam protegidos depois do primeiro lançamento.</p>
    </section>

    <section class="card p-5 space-y-4">
      <div class="flex items-center justify-between gap-3">
        <div><h2 class="secao-titulo">Chave PIX</h2><p class="text-sm text-slate-500">Adicione as chaves PIX desta conta. A estrela marca a principal.</p></div>
        <button type="button" class="btn-secondary" (click)="adicionarChave()" [disabled]="form.chavesPix.length >= 10" data-add-pix>Adicionar chave</button>
      </div>
      @for (k of form.chavesPix; track $index) {
        <div class="flex flex-wrap items-end gap-3" data-chave-pix>
          <button type="button" class="text-2xl leading-none" [class.text-amber-400]="k.principal" [attr.aria-pressed]="k.principal" [attr.aria-label]="k.principal ? 'Chave principal' : 'Marcar como principal'" (click)="tornarPrincipal($index)">{{ k.principal ? '★' : '☆' }}</button>
          <div><label class="label" [for]="'tipoChave' + $index">Tipo de chave *</label>
            <select [id]="'tipoChave' + $index" [name]="'tipoChave' + $index" class="field" [(ngModel)]="k.tipo" required>@for (t of tiposChave; track t) { <option [value]="t">{{ rotuloTipoChave[t] }}</option> }</select></div>
          <div class="min-w-[16rem] flex-1"><label class="label" [for]="'chave' + $index">Chave PIX *</label><input [id]="'chave' + $index" [name]="'chave' + $index" class="field" [(ngModel)]="k.chave" required maxlength="140" /></div>
          <button type="button" class="btn-danger" (click)="removerChave($index)" [attr.aria-label]="'Remover chave ' + ($index + 1)">Remover</button>
        </div>
      } @empty { <p class="text-sm text-slate-500">Nenhuma chave PIX cadastrada.</p> }
    </section>

    <app-rodape-form [carregando]="salvando" [voltarUrl]="['/contas-bancarias']" rotuloSalvar="Salvar conta" />
  </form>
  }
</div>`
})
export class ContaBancariaFormComponent implements OnInit {
  private readonly api = inject(FinanceiroApiService);
  private readonly cd = inject(ChangeDetectorRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly dialogo = inject(DialogoService);
  private readonly rota = inject(ActivatedRoute);
  private readonly roteador = inject(Router);
  @ViewChild('formulario') formulario?: NgForm;
  readonly hoje = hojeLocal();
  readonly tiposConta: TipoConta[] = ['CORRENTE', 'POUPANCA', 'CAIXA', 'OUTRA'];
  readonly tiposChave: TipoChavePix[] = ['CPF', 'CNPJ', 'EMAIL', 'TELEFONE', 'ALEATORIA'];
  readonly rotuloTipoConta = ROTULO_TIPO_CONTA;
  readonly rotuloTipoChave = ROTULO_TIPO_CHAVE;
  id: string | null = this.rota.snapshot.paramMap.get('id');
  form: ContaRequest = this.novo();
  carregando = false; salvando = false; erro = '';
  private salvo = false;
  marcarPendente() { this.formulario?.form.markAsDirty(); }

  async ngOnInit() {
    if (!this.id) return;
    this.carregando = true; this.cd.markForCheck();
    try {
      const conta = (await this.api.contas()).find(c => c.id === this.id);
      if (!conta) { this.erro = 'Conta não encontrada.'; return; }
      this.form = {
        nome: conta.nome, saldoInicial: conta.saldoInicial, dataSaldoInicial: conta.dataSaldoInicial, ativo: conta.ativo, tipoConta: conta.tipoConta ?? 'OUTRA',
        banco: conta.banco ?? '', agencia: conta.agencia ?? '', numeroConta: conta.numeroConta ?? '', titular: conta.titular ?? '',
        dataAbertura: conta.dataAbertura ?? null, dataEncerramento: conta.dataEncerramento ?? null, chavesPix: (conta.chavesPix ?? []).map(k => ({ ...k }))
      };
    } catch (e) { this.erro = (e as Error).message; }
    finally { this.carregando = false; this.cd.markForCheck(); }
  }

  private novo(): ContaRequest {
    return { nome: '', saldoInicial: 0, dataSaldoInicial: this.hoje, ativo: true, tipoConta: 'CORRENTE', banco: '', agencia: '', numeroConta: '', titular: '', dataAbertura: null, dataEncerramento: null, chavesPix: [] };
  }

  hasPendingChanges() { return !this.salvo && (this.salvando || !!this.formulario?.dirty); }
  exigeBanco() { return this.form.tipoConta === 'CORRENTE' || this.form.tipoConta === 'POUPANCA'; }

  adicionarChave() { this.form.chavesPix.push({ tipo: 'CPF', chave: '', principal: this.form.chavesPix.length === 0 } as ChavePix); this.formulario?.control.markAsDirty(); this.cd.markForCheck(); }
  removerChave(i: number) {
    const eraPrincipal = this.form.chavesPix[i].principal;
    this.form.chavesPix.splice(i, 1);
    if (eraPrincipal && this.form.chavesPix.length) this.form.chavesPix[0].principal = true;
    this.formulario?.control.markAsDirty(); this.cd.markForCheck();
  }
  tornarPrincipal(i: number) { this.form.chavesPix.forEach((k, j) => k.principal = j === i); this.formulario?.control.markAsDirty(); this.cd.markForCheck(); }

  async salvar(form: NgForm) {
    if (this.salvando) return;
    if (form.invalid) { form.control.markAllAsTouched(); focarPrimeiroInvalido(this.host.nativeElement); return; }
    this.salvando = true; this.cd.markForCheck();
    try {
      await this.api.salvarConta(this.id, this.paraEnvio());
      this.salvo = true;
      await this.roteador.navigate(['/contas-bancarias']);
    } catch (e) { await this.dialogo.avisar((e as Error).message); }
    finally { this.salvando = false; this.cd.markForCheck(); }
  }

  /** Datas vazias viram nulas e campos de banco só vão quando há valor. */
  private paraEnvio(): ContaRequest {
    const f = this.form;
    return { ...f, banco: f.banco?.trim() || null, agencia: f.agencia?.trim() || null, numeroConta: f.numeroConta?.trim() || null, titular: f.titular?.trim() || null,
      dataAbertura: f.dataAbertura || null, dataEncerramento: f.dataEncerramento || null };
  }
}
