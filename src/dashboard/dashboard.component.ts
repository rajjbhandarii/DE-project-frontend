import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subject, takeUntil } from 'rxjs';
import { AccesspointService, AppUser } from '../app/accesspoint/accesspoint.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';
import { ActivatedRoute } from '@angular/router';

interface LiveRequest {
  userName: string;
  location: string;
  category: string;
}

interface TeamMember {
  name: string;
  status: string;
}

interface ActiveJob {
  name: string;
  service: string;
  location: string;
  team: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit, OnDestroy {
  title = 'Road Rescue';
  isMobileMenuOpen = false;
  isDarkMode = true;
  currentUser$: Observable<AppUser | null>;
  userEmail = '';
  currentUser = '';
  currentUserName = '';
  liveRequests: LiveRequest[] = [];
  private destroy$ = new Subject<void>();

  // Define teams and activeJobs
  activeJobs: ActiveJob[] = [
    { name: 'Rohan Singh', service: 'Towing', location: 'HSR Layout, Bangalore', team: 'Team Alpha' }
  ];

  teams: TeamMember[] = [
    { name: 'Team Alpha', status: 'On Job' },
    { name: 'Team Bravo', status: 'Available' },
    { name: 'Team Charlie', status: 'Available' },
    { name: 'Team Delta', status: 'Offline' }
  ];

  constructor(
    private accesspointService: AccesspointService,
    private http: HttpClient,
    private route: ActivatedRoute
  ) {
    this.currentUser$ = this.accesspointService.currentUser$;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.destroy$.unsubscribe();
  }

  ngOnInit(): void {
    // Subscribe to current user
    this.currentUser$.pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        if (user) {
          console.log('User Data:', user.type, user.email, user.name);

          if (user.type === 'serviceProvider') {
            this.userEmail = user.email;
            this.currentUser = user.type;
            this.currentUserName = user.name;
            console.log('Current User:', this.userEmail, this.currentUser);

            // Set interval for service provider
            this.setupServiceProviderInterval();
          }
        } else {
          this.userEmail = '';
          this.currentUser = '';
          this.currentUserName = '';
        }
      });

    // Check if we need to scroll to a specific section
    this.route.data.pipe(takeUntil(this.destroy$)).subscribe(data => {
      if (data['scrollToSection']) {
        setTimeout(() => {
          this.scrollToSection(data['scrollToSection']);
        }, 100); // Short delay to ensure DOM is ready
      } else if (data['scrollToSection'] === undefined) {
        this.scrollToSection('hero');
      }
    });
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  setupServiceProviderInterval(): void {
    if (this.currentUser === 'serviceProvider' && this.userEmail) {
      setInterval(() => {
        this.http.post<LiveRequest[]>(
          environment.fetchServicesRequests,
          { serviceProviderEmail: this.userEmail }
        ).subscribe({
          next: (data) => {
            this.liveRequests = data || [];
          },
          error: (error) => {
            console.error('Failed to fetch services:', error);
          }
        });
      }, 3000);
    }
  }

  // Method to scroll to a specific section
  scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // Function to dispatch a request
  dispatch(requestIndex: number): void {
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
      name: requestToDispatch?.userName || '',
      service: requestToDispatch?.category || '',
      location: requestToDispatch?.location || '',
      team: availableTeam.name
    });

    // Remove the request from the live queue
    this.liveRequests.splice(requestIndex, 1);

    // Update the team's status
    availableTeam.status = 'On Job';
  }
}