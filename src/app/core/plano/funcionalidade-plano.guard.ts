import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { FuncionalidadesPlanoService } from './funcionalidades-plano.service';
export function funcionalidadePlanoGuard(codigo:string):CanActivateFn {
  return async () => {
    const api=inject(FuncionalidadesPlanoService);const router=inject(Router);
    try {if((await firstValueFrom(api.consultar())).includes(codigo)) return true;} catch { }
    return router.createUrlTree(['/funcionalidade-indisponivel']);
  };
}
