import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { DriverLayoutComponent } from '../../../layouts/driver-layout/driver-layout.component';
import { SpinnerComponent } from '../../../shared/ui/ui.components';

declare const Razorpay: any;

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [DriverLayoutComponent, SpinnerComponent],
  template: `
    <app-driver-layout [title]="alreadyPaid?'Payment Receipt':'Complete Payment'">
      <button topbar-right class="btn btn-outline btn-sm" (click)="router.navigate(['/driver/bookings'])">← My Bookings</button>
      @if (loading) { <app-spinner></app-spinner> }
      @if (!loading) {
        @if (error) {
          <div class="alert alert-danger">{{error}}<button (click)="error=''" style="margin-left:auto;background:none;border:none;cursor:pointer;opacity:0.6">✕</button></div>
        }
        @if (alreadyPaid) {
          <h1 style="font-family:var(--font-display);font-weight:800;font-size:1.5rem;margin-bottom:4px">Payment Complete ✅</h1>
          <p style="color:var(--muted);margin-bottom:24px">This booking has already been paid.</p>
          <div class="card" style="max-width:480px">
            <div style="text-align:center;padding:20px 0">
              <div style="font-size:3rem;margin-bottom:12px">✅</div>
              <h3 style="font-family:var(--font-display);font-weight:800;font-size:1.2rem">Booking #{{bookingId}} is paid</h3>
              <p style="margin-top:8px">Amount: <strong>₹{{booking?.totalAmount}}</strong></p>
              <p style="margin-top:4px;font-size:0.85rem;color:var(--muted)">Transaction ID: {{payment?.razorpayPaymentId || '—'}}</p>
            </div>
            <button class="btn btn-primary" style="width:100%;justify-content:center;margin-top:12px" (click)="router.navigate(['/driver/bookings'])">Back to My Bookings</button>
          </div>
        }
        @if (!alreadyPaid && booking) {
          <h1 style="font-family:var(--font-display);font-weight:800;font-size:1.5rem;margin-bottom:4px">Complete Your Payment</h1>
          <p style="color:var(--muted);margin-bottom:24px">Pay securely via Razorpay (Card, UPI, Net Banking)</p>
          <div class="card" style="max-width:480px">
            <h3 style="font-family:var(--font-display);font-weight:800;font-size:1.2rem;margin-bottom:16px">Booking Summary</h3>
            @for (row of summaryRows; track row[0]) {
              <div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid var(--border)">
                <span style="color:var(--muted);font-size:0.85rem">{{row[0]}}</span>
                <span style="font-weight:500;font-size:0.9rem">{{row[1]}}</span>
              </div>
            }
            <div style="display:flex;justify-content:space-between;padding:16px 0;border-top:2px solid var(--border)">
              <span style="font-weight:600;font-size:1rem">Total Amount</span>
              <span style="font-family:var(--font-display);font-weight:900;font-size:1.5rem;color:var(--accent)">₹{{booking?.totalAmount}}</span>
            </div>
            <button class="btn btn-primary" style="width:100%;justify-content:center;padding:12px;font-size:1rem;margin-top:4px" (click)="handlePay()" [disabled]="paying">
              {{paying?'Processing...':'💳 Pay ₹'+booking?.totalAmount+' via Razorpay'}}
            </button>
            <p style="text-align:center;margin-top:16px;font-size:0.75rem;color:var(--muted)">🔒 Secured by Razorpay.</p>
          </div>
        }
      }
    </app-driver-layout>
  `
})
export class PaymentComponent implements OnInit {
  bookingId = ''; booking: any = null; payment: any = null;
  loading = true; paying = false; error = '';

  constructor(public router: Router, private route: ActivatedRoute, private api: ApiService, private auth: AuthService) {}

  get alreadyPaid() { return this.payment?.status === 'PAID'; }
  get summaryRows() {
    if (!this.booking) return [];
    return [
      ['Booking ID',  `#${this.booking.bookingId}`],
      ['Spot',        `#${this.booking.spotId}`],
      ['Vehicle',     this.booking.vehiclePlate],
      ['Check-in',    this.booking.checkInTime ? new Date(this.booking.checkInTime).toLocaleString() : '—'],
      ['Check-out',   this.booking.checkOutTime ? new Date(this.booking.checkOutTime).toLocaleString() : '—'],
    ];
  }

  ngOnInit() {
    this.bookingId = this.route.snapshot.params['bookingId'];
    Promise.all([
      this.api.get<any>(`/api/bookings/${this.bookingId}`).toPromise(),
      this.api.get<any>(`/api/payments/booking/${this.bookingId}`).toPromise().catch(() => null)
    ]).then(([b, p]) => { this.booking = b; this.payment = p; })
      .catch(err => this.error = err.error?.message || 'Failed to load')
      .finally(() => this.loading = false);
  }

  handlePay() {
    this.paying = true; this.error = '';
    this.api.post<any>('/api/payments/order', {
      bookingId: Number(this.bookingId), amount: this.booking.totalAmount,
      description: `Parking Booking #${this.bookingId}`
    }).subscribe({
      next: order => {
        const options = {
          key: order.razorpayKeyId, amount: order.amount * 100, currency: 'INR', name: 'ParkEase',
          description: `Parking Booking #${this.bookingId}`, order_id: order.razorpayOrderId,
          handler: (response: any) => {
            this.api.post('/api/payments/verify', {
              razorpayOrderId: response.razorpay_order_id, razorpayPaymentId: response.razorpay_payment_id, razorpaySignature: response.razorpay_signature
            }).subscribe({
              next: () => this.router.navigate(['/driver/bookings'], { state: { success: '✅ Payment successful!' } }),
              error: err => { this.error = 'Payment verification failed: ' + (err.error?.message || err.message); this.paying = false; }
            });
          },
          prefill: { email: this.auth.getEmail() || '' },
          theme: { color: '#2563eb' },
          modal: { ondismiss: () => this.paying = false }
        };
        this.loadRazorpay().then(() => { const rzp = new Razorpay(options); rzp.open(); });
      },
      error: err => { this.error = err.error?.message || 'Failed to create order'; this.paying = false; }
    });
  }

  private loadRazorpay(): Promise<void> {
    if ((window as any)['Razorpay']) return Promise.resolve();
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(); script.onerror = reject;
      document.body.appendChild(script);
    });
  }
}
