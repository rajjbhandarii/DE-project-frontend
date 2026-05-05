import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AccesspointService, AppUser } from '../../apps-services/access-point.service';
import { TrackingService, TrackingInfo } from '../../apps-services/tracking.service';
import { ThemeServiceService } from '../../apps-services/theme.service';

declare const L: any;

@Component({
  selector: 'app-track-provider',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './track-provider.component.html',
  styleUrl: './track-provider.component.css',
})
export class TrackProviderComponent implements OnInit, OnDestroy {
  isDarkMode = false;
  trackingInfo: TrackingInfo | null = null;
  isActive = false;
  elapsedTime = '00:00';

  private map: any = null;
  private providerMarker: any = null;
  private userMarker: any = null;
  private routeLine: any = null;
  private trailLine: any = null;
  private destroy$ = new Subject<void>();
  private timerInterval: any = null;
  private userLatLng: { lat: number; lng: number } | null = null;
  private mapInitialized = false;

  constructor(
    private accesspointService: AccesspointService,
    private trackingService: TrackingService,
    private themeService: ThemeServiceService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Get user preferences
    this.accesspointService.currentState$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user: AppUser | null) => {
        if (user) {
          this.isDarkMode = user.visual === 'dark';
          // Ensure tracking service is initialized
          this.trackingService.init(user.email);
        }
      });

    // If tracking is already active, load current data
    if (this.trackingService.isActive && this.trackingService.currentTracking) {
      this.trackingInfo = this.trackingService.currentTracking;
      this.isActive = true;
    }

    // Subscribe to tracking updates
    this.trackingService.tracking$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data: TrackingInfo | null) => {
        if (data) {
          this.trackingInfo = data;
          if (!this.mapInitialized) {
            setTimeout(() => this.initMap(data), 150);
            this.mapInitialized = true;
          } else {
            this.updateProviderPosition(data);
          }
        }
      });

    // Subscribe to tracking active state
    this.trackingService.isActive$
      .pipe(takeUntil(this.destroy$))
      .subscribe((active: boolean) => {
        this.isActive = active;
        if (active && !this.timerInterval) {
          this.startTimer();
        }
      });

    // Subscribe to tracking stopped
    this.trackingService.stopped$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (data) {
          this.stopTimer();
          this.themeService.displayNotification(
            '✅ Provider Arrived',
            `${data.providerName} has arrived or stopped sharing location.`,
            'success'
          );
        }
      });
  }

  // ===================== MAP =====================

  private initMap(data: TrackingInfo): void {
    if (this.map) {
      this.destroyMap();
    }

    const container = document.getElementById('track-map');
    if (!container) return;

    const tileUrl = this.isDarkMode
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const tileAttribution = this.isDarkMode
      ? '&copy; <a href="https://carto.com/">CARTO</a>'
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

    this.map = L.map('track-map', {
      zoomControl: false,
      attributionControl: true,
    }).setView([data.lat, data.lng], 15);

    // Add zoom control to top-right
    L.control.zoom({ position: 'topright' }).addTo(this.map);

    L.tileLayer(tileUrl, {
      attribution: tileAttribution,
      maxZoom: 19,
    }).addTo(this.map);

    // Provider marker (blue truck)
    const providerIcon = L.divIcon({
      html: `<div class="provider-map-icon">
               <i class="fa-solid fa-truck-fast"></i>
             </div>`,
      className: 'custom-div-icon',
      iconSize: [48, 48],
      iconAnchor: [24, 24],
    });

    this.providerMarker = L.marker([data.lat, data.lng], { icon: providerIcon })
      .addTo(this.map)
      .bindPopup(`<strong>${data.providerName}</strong><br>Service Provider`);

    // Trail line (shows path taken)
    const historyCoords = this.trackingService.locationHistory.map(h => [h.lat, h.lng]);
    if (historyCoords.length > 1) {
      this.trailLine = L.polyline(historyCoords, {
        color: '#8b5cf6',
        weight: 3,
        opacity: 0.5,
        dashArray: '4, 6',
      }).addTo(this.map);
    }

    // User's own location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.userLatLng = { lat: pos.coords.latitude, lng: pos.coords.longitude };

          const userIcon = L.divIcon({
            html: `<div class="user-map-icon">
                     <i class="fa-solid fa-user"></i>
                   </div>`,
            className: 'custom-div-icon',
            iconSize: [44, 44],
            iconAnchor: [22, 22],
          });

          this.userMarker = L.marker([pos.coords.latitude, pos.coords.longitude], { icon: userIcon })
            .addTo(this.map)
            .bindPopup('<strong>You</strong><br>Your Location');

          // Dashed route line between provider and user
          this.routeLine = L.polyline(
            [
              [data.lat, data.lng],
              [pos.coords.latitude, pos.coords.longitude],
            ],
            {
              color: '#3b82f6',
              weight: 3,
              opacity: 0.7,
              dashArray: '10, 8',
            }
          ).addTo(this.map);

          // Fit bounds to show both markers
          const group = L.featureGroup([this.providerMarker, this.userMarker]);
          this.map.fitBounds(group.getBounds().pad(0.2));
        },
        () => {
          console.warn('User geolocation not available.');
        }
      );
    }

    setTimeout(() => this.map?.invalidateSize(), 300);
  }

  private updateProviderPosition(data: TrackingInfo): void {
    if (!this.map || !this.providerMarker) return;

    const newLatLng = L.latLng(data.lat, data.lng);
    this.providerMarker.setLatLng(newLatLng);

    // Update route line
    if (this.routeLine && this.userLatLng) {
      this.routeLine.setLatLngs([
        newLatLng,
        [this.userLatLng.lat, this.userLatLng.lng],
      ]);
    }

    // Update trail line
    if (this.trailLine) {
      const coords = this.trackingService.locationHistory.map(h => [h.lat, h.lng]);
      this.trailLine.setLatLngs(coords);
    } else if (this.trackingService.locationHistory.length > 1) {
      const coords = this.trackingService.locationHistory.map(h => [h.lat, h.lng]);
      this.trailLine = L.polyline(coords, {
        color: '#8b5cf6',
        weight: 3,
        opacity: 0.5,
        dashArray: '4, 6',
      }).addTo(this.map);
    }

    // Pan if out of view
    if (!this.map.getBounds().contains(newLatLng)) {
      this.map.panTo(newLatLng, { animate: true, duration: 0.5 });
    }
  }

  // ===================== TIMER =====================

  private startTimer(): void {
    this.timerInterval = setInterval(() => {
      const seconds = this.trackingService.elapsedSeconds;
      const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
      const secs = (seconds % 60).toString().padStart(2, '0');
      this.elapsedTime = `${mins}:${secs}`;
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // ===================== ACTIONS =====================

  /** Re-center the map to show both markers */
  recenterMap(): void {
    if (!this.map) return;
    const markers: any[] = [];
    if (this.providerMarker) markers.push(this.providerMarker);
    if (this.userMarker) markers.push(this.userMarker);
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      this.map.fitBounds(group.getBounds().pad(0.2), { animate: true });
    }
  }

  /** Navigate back to the services page */
  goBack(): void {
    this.router.navigate(['/services']);
  }

  /** Get the number of location updates received */
  get updateCount(): number {
    return this.trackingService.locationHistory.length;
  }

  // ===================== CLEANUP =====================

  private destroyMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.providerMarker = null;
      this.userMarker = null;
      this.routeLine = null;
      this.trailLine = null;
    }
  }

  ngOnDestroy(): void {
    this.destroyMap();
    this.stopTimer();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
