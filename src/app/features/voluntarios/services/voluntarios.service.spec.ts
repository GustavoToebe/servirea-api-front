import { TestBed } from '@angular/core/testing';
import { VoluntariosApiService } from '../../pessoas/services/voluntarios-api.service';
import { VoluntarioLista } from '../../pessoas/models/pessoa.model';
import { VoluntariosService } from './voluntarios.service';

const ana: VoluntarioLista = {
  id: 'v-1',
  nomeCompleto: 'Ana Souza',
  nome_completo: 'Ana Souza',
  tipo: 'COROINHA',
  ativo: true,
  fotoPath: null,
  etapaCatequese: null,
  eucaristiaAno: null,
  crismaAno: null,
  horarioEstudo: 'TARDE',
  autorizaWhatsapp: true,
  funcoesHabilitadas: ['VELA', 'SINO']
};

describe('VoluntariosService', () => {
  let service: VoluntariosService;
  let api: jasmine.SpyObj<VoluntariosApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj('VoluntariosApiService', ['listar', 'contar']);
    TestBed.configureTestingModule({
      providers: [{ provide: VoluntariosApiService, useValue: api }]
    });
    service = TestBed.inject(VoluntariosService);
  });

  it('mapeia o cadastro antigo da escala e filtra por função', async () => {
    api.listar.and.resolveTo([ana, { ...ana, id: 'v-2', funcoesHabilitadas: ['MISSAL'] }]);
    const lista = await service.list({ status: 'ATIVO', funcao: 'VELA' });
    expect(api.listar).toHaveBeenCalledWith({ ativo: true, tipo: undefined, nome: undefined });
    expect(lista.map(v => v.id)).toEqual(['v-1']);
    expect(lista[0].nome_completo).toBe('Ana Souza');
    expect(lista[0].funcoes_habilitadas).toEqual(['VELA', 'SINO']);
  });

  it('active pede só os ativos', async () => {
    api.listar.and.resolveTo([ana]);
    await service.active();
    expect(api.listar).toHaveBeenCalledWith({ ativo: true, tipo: undefined, nome: undefined });
  });
});
