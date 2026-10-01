import { ChangeDetectionStrategy, Component, ElementRef, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CabecalhoPaginaComponent } from '../../../shared/components/cabecalho-pagina/cabecalho-pagina.component';
import { CampoDataComponent } from '../../../shared/components/datas/campo-data.component';
import { OpcaoSelectBusca, SelectBuscaComponent } from '../../../shared/components/select-busca/select-busca.component';
import { MascaraDirective } from '../../../shared/directives/mascara.directive';
import { CepService } from '../../../shared/services/cep.service';
import { DialogoService } from '../../../shared/services/dialogo.service';
import { focarPrimeiroInvalido } from '../../../shared/utils/foco';
import { cepValido, formatarCep, formatarTelefone } from '../../../shared/utils/formatos';
import { validatePhotoFile } from '../../../shared/utils/photo.utils';
import { SessaoAtual } from '../../../core/layout/sessao-atual';
import { PessoasService } from '../../pessoas/services/pessoas.service';
import { EventosApiService } from '../eventos-api.service';
import { EventoDetalhe, EventoRequest, Inscrito, SITUACAO_EVENTO, SITUACAO_MENSAGEM, SituacaoMensagem, rotuloQuando } from '../eventos.models';

const PADRAO_LEMBRETE = 1;

/** Ficha do evento: dados e mensagens no formulário; fotos e inscritos em blocos próprios depois de salvo. */
@Component({
  selector: 'app-evento-ficha',
  imports: [ReactiveFormsModule, FormsModule, RouterLink, CabecalhoPaginaComponent, CampoDataComponent, SelectBuscaComponent, MascaraDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="mx-auto max-w-5xl space-y-6">
      <app-cabecalho-pagina [titulo]="evento()?.titulo || 'Novo evento'" [subtitulo]="evento() ? quando(evento()!.inicio) : 'Preencha, salve e publique para começar as inscrições.'">
        <div acoes class="flex flex-wrap items-center gap-2">
          @if (evento(); as e) {
            <span class="badge {{ situacao().tom }}" data-campo="situacao">{{ situacao().texto }}</span>
            @if (e.situacao === 'RASCUNHO' && pode('EVENTO_ALTERAR')) {
              <button type="button" class="btn-primary" data-acao="publicar" [disabled]="ocupado()" (click)="publicar()">Publicar</button>
            }
            @if ((e.situacao === 'RASCUNHO' || e.situacao === 'PUBLICADO') && pode('EVENTO_CANCELAR')) {
              <button type="button" class="btn-danger" data-acao="cancelar" [disabled]="ocupado()" (click)="cancelar()">Cancelar evento</button>
            }
          }
          <a routerLink="/eventos" class="btn-secondary">Voltar</a>
        </div>
      </app-cabecalho-pagina>

      @if (erro(); as mensagem) {
        <div class="rounded-xl bg-red-50 p-4 text-red-700 dark:bg-red-950/40 dark:text-red-300" data-estado="erro" role="alert">{{ mensagem }}</div>
      }

      @if (carregando()) {
        <div class="card p-10 text-center text-[var(--muted)]">Carregando...</div>
      } @else {
        <form [formGroup]="form" (ngSubmit)="salvar()" class="space-y-6">
          <section class="card p-6">
            <h2 class="mb-4 text-lg font-black">Dados</h2>
            <div class="grid gap-4 md:grid-cols-2">
              <div class="md:col-span-2">
                <label class="label" for="evt-titulo">Título *</label>
                <input id="evt-titulo" class="field" formControlName="titulo" maxlength="150">
                @if (form.controls.titulo.invalid && form.controls.titulo.touched) { <p class="mt-1 text-xs text-red-600">Informe o título.</p> }
              </div>
              <div class="md:col-span-2">
                <label class="label" for="evt-descricao">Descrição</label>
                <textarea id="evt-descricao" class="field min-h-24" formControlName="descricao" maxlength="5000"></textarea>
              </div>
              <div>
                <label class="label">Data de início *</label>
                <app-campo-data formControlName="dataInicio" />
                @if (form.controls.dataInicio.invalid && form.controls.dataInicio.touched) { <p class="mt-1 text-xs text-red-600">Informe a data.</p> }
              </div>
              <div>
                <label class="label" for="evt-hora">Hora de início *</label>
                <input id="evt-hora" class="field" type="time" formControlName="horaInicio">
                @if (form.controls.horaInicio.invalid && form.controls.horaInicio.touched) { <p class="mt-1 text-xs text-red-600">Informe a hora.</p> }
              </div>
              <div><label class="label">Data de término</label><app-campo-data formControlName="dataTermino" /></div>
              <div><label class="label" for="evt-hora-fim">Hora de término</label><input id="evt-hora-fim" class="field" type="time" formControlName="horaTermino"></div>
              <div>
                <label class="label" for="evt-vagas">Vagas</label>
                <input id="evt-vagas" class="field" type="number" min="1" formControlName="vagas" placeholder="Sem limite">
                @if (form.controls.vagas.invalid && form.controls.vagas.touched) { <p class="mt-1 text-xs text-red-600">Deixe em branco ou informe 1 ou mais.</p> }
              </div>
              <div>
                <label class="label" for="evt-lembrete">Lembrete pelo WhatsApp</label>
                <select id="evt-lembrete" class="field" formControlName="lembreteDias">
                  <option [ngValue]="0">Não enviar lembrete</option>
                  <option [ngValue]="1">1 dia antes</option>
                  <option [ngValue]="2">2 dias antes</option>
                  <option [ngValue]="3">3 dias antes</option>
                  <option [ngValue]="7">1 semana antes</option>
                </select>
              </div>
            </div>
          </section>

          <section class="card p-6">
            <h2 class="mb-4 text-lg font-black">Local</h2>
            <div class="grid gap-4 md:grid-cols-6">
              <div class="md:col-span-4"><label class="label" for="evt-local">Nome do local</label><input id="evt-local" class="field" formControlName="localNome" placeholder="Salão paroquial"></div>
              <div class="md:col-span-2">
                <label class="label" for="evt-cep">CEP</label>
                <input id="evt-cep" class="field" formControlName="cep" appMascara="cep" inputmode="numeric" placeholder="00000-000" (blur)="buscarCep()">
                @if (avisoCep()) { <p class="mt-1 text-xs text-amber-700 dark:text-amber-300">{{ avisoCep() }}</p> }
              </div>
              <div class="md:col-span-4"><label class="label" for="evt-rua">Logradouro</label><input id="evt-rua" class="field" formControlName="logradouro"></div>
              <div class="md:col-span-2"><label class="label" for="evt-numero">Número</label><input id="evt-numero" class="field" formControlName="numero"></div>
              <div class="md:col-span-2"><label class="label" for="evt-compl">Complemento</label><input id="evt-compl" class="field" formControlName="complemento"></div>
              <div class="md:col-span-2"><label class="label" for="evt-bairro">Bairro</label><input id="evt-bairro" class="field" formControlName="bairro"></div>
              <div class="md:col-span-1"><label class="label" for="evt-cidade">Cidade</label><input id="evt-cidade" class="field" formControlName="cidade"></div>
              <div class="md:col-span-1"><label class="label" for="evt-uf">UF</label><input id="evt-uf" class="field uppercase" formControlName="uf" maxlength="2"></div>
              <div class="md:col-span-6">
                <label class="label" for="evt-mapa">Link do mapa</label>
                <input id="evt-mapa" class="field" formControlName="mapaUrl" placeholder="https://maps.app.goo.gl/...">
                @if (form.controls.mapaUrl.invalid && form.controls.mapaUrl.touched) { <p class="mt-1 text-xs text-red-600">O link precisa começar com https://</p> }
              </div>
            </div>
          </section>

          <section class="card p-6">
            <h2 class="mb-1 text-lg font-black">Responsável</h2>
            <p class="mb-4 text-sm text-[var(--muted)]">Aparece nas mensagens como contato para dúvidas.</p>
            <div class="grid gap-4 md:grid-cols-2">
              <div><label class="label" for="evt-resp">Nome</label><input id="evt-resp" class="field" formControlName="responsavelNome"></div>
              <div><label class="label" for="evt-resp-tel">Telefone</label><input id="evt-resp-tel" class="field" formControlName="responsavelTelefone" appMascara="telefone" inputmode="tel" placeholder="(00) 00000-0000"></div>
            </div>
          </section>

          <section class="card p-6">
            <h2 class="mb-1 text-lg font-black">Mensagens do WhatsApp</h2>
            <p class="mb-4 text-sm text-[var(--muted)]">Só para quem autorizou WhatsApp no cadastro. Linha com informação vazia (sem mapa, por exemplo) some da mensagem.</p>
            <div class="grid gap-4 md:grid-cols-2">
              <div><label class="label" for="evt-msg-conf">Ao inscrever</label><textarea id="evt-msg-conf" class="field min-h-48 font-mono text-xs" formControlName="mensagemConfirmacao" maxlength="2000"></textarea></div>
              <div><label class="label" for="evt-msg-lemb">Lembrete</label><textarea id="evt-msg-lemb" class="field min-h-48 font-mono text-xs" formControlName="mensagemLembrete" maxlength="2000"></textarea></div>
            </div>
            <details class="mt-3 text-sm">
              <summary class="cursor-pointer font-bold" [style.color]="'var(--brand)'">Informações que dá para usar</summary>
              <ul class="mt-2 grid gap-1 md:grid-cols-2">
                @for (t of tags(); track t[0]) {
                  <li><code class="rounded bg-[var(--app-bg)] px-1 text-xs">{{ t[0] }}</code> <span class="text-[var(--muted)]">{{ t[1] }}</span></li>
                }
              </ul>
            </details>
          </section>

          @if (podeSalvar()) {
            <div class="flex justify-end">
              <button type="submit" class="btn-primary" data-acao="salvar" [disabled]="ocupado()">{{ ocupado() ? 'Salvando...' : 'Salvar' }}</button>
            </div>
          }
        </form>

        @if (evento(); as e) {
          <section class="card p-6" data-bloco="fotos">
            <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 class="text-lg font-black">Fotos</h2>
              @if (podeMexerNasFotos()) {
                <label class="btn-secondary cursor-pointer" data-acao="adicionar-foto">
                  ＋ Adicionar foto
                  <input type="file" class="sr-only" accept="image/jpeg,image/png,image/webp,image/heic" (change)="enviarFoto($event)">
                </label>
              }
            </div>
            @if (e.fotos.length) {
              <div class="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
                @for (f of e.fotos; track f.id) {
                  <figure class="overflow-hidden rounded-2xl border border-[var(--line)]" [attr.data-foto]="f.id">
                    <img [src]="f.url" alt="Foto do evento" class="h-32 w-full object-cover">
                    <figcaption class="flex items-center justify-between gap-2 p-2">
                      @if (f.capa) {
                        <span class="badge bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold">Capa</span>
                      } @else if (podeMexerNasFotos()) {
                        <button type="button" class="text-xs font-bold hover:underline" [style.color]="'var(--brand)'" (click)="definirCapa(f.id)">Tornar capa</button>
                      }
                      @if (podeMexerNasFotos()) {
                        <button type="button" class="text-xs font-bold text-red-600 hover:underline dark:text-red-400" (click)="excluirFoto(f.id)">Excluir</button>
                      }
                    </figcaption>
                  </figure>
                }
              </div>
            } @else {
              <p class="text-sm text-[var(--muted)]">Nenhuma foto ainda. A primeira vira a capa.</p>
            }
          </section>

          <section class="card p-6" data-bloco="inscritos">
            <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 class="text-lg font-black">Inscritos <span class="text-[var(--muted)]">({{ e.inscritos.length }}@if (e.vagas) {/{{ e.vagas }}})</span></h2>
            </div>
            @if (podeInscrever()) {
              <div class="mb-4 flex flex-col gap-2 md:flex-row md:items-end" data-bloco="inscrever">
                <div class="flex-1">
                  <label class="label">Pessoa</label>
                  <app-select-busca [opcoes]="opcoesPessoas()" placeholder="Escolha uma pessoa cadastrada" [(ngModel)]="pessoaEscolhida" [ngModelOptions]="{ standalone: true }" />
                </div>
                <button type="button" class="btn-primary" data-acao="inscrever" [disabled]="!pessoaEscolhida || ocupado()" (click)="inscrever()">Inscrever</button>
              </div>
            } @else if (e.situacao === 'RASCUNHO') {
              <p class="mb-4 text-sm text-[var(--muted)]">Publique o evento para começar as inscrições.</p>
            }
            @if (e.inscritos.length) {
              <div class="tabela-rolagem">
                <table class="tabela">
                  <thead><tr><th>Nome</th><th>Telefone</th><th>Confirmação</th><th>Lembrete</th>@if (podeInscrever()) {<th></th>}</tr></thead>
                  <tbody>
                    @for (i of e.inscritos; track i.id) {
                      <tr [attr.data-inscrito]="i.id">
                        <td class="font-semibold">{{ i.nome }}</td>
                        <td>{{ i.telefone || '—' }}</td>
                        <td>
                          @if (i.confirmacao; as s) { <span class="badge {{ tomMensagem(s) }}">{{ textoMensagem(s) }}</span> } @else { — }
                        </td>
                        <td>
                          @if (i.lembrete; as s) { <span class="badge {{ tomMensagem(s) }}">{{ textoMensagem(s) }}</span> }
                          @else { <span class="text-xs text-[var(--muted)]">{{ e.lembreteDias ? 'Agendado' : 'Sem lembrete' }}</span> }
                        </td>
                        @if (podeInscrever()) {
                          <td class="text-right"><button type="button" class="text-xs font-bold text-red-600 hover:underline dark:text-red-400" (click)="remover(i)">Remover</button></td>
                        }
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            } @else {
              <p class="text-sm text-[var(--muted)]" data-estado="sem-inscritos">Ninguém inscrito ainda.</p>
            }
          </section>
        }
      }
    </div>
  `
})
export class EventoFichaComponent implements OnInit {
  private api = inject(EventosApiService);
  private pessoas = inject(PessoasService);
  private cepService = inject(CepService);
  private dialogo = inject(DialogoService);
  private sessao = inject(SessaoAtual);
  private rota = inject(ActivatedRoute);
  private router = inject(Router);
  private host = inject(ElementRef<HTMLElement>);
  private fb = inject(FormBuilder);

  readonly quando = rotuloQuando;
  readonly evento = signal<EventoDetalhe | null>(null);
  readonly carregando = signal(true);
  readonly ocupado = signal(false);
  readonly erro = signal<string | null>(null);
  readonly avisoCep = signal('');
  readonly opcoesPessoas = signal<OpcaoSelectBusca[]>([]);
  readonly tags = computed(() => Object.entries(this.evento()?.tags ?? {}));
  readonly situacao = computed(() => SITUACAO_EVENTO[this.evento()?.situacao ?? 'RASCUNHO']);
  readonly podeSalvar = computed(() => {
    const e = this.evento();
    if (!e) return this.pode('EVENTO_CRIAR');
    return e.situacao !== 'CANCELADO' && this.pode('EVENTO_ALTERAR');
  });
  readonly podeMexerNasFotos = computed(() => this.evento()?.situacao !== 'CANCELADO' && this.pode('EVENTO_ALTERAR'));
  readonly podeInscrever = computed(() => this.evento()?.situacao === 'PUBLICADO' && this.pode('EVENTO_INSCREVER'));

  pessoaEscolhida: string | null = null;

  readonly form = this.fb.group({
    titulo: ['', [Validators.required, Validators.maxLength(150)]],
    descricao: [''],
    dataInicio: ['', Validators.required],
    horaInicio: ['', Validators.required],
    dataTermino: [''],
    horaTermino: [''],
    vagas: [null as number | null, Validators.min(1)],
    lembreteDias: [PADRAO_LEMBRETE],
    localNome: [''],
    cep: [''],
    logradouro: [''],
    numero: [''],
    complemento: [''],
    bairro: [''],
    cidade: [''],
    uf: [''],
    mapaUrl: ['', Validators.pattern(/^https?:\/\/\S+$/)],
    responsavelNome: [''],
    responsavelTelefone: [''],
    mensagemConfirmacao: [''],
    mensagemLembrete: ['']
  });

  pode(codigo: string): boolean {
    return this.sessao.permissoes().includes(codigo);
  }

  async ngOnInit(): Promise<void> {
    const id = this.rota.snapshot.paramMap.get('id');
    try {
      if (id) {
        this.aplicar(await this.api.buscar(id));
      } else {
        const eu = this.sessao.eu();
        this.form.patchValue({ responsavelNome: eu?.nome ?? '', responsavelTelefone: eu?.telefone ? formatarTelefone(eu.telefone) : '' });
      }
    } catch (e) {
      this.erro.set((e as Error).message);
    } finally {
      this.carregando.set(false);
    }
    if (this.pode('EVENTO_INSCREVER')) void this.carregarPessoas();
  }

  private async carregarPessoas(): Promise<void> {
    try {
      const lista = await this.pessoas.listar();
      this.opcoesPessoas.set(lista.map(p => ({ valor: p.id, rotulo: p.nomeCompleto, detalhe: p.sequencial ? '#' + p.sequencial : undefined })));
    } catch {
      this.opcoesPessoas.set([]);
    }
  }

  private aplicar(e: EventoDetalhe): void {
    this.evento.set(e);
    const [dataInicio, horaInicio] = e.inicio.split('T');
    const [dataTermino, horaTermino] = e.termino ? e.termino.split('T') : ['', ''];
    this.form.reset({
      titulo: e.titulo, descricao: e.descricao ?? '', dataInicio, horaInicio: horaInicio.slice(0, 5),
      dataTermino, horaTermino: (horaTermino ?? '').slice(0, 5), vagas: e.vagas, lembreteDias: e.lembreteDias,
      localNome: e.localNome ?? '', cep: e.cep ? formatarCep(e.cep) : '', logradouro: e.logradouro ?? '', numero: e.numero ?? '',
      complemento: e.complemento ?? '', bairro: e.bairro ?? '', cidade: e.cidade ?? '', uf: e.uf ?? '', mapaUrl: e.mapaUrl ?? '',
      responsavelNome: e.responsavelNome ?? '', responsavelTelefone: e.responsavelTelefone ?? '',
      mensagemConfirmacao: e.mensagemConfirmacao, mensagemLembrete: e.mensagemLembrete
    });
    if (!this.podeSalvar()) this.form.disable();
  }

  private pedido(): EventoRequest {
    const v = this.form.getRawValue();
    const texto = (s: string | null | undefined) => (s ?? '').trim() || null;
    const inicio = `${v.dataInicio}T${v.horaInicio}:00`;
    const termino = v.dataTermino ? `${v.dataTermino}T${v.horaTermino || '23:59'}:00` : null;
    return {
      titulo: (v.titulo ?? '').trim(), descricao: texto(v.descricao), inicio, termino, localNome: texto(v.localNome),
      cep: texto(v.cep), logradouro: texto(v.logradouro), numero: texto(v.numero), complemento: texto(v.complemento),
      bairro: texto(v.bairro), cidade: texto(v.cidade), uf: texto(v.uf), mapaUrl: texto(v.mapaUrl),
      vagas: v.vagas === null || (v.vagas as unknown) === '' ? null : Number(v.vagas),
      responsavelNome: texto(v.responsavelNome), responsavelTelefone: texto(v.responsavelTelefone),
      lembreteDias: v.lembreteDias ?? PADRAO_LEMBRETE,
      mensagemConfirmacao: texto(v.mensagemConfirmacao), mensagemLembrete: texto(v.mensagemLembrete)
    };
  }

  async salvar(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.erro.set('Corrija os campos marcados em vermelho.');
      setTimeout(() => focarPrimeiroInvalido(this.host.nativeElement));
      return;
    }
    await this.executar(async () => {
      const atual = this.evento();
      if (atual) {
        this.aplicar(await this.api.atualizar(atual.id, this.pedido()));
      } else {
        const criado = await this.api.criar(this.pedido());
        this.aplicar(criado);
        void this.router.navigate(['/eventos', criado.id], { replaceUrl: true });
      }
    });
  }

  async publicar(): Promise<void> {
    const e = this.evento();
    if (!e) return;
    await this.executar(async () => this.aplicar(await this.api.publicar(e.id)));
  }

  async cancelar(): Promise<void> {
    const e = this.evento();
    if (!e) return;
    const certeza = await this.dialogo.confirmar({
      titulo: 'Cancelar evento', mensagem: `Cancelar "${e.titulo}"? Depois de cancelado ele não pode ser alterado.`,
      confirmar: 'Cancelar evento', cancelar: 'Voltar', perigo: true
    });
    if (!certeza) return;
    let avisar = false;
    if (e.situacao === 'PUBLICADO' && e.inscritos.length) {
      avisar = await this.dialogo.confirmar({
        titulo: 'Avisar os inscritos?', mensagem: 'Mandar pelo WhatsApp que o evento foi cancelado (só para quem autorizou)?',
        confirmar: 'Avisar', cancelar: 'Não avisar'
      });
    }
    await this.executar(async () => this.aplicar(await this.api.cancelar(e.id, avisar)));
  }

  async inscrever(): Promise<void> {
    const e = this.evento();
    const pessoaId = this.pessoaEscolhida;
    if (!e || !pessoaId) return;
    await this.executar(async () => {
      this.aplicar(await this.api.inscrever(e.id, pessoaId));
      this.pessoaEscolhida = null;
    });
  }

  async remover(i: Inscrito): Promise<void> {
    const e = this.evento();
    if (!e) return;
    const certeza = await this.dialogo.confirmar({
      titulo: 'Remover inscrição', mensagem: `Remover ${i.nome} deste evento?`, confirmar: 'Remover', perigo: true
    });
    if (!certeza) return;
    await this.executar(async () => this.aplicar(await this.api.removerInscricao(e.id, i.id)));
  }

  async enviarFoto(evento: Event): Promise<void> {
    const input = evento.target as HTMLInputElement;
    const arquivo = input.files?.[0];
    input.value = '';
    const e = this.evento();
    if (!arquivo || !e) return;
    const invalido = validatePhotoFile(arquivo);
    if (invalido) {
      this.erro.set(invalido);
      return;
    }
    await this.executar(async () => this.aplicar(await this.api.enviarFoto(e.id, arquivo)));
  }

  async definirCapa(fotoId: string): Promise<void> {
    const e = this.evento();
    if (!e) return;
    await this.executar(async () => this.aplicar(await this.api.definirCapa(e.id, fotoId)));
  }

  async excluirFoto(fotoId: string): Promise<void> {
    const e = this.evento();
    if (!e) return;
    const certeza = await this.dialogo.confirmar({ titulo: 'Excluir foto', mensagem: 'Excluir esta foto do evento?', confirmar: 'Excluir', perigo: true });
    if (!certeza) return;
    await this.executar(async () => this.aplicar(await this.api.excluirFoto(e.id, fotoId)));
  }

  async buscarCep(): Promise<void> {
    this.avisoCep.set('');
    const cep = this.form.controls.cep.value ?? '';
    if (!cepValido(cep)) return;
    const endereco = await this.cepService.buscar(cep);
    if (!endereco) {
      this.avisoCep.set('CEP não encontrado. Preencha o endereço.');
      return;
    }
    this.form.patchValue({ logradouro: endereco.logradouro, bairro: endereco.bairro, cidade: endereco.cidade, uf: endereco.uf });
  }

  textoMensagem(s: SituacaoMensagem): string {
    return SITUACAO_MENSAGEM[s].texto;
  }

  tomMensagem(s: SituacaoMensagem): string {
    return SITUACAO_MENSAGEM[s].tom;
  }

  private async executar(acao: () => Promise<void>): Promise<void> {
    this.ocupado.set(true);
    this.erro.set(null);
    try {
      await acao();
    } catch (e) {
      this.erro.set((e as Error).message);
    } finally {
      this.ocupado.set(false);
    }
  }
}
