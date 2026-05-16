import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [FormsModule, RouterModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <h1 style="margin-bottom:8px">Forgot Password</h1>
        <p style="margin-bottom:16px;color:var(--muted)">Enter your email to receive reset link.</p>
        @if (success) { <div class="alert alert-success">{{success}}</div> }
        @if (error)   { <div class="alert alert-danger">{{error}}</div> }
        <form (ngSubmit)="submit()">
          <input style="width:100%;margin-bottom:16px" type="email" placeholder="Enter email" [(ngModel)]="email" name="email" required />
          <button class="btn btn-primary" style="width:100%;justify-content:center;padding:12px">Send Reset Link</button>
        </form>
        <p style="margin-top:12px"><a routerLink="/login">Back to Login</a></p>
      </div>
    </div>
  `
})
export class ForgotPasswordComponent {
  email = ''; success = ''; error = '';
  constructor(private api: ApiService) {}
  submit() {
    this.success = ''; this.error = '';
    this.api.post('/api/auth/forgot-password', { email: this.email }).subscribe({
      next: () => this.success = 'Password reset link sent to your email.',
      error: err => this.error = err.error?.message || 'Failed to send reset link'
    });
  }
}
