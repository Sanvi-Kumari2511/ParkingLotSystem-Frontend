import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { DriverLayoutComponent } from '../../../layouts/driver-layout/driver-layout.component';
import { SpinnerComponent, EmptyStateComponent } from '../../../shared/ui/ui.components';

const TYPE_CONFIG: Record<string, {color:string;label:string}> = {
  BOOKING_CONFIRMED: {color:'#22c55e',label:'Booking Confirmed'},
  CHECKIN:           {color:'#3b82f6',label:'Check-In'},
  CHECKOUT:          {color:'#8b5cf6',label:'Check-Out'},
  PAYMENT:           {color:'#f59e0b',label:'Payment'},
  CANCELLATION:      {color:'#ef4444',label:'Cancellation'},
  EXPIRY_REMINDER:   {color:'#f97316',label:'Expired'},
  BROADCAST:         {color:'#06b6d4',label:'Announcement'},
};

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [DriverLayoutComponent, SpinnerComponent, EmptyStateComponent],
  template: `
    <app-driver-layout title="Notifications" [subtitle]="unread>0?(unread+' unread notification'+(unread>1?'s':'')):'All caught up!'">
      @if (unread > 0) {
        <button topbar-right class="btn btn-sm" style="border-radius:999px;font-size:0.75rem;font-weight:800;padding:8px 16px;background:var(--text);color:var(--bg)" (click)="markAllRead()">✓ Mark all as read</button>
      }
      @if (error) {
        <div class="alert alert-danger">{{error}}<button (click)="error=''" style="margin-left:auto;background:none;border:none;cursor:pointer;opacity:0.6">✕</button></div>
      }
      <div class="tab-bar" style="margin-bottom:24px">
        @for (f of filters; track f.key) {
          <div class="tab" [class.active]="filter===f.key" (click)="filter=f.key">
            {{f.label}}{{f.key==='UNREAD'&&unread>0?' ('+unread+')':''}}
          </div>
        }
      </div>
      @if (loading) { <app-spinner></app-spinner> }
      @if (!loading && filtered.length === 0) {
        <app-empty-state icon="🔔" title="No notifications" [message]="emptyMsg"></app-empty-state>
      }
      @if (!loading && filtered.length > 0) {
        <div style="display:flex;flex-direction:column;gap:16px">
          @for (n of filtered; track n.notificationId) {
            <div class="notif-item" [class.unread]="!n.isRead" [style.cursor]="!n.isRead?'pointer':'default'" (click)="!n.isRead && markRead(n.notificationId)">
              <div style="flex:1;display:flex;flex-direction:column">
                <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
                  <div [style.color]="typeColor(n.type)" style="font-weight:800;font-size:0.65rem;text-transform:uppercase;letter-spacing:0.05em;display:flex;align-items:center;gap:6px">
                    <span style="width:6px;height:6px;border-radius:50%;background:currentColor"></span>{{typeLabel(n.type)}}
                  </div>
                  <div style="color:var(--muted);font-size:0.75rem">{{formatDate(n.sentAt)}}</div>
                </div>
                <div style="font-weight:800;font-size:0.95rem;margin-bottom:4px">{{n.title}}</div>
                <div style="color:var(--text-soft);font-size:0.85rem;line-height:1.4">{{n.message}}</div>
              </div>
              <div style="display:flex;flex-direction:column;gap:8px;align-items:center">
                <button (click)="$event.stopPropagation();markRead(n.notificationId)" [disabled]="n.isRead" [style.opacity]="n.isRead?0.3:1"
                  title="Mark as read" style="background:transparent;border:1px solid rgba(0,0,0,0.1);color:var(--text-soft);border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer">✓</button>
                <button (click)="$event.stopPropagation();deleteNotif(n.notificationId)"
                  title="Delete" style="background:transparent;border:1px solid rgba(0,0,0,0.1);color:var(--danger);border-radius:50%;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer">✕</button>
              </div>
            </div>
          }
        </div>
      }
    </app-driver-layout>
  `
})
export class NotificationsComponent implements OnInit {
  notifications: any[] = []; loading = true; error = ''; filter = 'ALL';
  filters = [
    { key: 'ALL', label: 'All' },
    { key: 'UNREAD', label: 'Unread' },
    { key: 'BOOKING_CONFIRMED', label: 'Confirmed' },
    { key: 'PAYMENT', label: 'Payment' },
    { key: 'CANCELLATION', label: 'Cancelled' },
  ];

  constructor(private api: ApiService) {}

  get unread() { return this.notifications.filter(n => !n.isRead).length; }
  get emptyMsg() { return this.filter === 'UNREAD' ? 'All caught up!' : 'Nothing here yet.'; }
  get filtered() {
    if (this.filter === 'ALL')    return this.notifications;
    if (this.filter === 'UNREAD') return this.notifications.filter(n => !n.isRead);
    return this.notifications.filter(n => n.type === this.filter);
  }

  typeLabel(type: string) { return TYPE_CONFIG[type]?.label || type; }
  typeColor(type: string) { return TYPE_CONFIG[type]?.color || '#64748b'; }
  formatDate(d: string) {
    const dt = new Date(d);
    return `${dt.getDate()} ${dt.toLocaleString('default',{month:'short'})}. ${dt.toLocaleString('default',{hour:'numeric',minute:'numeric',hour12:true})}`;
  }

  ngOnInit() {
    this.api.get<any[]>('/api/notifications/my').subscribe({
      next: d => { this.notifications = d; this.loading = false; },
      error: err => { this.error = err.error?.message || 'Failed'; this.loading = false; }
    });
  }

  markRead(id: number) {
    this.api.put(`/api/notifications/${id}/read`).subscribe({
      next: () => this.notifications = this.notifications.map(n => n.notificationId === id ? {...n, isRead:true} : n),
      error: err => this.error = err.error?.message || 'Failed'
    });
  }

  markAllRead() {
    this.api.put('/api/notifications/read-all').subscribe({
      next: () => this.notifications = this.notifications.map(n => ({...n, isRead:true})),
      error: err => this.error = err.error?.message || 'Failed'
    });
  }

  deleteNotif(id: number) {
    this.api.delete(`/api/notifications/${id}`).subscribe({
      next: () => this.notifications = this.notifications.filter(n => n.notificationId !== id),
      error: err => this.error = err.error?.message || 'Failed'
    });
  }
}
