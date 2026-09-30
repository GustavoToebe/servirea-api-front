import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { OrientacaoToggleComponent } from '../../../shared/components/orientacao-toggle/orientacao-toggle.component';
import { Orientacao, lerOrientacao } from '../../../shared/export/orientacao';
import { AuthService } from '../../../core/auth/auth.service';
import { ParoquiaApiService } from '../../acesso/paroquia-api.service';
import { ItemAssinatura, ListaAssinaturaService, ORDENAR_POR, Ordem, OrdenarPor, ordenar } from '../services/lista-assinatura.service';

/**
 * Modal da lista de assinatura (27/09/2026): muda só o título (e o subtítulo), a ordem e o formato.
 * O subtítulo vem com o nome da paróquia; a cidade a pessoa acrescenta se quiser.
 */
@Component({
  selector: 'app-lista-assinatura-dialog',
  imports: [FormsModule, ModalComponent, OrientacaoToggleComponent],
  template: `
    <app-modal [aberto]="open" titulo="🖨 Lista de assinatura" rotulo="Gerar lista de assinatura" [fecharNoFundo]="!gerando" (fechar)="fecharSeLivre()" tamanho="lg">
      <p class="text-sm text-slate-500">{{ itens.length }} pessoa(s) selecionada(s).</p>
      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <div class="sm:col-span-2"><label class="label" for="la-titulo">Título *</label>
          <input id="la-titulo" class="field" [(ngModel)]="titulo" maxlength="120"></div>
        <div class="sm:col-span-2"><label class="label" for="la-subtitulo">Subtítulo</label>
          <input id="la-subtitulo" class="field" [(ngModel)]="subtitulo" maxlength="160" placeholder="Paróquia / Cidade - UF"></div>
        <div><label class="label" for="la-ordenar">Ordenar por</label>
          <select id="la-ordenar" class="field" [(ngModel)]="ordenarPor">
            @for (o of opcoesOrdem; track o.valor) { <option [ngValue]="o.valor">{{ o.rotulo }}</option> }
          </select></div>
        <div><label class="label" for="la-ordem">Tipo de ordem</label>
          <select id="la-ordem" class="field" [(ngModel)]="ordem">
            <option ngValue="ASC">Crescente</option>
            <option ngValue="DESC">Decrescente</option>
          </select></div>
        <div class="sm:col-span-2"><span class="label">Orientação da folha</span>
          <div><app-orientacao-toggle chave="lista-assinatura" [(valor)]="orientacao" /></div></div>
      </div>

      <!-- Prévia Visual da Folha A4 -->
      <div class="mt-4 rounded-xl border border-indigo-100 bg-slate-50/70 p-4 space-y-2.5 shadow-2xs">
        <div class="text-[11px] font-black uppercase tracking-wider text-indigo-700 flex items-center justify-between">
          <span>📄 Prévia da Folha de Impressão</span>
          <span class="text-slate-400 font-semibold normal-case text-[11px]">Formato A4</span>
        </div>
        <div class="bg-white border-2 border-indigo-950 rounded-xl overflow-hidden shadow-xs">
          <!-- Mini Banner -->
          <div class="p-3 bg-gradient-to-r from-indigo-950 via-purple-950 to-indigo-950 text-white text-center">
            <div class="text-[10px] font-black tracking-widest text-indigo-300 uppercase">SERVIREA • GESTÃO PAROQUIAL</div>
            <div class="text-base font-black uppercase mt-0.5">{{ titulo || 'Lista de Assinatura' }}</div>
            @if (subtitulo) {
              <div class="inline-block mt-1 px-2.5 py-0.5 rounded-full bg-white/15 border border-white/25 text-[10px] font-bold uppercase text-slate-100">{{ subtitulo }}</div>
            }
          </div>
          <!-- Tabela Miniatura -->
          <table class="w-full text-xs">
            <thead>
              <tr class="bg-indigo-950 text-white text-[11px] font-black uppercase">
                <th class="p-2 text-left w-1/2 border-r border-indigo-900">Nome</th>
                <th class="p-2 text-left">Assinatura / Responsável</th>
              </tr>
            </thead>
            <tbody>
              @for (p of itensOrdenados.slice(0, 5); track p.nome; let i = $index) {
                <tr class="border-b border-slate-200 even:bg-slate-50/60">
                  <td class="p-2 border-r border-slate-200 font-bold text-slate-800">{{ i + 1 }}. {{ p.nome }}</td>
                  <td class="p-2"><div class="border-b border-dashed border-slate-300 w-full h-3"></div></td>
                </tr>
              }
              @if (itens.length > 5) {
                <tr>
                  <td colspan="2" class="p-2 text-center text-slate-400 font-semibold text-[11px] bg-slate-50">
                    ... e mais {{ itens.length - 5 }} pessoa(s) no documento final
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      @if (erro) { <p class="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700">{{ erro }}</p> }
      <div rodape class="flex flex-wrap items-center justify-between gap-2">
        <button type="button" class="btn-secondary" (click)="fechar.emit()">Cancelar</button>
        <div class="flex gap-2">
          <button type="button" class="btn-secondary" [disabled]="gerando" (click)="gerar('IMAGEM')">Gerar imagem</button>
          <button type="button" class="btn-primary" [disabled]="gerando" (click)="gerar('PDF')">{{ gerando ? 'Gerando...' : 'Gerar PDF' }}</button>
        </div>
      </div>
    </app-modal>
  `
})
export class ListaAssinaturaDialogComponent implements OnChanges {
  private servico = inject(ListaAssinaturaService);
  private auth = inject(AuthService);
  private paroquia = inject(ParoquiaApiService);

