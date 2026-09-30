import { inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
import { DialogoService } from '../../shared/services/dialogo.service';

export interface HasPendingChanges {
  hasPendingChanges(): boolean;
}

/** Sair com alteração pendente pergunta no diálogo do Servirea (antes era o `confirm` do navegador). */
export const pendingChangesGuard: CanDeactivateFn<HasPendingChanges> = (component) => {
  if (!component.hasPendingChanges()) return true;
  return inject(DialogoService).confirmar({
    titulo: 'Sair sem salvar?',
    mensagem: 'As alterações desta tela ainda não foram salvas. Se sair agora, elas serão perdidas.',
    confirmar: 'Sair sem salvar',
    cancelar: 'Continuar editando',
    perigo: true
  });
};
