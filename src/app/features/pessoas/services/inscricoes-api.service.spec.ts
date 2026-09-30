import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../../environments/environment';
import { Inscricao, InscricaoPublicaRequest } from '../models/inscricao.model';
import { InscricoesApiService } from './inscricoes-api.service';

const inscricao = { id: 'i-1', nomeCompleto: 'Pedro', status: 'PENDENTE' } as Inscricao;

const publica: InscricaoPublicaRequest = {
  turnstileToken: 'tok',
  nomeCompleto: 'Pedro',
  dataNascimento: null,
  sexo: null,
  cpf: null,
  rg: null,
  tipo: 'COROINHA',
  etapaCatequese: null,
  eucaristiaAno: null,
  crismaAno: null,
  emails: [],
  telefones: [],
  responsaveis: [],
  cep: null,
  cidade: null,
  uf: null,
  rua: null,
  numero: null,
  complemento: null,
  bairro: null,
  horarioEstudo: null,
  observacoes: null,
  autorizaWhatsapp: true,
  funcoesHabilitadas: []
};

describe('InscricoesApiService', () => {
  let service: InscricoesApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(InscricoesApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('lista filtrando por status', async () => {
    const promise = service.listar('PENDENTE');
    const req = http.expectOne(r => r.url === `${environment.apiUrl}/inscricoes`);
    expect(req.request.params.get('status')).toBe('PENDENTE');
    req.flush([inscricao]);
    expect(await promise).toEqual([inscricao]);
  });

  it('aprova e rejeita com o motivo', async () => {
    const aprovar = service.aprovar('i-1');
    http.expectOne(`${environment.apiUrl}/inscricoes/i-1/aprovar`).flush({ ...inscricao, status: 'APROVADA' });
    expect((await aprovar).status).toBe('APROVADA');

    const rejeitar = service.rejeitar('i-1', 'fora da idade');
    const req = http.expectOne(`${environment.apiUrl}/inscricoes/i-1/rejeitar`);
    expect(req.request.body).toEqual({ motivo: 'fora da idade' });
    req.flush({ ...inscricao, status: 'REJEITADA' });
    expect((await rejeitar).status).toBe('REJEITADA');
  });

  it('envia inscrição pública como multipart', async () => {
    const foto = new File([new Uint8Array(4)], 'foto.jpg', { type: 'image/jpeg' });
    const promise = service.criarPublica('placeholder', publica, foto);
    const req = http.expectOne(`${environment.apiUrl}/public/placeholder/inscricoes`);
    expect(req.request.body instanceof FormData).toBeTrue();
    const body = req.request.body as FormData;
    expect(body.has('dados')).toBeTrue();
    expect(body.get('foto')).toBe(foto);
    req.flush(inscricao);
    expect(await promise).toEqual(inscricao);
  });
});
