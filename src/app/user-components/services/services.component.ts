import { FormsModule } from '@angular/forms';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { AccesspointService, AppUser } from '../../apps-services/access-point.service';
import { Observable, Subject, takeUntil } from 'rxjs';
import { environment } from '../../environments/environment';
import { io, Socket } from "socket.io-client";
import { ThemeServiceService } from '../../apps-services/theme.service';
import { SocketService } from '../../apps-services/socket.service';
import { ProcessesService, DisplayService, ApiProvider } from '../../apps-services/processes.service';
import { ServiceApiService } from '../../apps-services/service-api.service';

@Component({
  selector: 'app-services',
  imports: [FormsModule],
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.css']
})
export class ServicesComponent implements OnInit, OnDestroy {
  currentState$: Observable<AppUser | null>;
  userLocation: string = 'Nargol';
  userName: string = '';
  socket: Socket = io(environment.baseUrl);
  isDarkMode: boolean = false;
  userEmail: string = '';
  servicesMapByCategory = new Map<string, DisplayService[]>();
  private destroy$ = new Subject<void>();

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
   */
  requestService(providerId: string, category: string): void {
    this.serviceApi.requestService({
      _id: providerId,
      userName: this.userName,
      userLocation: this.userLocation,
      category: category,
      requestServiceId: new Date().getTime().toString()
    }).subscribe({
      next: () => {
        this.themeService.displayNotification('Success', 'Your service request has been sent successfully!', 'success');
      },
      error: (error) => {
        console.error('Error sending service request:', error);
        this.themeService.displayNotification('Error', 'Failed to send service request. Please try again later.', 'error');
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.socket.disconnect();
  }
}