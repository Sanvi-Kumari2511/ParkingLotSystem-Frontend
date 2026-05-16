import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AdminLayoutComponent } from '../../../layouts/admin-layout/admin-layout.component';
import { SpinnerComponent, EmptyStateComponent } from '../../../shared/ui/ui.components';

@Component({
  selector: 'app-manage-users',
  standalone: true,
  imports: [FormsModule, AdminLayoutComponent, SpinnerComponent, EmptyStateComponent],
  template: `
    <app-admin-layout>
      <div style="margin-bottom:24px">
        <h1 style="font-family:var(--font-display);font-weight:800;font-size:1.5rem;margin-bottom:4px">Manage Users</h1>
        <p style="color:var(--muted);font-size:0.9rem">{{users.length}} total users on the platform.</p>
      </div>
      @if (error)   { <div class="alert alert-danger">{{error}}<button (click)="error=''" style="margin-left:auto;background:none;border:none;cursor:pointer;opacity:0.6">✕</button></div> }
      @if (success) { <div class="alert alert-success">{{success}}<button (click)="success=''" style="margin-left:auto;background:none;border:none;cursor:pointer;opacity:0.6">✕</button></div> }
      <div class="card" style="margin-bottom:24px">
        <div style="display:flex;gap:12px">
          <input class="form-control" placeholder="Search by name or email..." [(ngModel)]="search" (input)="applyFilter()" style="flex:1" />
          <select class="form-control" [(ngModel)]="roleFilter" (change)="applyFilter()" style="width:160px">
            <option value="ALL">All Roles</option>
            <option value="DRIVER">Drivers</option>
            <option value="LOT_MANAGER">Managers</option>
            <option value="ADMIN">Admins</option>
          </select>
        </div>
      </div>
      @if (loading) { <app-spinner></app-spinner> }
      @if (!loading && filtered.length === 0) { <app-empty-state icon="👥" title="No users found"></app-empty-state> }
      @if (!loading && filtered.length > 0) {
        <div class="card">
          <div class="table-wrap">
            <table>
              <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Provider</th><th>Status</th><th style="text-align:right">Actions</th></tr></thead>
              <tbody>
                @for (u of filtered; track u.id) {
                  <tr>
                    <td><strong>{{u.fullName}}</strong></td>
                    <td style="font-size:0.8rem">{{u.email}}</td>
                    <td><span class="badge" [class]="u.role==='ADMIN'?'badge-danger':u.role==='LOT_MANAGER'?'badge-info':'badge-muted'">{{u.role?.replace('_',' ')}}</span></td>
                    <td><span class="badge badge-muted">{{u.provider}}</span></td>
                    <td><span class="badge" [class]="u.active?'badge-success':'badge-danger'">{{u.active?'● Active':'● Suspended'}}</span></td>
                    <td>
                      @if (u.role !== 'ADMIN') {
                        <div style="display:flex;gap:8px;justify-content:flex-end">
                          @if (u.active) {
                            <button class="btn btn-outline btn-sm" style="color:#f59e0b;border-color:#f59e0b" (click)="suspend(u.id)">Suspend</button>
                          }
                          @if (!u.active) {
                            <button class="btn btn-outline btn-sm" style="color:var(--success);border-color:var(--success)" (click)="activate(u.id)">Activate</button>
                          }
                          <button class="btn btn-ghost btn-sm" style="color:var(--danger)" (click)="remove(u.id)">Delete</button>
                        </div>
                      }
                      @if (u.role === 'ADMIN') {
                        <span style="color:var(--muted);font-size:0.85rem;font-weight:600;display:block;text-align:right">Protected</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </app-admin-layout>
  `
})
export class ManageUsersComponent implements OnInit {
  users: any[] = []; filtered: any[] = []; loading = true;
  error = ''; success = ''; search = ''; roleFilter = 'ALL';

  constructor(private api: ApiService) {}
  ngOnInit() { this.load(); }

  load() {
    this.api.get<any[]>('/api/admin/users').subscribe({
      next: d => { this.users = d; this.filtered = d; this.loading = false; },
      error: err => { this.error = err.error?.message || 'Failed'; this.loading = false; }
    });
  }

  applyFilter() {
    let result = this.users;
    if (this.roleFilter !== 'ALL') result = result.filter(u => u.role === this.roleFilter);
    if (this.search.trim()) {
      const q = this.search.toLowerCase();
      result = result.filter(u => u.email?.toLowerCase().includes(q) || u.fullName?.toLowerCase().includes(q));
    }
    this.filtered = result;
  }

  suspend(id: number) {
    this.api.put(`/api/admin/users/${id}/suspend`).subscribe({ next: () => { this.success = 'User suspended.'; this.load(); }, error: err => this.error = err.error?.message||'Failed' });
  }
  activate(id: number) {
    this.api.put(`/api/admin/users/${id}/activate`).subscribe({ next: () => { this.success = 'User activated.'; this.load(); }, error: err => this.error = err.error?.message||'Failed' });
  }
  remove(id: number) {
    if (!confirm('Permanently delete this user?')) return;
    this.api.delete(`/api/admin/users/${id}`).subscribe({ next: () => { this.success = 'User deleted.'; this.load(); }, error: err => this.error = err.error?.message||'Failed' });
  }
}
