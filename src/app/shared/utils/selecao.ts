export class Selecao {
  private selecionados = new Set<string>();

  alternar(id: string): void {
    if (this.selecionados.has(id)) {
      this.selecionados.delete(id);
    } else {
      this.selecionados.add(id);
    }
  }

  marcado(id: string): boolean {
    return this.selecionados.has(id);
  }

  marcarTodos(ids: string[], marcar: boolean): void {
    if (marcar) {
      ids.forEach(id => this.selecionados.add(id));
    } else {
      ids.forEach(id => this.selecionados.delete(id));
    }
  }

  quantidade(ids: string[]): number {
    return ids.filter(id => this.selecionados.has(id)).length;
  }

  todos(ids: string[]): boolean {
    return ids.length > 0 && ids.every(id => this.selecionados.has(id));
  }

  alguns(ids: string[]): boolean {
    const qtd = this.quantidade(ids);
    return qtd > 0 && qtd < ids.length;
  }

  limpar(): void {
    this.selecionados.clear();
  }

  marcadosEm<T>(itens: T[], idFn: (t: T) => string): T[] {
    return itens.filter(item => this.selecionados.has(idFn(item)));
  }
}
