import { Component, OnInit } from '@angular/core';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ManagerLayoutComponent } from '../../../layouts/manager-layout/manager-layout.component';
import { SpinnerComponent } from '../../../shared/ui/ui.components';

@Component({
  selector: 'app-lot-analytics',
  standalone: true,
  imports: [ManagerLayoutComponent, SpinnerComponent],
  template: `
    <app-manager-layout title="Lot Analytics">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <button class="btn btn-outline btn-sm" (click)="router.navigate(['/manager/lots'])">← Back</button>
        <button class="btn btn-primary btn-sm" (click)="downloadReport()" [disabled]="downloading">
          {{downloading ? 'Generating...' : '📥 Download PDF Report'}}
        </button>
      </div>
      <div style="margin-bottom:24px">
        <h1 style="font-family:var(--font-display);font-weight:800;font-size:1.5rem;margin-bottom:4px">Analytics — Lot #{{lotId}}</h1>
        <p style="color:var(--muted);font-size:0.9rem">Occupancy trends, revenue, and performance metrics.</p>
      </div>
      @if (error) { <div class="alert alert-danger">{{error}}<button (click)="error=''" style="margin-left:auto;background:none;border:none;cursor:pointer;opacity:0.6">✕</button></div> }
      @if (loading) { <app-spinner></app-spinner> }
      @if (!loading && summary) {
        <div class="stat-grid">
          <div class="stat-card"><div class="stat-icon" style="background:rgba(2,119,189,0.1);color:var(--info)">📊</div>
            <div class="stat-kicker">Current Occupancy</div><div class="stat-number">{{(summary.currentOccupancyRate*100).toFixed(0)}}%</div>
            <div class="stat-sub">{{summary.occupiedSpots}} / {{summary.totalSpots}} spots</div></div>
          <div class="stat-card"><div class="stat-icon" style="background:rgba(46,125,50,0.1);color:var(--success)">💰</div>
            <div class="stat-kicker">Revenue Today</div><div class="stat-number">₹{{summary.revenueToday?.toFixed(0)||0}}</div>
            <div class="stat-sub">₹{{summary.revenueThisMonth?.toFixed(0)||0}} this month</div></div>
          <div class="stat-card"><div class="stat-icon" style="background:rgba(245,127,23,0.1);color:var(--warning)">📋</div>
            <div class="stat-kicker">Bookings Today</div><div class="stat-number">{{summary.bookingsToday||0}}</div>
            <div class="stat-sub">{{summary.bookingsThisMonth||0}} this month</div></div>
          <div class="stat-card"><div class="stat-icon" style="background:rgba(139,92,246,0.1);color:#8b5cf6">⏱️</div>
            <div class="stat-kicker">Avg Duration</div>
            <div class="stat-number">{{summary.avgParkingDurationMinutes>0?((summary.avgParkingDurationMinutes/60).toFixed(1)+'h'):'—'}}</div>
            <div class="stat-sub">Per visit</div></div>
        </div>

        <div class="card" style="margin-bottom:24px">
          <div class="row-between mb-16"><h3 style="font-family:var(--font-display);font-weight:800;font-size:1.2rem">Current Occupancy</h3></div>
          <div style="display:flex;justify-content:space-between;font-size:0.85rem;color:var(--muted);margin-bottom:8px;font-weight:600">
            <span>{{summary.occupiedSpots}} occupied</span><span>{{summary.totalSpots-summary.occupiedSpots}} available</span>
          </div>
          <div class="progress-bar"><div class="progress-fill" [style.width]="(summary.currentOccupancyRate*100).toFixed(1)+'%'"
            [style.background]="summary.currentOccupancyRate>0.8?'var(--danger)':summary.currentOccupancyRate>0.5?'var(--warning)':'var(--success)'"></div></div>
        </div>

        @if (summary.peakHours?.length > 0) {
          <div class="card" style="margin-bottom:24px">
            <div class="row-between mb-16"><h3 style="font-family:var(--font-display);font-weight:800;font-size:1.2rem">Peak Hours</h3></div>
            <div style="display:flex;gap:12px;flex-wrap:wrap">
              @for (h of summary.peakHours; track h; let i = $index) {
                <div [style.background]="i===0?'#ef4444':i===1?'#f59e0b':'#3b82f6'"
                     style="color:white;border-radius:8px;padding:12px 24px;text-align:center;flex:1;min-width:100px">
                  <div style="font-size:1.5rem;font-weight:800;font-family:var(--font-display)">{{h}}:00</div>
                  <div style="font-size:0.75rem;opacity:0.9;text-transform:uppercase;font-weight:700;margin-top:4px">{{i===0?'🔥 Busiest':i===1?'🌟 2nd':'📈 3rd'}}</div>
                </div>
              }
            </div>
          </div>
        }

        <div class="card" style="margin-bottom:24px">
          <div class="row-between mb-16"><h3 style="font-family:var(--font-display);font-weight:800;font-size:1.2rem">24-Hour Occupancy Pattern</h3></div>
          <div style="display:flex;align-items:flex-end;gap:4px;height:140px;padding:16px 0 8px 0;border-bottom:1px solid var(--border)">
            @for (h of hours; track h) {
              <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px">
                <div [title]="h+':00 — '+(((hourly[h]||0)*100).toFixed(0))+'%'"
                     [style.height]="hourlyHeight(h)"
                     [style.background]="isPeakHour(h)?'#ef4444':'var(--border)'"
                     style="width:100%;border-radius:4px 4px 0 0;transition:all 0.3s"></div>
                @if (h % 6 === 0) { <div style="font-size:0.65rem;color:var(--muted);font-weight:700">{{h}}h</div> }
              </div>
            }
          </div>
          <p style="font-size:0.75rem;color:var(--muted);margin-top:8px"><span style="color:#ef4444">●</span> Red bars indicate peak hours</p>
        </div>

        <div class="card" style="margin-bottom:24px">
          <div class="row-between mb-16"><h3 style="font-family:var(--font-display);font-weight:800;font-size:1.2rem">Spot Type Utilisation</h3></div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:16px">
            @for (key of utilKeys; track key) {
              <div style="text-align:center;padding:20px 16px;background:var(--bg);border-radius:var(--radius-md);border:1px solid var(--border)">
                <div style="font-size:2rem;margin-bottom:8px">{{key.includes('TWO')?'🏍️':key.includes('FOUR')?'🚗':'🅿️'}}</div>
                <div style="font-size:0.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;font-weight:700">{{key.replace('_', ' ')}}</div>
                <div style="font-size:1.6rem;font-family:var(--font-display);font-weight:900;color:var(--accent);margin-top:4px">{{utilisation[key]?.toFixed(1)||0}}%</div>
              </div>
            }
            @if (utilKeys.length === 0) {
              <div style="grid-column:1/-1;text-align:center;padding:32px;color:var(--muted)">No spot utilisation data available yet.</div>
            }
          </div>
        </div>

        <div class="card">
          <div class="row-between mb-16"><h3 style="font-family:var(--font-display);font-weight:800;font-size:1.2rem">Revenue Summary</h3></div>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:16px">
            @for (r of revenueRows; track r[0]) {
              <div style="text-align:center;padding:20px 16px;background:var(--bg);border-radius:var(--radius-md)">
                <div style="font-size:0.75rem;color:var(--muted);text-transform:uppercase;letter-spacing:0.05em;font-weight:700">{{r[0]}}</div>
                <div style="font-size:1.6rem;font-family:var(--font-display);font-weight:900;color:var(--accent);margin-top:8px">{{r[1]}}</div>
              </div>
            }
          </div>
        </div>
      }
    </app-manager-layout>
  `
})
export class LotAnalyticsComponent implements OnInit {
  summary: any = null; hourly: any = {}; utilisation: any = {}; loading = true; error = ''; downloading = false;
  hours = Array.from({ length: 24 }, (_, i) => i);

