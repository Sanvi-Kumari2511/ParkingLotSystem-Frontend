import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { ManagerLayoutComponent } from '../../../layouts/manager-layout/manager-layout.component';
import { SpinnerComponent, EmptyStateComponent, StatusBadgeComponent } from '../../../shared/ui/ui.components';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [ManagerLayoutComponent, SpinnerComponent, EmptyStateComponent, StatusBadgeComponent],
  template: `
    <app-manager-layout>
      <button topbar-right class="btn btn-primary btn-sm" (click)="router.navigate(['/manager/lots'])">Manage Lots</button>
      <div style="margin-bottom:32px">
        <h1 style="font-family:var(--font-display);font-weight:900;font-size:1.5rem;text-transform:uppercase;margin-bottom:4px">Manager Dashboard</h1>
        <p style="color:var(--muted);font-size:0.85rem">Welcome, {{firstName}}</p>
      </div>
      <div class="stat-grid" style="margin-bottom:40px">
        <div class="stat-card"><div class="stat-icon ic-accent">❖</div><div class="stat-kicker">Total Lots</div><div class="stat-number">{{lots.length}}</div><div class="stat-sub">{{openLots}} currently open</div></div>
        <div class="stat-card"><div class="stat-icon ic-info">◎</div><div class="stat-kicker">Total Spots</div><div class="stat-number">{{totalSpots}}</div><div class="stat-sub">{{totalAvailable}} available</div></div>
        <div class="stat-card"><div class="stat-icon ic-warning">⏳</div><div class="stat-kicker">Pending Approval</div><div class="stat-number">{{pendingLots}}</div><div class="stat-sub">Awaiting admin review</div></div>
        <div class="stat-card"><div class="stat-icon ic-success">%</div><div class="stat-kicker">Occupancy</div><div class="stat-number">{{occupancy}}</div><div class="stat-sub">Across all lots</div></div>
      </div>
      <div>
        <div class="row-between" style="margin-bottom:16px">
          <h3 style="font-family:var(--font-display);font-weight:900;font-size:1rem;text-transform:uppercase">My Parking Lots</h3>
        </div>
        @if (loading) { <app-spinner></app-spinner> }
        @if (!loading && lots.length === 0) {
          <app-empty-state icon="🏢" title="No lots registered yet" message="Register your first parking facility.">
            <button class="btn btn-primary" (click)="router.navigate(['/manager/lots'])">Register Lot</button>
          </app-empty-state>
        }
        @if (!loading && lots.length > 0) {
          <div class="table-wrap">
            <table>
              <thead><tr><th>Lot Name</th><th>City</th><th>Spots</th><th>Status</th><th>Approval</th><th>Actions</th></tr></thead>
              <tbody>
                @for (lot of lots; track lot.lotId) {
                  <tr>
                    <td>
                      <strong>{{lot.name}}</strong>
                      <div style="font-size:0.7rem;color:var(--muted);font-weight:700">LOT #{{lot.lotId}}</div>
                    </td>
                    <td style="color:var(--text-soft)">{{lot.city}}</td>
                    <td style="font-family:monospace">{{lot.availableSpots}} / {{lot.totalSpots}}</td>
                    <td><app-status-badge [status]="lot.open?'AVAILABLE':'CLOSED'"></app-status-badge></td>
                    <td><span class="badge" [class]="lot.approved?'badge-success':'badge-warning'">{{lot.approved?'✓ APPROVED':'PENDING'}}</span></td>
                    <td>
                      <div style="display:flex;gap:8px">
                        <button class="btn btn-outline" style="border-radius:999px;font-size:0.7rem;font-weight:800;padding:6px 16px;height:auto" (click)="router.navigate(['/manager/lots',lot.lotId,'spots'])">SPOTS</button>
                        <button class="btn btn-outline" style="border-radius:999px;font-size:0.7rem;font-weight:800;padding:6px 16px;height:auto" (click)="router.navigate(['/manager/lots',lot.lotId,'bookings'])">BOOKINGS</button>
                        <button class="btn" style="border-radius:999px;background:rgba(59, 130, 246, 0.1);border:1px solid rgba(59, 130, 246, 0.3);color:var(--info);font-size:0.7rem;font-weight:800;padding:6px 16px;height:auto" (click)="router.navigate(['/manager/lots',lot.lotId,'analytics'])">ANALYTICS</button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </app-manager-layout>
  `
})
export class ManagerDashboardComponent implements OnInit {
  lots: any[] = []; loading = true;
  constructor(public router: Router, private api: ApiService, private auth: AuthService) {}
  get firstName() { return this.auth.getUserName()?.split(' ')[0] || 'Manager'; }
  get totalSpots()     { return this.lots.reduce((s, l) => s + l.totalSpots, 0); }
  get totalAvailable() { return this.lots.reduce((s, l) => s + l.availableSpots, 0); }
  get openLots()       { return this.lots.filter(l => l.open).length; }
  get pendingLots()    { return this.lots.filter(l => !l.approved).length; }
  get occupancy() {
    const t = this.totalSpots;
    return t > 0 ? `${(((t - this.totalAvailable) / t) * 100).toFixed(0)}%` : '0%';
  }
  ngOnInit() {
    this.api.get<any[]>('/api/lots/my-lots').subscribe({
      next: d => { this.lots = d; this.loading = false; },
      error: () => this.loading = false
    });
  }
}
