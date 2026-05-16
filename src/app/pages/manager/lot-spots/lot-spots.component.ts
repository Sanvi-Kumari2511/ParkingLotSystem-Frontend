import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ManagerLayoutComponent } from '../../../layouts/manager-layout/manager-layout.component';
import { SpinnerComponent, EmptyStateComponent, ModalComponent } from '../../../shared/ui/ui.components';

@Component({
  selector: 'app-lot-spots',
  standalone: true,
  imports: [FormsModule, ManagerLayoutComponent, SpinnerComponent, EmptyStateComponent, ModalComponent],
  template: `
    <app-manager-layout title="Manage Spots">
      <div topbar-right style="display:flex;gap:8px">
        <button class="btn btn-outline btn-sm" (click)="router.navigate(['/manager/lots'])">← Back</button>
        <button class="btn btn-outline btn-sm" (click)="showBulk=true">+ Bulk Add</button>
        <button class="btn btn-primary btn-sm" (click)="openAdd()">+ Add Spot</button>
      </div>
      <div style="margin-bottom:24px">
        <h1 style="font-family:var(--font-display);font-weight:800;font-size:1.5rem;margin-bottom:4px">Parking Spots — Lot #{{lotId}}</h1>
        <p style="color:var(--muted);font-size:0.9rem">{{spots.length}} total spots · {{availableCount}} available</p>
      </div>
      @if (error)   { <div class="alert alert-danger">{{error}}<button (click)="error=''" style="margin-left:auto;background:none;border:none;cursor:pointer;opacity:0.6">✕</button></div> }
      @if (success) { <div class="alert alert-success">{{success}}<button (click)="success=''" style="margin-left:auto;background:none;border:none;cursor:pointer;opacity:0.6">✕</button></div> }
      @if (loading) { <app-spinner></app-spinner> }
      @if (!loading && spots.length === 0) {
        <app-empty-state icon="🅿" title="No spots yet" message="Add spots or use bulk create.">
          <button class="btn btn-primary" (click)="showBulk=true">Bulk Create Spots</button>
        </app-empty-state>
      }
      @if (!loading && spots.length > 0) {
        @for (floor of floorKeys; track floor) {
          <div class="card" style="margin-bottom:24px">
            <div class="row-between mb-16">
              <h4 style="font-family:var(--font-display);font-weight:800;font-size:1.1rem">{{floor}}</h4>
              <span style="font-size:0.85rem;color:var(--muted);font-weight:700">{{availableOnFloor(floor)}} / {{spotsGroups[floor].length}} available</span>
            </div>
            <div class="table-wrap">
              <table>
                <thead><tr><th>Spot #</th><th>Type</th><th>Vehicle</th><th>Price/hr</th><th>Features</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  @for (s of spotsGroups[floor]; track s.spotId) {
                    <tr>
                      <td><strong>{{s.spotNumber}}</strong></td>
                      <td>{{s.spotType}}</td>
                      <td>{{s.vehicleType?.replace('_',' ')}}</td>
                      <td>₹{{s.pricePerHour}}</td>
                      <td>
                        @if (s.isEVCharging) { <span class="badge badge-success" style="margin-right:4px">⚡ EV</span> }
                        @if (s.isHandicapped) { <span class="badge badge-info">♿</span> }
                      </td>
                      <td><span class="badge" [class]="s.status==='AVAILABLE'?'badge-success':s.status==='OCCUPIED'?'badge-danger':'badge-warning'">{{s.status}}</span></td>
                      <td><button class="btn btn-danger btn-sm" (click)="deleteSpot(s.spotId)" [disabled]="s.status!=='AVAILABLE'">🗑️</button></td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      }
      <!-- Add Single -->
      <app-modal [isOpen]="showAdd" title="Add Single Spot" [showFooter]="true" (closed)="showAdd=false">
        <div class="form-row">
          <div class="form-group"><label class="form-label">Spot Number</label><input class="form-control" placeholder="A-01" [(ngModel)]="form.spotNumber" name="sn" /></div>
          <div class="form-group"><label class="form-label">Floor</label><input class="form-control" type="number" min="0" [(ngModel)]="form.floor" name="fl" /></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Spot Type</label>
            <select class="form-control" [(ngModel)]="form.spotType" name="st">
              @for (t of spotTypes; track t) { <option [value]="t">{{t}}</option> }
            </select>
          </div>
          <div class="form-group"><label class="form-label">Vehicle Type</label>
            <select class="form-control" [(ngModel)]="form.vehicleType" name="vt">
              <option value="TWO_WHEELER">Two Wheeler</option><option value="FOUR_WHEELER">Four Wheeler</option><option value="HEAVY">Heavy</option>
            </select>
          </div>
        </div>
        <div class="form-group"><label class="form-label">Price Per Hour (₹)</label><input class="form-control" type="number" min="1" [(ngModel)]="form.pricePerHour" name="ph" /></div>
        <div style="display:flex;gap:20px;margin-bottom:8px">
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:0.875rem"><input type="checkbox" [(ngModel)]="form.isEVCharging" name="ev" /> ⚡ EV Charging</label>
          <label style="display:flex;align-items:center;gap:6px;cursor:pointer;font-size:0.875rem"><input type="checkbox" [(ngModel)]="form.isHandicapped" name="hc" /> ♿ Handicapped</label>
        </div>
        <div modal-footer style="display:flex;gap:12px;justify-content:flex-end;width:100%">
          <button class="btn btn-outline" (click)="showAdd=false">Cancel</button>
          <button class="btn btn-primary" (click)="addSpot()">Add Spot</button>
        </div>
      </app-modal>
      <!-- Bulk -->
      <app-modal [isOpen]="showBulk" title="Bulk Create Spots" [showFooter]="true" (closed)="showBulk=false">
        <div class="alert alert-info" style="margin-bottom:12px">Spots will be named: <strong>{{bulk.prefix}}{{bulk.floor}}-01, -02 ...</strong></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Prefix</label><input class="form-control" [(ngModel)]="bulk.prefix" name="bp" /></div>
          <div class="form-group"><label class="form-label">Number of Spots</label><input class="form-control" type="number" min="1" max="200" [(ngModel)]="bulk.count" name="bc" /></div>
        </div>
        <div class="form-group"><label class="form-label">Floor</label><input class="form-control" type="number" min="0" [(ngModel)]="bulk.floor" name="bf" /></div>
        <div class="form-group"><label class="form-label">Price Per Hour (₹)</label><input class="form-control" type="number" min="1" [(ngModel)]="bulk.pricePerHour" name="bph" /></div>
        <div modal-footer style="display:flex;gap:12px;justify-content:flex-end;width:100%">
          <button class="btn btn-outline" (click)="showBulk=false">Cancel</button>
          <button class="btn btn-primary" (click)="addBulk()">Create Spots</button>
        </div>
      </app-modal>
    </app-manager-layout>
  `
})
export class LotSpotsComponent implements OnInit {
  spots: any[] = []; loading = true; showAdd = false; showBulk = false;
  error = ''; success = '';
  spotsGroups: Record<string, any[]> = {};
  spotTypes = ['COMPACT','STANDARD','LARGE','MOTORBIKE','EV'];
  form = { spotNumber:'', floor:0, spotType:'STANDARD', vehicleType:'FOUR_WHEELER', isEVCharging:false, isHandicapped:false, pricePerHour:50 };
  bulk = { prefix:'A', count:10, floor:0, spotType:'STANDARD', vehicleType:'FOUR_WHEELER', isEVCharging:false, isHandicapped:false, pricePerHour:50 };

