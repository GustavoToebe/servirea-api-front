import { HttpBackend, HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, shareReplay, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { cabecalhoXsrf, comXsrf } from '../../core/auth/xsrf';

const TOKEN_KEY = 'bo_access';
const EMAIL_KEY = 'bo_email';

/** Um refresh só para vários 401 simultâneos — ver `parishAuthInterceptor`. */
let refreshEmAndamento: Observable<string> | null = null;

export const backofficeAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const api = environment.apiUrl;
  if (!req.url.startsWith(`${api}/admin`)) return next(req);

  // inject() fora do catchError: dentro dele lança NG0203.
  const backend = inject(HttpBackend);
  const router = inject(Router);

  const isAuth = req.url.includes('/admin/auth/');
  const token = sessionStorage.getItem(TOKEN_KEY);
  let authed = comXsrf(req.clone({ withCredentials: true }));
  if (!isAuth && token) {
    authed = authed.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }

  return next(authed).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || isAuth) return throwError(() => error);
      return renovar(backend, api).pipe(
        catchError(refreshError => {
          sessionStorage.removeItem(TOKEN_KEY);
          sessionStorage.removeItem(EMAIL_KEY);
          void router.navigate(['/admin/login']);
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

function renovar(backend: HttpBackend, api: string): Observable<string> {
  if (!refreshEmAndamento) {
    refreshEmAndamento = new HttpClient(backend).post<{ accessToken: string }>(`${api}/admin/auth/refresh`, {}, {
      withCredentials: true,
      headers: cabecalhoXsrf()
    }).pipe(
      map(resposta => {
        sessionStorage.setItem(TOKEN_KEY, resposta.accessToken);
        return resposta.accessToken;
      }),
      finalize(() => { refreshEmAndamento = null; }),
      shareReplay({ bufferSize: 1, refCount: false })
    );
  }
  return refreshEmAndamento;
}
