import { CanDeactivateFn } from '@angular/router';

export interface HasPendingChanges {
  hasPendingChanges(): boolean;
}

export const pendingChangesGuard: CanDeactivateFn<HasPendingChanges> = (component) => {
  if (!component.hasPendingChanges()) return true;
  return window.confirm('Existem alterações não salvas. Tem certeza que deseja sair desta tela?');
};
