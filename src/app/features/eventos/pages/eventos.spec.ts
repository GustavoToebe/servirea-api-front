import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';
import { SessaoAtual } from '../../../core/layout/sessao-atual';
import { DialogoService } from '../../../shared/services/dialogo.service';
import { PessoasService } from '../../pessoas/services/pessoas.service';
import { EventosApiService } from '../eventos-api.service';
import { LayoutsApiService } from '../../comunicacao/layouts-api.service';
import { EventoDetalhe, EventoResumo } from '../eventos.models';
import { EventoFichaComponent } from './evento-ficha.component';
import { EventosListComponent } from './eventos-list.component';

const TUDO = ['EVENTO', 'EVENTO_CRIAR', 'EVENTO_ALTERAR', 'EVENTO_INSCREVER', 'EVENTO_CANCELAR'];

/** Mesmo formato do EventoDetalhe do back. */
function detalhe(parcial: Partial<EventoDetalhe> = {}): EventoDetalhe {
  return {
    id: 'e1', titulo: 'Retiro de jovens', descricao: null, inicio: '2026-10-10T19:30:00', termino: null,
    localNome: 'Salão', cep: '85810-000', logradouro: 'Rua A', numero: '1', complemento: null, bairro: 'Centro',
    cidade: 'Cascavel', uf: 'PR', mapaUrl: null, vagas: 30, responsavelNome: 'Maria', responsavelTelefone: '(45) 99965-0660',
    lembreteDias: [1], whatsappHabilitado: true, whatsappLayoutConfirmacaoId: null, whatsappLayoutLembreteId: null,
    emailHabilitado: false, emailLayoutConfirmacaoId: null, emailLayoutLembreteId: null,
    mensagemConfirmacao: 'Olá #PESSOA.NOME#!', mensagemLembrete: 'Lembrete #EVENTO.TITULO#',
    situacao: 'PUBLICADO', fotos: [], inscritos: [], tags: { '#PESSOA.NOME#': 'Nome da pessoa inscrita' }, ...parcial
  };
}

function sessao(permissoes: string[]) {
  return { permissoes: signal(permissoes), eu: signal({ nome: 'Maria', telefone: '45999650660' }) };
}

