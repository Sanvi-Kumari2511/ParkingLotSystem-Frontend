import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { finalize, timeout } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';
import { DriverLayoutComponent } from '../../../layouts/driver-layout/driver-layout.component';
import { SpinnerComponent, EmptyStateComponent, ModalComponent } from '../../../shared/ui/ui.components';

@Component({
  selector: 'app-my-vehicles',
  standalone: true,
  imports: [FormsModule, DriverLayoutComponent, SpinnerComponent, EmptyStateComponent, ModalComponent],
  template: `
    <app-driver-layout title="My Vehicles" subtitle="Register and manage your vehicles for quick booking.">
      <button topbar-right class="btn btn-primary btn-sm" style="padding:8px 16px;border-radius:999px;font-weight:800;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05em" (click)="openAdd()">+ Add Vehicle</button>
      @if (error)   { <div class="alert alert-danger">{{error}}<button (click)="error=''" style="margin-left:auto;background:none;border:none;cursor:pointer;opacity:0.6">✕</button></div> }
      @if (success) { <div class="alert alert-success">{{success}}<button (click)="success=''" style="margin-left:auto;background:none;border:none;cursor:pointer;opacity:0.6">✕</button></div> }
      @if (loading) { <app-spinner></app-spinner> }
      @if (!loading && vehicles.length === 0) {
        <app-empty-state icon="🚗" title="No vehicles registered" message="Add your vehicle to speed up the booking process.">
          <button class="btn btn-primary" (click)="openAdd()">Add Vehicle</button>
        </app-empty-state>
      }
      @if (!loading && vehicles.length > 0) {
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:20px">
          @for (v of vehicles; track v.vehicleId) {
            <div class="card" style="padding:24px;display:flex;flex-direction:column">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">
                <div style="font-size:2.6rem;line-height:1">{{vehicleIcon(v)}}</div>
                <div style="display:flex;gap:6px">
                  <button style="background:rgba(0,0,0,0.07);border:none;border-radius:999px;padding:4px 14px;font-size:0.7rem;font-weight:800;cursor:pointer;color:var(--text-soft)" (click)="openEdit(v)">EDIT</button>
                  <button style="background:rgba(198,40,40,0.08);border:none;border-radius:999px;padding:4px 14px;font-size:0.7rem;font-weight:800;cursor:pointer;color:var(--danger)" (click)="remove(v.vehicleId)">DEL</button>
                </div>
              </div>
              <div style="font-family:var(--font-display);font-weight:900;font-size:1.5rem;letter-spacing:0.03em;margin-bottom:4px">{{v.licensePlate}}</div>
              <div style="font-size:0.88rem;color:var(--muted);margin-bottom:16px">{{v.make}} {{v.model}}{{v.color?' · '+v.color:''}}</div>
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                <div [style]="typeConfig(v).style" style="display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:999px;font-size:0.68rem;font-weight:800;text-transform:uppercase;letter-spacing:0.05em">
                  <span style="width:5px;height:5px;background:currentColor;border-radius:50%"></span>{{typeConfig(v).label}}
                </div>
                @if (vehicleIsEV(v)) {
                  <div style="display:inline-flex;align-items:center;gap:4px;background:#ecfdf5;color:#059669;padding:5px 10px;border-radius:999px;font-size:0.68rem;font-weight:800">⚡ EV</div>
                }
              </div>
            </div>
          }
        </div>
      }

      <app-modal [isOpen]="showModal" [title]="editing ? 'Edit Vehicle' : 'Register Vehicle'" [showFooter]="true" (closed)="closeModal()">
        @if (modalError) { <div class="alert alert-danger">{{modalError}}<button (click)="modalError=''" style="margin-left:auto;background:none;border:none;cursor:pointer;opacity:0.6">✕</button></div> }
        <div class="form-group"><label class="form-label">License Plate *</label><input class="form-control" placeholder="MH01AB1234" [(ngModel)]="form.licensePlate" name="lp" /></div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Make *</label><input class="form-control" placeholder="Toyota" [(ngModel)]="form.make" name="make" /></div>
          <div class="form-group"><label class="form-label">Model *</label><input class="form-control" placeholder="Camry" [(ngModel)]="form.model" name="model" /></div>
        </div>
        <div class="form-row">
          <div class="form-group"><label class="form-label">Color</label><input class="form-control" placeholder="White" [(ngModel)]="form.color" name="color" /></div>
          <div class="form-group"><label class="form-label">Vehicle Type</label>
            <select class="form-control" [(ngModel)]="form.vehicleType" name="vt">
              <option value="TWO_WHEELER">Two Wheeler</option>
              <option value="FOUR_WHEELER">Four Wheeler</option>
              <option value="HEAVY">Heavy Vehicle</option>
            </select>
          </div>
        </div>
        <div (click)="form.isEV=!form.isEV" style="display:flex;align-items:center;gap:12px;cursor:pointer;padding:12px 16px;border-radius:12px;margin-bottom:16px;user-select:none;transition:all 0.2s"
             [style.background]="form.isEV?'rgba(5,150,105,0.08)':'rgba(0,0,0,0.04)'" [style.border]="form.isEV?'1.5px solid #059669':'1.5px solid transparent'">
          <div style="width:40px;height:22px;border-radius:999px;position:relative;flex-shrink:0;transition:background 0.2s" [style.background]="form.isEV?'#059669':'#ccc'">
            <div style="position:absolute;top:3px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left 0.2s;box-shadow:0 1px 4px rgba(0,0,0,0.2)" [style.left]="form.isEV?'21px':'3px'"></div>
          </div>
          <div>
            <div style="font-weight:800;font-size:0.82rem" [style.color]="form.isEV?'#059669':'var(--text)'">⚡ Electric Vehicle (EV)</div>
            <div style="font-size:0.72rem;color:var(--muted);margin-top:2px">{{form.isEV?'This vehicle is electric':'Tap to mark as electric'}}</div>
          </div>
        </div>
        <div modal-footer style="display:flex;gap:12px;justify-content:flex-end;width:100%">
          <button class="btn btn-outline" type="button" (click)="closeModal()">Cancel</button>
          <button class="btn btn-primary" type="button" [disabled]="saving" (click)="save()">
            {{saving ? 'Saving...' : (editing ? 'Save Changes' : 'Register')}}
          </button>
        </div>
      </app-modal>
    </app-driver-layout>
  `
})
export class MyVehiclesComponent implements OnInit {
  vehicles: any[] = [];
  loading = true;
  showModal = false;
  editing: number | null = null;
  error = '';
  success = '';
  modalError = '';
  saving = false;
  form = { licensePlate: '', make: '', model: '', color: '', vehicleType: 'FOUR_WHEELER', isEV: false };

