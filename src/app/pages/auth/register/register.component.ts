import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-logo">
          <div style="width:38px;height:38px;border-radius:10px;background:var(--accent);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:900;font-size:20px;color:#fff">P</div>
          <div style="font-family:var(--font-display);font-weight:800;font-size:17px;color:var(--text)">ParkEase</div>
        </div>
        <div style="text-align:center;margin-bottom:14px">
          <div style="font-family:var(--font-display);font-weight:900;font-size:20px;text-transform:uppercase;letter-spacing:-0.02em;color:var(--text)">Create Your Account</div>
        </div>
        @if (error) {
          <div class="alert alert-danger">{{error}}<button (click)="error=''" style="margin-left:auto;background:none;border:none;cursor:pointer;opacity:0.6">✕</button></div>
        }
        <form (ngSubmit)="submit()" style="display:flex;flex-direction:column;gap:0">
          <div class="input-wrap">
            <label class="input-label">Full Name</label>
            <input placeholder="Your full name" [(ngModel)]="form.fullName" name="fullName" required />
          </div>
          <div class="input-wrap">
            <label class="input-label">Email Address</label>
            <input type="email" placeholder="you@example.com" [(ngModel)]="form.email" name="email" required />
          </div>
          <div class="input-wrap">
            <label class="input-label">Password</label>
            <input type="password" placeholder="Min. 8 characters" [(ngModel)]="form.password" name="password" required minlength="8" />
          </div>
          <div class="input-wrap">
            <label class="input-label">Role</label>
            <select [(ngModel)]="form.role" name="role">
              <option value="DRIVER">Driver — Looking for parking</option>
              <option value="LOT_MANAGER">Lot Manager — I manage parking lots</option>
            </select>
          </div>
          <button class="btn btn-primary" type="submit" [disabled]="loading"
            style="width:100%;height:42px;justify-content:center;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:0.06em;border-radius:999px;margin-top:2px">
            {{loading ? 'Creating account...' : 'Create Account'}}
          </button>
        </form>
        <div style="text-align:center;margin-top:12px;font-size:12px;color:var(--muted)">
          Already have an account? <a routerLink="/login" style="color:var(--accent);font-weight:700">Sign in</a>
        </div>
      </div>
    </div>
  `
})
export class RegisterComponent {
  form = { fullName: '', email: '', password: '', role: 'DRIVER' };
  loading = false; error = '';

  constructor(private api: ApiService, private auth: AuthService, private router: Router) {}

  submit() {
    this.error = ''; this.loading = true;
    this.api.post<any>('/api/auth/register', this.form).subscribe({
      next: data => {
        this.auth.saveAuth(data);
        const routes: Record<string,string> = { DRIVER:'/driver', LOT_MANAGER:'/manager', ADMIN:'/admin' };
        this.router.navigate([routes[data.role] || '/driver']);
      },
      error: err => { this.error = err.error?.message || 'Registration failed'; this.loading = false; }
    });
  }
}
