import { Component } from '@angular/core';
import { SidebarComponent, NavItem } from '../../shared/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/ui/ui.components';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [SidebarComponent, TopbarComponent],
  template: `
    <div class="dash-layout">
      <app-sidebar [navItems]="navItems" title="Admin Panel"></app-sidebar>
      <div class="dash-main">
        <app-topbar [title]="title">
          <ng-content select="[topbar-right]"></ng-content>
        </app-topbar>
        <div class="page-content"><ng-content></ng-content></div>
      </div>
    </div>
  `
})
export class AdminLayoutComponent {
  title = 'Admin Dashboard';
  navItems: NavItem[] = [
    { label: 'Dashboard', path: '/admin',            exact: true },
    { label: 'Users',     path: '/admin/users' },
    { label: 'Lots',      path: '/admin/lots' },
    { label: 'Bookings',  path: '/admin/bookings' },
    { label: 'Analytics', path: '/admin/analytics' },
    { label: 'Audit Logs', path: '/admin/audit' },
  ];
  setTitle(t: string) { this.title = t; }
}