  constructor(public router: Router, private route: ActivatedRoute, private api: ApiService) {}
  get lotId() { return this.route.snapshot.params['lotId']; }
  get floorKeys() { return Object.keys(this.spotsGroups); }
  get availableCount() { return this.spots.filter(s => s.status === 'AVAILABLE').length; }
  availableOnFloor(f: string) { return this.spotsGroups[f]?.filter(s => s.status === 'AVAILABLE').length || 0; }

  ngOnInit() { this.load(); }

  load() {
    this.api.get<any[]>(`/api/spots/lot/${this.lotId}`).subscribe({
      next: d => { this.spots = d; this.setGroups(d); this.loading = false; },
      error: err => { this.error = err.error?.message || 'Failed'; this.loading = false; }
    });
  }

  setGroups(s: any[]) {
    this.spotsGroups = {};
    s.forEach(sp => { const f = `Floor ${sp.floor}`; if (!this.spotsGroups[f]) this.spotsGroups[f] = []; this.spotsGroups[f].push(sp); });
  }

  openAdd() { this.form = { spotNumber:'', floor:0, spotType:'STANDARD', vehicleType:'FOUR_WHEELER', isEVCharging:false, isHandicapped:false, pricePerHour:50 }; this.showAdd = true; }

  addSpot() {
    this.error = '';
    this.api.post('/api/spots', { ...this.form, lotId: Number(this.lotId), floor: Number(this.form.floor), pricePerHour: Number(this.form.pricePerHour) }).subscribe({
      next: () => { this.success = 'Spot added.'; this.showAdd = false; this.load(); },
      error: err => this.error = err.error?.message || 'Failed'
    });
  }

  addBulk() {
    this.error = '';
    this.api.post<any[]>('/api/spots/bulk', { ...this.bulk, lotId: Number(this.lotId), count: Number(this.bulk.count), floor: Number(this.bulk.floor), pricePerHour: Number(this.bulk.pricePerHour) }).subscribe({
      next: res => { this.success = `${res.length} spots created.`; this.showBulk = false; this.load(); },
      error: err => this.error = err.error?.message || 'Failed'
    });
  }

  deleteSpot(spotId: number) {
    if (!confirm('Delete this spot?')) return;
    this.api.delete(`/api/spots/${spotId}`).subscribe({
      next: () => this.load(),
      error: err => this.error = err.error?.message || 'Failed'
    });
  }
}
