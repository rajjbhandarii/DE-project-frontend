import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AccesspointService, AppUser } from '../app/accesspoint/accesspoint.service';
import { Observable, Subject, takeUntil } from 'rxjs';
import { environment } from '../environments/environment';
import { TheamServiceService } from '../app/theam-service.service';

export interface Service {
  serviceId: any;
  serviceName: string;
  category: string;
  description: string;
  price: number;
}

@Component({
  selector: 'app-service-management',
  imports: [CommonModule, FormsModule],
  templateUrl: './service-management.component.html',
  styleUrls: ['./service-management.component.css']
})
export class ServiceManagementComponent {

  currentState$: Observable<AppUser | null>;
  serviceProviderEmail!: string;
  isDarkMode: boolean = false;
  private destroy$ = new Subject<void>();
  // Available categories for the dropdown
  categories: string[] = ['Towing service', 'Fuel Delivery', 'Battery Assistance'];


  // Array to hold the list of existing services
  currentServices: Service[] = [];

  // Object to bind to the form fields for a new service
  newService: Partial<Service> = {
    serviceId: new Date().getTime().toString(),
    serviceName: '',
    category: '',
    description: '',
    price: 400
  };


  constructor(private accesspointService: AccesspointService, private http: HttpClient, private themeService: TheamServiceService) {
    this.currentState$ = this.accesspointService.currentState$;
    this.currentState$.subscribe(Appuser => {
      if (Appuser) {
        console.log('User Data:', Appuser.type, Appuser.email, Appuser.name);
        if (Appuser.type === 'serviceProvider') {
          this.serviceProviderEmail = Appuser.email;
        }
      } else {
        this.serviceProviderEmail = '';
      }
    });
    this.getAvaliableServices();
  }
  ngOnInit(): void {
    this.themeService.isDarkMode$.pipe(takeUntil(this.destroy$))
      .subscribe(isDark => {
        this.isDarkMode = isDark;
      });
  }

  addToActiveServicesList() {
    // Create a complete Service object with a unique ID
    const serviceToAdd: Service = {
      serviceId: new Date().getTime().toString(), // Unique ID based on timestamp
      serviceName: this.newService.serviceName!,
      category: this.newService.category!,
      description: this.newService.description!,
      price: this.newService.price || 0
    };

    this.http.get

    // Add the new service to the beginning of the array
    this.currentServices.unshift(serviceToAdd);

    // Reset the form fields for the next entry
    this.newService = {
      serviceId: new Date().getTime().toString(),
      serviceName: '',
      category: '',
      description: '',
      price: undefined
    };
  }

  addService(): void {
    if (!this.newService.serviceName && !this.newService.price && !this.categories && !this.newService.description) {
      alert('Please enter all required fields.');
      return;
    } else {
      if (!this.serviceProviderEmail) {
        alert('Service Provider email is missing.');
        return;
      } else {
        this.http.post(environment.addNewServices, { ...this.newService, serviceProviderEmail: this.serviceProviderEmail }).subscribe({
          next: (response) => {
            this.addToActiveServicesList();
            console.log('Service added successfully:', response);
          }, error: (error) => {
            console.error('Error adding service:', error);
          }
        });
      }
    }
  }

  getAvaliableServices() {
    this.http.get<Service[]>(environment.getServicesCategory, { params: { serviceProviderEmail: this.serviceProviderEmail } }).subscribe({
      next: (services) => {
        services.forEach(n => this.currentServices.push(n))
        console.log(this.currentServices);
      }, error: (error) => {
        console.error('Error retrieving services:', error);
      }
    });
  }
  /**
   * Deletes a service from the list based on its ID.
   * @param serviceId The ID of the service to delete.
   */
  deleteService(serviceId: number): void {
    this.currentServices = this.currentServices.filter(service => service.serviceId !== serviceId);
  }


}
