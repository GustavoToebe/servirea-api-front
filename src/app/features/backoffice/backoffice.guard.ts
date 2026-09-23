import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { BackofficeAuthService } from './backoffice-auth.service';

export const backofficeGuard: CanActivateFn = () => {
  const auth = inject(BackofficeAuthService);
  const router = inject(Router);
  if (auth.isLoggedIn()) return true;
  return router.createUrlTree(['/admin/login']);
};
