import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Observable, of, throwError } from 'rxjs';
import { ImportarPessoasComponent } from './importar-pessoas.component';
import { ImportacoesPessoasService } from '../services/importacoes-pessoas.service';
import { SessaoAtual } from '../../../core/layout/sessao-atual';
describe('Importação CSV: prévia e confirmação', () => {
  let api:jasmine.SpyObj<ImportacoesPessoasService>;
  const arquivo=new File(['csv'],'pessoas.csv');
  const previa={hash:'hash',quantidade:1,podeConfirmar:true,linhas:[{linha:2,nome:'Ana',erro:null}]};
  const estrutura={abas:[{indice:0,nome:'CSV'},{indice:1,nome:'Pessoas'}],aba:0,linhaCabecalho:1,colunas:['nome','papel','cpf','email','telefone'].map((titulo,indice) => ({titulo,indice})),sugestao:{nome:0,papel:1,cpf:2,email:3,telefone:4}};
  const opcoes={aba:0,nome:0,papel:1,cpf:2,email:3,telefone:4};
  const evento={target:{files:[arquivo]}} as unknown as Event;
  beforeEach(() => {
    api=jasmine.createSpyObj('ImportacoesPessoasService',['estrutura','previa','confirmar']);api.estrutura.and.returnValue(of(estrutura));api.previa.and.returnValue(of(previa));
    TestBed.configureTestingModule({imports:[ImportarPessoasComponent],providers:[provideRouter([]),{provide:ImportacoesPessoasService,useValue:api},{provide:SessaoAtual,useValue:{permissoes:() => ['PESSOA','PESSOA_CRIAR']}}]});
  });
  it('gera prévia, conserva chave após falha e limpa dados após confirmação', () => {
    const f=TestBed.createComponent(ImportarPessoasComponent);const c=f.componentInstance;c.selecionar(evento);c.analisar();c.conferir();f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Ana');expect(c.hasPendingChanges()).toBeTrue();
    api.confirmar.and.returnValue(throwError(() => new Error('rede')));c.confirmar();const chave=api.confirmar.calls.mostRecent().args[1];
    api.confirmar.and.returnValue(of({id:'id',quantidade:1,repetida:true}));c.confirmar();
    expect(api.confirmar.calls.mostRecent().args).toEqual([arquivo,chave,'hash',opcoes]);expect(c.hasPendingChanges()).toBeFalse();
    expect(c.arquivo).toBeNull();expect(c.previa()).toBeNull();c.confirmar();expect(api.confirmar).toHaveBeenCalledTimes(2);
  });
  it('erros da prévia bloqueiam confirmação e trocar arquivo apaga a prévia anterior', () => {
    api.previa.and.returnValue(of({...previa,podeConfirmar:false,linhas:[{linha:2,nome:'Ana',erro:'Duplicidade'}]}));
    const c=TestBed.createComponent(ImportarPessoasComponent).componentInstance;c.selecionar(evento);c.analisar();c.conferir();c.confirmar();
    expect(api.confirmar).not.toHaveBeenCalled();c.selecionar(evento);expect(c.previa()).toBeNull();
  });
  it('permissão somente de leitura não envia arquivo', () => {
    TestBed.overrideProvider(SessaoAtual,{useValue:{permissoes:() => ['PESSOA']}});
    const f=TestBed.createComponent(ImportarPessoasComponent);const c=f.componentInstance;c.selecionar(evento);c.analisar();c.conferir();c.confirmar();f.detectChanges();
    expect(api.estrutura).not.toHaveBeenCalled();expect(api.previa).not.toHaveBeenCalled();expect(api.confirmar).not.toHaveBeenCalled();expect(f.nativeElement.querySelector('input[type=file]')).toBeNull();
  });
  it('aceita XLSX, exige mapeamento único e apaga prévia ao trocar coluna ou aba', () => {
    const c=TestBed.createComponent(ImportarPessoasComponent).componentInstance;
    const xlsx=new File(['xlsx'],'pessoas.xlsx');c.selecionar({target:{files:[xlsx]}} as unknown as Event);c.analisar();c.conferir();
    expect(api.previa.calls.mostRecent().args).toEqual([xlsx,opcoes]);expect(c.previa()).not.toBeNull();
    c.mapear('nome','1');expect(c.previa()).toBeNull();expect(c.mapeamentoValido()).toBeFalse();c.conferir();expect(api.previa).toHaveBeenCalledTimes(1);
    c.mapear('nome','0');c.conferir();c.trocarAba(1);expect(c.previa()).toBeNull();expect(api.estrutura.calls.mostRecent().args).toEqual([xlsx,1]);
  });
  it('recusa extensões/tamanho e permite escolher aba após uma aba vazia', () => {
    const c=TestBed.createComponent(ImportarPessoasComponent).componentInstance;
    c.selecionar({target:{files:[new File(['x'],'pessoas.xlsm')]}} as unknown as Event);expect(c.arquivo).toBeNull();expect(c.erro()).toContain('XLSX');
    c.selecionar({target:{files:[new File([new Uint8Array(524289)],'pessoas.xlsx')]}} as unknown as Event);expect(c.arquivo).toBeNull();
    api.estrutura.and.returnValue(of({...estrutura,colunas:[],linhaCabecalho:0,sugestao:{nome:-1,papel:-1,cpf:-1,email:-1,telefone:-1}}));
    c.selecionar(evento);c.analisar();expect(c.mapeamentoValido()).toBeFalse();expect(c.estrutura()?.abas.length).toBe(2);
  });
  it('uma consulta pendente é cancelada ao destruir a tela', () => {
    let cancelada=false;
    api.estrutura.and.returnValue(new Observable(() => () => {cancelada=true;}));
    const f=TestBed.createComponent(ImportarPessoasComponent);f.componentInstance.selecionar(evento);f.componentInstance.analisar();f.destroy();expect(cancelada).toBeTrue();
  });
  it('limpa também o arquivo retido no controle nativo após sucesso', () => {
    const f=TestBed.createComponent(ImportarPessoasComponent);f.detectChanges();const c=f.componentInstance;
    const input=f.nativeElement.querySelector('input[type=file]') as HTMLInputElement;const transferencia=new DataTransfer();transferencia.items.add(arquivo);input.files=transferencia.files;
    c.selecionar({target:input} as unknown as Event);c.analisar();c.conferir();api.confirmar.and.returnValue(of({id:'id',quantidade:1,repetida:false}));c.confirmar();
    expect(input.files?.length).toBe(0);expect(input.value).toBe('');expect(c.arquivo).toBeNull();
  });
});
