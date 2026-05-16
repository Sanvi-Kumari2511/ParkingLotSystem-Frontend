import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="auth-page">
      <div class="auth-card">
        <h1 style="margin-bottom:16px">Reset Password</h1>
        @if (success) { <div class="alert alert-success">{{success}}</div> }
        @if (error)   { <div class="alert alert-danger">{{error}}</div> }
        <form (ngSubmit)="submit()">
          <input style="width:100%;margin-bottom:16px" type="password" placeholder="Enter new password" [(ngModel)]="password" name="password" required />
          <button class="btn btn-primary" style="width:100%;justify-content:center;padding:12px">Reset Password</button>
        </form>
      </div>
    </div>
  `
})
export class ResetPasswordComponent implements OnInit {
  password = ''; success = ''; error = ''; token = '';
  constructor(private api: ApiService, private route: ActivatedRoute, private router: Router) {}
  ngOnInit() { this.token = this.route.snapshot.queryParams['token'] || ''; }
  submit() {
    this.success = ''; this.error = '';
    this.api.post('/api/auth/reset-password', { token: this.token, newPassword: this.password }).subscribe({
      next: () => { this.success = 'Password reset successful. Redirecting...'; setTimeout(() => this.router.navigate(['/login']), 1500); },
      error: err => this.error = err.error?.message || 'Reset failed'
    });
  }
}
