import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

const TOKEN_KEY = 'bo_access';
const EMAIL_KEY = 'bo_email';

interface LoginResponse {
  accessToken: string;
  expiresInSeconds: number;
}

@Injectable({ providedIn: 'root' })
export class BackofficeAuthService {
  constructor(private http: HttpClient) {}

  isLoggedIn(): boolean {
    return !!sessionStorage.getItem(TOKEN_KEY);
  }

  email(): string {
    return sessionStorage.getItem(EMAIL_KEY) || '';
  }

  token(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  }

  async login(email: string, senha: string): Promise<void> {
    const response = await firstValueFrom(this.http.post<LoginResponse>(
      `${environment.apiUrl}/admin/auth/login`,
      { email, senha },
      { withCredentials: true }
    ));
    sessionStorage.setItem(TOKEN_KEY, response.accessToken);
    sessionStorage.setItem(EMAIL_KEY, email.trim());
  }

  async logout(): Promise<void> {
    try {
      await firstValueFrom(this.http.post(`${environment.apiUrl}/admin/auth/logout`, {}, { withCredentials: true }));
    } catch {
      // A sessão local sai mesmo se o servidor já tiver derrubado o cookie.
    } finally {
      sessionStorage.removeItem(TOKEN_KEY);
      sessionStorage.removeItem(EMAIL_KEY);
    }
  }
}
