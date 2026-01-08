import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, OnInit } from '@angular/core';
import { AccesspointService, AppUser } from '../app/accesspoint/accesspoint.service';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { io, Socket } from "socket.io-client";
import { ThemeServiceService } from '../app/theme-service.service';
import { SocketService } from '../app/socket.service';
import { ProcessesService, DisplayService, ApiProvider } from '../app/processes.service';

@Component({
  selector: 'app-services',
  imports: [CommonModule, FormsModule],
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.css']
})
export class ServicesComponent implements OnInit {
  currentState$: Observable<AppUser | null>;
  userLocation: string = 'vapi';
  userName: string = '';
  socket: Socket = io(environment.baseUrl);
  isDarkMode: boolean = false;
  userEmail: string = '';
  servicesMapByCategory = new Map<string, DisplayService[]>();

  get categoryKeys(): string[] {
    return Array.from(this.servicesMapByCategory.keys());
  }

  constructor(private accesspointService: AccesspointService, private socketService: SocketService, private http: HttpClient, private themeService: ThemeServiceService, protected processesService: ProcessesService) {
    this.currentState$ = this.accesspointService.currentState$;
    this.currentState$.subscribe(user => {
      if (user) {
        this.userName = user.name;
        this.isDarkMode = user.visual === 'dark';
        this.userEmail = user.email;
      }
    });
  }

  ngOnInit(): void {
    const email = this.userEmail;

    this.fetchServicesProvider();

    this.socketService.joinRoom(
      `user:services:${email}`
    );

    this.socketService.onServiceUpdate((payload: any) => {
      console.log('Received services update via socket:', payload);

      // Server sends an array: [{ providerId, serviceProviderName, service: [...] }]
      const dataArray = Array.isArray(payload) ? payload : [payload];

      const transformedPayload: ApiProvider[] = dataArray.map(item => ({
        _id: item.providerId,
        serviceProviderName: item.serviceProviderName,
        services: item.service
      }));

      const updatedServicesByCategory = this.processesService.assignServicesByCategory(transformedPayload, this.userLocation);
      // this.servicesMapByCategory =
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
        this.servicesMapByCategory = this.processesService.assignServicesByCategory(providers, this.userLocation);
        console.log('Fetched service providers:', providers);
      },
      error: (error) => {
        console.error('Error fetching service providers:', error);
      }
    });
  }

  /**
   * @function setLocation
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
  ngOnDestroy(): void {
    this.socket.disconnect();
  }
}