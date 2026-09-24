import { HttpBackend, HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, shareReplay, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AccessTokenResponse } from './auth.models';
import { cabecalhoXsrf, comXsrf } from './xsrf';

const TOKEN_KEY = 'sv_access';
const TENANT_KEY = 'sv_tenant';
const EMAIL_KEY = 'sv_email';

/**
 * Refresh em andamento, compartilhado: vários 401 ao mesmo tempo (dashboard
 * abre várias requisições) esperam o mesmo POST /auth/refresh em vez de só
 * o primeiro tentar e os outros falharem.
 */
let refreshEmAndamento: Observable<string> | null = null;

const ROTAS_PUBLICAS = ['/auth/login', '/auth/select-tenant', '/auth/forgot-password', '/auth/reset-password', '/public/'];

export const parishAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const api = environment.apiUrl;
  if (!req.url.startsWith(api) || req.url.startsWith(`${api}/admin`)) {
    return next(req);
  }

  // inject() só funciona aqui, na parte síncrona do interceptor — dentro do
  // catchError (assíncrono) lança NG0203 e o refresh nunca acontecia.
  const backend = inject(HttpBackend);
  const router = inject(Router);

  const publica = ROTAS_PUBLICAS.some(rota => req.url.includes(rota));
  const token = sessionStorage.getItem(TOKEN_KEY);
  let authed = comXsrf(req.clone({ withCredentials: true }));
  if (!publica && token) {
    authed = authed.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(authed).pipe(
    catchError((error: HttpErrorResponse) => {
      const ehRotaDoCookie = req.url.includes('/auth/refresh') || req.url.includes('/auth/logout');
      if (error.status !== 401 || publica || ehRotaDoCookie) {
        return throwError(() => error);
      }
      const tenantId = sessionStorage.getItem(TENANT_KEY);
      if (!tenantId) {
        encerrarSessao(router);
        return throwError(() => error);
      }
      return renovar(backend, api, tenantId).pipe(
        catchError(refreshError => {
          encerrarSessao(router);
          return throwError(() => refreshError);
        }),
        switchMap(novoToken => next(comXsrf(req.clone({
          withCredentials: true,
          setHeaders: { Authorization: `Bearer ${novoToken}` }
        }))))
      );
    })
  );
};

function renovar(backend: HttpBackend, api: string, tenantId: string): Observable<string> {
  if (!refreshEmAndamento) {
    refreshEmAndamento = new HttpClient(backend).post<AccessTokenResponse>(`${api}/auth/refresh`, { tenantId }, {
      withCredentials: true,
      headers: cabecalhoXsrf()
    }).pipe(
      map(resposta => {
        sessionStorage.setItem(TOKEN_KEY, resposta.accessToken);
        sessionStorage.setItem(TENANT_KEY, resposta.tenantAtual.id);
        return resposta.accessToken;
      }),
      finalize(() => { refreshEmAndamento = null; }),
      shareReplay({ bufferSize: 1, refCount: false })
    );
  }
  return refreshEmAndamento;
}

function encerrarSessao(router: Router): void {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TENANT_KEY);
  sessionStorage.removeItem(EMAIL_KEY);
  void router.navigate(['/login']);
}
