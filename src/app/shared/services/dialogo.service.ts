import { Injectable, signal } from '@angular/core';

export interface PedidoDeDialogo {
  titulo: string;
  mensagem: string;
  confirmar: string;
  /** null = aviso com um botão só (substitui o `alert`). */
  cancelar: string | null;
  perigo: boolean;
}

interface DialogoAberto extends PedidoDeDialogo {
  responder: (sim: boolean) => void;
}

/**
 * Confirmações e avisos no visual do Servire, no lugar do `confirm()` e do
 * `alert()` do navegador (pedido de 26/09/2026). Quem mostra é o
 * `DialogoHostComponent`, uma vez só no `AppComponent`. Um pedido novo
 * enquanto outro está aberto responde "não" ao anterior.
 */
@Injectable({ providedIn: 'root' })
export class DialogoService {
  readonly aberto = signal<DialogoAberto | null>(null);

  confirmar(opcoes: {
    mensagem: string; titulo?: string; confirmar?: string; cancelar?: string; perigo?: boolean;
  }): Promise<boolean> {
    return this.abrir({
      titulo: opcoes.titulo ?? 'Confirmar',
      mensagem: opcoes.mensagem,
      confirmar: opcoes.confirmar ?? 'Confirmar',
      cancelar: opcoes.cancelar ?? 'Cancelar',
      perigo: !!opcoes.perigo
    });
  }

  async avisar(mensagem: string, titulo = 'Atenção'): Promise<void> {
    await this.abrir({ titulo, mensagem, confirmar: 'Entendi', cancelar: null, perigo: false });
  }

  responder(sim: boolean) {
    const atual = this.aberto();
    if (!atual) return;
    this.aberto.set(null);
    atual.responder(sim);
  }

  private abrir(pedido: PedidoDeDialogo): Promise<boolean> {
    this.responder(false);
    return new Promise(resolve => this.aberto.set({ ...pedido, responder: resolve }));
  }
}
