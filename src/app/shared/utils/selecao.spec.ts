import { Selecao } from './selecao';

describe('Selecao', () => {
  let selecao: Selecao;

  beforeEach(() => {
    selecao = new Selecao();
  });

  it('deve marcar todos, desmarcar um e ter "alguns" true e "todos" false', () => {
    const ids = ['1', '2', '3'];
    selecao.marcarTodos(ids, true);
    expect(selecao.todos(ids)).toBeTrue();
    expect(selecao.alguns(ids)).toBeFalse();
    expect(selecao.quantidade(ids)).toBe(3);

    selecao.alternar('2');
    expect(selecao.marcado('2')).toBeFalse();
    expect(selecao.todos(ids)).toBeFalse();
    expect(selecao.alguns(ids)).toBeTrue();
    expect(selecao.quantidade(ids)).toBe(2);
  });

  it('deve retornar false para todos([])', () => {
    expect(selecao.todos([])).toBeFalse();
  });

  it('id marcado fora da lista visível não conta em quantidade', () => {
    selecao.alternar('1');
    selecao.alternar('99');
    const visiveis = ['1', '2', '3'];
    expect(selecao.quantidade(visiveis)).toBe(1);
    expect(selecao.marcado('99')).toBeTrue();
  });

  it('marcadosEm mantém a ordem original', () => {
    const itens = [{ id: '1', nome: 'A' }, { id: '2', nome: 'B' }, { id: '3', nome: 'C' }];
    selecao.alternar('3');
    selecao.alternar('1');
    const marcados = selecao.marcadosEm(itens, i => i.id);
    expect(marcados.length).toBe(2);
    expect(marcados[0].id).toBe('1');
    expect(marcados[1].id).toBe('3');
  });

  it('limpar desmarca tudo', () => {
    selecao.alternar('1');
    selecao.limpar();
    expect(selecao.marcado('1')).toBeFalse();
  });
});
