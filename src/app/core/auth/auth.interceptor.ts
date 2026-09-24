import { HttpBackend, HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AccessTokenResponse } from './auth.models';

const TOKEN_KEY = 'sv_access';
const TENANT_KEY = 'sv_tenant';
let refreshing = false;

function cabecalhoXsrf(): Record<string, string> {
  const cookie = document.cookie.split('; ').find(parte => parte.startsWith('XSRF-TOKEN='));
  if (!cookie) return {};
  return { 'X-XSRF-TOKEN': decodeURIComponent(cookie.slice('XSRF-TOKEN='.length)) };
}

export const parishAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const api = environment.apiUrl;
  if (!req.url.startsWith(api) || req.url.startsWith(`${api}/admin`)) {
    return next(req);
  }

  const publica = req.url.includes('/auth/login')
    || req.url.includes('/auth/select-tenant')
    || req.url.includes('/auth/forgot-password')
    || req.url.includes('/auth/reset-password')
    || req.url.includes('/public/');
  const token = sessionStorage.getItem(TOKEN_KEY);
  const headers = !publica && token ? req.headers.set('Authorization', `Bearer ${token}`) : req.headers;
  const authed = req.clone({ headers, withCredentials: true });

  return next(authed).pipe(
    catchError((error: HttpErrorResponse) => {
      const ehRefresh = req.url.includes('/auth/refresh') || req.url.includes('/auth/logout');
      if (error.status !== 401 || publica || ehRefresh || refreshing) {
        return throwError(() => error);
      }
      const tenantId = sessionStorage.getItem(TENANT_KEY);
      if (!tenantId) {
        return throwError(() => error);
      }
      refreshing = true;
      const raw = new HttpClient(inject(HttpBackend));
      const router = inject(Router);
      return raw.post<AccessTokenResponse>(`${api}/auth/refresh`, { tenantId }, {
        withCredentials: true,
        headers: cabecalhoXsrf()
      }).pipe(
        switchMap(resposta => {
          refreshing = false;
          sessionStorage.setItem(TOKEN_KEY, resposta.accessToken);
          sessionStorage.setItem(TENANT_KEY, resposta.tenantAtual.id);
          return next(req.clone({
            withCredentials: true,
            setHeaders: { Authorization: `Bearer ${resposta.accessToken}` }
          }));
        }),
        catchError(refreshError => {
          refreshing = false;
          sessionStorage.removeItem(TOKEN_KEY);
          sessionStorage.removeItem(TENANT_KEY);
          void router.navigate(['/login']);
          return throwError(() => refreshError);
        })
      );
    })
  );
};
