import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AdminLayoutComponent } from '../../../layouts/admin-layout/admin-layout.component';
import { SpinnerComponent, EmptyStateComponent, StatusBadgeComponent } from '../../../shared/ui/ui.components';

@Component({
  selector: 'app-all-bookings',
  standalone: true,
  imports: [FormsModule, AdminLayoutComponent, SpinnerComponent, EmptyStateComponent, StatusBadgeComponent, DatePipe],
  template: `
    <app-admin-layout>
      <div style="margin-bottom:24px">
        <h1 style="font-family:var(--font-display);font-weight:800;font-size:1.5rem;margin-bottom:4px">All Bookings</h1>
        <p style="color:var(--muted);font-size:0.9rem">{{bookings.length}} total bookings · ₹{{totalRevenue.toFixed(2)}} total revenue</p>
      </div>
      @if (error) {
        <div class="alert alert-danger">{{error}}<button (click)="error=''" style="margin-left:auto;background:none;border:none;cursor:pointer;opacity:0.6">✕</button></div>
      }
      <div class="card" style="margin-bottom:24px">
        <div style="display:flex;gap:12px">
          <input class="form-control" placeholder="Search by driver email or plate..." [(ngModel)]="search" (input)="applyFilter()" style="flex:1" />
          <select class="form-control" [(ngModel)]="statusFilter" (change)="applyFilter()" style="width:180px">
            @for (s of statuses; track s) { <option [value]="s">{{s}}</option> }
          </select>
        </div>
      </div>
      @if (loading) { <app-spinner></app-spinner> }
      @if (!loading && filtered.length === 0) { <app-empty-state icon="📋" title="No bookings found"></app-empty-state> }
      @if (!loading && filtered.length > 0) {
        <div class="card">
          <div class="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Driver</th><th>Lot</th><th>Spot</th><th>Vehicle</th><th>Type</th><th>Status</th><th>Start</th><th>Amount</th></tr></thead>
              <tbody>
                @for (b of filtered; track b.bookingId) {
                  <tr>
                    <td><strong>#{{b.bookingId}}</strong></td>
                    <td style="font-size:0.8rem;max-width:140px;overflow:hidden;text-overflow:ellipsis">{{b.driverEmail}}</td>
                    <td>#{{b.lotId}}</td>
                    <td>#{{b.spotId}}</td>
                    <td>{{b.vehiclePlate}}</td>
                    <td><span class="badge badge-muted">{{b.bookingType?.replace('_',' ')}}</span></td>
                    <td><app-status-badge [status]="b.status"></app-status-badge></td>
                    <td style="font-size:0.8rem">{{b.startTime | date:'shortDate'}}</td>
                    <td>
                      @if (b.totalAmount > 0) { <strong>₹{{b.totalAmount}}</strong> }
                      @else { <span style="color:var(--muted)">—</span> }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </app-admin-layout>
  `
})
export class AllBookingsComponent implements OnInit {
  bookings: any[] = []; filtered: any[] = []; loading = true; error = '';
  search = ''; statusFilter = 'ALL';
  statuses = ['ALL','RESERVED','ACTIVE','COMPLETED','CANCELLED'];

  constructor(private api: ApiService) {}

  get totalRevenue() {
    return this.bookings.filter(b => b.status === 'COMPLETED').reduce((s, b) => s + (b.totalAmount || 0), 0);
  }

  ngOnInit() {
    this.api.get<any[]>('/api/bookings/admin/all').subscribe({
      next: d => { this.bookings = d; this.filtered = d; this.loading = false; },
      error: err => { this.error = err.error?.message || 'Failed'; this.loading = false; }
    });
  }

  applyFilter() {
    let result = this.bookings;
    if (this.statusFilter !== 'ALL') result = result.filter(b => b.status === this.statusFilter);
    if (this.search.trim()) {
      const q = this.search.toLowerCase();
      result = result.filter(b => b.driverEmail?.toLowerCase().includes(q) || b.vehiclePlate?.toLowerCase().includes(q));
    }
    this.filtered = result;
  }
}
