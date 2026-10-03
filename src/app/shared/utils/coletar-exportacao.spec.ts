import { coletarExportacao } from './coletar-exportacao';
describe('exportação de todos os resultados filtrados', () => {
  it('inclui as páginas seguintes e começa na primeira', async () => {
    const buscar = jasmine.createSpy().and.callFake(async (pagina: number) => ({ itens: [{ id: String(pagina) }], total: 2, pagina, tamanho: 1 }));
    expect(await coletarExportacao(buscar)).toEqual([{ id: '0' }, { id: '1' }]);
    expect(buscar.calls.allArgs()).toEqual([[0], [1]]);
  });
  it('recusa mudança no total, sem entregar um arquivo parcial', async () => {
    await expectAsync(coletarExportacao(async pagina => ({ itens: [{ id: String(pagina) }], total: pagina ? 3 : 2, pagina, tamanho: 1 }))).toBeRejectedWithError(/lista mudou/);
  });
  it('recusa duplicidade entre páginas mesmo quando o total não mudou', async () => {
    await expectAsync(coletarExportacao(async pagina => ({ itens: [{ id: 'igual' }], total: 2, pagina, tamanho: 1 }))).toBeRejectedWithError(/lista mudou/);
  });
  it('não percorre uma consulta acima do limite', async () => {
    const buscar = jasmine.createSpy().and.resolveTo({ itens: [], total: 5001, pagina: 0, tamanho: 30 });
    await expectAsync(coletarExportacao(buscar)).toBeRejectedWithError(/5.000/);
    expect(buscar.calls.count()).toBe(1);
  });
});
