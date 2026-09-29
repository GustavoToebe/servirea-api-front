import { Injectable } from '@angular/core';

/**
 * Listas já vistas nesta aba, por paróquia. Trocar de paróquia ou sair
 * não mostra o dado da anterior: a chave carrega o tenant e o logout limpa tudo.
 */
@Injectable({ providedIn: 'root' })
export class CacheDeListas {
  private itens = new Map<string, { tenant: string | null; valor: unknown }>();

  ler<T>(chave: string, tenant: string | null): T | null {
    const item = this.itens.get(chave);
    if (!item || item.tenant !== tenant) return null;
    return item.valor as T;
  }

  gravar(chave: string, tenant: string | null, valor: unknown): void {
    this.itens.set(chave, { tenant, valor });
  }

  invalidarPrefixo(prefixo: string): void {
    for (const chave of [...this.itens.keys()]) {
      if (chave.startsWith(prefixo)) this.itens.delete(chave);
    }
  }

  limpar(): void {
    this.itens.clear();
  }
}