  constructor(public router: Router, private route: ActivatedRoute, private api: ApiService) {}
  get lotId() { return this.route.snapshot.params['lotId']; }
  get maxHourly() { return Math.max(...Object.values(this.hourly as Record<string,number>), 0.01); }
  isPeakHour(h: number) { return this.summary?.peakHours?.includes(h); }
  hourlyHeight(h: number) { return `${Math.max(this.maxHourly > 0 ? (this.hourly[h] || 0) / this.maxHourly * 100 : 0, 4)}%`; }
  get revenueRows() {
    return [['Today', `₹${this.summary?.revenueToday?.toFixed(2)||'0.00'}`], ['This Month', `₹${this.summary?.revenueThisMonth?.toFixed(2)||'0.00'}`], ['All Time', `₹${this.summary?.revenueAllTime?.toFixed(2)||'0.00'}`]];
  }
  get utilKeys() { return Object.keys(this.utilisation || {}); }

  ngOnInit() {
    Promise.all([
      this.api.get<any>(`/api/analytics/lots/${this.lotId}/summary`).toPromise(),
      this.api.get<any>(`/api/analytics/lots/${this.lotId}/hourly`).toPromise(),
      this.api.get<any>(`/api/analytics/lots/${this.lotId}/utilisation`).toPromise()
    ]).then(([s, h, u]) => { 
      this.summary = s; 
      this.hourly = h || {}; 
      this.utilisation = u || {};
    })
      .catch(err => this.error = err.error?.message || 'Failed')
      .finally(() => this.loading = false);
  }

