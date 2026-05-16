import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { DriverLayoutComponent } from '../../../layouts/driver-layout/driver-layout.component';
import { SpinnerComponent, StatusBadgeComponent, EmptyStateComponent } from '../../../shared/ui/ui.components';

@Component({
  selector: 'app-driver-dashboard',
  standalone: true,
  imports: [DriverLayoutComponent, SpinnerComponent, StatusBadgeComponent, EmptyStateComponent, DatePipe],
  template: `
    <app-driver-layout title="Driver Dashboard" [subtitle]="subtitle">
      <button topbar-right class="btn btn-primary btn-sm" style="padding:8px 16px;border-radius:999px;font-weight:800;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em" (click)="router.navigate(['/driver/search'])">+ Find Parking</button>
      <div class="stat-grid">
        <div class="stat-card"><div class="stat-icon ic-accent">◈</div><div class="stat-kicker">Active Parking</div><div class="stat-number">{{active}}</div><div class="stat-sub">Currently parked</div></div>
        <div class="stat-card"><div class="stat-icon ic-info">◎</div><div class="stat-kicker">Reserved</div><div class="stat-number">{{reserved}}</div><div class="stat-sub">Upcoming bookings</div></div>
        <div class="stat-card"><div class="stat-icon ic-success">✓</div><div class="stat-kicker">Completed</div><div class="stat-number">{{completed}}</div><div class="stat-sub">Total trips</div></div>
        <div class="stat-card"><div class="stat-icon ic-warning">₹</div><div class="stat-kicker">Total Spent</div><div class="stat-number">₹{{totalSpent}}</div><div class="stat-sub">All time</div></div>
      </div>
      <div style="margin-top:32px">
        <div class="row-between" style="margin-bottom:16px">
          <div class="section-title" style="margin-bottom:0;text-transform:uppercase">RECENT BOOKINGS</div>
          <button class="btn btn-outline btn-sm" style="border-radius:999px;font-size:0.75rem;font-weight:800;color:var(--accent);border-color:var(--accent);padding:6px 14px" (click)="router.navigate(['/driver/bookings'])">VIEW ALL →</button>
        </div>
        @if (loading) { <app-spinner></app-spinner> }
        @if (!loading && bookings.length === 0) {
          <app-empty-state icon="🅿" title="No bookings yet" message="Find a parking spot to get started.">
            <button class="btn btn-primary" (click)="router.navigate(['/driver/search'])">Find Parking</button>
          </app-empty-state>
        }
        @if (!loading && bookings.length > 0) {
          <div class="table-wrap">
            <table>
              <thead><tr><th>Booking ID</th><th>Spot</th><th>Start Time</th><th>End Time</th><th>Status</th><th>Amount</th></tr></thead>
              <tbody>
                @for (b of bookings; track b.id) {
                  <tr>
                    <td style="font-family:var(--font-display);font-weight:700">#{{b.id}}</td>
                    <td>{{b.spot ? 'Spot #'+b.spot.id : 'Spot'}}</td>
                    <td>{{b.startTime | date:'short'}}</td>
                    <td>{{b.endTime | date:'short'}}</td>
                    <td><app-status-badge [status]="b.status"></app-status-badge></td>
                    <td style="color:var(--accent);font-weight:700">₹{{b.totalAmount}}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>
    </app-driver-layout>
  `
})
export class DriverDashboardComponent implements OnInit {
  bookings: any[] = []; loading = true;
  constructor(public router: Router, private api: ApiService, private auth: AuthService) {}
  get name() { return this.auth.getUserName(); }
  get subtitle() { return `Good morning, ${this.name ? this.name.split(' ')[0].toUpperCase() : 'DRIVER'}`; }
  get active()    { return this.bookings.filter(b => b.status === 'ACTIVE').length; }
  get reserved()  { return this.bookings.filter(b => b.status === 'RESERVED').length; }
  get completed() { return this.bookings.filter(b => b.status === 'COMPLETED').length; }
  get totalSpent(){ return this.bookings.reduce((s, b) => s + (b.totalAmount || 0), 0).toFixed(0); }
  ngOnInit() {
    this.api.get<any[]>('/api/bookings/my').subscribe({
      next: d => { this.bookings = d.slice(0, 5); this.loading = false; },
      error: () => this.loading = false
    });
  }
}
