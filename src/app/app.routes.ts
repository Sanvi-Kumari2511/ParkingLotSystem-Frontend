import { Routes } from '@angular/router';
import { driverGuard, managerGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Guest
  { path: '', loadComponent: () => import('./pages/guest/landing/landing.component').then(m => m.LandingComponent) },
  { path: 'guest/lots/:lotId', loadComponent: () => import('./pages/guest/guest-lot-detail/guest-lot-detail.component').then(m => m.GuestLotDetailComponent) },

  // Auth
  { path: 'login', loadComponent: () => import('./pages/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'register', loadComponent: () => import('./pages/auth/register/register.component').then(m => m.RegisterComponent) },
  { path: 'forgot-password', loadComponent: () => import('./pages/auth/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent) },
  { path: 'reset-password', loadComponent: () => import('./pages/auth/reset-password/reset-password.component').then(m => m.ResetPasswordComponent) },
  { path: 'oauth2/success', loadComponent: () => import('./pages/auth/oauth2-redirect/oauth2-redirect.component').then(m => m.OAuth2RedirectComponent) },

  // Driver
  { path: 'driver', canActivate: [driverGuard], loadComponent: () => import('./pages/driver/dashboard/driver-dashboard.component').then(m => m.DriverDashboardComponent) },
  { path: 'driver/search', canActivate: [driverGuard], loadComponent: () => import('./pages/driver/search-lots/search-lots.component').then(m => m.SearchLotsComponent) },
  { path: 'driver/lots/:lotId', canActivate: [driverGuard], loadComponent: () => import('./pages/driver/lot-detail/lot-detail.component').then(m => m.LotDetailComponent) },
  { path: 'driver/bookings', canActivate: [driverGuard], loadComponent: () => import('./pages/driver/my-bookings/my-bookings.component').then(m => m.MyBookingsComponent) },
  { path: 'driver/vehicles', canActivate: [driverGuard], loadComponent: () => import('./pages/driver/my-vehicles/my-vehicles.component').then(m => m.MyVehiclesComponent) },
  { path: 'driver/payment/:bookingId', canActivate: [driverGuard], loadComponent: () => import('./pages/driver/payment/payment.component').then(m => m.PaymentComponent) },
  { path: 'driver/notifications', canActivate: [driverGuard], loadComponent: () => import('./pages/driver/notifications/notifications.component').then(m => m.NotificationsComponent) },
  { path: 'driver/receipts', canActivate: [driverGuard], loadComponent: () => import('./pages/driver/receipts/receipts.component').then(m => m.ReceiptsComponent) },
  { path: 'driver/profile', canActivate: [driverGuard], loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent) },

  // Manager
  { path: 'manager', canActivate: [managerGuard], loadComponent: () => import('./pages/manager/dashboard/manager-dashboard.component').then(m => m.ManagerDashboardComponent) },
  { path: 'manager/lots', canActivate: [managerGuard], loadComponent: () => import('./pages/manager/my-lots/my-lots.component').then(m => m.MyLotsComponent) },
  { path: 'manager/lots/:lotId/spots', canActivate: [managerGuard], loadComponent: () => import('./pages/manager/lot-spots/lot-spots.component').then(m => m.LotSpotsComponent) },
  { path: 'manager/lots/:lotId/bookings', canActivate: [managerGuard], loadComponent: () => import('./pages/manager/lot-bookings/lot-bookings.component').then(m => m.LotBookingsComponent) },
  { path: 'manager/lots/:lotId/analytics', canActivate: [managerGuard], loadComponent: () => import('./pages/manager/lot-analytics/lot-analytics.component').then(m => m.LotAnalyticsComponent) },
  { path: 'manager/profile', canActivate: [managerGuard], loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent) },

  // Admin
  { path: 'admin', canActivate: [adminGuard], loadComponent: () => import('./pages/admin/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent) },
  { path: 'admin/users', canActivate: [adminGuard], loadComponent: () => import('./pages/admin/manage-users/manage-users.component').then(m => m.ManageUsersComponent) },
  { path: 'admin/lots', canActivate: [adminGuard], loadComponent: () => import('./pages/admin/manage-lots/manage-lots.component').then(m => m.ManageLotsComponent) },
  { path: 'admin/bookings', canActivate: [adminGuard], loadComponent: () => import('./pages/admin/all-bookings/all-bookings.component').then(m => m.AllBookingsComponent) },
  { path: 'admin/analytics', canActivate: [adminGuard], loadComponent: () => import('./pages/admin/platform-analytics/platform-analytics.component').then(m => m.PlatformAnalyticsComponent) },
  { path: 'admin/audit', canActivate: [adminGuard], loadComponent: () => import('./pages/admin/audit-logs/audit-logs.component').then(m => m.AuditLogsComponent) },
  { path: 'admin/profile', canActivate: [adminGuard], loadComponent: () => import('./pages/profile/profile.component').then(m => m.ProfileComponent) },

  { path: '**', redirectTo: '' }
];
