import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { AccesspointService, AppUser } from '../app/accesspoint/accesspoint.service';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';

export interface Service {
  serviceId: any;
  name: string;
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
  currentUser$: Observable<AppUser | null>;
  serviceProviderEmail!: string;

  // Array to hold the list of existing services
  currentServices: Service[] = [];

  // Object to bind to the form fields for a new service
  newService: Partial<Service> = {
    serviceId: new Date().getTime().toString(),
    name: '',
    category: '',
    description: '',
    price: 400
  };

  // Available categories for the dropdown
  categories: string[] = ['Towing service', 'Fuel Delivery', 'Battery Assistance'];

  constructor(private accesspointService: AccesspointService, private http: HttpClient) {
    this.currentUser$ = this.accesspointService.currentUser$;
    this.currentUser$.subscribe(Appuser => {
      if (Appuser) {
        console.log('User Data:', Appuser.type, Appuser.email, Appuser.name);
        if (Appuser.type === 'serviceProvider') {
          this.serviceProviderEmail = Appuser.email;
        }
      } else {
        this.serviceProviderEmail = '';
      }
    });
  }

  addToActiveServicesList() {
    // Create a complete Service object with a unique ID
    const serviceToAdd: Service = {
      serviceId: new Date().getTime().toString(), // Unique ID based on timestamp
      name: this.newService.name!,
      category: this.newService.category!,
      description: this.newService.description!,
      price: this.newService.price || 0
    };

    // Add the new service to the beginning of the array
    this.currentServices.unshift(serviceToAdd);

    // Reset the form fields for the next entry
    this.newService = {
      serviceId: new Date().getTime().toString(),
      name: '',
      category: '',
      description: '',
      price: undefined
    };
  }

  addService(): void {
    if (!this.newService.name && !this.newService.price && !this.categories && !this.newService.description) {
      alert('Please enter a service name and price.');
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

  /**
   * Deletes a service from the list based on its ID.
   * @param serviceId The ID of the service to delete.
   */
  deleteService(serviceId: number): void {
    this.currentServices = this.currentServices.filter(service => service.serviceId !== serviceId);
  }
}
