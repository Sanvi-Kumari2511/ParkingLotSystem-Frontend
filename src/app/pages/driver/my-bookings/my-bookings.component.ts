import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { DriverLayoutComponent } from '../../../layouts/driver-layout/driver-layout.component';
import { SpinnerComponent, EmptyStateComponent, ModalComponent } from '../../../shared/ui/ui.components';

@Component({
  selector: 'app-my-bookings',
  standalone: true,
  imports: [FormsModule, DriverLayoutComponent, SpinnerComponent, EmptyStateComponent, ModalComponent, DatePipe],
  template: `
    <app-driver-layout title="My Bookings" subtitle="Manage your parking reservations.">
      @if (error) {
        <div class="alert alert-danger">{{error}}<button (click)="error=''" style="margin-left:auto;background:none;border:none;cursor:pointer;opacity:0.6">✕</button></div>
      }
      @if (success) {
        <div class="alert alert-success">{{success}}<button (click)="success=''" style="margin-left:auto;background:none;border:none;cursor:pointer;opacity:0.6">✕</button></div>
      }
      @if (loading) { <app-spinner></app-spinner> }
      @if (!loading && bookings.length === 0) {
        <app-empty-state icon="📋" title="No bookings yet" message="Book a parking spot to get started.">
          <button class="btn btn-primary" (click)="router.navigate(['/driver/search'])">Find Parking</button>
        </app-empty-state>
      }
      @if (!loading && bookings.length > 0) {
        <div style="display:flex;flex-direction:column;gap:16px">
          @for (b of bookings; track b.bookingId) {
            <div class="card" style="padding:20px 28px">
              <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">
                <div style="font-family:var(--font-display);font-weight:900;font-size:1.05rem">BOOKING #{{b.bookingId}}</div>
                <div [style.background]="statusBg(b)" [style.color]="statusFg(b)" style="padding:3px 12px;border-radius:999px;font-size:0.7rem;font-weight:800;text-transform:uppercase;display:flex;align-items:center;gap:5px">
                  <span style="width:6px;height:6px;background:currentColor;border-radius:50%"></span>{{b.status}}
                </div>
              </div>
              <div style="height:1px;background:rgba(0,0,0,0.06);margin:0 -28px 18px -28px"></div>
              <div style="display:grid;grid-template-columns:1.5fr 1fr 1fr;gap:12px 20px;margin-bottom:18px">
                <div>
                  <div style="font-size:0.65rem;font-weight:800;text-transform:uppercase;letter-spacing:0.07em;color:var(--muted);margin-bottom:5px">Spot · Lot · Vehicle</div>
                  <div style="font-size:0.88rem">Spot #{{b.spotId}} · Lot #{{b.lotId}} · <span style="color:var(--accent);font-weight:600">{{b.vehiclePlate}}</span></div>
                </div>
                <div>
                  <div style="font-size:0.65rem;font-weight:800;text-transform:uppercase;letter-spacing:0.07em;color:var(--muted);margin-bottom:5px">Start</div>
                  <div style="font-size:0.88rem">{{b.startTime | date:'short'}}</div>
                </div>
                <div>
                  <div style="font-size:0.65rem;font-weight:800;text-transform:uppercase;letter-spacing:0.07em;color:var(--muted);margin-bottom:5px">End</div>
                  <div style="font-size:0.88rem">{{b.endTime | date:'short'}}</div>
                </div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 20px;margin-bottom:16px">
                <div>
                  <div style="font-size:0.65rem;font-weight:800;text-transform:uppercase;letter-spacing:0.07em;color:var(--muted);margin-bottom:5px">Amount</div>
                  <div style="font-size:1.05rem;color:var(--accent);font-weight:800;font-family:var(--font-display)">₹{{b.totalAmount>0?b.totalAmount:b.estimatedAmount}}</div>
                </div>
                <div>
                  <div style="font-size:0.65rem;font-weight:800;text-transform:uppercase;letter-spacing:0.07em;color:var(--muted);margin-bottom:5px">Payment</div>
                  @if (isPaid(b)) {
                    <div style="font-size:0.85rem;color:#059669;display:flex;align-items:center;gap:5px;font-weight:700"><span style="width:6px;height:6px;background:currentColor;border-radius:50%"></span>Payment Successful</div>
                  } @else if (canPay(b)) {
                    <div style="font-size:0.85rem;color:var(--warning);font-weight:700">Pending</div>
                  } @else {
                    <div style="font-size:0.85rem;color:var(--muted)">—</div>
                  }
                </div>
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap">
                @if (b.status === 'RESERVED') {
                  <button class="btn btn-primary btn-sm" [disabled]="!canCheckIn(b)" (click)="action('/api/bookings/'+b.bookingId+'/checkin')">Check In</button>
                  @if (!canCheckIn(b)) {
                    <span style="font-size:0.75rem;color:var(--muted);align-self:center">Available at {{b.startTime | date:'shortTime'}}</span>
                  }
                }
                @if (b.status === 'ACTIVE') {
                  <button class="btn btn-outline btn-sm" (click)="action('/api/bookings/'+b.bookingId+'/checkout')">Check Out</button>
                }
                @if (b.status === 'ACTIVE' || b.status === 'RESERVED') {
                  <button class="btn btn-outline btn-sm" (click)="openExtend(b.bookingId)">Extend</button>
                }
                @if (b.status === 'RESERVED') {
                  <button class="btn btn-ghost btn-sm" style="color:var(--danger)" (click)="openCancel(b)">Cancel</button>
                }
                @if (canPay(b)) {
                  <button class="btn btn-primary btn-sm" (click)="router.navigate(['/driver/payment',b.bookingId])">Pay ₹{{b.totalAmount}}</button>
                }
              </div>
            </div>
          }
        </div>
      }

      <!-- Cancel Confirmation Modal -->
      <app-modal [isOpen]="!!cancelModal" title="Cancel Booking" [showFooter]="true" (closed)="cancelModal=null">
        @if (cancelModal) {
          <div style="display:flex;flex-direction:column;gap:16px">
            <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:14px 16px">
              <div style="font-weight:700;font-size:0.9rem;margin-bottom:6px;color:#92400e">⚠️ Cancellation Policy</div>
              <p style="font-size:0.82rem;color:#78350f;line-height:1.5;margin:0">
                Cancellations are permanent and cannot be undone. Please ensure you really want to cancel this booking before proceeding.
              </p>
            </div>
            <div style="background:var(--surface);border-radius:10px;padding:14px 16px;display:flex;flex-direction:column;gap:8px">
              <div style="display:flex;justify-content:space-between;font-size:0.85rem">
                <span style="color:var(--muted)">Booking</span>
                <span style="font-weight:700">#{{cancelModal.bookingId}}</span>
              </div>
              <div style="display:flex;justify-content:space-between;font-size:0.85rem">
                <span style="color:var(--muted)">Amount</span>
                <span style="font-weight:700;color:var(--accent)">₹{{cancelModal.estimatedAmount || cancelModal.totalAmount}}</span>
              </div>
            </div>
            <p style="font-size:0.8rem;color:var(--muted);margin:0">Are you sure you want to cancel this booking? This action cannot be undone.</p>
          </div>
        }
        <div modal-footer style="display:flex;gap:12px;justify-content:flex-end;width:100%">
          <button class="btn btn-outline" (click)="cancelModal=null" [disabled]="cancelling">Keep Booking</button>
          <button class="btn btn-ghost" style="color:var(--danger)" [disabled]="cancelling" (click)="confirmCancel()">
            {{cancelling ? 'Cancelling...' : 'Cancel Booking'}}
          </button>
        </div>
      </app-modal>



      <!-- Extend Booking Modal -->
      <app-modal [isOpen]="!!extendModal" title="Extend Booking" [showFooter]="true" (closed)="extendModal=null">
        <div class="form-group">
          <label class="form-label">New End Time</label>
          <input class="form-control" type="datetime-local" [(ngModel)]="newEndTime" [min]="minTime" />
        </div>
        <div modal-footer style="display:flex;gap:12px;justify-content:flex-end;width:100%">
          <button class="btn btn-outline" (click)="extendModal=null">Close</button>
          <button class="btn btn-primary" (click)="handleExtend()">Extend</button>
        </div>
      </app-modal>
    </app-driver-layout>
  `
})
export class MyBookingsComponent implements OnInit {
  bookings: any[] = [];
  paidBookingIds = new Set<number>();
  loading = true; error = ''; success = '';
  extendModal: number | null = null; newEndTime = '';
  cancelModal: any = null; cancelling = false;
  minTime = new Date().toISOString().slice(0, 16);
  private interval: any;

