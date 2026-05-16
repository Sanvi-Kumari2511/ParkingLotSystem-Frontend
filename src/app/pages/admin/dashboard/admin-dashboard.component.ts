import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { AdminLayoutComponent } from '../../../layouts/admin-layout/admin-layout.component';
import { SpinnerComponent } from '../../../shared/ui/ui.components';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [AdminLayoutComponent, SpinnerComponent],
  template: `
    <app-admin-layout>
      <div style="margin-bottom:24px">
        <h1 style="font-family:var(--font-display);font-weight:800;font-size:1.5rem;margin-bottom:4px">Admin Dashboard ⚙️</h1>
        <p style="color:var(--muted);font-size:0.9rem">Platform-wide overview for {{name}}.</p>
      </div>
      @if (error) { <div class="alert alert-danger">{{error}}<button (click)="error=''" style="margin-left:auto;background:none;border:none;cursor:pointer;opacity:0.6">✕</button></div> }
      @if (loading) { <app-spinner></app-spinner> }
      @if (!loading && platform) {
        <div class="stat-grid">
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
          <div class="row-between mb-16">
            <h3 style="font-family:var(--font-display);font-weight:800;font-size:1.2rem">Platform Occupancy Rate</h3>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:0.85rem;color:var(--muted);margin-bottom:8px;font-weight:600">
            <span>{{platform.totalOccupiedSpots}} occupied</span>
            <span>{{(platform.platformOccupancyRate||0).toFixed(1)}}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" [style.width]="(platform.platformOccupancyRate||0)+'%'"
                 [style.background]="(platform.platformOccupancyRate||0)>80?'var(--danger)':(platform.platformOccupancyRate||0)>50?'var(--warning)':'var(--success)'"></div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px">
          @for (card of quickLinks; track card.title) {
            <div class="card" style="cursor:pointer;display:flex;flex-direction:column" (click)="router.navigate([card.path])">
              <div style="font-size:2rem;margin-bottom:16px">{{card.icon}}</div>
              <h3 style="font-family:var(--font-display);font-weight:800;font-size:1.2rem;margin-bottom:6px">{{card.title}}</h3>
              <p style="font-size:0.85rem;color:var(--muted);margin-bottom:20px">{{card.desc}}</p>
              <div style="margin-top:auto"><button class="btn btn-outline btn-sm">{{card.btn}} →</button></div>
            </div>
          }
        </div>
      }
    </app-admin-layout>
  `
})
export class AdminDashboardComponent implements OnInit {
  platform: any = null; loading = true; error = '';

  constructor(public router: Router, private api: ApiService, private auth: AuthService) {}

  get name() { return this.auth.getUserName(); }
  get statCards() {
    if (!this.platform) return [];
    return [
      { icon:'🏢', label:'Active Lots',    value: this.platform.totalActiveLots||0,    sub:`${this.platform.totalOccupiedSpots||0} occupied`, cls:'info' },
      { icon:'🅿',  label:'Total Spots',    value: this.platform.totalSpots||0,          sub:`${this.platform.totalOccupiedSpots||0} occupied`, cls:'success' },
      { icon:'📋', label:'Bookings Today', value: this.platform.totalBookingsToday||0,  sub:`${this.platform.totalBookingsAllTime||0} all time`, cls:'warning' },
      { icon:'💰', label:'Revenue Today',  value:`₹${(this.platform.totalRevenueToday||0).toFixed(0)}`, sub:`₹${(this.platform.totalRevenueAllTime||0).toFixed(0)} all time`, cls:'accent' },
    ];
  }
  quickLinks = [
    { icon:'👥', title:'Manage Users',   desc:'View, suspend or delete user accounts.',     path:'/admin/users',     btn:'Manage Users' },
    { icon:'🏢', title:'Approve Lots',   desc:'Review and approve new lot registrations.',  path:'/admin/lots',      btn:'Review Lots' },
    { icon:'📋', title:'All Bookings',   desc:'Platform-wide booking history.',             path:'/admin/bookings',  btn:'View Bookings' },
    { icon:'📊', title:'Analytics',      desc:'Revenue and occupancy analytics.',           path:'/admin/analytics', btn:'View Analytics' },
  ];

  ngOnInit() {
    this.api.get<any>('/api/analytics/platform').subscribe({
      next: d => { this.platform = d; this.loading = false; },
      error: err => { this.error = err.error?.message || 'Failed to load'; this.loading = false; }
    });
  }
}
