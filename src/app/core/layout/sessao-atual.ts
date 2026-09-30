import { computed, inject, Injectable, signal } from '@angular/core';
import { MeuPerfil } from '../../features/acesso/acesso.models';
import { AcessoApiService } from '../../features/acesso/acesso-api.service';

/** Cópia do GET /me usada pelo menu. Sem permissão, o item some; o back continua no 403. */
@Injectable({ providedIn: 'root' })
export class SessaoAtual {
  private readonly acesso = inject(AcessoApiService);
  private readonly estado = signal<MeuPerfil | null>(null);

  readonly eu = this.estado.asReadonly();
  readonly permissoes = computed(() => this.estado()?.permissoes ?? []);

  carregar(): void {
    this.acesso.eu().subscribe({
      next: eu => this.estado.set(eu),
      error: () => this.estado.set(null)
    });
  }
}
