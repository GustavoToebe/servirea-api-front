import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { HasPendingChanges } from '../../../core/guards/pending-changes.guard';
import { CabecalhoPaginaComponent } from '../../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import { RodapeFormComponent } from '../../../shared/components/rodape-form/rodape-form.component';
import { DialogoService } from '../../../shared/services/dialogo.service';
import { EditorHtmlComponent } from '../components/editor-html.component';
import { EditorWhatsappComponent, whatsappParaHtml } from '../components/editor-whatsapp.component';
import { PainelTagsComponent } from '../components/painel-tags.component';
import { PreVisualizacaoResponse, TIPO_ENVIO_LABEL, TIPO_LAYOUT_LABEL, TagLayout, TipoEnvio, TipoLayout } from '../comunicacao.models';
import { LayoutsApiService } from '../layouts-api.service';

/** HTML do e-mail em texto do WhatsApp: negrito/itálico viram marcadores, parágrafos viram quebras. */
export function htmlParaWhatsapp(html: string): string {
  const texto = (html ?? '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<(strong|b)(\s[^>]*)?>([\s\S]*?)<\/\1>/gi, '*$3*')
    .replace(/<(em|i)(\s[^>]*)?>([\s\S]*?)<\/\1>/gi, '_$3_')
    .replace(/<(s|strike|del)(\s[^>]*)?>([\s\S]*?)<\/\1>/gi, '~$3~')
    .replace(/<[^>]+>/g, '');
  const el = document.createElement('textarea');
  el.innerHTML = texto;
  return el.value.replace(/\n{3,}/g, '\n\n').trim();
}

/** Texto do WhatsApp em HTML do e-mail: cada linha vira um parágrafo. */
export function whatsappParaEmail(texto: string): string {
  return (texto ?? '').split('\n').map(linha => `<p>${whatsappParaHtml(linha) || '<br>'}</p>`).join('');
}

@Component({
  selector: 'app-layout-form',
  standalone: true,
  imports: [FormsModule, RouterLink, EditorHtmlComponent, EditorWhatsappComponent, PainelTagsComponent, CabecalhoPaginaComponent, RodapeFormComponent,
    ModalComponent],
  template: `
    <div class="space-y-6">
      <app-cabecalho-pagina [titulo]="id ? 'Editar layout' : 'Novo layout'" subtitulo="Use as tags da direita para colocar os dados de cada pessoa no texto.">
        <a acoes routerLink="/layouts" class="btn-secondary">Voltar</a>
      </app-cabecalho-pagina>

      @if (carregando) {
        <div class="card p-10 text-center text-slate-500">Carregando...</div>
      } @else {
        <!-- ngNoForm: os campos usam ngModel solto; o form só leva o Enter/Salvar do rodapé ao salvar(). -->
        <form ngNoForm class="space-y-6" (submit)="$event.preventDefault(); salvar()">
          <section class="card secao-form p-6">
            <h2 class="secao-titulo">Identificação</h2>
            <div class="grid gap-4 md:grid-cols-[2fr_1fr_1fr_auto] md:items-end">
              <div>
                <label class="label" for="nome">Nome do layout *</label>
                <input id="nome" class="field" maxlength="120" [(ngModel)]="nome" (ngModelChange)="alterou()" data-nome>
              </div>
              <div>
                <label class="label" for="tipoLayout">Tipo layout *</label>
                <select id="tipoLayout" class="field" [ngModel]="tipoLayout" (ngModelChange)="trocarTipoLayout($event)" data-tipo-layout>
                  <option value="" disabled>Selecione</option>
                  @for (t of tiposLayout; track t.valor) { <option [value]="t.valor">{{ t.rotulo }}</option> }
                </select>
              </div>
              <div>
                <label class="label" for="tipoEnvio">Tipo de envio *</label>
                <select id="tipoEnvio" class="field" [value]="tipoEnvio" (change)="trocarEnvio($any($event.target))" data-tipo-envio>
                  <option value="" disabled>Selecione</option>
                  @for (t of tiposEnvio; track t.valor) { <option [value]="t.valor">{{ t.rotulo }}</option> }
                </select>
              </div>
              <label class="flex items-center gap-2 pb-3 font-semibold text-slate-700">
                <input type="checkbox" class="h-4 w-4" [(ngModel)]="ativo" (ngModelChange)="alterou()" data-ativo> Ativo
              </label>
            </div>

            @if (tipoEnvio === 'EMAIL') {
              <div>
                <label class="label" for="assunto">Assunto sugerido</label>
                <input id="assunto" class="field" maxlength="200" [(ngModel)]="assunto" (ngModelChange)="alterou()" data-assunto>
              </div>
            }

          </section>

          <section class="card secao-form p-6">
            <h2 class="secao-titulo">Conteúdo</h2>
            <div class="grid gap-4 lg:grid-cols-[1fr_18rem]">
              <div>
                @switch (tipoEnvio) {
                  @case ('EMAIL') {
                    <app-editor-html [(ngModel)]="conteudo" (ngModelChange)="alterou()" />
                  }
                  @case ('WHATSAPP') {
                    <app-editor-whatsapp [(ngModel)]="conteudo" (ngModelChange)="alterou()" />
                  }
                  @default {
                    <p class="rounded-xl border border-dashed border-[var(--field-line)] p-10 text-center text-slate-500" data-sem-envio>
                      Escolha o tipo de envio para começar a escrever.
                    </p>
                  }
                }
              </div>
              <app-painel-tags [tags]="tags" (escolher)="inserirTag($event)" />
            </div>
          </section>

          @if (error) {
            <div class="rounded-xl bg-red-50 p-4 text-red-700" data-erro>{{ error }}</div>
          }

          <app-rodape-form voltarUrl="/layouts" [carregando]="salvando">
            <button type="button" class="btn-secondary" [disabled]="!tipoEnvio || !tipoLayout" (click)="preVisualizar()" data-pre-visualizar>Pré-visualizar</button>
          </app-rodape-form>
        </form>
      }
    </div>

    <app-modal [aberto]="!!previa" titulo="Pré-visualização" tamanho="lg" (fechar)="previa = null">
      @if (previa; as previa) {
          @if (tipoEnvio === 'EMAIL') {
            @if (previa.assunto) { <p class="mb-3 text-sm"><b>Assunto:</b> {{ previa.assunto }}</p> }
            <div class="rounded-lg border bg-white p-4 text-slate-900" [innerHTML]="previa.conteudo"></div>
          } @else {
            <div class="rounded-xl bg-[#e5ddd5] p-4">
              <div class="ml-auto max-w-[85%] break-words rounded-lg bg-[#dcf8c6] px-3 py-2 text-sm text-slate-900 shadow"
                   [innerHTML]="balao(previa.conteudo)"></div>
            </div>
          }
          <p class="mt-3 text-xs text-slate-500">Exemplo com dados fictícios.</p>
      }
    </app-modal>
  `
})
export class LayoutFormComponent implements OnInit, HasPendingChanges {
  @ViewChild(EditorHtmlComponent) editorHtml?: EditorHtmlComponent;
  @ViewChild(EditorWhatsappComponent) editorWhatsapp?: EditorWhatsappComponent;

  readonly tiposLayout = (Object.keys(TIPO_LAYOUT_LABEL) as TipoLayout[]).map(valor => ({ valor, rotulo: TIPO_LAYOUT_LABEL[valor] }));
  readonly tiposEnvio = (Object.keys(TIPO_ENVIO_LABEL) as TipoEnvio[]).map(valor => ({ valor, rotulo: TIPO_ENVIO_LABEL[valor] }));

  id: string | null = null;
  nome = '';
  tipoLayout: TipoLayout | '' = '';
  tipoEnvio: TipoEnvio | '' = '';
  assunto = '';
  conteudo = '';
  ativo = true;
  tags: TagLayout[] = [];
  previa: PreVisualizacaoResponse | null = null;
  carregando = false;
  salvando = false;
  error = '';
  private alterado = false;
  private salvo = false;

  constructor(
    private api: LayoutsApiService,
    private dialogo: DialogoService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  async ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id');
    if (!this.id) return;
    this.carregando = true;
    try {
      const layout = await this.api.buscar(this.id);
      this.nome = layout.nome;
      this.tipoLayout = layout.tipoLayout;
      this.tipoEnvio = layout.tipoEnvio;
      this.assunto = layout.assunto ?? '';
      this.conteudo = layout.conteudo;
      this.ativo = layout.ativo;
      await this.carregarTags();
    } catch (e: any) {
      this.error = e.message;
    } finally {
      this.carregando = false;
    }
  }

  hasPendingChanges(): boolean {
    return this.alterado && !this.salvo;
  }

  alterou() {
    this.alterado = true;
  }

  async trocarTipoLayout(tipo: TipoLayout) {
    this.tipoLayout = tipo;
    this.alterou();
    await this.carregarTags();
  }

  async trocarEnvio(select: HTMLSelectElement) {
    const novo = select.value as TipoEnvio;
    const anterior = this.tipoEnvio;
    if (novo === anterior) return;
    if (anterior && this.conteudo.trim()) {
      const ok = await this.dialogo.confirmar({
        titulo: 'Trocar o tipo de envio',
        mensagem: novo === 'WHATSAPP'
          ? 'O conteúdo será convertido para texto do WhatsApp. Imagens, cores e links serão perdidos.'
          : 'O conteúdo será convertido para e-mail: cada linha vira um parágrafo.',
        confirmar: 'Converter'
      });
      if (!ok) {
        select.value = anterior;
        return;
      }
      this.conteudo = novo === 'WHATSAPP' ? htmlParaWhatsapp(this.conteudo) : whatsappParaEmail(this.conteudo);
    }
    this.tipoEnvio = novo;
    this.alterou();
  }

  inserirTag(codigo: string) {
    if (this.tipoEnvio === 'EMAIL') this.editorHtml?.inserir(codigo);
    else if (this.tipoEnvio === 'WHATSAPP') this.editorWhatsapp?.inserir(codigo);
  }

  async preVisualizar() {
    if (!this.tipoEnvio || !this.tipoLayout) return;
    try {
      this.previa = await this.api.preVisualizar({
        tipoLayout: this.tipoLayout, tipoEnvio: this.tipoEnvio, assunto: this.assunto || null, conteudo: this.conteudo
      });
      this.error = '';
    } catch (e: any) {
      this.error = e.message;
    }
  }

  balao(texto: string): string {
    return whatsappParaHtml(texto);
  }

  async salvar() {
    if (!this.nome.trim() || !this.tipoLayout || !this.tipoEnvio || !this.conteudo.trim()) {
      this.error = 'Preencha nome, tipo layout, tipo de envio e o conteúdo.';
      return;
    }
    const request = {
      nome: this.nome.trim(),
      tipoLayout: this.tipoLayout,
      tipoEnvio: this.tipoEnvio,
      assunto: this.tipoEnvio === 'EMAIL' ? (this.assunto.trim() || null) : null,
      conteudo: this.conteudo,
      ativo: this.ativo
    };
    this.salvando = true;
    try {
      if (this.id) await this.api.atualizar(this.id, request);
      else await this.api.criar(request);
      this.salvo = true;
      this.error = '';
      await this.router.navigate(['/layouts']);
    } catch (e: any) {
      this.error = e.message;
    } finally {
      this.salvando = false;
    }
  }

  private async carregarTags() {
    if (!this.tipoLayout) return;
    try {
      this.tags = await this.api.tags(this.tipoLayout);
    } catch (e: any) {
      this.error = e.message;
    }
  }
}
