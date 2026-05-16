import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { DriverLayoutComponent } from '../../../layouts/driver-layout/driver-layout.component';
import { SpinnerComponent, ModalComponent } from '../../../shared/ui/ui.components';

@Component({
  selector: 'app-lot-detail',
  standalone: true,
  imports: [FormsModule, DriverLayoutComponent, SpinnerComponent, ModalComponent],
  template: `
    <app-driver-layout [title]="lot?.name || 'Lot Detail'">
      <div topbar-right style="display:flex;gap:8px">
        <button class="btn btn-outline btn-sm" (click)="loadSpots()">🔄 Refresh</button>
        <button class="btn btn-outline btn-sm" (click)="router.navigate(['/driver/search'])">← Back</button>
      </div>
      @if (loading) { <app-spinner></app-spinner> }
      @if (!loading) {
        @if (error)   { <div class="alert alert-danger">{{error}}<button (click)="error=''" style="margin-left:auto;background:none;border:none;cursor:pointer;opacity:0.6">✕</button></div> }
        @if (success) { <div class="alert alert-success">{{success}}<button (click)="success=''" style="margin-left:auto;background:none;border:none;cursor:pointer;opacity:0.6">✕</button></div> }
        <div style="max-width:820px;margin:0 auto">
          @if (lot) {
            <div class="card" style="margin-bottom:24px">
              <div class="row-between mb-8">
                <div>
                  <h2 style="font-family:var(--font-display);font-weight:800;font-size:1.5rem;margin-bottom:4px">{{lot.name}}</h2>
                  <p style="color:var(--muted);font-size:0.85rem">📍 {{lot.address}}, {{lot.city}}</p>
                </div>
                <span class="badge" [class]="lot.open?'badge-success':'badge-danger'">{{lot.open?'● Open':'● Closed'}}</span>
              </div>
              <div style="display:flex;gap:24px;font-size:0.9rem;color:var(--text-soft);font-weight:500">
                <div>🅿 {{available}} available of {{spots.length}}</div>
                <div>🕐 {{lot.openTime}} – {{lot.closeTime}}</div>
              </div>
            </div>
          }
          <div class="legend-bar" style="margin-bottom:24px;font-size:0.85rem;flex-wrap:wrap;gap:8px">
            <div style="display:flex;gap:8px;align-items:center">
              <button
                (click)="setFilter('available')"
                [style]="'display:flex;align-items:center;gap:8px;padding:5px 14px;border-radius:20px;border:2px solid '+(spotFilter==='available'?'var(--accent)':'var(--border)')+';background:'+(spotFilter==='available'?'rgba(236,72,153,0.08)':'#fff')+';cursor:pointer;font-size:0.82rem;font-weight:700;transition:all 0.18s;color:'+(spotFilter==='available'?'var(--accent)':'var(--text)')"
              >
                <div style="width:14px;height:14px;border-radius:3px;background:#fff;border:2px solid var(--border);flex-shrink:0"></div>
                Available
              </button>
              <button
                (click)="setFilter('reserved')"
                [style]="'display:flex;align-items:center;gap:8px;padding:5px 14px;border-radius:20px;border:2px solid '+(spotFilter==='reserved'?'rgba(2,119,189,0.8)':'rgba(2,119,189,0.3)')+';background:'+(spotFilter==='reserved'?'rgba(2,119,189,0.12)':'rgba(2,119,189,0.04)')+';cursor:pointer;font-size:0.82rem;font-weight:700;transition:all 0.18s;color:'+(spotFilter==='reserved'?'#0277bd':'var(--text)')"
              >
                <div style="width:14px;height:14px;border-radius:3px;background:rgba(2,119,189,0.12);border:2px solid rgba(2,119,189,0.35);flex-shrink:0"></div>
                Reserved / Occupied
              </button>
              @if (spotFilter !== 'all') {
                <button
                  (click)="setFilter('all')"
                  style="padding:5px 10px;border-radius:20px;border:1px solid var(--border);background:transparent;cursor:pointer;font-size:0.78rem;color:var(--muted);font-weight:600"
                >✕ Show All</button>
              }
            </div>
            @if (selected) {
              <div style="margin-left:auto;display:flex;align-items:center;gap:12px">
                <strong>✓ {{selected.spotNumber}} — ₹{{selected.pricePerHour}}/hr</strong>
                <button class="btn btn-primary btn-sm" (click)="showModal=true;error=''">Book This Spot</button>
              </div>
            }
          </div>
          @for (floor of floorKeys; track floor) {
            <div style="margin-bottom:32px">
              <div class="floor-header">
                <div class="floor-title">{{floor}}</div>
                <span style="font-size:0.85rem;color:var(--muted);font-weight:700">{{availableOnFloor(floor)}} available</span>
              </div>
              <div class="spot-grid">
                @for (spot of filteredSpotsOnFloor(floor); track spot.spotId) {
                  <div class="spot-cell" [class]="getSpotClass(spot)" (click)="selectSpot(spot)"
                       [style.cursor]="spot.status === 'AVAILABLE' ? 'pointer' : 'not-allowed'"
                       [title]="spot.status === 'AVAILABLE'
                         ? (spot.spotNumber + ' — ' + (spot.vehicleType === 'TWO_WHEELER' ? 'Bike' : spot.vehicleType === 'FOUR_WHEELER' ? 'Car' : 'Heavy') + ' — ₹' + spot.pricePerHour + '/hr — Click to select')
                         : (spot.spotNumber + ' — ' + spot.status + ' (not available)')">
                    <div class="spot-cell-num">{{spot.spotNumber}}</div>
                    <div class="spot-cell-type">
                      {{spot.vehicleType === 'TWO_WHEELER' ? '🏍️' : spot.vehicleType === 'FOUR_WHEELER' ? '🚗' : spot.vehicleType === 'HEAVY' ? '🚚' : ''}}
                      {{spot.isEVCharging?'⚡':spot.isHandicapped?'♿':spot.spotType}}
                    </div>
                  </div>
                }
                @if (filteredSpotsOnFloor(floor).length === 0) {
                  <div style="grid-column:1/-1;padding:16px;text-align:center;color:var(--muted);font-size:0.85rem">No spots match the selected filter.</div>
                }
              </div>
            </div>
          }
        </div>
      }
      <app-modal [isOpen]="showModal" [title]="'Book Spot '+(selected?.spotNumber||'')" [showFooter]="true" (closed)="showModal=false;error=''">
        @if (selected) {
          <div class="alert alert-info" style="margin-bottom:12px">
            <div style="display:flex;justify-content:space-between;width:100%">
              <span>🅿 <strong>{{selected.spotNumber}}</strong> — {{selected.spotType}} <strong>({{selected.vehicleType === 'TWO_WHEELER' ? 'Bike' : selected.vehicleType === 'FOUR_WHEELER' ? 'Car' : 'Heavy'}})</strong>{{selected.isEVCharging?' ⚡':''}}{{selected.isHandicapped?' ♿':''}}</span>
              <strong>₹{{selected.pricePerHour}}/hr</strong>
            </div>
            @if (estimate) { <div style="margin-top:6px;font-size:0.85rem">💰 Estimated fare: <strong>₹{{estimate}}</strong></div> }
          </div>
        }
        @if (error) { <div class="alert alert-danger">{{error}}</div> }
        <div class="form-group">
          <label class="form-label">Vehicle Plate Number</label>
          <input class="form-control" placeholder="MH01AB1234" [(ngModel)]="form.vehiclePlate" list="vehicle-suggestions" style="text-transform:uppercase" />
          <datalist id="vehicle-suggestions">
            @for (v of vehicles; track v.vehicleId) { <option [value]="v.licensePlate"></option> }
          </datalist>
        </div>
        <div class="form-group">
          <label class="form-label">Booking Type</label>
          <select class="form-control" [(ngModel)]="form.bookingType" (ngModelChange)="onBookingTypeChange($event)">
            <option value="PRE_BOOKING">Pre-Booking (Reserve in advance)</option>
            <option value="DRIVE_IN">Walk-in (Immediate on arrival)</option>
          </select>
        </div>
        @if (!isWalkIn) {
          <div class="form-group">
            <label class="form-label">Start Time</label>
            <input class="form-control" type="datetime-local" [(ngModel)]="form.startTime" [min]="minTime" />
          </div>
        }
        @if (isWalkIn) {
          <div class="alert alert-info" style="font-size:0.82rem;padding:8px 12px;margin-bottom:4px">
            ⏱ Walk-in start time will be set to <strong>right now</strong> automatically.
          </div>
        }
        <div class="form-group">
          <label class="form-label">End Time</label>
          <input class="form-control" type="datetime-local" [(ngModel)]="form.endTime" [min]="form.startTime||minTime" />
        </div>
        <div modal-footer style="display:flex;gap:12px;justify-content:flex-end;width:100%">
          <button class="btn btn-outline" (click)="showModal=false;error=''">Cancel</button>
          <button class="btn btn-primary" (click)="book()" [disabled]="bookingLoading">{{bookingLoading?'Booking...':'Confirm Booking'}}</button>
        </div>
      </app-modal>
    </app-driver-layout>
  `
})
export class LotDetailComponent implements OnInit {
  lot: any = null; spots: any[] = []; vehicles: any[] = [];
  selected: any = null; loading = true; bookingLoading = false;
  showModal = false; error = ''; success = '';
  spotsGroups: Record<string, any[]> = {};
  filterAvailable = true;
  filterReserved = true;
  spotFilter: 'all' | 'available' | 'reserved' = 'all';
  form = { vehiclePlate: '', bookingType: 'PRE_BOOKING', startTime: '', endTime: '' };
  minTime = new Date().toISOString().slice(0, 16);

