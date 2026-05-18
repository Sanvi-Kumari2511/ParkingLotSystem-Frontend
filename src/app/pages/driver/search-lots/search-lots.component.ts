import { Component } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { EmptyStateComponent } from '../../../shared/ui/ui.components';

@Component({
  selector: 'app-search-lots',
  standalone: true,
  imports: [CommonModule, FormsModule, EmptyStateComponent],
  template: `
    <div style="min-height:100vh;background:var(--bg);padding:32px">
      <div style="display:flex;align-items:center;gap:16px;margin-bottom:24px">
        <button (click)="router.navigate(['/driver'])" style="background:none;border:1.5px solid rgba(0,0,0,0.12);border-radius:50%;width:36px;height:36px;cursor:pointer;font-size:1.1rem;display:flex;align-items:center;justify-content:center">←</button>
        <h1 style="font-family:var(--font-display);font-weight:900;font-size:1.5rem;text-transform:uppercase;margin:0">Find Parking</h1>
      </div>
      <div class="card" style="margin-bottom:24px">
        <form (ngSubmit)="searchByCity()">
          <div style="display:flex;gap:12px;align-items:center">
            <input [(ngModel)]="city" name="city" style="flex:1;padding:11px 18px;border:1px solid var(--border);border-radius:999px;font-size:0.9rem;background:var(--bg-3);color:var(--text);outline:none" placeholder="Enter city, area or landmark..." />
            <button type="submit" style="background:var(--accent);color:#fff;border:none;border-radius:999px;padding:10px 28px;font-weight:800;font-size:0.78rem;text-transform:uppercase;letter-spacing:0.06em;cursor:pointer;white-space:nowrap">Search</button>
            <button type="button" (click)="searchNearby()" style="background:var(--bg-3);color:var(--text);border:1px solid var(--border);border-radius:999px;padding:9px 20px;font-weight:800;font-size:0.78rem;text-transform:uppercase;letter-spacing:0.06em;cursor:pointer;white-space:nowrap;transition:all 0.2s" onmouseover="this.style.borderColor='var(--accent)'; this.style.color='var(--accent)'" onmouseout="this.style.borderColor='var(--border)'; this.style.color='var(--text)'">Nearby</button>
          </div>
        </form>
      </div>
      @if (error) { <div class="alert alert-danger">{{error}}<button (click)="error=''" style="margin-left:auto;background:none;border:none;cursor:pointer;opacity:0.6">✕</button></div> }
      @if (loading) { <div style="padding:60px 0;display:flex;justify-content:center"><div class="spinner"></div></div> }
      @if (searched && !loading && filteredLots.length === 0) {
        <app-empty-state icon="🔍" title="No lots found" message="Try a different city, use Nearby, or adjust your filters."></app-empty-state>
      }
      @if (!loading && lots.length > 0) {
        
        <!-- Filters -->
        <div style="display:flex;gap:10px;margin-bottom:24px;flex-wrap:wrap">
          <button (click)="filterEV = !filterEV" [class.active-filter]="filterEV" class="filter-pill">⚡ EV Only</button>
          <button (click)="filterHandicap = !filterHandicap" [class.active-filter]="filterHandicap" class="filter-pill">♿ Handicapped</button>
          <button (click)="filterCompact = !filterCompact" [class.active-filter]="filterCompact" class="filter-pill">🚗 Compact</button>
          <button (click)="filterStandard = !filterStandard" [class.active-filter]="filterStandard" class="filter-pill">🚙 Standard</button>
          <button (click)="filterLarge = !filterLarge" [class.active-filter]="filterLarge" class="filter-pill">🚐 Large</button>
        </div>

        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px">
          @for (lot of filteredLots; track lot.lotId) {
            <div class="card" style="padding:24px;cursor:pointer;transition:transform 0.2s" (click)="router.navigate(['/driver/lots',lot.lotId])">
              @if (lot.imageUrl) {
                <img [src]="lot.imageUrl" [alt]="lot.name" style="margin:-24px -24px 16px -24px;height:140px;width:calc(100% + 48px);object-fit:cover;border-radius:var(--radius-md) var(--radius-md) 0 0" />
              }
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
                <div>
                  <div style="font-family:var(--font-display);font-weight:800;font-size:1.2rem;margin-bottom:4px">{{lot.name}}</div>
                  <div style="font-size:0.8rem;color:var(--muted)">📍 {{lot.address}}, {{lot.city}}</div>
                </div>
                <div style="text-align:right">
                  <div style="font-family:var(--font-display);font-weight:900;color:var(--accent)">₹{{minPrice(lot)}}/hr</div>
                </div>
              </div>
              <div style="display:flex;gap:8px;margin-bottom:16px;align-items:center">
                <span class="badge" [class]="lot.open?'badge-success':'badge-danger'">{{lot.open?'● Open':'● Closed'}}</span>
                <span style="font-size:0.8rem;color:var(--muted)">{{lot.availableSpots}}/{{lot.totalSpots}} available</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" [style.width]="getPct(lot)+'%'" [style.background]="getPct(lot)>80?'var(--danger)':getPct(lot)>50?'var(--warning)':'var(--success)'"></div>
              </div>
            </div>
          }
        </div>
      }
    </div>

    <style>
      .filter-pill {
        background: #fff; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 999px;
        padding: 6px 16px; font-size: 0.85rem; font-weight: 600; cursor: pointer;
        color: var(--text-soft); transition: all 0.2s;
      }
      .filter-pill:hover { border-color: rgba(0,0,0,0.2); }
      .filter-pill.active-filter { background: var(--primary); color: #fff; border-color: var(--primary); }
    </style>
  `
})
export class SearchLotsComponent {
  city = ''; lots: any[] = []; loading = false; error = ''; searched = false;
  
