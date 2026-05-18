import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface AuthData {
  accessToken: string; refreshToken: string; role: string;
  email: string; fullName: string; userId: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly GATEWAY_URL = environment.GATEWAY_URL;
  readonly AUTH_URL = environment.AUTH_URL;
  readonly OAUTH2_DIRECT_URL = environment.OAUTH2_DIRECT_URL;

  getToken(): string | null { return localStorage.getItem('accessToken'); }
  getRole(): string | null { return localStorage.getItem('role'); }
  getEmail(): string | null { return localStorage.getItem('email'); }
  getUserName(): string | null { return localStorage.getItem('fullName'); }
  getUserId(): string | null { return localStorage.getItem('userId'); }
  isLoggedIn(): boolean { return !!this.getToken(); }

  saveAuth(data: AuthData): void {
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    localStorage.setItem('role', data.role);
    localStorage.setItem('email', data.email);
    localStorage.setItem('fullName', data.fullName);
    localStorage.setItem('userId', data.userId);
  }

  clearAuth(): void {
    ['accessToken', 'refreshToken', 'role', 'email', 'fullName', 'userId']
      .forEach(k => localStorage.removeItem(k));
  }
}