  downloadReport() {
    this.downloading = true;
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30); // Last 30 days
    
    const fromStr = start.toISOString().split('T')[0];
    const toStr = end.toISOString().split('T')[0];

    this.api.get<any>(`/api/analytics/lots/${this.lotId}/revenue?from=${fromStr}&to=${toStr}`).subscribe({
      next: (res) => {
        const doc = new jsPDF();
        
        doc.setFontSize(18);
        doc.text(`ParkEase Analytics Report - Lot #${this.lotId}`, 14, 22);
        
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Report Period: ${fromStr} to ${toStr}`, 14, 30);

        // Daily Revenue Table
        const revenueByDay = res.revenueByDay || {};
        const sortedDates = Object.keys(revenueByDay).sort();
        const tableData = sortedDates.map(date => [date, `Rs. ${revenueByDay[date].toFixed(2)}`]);

        autoTable(doc, {
          startY: 40,
          head: [['Date', 'Revenue']],
          body: tableData,
          theme: 'striped',
          headStyles: { fillColor: [233, 30, 99] } // ParkEase pink theme
        });

        let finalY = (doc as any).lastAutoTable.finalY || 40;

        // Summary Table
        autoTable(doc, {
          startY: finalY + 15,
          head: [['Summary Metric', 'Value']],
          body: [
            ['Total Revenue (Period)', `Rs. ${res.totalRevenue.toFixed(2)}`],
            ['Total Completed Bookings (Period)', `${res.completedBookings}`]
          ],
          theme: 'grid',
          headStyles: { fillColor: [33, 33, 33] }
        });

        finalY = (doc as any).lastAutoTable.finalY || finalY + 15;

        // Spot Utilisation Table
        if (Object.keys(this.utilisation).length > 0) {
          const utilData = this.utilKeys.map(key => [key.replace('_', ' '), `${this.utilisation[key]}%`]);
          
          autoTable(doc, {
            startY: finalY + 15,
            head: [['Spot Type', 'Utilisation (%)']],
            body: utilData,
            theme: 'grid',
            headStyles: { fillColor: [33, 33, 33] }
          });
        }

        doc.save(`Lot_${this.lotId}_Analytics_${toStr}.pdf`);
        this.downloading = false;
      },
      error: (err) => {
        this.error = 'Failed to download report.';
        this.downloading = false;
      }
    });
  }
}
