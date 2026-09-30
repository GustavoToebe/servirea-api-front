import { HttpRequest } from '@angular/common/http';
import { cabecalhoXsrf, comXsrf } from './xsrf';

describe('xsrf', () => {
  const originalCookie = Object.getOwnPropertyDescriptor(Document.prototype, 'cookie');

  afterEach(() => {
    if (originalCookie) {
      Object.defineProperty(document, 'cookie', originalCookie);
    }
  });

  function cookieComo(valor: string) {
    Object.defineProperty(document, 'cookie', { configurable: true, get: () => valor });
  }

  it('lê XSRF-TOKEN do cookie e devolve o header', () => {
    cookieComo('outro=1; XSRF-TOKEN=abc%2F123');
    expect(cabecalhoXsrf()).toEqual({ 'X-XSRF-TOKEN': 'abc/123' });
  });

  it('devolve objeto vazio sem cookie CSRF', () => {
    cookieComo('session=xyz');
    expect(cabecalhoXsrf()).toEqual({});
  });

  it('não altera GET', () => {
    cookieComo('XSRF-TOKEN=tok');
    const req = new HttpRequest('GET', 'http://localhost:8080/pessoas');
    expect(comXsrf(req)).toBe(req);
  });

  it('acrescenta o header em POST quando o cookie existe', () => {
    cookieComo('XSRF-TOKEN=tok');
    const req = new HttpRequest('POST', 'http://localhost:8080/auth/logout', {});
    const comHeader = comXsrf(req);
    expect(comHeader.headers.get('X-XSRF-TOKEN')).toBe('tok');
  });

  it('mantém o POST intacto sem cookie', () => {
    cookieComo('');
    const req = new HttpRequest('POST', 'http://localhost:8080/auth/logout', {});
    expect(comXsrf(req)).toBe(req);
  });
});
