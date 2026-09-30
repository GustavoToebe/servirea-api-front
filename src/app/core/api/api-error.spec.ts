import { HttpErrorResponse } from '@angular/common/http';
import { mensagemApi } from './api-error';

describe('mensagemApi', () => {
  it('usa a message do corpo HTTP quando existir', () => {
    const erro = new HttpErrorResponse({
      status: 400,
      error: { message: 'E-mail ou senha inválidos.' }
    });
    expect(mensagemApi(erro, 'fallback')).toBe('E-mail ou senha inválidos.');
  });

  it('avisa que a API está fora quando o status é 0', () => {
    const erro = new HttpErrorResponse({ status: 0, error: null, url: 'http://localhost:8080/auth/login' });
    expect(mensagemApi(erro, 'fallback')).toBe('Não foi possível falar com a API. Confira se ela está no ar.');
  });

  it('repassa a message de um Error comum', () => {
    expect(mensagemApi(new Error('já existe'), 'fallback')).toBe('já existe');
  });

  it('cai no fallback quando não há mensagem útil', () => {
    expect(mensagemApi({ status: 500 }, 'Não foi possível salvar.')).toBe('Não foi possível salvar.');
  });
});
