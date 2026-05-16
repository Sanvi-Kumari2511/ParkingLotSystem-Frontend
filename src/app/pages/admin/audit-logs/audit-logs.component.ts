import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AdminLayoutComponent } from '../../../layouts/admin-layout/admin-layout.component';
import { SpinnerComponent, EmptyStateComponent } from '../../../shared/ui/ui.components';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [FormsModule, AdminLayoutComponent, SpinnerComponent, EmptyStateComponent, DatePipe],
  template: `
    <app-admin-layout>
      <div style="margin-bottom:24px">
        <h1 style="font-family:var(--font-display);font-weight:800;font-size:1.5rem;margin-bottom:4px">Audit Logs</h1>
        <p style="color:var(--muted);font-size:0.9rem">History of critical platform actions.</p>
      </div>

      @if (error) {
        <div class="alert alert-danger">{{error}}<button (click)="error=''" style="margin-left:auto;background:none;border:none;cursor:pointer;opacity:0.6">✕</button></div>
      }

      <div class="card" style="margin-bottom:24px">
        <div style="display:flex;gap:12px">
          <input class="form-control" placeholder="Search by action, performer or target..." [(ngModel)]="search" (input)="applyFilter()" style="flex:1" />
          <select class="form-control" [(ngModel)]="typeFilter" (change)="applyFilter()" style="width:200px">
            <option value="ALL">All Actions</option>
            @for (type of actionTypes; track type) {
              <option [value]="type">{{type.replace('_',' ')}}</option>
            }
          </select>
        </div>
      </div>

      @if (loading) { <app-spinner></app-spinner> }
      @if (!loading && filtered.length === 0) { <app-empty-state icon="📋" title="No audit logs found"></app-empty-state> }
      
      @if (!loading && filtered.length > 0) {
        <div class="card">
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Performer</th>
                  <th>Target ID</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                @for (log of filtered; track log.id) {
                  <tr>
                    <td style="font-size:0.8rem;white-space:nowrap">{{log.timestamp | date:'medium'}}</td>
                    <td>
                      <span class="badge" [class]="getActionBadgeClass(log.actionType)">
                        {{log.actionType?.replace('_',' ')}}
                      </span>
                    </td>
                    <td style="font-size:0.85rem"><strong>{{log.performedBy}}</strong></td>
                    <td style="font-family:monospace;font-size:0.8rem">{{log.targetId}}</td>
                    <td style="font-size:0.85rem;color:var(--text-soft);max-width:300px">{{log.details}}</td>
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
export class AuditLogsComponent implements OnInit {
  logs: any[] = [];
  filtered: any[] = [];
  loading = true;
  error = '';
  search = '';
  typeFilter = 'ALL';
  actionTypes: string[] = [];

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.api.get<any[]>('/api/analytics/admin/audit').subscribe({
      next: d => {
        this.logs = d;
        this.filtered = d;
        this.actionTypes = Array.from(new Set(d.map(l => l.actionType)));
        this.loading = false;
      },
      error: err => {
        this.error = err.error?.message || 'Failed to load audit logs';
        this.loading = false;
      }
    });
  }

  applyFilter() {
    let result = this.logs;
    
    if (this.typeFilter !== 'ALL') {
      result = result.filter(l => l.actionType === this.typeFilter);
    }
    
    if (this.search.trim()) {
      const q = this.search.toLowerCase();
      result = result.filter(l => 
        l.performedBy?.toLowerCase().includes(q) || 
        l.actionType?.toLowerCase().includes(q) || 
        l.targetId?.toLowerCase().includes(q) ||
        l.details?.toLowerCase().includes(q)
      );
    }
    
    this.filtered = result;
  }

  getActionBadgeClass(type: string) {
    if (type.includes('APPROVAL') || type.includes('ACTIVATION')) return 'badge-success';
    if (type.includes('REJECTION') || type.includes('SUSPENSION')) return 'badge-danger';
    if (type.includes('CHECKOUT')) return 'badge-warning';
    return 'badge-muted';
  }
}
