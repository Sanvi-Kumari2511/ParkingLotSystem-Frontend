import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-oauth2-redirect',
  standalone: true,
  imports: [RouterModule],
  template: `
    <div class="auth-page" style="flex-direction:column">
      @if (error) {
        <div class="auth-card" style="text-align:center">
          <div style="font-size:48px;margin-bottom:16px">⚠️</div>
          <h3 style="color:var(--text);margin-bottom:8px">Google Login Failed</h3>
          <p style="color:var(--muted);margin-bottom:20px">{{error}}</p>
          <a routerLink="/login" style="color:var(--accent);font-weight:700">← Back to Login</a>
        </div>
      } @else {
        <div class="spinner"></div>
        <h3 style="margin-top:24px">Authenticating with Google...</h3>
        <p style="color:var(--muted)">Please wait while we sync your account.</p>
      }
    </div>
  `
})
export class OAuth2RedirectComponent implements OnInit {
  error = '';

  constructor(private route: ActivatedRoute, private router: Router, private auth: AuthService) {}

  ngOnInit() {
    const params = this.route.snapshot.queryParams;

    // Handle OAuth2 failure redirect
    if (params['error']) {
      this.error = 'Authentication was cancelled or failed. Please try again.';
      return;
    }

    const accessToken  = params['token'];
    const refreshToken = params['refreshToken'];
    const role         = params['role'];
    const email        = params['email'];
    const userId       = params['userId'] ? String(params['userId']) : '';
    const fullName     = params['fullName'] || '';

    if (accessToken && refreshToken && role) {
      this.auth.saveAuth({ accessToken, refreshToken, role, email, fullName, userId });

      // Respect any pre-login redirect (e.g. user tried to access /driver directly)
      const redirectAfterLogin = sessionStorage.getItem('redirectAfterLogin');
      if (redirectAfterLogin) {
        sessionStorage.removeItem('redirectAfterLogin');
        this.router.navigateByUrl(redirectAfterLogin, { replaceUrl: true });
        return;
      }

      const routes: Record<string, string> = { ADMIN: '/admin', LOT_MANAGER: '/manager', DRIVER: '/driver' };
      this.router.navigate([routes[role] || '/driver'], { replaceUrl: true });
    } else {
      this.router.navigate(['/login'], { queryParams: { error: 'oauth_failed' } });
    }
  }
}
