import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { SpinnerComponent, EmptyStateComponent } from '../../../shared/ui/ui.components';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [FormsModule, RouterModule, SpinnerComponent, EmptyStateComponent],
  template: `
    <div style="min-height:100vh;background:#0a0514;color:#f0ede8;">
      <div class="pub-nav" style="border-bottom: 1px solid rgba(255,255,255,0.05);">
        <div class="pub-logo">
          <div class="pub-logo-box">P</div>
          <div class="pub-logo-name" style="color:#fff;">ParkEase</div>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <button class="btn btn-outline" style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;font-weight:800;padding:0 20px;height:38px;border-radius:999px;border:1px solid rgba(255,255,255,0.2);color:#fff;" (click)="router.navigate(['/login'])">Sign In</button>
          <button class="btn btn-primary" style="font-size:11px;text-transform:uppercase;letter-spacing:0.06em;font-weight:800;padding:0 24px;height:38px;border-radius:999px" (click)="router.navigate(['/register'])">Get Started</button>
        </div>
      </div>
      <div style="padding:24px 32px">
        <div class="hero-section" style="text-align:center;display:flex;flex-direction:column;align-items:center;margin-bottom:60px;">
          <div class="hero-eyebrow">&#9670; Seamless Urban Mobility</div>
          <div class="hero-h1">Park smarter.<br><span class="hero-h1-accent">Not harder.</span></div>
          <div class="hero-sub">Find, book, and pay for your ideal parking space in seconds. The city is yours to explore.</div>
          <form class="hero-search" (ngSubmit)="searchByCity()">
            <input [(ngModel)]="city" name="city" placeholder="Search by city, area or landmark..." />
            <button type="submit" class="btn btn-primary" style="font-size:13px;text-transform:uppercase;letter-spacing:0.08em;font-weight:800;">Search</button>
            <button type="button" class="nearby-btn" (click)="searchNearby()"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> Near Me</button>
          </form>
        </div>
        @if (error) {
          <div class="alert alert-danger" style="margin-top:24px">{{error}}<button (click)="error=''" style="margin-left:auto;background:none;border:none;cursor:pointer;opacity:0.6">✕</button></div>
        }
        @if (!searched && !loading) {
          <div class="feature-cards">
            @for (f of features; track f.title) {
              <div class="feature-card">
                <div class="feature-icon" [innerHTML]="f.icon"></div>
                <div style="font-family:var(--font-display);font-weight:700;font-size:15px;margin-bottom:6px;color:var(--text)">{{f.title}}</div>
                <div style="font-size:13px;color:var(--text-soft);line-height:1.55">{{f.desc}}</div>
              </div>
            }
          </div>
        }
        @if (loading) {
          <div style="padding:60px 0"><app-spinner></app-spinner></div>
        }
        @if (searched && !loading) {
          <div style="margin-top:24px">
            @if (lots.length === 0) {
              <app-empty-state icon="🔍" title="No lots found" message="Try a different city or use 'Near Me'."></app-empty-state>
            } @else {
              <div style="font-size:12px;color:var(--muted);margin-bottom:16px">
                <span style="font-family:var(--font-display);font-weight:700;font-size:18px;color:var(--text)">{{lots.length}}</span> parking lot{{lots.length!==1?'s':''}} found
              </div>
              <div style="display:flex;flex-wrap:wrap;gap:16px">
                @for (lot of lots; track lot.lotId) {
                  <div class="lot-card" style="cursor:pointer;width:100%;max-width:450px" (click)="router.navigate(['/guest/lots',lot.lotId])">
                    <div class="row-between" style="align-items:flex-start;margin-bottom:16px">
                      <div>
                        <div style="font-family:var(--font-display);font-weight:800;font-size:18px;color:var(--text);margin-bottom:4px">{{lot.name}}</div>
                        <div style="font-size:12px;color:var(--muted)">{{lot.address}}, {{lot.city}}</div>
                      </div>
                      <button class="btn" style="font-size:10px;text-transform:uppercase;letter-spacing:0.06em;font-weight:800;padding:0 16px;height:32px;border-radius:999px;border:1px solid rgba(200,75,47,0.3);color:var(--accent);background:transparent">View Spots →</button>
                    </div>
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:24px">
                      <span class="badge" [class]="lot.open ? 'badge-success' : 'badge-danger'" style="text-transform:uppercase;font-size:10px;font-weight:800">{{lot.open ? '• Open' : '• Closed'}}</span>
                      <span class="badge badge-muted" style="font-size:10px;font-weight:800">{{lot.availableSpots}}/{{lot.totalSpots}} spots</span>
                    </div>
                    <div class="progress-bar">
                      <div class="progress-fill" [style.width]="getPct(lot)+'%'" [style.background]="getPct(lot)>80?'var(--danger)':getPct(lot)>50?'var(--warning)':'var(--success)'"></div>
                    </div>
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class LandingComponent {
  city = ''; lots: any[] = []; loading = false; error = ''; searched = false;
  features = [
    { icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`, title: 'Instant Booking', desc: 'Reserve your spot in seconds. No waiting, no hassle — just park.' },
    { icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>`, title: 'Live Availability', desc: 'See real-time spot availability across all lots near you.' },
    { icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`, title: 'Easy Payments', desc: 'Secure in-app payments with instant receipts and history.' },
    { icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`, title: 'Smart Alerts', desc: 'Get notified about your booking, check-in, and check-out times.' },
  ];

  constructor(public router: Router, private api: ApiService) {}

  getPct(lot: any) { return lot.totalSpots > 0 ? ((lot.totalSpots - lot.availableSpots) / lot.totalSpots) * 100 : 0; }

  searchByCity() {
    if (!this.city.trim()) return;
    this.loading = true; this.error = ''; this.searched = true;
    this.api.get<any[]>(`/api/lots/city/${this.city.trim()}`).subscribe({
      next: d => { this.lots = d; this.loading = false; },
      error: err => { this.error = err.error?.message || 'Search failed'; this.loading = false; }
    });
  }

  searchNearby() {
    if (!navigator.geolocation) { this.error = 'Geolocation not supported.'; return; }
    this.loading = true; this.error = ''; this.searched = true;
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lon } = pos.coords;
        this.api.get<any[]>(`/api/lots/nearby?lat=${lat}&lon=${lon}&radius=10`).subscribe({
          next: d => { this.lots = d; this.loading = false; },
          error: err => { this.error = err.error?.message || 'Failed'; this.loading = false; }
        });
      },
      () => { this.error = 'Could not get your location.'; this.loading = false; }
    );
  }
}
