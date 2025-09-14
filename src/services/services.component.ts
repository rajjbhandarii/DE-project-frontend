import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AccesspointService, AppUser } from '../app/accesspoint/accesspoint.service';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-services',
  imports: [CommonModule],
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.css']
})
export class ServicesComponent implements OnInit {
  currentUser$: Observable<AppUser | null>;
  userLocation: string = 'Vapi';
  userName: string = '';
  currentUser: any = '';
  serviceProviderName: any = '';
  serviceProviderEmail: string = '';

  constructor(private accesspointService: AccesspointService, private http: HttpClient) {
    this.currentUser$ = this.accesspointService.currentUser$;
    this.currentUser$.subscribe(Appuser => {
      if (Appuser) {
        console.log('User Data:', Appuser.type, Appuser.email, Appuser.name);
        // Check if user type is 'serviceProvider'
        if (Appuser.type === 'serviceProvider') {
          this.serviceProviderEmail = Appuser.email;
          this.currentUser = Appuser.type;
          this.serviceProviderName = Appuser.name;
        }
      } else {
        this.serviceProviderEmail = '';
      }
    });

    this.fetchServicesProvider();
  }

  servicesData = [
    {
      category: 'Towing Services',
      color: '#3b82f6', // blue-500
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #3b82f6;"><path d="M10 17.5 15 20l4-4-5-2.5-4 4Z"/><path d="m21.17 8-7.19-4-7.19 4-3.8 1.9a1 1 0 0 0-.59 1.52l4.4 7.58a1 1 0 0 0 1.7 0l4.4-7.58a1 1 0 0 0-.6-1.52Z"/></svg>',
      providers: [
        { rating: 4.5, price: 500 },
        { rating: 4.8, price: 600 }
      ]

    },
    {
      category: 'Fuel Delivery',
      color: '#ef4444', // red-500
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #ef4444;"><path d="M14 8V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v3"/><path d="M15.5 8.5 19 12v4a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-4l3.5-3.5a2 2 0 0 1 2.82 0L14 9.17a2 2 0 0 1 0 2.82L11.17 14a2 2 0 0 1-2.82 0L7 12.67"/><path d="M8 12h.01"/></svg>',
      providers: [
        { name: "Fast Fuel", rating: 4.7, price: 300 },
        { name: "Quick Petrol", rating: 4.6, price: 350 }
      ]
    },
    {
      category: 'Battery Assistance',
      color: '#22c55e', // green-500
      icon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #22c55e;"><rect width="18" height="14" x="3" y="7" rx="2" ry="2"/><line x1="7" x2="7" y1="3" y2="7"/><line x1="17" x2="17" y1="3" y2="7"/><line x1="7" x2="17" y1="14" y2="14"/></svg>',
      providers: [
        { name: "Battery Boosters", rating: 4.8, price: 400 },
        { name: "Jump Start Pro", rating: 4.9, price: 450 }
      ]
    }
  ];

  serviceProvidersData: any[] = [];

  ngOnInit(): void {
    if (this.currentUser !== 'serviceProvider') {
      setInterval(() => {
        this.fetchServicesProvider();
      }, 3000); // Fetch every 3 seconds
    }
  }

  fetchServicesProvider() {
    this.http.get<any[]>(environment.fetchServicesProvider).subscribe((allserviceProviders) => {
      this.serviceProvidersData = allserviceProviders.map(serviceProvider => ({ name: serviceProvider.serviceProviderName, email: serviceProvider.email }));
    });
  }


  setLocation(newLocation: string) {
    this.userLocation = newLocation;
    console.log(`Location set to: ${this.userLocation}`);
  }

  requestService(serviceProviderEmail: string, serviceCategory: string) {
    this.http.post(environment.requestServices, { email: serviceProviderEmail, name: this.userName, location: this.userLocation, category: serviceCategory })
      .subscribe((response) => {
        alert('Service request sent successfully!');
      });
  }
}
