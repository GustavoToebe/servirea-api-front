import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { Pessoa, PessoaRequest } from '../models/pessoa.model';
import { PessoasService } from './pessoas.service';

const pessoa: Pessoa = {
  id: 'p-1',
  papeis: ['VOLUNTARIO'],
  nomeCompleto: 'Ana Souza',
  dataNascimento: '2012-05-10',
  sexo: 'F',
  cpf: null,
  rg: null,
  emails: [],
  telefones: [],
  responsaveis: [],
  dependentes: [],
  cep: null,
  cidade: null,
  uf: null,
  logradouro: null,
  numero: null,
  complemento: null,
  bairro: null,
  observacoes: null,
  voluntario: {
    tipo: 'COROINHA',
    ativo: true,
    autorizaWhatsapp: true,
    funcoesHabilitadas: ['VELA']
  }
};

const request: PessoaRequest = {
  papeis: ['VOLUNTARIO'],
  nomeCompleto: 'Ana Souza',
  dataNascimento: '2012-05-10',
  sexo: 'F',
  cpf: null,
  rg: null,
  emails: [],
  telefones: [],
  responsaveis: [],
  dependentes: [],
  cep: null,
  cidade: null,
  uf: null,
  logradouro: null,
  numero: null,
  complemento: null,
  bairro: null,
  observacoes: null,
  voluntario: pessoa.voluntario
};

describe('PessoasService', () => {
  let service: PessoasService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(PessoasService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista com papel e nome', async () => {
    const promise = service.listar('VOLUNTARIO', '  Ana  ');
    const req = http.expectOne(r => r.url === `${environment.apiUrl}/pessoas`);
    expect(req.request.params.get('papel')).toBe('VOLUNTARIO');
    expect(req.request.params.get('nome')).toBe('Ana');
    req.flush([pessoa]);
    expect(await promise).toEqual([pessoa]);
  });

  it('cria e atualiza o cadastro', async () => {
    const criar = service.criar(request);
    const post = http.expectOne(`${environment.apiUrl}/pessoas`);
    expect(post.request.method).toBe('POST');
    post.flush(pessoa);
    expect(await criar).toEqual(pessoa);

    const atualizar = service.atualizar('p-1', request);
    const put = http.expectOne(`${environment.apiUrl}/pessoas/p-1`);
    expect(put.request.method).toBe('PUT');
    put.flush(pessoa);
    expect(await atualizar).toEqual(pessoa);
  });

  it('traduz erro de busca', async () => {
    const promise = service.buscar('sumiu');
    http.expectOne(`${environment.apiUrl}/pessoas/sumiu`).flush(
      { message: 'Pessoa não encontrada.' },
      { status: 404, statusText: 'Not Found' }
    );
    await expectAsync(promise).toBeRejectedWithError('Pessoa não encontrada.');
  });
});
