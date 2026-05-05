import { FormsModule } from '@angular/forms';
import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { AccesspointService, AppUser } from '../../apps-services/access-point.service';
import { Observable, Subject, takeUntil } from 'rxjs';
import { ThemeServiceService } from '../../apps-services/theme.service';
import { SocketService } from '../../apps-services/socket.service';
import { ProcessesService, DisplayService, ApiProvider } from '../../apps-services/processes.service';
import { ServiceApiService } from '../../apps-services/service-api.service';
import { CommonModule } from '@angular/common';

declare const L: any; // Leaflet is loaded via CDN in index.html

interface TrackingInfo {
  lat: number;
  lng: number;
  providerName: string;
  requestServiceId: string;
}

@Component({
  selector: 'app-services',
  imports: [FormsModule, CommonModule],
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.css']
})
export class ServicesComponent implements OnInit, OnDestroy {
  @ViewChild('trackingMap', { static: false }) trackingMapElement!: ElementRef;

  currentState$: Observable<AppUser | null>;
  userLocation: string = 'Nargol';
  userName: string = '';
  isDarkMode: boolean = false;
  userEmail: string = '';
  servicesMapByCategory = new Map<string, DisplayService[]>();
  private destroy$ = new Subject<void>();
  isRequested: boolean = false;

  // --- Tracking state ---
  isTrackingActive: boolean = false;
  trackingInfo: TrackingInfo | null = null;
  private map: any = null;
  private providerMarker: any = null;
  private userMarker: any = null;
  private routeLine: any = null;

  get categoryKeys(): string[] {
    return Array.from(this.servicesMapByCategory.keys());
  }

