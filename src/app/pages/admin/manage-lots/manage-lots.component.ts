import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { AdminLayoutComponent } from '../../../layouts/admin-layout/admin-layout.component';
import { SpinnerComponent, EmptyStateComponent } from '../../../shared/ui/ui.components';

@Component({
  selector: 'app-manage-lots',
  standalone: true,
  imports: [AdminLayoutComponent, SpinnerComponent, EmptyStateComponent],
  template: `
    <app-admin-layout>
      <div style="margin-bottom:24px">
        <h1 style="font-family:var(--font-display);font-weight:800;font-size:1.5rem;margin-bottom:4px">Manage Parking Lots</h1>
        <p style="color:var(--muted);font-size:0.9rem">{{pending.length}} lots pending approval.</p>
      </div>
      @if (error)   { <div class="alert alert-danger">{{error}}<button (click)="error=''" style="margin-left:auto;background:none;border:none;cursor:pointer;opacity:0.6">✕</button></div> }
      @if (success) { <div class="alert alert-success">{{success}}<button (click)="success=''" style="margin-left:auto;background:none;border:none;cursor:pointer;opacity:0.6">✕</button></div> }
      <div class="tab-bar" style="margin-bottom:24px;max-width:360px">
        <div class="tab" [class.active]="tab==='pending'" (click)="tab='pending'">Pending ({{pending.length}})</div>
        <div class="tab" [class.active]="tab==='all'" (click)="tab='all'">All Lots ({{allLots.length}})</div>
      </div>
      @if (loading) { <app-spinner></app-spinner> }
      @if (!loading) {
        @if (tab === 'pending') {
          @if (pending.length === 0) {
            <app-empty-state icon="✅" title="No pending lots" message="All lot registrations have been reviewed."></app-empty-state>
          } @else {
            <div class="card">
              <div class="table-wrap">
                <table>
                  <thead><tr><th>ID</th><th>Name</th><th>Manager</th><th>City</th><th>Spots</th><th>Status</th><th>Open</th><th style="text-align:right">Actions</th></tr></thead>
                  <tbody>
                    @for (lot of pending; track lot.lotId) {
                      <tr>
                        <td><strong>#{{lot.lotId}}</strong></td>
                        <td>{{lot.name}}</td>
                        <td><span style="font-size:0.8rem;color:var(--muted)">{{lot.managerName || lot.managerEmail}}</span></td>
                        <td>{{lot.city}}</td>
                        <td>{{lot.totalSpots}}</td>
                        <td><span class="badge badge-warning">⏳ Pending</span></td>
                        <td><span class="badge" [class]="lot.open?'badge-success':'badge-muted'">{{lot.open?'● Open':'● Closed'}}</span></td>
                        <td style="text-align:right">
                          <div style="display:flex;gap:6px;justify-content:flex-end">
                            <button class="btn btn-primary btn-sm" (click)="approve(lot.lotId)">Approve</button>
                            <button class="btn btn-ghost btn-sm" style="color:var(--danger)" (click)="reject(lot.lotId)">Reject</button>
                          </div>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
        }
        @if (tab === 'all') {
          <div class="card">
            <div class="table-wrap">
              <table>
                <thead><tr><th>ID</th><th>Name</th><th>Manager</th><th>City</th><th>Spots</th><th>Approval</th><th>Open</th></tr></thead>
                <tbody>
                  @for (lot of allLots; track lot.lotId) {
                    <tr>
                      <td><strong>#{{lot.lotId}}</strong></td>
                      <td>{{lot.name}}</td>
                      <td><span style="font-size:0.8rem;color:var(--muted)">{{lot.managerName || lot.managerEmail}}</span></td>
                      <td>{{lot.city}}</td>
                      <td>{{lot.totalSpots}}</td>
                      <td><span class="badge" [class]="lot.approved?'badge-success':'badge-warning'">{{lot.approved?'✓ Approved':'⏳ Pending'}}</span></td>
                      <td><span class="badge" [class]="lot.open?'badge-success':'badge-muted'">{{lot.open?'● Open':'● Closed'}}</span></td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      }
    </app-admin-layout>
  `
})
export class ManageLotsComponent implements OnInit {
  pending: any[] = []; allLots: any[] = []; loading = true;
  error = ''; success = ''; tab = 'pending';

  constructor(private api: ApiService) {}
  ngOnInit() { this.load(); }

  load() {
    Promise.all([
      this.api.get<any[]>('/api/lots/admin/pending').toPromise(),
      this.api.get<any[]>('/api/lots').toPromise(),
      this.api.get<any[]>('/api/admin/users/role/LOT_MANAGER').toPromise().catch(() => []) // Fallback to empty array if fails
    ]).then(([p, a, managers]) => { 
      const mMap = new Map((managers || []).map(m => [m.email, m.fullName]));
      this.pending = (p || []).map(lot => ({...lot, managerName: mMap.get(lot.managerEmail)}));
      this.allLots = (a || []).map(lot => ({...lot, managerName: mMap.get(lot.managerEmail)}));
    })
      .catch(err => this.error = err.error?.message || 'Failed')
      .finally(() => this.loading = false);
  }

  approve(id: number) {
    const feedback = window.prompt('Optional: Enter approval feedback or notes for the manager:');
    if (feedback === null) return; // User cancelled
    
    this.api.put(`/api/lots/admin/${id}/approve${feedback ? '?feedback='+encodeURIComponent(feedback) : ''}`).subscribe({
      next: () => { this.success = 'Lot approved!'; this.load(); },
      error: err => this.error = err.error?.message || 'Failed'
    });
  }

  reject(id: number) {
    const feedback = window.prompt('Required: Enter the reason for rejection so the manager can fix it:');
    if (feedback === null) return; // User cancelled
    
    this.api.put(`/api/lots/admin/${id}/reject${feedback ? '?feedback='+encodeURIComponent(feedback) : ''}`).subscribe({
      next: () => { this.success = 'Lot rejected.'; this.load(); },
      error: err => this.error = err.error?.message || 'Failed'
    });
  }
}