  constructor(public router: Router, private route: ActivatedRoute, private api: ApiService, private auth: AuthService) {}
  get lotId() { return this.route.snapshot.params['lotId']; }
  get floorKeys() { return Object.keys(this.spotsGroups); }
  get available() { return this.spots.filter(s => s.status === 'AVAILABLE').length; }
  availableOnFloor(f: string) { return this.spotsGroups[f]?.filter(s => s.status === 'AVAILABLE').length || 0; }
  filteredSpotsOnFloor(f: string): any[] {
    return (this.spotsGroups[f] || []).filter(s => {
      if (this.spotFilter === 'all') return true;
      if (this.spotFilter === 'available') return s.status === 'AVAILABLE';
      // 'reserved' shows ALL taken spots: RESERVED (orange) + OCCUPIED (pink/red)
      if (this.spotFilter === 'reserved')  return s.status === 'RESERVED' || s.status === 'OCCUPIED';
      return true;
    });
  }
  setFilter(f: 'all' | 'available' | 'reserved') {
    // clicking the active filter resets to 'all'
    this.spotFilter = this.spotFilter === f ? 'all' : f;
  }
  get isWalkIn() { return this.form.bookingType === 'DRIVE_IN'; }
  get estimate() {
    const start = this.isWalkIn ? new Date().toISOString().slice(0, 16) : this.form.startTime;
    if (!start || !this.form.endTime || !this.selected) return null;
    const diff = new Date(this.form.endTime).getTime() - new Date(start).getTime();
    if (diff <= 0) return null;
    return (Math.max(1, diff / 3600000) * this.selected.pricePerHour).toFixed(2);
  }

