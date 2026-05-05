import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ThemeServiceService } from '../../apps-services/theme.service';
import {
  AccesspointService,
  AppUser,
} from '../../apps-services/access-point.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Observable, Subject, takeUntil } from 'rxjs';
import { SocketService } from '../../apps-services/socket.service';
import { Router } from '@angular/router';
import {
  ServiceApiService,
  ActiveRequest,
} from '../../apps-services/service-api.service';

export interface ActiveJob {
  requestServiceId: string;
  userName: string;
  userEmail: string;
  category: string;
  location: string;
  team: string;
  startedAt: number;
}

export interface TeamMember {
  name: string;
  status: 'Available' | 'On Job' | 'Offline';
  currentJob: string | null; // requestServiceId or null
}

@Component({
  selector: 'app-sp-dashboard',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './sp-dashboard.component.html',
  styleUrl: './sp-dashboard.component.css',
})
export class SpDashboardComponent implements OnInit, OnDestroy {
  isDarkMode: boolean = false;
  liveRequests: ActiveRequest[] = [];
  State$: Observable<AppUser | null>;
  currentUser: string = '';
  userEmail: string = '';
  currentUserName = '';
  private destroy$ = new Subject<void>();

  /** Active dispatched jobs */
  activeJobs: ActiveJob[] = [];

  /** Team members pool */
  teams: TeamMember[] = [
    { name: 'Team Towing', status: 'Available', currentJob: null },
    { name: 'Team Fuel', status: 'Available', currentJob: null },
    { name: 'Team Battery', status: 'Available', currentJob: null },
    { name: 'Team Mechanic', status: 'Offline', currentJob: null },
  ];

  /** Tracks active geolocation watches keyed by requestServiceId */
  trackingMap = new Map<string, number>();

  /** Show the team picker dropdown for a specific request */
  showTeamPickerFor: string | null = null;

  constructor(
    private accesspointService: AccesspointService,
    private serviceApi: ServiceApiService,
    private router: Router,
    private themeService: ThemeServiceService,
  ) {
    this.State$ = this.accesspointService.currentState$;
  }

  socketService = inject(SocketService);

