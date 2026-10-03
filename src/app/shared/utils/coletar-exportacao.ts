interface PaginaExportacao<T> { itens: T[]; total: number; pagina: number; tamanho: number; }
export async function coletarExportacao<T extends { id: string }>(buscar: (pagina: number) => Promise<PaginaExportacao<T>>, ativo: () => boolean = () => true): Promise<T[]> {
  const itens: T[] = [], ids = new Set<string>(); let total: number | undefined, paginas = 1;
  for (let pagina = 0; pagina < paginas; pagina++) {
    if (!ativo()) throw new Error('Exportação interrompida.');
    const resposta = await buscar(pagina);
    if (resposta.total > 5000) throw new Error('A exportação aceita até 5.000 registros. Reduza os filtros.');
    if (total !== undefined && total !== resposta.total) throw new Error('A lista mudou durante a exportação. Atualize e tente novamente.');
    total = resposta.total;
    if (resposta.tamanho < 1 || resposta.pagina !== pagina) throw new Error('Não foi possível conferir a paginação da exportação.');
    paginas = Math.ceil(total / resposta.tamanho);
    for (const item of resposta.itens) {
      if (ids.has(item.id)) throw new Error('A lista mudou durante a exportação. Atualize e tente novamente.');
      ids.add(item.id); itens.push(item);
    }
  }
  if (itens.length !== total) throw new Error('A lista mudou durante a exportação. Atualize e tente novamente.');
  return itens;
}