  onBookingTypeChange(type: string) {
    if (type === 'DRIVE_IN') {
      // Auto-set startTime to now; user cannot override it
      this.form.startTime = new Date().toISOString().slice(0, 16);
    } else {
      this.form.startTime = '';
    }
  }

  ngOnInit() {
    Promise.all([
      this.api.get<any>(`/api/lots/${this.lotId}`).toPromise(),
      this.api.get<any[]>('/api/vehicles/my').toPromise()
    ]).then(([l, v]) => { this.lot = l; this.vehicles = v || []; return this.loadSpots(); })
      .finally(() => this.loading = false);
  }

  loadSpots(): Promise<void> {
    return Promise.all([
      this.api.get<any[]>(`/api/spots/lot/${this.lotId}`).toPromise(),
      this.api.get<any[]>('/api/bookings/my').toPromise()
    ]).then(([spotsData, bookings]) => {
      const reservedIds = (bookings || [])
        .filter((b: any) => b.lotId === Number(this.lotId) && ['RESERVED','ACTIVE'].includes(b.status) && new Date(b.endTime) > new Date())
        .map((b: any) => b.spotId);
      this.setSpots((spotsData || []).map((s: any) => {
        if (s.status === 'OCCUPIED') return s;
        if (reservedIds.includes(s.spotId)) return { ...s, status: 'RESERVED' };
        return s;
      }));
    }).catch(err => console.error(err));
  }

  setSpots(s: any[]) {
    this.spots = s; this.spotsGroups = {};
    s.forEach(sp => { const f = `Floor ${sp.floor}`; if (!this.spotsGroups[f]) this.spotsGroups[f] = []; this.spotsGroups[f].push(sp); });
  }

  getSpotClass(spot: any) {
    const base = `spot-cell spot-${(spot.status || 'available').toLowerCase()}`;
    return this.selected?.spotId === spot.spotId ? base + ' spot-selected' : base;
  }

  selectSpot(spot: any) {
    // Only AVAILABLE spots can be selected — Reserved and Occupied are blocked
    if (spot.status === 'AVAILABLE') this.selected = spot;
  }

  book() {
    this.error = '';
    if (!this.form.vehiclePlate.trim()) { this.error = 'Please enter your vehicle plate number.'; return; }
    // For Walk-in, auto-fill startTime to right now before submitting
    if (this.isWalkIn) { this.form.startTime = new Date().toISOString().slice(0, 16); }
    if (!this.form.endTime) { this.error = 'Please select an end time.'; return; }
    if (!this.isWalkIn && !this.form.startTime) { this.error = 'Please select a start time.'; return; }
    if (new Date(this.form.endTime) <= new Date(this.form.startTime)) { this.error = 'End time must be after start time.'; return; }
    const toISO = (dt: string) => dt.length === 16 ? `${dt}:00` : dt;
    this.bookingLoading = true;
    this.api.post<any>('/api/bookings', {
      lotId: Number(this.lotId), spotId: this.selected.spotId,
      vehiclePlate: this.form.vehiclePlate.toUpperCase().trim(),
      bookingType: this.form.bookingType,
      startTime: toISO(this.form.startTime), endTime: toISO(this.form.endTime)
    }).subscribe({
      next: booking => {
        const bookedId = this.selected.spotId;
        this.spots = this.spots.map(s => s.spotId === bookedId ? { ...s, status: 'RESERVED' } : s);
        this.setSpots(this.spots);
        this.success = `Booking #${booking.bookingId} confirmed! Spot ${this.selected.spotNumber} is now reserved.`;
        this.showModal = false; this.selected = null;
        this.form = { vehiclePlate: '', bookingType: 'PRE_BOOKING', startTime: '', endTime: '' };
        this.bookingLoading = false; this.loadSpots();
      },
      error: err => { this.error = err.error?.message || 'Booking failed'; this.bookingLoading = false; }
    });
  }
}
