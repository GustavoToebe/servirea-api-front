import { Injectable, signal } from '@angular/core';

const CHAVE = 'servire.favoritos';

/** Telas marcadas com estrela pelo usuário (id da tela). Guardado só neste navegador; sem armazenamento, funciona na sessão. */
@Injectable({ providedIn: 'root' })
export class FavoritosService {
  private readonly estado = signal<readonly string[]>(FavoritosService.ler());
  readonly ids = this.estado.asReadonly();

  private static ler(): string[] {
    try {
      const bruto = JSON.parse(localStorage.getItem(CHAVE) ?? '[]');
      return Array.isArray(bruto) ? bruto.filter((x): x is string => typeof x === 'string').slice(0, 30) : [];
    } catch { return []; }
  }

  eFavorito(id: string): boolean { return this.estado().includes(id); }

  alternar(id: string): void {
    const atual = this.estado();
    const novo = atual.includes(id) ? atual.filter(x => x !== id) : [...atual, id].slice(-30);
    this.estado.set(novo);
    try { localStorage.setItem(CHAVE, JSON.stringify(novo)); } catch { /* sem armazenamento: vale só nesta sessão */ }
  }
}
