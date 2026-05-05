import { FormsModule } from '@angular/forms';
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import {
  AccesspointService,
  AppUser,
} from '../../apps-services/access-point.service';
import { Observable, Subject, takeUntil } from 'rxjs';
import { ThemeServiceService } from '../../apps-services/theme.service';
import { SocketService } from '../../apps-services/socket.service';
import {
  ProcessesService,
  DisplayService,
  ApiProvider,
} from '../../apps-services/processes.service';
import { ServiceApiService } from '../../apps-services/service-api.service';
import { TrackingService } from '../../apps-services/tracking.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-services',
  imports: [FormsModule, CommonModule],
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.css'],
})
export class ServicesComponent implements OnInit, OnDestroy {
  currentState$: Observable<AppUser | null>;
  userLocation: string = 'Nargol';
  userName: string = '';
  isDarkMode: boolean = false;
  userEmail: string = '';
  servicesMapByCategory = new Map<string, DisplayService[]>();
  private destroy$ = new Subject<void>();
  isRequested: boolean = false;

  /** Whether a provider is currently en route (tracking active) */
  isTrackingActive = false;
  trackingProviderName = '';

  get categoryKeys(): string[] {
    return Array.from(this.servicesMapByCategory.keys());
  }

  constructor(
    private accesspointService: AccesspointService,
    private serviceApi: ServiceApiService,
    private themeService: ThemeServiceService,
    protected processesService: ProcessesService,
    private trackingService: TrackingService,
    private router: Router,
  ) {
    this.currentState$ = this.accesspointService.currentState$;
    this.currentState$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      if (user) {
        this.userName = user.name;
        this.isDarkMode = user.visual === 'dark';
        this.userEmail = user.email;
      }
    });
  }

  socketService = inject(SocketService);

  ngOnInit(): void {
    this.fetchServicesProvider();

    // Initialize the tracking service (idempotent, sets up socket listeners)
    this.trackingService.init(this.userEmail);

    // Listen for service updates via socket
    this.socketService.onServiceUpdate((payload: ApiProvider[]) => {
      try {
        const newDisplayServices =
          this.processesService.convertApiProviderToDisplayService(payload);

        newDisplayServices.forEach((newService) => {
          const category = newService.category;
          const existingServices =
            this.servicesMapByCategory.get(category) || [];

          // Check if service already exists (by serviceId and providerId)
          const serviceExists = existingServices.some(
            (s) =>
              s.serviceId === newService.serviceId &&
              s.providerId === newService.providerId,
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
          this.themeService.displayNotification(
            'Error',
            'Failed to update services. Please refresh the page.',
            'error',
          );
        }
      }
    });

    // Subscribe to tracking state changes (from TrackingService)
    this.trackingService.isActive$
      .pipe(takeUntil(this.destroy$))
      .subscribe((active) => {
        this.isTrackingActive = active;
      });

    this.trackingService.tracking$
      .pipe(takeUntil(this.destroy$))
      .subscribe((info) => {
        if (info) {
          this.trackingProviderName = info.providerName;
        }
      });

    // Show notification when provider arrives
    this.trackingService.stopped$
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (data) {
          this.themeService.displayNotification(
            '✅ Provider Arrived',
            `${data.providerName} has arrived or stopped sharing location.`,
            'success',
          );
        }
      });
  }

  /**
   * Fetches the list of service providers and their services from the API.
   * It then transforms this data to make it easy to display in the template.
   */
  fetchServicesProvider(): void {
    this.serviceApi.fetchServiceProviders().subscribe({
      next: (providers) => {
        this.servicesMapByCategory =
          this.processesService.assignServicesByCategory(
            providers,
            this.userLocation,
          );
        console.log('Fetched service providers:', providers);
      },
      error: (error) => {
        console.error('Error fetching service providers:', error);
      },
    });
  }

  /**
   * Updates the user's location based on input.
   * @param newLocation The new location string from the input field.
   */
  setLocation(newLocation: string): void {
    this.userLocation = newLocation;
    const allServices: DisplayService[] = [];
    this.servicesMapByCategory.forEach((services) => {
      allServices.push(...services);
    });
    this.servicesMapByCategory = this.processesService.assignServicesByCategory(
      allServices,
      this.userLocation,
    );
  }

  /**
   * Sends a service request to the backend.
   * @param providerId The ID of the provider being requested.
   * @param providerEmail The email of the provider being requested.
   * @param category The category of the service being requested.
   */
  requestService(
    providerId: string,
    providerEmail: string,
    category: string,
  ): void {
    const requestServiceId: string = new Date().getTime().toString();
    this.serviceApi
      .requestService({
        email: this.userEmail,
        _id: providerId,
        userName: this.userName,
        userLocation: this.userLocation,
        category: category,
        requestServiceId,
        isRequested: true,
      })
      .subscribe({
        next: () => {
          this.sendNotificationToProvider(
            providerEmail,
            this.userLocation,
            requestServiceId,
            this.userName,
          );
          this.themeService.displayNotification(
            'Success',
            'Your service request has been sent successfully!',
            'success',
          );
        },
        error: (error) => {
          console.error('Error sending service request:', error);
          this.themeService.displayNotification(
            'Error',
            'Failed to send service request. Please try again later.',
            'error',
          );
        },
      });
  }

  sendNotificationToProvider(
    providerEmail: string,
    userLocation: string,
    serviceId: string,
    name: string,
  ): void {
    this.socketService.sendNotificationToProvider(providerEmail, {
      message: `New service request from ${name} located at ${userLocation}`,
      requestServiceId: serviceId,
      userLocation,
      userName: name,
    });
  }

  /** Navigate to the dedicated tracking page */
  openTrackingPage(): void {
    this.router.navigate(['/track-provider']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
