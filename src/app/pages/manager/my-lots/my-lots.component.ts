import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ManagerLayoutComponent } from '../../../layouts/manager-layout/manager-layout.component';
import { SpinnerComponent, EmptyStateComponent, ModalComponent } from '../../../shared/ui/ui.components';

@Component({
  selector: 'app-my-lots',
  standalone: true,
  imports: [FormsModule, ManagerLayoutComponent, SpinnerComponent, EmptyStateComponent, ModalComponent],
  template: `
    <app-manager-layout>
      <button topbar-right class="btn btn-primary btn-sm" (click)="openAdd()">+ Register Lot</button>
      <div style="margin-bottom:24px">
        <h1 style="font-family:var(--font-display);font-weight:800;font-size:1.5rem;margin-bottom:4px">MY PARKING LOTS</h1>
        <p style="color:var(--muted);font-size:0.9rem">Register and manage your parking facilities.</p>
      </div>
      @if (error)   { <div class="alert alert-danger">{{error}}<button (click)="error=''" style="margin-left:auto;background:none;border:none;cursor:pointer;opacity:0.6">✕</button></div> }
      @if (success) { <div class="alert alert-success">{{success}}<button (click)="success=''" style="margin-left:auto;background:none;border:none;cursor:pointer;opacity:0.6">✕</button></div> }
      @if (loading) { <app-spinner></app-spinner> }
      @if (!loading && lots.length === 0) {
        <app-empty-state icon="🏢" title="No lots registered" message="Register your first parking facility to get started.">
          <button class="btn btn-primary" (click)="openAdd()">Register Lot</button>
        </app-empty-state>
      }
      @if (!loading && lots.length > 0) {
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:24px">
          @for (lot of lots; track lot.lotId) {
            <div class="card" style="padding:24px;display:flex;flex-direction:column">
              @if (lot.imageUrl) {
                <img [src]="lot.imageUrl" [alt]="lot.name" style="margin:-24px -24px 16px -24px;height:160px;width:calc(100%+48px);object-fit:cover;border-radius:var(--radius-md) var(--radius-md) 0 0" />
              }
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">
                <div>
                  <h3 style="font-family:var(--font-display);font-weight:800;font-size:1.2rem;display:flex;align-items:center;gap:8px">
                    {{lot.name}} <span style="font-size:0.75rem;padding:2px 6px;background:var(--border);border-radius:4px;color:var(--text-soft);font-weight:700">Lot #{{lot.lotId}}</span>
                  </h3>
                  <p style="font-size:0.85rem;color:var(--muted);margin-top:4px">📍 {{lot.address}}, {{lot.city}}</p>
                </div>
                <span class="badge" [class]="lot.approved?'badge-success':'badge-warning'">{{lot.approved?'Approved':'Pending'}}</span>
              </div>
              <div style="display:flex;gap:16px;margin-bottom:20px;font-size:0.85rem;color:var(--text-soft)">
                <span>🅿 {{lot.availableSpots}}/{{lot.totalSpots}} spots</span>
                <span>🕐 {{lot.openTime}} – {{lot.closeTime}}</span>
              </div>
              @if (!lot.approved && lot.adminFeedback) {
                <div style="background:rgba(239,68,68,0.1);color:var(--danger);padding:12px;border-radius:var(--radius-md);margin-bottom:16px;font-size:0.85rem;border:1px solid rgba(239,68,68,0.2)">
                  <strong style="display:block;margin-bottom:4px">Admin Feedback:</strong>
                  {{lot.adminFeedback}}
                </div>
              }
              <div style="display:flex;justify-content:space-between;align-items:center;background:var(--bg);padding:12px 16px;border-radius:var(--radius-md);margin-bottom:16px">
                <span style="font-size:0.85rem;font-weight:600">Status: <span [style.color]="lot.open?'var(--success)':'var(--danger)'">{{lot.open?'● Open':'● Closed'}}</span></span>
                <button class="btn btn-sm" [class]="lot.open?'btn-outline':'btn-primary'" [style.borderColor]="lot.open?'var(--danger)':''" [style.color]="lot.open&&!lot.approved?'var(--danger)':''" (click)="toggle(lot.lotId)" [disabled]="!lot.approved">{{lot.open?'Close Lot':'Open Lot'}}</button>
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:auto;padding-top:16px;border-top:1px solid var(--border)">
                <button class="btn btn-outline btn-sm" (click)="openEdit(lot)">Edit</button>
                <button class="btn btn-outline btn-sm" (click)="router.navigate(['/manager/lots',lot.lotId,'spots'])">Spots</button>
                <button class="btn btn-outline btn-sm" (click)="router.navigate(['/manager/lots',lot.lotId,'bookings'])">Bookings</button>
                <button class="btn btn-primary btn-sm" style="margin-left:auto" (click)="router.navigate(['/manager/lots',lot.lotId,'analytics'])">Analytics</button>
              </div>
            </div>
          }
        </div>
      }
      <app-modal [isOpen]="showModal" [title]="editing?'Edit Parking Lot':'Register Parking Lot'" [showFooter]="true" (closed)="showModal=false;error=''">
        @if (error) { <div class="alert alert-danger">{{error}}</div> }
        <form (ngSubmit)="save()">
          <div class="form-group"><label class="form-label">Lot Name</label><input class="form-control" placeholder="MG Road Parking" [(ngModel)]="form.name" name="name" required /></div>
          <div class="form-group"><label class="form-label">Address</label><input class="form-control" placeholder="123 MG Road" [(ngModel)]="form.address" name="address" required /></div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">City</label><input class="form-control" placeholder="Mumbai" [(ngModel)]="form.city" name="city" required /></div>
            <div class="form-group"><label class="form-label">Total Spots</label><input class="form-control" type="number" min="1" placeholder="50" [(ngModel)]="form.totalSpots" name="totalSpots" required /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Latitude</label><input class="form-control" type="number" step="any" placeholder="19.0760" [(ngModel)]="form.latitude" name="lat" required /></div>
            <div class="form-group"><label class="form-label">Longitude</label><input class="form-control" type="number" step="any" placeholder="72.8777" [(ngModel)]="form.longitude" name="lon" required /></div>
          </div>
          <div class="form-row">
            <div class="form-group"><label class="form-label">Open Time</label><input class="form-control" type="time" [(ngModel)]="form.openTime" name="ot" /></div>
            <div class="form-group"><label class="form-label">Close Time</label><input class="form-control" type="time" [(ngModel)]="form.closeTime" name="ct" /></div>
          </div>
          <div class="form-group"><label class="form-label">Image URL (optional)</label><input class="form-control" placeholder="https://..." [(ngModel)]="form.imageUrl" name="img" /></div>
        </form>
        <div modal-footer style="display:flex;gap:12px;justify-content:flex-end;width:100%">
          <button class="btn btn-outline" (click)="showModal=false;error=''">Cancel</button>
          <button class="btn btn-primary" (click)="save()">{{editing?'Save Changes':'Register Lot'}}</button>
        </div>
      </app-modal>
    </app-manager-layout>
  `
})
export class MyLotsComponent implements OnInit {
  lots: any[] = []; loading = true; showModal = false; editing: number | null = null;
  error = ''; success = '';
  form = { name:'', address:'', city:'', latitude:'', longitude:'', totalSpots:'', openTime:'08:00', closeTime:'22:00', imageUrl:'' };

