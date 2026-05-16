import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { AdminLayoutComponent } from '../../../layouts/admin-layout/admin-layout.component';
import { SpinnerComponent } from '../../../shared/ui/ui.components';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

@Component({
  selector: 'app-platform-analytics',
  standalone: true,
  imports: [AdminLayoutComponent, SpinnerComponent],
  template: `
    <app-admin-layout>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">
        <div>
          <h1 style="font-family:var(--font-display);font-weight:800;font-size:1.5rem;margin-bottom:4px">Platform Analytics</h1>
          <p style="color:var(--muted);font-size:0.9rem">Real-time platform performance overview.</p>
        </div>
        <button class="btn btn-primary btn-sm" (click)="downloadReport()" [disabled]="downloading">
          {{downloading ? 'Generating...' : '📥 Download Platform Report'}}
        </button>
      </div>
      @if (error) { <div class="alert alert-danger">{{error}}<button (click)="error=''" style="margin-left:auto;background:none;border:none;cursor:pointer;opacity:0.6">✕</button></div> }
      @if (loading) { <app-spinner></app-spinner> }
      @if (!loading && data) {
        <div class="stat-grid" style="margin-bottom:32px">
          @for (s of statCards; track s.label) {
            <div class="stat-card">
              <div class="stat-icon" [class]="'ic-'+s.cls">{{s.icon}}</div>
              <div class="stat-kicker">{{s.label}}</div>
              <div class="stat-number">{{s.value}}</div>
              <div class="stat-sub">{{s.sub}}</div>
            </div>
          }
        </div>
        <div class="card" style="margin-bottom:24px">
          <h3 style="font-family:var(--font-display);font-weight:800;font-size:1.2rem;margin-bottom:16px">Revenue Overview</h3>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:16px">
            @for (r of revenueRows; track r[0]) {
              <div style="text-align:center;padding:20px;background:var(--bg);border-radius:var(--radius-md)">
                <div style="font-size:0.75rem;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:0.05em">{{r[0]}}</div>
                <div style="font-size:1.8rem;font-family:var(--font-display);font-weight:900;color:var(--accent);margin-top:8px">{{r[1]}}</div>
              </div>
            }
          </div>
        </div>
        <div class="card">
          <h3 style="font-family:var(--font-display);font-weight:800;font-size:1.2rem;margin-bottom:16px">Platform Occupancy</h3>
          <div style="display:flex;justify-content:space-between;font-size:0.85rem;color:var(--muted);margin-bottom:8px;font-weight:600">
            <span>{{data.totalOccupiedSpots||0}} of {{data.totalSpots||0}} spots occupied</span>
            <span>{{(data.platformOccupancyRate||0).toFixed(1)}}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" [style.width]="(data.platformOccupancyRate||0)+'%'"
                 [style.background]="(data.platformOccupancyRate||0)>80?'var(--danger)':(data.platformOccupancyRate||0)>50?'var(--warning)':'var(--success)'"></div>
          </div>
        </div>
      }
    </app-admin-layout>
  `
})
export class PlatformAnalyticsComponent implements OnInit {
  data: any = null; loading = true; error = '';
  downloading = false;

  constructor(private api: ApiService) {}

  get statCards() {
    if (!this.data) return [];
    return [
      { icon:'🏢', label:'Total Lots',       value: this.data.totalActiveLots||0,             sub:'Active lots', cls:'info' },
      { icon:'🅿',  label:'Total Spots',      value: this.data.totalSpots||0,                  sub:`${this.data.totalOccupiedSpots||0} occupied`, cls:'success' },
      { icon:'📋', label:'Bookings Today',   value: this.data.totalBookingsToday||0,           sub:`${this.data.totalBookingsAllTime||0} all time`, cls:'warning' },
      { icon:'👥', label:'Total Drivers',    value: this.data.totalDrivers||0,                sub:'Registered drivers', cls:'accent' },
      { icon:'🏗️', label:'Total Managers',   value: this.data.totalLotManagers||0,            sub:'Lot managers', cls:'info' },
      { icon:'⭐', label:'Avg Occupancy',    value:`${(this.data.averageLotOccupancyRate||0).toFixed(0)}%`, sub:'Per lot', cls:'success' },
    ];
  }

  get revenueRows() {
    if (!this.data) return [];
    return [
      ['Today',      `₹${(this.data.totalRevenueToday||0).toFixed(2)}`],
      ['This Month', `₹${(this.data.totalRevenueThisMonth||0).toFixed(2)}`],
      ['All Time',   `₹${(this.data.totalRevenueAllTime||0).toFixed(2)}`],
    ];
  }

  ngOnInit() {
    this.api.get<any>('/api/analytics/platform').subscribe({
      next: d => { this.data = d; this.loading = false; },
      error: err => { this.error = err.error?.message || 'Failed to load analytics'; this.loading = false; }
    });
  }

  downloadReport() {
    this.downloading = true;
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30); // Default to last 30 days

    const sd = start.toISOString().split('T')[0];
    const ed = end.toISOString().split('T')[0];

    this.api.get<any>(`/api/analytics/platform/revenue?from=${sd}&to=${ed}`).subscribe({
      next: (report) => {
        const doc = new jsPDF();
        
        // Header
        doc.setFillColor(30, 30, 30);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.text('ParkEase Platform Financial Report', 14, 20);
        doc.setFontSize(11);
        doc.setTextColor(200, 200, 200);
        doc.text(`Period: ${report.fromDate} to ${report.toDate}`, 14, 30);

        // Revenue Table
        doc.setTextColor(0, 0, 0);
        const revData = Object.entries(report.revenueByDay).map(([date, amt]) => [date, `Rs. ${Number(amt).toFixed(2)}`]);
        
        autoTable(doc, {
          startY: 50,
          head: [['Date', 'Daily Platform Revenue']],
          body: revData,
          theme: 'striped',
          headStyles: { fillColor: [41, 128, 185], fontSize: 12 },
          margin: { left: 14, right: 14 },
          styles: { fontSize: 10 }
        });

        // Summary box
        const finalY = (doc as any).lastAutoTable.finalY + 15;
        doc.setFillColor(41, 128, 185);
        doc.rect(14, finalY, 182, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(14);
        doc.text('Platform Summary Metrics', 20, finalY + 10);
        doc.setFontSize(11);
        doc.text(`Total Platform Revenue: Rs. ${report.totalRevenue.toFixed(2)}`, 20, finalY + 20);
        doc.text(`Total Completed Bookings: ${report.completedBookings}`, 120, finalY + 20);

        doc.save(`ParkEase_Platform_Financials_${ed}.pdf`);
        this.downloading = false;
      },
      error: () => {
        this.error = 'Failed to generate report.';
        this.downloading = false;
      }
    });
  }
}