  @Input() open = false;
  @Input() itens: ItemAssinatura[] = [];
  @Output() fechar = new EventEmitter<void>();

  readonly opcoesOrdem = ORDENAR_POR;
  titulo = '';
  subtitulo = '';
  ordenarPor: OrdenarPor = 'NOME';
  ordem: Ordem = 'ASC';
  orientacao: Orientacao = lerOrientacao('lista-assinatura', 'RETRATO');
  gerando = false;
  erro = '';

  get itensOrdenados(): ItemAssinatura[] {
    return ordenar(this.itens, this.ordenarPor, this.ordem);
  }

  ngOnChanges(): void {
    if (!this.open) return;
    this.erro = '';
    // Mantém o que a pessoa digitou entre uma lista e outra; só preenche na primeira vez.
    this.titulo ||= `Lista de assinatura - ${new Date().getFullYear()}`;
    if (this.subtitulo) return;
    const nome = (this.auth.tenantNome() || '').toUpperCase();
    this.subtitulo = nome;
    // Com a cidade no cadastro da paróquia: "PARÓQUIA X / Cascavel - PR". Sem permissão de ver a paróquia, fica o nome.
    this.paroquia.buscar().subscribe({
      next: p => {
        const cidade = [p.endereco?.cidade, p.endereco?.uf].filter(Boolean).join(' - ');
        if (cidade && this.subtitulo === nome) this.subtitulo = `${nome} / ${cidade}`;
      },
      error: () => undefined
    });
  }

  fecharSeLivre(): void {
    if (!this.gerando) this.fechar.emit();
  }

  async gerar(formato: 'PDF' | 'IMAGEM'): Promise<void> {
    if (!this.titulo.trim()) {
      this.erro = 'Informe o título.';
      return;
    }
    this.gerando = true;
    this.erro = '';
    const opcoes = { titulo: this.titulo.trim(), subtitulo: this.subtitulo.trim(), ordenarPor: this.ordenarPor, ordem: this.ordem, orientacao: this.orientacao };
    try {
      if (formato === 'PDF') await this.servico.gerarPdf(this.itens, opcoes);
      else await this.servico.gerarImagem(this.itens, opcoes);
      this.fechar.emit();
    } catch {
      this.erro = 'Não foi possível gerar o arquivo. Tente de novo.';
    } finally {
      this.gerando = false;
    }
  }
}
