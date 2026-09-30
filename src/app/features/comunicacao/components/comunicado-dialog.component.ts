import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ModalComponent } from '../../../shared/components/modal/modal.component';
import {
  ANEXOS_MAX, ANEXOS_MAX_BYTES, ANEXOS_TIPOS, DestinatarioPrevia, ENVIAR_PARA_LABEL, EnviarPara, Layout,
  PreVisualizacaoComunicado, QuaisContatos, TIPO_ENVIO_LABEL, TipoEnvio
} from '../comunicacao.models';
import { ComunicadosApiService } from '../comunicados-api.service';
import { LayoutsApiService } from '../layouts-api.service';
import { whatsappParaHtml } from './editor-whatsapp.component';

type Passo = 1 | 2 | 3;

export function tamanhoLegivel(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} MB`;
}

/**
 * Assistente "Comunicado para Pessoas" (PLANO-005), como o do SIN: 1) canal e layout; 2) destinatários;
 * 3) assunto e anexos (só e-mail), Visualizar e Enviar. O envio vai para a fila; o histórico fica em Comunicados.
 */
@Component({
  selector: 'app-comunicado-dialog',
  standalone: true,
  imports: [FormsModule, RouterLink, ModalComponent],
  template: `
    <app-modal [aberto]="open" tamanho="xl" [fecharNoFundo]="false" (fechar)="fechar.emit()"
      [titulo]="'Comunicado para Pessoas' + (canal ? ' – ' + rotuloCanal[canal] : '')">
      @if (passo === 1) {
        <h3 class="mb-3 font-bold text-slate-800">1. Escolha um canal</h3>
        <div class="grid gap-3 sm:grid-cols-2">
          <button type="button" class="rounded-2xl border-2 p-6 text-left transition"
                  [class.border-[var(--brand)]]="canal === 'EMAIL'" [class.bg-violet-50]="canal === 'EMAIL'"
                  [class.border-[var(--line)]]="canal !== 'EMAIL'" (click)="escolherCanal('EMAIL')" data-canal="EMAIL">
            <span class="text-3xl">✉</span><span class="mt-2 block text-lg font-black">E-mail</span>
          </button>
          <button type="button" class="rounded-2xl border-2 p-6 text-left transition disabled:cursor-not-allowed disabled:opacity-50"
                  [class.border-[var(--brand)]]="canal === 'WHATSAPP'" [class.bg-violet-50]="canal === 'WHATSAPP'"
                  [class.border-[var(--line)]]="canal !== 'WHATSAPP'" [disabled]="whatsappDesligado"
                  [title]="whatsappDesligado ? 'Configure o WhatsApp em Paróquia' : ''" (click)="escolherCanal('WHATSAPP')" data-canal="WHATSAPP">
            <span class="text-3xl">💬</span><span class="mt-2 block text-lg font-black">WhatsApp</span>
            @if (whatsappDesligado) { <span class="mt-1 block text-xs text-slate-500">Configure o WhatsApp em Paróquia</span> }
          </button>
        </div>
        @if (canal) {
          <h3 class="mb-2 mt-6 font-bold text-slate-800">2. Escolha um layout de acordo com o canal</h3>
          <div class="flex items-center gap-2">
            <select class="field" [(ngModel)]="layoutId" data-layout>
              <option value="" disabled>Selecione o layout</option>
              @for (l of layouts; track l.id) { <option [value]="l.id">{{ l.nome }}</option> }
            </select>
            <button type="button" class="btn-secondary !px-3" title="Recarregar layouts" (click)="carregarLayouts(true)">↻</button>
          </div>
          @if (!layouts.length) { <p class="mt-2 text-sm text-slate-500">Nenhum layout ativo de {{ rotuloCanal[canal] }}.</p> }
          <a routerLink="/layouts/novo" target="_blank" class="mt-2 inline-block text-sm font-semibold text-brand-blue hover:underline">Criar layout</a>
        }
      }

      @if (passo === 2) {
        <div class="grid gap-3 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div><label class="label" for="enviar-para">Enviar para</label>
            <select id="enviar-para" class="field" [(ngModel)]="enviarPara" data-enviar-para>
              @for (o of opcoesPara; track o.valor) { <option [value]="o.valor">{{ o.rotulo }}</option> }
            </select></div>
          <div><label class="label" for="contatos">Contatos</label>
            <select id="contatos" class="field" [(ngModel)]="contatos">
              <option value="PRINCIPAL">Só o principal</option>
              <option value="TODOS">Todos</option>
            </select></div>
          <button type="button" class="btn-primary" [disabled]="carregando" (click)="aplicar()" data-aplicar>Aplicar</button>
        </div>
        <div class="mt-4 flex flex-wrap items-center gap-2">
          <input class="field flex-1" placeholder="Buscar por nome" [(ngModel)]="busca">
          <button type="button" class="btn-secondary" (click)="selecionarValidos()" data-selecionar-validos>Selecionar contatos válidos</button>
          <button type="button" class="btn-secondary" (click)="removerNaoSelecionados()">Remover não selecionados</button>
        </div>
        <div class="mt-3 overflow-x-auto">
          <table class="tabela">
            <thead><tr>
              <th class="w-12 text-center"><input type="checkbox" class="tabela-check" [checked]="todosMarcados" (change)="marcarTodos($any($event.target).checked)" aria-label="Marcar todos"></th>
              <th>Nome</th><th>{{ canal === 'EMAIL' ? 'E-mails' : 'Telefones' }}</th>
            </tr></thead>
            <tbody>
              @for (d of linhasVisiveis; track d.pessoaId) {
                <tr [class.marcada]="selecionados.has(d.pessoaId)">
                  <td class="text-center"><input type="checkbox" class="tabela-check" [attr.data-destinatario]="d.pessoaId"
                         [checked]="selecionados.has(d.pessoaId)" (change)="alternar(d.pessoaId)" [attr.aria-label]="'Selecionar ' + d.nome"></td>
                  <td>{{ d.nome }}
                    @if (canal === 'WHATSAPP' && d.autorizaWhatsapp === false) {
                      <span class="ml-1 text-xs font-semibold text-amber-700" title="No cadastro, não autorizou contato por WhatsApp">⚠ Não autorizou WhatsApp</span>
                    }
                  </td>
                  <td>
                    @if (!d.destinos.length) { <span class="text-slate-400">Sem contato</span> }
                    @else if (d.destinos.length === 1) { {{ d.destinos[0].endereco }} }
                    @else { <span [title]="enderecos(d)">{{ d.destinos.length }} contatos</span> }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="3" class="p-6 text-center text-slate-500">{{ carregando ? 'Carregando...' : 'Clique em Aplicar para ver os destinatários.' }}</td></tr>
              }
            </tbody>
          </table>
        </div>
        <p class="mt-2 text-sm font-semibold text-slate-600">TOTAL: {{ linhas.length }} · SELECIONADOS: {{ selecionados.size }}</p>
      }

      @if (passo === 3) {
        @if (canal === 'EMAIL') {
          <label class="label" for="assunto">Assunto do e-mail *</label>
          <input id="assunto" class="field" maxlength="200" [(ngModel)]="assunto" data-assunto>
          <p class="label mt-5">Anexos</p>
          <div class="rounded-xl border-2 border-dashed border-[var(--field-line)] p-6 text-center text-sm text-slate-500"
               (dragover)="$event.preventDefault()" (drop)="soltar($event)">
            Arraste arquivos aqui ou <label class="cursor-pointer font-semibold text-brand-blue hover:underline">clique para escolher
              <input type="file" class="hidden" multiple [accept]="tiposAceitos" (change)="escolherArquivos($any($event.target))"></label>
            <span class="mt-1 block text-xs">PDF, JPG, PNG, DOCX ou XLSX · até {{ maxAnexos }} arquivos e 10 MB somados</span>
          </div>
          @if (anexos.length) {
            <table class="tabela mt-3">
              <thead><tr><th>Nome</th><th>Tamanho</th><th></th></tr></thead>
              <tbody>
                @for (a of anexos; track a.name; let i = $index) {
                  <tr><td>{{ a.name }}</td><td>{{ tamanho(a.size) }}</td>
                    <td class="text-right"><button type="button" class="text-red-600 hover:underline" (click)="anexos.splice(i, 1)">Remover</button></td></tr>
                }
              </tbody>
            </table>
          }
        } @else {
          <p class="text-slate-600">Tudo pronto. As mensagens saem pelo WhatsApp da paróquia, com um intervalo entre elas.</p>
        }
        <p class="mt-4 text-sm text-slate-500">{{ selecionados.size }} pessoa(s) selecionada(s).</p>
      }

      @if (erro) { <p class="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700" data-erro>{{ erro }}</p> }

      <div rodape class="flex flex-wrap items-center justify-between gap-2">
        @if (passo === 1) {
          <button type="button" class="btn-secondary" (click)="fechar.emit()">Cancelar</button>
        } @else {
          <button type="button" class="btn-secondary" (click)="voltar()">Voltar</button>
        }
        <div class="flex gap-2">
          @if (passo === 3) {
            <button type="button" class="btn-secondary" [disabled]="carregando" (click)="visualizar()" data-visualizar>Visualizar</button>
            <button type="button" class="btn-primary" [disabled]="enviando" (click)="enviar()" data-enviar>{{ enviando ? 'Enviando...' : 'Enviar' }}</button>
          } @else {
            <button type="button" class="btn-primary" [disabled]="!podeContinuar" (click)="continuar()" data-continuar>Continuar</button>
          }
        </div>
      </div>
    </app-modal>

    <app-modal [aberto]="open && !!previa" titulo="Detalhes do envio" rotulo="Detalhes do envio" tamanho="lg" [camada]="60" (fechar)="previa = null">
      @if (previa; as previa) {
        <dl class="mb-3 space-y-1 text-sm"><div><b>De:</b> {{ previa.de }}</div><div><b>Para:</b> {{ previa.para }}</div>
          @if (previa.assunto) { <div><b>Assunto:</b> {{ previa.assunto }}</div> }</dl>
        @if (canal === 'EMAIL') {
          <div class="rounded-lg border bg-white p-4 text-slate-900" [innerHTML]="previa.conteudo"></div>
        } @else {
          <div class="rounded-xl bg-[#e5ddd5] p-4"><div class="ml-auto max-w-[85%] break-words rounded-lg bg-[#dcf8c6] px-3 py-2 text-sm text-slate-900 shadow"
               [innerHTML]="balao(previa.conteudo)"></div></div>
        }
      }
    </app-modal>
  `
})
export class ComunicadoDialogComponent implements OnChanges {
  @Input() open = false;
  @Input() pessoaIds: string[] = [];
  @Output() fechar = new EventEmitter<void>();
  @Output() enviado = new EventEmitter<{ id: string; total: number }>();

  readonly rotuloCanal = TIPO_ENVIO_LABEL;
  readonly opcoesPara = (Object.keys(ENVIAR_PARA_LABEL) as EnviarPara[]).map(valor => ({ valor, rotulo: ENVIAR_PARA_LABEL[valor] }));
  readonly maxAnexos = ANEXOS_MAX;
  readonly tiposAceitos = ANEXOS_TIPOS.join(',');

  passo: Passo = 1;
  canal: TipoEnvio | null = null;
  whatsappDesligado = false;
  layouts: Layout[] = [];
  layoutId = '';
  enviarPara: EnviarPara = 'RESPONSAVEIS';
  contatos: QuaisContatos = 'PRINCIPAL';
  linhas: DestinatarioPrevia[] = [];
  selecionados = new Set<string>();
  busca = '';
  assunto = '';
  anexos: File[] = [];
  previa: PreVisualizacaoComunicado | null = null;
  carregando = false;
  enviando = false;
  erro = '';

  constructor(private api: ComunicadosApiService, private layoutsApi: LayoutsApiService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && this.open) void this.iniciar();
  }

  private async iniciar() {
    this.passo = 1;
    this.canal = null;
    this.layoutId = '';
    this.layouts = [];
    this.linhas = [];
    this.selecionados = new Set();
    this.assunto = '';
    this.anexos = [];
    this.erro = '';
    this.previa = null;
    try {
      this.whatsappDesligado = !(await this.api.whatsapp()).ativo;
    } catch {
      // Sem PAROQUIA não dá para ler: deixa tentar e a API responde no fim.
      this.whatsappDesligado = false;
    }
  }

  get podeContinuar(): boolean {
    if (this.passo === 1) return !!this.canal && !!this.layoutId;
    return this.linhas.some(l => this.selecionados.has(l.pessoaId) && l.destinos.length > 0);
  }

  get linhasVisiveis(): DestinatarioPrevia[] {
    const termo = this.busca.trim().toLowerCase();
    return termo ? this.linhas.filter(l => l.nome.toLowerCase().includes(termo)) : this.linhas;
  }

  get todosMarcados(): boolean {
    return this.linhasVisiveis.length > 0 && this.linhasVisiveis.every(l => this.selecionados.has(l.pessoaId));
  }

  async escolherCanal(canal: TipoEnvio) {
    if (this.canal === canal) return;
    this.canal = canal;
    this.layoutId = '';
    this.linhas = [];
    this.selecionados = new Set();
    await this.carregarLayouts();
  }

  async carregarLayouts(forcar = false) {
    if (!this.canal) return;
    try {
      this.layouts = await this.layoutsApi.ativosPorCanal(this.canal, forcar);
      this.erro = '';
    } catch (e: any) {
      this.erro = e.message;
    }
  }

  async continuar() {
    if (!this.podeContinuar) return;
    if (this.passo === 1) {
      this.passo = 2;
      this.assunto = this.layouts.find(l => l.id === this.layoutId)?.assunto ?? '';
      if (!this.linhas.length) await this.aplicar();
    } else {
      this.passo = 3;
    }
  }

  voltar() {
    if (this.passo > 1) this.passo = (this.passo - 1) as Passo;
  }

  async aplicar() {
    if (!this.canal) return;
    this.carregando = true;
    try {
      this.linhas = await this.api.destinatarios(this.canal, this.pessoaIds, this.enviarPara, this.contatos);
      this.selecionados = new Set(this.linhas.filter(l => l.destinos.length).map(l => l.pessoaId));
      this.erro = '';
    } catch (e: any) {
      this.erro = e.message;
    } finally {
      this.carregando = false;
    }
  }

  alternar(id: string) {
    const s = new Set(this.selecionados);
    if (s.has(id)) s.delete(id); else s.add(id);
    this.selecionados = s;
  }

  marcarTodos(marcar: boolean) {
    const s = new Set(this.selecionados);
    for (const l of this.linhasVisiveis) {
      if (marcar) s.add(l.pessoaId); else s.delete(l.pessoaId);
    }
    this.selecionados = s;
  }

  selecionarValidos() {
    this.selecionados = new Set(this.linhas.filter(l => l.destinos.length > 0).map(l => l.pessoaId));
  }

  removerNaoSelecionados() {
    this.linhas = this.linhas.filter(l => this.selecionados.has(l.pessoaId));
  }

  enderecos(d: DestinatarioPrevia): string {
    return d.destinos.map(x => x.endereco).join('\n');
  }

  tamanho(bytes: number): string {
    return tamanhoLegivel(bytes);
  }

  soltar(evento: DragEvent) {
    evento.preventDefault();
    this.adicionar(Array.from(evento.dataTransfer?.files ?? []));
  }

  escolherArquivos(input: HTMLInputElement) {
    this.adicionar(Array.from(input.files ?? []));
    input.value = '';
  }

  /** Mesmos limites da API: tipos aceitos, até 5 arquivos e 10 MB somados. */
  adicionar(arquivos: File[]) {
    const lista = [...this.anexos];
    for (const f of arquivos) {
      if (!ANEXOS_TIPOS.includes(f.type)) {
        this.erro = `Tipo não aceito: ${f.name}. Use PDF, JPG, PNG, DOCX ou XLSX.`;
        return;
      }
      lista.push(f);
    }
    if (lista.length > ANEXOS_MAX) {
      this.erro = `No máximo ${ANEXOS_MAX} anexos.`;
      return;
    }
    if (lista.reduce((s, f) => s + f.size, 0) > ANEXOS_MAX_BYTES) {
      this.erro = 'Os anexos passam de 10 MB somados.';
      return;
    }
    this.anexos = lista;
    this.erro = '';
  }

  private idsParaEnviar(): string[] {
    return this.linhas.filter(l => this.selecionados.has(l.pessoaId) && l.destinos.length).map(l => l.pessoaId);
  }

  async visualizar() {
    const primeiro = this.idsParaEnviar()[0];
    if (!primeiro) return;
    this.carregando = true;
    try {
      this.previa = await this.api.preVisualizar(this.layoutId, this.canal === 'EMAIL' ? this.assunto : null, primeiro, this.enviarPara);
      this.erro = '';
    } catch (e: any) {
      this.erro = e.message;
    } finally {
      this.carregando = false;
    }
  }

  balao(texto: string): string {
    return whatsappParaHtml(texto);
  }

  async enviar() {
    if (!this.canal) return;
    if (this.canal === 'EMAIL' && !this.assunto.trim()) {
      this.erro = 'Informe o assunto do e-mail.';
      return;
    }
    this.enviando = true;
    try {
      const criado = await this.api.criar({
        canal: this.canal,
        layoutId: this.layoutId,
        assunto: this.canal === 'EMAIL' ? this.assunto.trim() : null,
        enviarPara: this.enviarPara,
        contatos: this.contatos,
        pessoaIds: this.idsParaEnviar()
      }, this.canal === 'EMAIL' ? this.anexos : []);
      this.enviado.emit(criado);
      this.fechar.emit();
    } catch (e: any) {
      this.erro = e.message;
    } finally {
      this.enviando = false;
    }
  }
}