  constructor(private api: ApiService) {}

  ngOnInit() { this.load(); }

  load() {
    this.loading = true;
    this.api.get<any[]>('/api/vehicles/my').subscribe({
      next: d => { this.vehicles = d; this.loading = false; },
      error: err => {
        this.error = err.error?.message || err.message || 'Failed to load vehicles.';
        this.loading = false;
      }
    });
  }

  vehicleIsEV(v: any) { return !!v.isEV || !!v.electricVehicle || !!v.ev; }
  vehicleIcon(v: any) { return v.vehicleType === 'TWO_WHEELER' ? '🏍️' : v.vehicleType === 'HEAVY' ? '🚛' : '🚗'; }

  typeConfig(v: any) {
    return v.vehicleType === 'TWO_WHEELER'
      ? { label: 'Two Wheeler', style: 'background:#f0fdf4;color:#16a34a' }
      : v.vehicleType === 'HEAVY'
      ? { label: 'Heavy Vehicle', style: 'background:#fff7ed;color:#ea580c' }
      : { label: 'Four Wheeler', style: 'background:#eff6ff;color:#3b82f6' };
  }

  openAdd() {
    this.editing = null;
    this.form = { licensePlate: '', make: '', model: '', color: '', vehicleType: 'FOUR_WHEELER', isEV: false };
    this.modalError = '';
    this.showModal = true;
  }

  openEdit(v: any) {
    this.editing = v.vehicleId;
    this.form = {
      licensePlate: v.licensePlate,
      make: v.make,
      model: v.model,
      color: v.color || '',
      vehicleType: v.vehicleType,
      isEV: !!(v.isEV || v.electricVehicle || v.ev)
    };
    this.modalError = '';
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.modalError = '';
    this.saving = false;
  }

  save() {
    // Validate
    if (!this.form.licensePlate.trim()) { this.modalError = 'License plate is required.'; return; }
    
    // Indian Vehicle Plate Regex: MH01AB1234, KA011234, etc.
    const plateRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{0,2}[0-9]{4}$/;
    if (!plateRegex.test(this.form.licensePlate.toUpperCase().trim())) {
      this.modalError = 'Invalid Indian vehicle number plate format. (e.g. MH01AB1234)';
      return;
    }

    if (!this.form.make.trim()) { this.modalError = 'Make is required.'; return; }
    if (!this.form.model.trim()) { this.modalError = 'Model is required.'; return; }

    this.modalError = '';
    this.saving = true;

    const payload = {
      licensePlate: this.form.licensePlate.toUpperCase().trim(),
      make: this.form.make.trim(),
      model: this.form.model.trim(),
      color: this.form.color.trim(),
      vehicleType: this.form.vehicleType,
      isEV: this.form.isEV
    };

    const obs = this.editing
      ? this.api.put<any>(`/api/vehicles/${this.editing}`, payload)
      : this.api.post<any>('/api/vehicles', payload);

    obs.pipe(
      timeout(15000),   // Safety net: never hang more than 15 seconds
      finalize(() => {
        this.saving = false;
      })
    ).subscribe({
      next: (res) => {
        console.log('Vehicle saved:', res);
        this.success = this.editing ? 'Vehicle updated successfully.' : 'Vehicle registered successfully.';
        this.closeModal();
        this.load();
        // Clear success message after 5 seconds
        setTimeout(() => this.success = '', 5000);
      },
      error: (err: any) => {
        console.error('Error saving vehicle:', err);
        if (err?.name === 'TimeoutError') {
          this.modalError = 'Request timed out. The server took too long to respond. Please try again.';
        } else {
          this.modalError = err?.error?.message || err?.message || 'Failed to save vehicle. Please try again.';
        }
      }
    });
  }

  remove(id: number) {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    this.api.delete(`/api/vehicles/${id}`).subscribe({
      next: () => { this.success = 'Vehicle deleted.'; this.load(); },
      error: err => { this.error = err.error?.message || 'Failed to delete vehicle.'; }
    });
  }
}
