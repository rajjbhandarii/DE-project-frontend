import { Component, OnInit, OnDestroy } from '@angular/core';
import { ThemeServiceService } from '../app/theme-service.service';
import { HttpClient } from '@angular/common/http';
import { AccesspointService, AppUser } from '../app/accesspoint/accesspoint.service';
import { FormsModule } from '@angular/forms';
import { environment } from '../environments/environment';
import { CommonModule } from '@angular/common';
import { Observable, Subject, takeUntil } from 'rxjs';
import { io } from 'socket.io-client';

interface ActiveJob {
  name: string;
  service: string;
  location: string;
  team: string;
}
interface ActiveRequest {
  requestServiceId: string;
  userName: string;
  userLocation: string;
  category: string;
  createdAt: number;
}

interface TeamMember {
  name: string;
  status: string;
}

@Component({
  selector: 'app-SP-dashboard',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './SP-dashboard.component.html',
  styleUrl: './SP-dashboard.component.css'
})

export class SPDashboardComponent implements OnInit, OnDestroy {
  isDarkMode: boolean = false; // Default to light mode
  liveRequests: ActiveRequest[] = [];
  State$: Observable<AppUser | null>;
  currentUser: string = '';
  userEmail: string = '';
  currentUserName = '';
  private destroy$ = new Subject<void>();
  socket: any;
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
    private themeService: ThemeServiceService
  ) {
    this.State$ = this.accesspointService.currentState$;
  }

  ngOnInit(): void {
    this.State$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      if (user) {
        this.userEmail = user.email;
        this.currentUser = user.type;
        this.currentUserName = user.name;
        this.isDarkMode = user.visual === 'dark' ? true : false;
        this.themeService.updateUserThemePreference(user.visual as 'light' | 'dark');
        this.fetchServiceRequest();
      } else {
        this.themeService.displayNotification('Error', 'User not found', 'error');
      }
    });

    this.themeService.isDarkMode$.pipe(takeUntil(this.destroy$)).subscribe((isDark: boolean) => {
      this.isDarkMode = isDark;
    });

    // init socket for provider real-time updates
    this.socket = io(environment.baseUrl);
    // register provider when email available
    this.State$.pipe(takeUntil(this.destroy$)).subscribe(user => {
      if (user) {
        this.socket.emit('registerProvider', user.email);
      }
    });

    this.socket.on('serviceRequestUpdated/provider-dashboard', (data: ActiveRequest[]) => {
      this.liveRequests = data as ActiveRequest[];
    });
  }

  fetchServiceRequest(): void {

    this.http.post<ActiveRequest[]>(environment.fetchServicesRequests, { serviceProviderEmail: this.userEmail }).subscribe({
      next: (data) => this.liveRequests = data || [],
      error: (error) => console.error('Failed to fetch services:', error)
    });

  }
  dispatch(requestIndex: number): void {
    // const availableTeam = this.teams.find(team => team.status === 'Available');
    // if (!availableTeam) {
    //   this.themeService.displayNotification('Error', 'No teams are currently available.', 'error');
    //   return;
    // }
    // const requestToDispatch = this.liveRequests[requestIndex];
    // this.activeJobs.unshift({
    //   name: requestToDispatch?.userName || '',
    //   service: requestToDispatch?.category || '',
    //   location: requestToDispatch?.userLocation || '',
    //   team: availableTeam.name
    // });
    // this.liveRequests.splice(requestIndex, 1);
    // availableTeam.status = 'On Job';
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    try { this.socket?.disconnect?.(); } catch { }
  }
}
