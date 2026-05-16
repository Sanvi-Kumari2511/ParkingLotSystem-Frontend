import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ManagerLayoutComponent } from '../../../layouts/manager-layout/manager-layout.component';
import { SpinnerComponent, EmptyStateComponent, StatusBadgeComponent } from '../../../shared/ui/ui.components';

@Component({
  selector: 'app-lot-bookings',
  standalone: true,
  imports: [ManagerLayoutComponent, SpinnerComponent, EmptyStateComponent, StatusBadgeComponent, DatePipe],
  template: `
    <app-manager-layout title="Lot Bookings">
      <button topbar-right class="btn btn-outline btn-sm" (click)="router.navigate(['/manager/lots'])">← Back</button>
      <div style="margin-bottom:24px">
        <h1 style="font-family:var(--font-display);font-weight:800;font-size:1.5rem;margin-bottom:4px">Bookings — Lot #{{lotId}}</h1>
        <p style="color:var(--muted);font-size:0.9rem">View all reservations and check-ins for this lot.</p>
      </div>
      @if (error) { <div class="alert alert-danger">{{error}}<button (click)="error=''" style="margin-left:auto;background:none;border:none;cursor:pointer;opacity:0.6">✕</button></div> }
      <div class="tab-bar" style="margin-bottom:24px;max-width:600px">
        @for (s of statuses; track s) {
          <div class="tab" [class.active]="filter===s" (click)="applyFilter(s)">{{s}} ({{counts[s]||0}})</div>
        }
      </div>
      @if (loading) { <app-spinner></app-spinner> }
      @if (!loading && filtered.length === 0) {
        <app-empty-state icon="📋" title="No bookings found" message="No bookings match the selected filter."></app-empty-state>
      }
      @if (!loading && filtered.length > 0) {
        <div class="card">
          <div class="table-wrap">
            <table>
              <thead><tr><th>ID</th><th>Driver</th><th>Spot</th><th>Vehicle</th><th>Type</th><th>Start</th><th>End</th><th>Status</th><th>Amount</th></tr></thead>
              <tbody>
                @for (b of filtered; track b.bookingId) {
                  <tr>
                    <td><strong>#{{b.bookingId}}</strong></td>
                    <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;font-size:0.8rem">{{b.driverEmail}}</td>
                    <td>#{{b.spotId}}</td><td>{{b.vehiclePlate}}</td>
                    <td><span class="badge badge-muted">{{b.bookingType?.replace('_',' ')}}</span></td>
                    <td style="font-size:0.8rem">{{b.startTime | date:'short'}}</td>
                    <td style="font-size:0.8rem">{{b.endTime | date:'short'}}</td>
                    <td><app-status-badge [status]="b.status"></app-status-badge></td>
                    <td>
                      @if (b.totalAmount > 0) { <strong>₹{{b.totalAmount}}</strong> }
                      @else { <span style="color:var(--muted)">—</span> }
                    </td>
                    <td>
                      @if (b.status === 'ACTIVE') {
                        <button class="btn btn-sm" style="background:var(--warning);color:black;font-size:0.6rem;font-weight:900" 
                                (click)="manualCheckout(b.bookingId)">
                          MANUAL CHECKOUT
                        </button>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </app-manager-layout>
  `
})
export class LotBookingsComponent implements OnInit {
  bookings: any[] = []; filtered: any[] = []; loading = true; error = ''; filter = 'ALL';
  statuses = ['ALL','RESERVED','ACTIVE','COMPLETED','CANCELLED'];
  counts: Record<string, number> = {};
  constructor(public router: Router, private route: ActivatedRoute, private api: ApiService) {}
  get lotId() { return this.route.snapshot.params['lotId']; }
  ngOnInit() {
    this.api.get<any[]>(`/api/bookings/lot/${this.lotId}`).subscribe({
      next: d => {
        this.bookings = d; this.filtered = d;
        this.counts = { ALL:d.length, RESERVED:d.filter(b=>b.status==='RESERVED').length, ACTIVE:d.filter(b=>b.status==='ACTIVE').length, COMPLETED:d.filter(b=>b.status==='COMPLETED').length, CANCELLED:d.filter(b=>b.status==='CANCELLED').length };
        this.loading = false;
      },
      error: err => { this.error = err.error?.message || 'Failed'; this.loading = false; }
    });
  }
  applyFilter(status: string) {
    this.filter = status;
    this.filtered = status === 'ALL' ? this.bookings : this.bookings.filter(b => b.status === status);
  }

  manualCheckout(id: number) {
    if (!confirm('Are you sure you want to manually check out this driver? The fare will be calculated up to this moment.')) return;
    this.api.put<any>(`/api/bookings/manager/${id}/checkout`, {}).subscribe({
      next: () => {
        alert('Manual checkout successful.');
        this.ngOnInit();
      },
      error: err => this.error = err.error?.message || 'Manual checkout failed'
    });
  }
}
