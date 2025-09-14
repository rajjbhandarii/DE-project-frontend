import { CommonModule } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { Observable, Subject, takeUntil } from 'rxjs';
import { AccesspointService, AppUser } from '../app/accesspoint/accesspoint.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

interface liveRequests {
  userName: string;
  location: string;
  category: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})

export class DashboardComponent implements OnDestroy {
  title = 'Road Rescue';
  isMobileMenuOpen = false;
  isDarkMode = true;
  currentUser$: Observable<AppUser | null>;
  userEmail: any = '';
  currentUser: any = '';
  currentUserName: any = '';
  liveRequests: liveRequests[] = [];
  private destroy$ = new Subject<void>();

  constructor(private accesspointService: AccesspointService, private http: HttpClient) {
    this.currentUser$ = this.accesspointService.currentUser$;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  ngOnInit(): void {
    this.currentUser$.pipe(takeUntil(this.destroy$))
      .subscribe(Appuser => {
        if (Appuser) {
          console.log('User Data:', Appuser.type, Appuser.email, Appuser.name);
          // Check if Appuser type is 'serviceProvider'
          if (Appuser.type === 'serviceProvider') {
            this.userEmail = Appuser.email;
            this.currentUser = Appuser.type;
            this.currentUserName = Appuser.name;
            console.log('Current User:', this.userEmail, this.currentUser);
          }
        } else {
          this.userEmail = '';
        }
      });

    if (this.currentUser === 'serviceProvider') {
      setInterval(() => {
        this.http.post<liveRequests[]>(environment.fetchServicesRequests, { serviceProviderEmail: this.userEmail }).subscribe({
          next: (data) => {
            this.liveRequests = data || [];
          },
          error: (error: unknown) => {
            console.error('Failed to fetch services:', error);
          }
        });
      }, 3000);
    }
  }

  activeJobs = [
    { name: 'Rohan Singh', service: 'Towing', location: 'HSR Layout, Bangalore', team: 'Team Alpha' }
  ];

  teams = [
    { name: 'Team Alpha', status: 'On Job' },
    { name: 'Team Bravo', status: 'Available' },
    { name: 'Team Charlie', status: 'Available' },
    { name: 'Team Delta', status: 'Offline' }
  ];

  // Function to dispatch a request
  dispatch(requestIndex: number) {
    // Find an available team
    const availableTeam = this.teams.find(team => team.status === 'Available');
    if (!availableTeam) {
      alert('No teams are currently available.');
      return;
    }

    // Get the request to be dispatched
    const requestToDispatch = this.liveRequests[requestIndex];

    // Add the request to active jobs
    this.activeJobs.unshift({
      ...requestToDispatch,
      team: availableTeam.name,
      name: '',
      service: '',
      location: ''
    });

    // Remove the request from the live queue
    this.liveRequests.splice(requestIndex, 1);

    // Update the team's status
    availableTeam.status = 'On Job';
  }
}