describe('EventosListComponent', () => {
  let api: jasmine.SpyObj<EventosApiService>;
  let fixture: ComponentFixture<EventosListComponent>;

  async function criar(permissoes: string[], lista: EventoResumo[] | Error): Promise<void> {
    api = jasmine.createSpyObj('EventosApiService', ['listar', 'pagina']);
    lista instanceof Error ? api.listar.and.rejectWith(lista) : api.listar.and.resolveTo(lista);
    api.pagina.and.callFake(async () => {const itens=await api.listar();return {itens,pagina:0,tamanho:30,total:itens.length,paginas:1};});
    TestBed.configureTestingModule({
      imports: [EventosListComponent],
      providers: [provideRouter([]), { provide: EventosApiService, useValue: api }, { provide: SessaoAtual, useValue: sessao(permissoes) }]
    });
    fixture = TestBed.createComponent(EventosListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  const resumo = (id: string, situacao: EventoResumo['situacao'], inicio: string): EventoResumo =>
    ({ id, titulo: 'Evento ' + id, inicio, termino: null, localNome: 'Salão', situacao, inscritos: 2, vagas: 10, capaUrl: null });

  it('separa próximos (do mais perto) de passados e cancelados, com a situação em texto', async () => {
    await criar(TUDO, [resumo('c', 'CANCELADO', '2026-11-01T10:00:00'), resumo('b', 'PUBLICADO', '2026-12-01T10:00:00'),
      resumo('a', 'RASCUNHO', '2026-10-20T10:00:00'), resumo('d', 'ENCERRADO', '2026-09-01T10:00:00')]);
    const secoes = fixture.nativeElement.querySelectorAll('section');
    const proximos = Array.from(secoes[0].querySelectorAll('[data-evento]') as NodeListOf<HTMLElement>).map(e => e.getAttribute('data-evento'));
    const passados = Array.from(secoes[1].querySelectorAll('[data-evento]') as NodeListOf<HTMLElement>).map(e => e.getAttribute('data-evento'));
    expect(proximos).toEqual(['a', 'b']);
    expect(passados).toEqual(['c', 'd']);
    expect(secoes[0].textContent).toContain('Rascunho');
    expect(secoes[0].textContent).toContain('2 inscritos de 10 vagas');
    expect(secoes[0].textContent).toContain('às 10:00');
  });

  it('"Novo evento" só com EVENTO_CRIAR', async () => {
    await criar(['EVENTO'], []);
    expect(fixture.nativeElement.querySelector('[data-acao="novo"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('[data-estado="vazio"]')).not.toBeNull();
    TestBed.resetTestingModule();
    await criar(TUDO, []);
    expect(fixture.nativeElement.querySelector('[data-acao="novo"]')).not.toBeNull();
  });

  it('navega por páginas sem baixar toda a lista', async () => {
    await criar(TUDO, []);
    const tela=fixture.componentInstance;tela.paginas.set(2);
    await fixture.whenStable();
    api.pagina.and.resolveTo({itens:[resumo('novo','PUBLICADO','2026-12-01T10:00:00')],pagina:1,tamanho:30,total:31,paginas:2});
    await tela.mudarPagina(1);
    expect(api.pagina).toHaveBeenCalledWith(1);expect(tela.total()).toBe(31);expect(tela.eventos()?.[0].id).toBe('novo');
  });

  it('erro da API aparece na tela', async () => {
    await criar(TUDO, new Error('Sem conexão.'));
    expect(fixture.nativeElement.querySelector('[data-estado="erro"]').textContent).toContain('Sem conexão.');
  });
});

describe('EventoFichaComponent', () => {
  let api: jasmine.SpyObj<EventosApiService>;
  let dialogo: jasmine.SpyObj<DialogoService>;
  let fixture: ComponentFixture<EventoFichaComponent>;

  async function criar(id: string | null, permissoes = TUDO, evento: EventoDetalhe = detalhe()): Promise<void> {
    api = jasmine.createSpyObj('EventosApiService', ['buscar', 'criar', 'atualizar', 'publicar', 'cancelar', 'inscrever', 'removerInscricao', 'enviarFoto', 'definirCapa', 'excluirFoto']);
    api.buscar.and.resolveTo(evento);
    dialogo = jasmine.createSpyObj('DialogoService', ['confirmar']);
    const pessoas = jasmine.createSpyObj('PessoasService', ['listar']);
    pessoas.listar.and.resolveTo([{ id: 'p1', nomeCompleto: 'Ana Souza', sequencial: 7 }]);
    const layouts = jasmine.createSpyObj('LayoutsApiService', ['listar']);
    layouts.listar.and.resolveTo([]);
    TestBed.configureTestingModule({
      imports: [EventoFichaComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } } },
        { provide: EventosApiService, useValue: api },
        { provide: DialogoService, useValue: dialogo },
        { provide: PessoasService, useValue: pessoas },
        { provide: LayoutsApiService, useValue: layouts },
        { provide: SessaoAtual, useValue: sessao(permissoes) }
      ]
    });
    fixture = TestBed.createComponent(EventoFichaComponent);
    await fixture.componentInstance.ngOnInit();
    fixture.detectChanges();
  }

  const el = (s: string) => fixture.nativeElement.querySelector(s) as HTMLElement | null;

  it('novo evento já traz o responsável do usuário logado e sem título não chama a API', async () => {
    await criar(null);
    expect(fixture.componentInstance.form.value.responsavelNome).toBe('Maria');
    expect(fixture.componentInstance.form.value.responsavelTelefone).toBe('(45) 99965-0660');
    await fixture.componentInstance.salvar();
    fixture.detectChanges();
    expect(api.criar).not.toHaveBeenCalled();
    expect(el('[data-estado="erro"]')!.textContent).toContain('Corrija os campos');
  });

  it('salvar monta data e hora de Brasília e manda o corpo para a API', async () => {
    await criar(null);
    api.criar.and.resolveTo(detalhe({ id: 'novo', situacao: 'RASCUNHO' }));
    spyOn(TestBed.inject(Router), 'navigate').and.resolveTo(true);
    fixture.componentInstance.form.patchValue({ titulo: ' Retiro ', dataInicio: '2026-10-10', horaInicio: '19:30', vagas: null, mapaUrl: '' });
    await fixture.componentInstance.salvar();
    const corpo = api.criar.calls.mostRecent().args[0];
    expect(corpo.titulo).toBe('Retiro');
    expect(corpo.inicio).toBe('2026-10-10T19:30:00');
    expect(corpo.termino).toBeNull();
    expect(corpo.vagas).toBeNull();
    expect(corpo.mapaUrl).toBeNull();
    expect(TestBed.inject(Router).navigate).toHaveBeenCalledWith(['/eventos', 'novo'], { replaceUrl: true });
  });

  it('link do mapa sem https fica inválido', async () => {
    await criar(null);
    fixture.componentInstance.form.patchValue({ mapaUrl: 'javascript:alert(1)' });
    expect(fixture.componentInstance.form.controls.mapaUrl.invalid).toBeTrue();
  });

  it('rascunho: oferece Publicar e diz que precisa publicar para inscrever', async () => {
    await criar('e1', TUDO, detalhe({ situacao: 'RASCUNHO' }));
    expect(el('[data-acao="publicar"]')).not.toBeNull();
    expect(el('[data-bloco="inscrever"]')).toBeNull();
    expect(el('[data-bloco="inscritos"]')!.textContent).toContain('Publique o evento');
    expect(el('[data-campo="situacao"]')!.textContent).toContain('Rascunho');
  });

  it('publicado: inscreve a pessoa escolhida e mostra a situação das mensagens em texto', async () => {
    await criar('e1');
    api.inscrever.and.resolveTo(detalhe({ inscritos: [
      { id: 'i1', pessoaId: 'p1', nome: 'Ana Souza', telefone: '(45) 99965-0660', confirmacao: 'PENDENTE', lembrete: null },
      { id: 'i2', pessoaId: 'p2', nome: 'José', telefone: null, confirmacao: 'SEM_AUTORIZACAO', lembrete: 'SEM_AUTORIZACAO' }
    ] }));
    expect(el('[data-acao="publicar"]')).toBeNull();
    fixture.componentInstance.pessoaEscolhida = 'p1';
    await fixture.componentInstance.inscrever();
    fixture.detectChanges();

    expect(api.inscrever).toHaveBeenCalledWith('e1', 'p1');
    const ana = el('[data-inscrito="i1"]')!.textContent!;
    const jose = el('[data-inscrito="i2"]')!.textContent!;
    expect(ana).toContain('Na fila');
    expect(ana).toContain('Agendado');
    expect(jose).toContain('Sem autorização');
    expect(fixture.componentInstance.pessoaEscolhida).toBeNull();
  });

  it('sem EVENTO_INSCREVER não há campo de inscrição nem botão remover', async () => {
    await criar('e1', ['EVENTO', 'EVENTO_ALTERAR'], detalhe({ inscritos: [
      { id: 'i1', pessoaId: 'p1', nome: 'Ana', telefone: null, confirmacao: 'ENVIADA', lembrete: null }] }));
    expect(el('[data-bloco="inscrever"]')).toBeNull();
    expect(el('[data-inscrito="i1"]')!.textContent).not.toContain('Remover');
  });

  it('cancelar pergunta, pergunta se avisa e manda a escolha', async () => {
    await criar('e1', TUDO, detalhe({ inscritos: [{ id: 'i1', pessoaId: 'p1', nome: 'Ana', telefone: null, confirmacao: null, lembrete: null }] }));
    dialogo.confirmar.and.returnValues(Promise.resolve(true), Promise.resolve(false));
    api.cancelar.and.resolveTo(detalhe({ situacao: 'CANCELADO' }));
    await fixture.componentInstance.cancelar();
    fixture.detectChanges();
    expect(dialogo.confirmar).toHaveBeenCalledTimes(2);
    expect(api.cancelar).toHaveBeenCalledWith('e1', false);
    expect(el('[data-campo="situacao"]')!.textContent).toContain('Cancelado');
    expect(el('[data-acao="salvar"]')).toBeNull();
    expect(fixture.componentInstance.form.disabled).toBeTrue();
  });

  it('desistir do cancelamento não chama a API', async () => {
    await criar('e1');
    dialogo.confirmar.and.resolveTo(false);
    await fixture.componentInstance.cancelar();
    expect(api.cancelar).not.toHaveBeenCalled();
  });

  it('erro da API (ex.: sem vagas) aparece na tela', async () => {
    await criar('e1');
    api.inscrever.and.rejectWith(new Error('Não há mais vagas neste evento.'));
    fixture.componentInstance.pessoaEscolhida = 'p1';
    await fixture.componentInstance.inscrever();
    fixture.detectChanges();
    expect(el('[data-estado="erro"]')!.textContent).toContain('Não há mais vagas neste evento.');
  });

  it('foto que não é imagem não é enviada', async () => {
    await criar('e1');
    const txt = new File(['x'], 'nota.txt', { type: 'text/plain' });
    await fixture.componentInstance.enviarFoto({ target: { files: [txt], value: '' } } as unknown as Event);
    fixture.detectChanges();
    expect(api.enviarFoto).not.toHaveBeenCalled();
    expect(el('[data-estado="erro"]')).not.toBeNull();
  });
});
