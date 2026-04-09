import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  AccesspointService,
  AppUser,
} from '../../apps-services/access-point.service';
import { Observable, Subject, takeUntil } from 'rxjs';
import { ThemeServiceService } from '../../apps-services/theme.service';
import { ProcessesService } from '../../apps-services/processes.service';
import {
  ServiceApiService,
  Service,
} from '../../apps-services/service-api.service';

@Component({
  selector: 'app-service-management',
  imports: [FormsModule],
  templateUrl: './service-management.component.html',
  styleUrls: ['./service-management.component.css'],
})
export class ServiceManagementComponent implements OnInit, OnDestroy {
  currentState$: Observable<AppUser | null>;
  serviceProviderEmail!: string;
  isDarkMode: boolean = false;
  private destroy$ = new Subject<void>();

  // Array to hold the list of existing services
  currentServices: Service[] = [];

  // Object to bind to the form fields for a new service
  newService: Partial<Service> = {
    serviceId: new Date().getTime().toString(),
    serviceName: 'testservice',
    category: 'Towing Service',
    description: 'this is the test api',
    price: 560,
    location: 'Nargol',
  };

  constructor(
    private accesspointService: AccesspointService,
    private serviceApi: ServiceApiService,
    private themeService: ThemeServiceService,
    protected processesService: ProcessesService,
  ) {
    this.currentState$ = this.accesspointService.currentState$;
    this.currentState$.pipe(takeUntil(this.destroy$)).subscribe((Appuser) => {
      if (Appuser) {
        if (Appuser.type === 'serviceProvider') {
          this.serviceProviderEmail = Appuser.email;
        }
      } else {
        this.serviceProviderEmail = '';
      }
    });
    this.getAvailableServices();
  }

  ngOnInit(): void {
    this.themeService.isDarkMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isDark) => {
        this.isDarkMode = isDark;
      });
  }

  addToActiveServicesList(): void {
    // Create a complete Service object with a unique ID
    const serviceToAdd: Service = {
      serviceId: new Date().getTime().toString(), // Unique ID based on timestamp
      serviceName: this.newService.serviceName!,
      category: this.newService.category!,
      description: this.newService.description!,
      price: this.newService.price || 0,
      location: this.newService.location || '',
    };

    // Add the new service to the beginning of the array
    this.currentServices.unshift(serviceToAdd);

    // Reset the form fields for the next entry
    this.newService = {
      serviceId: new Date().getTime().toString(),
      serviceName: '',
      category: '',
      description: '',
      price: undefined,
      location: '',
    };
  }

  //to add a new service
  addService(): void {
    if (!this.newService && this.serviceProviderEmail) {
      this.themeService.displayNotification(
        'Error',
        'Please enter all required fields.',
        'error',
      );
      return;
    } else {
      this.serviceApi
        .addService(this.newService, this.serviceProviderEmail)
        .subscribe({
          next: () => {
            this.addToActiveServicesList();
            this.themeService.displayNotification(
              'Success',
              'Service added successfully.',
              'success',
            );
          },
          error: (error) => {
            console.log('Error adding service:', error);
            this.themeService.displayNotification(
              'Error',
              'Error adding service. Please try again later.',
              'error',
            );
          },
        });
    }
  }

  // Retrieve available services for the service provider
  getAvailableServices(): void {
    this.serviceApi.getServicesByProvider(this.serviceProviderEmail).subscribe({
      next: (services) => {
        services.forEach((n) => this.currentServices.push(n));
      },
      error: (error) => {
        console.error('Error fetching services:', error);
        this.themeService.displayNotification(
          'Error',
          'Error retrieving services. Please try again later.',
          'error',
        );
      },
    });
  }

  /**
   * Deletes a service from the list based on its ID.
   * @param serviceId The ID of the service to delete.
   */
  deleteService(serviceId: number): void {
    this.serviceApi
      .deleteService(serviceId.toString(), this.serviceProviderEmail)
      .subscribe({
        next: (response: any) => {
          this.currentServices = this.currentServices.filter(
            (service) => service.serviceId !== serviceId,
          );
          this.themeService.displayNotification(
            'Success',
            response.message || 'Service deleted successfully.',
            'success',
          );
        },
        error: (error) => {
          this.themeService.displayNotification(
            'Error',
            error.error?.message || 'An error occurred',
            'error',
          );
        },
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
