import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

function redirectByRole(auth: AuthService, router: Router) {
  const map: Record<string, string> = { DRIVER: '/driver', LOT_MANAGER: '/manager', ADMIN: '/admin' };
  return router.createUrlTree([map[auth.getRole()!] || '/login']);
}

export const driverGuard: CanActivateFn = () => {
  const auth = inject(AuthService); const router = inject(Router);
  if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);
  if (auth.getRole() !== 'DRIVER') return redirectByRole(auth, router);
  return true;
};

export const managerGuard: CanActivateFn = () => {
  const auth = inject(AuthService); const router = inject(Router);
  if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);
  if (auth.getRole() !== 'LOT_MANAGER') return redirectByRole(auth, router);
  return true;
};

export const adminGuard: CanActivateFn = () => {
  const auth = inject(AuthService); const router = inject(Router);
  if (!auth.isLoggedIn()) return router.createUrlTree(['/login']);
  if (auth.getRole() !== 'ADMIN') return redirectByRole(auth, router);
  return true;
};