  filterEV = false;
  filterHandicap = false;
  filterCompact = false;
  filterStandard = false;
  filterLarge = false;

  constructor(public router: Router, private api: ApiService) {}
  
  getPct(lot: any) { return lot.totalSpots > 0 ? ((lot.totalSpots - lot.availableSpots) / lot.totalSpots * 100) : 0; }
  minPrice(lot: any) { return lot.minPricePerHour || lot.pricePerHour || '—'; }
  
  get filteredLots() {
    if (!this.filterEV && !this.filterHandicap && !this.filterCompact && !this.filterStandard && !this.filterLarge) {
      return this.lots;
    }
    
    return this.lots.filter(lot => {
      if (!lot.availableSpotsDetails || lot.availableSpotsDetails.length === 0) return false;
      
      return lot.availableSpotsDetails.some((spot: any) => {
        let matches = true;
        if (this.filterEV && !spot.evcharging) matches = false;
        if (this.filterHandicap && !spot.handicapped) matches = false;
        if (this.filterCompact && spot.spotType !== 'COMPACT') matches = false;
        if (this.filterStandard && spot.spotType !== 'STANDARD') matches = false;
        if (this.filterLarge && spot.spotType !== 'LARGE') matches = false;
        return matches;
      });
    });
  }

  searchByCity() {
    if (!this.city.trim()) return;
    this.loading = true; this.error = ''; this.searched = true;
    this.api.get<any[]>(`/api/lots/city/${this.city.trim()}`).subscribe({
      next: d => { this.lots = d; this.loadSpotDetails(); },
      error: err => { this.error = err.error?.message || 'Failed'; this.loading = false; }
    });
  }

  searchNearby() {
    if (!navigator.geolocation) { this.error = 'Geolocation not supported.'; return; }
    this.loading = true; this.error = ''; this.searched = true;
    navigator.geolocation.getCurrentPosition(
      pos => {
        this.api.get<any[]>(`/api/lots/nearby?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&radius=10`).subscribe({
          next: d => { this.lots = d; this.loadSpotDetails(); },
          error: err => { this.error = err.error?.message || 'Failed'; this.loading = false; }
        });
      },
      () => { this.error = 'Could not get location.'; this.loading = false; }
    );
  }

  loadSpotDetails() {
    if (this.lots.length === 0) {
      this.loading = false;
      return;
    }

    import('rxjs').then(({ forkJoin }) => {
      const requests = this.lots.map(lot => this.api.get<any[]>(`/api/spots/lot/${lot.lotId}/available`));
      
      forkJoin(requests).subscribe({
        next: (responses: any[][]) => {
          this.lots.forEach((lot, i) => {
            lot.availableSpotsDetails = responses[i];
          });
          this.loading = false;
        },
        error: () => {
          this.loading = false; // Graceful fallback
        }
      });
    });
  }
}
