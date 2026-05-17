import { Injectable } from '@angular/core';

export interface AuthData {
  accessToken: string; refreshToken: string; role: string;
  email: string; fullName: string; userId: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  /** Use Angular proxy – all /api/* requests are forwarded to https://13.51.195.1.nip.io/api/ via Nginx in prod */
  readonly GATEWAY_URL = 'https://13.51.195.1.nip.io';
  readonly AUTH_URL    = 'https://13.51.195.1.nip.io';
  /** Direct auth-service URL for OAuth2 flow (proxied via Nginx) */
  readonly OAUTH2_DIRECT_URL = 'https://13.51.195.1.nip.io';

  getToken():    string | null { return localStorage.getItem('accessToken'); }
  getRole():     string | null { return localStorage.getItem('role'); }
  getEmail():    string | null { return localStorage.getItem('email'); }
  getUserName(): string | null { return localStorage.getItem('fullName'); }
  getUserId():   string | null { return localStorage.getItem('userId'); }
  isLoggedIn():  boolean       { return !!this.getToken(); }

  saveAuth(data: AuthData): void {
    localStorage.setItem('accessToken',  data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('role',         data.role);
    localStorage.setItem('email',        data.email);
    localStorage.setItem('fullName',     data.fullName);
    localStorage.setItem('userId',       data.userId);
  }

  clearAuth(): void {
    ['accessToken','refreshToken','role','email','fullName','userId']
      .forEach(k => localStorage.removeItem(k));
  }
}
