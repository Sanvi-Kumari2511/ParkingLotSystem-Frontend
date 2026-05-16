import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { SpinnerComponent } from '../../../shared/ui/ui.components';

@Component({
  selector: 'app-guest-lot-detail',
  standalone: true,
  imports: [SpinnerComponent],
  template: `
    <div style="min-height:100vh;background:var(--bg)">
      <div class="pub-nav">
        <div class="pub-logo"><div class="pub-logo-box">P</div><div class="pub-logo-name">ParkEase</div></div>
        <div style="display:flex;align-items:center;gap:12px">
          <button class="btn btn-outline btn-sm" (click)="router.navigate(['/login'])">Sign In</button>
          <button class="btn btn-primary btn-sm" (click)="router.navigate(['/register'])">Get Started</button>
        </div>
      </div>
      <div style="padding:20px 32px">
        <div style="max-width:820px;margin:0 auto">
          @if (loading) { <div style="padding:60px 0"><app-spinner></app-spinner></div> }
          @if (!loading) {
            @if (error) { <div class="alert alert-danger">{{error}}</div> }
            <div style="margin-bottom:16px"><button class="btn btn-outline btn-sm" (click)="router.navigate(['/'])">← Back to Search</button></div>
            @if (selected) {
              <div class="spot-confirm-bar" style="margin-bottom:16px">
                <div>
                  <div style="font-weight:700;font-size:14px;color:var(--accent)">✓ Spot {{selected.spotNumber}} selected — ₹{{selected.pricePerHour}}/hr</div>
                  <div style="font-size:12px;color:var(--muted);margin-top:2px">Sign in or create a free account to complete your booking</div>
                </div>
                <div class="row gap-8">
                  <button class="btn btn-outline btn-sm" (click)="router.navigate(['/login'])">Sign In</button>
                  <button class="btn btn-primary btn-sm" (click)="guestBook()">Book Spot {{selected.spotNumber}} →</button>
                </div>
              </div>
            }
            @if (lot) {
              <div class="card" style="margin-bottom:16px">
                <div class="row-between">
                  <div>
                    <div style="font-family:var(--font-display);font-weight:900;font-size:24px;text-transform:uppercase;letter-spacing:-0.02em;margin-bottom:4px">{{lot.name}}</div>
                    <div style="font-size:13px;color:var(--muted)">📍 {{lot.address}}, {{lot.city}}</div>
                  </div>
                  <div class="col" style="align-items:flex-end;gap:8px">
                    <div class="row gap-8">
                      <span class="badge" [class]="lot.open?'badge-success':'badge-danger'">{{lot.open?'● Open':'● Closed'}}</span>
                      <span class="badge badge-muted">{{available}} available of {{spots.length}}</span>
                    </div>
                    <div style="font-size:12px;color:var(--muted)">🕐 {{lot.openTime}} – {{lot.closeTime}}</div>
                  </div>
                </div>
              </div>
            }
            <div class="row-between" style="margin-bottom:18px">
              <div class="legend-bar">
                <span class="badge badge-success">Available</span>
                <span class="badge badge-muted">Reserved</span>
                <span class="badge badge-danger">Occupied</span>
              </div>
              <button class="btn btn-outline btn-sm" (click)="loadSpots()">↻ Refresh</button>
            </div>
            @for (floor of floorKeys; track floor) {
              <div style="margin-bottom:32px">
                <div class="floor-header">
                  <div class="floor-title">{{floor}}</div>
                  <div style="font-size:12px;color:var(--muted)">{{availableOnFloor(floor)}} available</div>
                </div>
                <div class="spot-grid">
                  @for (spot of spotsGroups[floor]; track spot.spotId) {
                    <div class="spot-cell" [class]="getSpotClass(spot)" (click)="selectSpot(spot)"
                         [title]="spot.status==='AVAILABLE'?'₹'+spot.pricePerHour+'/hr':spot.status">
                      <span class="spot-cell-num">{{spot.spotNumber}}</span>
                      <span class="spot-cell-type">{{spot.isEVCharging?'EV':spot.isHandicapped?'HC':spot.spotType||'STD'}}</span>
                    </div>
                  }
                </div>
              </div>
            }
            @if (!selected) {
              <div style="text-align:center;padding:36px 24px;margin-top:16px;background:var(--offset);border-radius:var(--radius-lg);border:1px solid var(--border)">
                <div style="font-family:var(--font-display);font-weight:900;font-size:22px;text-transform:uppercase;margin-bottom:8px">Ready to park smarter?</div>
                <div style="font-size:13px;color:var(--text-soft);margin-bottom:20px">Create a free account to book, manage, and pay for parking in seconds.</div>
                <div style="display:flex;align-items:center;justify-content:center;gap:12px">
                  <button class="btn btn-outline btn-md" (click)="router.navigate(['/login'])">Sign In</button>
                  <button class="btn btn-primary btn-md" (click)="router.navigate(['/register'])">Create Free Account →</button>
                </div>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `
})
export class GuestLotDetailComponent implements OnInit {
  lot: any = null; spots: any[] = []; selected: any = null; loading = true; error = '';
  spotsGroups: Record<string, any[]> = {};

  constructor(public router: Router, private route: ActivatedRoute, private api: ApiService) {}

  get lotId() { return this.route.snapshot.params['lotId']; }
  get floorKeys() { return Object.keys(this.spotsGroups); }
  get available() { return this.spots.filter(s => s.status === 'AVAILABLE').length; }
  availableOnFloor(f: string) { return this.spotsGroups[f]?.filter(s => s.status === 'AVAILABLE').length || 0; }

  ngOnInit() {
    Promise.all([
      this.api.get<any>(`/api/lots/${this.lotId}`).toPromise(),
      this.api.get<any[]>(`/api/spots/lot/${this.lotId}`).toPromise()
    ]).then(([l, s]) => { this.lot = l; this.setSpots(s || []); })
      .catch(err => this.error = err.error?.message || 'Failed to load')
      .finally(() => this.loading = false);
  }

  loadSpots() {
    this.api.get<any[]>(`/api/spots/lot/${this.lotId}`).subscribe({
      next: s => this.setSpots(s), error: err => this.error = err.error?.message || 'Failed'
    });
  }

  setSpots(s: any[]) {
    this.spots = s; this.spotsGroups = {};
    s.forEach(sp => { const f = `Floor ${sp.floor}`; if (!this.spotsGroups[f]) this.spotsGroups[f] = []; this.spotsGroups[f].push(sp); });
  }

  getSpotClass(spot: any) {
    const base = `spot-cell spot-${(spot.status||'available').toLowerCase()}`;
    return this.selected?.spotId === spot.spotId ? base + ' spot-selected' : base;
  }

  selectSpot(spot: any) {
    if (spot.status !== 'AVAILABLE') return;
    this.selected = this.selected?.spotId === spot.spotId ? null : spot;
  }

  guestBook() {
    sessionStorage.setItem('redirectAfterLogin', `/driver/lots/${this.lotId}`);
    this.router.navigate(['/login'], { state: { message: '👋 Please sign in to book this spot.' } });
  }
}
