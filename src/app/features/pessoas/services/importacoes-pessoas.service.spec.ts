import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ImportacoesPessoasService } from './importacoes-pessoas.service';
import { CacheDeListas } from '../../../core/api/cache-de-listas.service';
import { environment } from '../../../../environments/environment';
describe('Importações CSV de pessoas: contrato', () => {
  let http:HttpTestingController;let api:ImportacoesPessoasService;let cache:CacheDeListas;
  const arquivo=new File(['nome;papel;cpf;email;telefone\nAna;RESPONSAVEL;;;'],'pessoas.csv',{type:'text/csv'});
  beforeEach(() => {TestBed.configureTestingModule({providers:[provideHttpClient(),provideHttpClientTesting()]});http=TestBed.inject(HttpTestingController);api=TestBed.inject(ImportacoesPessoasService);cache=TestBed.inject(CacheDeListas);});
  afterEach(() => http.verify());
  it('envia o arquivo na prévia sem cadastrar nem invalidar cache', () => {
    spyOn(cache,'invalidarPrefixo');api.previa(arquivo).subscribe();
    const req=http.expectOne(`${environment.apiUrl}/pessoas/importacoes/previa`);
    expect(req.request.method).toBe('POST');expect((req.request.body as FormData).get('arquivo')).toEqual(arquivo);
    req.flush({hash:'abc',quantidade:1,podeConfirmar:true,linhas:[]});expect(cache.invalidarPrefixo).not.toHaveBeenCalled();
  });
  it('confirma com chave e hash e invalida seletores somente no sucesso', () => {
    spyOn(cache,'invalidarPrefixo');api.confirmar(arquivo,'chave','hash').subscribe();
    const req=http.expectOne(r => r.url===`${environment.apiUrl}/pessoas/importacoes/confirmar`);
    expect(req.request.params.get('chave')).toBe('chave');expect(req.request.params.get('hash')).toBe('hash');
    req.flush({id:'id',quantidade:1,repetida:false});expect(cache.invalidarPrefixo).toHaveBeenCalledWith('pessoas');expect(cache.invalidarPrefixo).toHaveBeenCalledWith('voluntarios');
  });
});