  constructor(public router: Router, private api: ApiService) {}
  ngOnInit() { this.load(); }

  load() {
    this.api.get<any[]>('/api/lots/my-lots').subscribe({
      next: d => { this.lots = d; this.loading = false; },
      error: err => { this.error = err.error?.message || 'Failed'; this.loading = false; }
    });
  }

  openAdd() { this.editing = null; this.form = { name:'', address:'', city:'', latitude:'', longitude:'', totalSpots:'', openTime:'08:00', closeTime:'22:00', imageUrl:'' }; this.showModal = true; }
  openEdit(lot: any) {
    this.editing = lot.lotId;
    this.form = { name: lot.name, address: lot.address, city: lot.city, latitude: lot.latitude, longitude: lot.longitude, totalSpots: lot.totalSpots, openTime: lot.openTime||'08:00', closeTime: lot.closeTime||'22:00', imageUrl: lot.imageUrl||'' };
    this.showModal = true;
  }

  save() {
    this.error = '';
    const payload = { ...this.form, latitude: Number(this.form.latitude), longitude: Number(this.form.longitude), totalSpots: Number(this.form.totalSpots) };
    const obs = this.editing ? this.api.put<any>(`/api/lots/${this.editing}`, payload) : this.api.post<any>('/api/lots', payload);
    obs.subscribe({
      next: () => { this.success = this.editing ? 'Lot updated.' : 'Lot registered! Awaiting admin approval.'; this.showModal = false; this.load(); },
      error: err => this.error = err.error?.message || 'Failed to save'
    });
  }

  toggle(lotId: number) {
    this.api.put(`/api/lots/${lotId}/toggle`).subscribe({
      next: () => { this.success = 'Lot status updated.'; this.load(); },
      error: err => this.error = err.error?.message || 'Failed'
    });
  }
}
