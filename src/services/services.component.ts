import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { AccesspointService, AppUser } from '../app/accesspoint/accesspoint.service';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { io } from "socket.io-client";
import { ThemeServiceService } from '../app/theme-service.service';

/**
 * @interface DisplayService
 * A new, combined interface to hold both provider and service details together.
 * This makes it much easier for the HTML template to display all the needed info.
 */
interface DisplayService {
  providerId: any;
  providerName: string;
  serviceId: any;
  serviceName: string;
  price: number;
  category: string;
  description: string;
  rating: number;
}

/**
 * @interface ApiProvider
 * Represents the structure of a single provider object coming from the API.
 */
interface ApiProvider {
  _id: any;
  serviceProviderName: string;
  services: {
    _id: any;
    serviceName: string;
    price: number;
    category: string;
    description: string;
    rating: number;
  }[]; // Note: services is an array of objects
}

@Component({
  selector: 'app-services',
  imports: [CommonModule, FormsModule],
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.css']
})
export class ServicesComponent implements OnInit {
  currentState$: Observable<AppUser | null>;
  userLocation: string = 'Vapi';
  userName: string = '';
  socket: any;

  // These arrays will now hold our new `DisplayService` objects.
  TowingServices: DisplayService[] = [];
  FuelServices: DisplayService[] = [];
  BatteryServices: DisplayService[] = [];
  isDarkMode: boolean = false;
  constructor(private accesspointService: AccesspointService, private http: HttpClient, private themeService: ThemeServiceService) {
    this.currentState$ = this.accesspointService.currentState$;
    this.currentState$.subscribe(user => {
      if (user) {
        this.userName = user.name;
        this.isDarkMode = user.visual === 'dark';
      }
    });
  }

  ngOnInit(): void {
    this.fetchServicesProvider();

    this.socket = io(environment.baseUrl);
    this.socket.on('updateServiceProvider', (data: ApiProvider[]) => {
      this.assignServicesByCategory(data);
      console.log('Connected to socket server with ID:', this.socket.id);
    });
  }

  /**
   * @function fetchServicesProvider
   * Fetches the list of service providers and their services from the API.
   * It then transforms this data to make it easy to display in the template.
   */
  fetchServicesProvider(): void {
    this.http.get<ApiProvider[]>(environment.fetchServicesProvider).subscribe({
      next: (providers) => {
        // Clear out old data before populating
        this.TowingServices = [];
        this.FuelServices = [];
        this.BatteryServices = [];

        this.assignServicesByCategory(providers);

      },
      error: (error) => {
        console.error('Error fetching service providers:', error);
      }
    });
  }

  assignServicesByCategory(providers: ApiProvider[]): void {
    // Loop through each provider returned from the API
    providers.forEach(provider => {
      // Loop through the services offered by that provider
      provider.services.forEach(service => {
        // Create a new, combined object with all the details
        const displayService: DisplayService = {
          providerId: provider._id,
          providerName: provider.serviceProviderName,
          serviceId: service._id,
          serviceName: service.serviceName,
          price: service.price,
          category: service.category,
          description: service.description,
          rating: service.rating
        };

        // Add the combined object to the correct category array
        if (service.category === 'Towing service') {
          this.TowingServices.push(displayService);
        } else if (service.category === 'Fuel Delivery') {
          this.FuelServices.push(displayService);
        } else if (service.category === 'Battery Assistance') {
          this.BatteryServices.push(displayService);
        }
      });
    });
  }

  /**
   * @function setLocation
   * Updates the user's location based on input.
   * @param newLocation The new location string from the input field.
   */
  setLocation(newLocation: string): void {
    this.userLocation = newLocation;
    console.log(`Location set to: ${this.userLocation}`);
  }

  /**
   * @function requestService
   * Sends a service request to the backend.
   * @param providerId The ID of the provider being requested.
   */
  requestService(providerId: string, category: string): void {
    this.http.post(environment.requestServices, {
      _id: providerId,
      userName: this.userName,
      userLocation: this.userLocation,
      category: category,
      requestServiceId: new Date().getTime().toString() // Unique ID based on timestamp
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
}