  constructor(public router: Router, private api: ApiService) {}
  ngOnInit()    { this.load(); }
  ngOnDestroy() { clearInterval(this.interval); }

  load() {
    this.loading = true;
    Promise.all([
      this.api.get<any[]>('/api/bookings/my').toPromise(),
      this.api.get<any[]>('/api/payments/my').toPromise().catch(() => [])
    ]).then(([b, p]) => {
      this.bookings          = b || [];
      this.paidBookingIds    = new Set((p || []).filter((pay: any) => pay.status === 'PAID').map((pay: any) => pay.bookingId));
    }).catch(err => this.error = err.error?.message || 'Failed to load')
      .finally(() => this.loading = false);
  }

  statusBg(b: any) { return b.status==='COMPLETED'?'#fef2f2':b.status==='ACTIVE'?'#ecfdf5':b.status==='RESERVED'?'#eff6ff':b.status==='CANCELLED'?'#fff7ed':'#f3f4f6'; }
  statusFg(b: any) { return b.status==='COMPLETED'?'#c84b2f':b.status==='ACTIVE'?'#059669':b.status==='RESERVED'?'#3b82f6':b.status==='CANCELLED'?'#d97706':'#6b7280'; }
  canCheckIn(b: any) { return b.status === 'RESERVED' && new Date() >= new Date(b.startTime); }
  canPay(b: any)     { return b.status === 'COMPLETED' && b.totalAmount > 0 && !this.paidBookingIds.has(b.bookingId); }
  isPaid(b: any)     { return b.status === 'COMPLETED' && b.totalAmount > 0 && this.paidBookingIds.has(b.bookingId); }

