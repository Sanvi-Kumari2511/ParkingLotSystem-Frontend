import { Component, Input, Output, EventEmitter } from '@angular/core';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

export interface NavItem { label: string; path: string; exact?: boolean; badge?: number; }

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterModule],
  template: `
    <aside class="dash-sidebar">
      <div class="sb-logo">
        <div class="sb-logo-box">P</div>
        <div class="sb-logo-name">ParkEase</div>
      </div>
      <nav style="flex:1;overflow-y:auto">
        @if (title) {
          <div class="sb-group-label">{{title}}</div>
        }
        @for (item of navItems; track item.path; let i = $index) {
          <a [routerLink]="item.path"
             [routerLinkActiveOptions]="item.exact ? {exact:true} : {exact:false}"
             routerLinkActive="active"
             class="sb-item">
            <span class="sb-item-dot"></span>
            {{item.label}}
            <span class="sb-item-num">{{pad(i+1)}}</span>
            @if (item.badge && item.badge > 0) {
              <span class="badge badge-danger"
                    style="margin-left:8px;padding:2px 6px;font-size:0.65rem">
                {{item.badge > 99 ? '99+' : item.badge}}
              </span>
            }
          </a>
        }
      </nav>
      <div style="margin-top:auto;border-top:1px solid var(--border);padding-top:16px;display:flex;flex-direction:column;gap:12px;">
        <div class="sb-user" (click)="goToProfile()" title="View Profile" style="margin-top:0;border-top:none;padding:0 8px;cursor:pointer">
          <div class="sb-user-avatar">{{initials}}</div>
          <div style="flex:1;min-width:0;overflow:hidden">
            <div class="sb-user-name" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{name}}</div>
            <div class="sb-user-role">{{roleLabel}}</div>
          </div>
        </div>
        <button (click)="logout()" title="Logout"
          style="width:100%;background:rgba(239, 68, 68, 0.08);border:1px solid rgba(239, 68, 68, 0.2);color:var(--danger);font-size:0.75rem;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;cursor:pointer;padding:10px;border-radius:var(--radius-sm);transition:all 0.2s;">
          Logout
        </button>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  @Input() navItems: NavItem[] = [];
  @Input() title = '';

  constructor(private auth: AuthService, private router: Router) {}

  get name()     { return this.auth.getUserName() || 'User'; }
  get initials() { return this.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0,2); }
  get roleLabel(){
    const map: Record<string,string> = { DRIVER:'Driver', LOT_MANAGER:'Lot Manager', ADMIN:'Administrator' };
    return map[this.auth.getRole()!] || '';
  }

  pad(n: number) { return String(n).padStart(2,'0'); }
  
  goToProfile() {
    const role = this.auth.getRole();
    if (role === 'DRIVER')      this.router.navigate(['/driver/profile']);
    else if (role === 'LOT_MANAGER') this.router.navigate(['/manager/profile']);
    else if (role === 'ADMIN')       this.router.navigate(['/admin/profile']);
  }

  logout() { this.auth.clearAuth(); this.router.navigate(['/login']); }
}
