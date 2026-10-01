import { Component, inject, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ModalComponent } from '../shared/components/modal/modal.component';
import { MinhaContaService, MinhaContaDados } from './minha-conta.service';
type MinhaContaCobranca = MinhaContaDados['cobrancas'][0];
import { formatarCpf, formatarCnpj, formatarTelefone } from '../shared/utils/formatos';
import { mensagemApi } from '../core/api/api-error';

@Component({
  selector: 'app-minha-conta-modal',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-modal [aberto]="true" (fechar)="fechar()" titulo="Minha Conta" tamanho="lg">
      @if (erro) {
        <div class="p-8 text-center flex flex-col items-center gap-4">
          <div class="text-red-500 font-semibold">{{ erro }}</div>
          <button type="button" class="btn-primary" (click)="buscar()">Tentar de novo</button>
        </div>
      } @else if (dados) {
        <div class="flex flex-col gap-6">
          <!-- Tabs -->
          <div class="flex gap-6 border-b border-slate-200 pb-2">
            @for (tab of tabs; track tab) {
              <button (click)="abaAtiva = tab"
                      [class]="abaAtiva === tab ? 'border-b-2 border-brand-blue font-bold text-brand-blue' : 'text-slate-500 hover:text-slate-700'"
                      class="pb-2 text-sm uppercase tracking-wider transition">
                {{ tab }}
              </button>
            }
          </div>

          <!-- CADASTRO -->
          @if (abaAtiva === 'CADASTRO') {
            <div class="card p-6">
              <h3 class="secao-titulo mb-4">Dados do Cliente</h3>
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <div class="label">Nome / Razão Social</div>
                  <div class="font-semibold">{{ dados.cliente.nome }}</div>
                </div>
                <div>
                  <div class="label">Documento</div>
                  <div class="font-semibold">{{ formatarDocumento(dados.cliente.documento) }}</div>
                </div>
                <div class="col-span-2 mt-2">
                  <div class="label">Endereço</div>
                  <div class="text-sm font-medium text-slate-700">
                    {{ dados.cliente.logradouro }}, {{ dados.cliente.numero }}
                    {{ dados.cliente.complemento ? ' - ' + dados.cliente.complemento : '' }}
                    <br>
                    {{ dados.cliente.bairro }} - {{ dados.cliente.cidade }}/{{ dados.cliente.uf }}
                    <br>
                    CEP: {{ dados.cliente.cep | slice:0:5 }}-{{ dados.cliente.cep | slice:5 }}
                  </div>
                </div>
                <div class="col-span-2 mt-4">
                  <div class="label mb-2">Contatos Principais</div>
                  <div class="grid gap-2">
                    @for (c of dados.cliente.contatos; track c.nome) {
                      <div class="flex flex-col gap-1 text-sm bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <span class="font-semibold flex items-center gap-2">
                          {{ c.nome }} 
                          @if (c.principal) {
                            <span class="badge bg-emerald-50 text-emerald-700">PRINCIPAL</span>
                          }
                        </span>
                        <span class="text-slate-600">{{ c.email }} • {{ formatarTelefoneStr(c.telefone) }}</span>
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- MEU PLANO -->
          @if (abaAtiva === 'MEU PLANO') {
            <div class="flex flex-col gap-4">
              <div class="card p-6 flex justify-between items-center">
                <div>
                  <div class="label">Plano Atual</div>
                  <div class="text-xl font-black text-slate-800">{{ dados.contratacao.planoNome }}</div>
                </div>
                <div [class]="'badge ' + statusCor(dados.contratacao.situacaoComercial)">{{ textoSituacao(dados.contratacao.situacaoComercial) }}</div>
              </div>

              <div class="card p-6 grid grid-cols-2 gap-4">
                <div>
                  <div class="label">Valor e Periodicidade</div>
                  <div class="font-semibold">{{ dados.contratacao.valor | currency:'BRL' }} / {{ textoPeriodicidade(dados.contratacao.periodicidade) }}</div>
                </div>
                <div>
                  <div class="label">Data de Vigência</div>
                  <div class="font-semibold">{{ (dados.contratacao.vigenteAte | date:'dd/MM/yyyy') || 'Indeterminado' }}</div>
                </div>
                <div>
                  <div class="label">Instância</div>
                  <div class="font-semibold">{{ dados.contratacao.nomeInstancia }}</div>
                </div>
              </div>
            </div>
          }

          <!-- FINANCEIRO -->
          @if (abaAtiva === 'FINANCEIRO') {
            <div class="flex flex-col gap-4">
              @for (cob of dados.cobrancas; track cob.id) {
                <div class="card flex justify-between items-center p-4">
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                      {{ cob.vencimento | date:'MMM' | uppercase }}
                    </div>
                    <div>
                      <div class="font-bold text-slate-800">{{ cob.valor | currency:'BRL' }}</div>
                      <div class="text-sm text-slate-500">Vence em {{ cob.vencimento | date:'dd/MM/yyyy' }}</div>
                    </div>
                  </div>
                  <div [class]="'badge ' + statusCobrancaCor(cob)">{{ cob.status }}</div>
                </div>
              }
              @if (dados.cobrancas.length === 0) {
                <div class="text-center text-slate-500 p-8 card">
                  Nenhuma cobrança encontrada.
                </div>
              }
            </div>
          }
        </div>
      } @else {
        <div class="flex items-center justify-center p-12">
          <div class="text-slate-400 font-semibold animate-pulse">Buscando informações da sua conta...</div>
        </div>
      }

      <div rodape class="flex justify-end">
        <button type="button" class="btn-secondary" (click)="fechar()">Fechar</button>
      </div>
    </app-modal>
  `
})
export class MinhaContaModalComponent implements OnInit {
  private router = inject(Router);
  private servico = inject(MinhaContaService);
  private cdr = inject(ChangeDetectorRef);
  

  tabs = ['CADASTRO', 'MEU PLANO', 'FINANCEIRO'];
  abaAtiva = 'CADASTRO';
  dados: MinhaContaDados | null = null;
  erro: string | null = null;

  ngOnInit() {
    this.buscar();
  }

  buscar() {
    this.erro = null;
    this.dados = null;
    this.cdr.markForCheck();
    
    this.servico.buscar().subscribe({
      next: (d) => {
        this.dados = d;
        this.cdr.markForCheck();
      },
      error: (e: any) => {
        this.erro = mensagemApi(e, 'Erro ao carregar a conta.');
        this.cdr.markForCheck();
      }
    });
  }

  fechar() {
    this.router.navigate([{ outlets: { modal: null } }]);
  }

  formatarDocumento(doc: string) {
    if (!doc) return '';
    return doc.length > 11 ? formatarCnpj(doc) : formatarCpf(doc);
  }

  formatarTelefoneStr(tel: string | null) {
    if (!tel) return '';
    return formatarTelefone(tel);
  }

  statusCor(status: string) {
    if (status === 'ATIVA' || status === 'PAGA') return 'bg-emerald-50 text-emerald-700';
    if (status === 'TRIAL' || status === 'PENDENTE' || status === 'ABERTA') return 'bg-amber-50 text-amber-700';
    if (status === 'BLOQUEADA' || status === 'VENCIDA' || status === 'INADIMPLENTE') return 'bg-red-50 text-red-700';
    return 'bg-slate-100 text-slate-600';
  }

  statusCobrancaCor(cob: MinhaContaCobranca) {
    if (cob.status === 'ABERTA' && cob.vencida) return 'bg-red-50 text-red-700';
    return this.statusCor(cob.status);
  }

  textoPeriodicidade(periodo: string): string {
    switch (periodo) {
      case 'MENSAL': return 'Mensal';
      case 'ANUAL': return 'Anual';
      case 'SEMESTRAL': return 'Semestral';
      case 'TRIMESTRAL': return 'Trimestral';
      case 'AVULSO': return 'Avulso';
      default: return periodo;
    }
  }

  textoSituacao(sit: string): string {
    switch (sit) {
      case 'ATIVA': return 'Ativa';
      case 'TRIAL': return 'Trial';
      case 'BLOQUEADA': return 'Bloqueada';
      case 'CANCELADA': return 'Cancelada';
      case 'INADIMPLENTE': return 'Inadimplente';
      default: return sit;
    }
  }
}