  ngOnInit(): void {
    this.State$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      if (user) {
        this.userEmail = user.email;
        this.currentUser = user.type;
        this.currentUserName = user.name;
        this.isDarkMode = user.visual === 'dark' ? true : false;
        this.themeService.updateUserThemePreference(
          user.visual as 'light' | 'dark',
        );
        this.fetchServiceRequest();
      } else {
        this.router.navigate(['/service-provider-login']);
      }
    });

    this.themeService.isDarkMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isDark: boolean) => {
        this.isDarkMode = isDark;
      });

    const email = this.userEmail;
    this.socketService.joinRoom(email);

    this.socketService.onServiceRequestUpdate((request: ActiveRequest) => {
      this.liveRequests = [request, ...this.liveRequests];
    });
  }

  fetchServiceRequest(): void {
    this.serviceApi.fetchServiceRequests(this.userEmail).subscribe({
      next: (data) => {
        this.liveRequests = data;
        console.log('Fetched service requests:', data);
      },
      error: (error) =>
        console.error('Failed to fetch services request:', error),
    });
  }

  // ===================== TEAM MANAGEMENT =====================

  /** Get only teams that are available for assignment */
  get availableTeams(): TeamMember[] {
    return this.teams.filter((t) => t.status === 'Available');
  }

  /** Get count of teams by status */
  get availableCount(): number {
    return this.teams.filter((t) => t.status === 'Available').length;
  }
  get onJobCount(): number {
    return this.teams.filter((t) => t.status === 'On Job').length;
  }
  get offlineCount(): number {
    return this.teams.filter((t) => t.status === 'Offline').length;
  }

  /** Toggle a team between Available and Offline */
  toggleTeamOnline(team: TeamMember): void {
    if (team.status === 'On Job') return; // Can't toggle if on a job
    team.status = team.status === 'Available' ? 'Offline' : 'Available';
  }

  /** Show team picker for a request */
  openTeamPicker(requestServiceId: string): void {
    if (this.availableTeams.length === 0) {
      this.themeService.displayNotification(
        'No Teams Available',
        'All teams are currently busy or offline. Please wait.',
        'error',
      );
      return;
    }
    this.showTeamPickerFor = requestServiceId;
  }

  /** Close the team picker */
  closeTeamPicker(): void {
    this.showTeamPickerFor = null;
  }

  // ===================== DISPATCH =====================

  /**
   * Dispatch a request with a specific team assignment.
   * Creates an active job, marks the team as "On Job", and starts tracking.
   */
  dispatchWithTeam(req: ActiveRequest, team: TeamMember): void {
    this.closeTeamPicker();

    // Assign team
    team.status = 'On Job';
    team.currentJob = req.requestServiceId;

    // Create active job
    const job: ActiveJob = {
      requestServiceId: req.requestServiceId,
      userName: req.userName,
      userEmail: req.userEmail,
      category: req.category,
      location: req.userLocation,
      team: team.name,
      startedAt: Date.now(),
    };
    this.activeJobs.push(job);

    // Remove from live requests
    this.liveRequests = this.liveRequests.filter(
      (r) => r.requestServiceId !== req.requestServiceId,
    );

    // Send notification to user
    const message = `Your service request is being accepted — ${team.name} dispatched`;
    this.sendNotificationToUser(
      req.userEmail,
      req.requestServiceId,
      message,
      this.currentUserName,
    );

    // Start GPS tracking
    this.startLocationTracking(req.userEmail, req.requestServiceId);

    this.themeService.displayNotification(
      'Dispatched!',
      `${team.name} assigned to ${req.userName}'s request.`,
      'success',
    );
  }

  /**
   * Complete a job — frees the team and removes the active job.
   */
  completeJob(job: ActiveJob): void {
    // Stop tracking
    this.stopLocationTracking(job.userEmail, job.requestServiceId);

    // Free the team
    const team = this.teams.find((t) => t.name === job.team);
    if (team) {
      team.status = 'Available';
      team.currentJob = null;
    }

    // Remove the job
    this.activeJobs = this.activeJobs.filter(
      (j) => j.requestServiceId !== job.requestServiceId,
    );

    this.themeService.displayNotification(
      'Job Completed',
      `${job.team} has completed the job for ${job.userName}.`,
      'success',
    );
  }

  /** Get the elapsed time for a job as a formatted string */
  getJobElapsed(job: ActiveJob): string {
    const seconds = Math.floor((Date.now() - job.startedAt) / 1000);
    const mins = Math.floor(seconds / 60);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m`;
  }

  sendNotificationToUser(
    userEmail: string,
    requestServiceId: string,
    message: string,
    userName: string,
  ): void {
    this.socketService.sendNotificationToUser(userEmail, {
      message: message,
      requestServiceId,
      providerName: userName,
    });
  }

  // ===================== LOCATION TRACKING =====================

  startLocationTracking(userEmail: string, requestServiceId: string): void {
    if (!navigator.geolocation) {
      this.themeService.displayNotification(
        'Error',
        'Geolocation is not supported by your browser.',
        'error',
      );
      return;
    }

    if (this.trackingMap.has(requestServiceId)) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        this.socketService.emitLocationUpdate(
          userEmail,
          latitude,
          longitude,
          this.currentUserName,
          requestServiceId,
        );
      },
      (error) => {
        console.error('Geolocation error:', error);
        this.themeService.displayNotification(
          'Warning',
          'Unable to get your location. Please enable GPS.',
          'error',
        );
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 },
    );

    this.trackingMap.set(requestServiceId, watchId);
  }

  stopLocationTracking(userEmail: string, requestServiceId: string): void {
    const watchId = this.trackingMap.get(requestServiceId);
    if (watchId !== undefined) {
      navigator.geolocation.clearWatch(watchId);
      this.trackingMap.delete(requestServiceId);
    }
    this.socketService.stopTracking(
      userEmail,
      requestServiceId,
      this.currentUserName,
    );
  }

  isTracking(requestServiceId: string): boolean {
    return this.trackingMap.has(requestServiceId);
  }

  // ===================== DELETE REQUEST =====================

  deleteService(userEmail: string, requestServiceId: string): void {
    const message = 'Your service request is being rejected';
    this.sendNotificationToUser(
      userEmail,
      requestServiceId,
      message,
      this.currentUserName,
    );

    if (this.trackingMap.has(requestServiceId)) {
      this.stopLocationTracking(userEmail, requestServiceId);
    }

    this.serviceApi
      .deleteServiceRequest(userEmail, requestServiceId)
      .subscribe({
        next: () => {
          this.themeService.displayNotification(
            'Success',
            'Service deleted successfully',
            'success',
          );
          this.liveRequests = this.liveRequests.filter(
            (request) => request.requestServiceId !== requestServiceId,
          );
        },
        error: (error) => {
          console.error('Failed to delete service:', error);
          this.themeService.displayNotification(
            'Error',
            'Failed to delete service',
            'error',
          );
        },
      });
  }

  // ===================== CLEANUP =====================

  ngOnDestroy(): void {
    this.trackingMap.forEach((watchId) => {
      navigator.geolocation.clearWatch(watchId);
    });
    this.trackingMap.clear();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
