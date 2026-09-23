import { HttpBackend, HttpClient, HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'bo_access';
let refreshing = false;

export const backofficeAuthInterceptor: HttpInterceptorFn = (req, next) => {
  const api = environment.apiUrl;
  if (!req.url.startsWith(`${api}/admin`)) return next(req);

  const isAuth = req.url.includes('/admin/auth/');
  const token = sessionStorage.getItem(TOKEN_KEY);
  const headers = !isAuth && token ? req.headers.set('Authorization', `Bearer ${token}`) : req.headers;
  const authed = req.clone({ headers, withCredentials: true });

  return next(authed).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401 || isAuth || refreshing) return throwError(() => error);
      refreshing = true;
      const raw = new HttpClient(inject(HttpBackend));
      const router = inject(Router);
      return raw.post<{ accessToken: string }>(`${api}/admin/auth/refresh`, {}, { withCredentials: true }).pipe(
        switchMap(response => {
          refreshing = false;
          sessionStorage.setItem(TOKEN_KEY, response.accessToken);
          const retry = req.clone({
            withCredentials: true,
            setHeaders: { Authorization: `Bearer ${response.accessToken}` }
          });
          return next(retry);
        }),
        catchError(refreshError => {
          refreshing = false;
          sessionStorage.removeItem(TOKEN_KEY);
          void router.navigate(['/admin/login']);
          return throwError(() => refreshError);
        })
      );
    })
  );
};
