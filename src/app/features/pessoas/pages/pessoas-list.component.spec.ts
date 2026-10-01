import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { Pessoa, VoluntarioLista } from '../models/pessoa.model';
import { InscricoesApiService } from '../services/inscricoes-api.service';
import { PessoasService } from '../services/pessoas.service';
import { VoluntariosApiService } from '../services/voluntarios-api.service';
import { SessaoAtual } from '../../../core/layout/sessao-atual';
import { PessoasListComponent } from './pessoas-list.component';
import { By } from '@angular/platform-browser';

describe('PessoasListComponent (lista de assinatura)', () => {
  function pessoa(id: string, nome: string, tipo: 'COROINHA' | 'ACOLITO' | null, papeis: string[] = ['VOLUNTARIO']): Pessoa {
    return {
      id, nomeCompleto: nome, sequencial: Number(id), dataNascimento: null, papeis, responsaveis: [],
      voluntario: tipo ? { tipo, ativo: true, funcoesHabilitadas: [] } : null
    } as unknown as Pessoa;
  }

  async function montar(permissoes: string[] = []) {
    const pessoas = jasmine.createSpyObj<PessoasService>('PessoasService', ['listar', 'emCache', 'pagina', 'resumo']);
    pessoas.emCache.and.returnValue(null);
    pessoas.listar.and.resolveTo([
      pessoa('1', 'Ana', 'COROINHA'),
      pessoa('2', 'Bruno', 'ACOLITO'),
      pessoa('3', 'Carla', 'COROINHA'),
      pessoa('4', 'Dirce', null, ['RESPONSAVEL'])
    ]);
    pessoas.pagina.and.callFake(async filtro => {
      const itens=await pessoas.listar(filtro.papel,filtro.nome);
      return {itens,pagina:0,tamanho:30,total:itens.length,paginas:1};
    });
    pessoas.resumo.and.resolveTo({pessoas:4,ativos:0,inativos:0,pendentes:0});
    const voluntarios = jasmine.createSpyObj<VoluntariosApiService>('VoluntariosApiService', ['contagens', 'listar', 'setAtivo', 'emCache']);
    voluntarios.contagens.and.resolveTo({ ativos: 0, inativos: 0 });
    voluntarios.emCache.and.returnValue(null);
    voluntarios.listar.and.resolveTo([]);
    voluntarios.setAtivo.and.resolveTo();
    const inscricoes = jasmine.createSpyObj<InscricoesApiService>('InscricoesApiService', ['listar', 'pagina']);
    inscricoes.listar.and.resolveTo([]);
    inscricoes.pagina.and.resolveTo({itens:[],pagina:0,tamanho:30,total:0,paginas:0});
    TestBed.configureTestingModule({
      imports: [PessoasListComponent],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
        { provide: PessoasService, useValue: pessoas },
        { provide: VoluntariosApiService, useValue: voluntarios },
        { provide: InscricoesApiService, useValue: inscricoes },
        { provide: SessaoAtual, useValue: { permissoes: () => permissoes } }
      ]
    });
    const fixture = TestBed.createComponent(PessoasListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture;
  }

  it('marcar todos, desmarcar um e abrir o modal só com os marcados pelo menu', async () => {
    const fixture = await montar();
    const tela = fixture.componentInstance;
    const el = fixture.nativeElement as HTMLElement;

    // Abrir menu opções e ver se listagem tá desabilitado
    let opcoesBtn = el.querySelector('[data-opcoes]') as HTMLButtonElement;
    opcoesBtn.click();
    fixture.detectChanges();

    let listagemBtn = el.querySelector('[data-opcao="listagem"]') as HTMLButtonElement;
    expect(listagemBtn.disabled).toBeTrue();

    // Fechar o menu
    document.dispatchEvent(new MouseEvent('click'));
    fixture.detectChanges();

    const todos = el.querySelector('[data-marcar-todos]') as HTMLInputElement;
    todos.click();
    fixture.detectChanges();
    expect(tela.quantidadeMarcada).toBe(4);

    (el.querySelector('[data-marcar="2"]') as HTMLInputElement).click();
    fixture.detectChanges();
    expect(tela.quantidadeMarcada).toBe(3);
    expect(todos.indeterminate).toBeTrue();

    // Abrir menu novamente e clicar listagem
    opcoesBtn = el.querySelector('[data-opcoes]') as HTMLButtonElement;
    opcoesBtn.click();
    fixture.detectChanges();

    listagemBtn = el.querySelector('[data-opcao="listagem"]') as HTMLButtonElement;
    expect(listagemBtn.disabled).toBeFalse();
    listagemBtn.click();
    fixture.detectChanges();

    expect(tela.itensLista.map(i => i.nome)).toEqual(['Ana', 'Carla', 'Dirce']);
    expect(el.querySelector('[aria-label="Gerar lista de assinatura"]')).not.toBeNull();
  });

  it('o filtro de tipo esconde quem estava marcado e ele não entra na lista', async () => {
    const fixture = await montar();
    const tela = fixture.componentInstance;
    tela.marcarTodos(true);
    tela.tipo = 'COROINHA';
    fixture.detectChanges();
    expect(tela.quantidadeMarcada).toBe(2);
    expect(tela.itensMarcados().map(i => i.nome)).toEqual(['Ana', 'Carla']);
  });

  it('filtro Responsáveis mostra só quem tem o papel', async () => {
    const fixture = await montar();
    const tela = fixture.componentInstance;
    tela.tipo = 'RESPONSAVEL';
    fixture.detectChanges();
    expect(tela.pessoasVisiveis.length).toBe(1);
    expect(tela.pessoasVisiveis[0].nomeCompleto).toBe('Dirce');
  });

  it('não há mais filtro Ministros', async () => {
    const fixture = await montar();
    const el = fixture.nativeElement as HTMLElement;
    const itemsComMinistros = Array.from(el.querySelectorAll('*')).filter(el => 
      el.textContent === 'Ministros' && (el.tagName === 'BUTTON' || el.tagName === 'OPTION')
    );
    expect(itemsComMinistros.length).toBe(0);
  });

  it('linha marcada ganha a classe marcada', async () => {
    const fixture = await montar();
    const el = fixture.nativeElement as HTMLElement;
    const checkbox = el.querySelector('[data-marcar="1"]') as HTMLInputElement;
    checkbox.click();
    fixture.detectChanges();

    const tr = checkbox.closest('tr');
    expect(tr?.classList.contains('marcada')).toBeTrue();
  });

  it('linha marcada fica com a cor principal bem fraca, sem barra lateral e sem forçar o texto', async () => {
    const fixture = await montar();
    const el = fixture.nativeElement as HTMLElement;
    document.body.appendChild(el);
    (el.querySelector('[data-marcar="1"]') as HTMLInputElement).click();
    fixture.detectChanges();

    const celula = el.querySelector('tr.marcada td') as HTMLElement;
    const estilo = getComputedStyle(celula);
    expect(estilo.boxShadow).toBe('none');
    expect(estilo.backgroundColor).not.toBe('rgba(0, 0, 0, 0)');
    expect(estilo.backgroundColor).not.toBe('rgb(255, 255, 255)');
    expect(estilo.color).not.toBe('rgb(0, 0, 0)');
    el.remove();
  });

  it('Inativar só aparece com PESSOA_ATIVAR_INATIVAR e chama a API', async () => {
    const semPermissao = await montar();
    await semPermissao.componentInstance.setAba('ativos');
    semPermissao.detectChanges();
    expect((semPermissao.nativeElement as HTMLElement).textContent).not.toContain('Inativar');
    TestBed.resetTestingModule();

    const fixture = await montar(['PESSOA_ATIVAR_INATIVAR']);
    const tela = fixture.componentInstance;
    await tela.setAba('ativos');
    fixture.detectChanges();
    const botao = Array.from((fixture.nativeElement as HTMLElement).querySelectorAll('button'))
      .find(b => b.textContent?.trim() === 'Inativar');
    expect(botao).toBeTruthy();
    botao!.click();
    await fixture.whenStable();
    expect(TestBed.inject(VoluntariosApiService).setAtivo).toHaveBeenCalledWith('1', false);
  });

  it('Criar comunicado exige marcados e COMUNICADO_ENVIAR, e abre o assistente com os ids marcados', async () => {
    const semPermissao = await montar();
    semPermissao.componentInstance.marcarTodos(true);
    expect(semPermissao.componentInstance.opcoesMenu.find(o => o.id === 'comunicado')!.desabilitada).toBeTrue();
    TestBed.resetTestingModule();

    const fixture = await montar(['COMUNICADO_ENVIAR']);
    const tela = fixture.componentInstance;
    expect(tela.opcoesMenu.find(o => o.id === 'comunicado')!.desabilitada).toBeTrue();
    tela.alternar('1');
    tela.alternar('3');
    expect(tela.opcoesMenu.find(o => o.id === 'comunicado')!.desabilitada).toBeFalse();
    tela.lidarComOpcao('comunicado');
    expect(tela.comunicadoAberto).toBeTrue();
    expect(tela.idsComunicado).toEqual(['1', '3']);
  });
  it('trocar de página pede só a página seguinte e limpa a seleção anterior', async () => {
    const fixture=await montar();const tela=fixture.componentInstance;
    tela.paginas=2;tela.alternar('1');
    const api=TestBed.inject(PessoasService) as jasmine.SpyObj<PessoasService>;
    api.pagina.and.resolveTo({itens:[pessoa('5','Nova','COROINHA')],pagina:1,tamanho:30,total:35,paginas:2});
    await tela.mudarPagina(1);
    expect(api.pagina.calls.mostRecent().args[1]).toBe(1);
    expect(tela.pessoas.map(p => p.id)).toEqual(['5']);
    expect(tela.quantidadeMarcada).toBe(0);
    expect(tela.total).toBe(35);
  });
  it('mudar filtro reinicia a página e envia filtro ao servidor', async () => {
    const fixture=await montar();const tela=fixture.componentInstance;
    tela.pagina=1;tela.tipo='COROINHA';await tela.load();
    const api=TestBed.inject(PessoasService) as jasmine.SpyObj<PessoasService>;
    expect(api.pagina.calls.mostRecent().args[0].tipo).toBe('COROINHA');
    expect(api.pagina.calls.mostRecent().args[1]).toBe(0);
  });

});

function voluntarioLista(id: string, ativo: boolean): VoluntarioLista {
  return {
    id, nomeCompleto: 'Ana', nome_completo: 'Ana', tipo: 'COROINHA', ativo,
    fotoPath: null, etapaCatequese: null, eucaristiaAno: null, crismaAno: null,
    horarioEstudo: null, autorizaWhatsapp: false, funcoesHabilitadas: []
  };
}
