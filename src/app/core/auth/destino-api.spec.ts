import { caminhoDaApi } from './destino-api';

describe('destino da API', () => {
  const api = 'https://app.exemplo.test/api';

  it('aceita apenas a mesma origem com fronteira de caminho', () => {
    expect(caminhoDaApi(`${api}/pessoas?pagina=2`, api)).toBe('/pessoas');
    expect(caminhoDaApi(api, api)).toBe('/');
    expect(caminhoDaApi(`${api}/pessoas`, `${api}/`)).toBe('/pessoas');
  });
  it('recusa host parecido, protocolo, porta e caminho adjacente', () => {
    expect(caminhoDaApi('https://app.exemplo.test.evil.test/api/pessoas', api)).toBeNull();
    expect(caminhoDaApi('http://app.exemplo.test/api/pessoas', api)).toBeNull();
    expect(caminhoDaApi('https://app.exemplo.test:8443/api/pessoas', api)).toBeNull();
    expect(caminhoDaApi('https://app.exemplo.test/apifalso/pessoas', api)).toBeNull();
    expect(caminhoDaApi('https://app.exemplo.test/api/../fora', api)).toBeNull();
  });
  it('recusa userinfo mesmo com a origem correta', () => {
    expect(caminhoDaApi('https://usuario:senha@app.exemplo.test/api/pessoas', api)).toBeNull();
  });
  it('suporta API na raiz e URLs relativas da mesma origem', () => {
    expect(caminhoDaApi('https://api.exemplo.test/pessoas', 'https://api.exemplo.test')).toBe('/pessoas');
    expect(caminhoDaApi('/api/pessoas', '/api')).toBe('/pessoas');
    expect(caminhoDaApi('/apifalso/pessoas', '/api')).toBeNull();
  });
});
