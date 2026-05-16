import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">
          <div style="width:34px;height:34px;border-radius:8px;background:var(--accent);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:600;font-size:18px;color:#0d1117">P</div>
          <div style="font-family:var(--font-display);font-weight:700;font-size:24px;color:var(--text);letter-spacing:-0.02em">ParkEase</div>
        </div>
        <div style="text-align:center;margin-bottom:12px">
          <div style="font-family:var(--font-display);font-weight:700;font-size:18px;letter-spacing:-0.02em;color:var(--text);margin-bottom:3px">Welcome back</div>
          <div style="font-size:12px;color:var(--muted)">Smart Parking Management Platform</div>
        </div>
        @if (guestMessage) {
          <div class="alert alert-info">{{guestMessage}}</div>
        }
        @if (error) {
          <div class="alert alert-danger">
            {{error}}<button (click)="error=''" style="margin-left:auto;background:none;border:none;cursor:pointer;opacity:0.6">✕</button>
          </div>
        }
        <form (ngSubmit)="submit()" style="display:flex;flex-direction:column;gap:0">
          <div class="input-wrap">
            <label class="input-label">Email Address</label>
            <input type="email" placeholder="you@example.com" [(ngModel)]="email" name="email" required />
          </div>
          <div class="input-wrap">
            <label class="input-label">Password</label>
            <input type="password" placeholder="Your password" [(ngModel)]="password" name="password" required />
            <div style="text-align:right;margin-top:4px">
              <a routerLink="/forgot-password" style="font-size:12px;color:var(--muted)">Forgot Password?</a>
            </div>
          </div>
          <button class="btn btn-primary" type="submit" [disabled]="loading"
            style="width:100%;height:42px;justify-content:center;font-size:13px;font-weight:700;border-radius:var(--radius-sm);margin-top:2px">
            {{loading ? 'Signing in...' : 'Sign In'}}
          </button>
          <div style="display:flex;align-items:center;gap:12px;margin:10px 0">
            <div style="flex:1;height:1px;background:var(--border)"></div>
            <span style="font-size:12px;color:var(--muted);font-weight:600">or</span>
            <div style="flex:1;height:1px;background:var(--border)"></div>
          </div>
          <button type="button"
            style="width:100%;height:42px;background:var(--bg-3);color:var(--text);border:1px solid var(--border);border-radius:var(--radius-sm);font-family:var(--font-sans);font-weight:600;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;transition:border-color 0.2s"
            [disabled]="googleLoading"
            (click)="googleLogin()">
            @if (googleLoading) {
              <span class="spinner" style="width:16px;height:16px;border-width:2px"></span>
            } @else {
              <span style="font-family:sans-serif;font-weight:900;font-size:16px">G</span>
            }
            {{googleLoading ? 'Redirecting...' : 'Continue with Google'}}
          </button>
        </form>
        <div style="text-align:center;margin-top:12px;font-size:12px;color:var(--muted)">
          Don't have an account? <a routerLink="/register" style="color:var(--accent);font-weight:700">Create one</a>
        </div>
        <div style="text-align:center;margin-top:6px">
          <a routerLink="/" style="font-size:12px;color:var(--accent)">← Browse lots without signing in</a>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent implements OnInit {
  email = ''; password = ''; loading = false; googleLoading = false; error = ''; guestMessage = '';

  constructor(private api: ApiService, private auth: AuthService,
              private router: Router, private route: ActivatedRoute) {
    this.guestMessage = this.router.getCurrentNavigation()?.extras?.state?.['message'] || '';
  }

  ngOnInit() {
    // Show error message if redirected back from failed OAuth2 attempt
    const errorParam = this.route.snapshot.queryParams['error'];
    if (errorParam === 'oauth_failed') {
      this.error = 'Google sign-in failed. Please try again or use email login.';
    }
  }

  submit() {
    this.error = ''; this.loading = true;
    this.api.post<any>('/api/auth/login', { email: this.email, password: this.password }).subscribe({
      next: data => {
        this.loading = false; // Reset loading state immediately
        try {
          this.auth.saveAuth({
            accessToken:  data.accessToken,
            refreshToken: data.refreshToken,
            role:         data.role,
            email:        data.email,
            fullName:     data.fullName,
            userId:       data.userId ? String(data.userId) : ''
          });
        } catch (e) {
          console.error("Failed to save auth data", e);
          this.error = "Local storage error. Please enable cookies/storage.";
          return;
        }
        
        const redirect = sessionStorage.getItem('redirectAfterLogin');
        if (redirect) { 
          sessionStorage.removeItem('redirectAfterLogin'); 
          this.router.navigateByUrl(redirect); 
          return; 
        }
        const routes: Record<string,string> = { DRIVER:'/driver', LOT_MANAGER:'/manager', ADMIN:'/admin' };
        this.router.navigate([routes[data.role] || '/driver']).then(success => {
          if (!success) {
            this.error = "Navigation blocked by permissions.";
          }
        }).catch(err => {
          console.error("Navigation error", err);
          this.error = "Failed to navigate to dashboard.";
        });
      },
      error: err => {
        this.loading = false;
        const msg: string = err.error?.message || err.message || '';
        if (msg.toLowerCase().includes('locked') || msg.toLowerCase().includes('suspended')) {
          this.error = 'Your account has been suspended by the admin.';
        } else {
          this.error = msg || 'Login failed. Please check your credentials.';
        }
      }
    });
  }

  googleLogin() {
    this.googleLoading = true;
    // OAuth2 must go directly to auth-service (bypasses Angular proxy intentionally)
    window.location.href = `${this.auth.OAUTH2_DIRECT_URL}/oauth2/authorization/google`;
  }
}
