import { HttpErrorResponse } from '@angular/common/http';

export function mensagemApi(erro: unknown, fallback: string): string {
  if (erro instanceof HttpErrorResponse) {
    const corpo = erro.error as { message?: string } | null;
    if (corpo?.message) {
      return corpo.message;
    }
    if (erro.status === 0) {
      return 'Não foi possível falar com a API. Confira se ela está no ar.';
    }
  }
  if (erro instanceof Error && erro.message) {
    return erro.message;
  }
  return fallback;
}
