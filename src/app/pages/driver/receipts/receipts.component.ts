import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';
import { DriverLayoutComponent } from '../../../layouts/driver-layout/driver-layout.component';
import { SpinnerComponent, EmptyStateComponent } from '../../../shared/ui/ui.components';

@Component({
  selector: 'app-receipts',
  standalone: true,
  imports: [DriverLayoutComponent, SpinnerComponent, EmptyStateComponent, DatePipe],
  template: `
    <app-driver-layout title="My Receipts" subtitle="Download PDF receipts for all your completed payments.">
      @if (error) { <div class="alert alert-danger">{{error}}<button (click)="error=''" style="margin-left:auto;background:none;border:none;cursor:pointer;opacity:0.6">✕</button></div> }
      @if (loading) { <app-spinner></app-spinner> }
      @if (!loading && payments.length === 0) {
        <app-empty-state icon="🧾" title="No receipts yet" message="Receipts appear here after a completed payment."></app-empty-state>
      }
      @if (!loading && payments.length > 0) {
        <div style="display:flex;flex-direction:column;gap:20px">
          @for (p of payments; track p.paymentId) {
            <div class="card" style="padding:24px 32px">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
                <div>
                  <div style="font-family:var(--font-display);font-weight:900;font-size:1.1rem;text-transform:uppercase;display:flex;gap:6px">
                    <span>BOOKING #{{p.bookingId}}</span><span style="color:var(--muted)">·</span><span>PAYMENT #{{p.paymentId}}</span>
                  </div>
                  @if (p.razorpayPaymentId) {
                    <div style="font-size:0.75rem;font-family:monospace;color:var(--muted);margin-top:4px">TXN: {{p.razorpayPaymentId}}</div>
                  }
                </div>
                <div style="font-size:0.85rem;color:var(--muted);font-weight:500">{{p.paidAt ? (p.paidAt | date:'short') : '—'}}</div>
              </div>
              <hr style="border:none;border-top:1px solid rgba(0,0,0,0.05);margin:0 -32px 16px -32px" />
              <div style="display:flex;justify-content:space-between;align-items:center">
                <div style="display:flex;align-items:center;gap:16px">
                  <div style="font-family:var(--font-display);font-weight:900;font-size:2rem;color:var(--accent)">₹{{p.amount}}</div>
                  <div style="background:#f0fdf4;color:#22c55e;padding:4px 10px;border-radius:999px;font-size:0.65rem;font-weight:800;text-transform:uppercase;display:flex;align-items:center;gap:6px">
                    <span style="width:6px;height:6px;background:currentColor;border-radius:50%"></span>{{p.status}}
                  </div>
                </div>
                <button class="btn btn-outline btn-sm" style="border-radius:999px;font-size:0.75rem;font-weight:800;padding:8px 24px;letter-spacing:0.05em"
                  (click)="downloadReceipt(p.paymentId)" [disabled]="downloading===p.paymentId">
                  {{downloading===p.paymentId ? '⏳ DOWNLOADING...' : '↓ DOWNLOAD PDF'}}
                </button>
              </div>
            </div>
          }
        </div>
      }
    </app-driver-layout>
  `
})
export class ReceiptsComponent implements OnInit {
  payments: any[] = []; loading = true; error = ''; downloading: number | null = null;
  constructor(private api: ApiService) {}
  ngOnInit() {
    this.api.get<any[]>('/api/payments/my').subscribe({
      next: d => { this.payments = d.filter(p => p.status === 'PAID'); this.loading = false; },
      error: err => { this.error = err.error?.message || 'Failed'; this.loading = false; }
    });
  }
  downloadReceipt(paymentId: number) {
    this.downloading = paymentId;
    this.api.download(`/api/payments/${paymentId}/receipt`).subscribe({
      next: blob => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `ParkEase_Receipt_${paymentId}.pdf`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url); this.downloading = null;
      },
      error: () => { this.error = 'Receipt not available.'; this.downloading = null; }
    });
  }
}