  constructor(
    private accesspointService: AccesspointService,
    private socketService: SocketService,
    private serviceApi: ServiceApiService,
    private themeService: ThemeServiceService,
    protected processesService: ProcessesService
  ) {
    this.currentState$ = this.accesspointService.currentState$;
    this.currentState$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      if (user) {
        this.userName = user.name;
        this.isDarkMode = user.visual === 'dark';
        this.userEmail = user.email;
      }
    });
  }

  ngOnInit(): void {
    this.fetchServicesProvider();

    // Join the user's room so we receive tracking events
    this.socketService.joinRoom(this.userEmail);

    // Listen for service updates via socket
    this.socketService.onServiceUpdate((payload: ApiProvider[]) => {
      try {
        const newDisplayServices = this.processesService.convertApiProviderToDisplayService(payload);

        newDisplayServices.forEach(newService => {
          const category = newService.category;
          const existingServices = this.servicesMapByCategory.get(category) || [];

          // Check if service already exists (by serviceId and providerId)
          const serviceExists = existingServices.some(
            s => s.serviceId === newService.serviceId && s.providerId === newService.providerId
          );

          if (!serviceExists) {
            // Create new array to trigger change detection
            const updatedServices = [...existingServices, newService];
            this.servicesMapByCategory.set(category, updatedServices);
          }
        });
      } catch (error) {
        try {
          this.fetchServicesProvider();
        } catch (error) {
          this.themeService.displayNotification('Error', 'Failed to update services. Please refresh the page.', 'error');
        }
      }
    });

    // --- Listen for real-time provider location updates ---
    this.socketService.onProviderLocationUpdate((data: TrackingInfo) => {
      this.trackingInfo = data;
      if (!this.isTrackingActive) {
        this.isTrackingActive = true;
        this.themeService.displayNotification(
          '🚗 Provider En Route',
          `${data.providerName} is on the way! Live tracking is now active.`,
          'success'
        );
        // Give Angular a tick to render the map container, then init
        setTimeout(() => this.initTrackingMap(data), 100);
      } else {
        this.updateProviderPosition(data);
      }
    });

    // --- Listen for provider stopped tracking ---
    this.socketService.onProviderStopped((data) => {
      this.isTrackingActive = false;
      this.trackingInfo = null;
      this.themeService.displayNotification(
        '✅ Provider Arrived',
        `${data.providerName} has arrived or stopped sharing location.`,
        'success'
      );
      this.destroyMap();
    });
  }

  /**
   * Fetches the list of service providers and their services from the API.
   * It then transforms this data to make it easy to display in the template.
   */
  fetchServicesProvider(): void {
    this.serviceApi.fetchServiceProviders().subscribe({
      next: (providers) => {
        this.servicesMapByCategory = this.processesService.assignServicesByCategory(providers, this.userLocation);
        console.log('Fetched service providers:', providers);
      },
      error: (error) => {
        console.error('Error fetching service providers:', error);
      }
    });
  }

  /**
   * Updates the user's location based on input.
   * @param newLocation The new location string from the input field.
   */
  setLocation(newLocation: string): void {
    this.userLocation = newLocation;
    const allServices: DisplayService[] = [];
    this.servicesMapByCategory.forEach(services => {
      allServices.push(...services);
    });
    this.servicesMapByCategory = this.processesService.assignServicesByCategory(allServices, this.userLocation);
  }

  /**
   * Sends a service request to the backend.
   * @param providerId The ID of the provider being requested.
   * @param providerEmail The email of the provider being requested.
   * @param category The category of the service being requested.
   */
  requestService(providerId: string, providerEmail: string, category: string): void {
    const requestServiceId: string = new Date().getTime().toString();
    this.serviceApi.requestService({
      email: this.userEmail,
      _id: providerId,
      userName: this.userName,
      userLocation: this.userLocation,
      category: category,
      requestServiceId,
      isRequested: true
    }).subscribe({
      next: () => {
        this.sendNotificationToProvider(providerEmail, this.userLocation, requestServiceId, this.userName);
        this.themeService.displayNotification('Success', 'Your service request has been sent successfully!', 'success');
      },
      error: (error) => {
        console.error('Error sending service request:', error);
        this.themeService.displayNotification('Error', 'Failed to send service request. Please try again later.', 'error');
      }
    });
  }

  sendNotificationToProvider(providerEmail: string, userLocation: string, serviceId: string, name: string): void {
    this.socketService.sendNotificationToProvider(providerEmail, {
      message: `New service request from ${name} located at ${userLocation}`,
      requestServiceId: serviceId,
      userLocation,
      userName: name
    });
  }

  // ===================== TRACKING MAP METHODS =====================

  /**
   * Initializes the Leaflet map when tracking starts.
   */
  private initTrackingMap(data: TrackingInfo): void {
    if (this.map) {
      this.destroyMap();
    }

    const mapContainer = document.getElementById('tracking-map-container');
    if (!mapContainer) return;

    // Choose tile layer based on dark/light mode
    const tileUrl = this.isDarkMode
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const tileAttribution = this.isDarkMode
      ? '&copy; <a href="https://carto.com/">CARTO</a>'
      : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

    this.map = L.map('tracking-map-container', {
      zoomControl: true,
      attributionControl: true,
    }).setView([data.lat, data.lng], 15);

    L.tileLayer(tileUrl, {
      attribution: tileAttribution,
      maxZoom: 19,
    }).addTo(this.map);

    // Create a custom icon for the provider (vehicle-like)
    const providerIcon = L.divIcon({
      html: `<div class="provider-map-icon">
               <i class="fa-solid fa-truck-fast"></i>
             </div>`,
      className: 'custom-div-icon',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    // Provider marker
    this.providerMarker = L.marker([data.lat, data.lng], { icon: providerIcon })
      .addTo(this.map)
      .bindPopup(`<strong>${data.providerName}</strong><br>Service Provider`)
      .openPopup();

    // Try to get user's current location and show it too
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const userIcon = L.divIcon({
            html: `<div class="user-map-icon">
                     <i class="fa-solid fa-user"></i>
                   </div>`,
            className: 'custom-div-icon',
            iconSize: [36, 36],
            iconAnchor: [18, 18],
          });

          this.userMarker = L.marker([pos.coords.latitude, pos.coords.longitude], { icon: userIcon })
            .addTo(this.map)
            .bindPopup('<strong>You</strong><br>Your Location');

          // Draw a route line between provider and user
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

          // Fit map to show both markers
          const group = L.featureGroup([this.providerMarker, this.userMarker]);
          this.map.fitBounds(group.getBounds().pad(0.3));
        },
        () => {
          // User denied geolocation — just center on provider
          console.warn('User geolocation not available for map display.');
        }
      );
    }

    // Force Leaflet to recalculate size (fixes rendering in dynamic containers)
    setTimeout(() => {
      this.map?.invalidateSize();
    }, 200);
  }

  /**
   * Updates the provider marker's position on the map.
   */
  private updateProviderPosition(data: TrackingInfo): void {
    if (!this.map || !this.providerMarker) return;

    const newLatLng = L.latLng(data.lat, data.lng);
    this.providerMarker.setLatLng(newLatLng);

    // Update the route line if user marker exists
    if (this.routeLine && this.userMarker) {
      const userLatLng = this.userMarker.getLatLng();
      this.routeLine.setLatLngs([newLatLng, userLatLng]);
    }

    // Smoothly pan the map to keep provider in view
    if (!this.map.getBounds().contains(newLatLng)) {
      this.map.panTo(newLatLng, { animate: true, duration: 0.5 });
    }
  }

  /**
   * Closes the tracking panel manually.
   */
  closeTrackingPanel(): void {
    this.isTrackingActive = false;
    this.trackingInfo = null;
    this.destroyMap();
  }

  /**
   * Cleans up the Leaflet map instance.
   */
  private destroyMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.providerMarker = null;
      this.userMarker = null;
      this.routeLine = null;
    }
  }

  ngOnDestroy(): void {
    this.destroyMap();
    this.destroy$.next();
    this.destroy$.complete();
  }
}