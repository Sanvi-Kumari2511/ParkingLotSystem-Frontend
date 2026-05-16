import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { SidebarComponent, NavItem } from '../../shared/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/ui/ui.components';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-driver-layout',
  standalone: true,
  imports: [SidebarComponent, TopbarComponent],
  template: `
    <div class="dash-layout">
      <app-sidebar [navItems]="navItems" title="Driver Menu"></app-sidebar>
      <div class="dash-main">
        <app-topbar [title]="title" [subtitle]="subtitle">
          <ng-content select="[topbar-right]"></ng-content>
        </app-topbar>
        <div class="page-content"><ng-content></ng-content></div>
      </div>
    </div>
  `
})
export class DriverLayoutComponent implements OnInit, OnDestroy {
  @Input() title = 'Dashboard';
  @Input() subtitle = '';
  unreadCount = 0;
  private interval: any;

  constructor(private api: ApiService) {}

  get navItems(): NavItem[] {
    return [
      { label: 'Dashboard',     path: '/driver',               exact: true },
      { label: 'Find Parking',  path: '/driver/search' },
      { label: 'My Bookings',   path: '/driver/bookings' },
      { label: 'My Vehicles',   path: '/driver/vehicles' },
      { label: 'My Receipts',   path: '/driver/receipts' },
      { label: 'Notifications', path: '/driver/notifications', badge: this.unreadCount },
    ];
  }

  ngOnInit() {
    this.fetchCount();
    this.interval = setInterval(() => this.fetchCount(), 30000);
  }
  ngOnDestroy() { clearInterval(this.interval); }

  private fetchCount() {
    this.api.get<any>('/api/notifications/my/count')
      .subscribe({ next: d => this.unreadCount = d.unreadCount || 0, error: () => {} });
  }
}
