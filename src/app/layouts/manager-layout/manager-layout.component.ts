import { Component } from '@angular/core';
import { SidebarComponent, NavItem } from '../../shared/sidebar/sidebar.component';
import { TopbarComponent } from '../../shared/ui/ui.components';

@Component({
  selector: 'app-manager-layout',
  standalone: true,
  imports: [SidebarComponent, TopbarComponent],
  template: `
    <div class="dash-layout">
      <app-sidebar [navItems]="navItems" title="Manager Menu"></app-sidebar>
      <div class="dash-main">
        <app-topbar [title]="title">
          <ng-content select="[topbar-right]"></ng-content>
        </app-topbar>
        <div class="page-content"><ng-content></ng-content></div>
      </div>
    </div>
  `
})
export class ManagerLayoutComponent {
  title = 'Manager Dashboard';
  navItems: NavItem[] = [
    { label: 'Dashboard', path: '/manager',      exact: true },
    { label: 'My Lots',   path: '/manager/lots' },
  ];
  setTitle(t: string) { this.title = t; }
}
