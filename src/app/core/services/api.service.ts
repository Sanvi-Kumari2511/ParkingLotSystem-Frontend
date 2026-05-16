import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient, private auth: AuthService) {}

  private get headers(): HttpHeaders {
    const token = this.auth.getToken();
    let h = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) h = h.set('Authorization', `Bearer ${token}`);
    return h;
  }

  private get base(): string { return this.auth.GATEWAY_URL; } // '' → relative, proxied to http://localhost:8080

  get<T>(path: string): Observable<T> {
    return this.http.get<T>(`${this.base}${path}`, { headers: this.headers });
  }
  post<T>(path: string, body: any = {}): Observable<T> {
    return this.http.post<T>(`${this.base}${path}`, body, { headers: this.headers });
  }
  put<T>(path: string, body: any = {}): Observable<T> {
    return this.http.put<T>(`${this.base}${path}`, body, { headers: this.headers });
  }
  delete<T>(path: string): Observable<T> {
    return this.http.delete<T>(`${this.base}${path}`, { headers: this.headers });
  }
  download(path: string): Observable<Blob> {
    const token = this.auth.getToken();
    let h = new HttpHeaders();
    if (token) h = h.set('Authorization', `Bearer ${token}`);
    return this.http.get(`${this.base}${path}`, { headers: h, responseType: 'blob' });
  }
}
