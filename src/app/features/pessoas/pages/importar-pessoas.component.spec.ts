import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ImportarPessoasComponent } from './importar-pessoas.component';
import { ImportacoesPessoasService } from '../services/importacoes-pessoas.service';
import { SessaoAtual } from '../../../core/layout/sessao-atual';
describe('Importação CSV: prévia e confirmação', () => {
  let api:jasmine.SpyObj<ImportacoesPessoasService>;
  const arquivo=new File(['csv'],'pessoas.csv');
  const previa={hash:'hash',quantidade:1,podeConfirmar:true,linhas:[{linha:2,nome:'Ana',erro:null}]};
  const evento={target:{files:[arquivo]}} as unknown as Event;
  beforeEach(() => {
    api=jasmine.createSpyObj('ImportacoesPessoasService',['previa','confirmar']);api.previa.and.returnValue(of(previa));
    TestBed.configureTestingModule({imports:[ImportarPessoasComponent],providers:[provideRouter([]),{provide:ImportacoesPessoasService,useValue:api},{provide:SessaoAtual,useValue:{permissoes:() => ['PESSOA','PESSOA_CRIAR']}}]});
  });
  it('gera prévia, conserva chave após falha e limpa dados após confirmação', () => {
    const f=TestBed.createComponent(ImportarPessoasComponent);const c=f.componentInstance;c.selecionar(evento);c.conferir();f.detectChanges();
    expect(f.nativeElement.textContent).toContain('Ana');expect(c.hasPendingChanges()).toBeTrue();
    api.confirmar.and.returnValue(throwError(() => new Error('rede')));c.confirmar();const chave=api.confirmar.calls.mostRecent().args[1];
    api.confirmar.and.returnValue(of({id:'id',quantidade:1,repetida:true}));c.confirmar();
    expect(api.confirmar.calls.mostRecent().args).toEqual([arquivo,chave,'hash']);expect(c.hasPendingChanges()).toBeFalse();
    expect(c.arquivo).toBeNull();expect(c.previa()).toBeNull();c.confirmar();expect(api.confirmar).toHaveBeenCalledTimes(2);
  });
  it('erros da prévia bloqueiam confirmação e trocar arquivo apaga a prévia anterior', () => {
    api.previa.and.returnValue(of({...previa,podeConfirmar:false,linhas:[{linha:2,nome:'Ana',erro:'Duplicidade'}]}));
    const c=TestBed.createComponent(ImportarPessoasComponent).componentInstance;c.selecionar(evento);c.conferir();c.confirmar();
    expect(api.confirmar).not.toHaveBeenCalled();c.selecionar(evento);expect(c.previa()).toBeNull();
  });
  it('permissão somente de leitura não envia arquivo', () => {
    TestBed.overrideProvider(SessaoAtual,{useValue:{permissoes:() => ['PESSOA']}});
    const f=TestBed.createComponent(ImportarPessoasComponent);const c=f.componentInstance;c.selecionar(evento);c.conferir();c.confirmar();f.detectChanges();
    expect(api.previa).not.toHaveBeenCalled();expect(api.confirmar).not.toHaveBeenCalled();expect(f.nativeElement.querySelector('input[type=file]')).toBeNull();
  });
});
