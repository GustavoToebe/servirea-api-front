import { Component, EventEmitter, Input, OnChanges, Output, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { AuthService } from '../../../core/auth/auth.service';
import { ParoquiaApiService } from '../../acesso/paroquia-api.service';
import { ItemAssinatura, ListaAssinaturaService, ORDENAR_POR, Ordem, OrdenarPor } from '../services/lista-assinatura.service';

/**
 * Modal da lista de assinatura (27/09/2026): muda só o título (e o subtítulo), a ordem e o formato.
 * O subtítulo vem com o nome da paróquia; a cidade a pessoa acrescenta se quiser.
 */
@Component({
  selector: 'app-lista-assinatura-dialog',
  imports: [FormsModule, ModalComponent],
  template: `
    <app-modal [aberto]="open" titulo="🖨 Lista de assinatura" rotulo="Gerar lista de assinatura" [fecharNoFundo]="!gerando" (fechar)="fecharSeLivre()">
      <p class="text-sm text-slate-500">{{ itens.length }} pessoa(s) selecionada(s).</p>
      <div class="mt-5 grid gap-4 sm:grid-cols-2">
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
  gerando = false;
  erro = '';

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
    const opcoes = { titulo: this.titulo.trim(), subtitulo: this.subtitulo.trim(), ordenarPor: this.ordenarPor, ordem: this.ordem };
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
