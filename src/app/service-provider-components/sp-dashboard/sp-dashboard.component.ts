import { Component, OnInit, OnDestroy } from '@angular/core';
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

interface ActiveJob {
  name: string;
  service: string;
  location: string;
  team: string;
}

interface TeamMember {
  name: string;
  status: string;
}

@Component({
  selector: 'app-sp-dashboard',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './sp-dashboard.component.html',
  styleUrl: './sp-dashboard.component.css',
})
export class SpDashboardComponent implements OnInit, OnDestroy {
  isDarkMode: boolean = false; // Default to light mode
  liveRequests: ActiveRequest[] = [];
  State$: Observable<AppUser | null>;
  currentUser: string = '';
  userEmail: string = '';
  currentUserName = '';
  private destroy$ = new Subject<void>();
  // init socket for provider real-time updates
  activeJobs: ActiveJob[] = [
    {
      name: 'Rohan Singh',
      service: 'Towing',
      location: 'HSR Layout, Bangalore',
      team: 'Team Jash',
    },
    {
      name: 'Anita Desai',
      service: 'Flat Tire Repair',
      location: 'MG Road, Bangalore',
      team: 'Team Sahli',
    },
  ];
  teams: TeamMember[] = [
    { name: 'Team Jash', status: 'On Job' },
    { name: 'Team Sahli', status: 'Available' },
    { name: 'Team Raj', status: 'Available' },
    { name: 'Team Faizan', status: 'Offline' },
  ];

  /** Tracks active geolocation watches keyed by requestServiceId */
  trackingMap = new Map<string, number>();

  constructor(
    private accesspointService: AccesspointService,
    private serviceApi: ServiceApiService,
    private router: Router,
    private themeService: ThemeServiceService,
    private socketService: SocketService,
  ) {
    this.State$ = this.accesspointService.currentState$;
  }

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

    this.socketService.onServiceRequestUpdate((request) => {
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

  dispatch(userEmail: string, requestServiceId: string): void {
    const message = 'Your service request is being accepted';
    console.log('Dispatching service request:', { userEmail, requestServiceId });
    this.sendNotificationToUser(userEmail, requestServiceId, message, this.currentUserName);

    // Start real-time location tracking for this request
    this.startLocationTracking(userEmail, requestServiceId);
  }

  sendNotificationToUser(userEmail: string, requestServiceId: string, message: string, userName: string): void {
    this.socketService.sendNotificationToUser(userEmail, {
      message: message,
      requestServiceId,
      providerName: userName
    });
  }

  /**
   * Starts the browser's Geolocation watchPosition API to continuously
   * send the SP's GPS coordinates to the user via Socket.IO.
   */
  startLocationTracking(userEmail: string, requestServiceId: string): void {
    if (!navigator.geolocation) {
      this.themeService.displayNotification('Error', 'Geolocation is not supported by your browser.', 'error');
      return;
    }

    // Avoid duplicate watchers for the same request
    if (this.trackingMap.has(requestServiceId)) {
      return;
    }

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
        console.log(`📍 Sent location [${latitude}, ${longitude}] to ${userEmail}`);
      },
      (error) => {
        console.error('Geolocation error:', error);
        this.themeService.displayNotification(
          'Warning',
          'Unable to get your location. Please enable GPS.',
          'error',
        );
      },
      {
        enableHighAccuracy: true,
        maximumAge: 3000,
        timeout: 10000,
      },
    );

    this.trackingMap.set(requestServiceId, watchId);
    this.themeService.displayNotification(
      'Tracking',
      `Location sharing started for this request.`,
      'success',
    );
  }

  /**
   * Stops tracking for a specific dispatched request.
   */
  stopLocationTracking(userEmail: string, requestServiceId: string): void {
    const watchId = this.trackingMap.get(requestServiceId);
    if (watchId !== undefined) {
      navigator.geolocation.clearWatch(watchId);
      this.trackingMap.delete(requestServiceId);
    }

    this.socketService.stopTracking(userEmail, requestServiceId, this.currentUserName);

    this.themeService.displayNotification(
      'Tracking Stopped',
      'Location sharing has been stopped.',
      'success',
    );
  }

  /** Returns true if a request is currently being tracked */
  isTracking(requestServiceId: string): boolean {
    return this.trackingMap.has(requestServiceId);
  }

  deleteService(userEmail: string, requestServiceId: string): void {
    const message = 'Your service request is being rejected';
    this.sendNotificationToUser(userEmail, requestServiceId, message, this.currentUserName);

    // Stop tracking if active before deleting
    if (this.trackingMap.has(requestServiceId)) {
      this.stopLocationTracking(userEmail, requestServiceId);
    }

    this.serviceApi
      .deleteServiceRequest(userEmail, requestServiceId)
      .subscribe({
        next: (response) => {
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

  ngOnDestroy(): void {
    // Clear all active geolocation watchers
    this.trackingMap.forEach((watchId, requestServiceId) => {
      navigator.geolocation.clearWatch(watchId);
    });
    this.trackingMap.clear();

    this.destroy$.next();
    this.destroy$.complete();
  }
}
