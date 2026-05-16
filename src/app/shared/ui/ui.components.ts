import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [],
  template: `
    <header class="topbar">
      <div style="display:flex;align-items:center;gap:16px">
        <div>
          <div class="topbar-title">{{title}}</div>
          @if (subtitle) {
            <div class="topbar-sub">{{subtitle}}</div>
          }
        </div>
      </div>
      <div class="topbar-actions"><ng-content></ng-content></div>
    </header>
  `
})
export class TopbarComponent {
  @Input() title = '';
  @Input() subtitle = '';
}

@Component({
  selector: 'app-spinner',
  standalone: true,
  imports: [],
  template: `<div class="spinner-wrap"><div class="spinner"></div></div>`
})
export class SpinnerComponent {}

@Component({
  selector: 'app-alert',
  standalone: true,
  imports: [],
  template: `
    @if (visible) {
      <div class="alert alert-{{type}}">
        <span><ng-content></ng-content></span>
        @if (closable) {
          <button (click)="close()"
            style="margin-left:auto;background:none;border:none;cursor:pointer;font-size:1rem;opacity:0.6">✕</button>
        }
      </div>
    }
  `
})
export class AlertComponent {
  @Input() type = 'info';
  @Input() closable = false;
  @Output() closed = new EventEmitter<void>();
  visible = true;
  close() { this.visible = false; this.closed.emit(); }
}

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [],
  template: `
    <span class="badge {{cls}}">
      @if (dot) {
        <span class="badge-dot"></span>
      }
      {{label}}
    </span>
  `
})
export class StatusBadgeComponent {
  @Input() status: any = '';
  @Input() dot = true;
  private readonly config: Record<string, {cls:string;label:string}> = {
    RESERVED:    {cls:'badge-warning', label:'Reserved'},
    ACTIVE:      {cls:'badge-success', label:'Active'},
    COMPLETED:   {cls:'badge-accent',  label:'Completed'},
    CANCELLED:   {cls:'badge-danger',  label:'Cancelled'},
    PENDING:     {cls:'badge-warning', label:'Pending'},
    PAID:        {cls:'badge-success', label:'Paid'},
    REFUNDED:    {cls:'badge-info',    label:'Refunded'},
    FAILED:      {cls:'badge-danger',  label:'Failed'},
    AVAILABLE:   {cls:'badge-success', label:'Available'},
    OCCUPIED:    {cls:'badge-danger',  label:'Occupied'},
    MAINTENANCE: {cls:'badge-warning', label:'Maintenance'},
    'true':      {cls:'badge-success', label:'Active'},
    'false':     {cls:'badge-danger',  label:'Inactive'},
  };
  get cls()   { return (this.config[String(this.status)] || {cls:'badge-muted'}).cls; }
  get label() { return (this.config[String(this.status)] || {label:this.status}).label; }
}

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [],
  template: `
    <div class="empty-state">
      <div class="empty-icon">{{icon}}</div>
      <h3>{{title}}</h3>
      @if (message) {
        <p>{{message}}</p>
      }
      <div style="margin-top:16px"><ng-content></ng-content></div>
    </div>
  `
})
export class EmptyStateComponent {
  @Input() icon = '📭';
  @Input() title = '';
  @Input() message = '';
}

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [],
  template: `
    @if (isOpen) {
      <div class="modal-backdrop" (click)="onBackdropClick($event)">
        <div class="modal-card">
          <div class="modal-header">
            <div>
              <div class="modal-title">{{title}}</div>
              @if (subtitle) {
                <div class="modal-sub">{{subtitle}}</div>
              }
            </div>
            <button class="btn btn-outline btn-sm" (click)="close()">✕</button>
          </div>
          <div class="modal-body"><ng-content></ng-content></div>
          @if (showFooter) {
            <div class="modal-footer"><ng-content select="[modal-footer]"></ng-content></div>
          }
        </div>
      </div>
    }
  `
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() subtitle = '';
  @Input() showFooter = false;
  @Output() closed = new EventEmitter<void>();

  close() { this.closed.emit(); }
  onBackdropClick(e: MouseEvent) {
    if ((e.target as HTMLElement).classList.contains('modal-backdrop')) this.close();
  }
}
