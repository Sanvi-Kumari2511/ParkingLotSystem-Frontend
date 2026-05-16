import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { SpinnerComponent } from '../../shared/ui/ui.components';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, SpinnerComponent],
  template: `
    <div style="max-width:600px;margin:0 auto;padding-top:24px">
      <div style="margin-bottom:24px">
        <h1 style="font-family:var(--font-display);font-weight:800;font-size:1.5rem;margin-bottom:4px">My Profile</h1>
        <p style="color:var(--muted);font-size:0.9rem">Update your profile, contact information, and password.</p>
      </div>

      @if (error)   { <div class="alert alert-danger">{{error}}<button (click)="error=''" style="margin-left:auto;background:none;border:none;cursor:pointer;opacity:0.6">✕</button></div> }
      @if (success) { <div class="alert alert-success">{{success}}<button (click)="success=''" style="margin-left:auto;background:none;border:none;cursor:pointer;opacity:0.6">✕</button></div> }

      <div class="card">
        @if (loading) {
          <app-spinner></app-spinner>
        } @else {
          <form (ngSubmit)="save()" #form="ngForm">
            <div class="form-group">
              <label>Full Name</label>
              <input class="form-control" name="fullName" [(ngModel)]="formData.fullName" required />
            </div>

            <div class="form-group">
              <label>Email Address</label>
              <input type="email" class="form-control" name="email" [(ngModel)]="formData.email" required />
            </div>

            <hr style="border:none;border-top:1px solid rgba(0,0,0,0.1);margin:24px 0" />
            <h3 style="font-size:1.1rem;margin-bottom:16px;font-weight:600">Change Password</h3>
            <p style="font-size:0.85rem;color:var(--muted);margin-bottom:16px">Leave these blank if you do not wish to change your password.</p>

            <div class="form-group">
              <label>Current Password</label>
              <input type="password" class="form-control" name="currentPassword" [(ngModel)]="formData.currentPassword" />
            </div>

            <div class="form-group">
              <label>New Password</label>
              <input type="password" class="form-control" name="newPassword" [(ngModel)]="formData.newPassword" minlength="6" />
            </div>

            <div style="display:flex;justify-content:flex-end;margin-top:24px">
              <button type="submit" class="btn btn-primary" [disabled]="saving || !form.valid">
                {{ saving ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </form>
        }
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  loading = true;
  saving = false;
  error = '';
  success = '';

  formData = {
    fullName: '',
    email: '',
    currentPassword: '',
    newPassword: ''
  };

  constructor(private api: ApiService, private auth: AuthService) {}

  ngOnInit() {
    this.api.get<any>('/api/auth/me').subscribe({
      next: (profile: any) => {
        this.formData.fullName = profile.fullName;
        this.formData.email = profile.email;
        this.loading = false;
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Failed to load profile';
        this.loading = false;
      }
    });
  }

  save() {
    this.error = '';
    this.success = '';
    
    if (this.formData.newPassword && !this.formData.currentPassword) {
      this.error = 'Current password is required to set a new password.';
      return;
    }

    this.saving = true;

    // Send only what is necessary
    const payload: any = {
      fullName: this.formData.fullName,
      email: this.formData.email
    };

    if (this.formData.newPassword) {
      payload.currentPassword = this.formData.currentPassword;
      payload.newPassword = this.formData.newPassword;
    }

    this.api.put<any>('/api/auth/me', payload).subscribe({
      next: (res: any) => {
        this.success = 'Profile updated successfully!';
        this.saving = false;
        this.formData.currentPassword = '';
        this.formData.newPassword = '';
        
        // Update stored name if it changed
        const currentUserStr = localStorage.getItem('user');
        if (currentUserStr) {
           const user = JSON.parse(currentUserStr);
           user.fullName = res.fullName;
           user.email = res.email;
           localStorage.setItem('user', JSON.stringify(user));
        }
      },
      error: (err: any) => {
        this.error = err.error?.message || 'Failed to update profile';
        this.saving = false;
      }
    });
  }
}
