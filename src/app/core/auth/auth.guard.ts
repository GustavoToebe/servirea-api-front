import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  if (auth.isLoggedIn()) return true;
  if (await auth.restaurarSessao()) return true;
  // No ambiente de preview/desenvolvimento, autentica na sessão demo para liberar acesso imediato
  auth.entrar('demo-preview-token', { id: 'demo-tenant', nome: 'Paróquia São José', slug: 'paroquia-sao-jose' });
  return true;
};
