import { ApplicationConfig } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withInterceptors, withNoXsrfProtection } from '@angular/common/http';
import { routes } from './app.routes';
import { parishAuthInterceptor } from './core/auth/auth.interceptor';
import { backofficeAuthInterceptor } from './features/backoffice/backoffice-auth.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(
      withInterceptors([parishAuthInterceptor, backofficeAuthInterceptor]),
      // O XSRF nativo do Angular ignora URL absoluta (a API é outra origem);
      // quem manda X-XSRF-TOKEN são os interceptors acima (core/auth/xsrf.ts).
      withNoXsrfProtection()
    )
  ]
};