  action(path: string) {
    this.error = '';
    this.api.put<any>(path).subscribe({
      next: () => { this.success = 'Action completed!'; this.load(); },
      error: err => this.error = err.error?.message || 'Action failed'
    });
  }

  openCancel(b: any)  { this.cancelModal = b; }

  confirmCancel() {
    if (!this.cancelModal || this.cancelling) return;
    this.cancelling = true;
    const bookingId = this.cancelModal.bookingId;
    const wasPaid   = this.paidBookingIds.has(bookingId);

    // Step 1: Cancel the booking
    this.api.put<any>(`/api/bookings/${bookingId}/cancel`).subscribe({
      next: () => {
        this.success = `Booking #${bookingId} has been cancelled.`;
        this.cancelModal = null; this.cancelling = false; this.load();
      },
      error: err => {
        this.error = err.error?.message || 'Cancellation failed';
        this.cancelling = false;
      }
    });
  }

  openExtend(id: number) { this.extendModal = id; this.newEndTime = ''; }
  handleExtend() {
    if (!this.newEndTime) return;
    const fmt = this.newEndTime.length === 16 ? `${this.newEndTime}:00` : this.newEndTime;
    this.api.put<any>(`/api/bookings/${this.extendModal}/extend`, { newEndTime: fmt }).subscribe({
      next: () => { this.success = 'Booking extended!'; this.extendModal = null; this.load(); },
      error: err => this.error = err.error?.message || 'Failed to extend'
    });
  }
}
