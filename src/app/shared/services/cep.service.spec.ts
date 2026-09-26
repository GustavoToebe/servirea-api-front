import { TestBed } from '@angular/core/testing';
import { CepService } from './cep.service';

describe('CepService', () => {
  let service: CepService;

  beforeEach(() => {
    service = TestBed.inject(CepService);
  });

  it('busca no ViaCEP e traduz os campos', async () => {
    const chamada = spyOn(window, 'fetch').and.resolveTo(new Response(JSON.stringify({
      cep: '85800-000', logradouro: 'Rua Paraná', bairro: 'Centro', localidade: 'Cascavel', uf: 'PR'
    })));
    const endereco = await service.buscar('85800-000');
    expect(chamada.calls.mostRecent().args[0]).toBe('https://viacep.com.br/ws/85800000/json/');
    expect(endereco).toEqual({ logradouro: 'Rua Paraná', bairro: 'Centro', cidade: 'Cascavel', uf: 'PR' });
  });

  it('CEP inexistente, incompleto ou rede fora devolvem null', async () => {
    const chamada = spyOn(window, 'fetch').and.resolveTo(new Response(JSON.stringify({ erro: 'true' })));
    expect(await service.buscar('00000-001')).toBeNull();
    expect(await service.buscar('8580')).toBeNull();
    expect(chamada).toHaveBeenCalledTimes(1);
    chamada.and.rejectWith(new TypeError('Failed to fetch'));
    expect(await service.buscar('85800-001')).toBeNull();
  });
});
