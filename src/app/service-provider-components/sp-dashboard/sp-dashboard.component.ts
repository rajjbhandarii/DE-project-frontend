import { Component, OnInit, OnDestroy, inject, AfterViewInit } from '@angular/core';
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
  userLat?: number;
  userLng?: number;
}

declare const L: any;

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

  /** Leaflet mini-maps for active jobs keyed by requestServiceId */
  jobMaps = new Map<string, any>();

  /** Show the team picker dropdown for a specific request */
  showTeamPickerFor: string | null = null;

  /** SP Live Map state */
  spMap: any = null;
  spMarker: any = null;
  spMapInitialized = false;
  spUserMarkers = new Map<string, any>();
  spLatestCoords: { lat: number; lng: number } | null = null;

  /** Whether any tracking is active (shows map card) */
  get hasActiveTracking(): boolean {
    return this.trackingMap.size > 0;
  }

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
      userLat: req.userLat,
      userLng: req.userLng,
    };
    this.activeJobs.push(job);

    // Init mini-map after DOM renders
    if (job.userLat && job.userLng) {
      setTimeout(() => this.initJobMap(job), 200);
    }

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

    // Destroy the mini-map
    this.destroyJobMap(job.requestServiceId);

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
        // Update the SP live map
        this.spLatestCoords = { lat: latitude, lng: longitude };
        this.updateSpMap(latitude, longitude);
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

    // Initialize SP map if this is the first active tracking
    if (!this.spMapInitialized) {
      setTimeout(() => this.initSpMap(), 300);
    } else {
      // Add user marker for this job
      const job = this.activeJobs.find(j => j.requestServiceId === requestServiceId);
      if (job?.userLat && job?.userLng) {
        this.addUserMarkerToSpMap(job);
      }
    }
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

    // Remove user marker from SP map
    this.removeUserMarkerFromSpMap(requestServiceId);

    // Destroy SP map if no more active tracking
    if (this.trackingMap.size === 0) {
      this.destroySpMap();
    }
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

  // ===================== MAP =====================

  /** Initialize a mini Leaflet map for an active job showing user location */
  initJobMap(job: ActiveJob): void {
    if (!job.userLat || !job.userLng) return;
    const containerId = 'job-map-' + job.requestServiceId;
    const container = document.getElementById(containerId);
    if (!container) return;

    const tileUrl = this.isDarkMode
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    const map = L.map(containerId, {
      zoomControl: false,
      attributionControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
    }).setView([job.userLat, job.userLng], 15);

    L.tileLayer(tileUrl, { maxZoom: 18 }).addTo(map);

    const userIcon = L.divIcon({
      html: '<div style="background:#10b981;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 2px 6px rgba(0,0,0,.3)"><i class="fa-solid fa-user"></i></div>',
      className: 'custom-div-icon',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    L.marker([job.userLat, job.userLng], { icon: userIcon })
      .addTo(map)
      .bindPopup(`<strong>${job.userName}</strong><br>${job.location}`);

    this.jobMaps.set(job.requestServiceId, map);
    setTimeout(() => map.invalidateSize(), 300);
  }

  /** Destroy a mini-map */
  destroyJobMap(requestServiceId: string): void {
    const map = this.jobMaps.get(requestServiceId);
    if (map) {
      map.remove();
      this.jobMaps.delete(requestServiceId);
    }
  }

  // ===================== SP LIVE MAP =====================

  /** Initialize the SP's own live map showing their position + all user pins */
  initSpMap(): void {
    const container = document.getElementById('sp-live-map');
    if (!container || this.spMapInitialized) return;

    const tileUrl = this.isDarkMode
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

    // Default center — will be replaced by first GPS update
    const defaultCenter = this.spLatestCoords || { lat: 20.5937, lng: 78.9629 };

    this.spMap = L.map('sp-live-map', {
      zoomControl: true,
      attributionControl: false,
    }).setView([defaultCenter.lat, defaultCenter.lng], 14);

    L.tileLayer(tileUrl, { maxZoom: 19 }).addTo(this.spMap);

    // SP marker (blue truck)
    const spIcon = L.divIcon({
      html: '<div style="background:#3b82f6;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 3px 8px rgba(59,130,246,.4);border:2px solid white"><i class="fa-solid fa-truck-fast"></i></div>',
      className: 'custom-div-icon',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    if (this.spLatestCoords) {
      this.spMarker = L.marker([this.spLatestCoords.lat, this.spLatestCoords.lng], { icon: spIcon })
        .addTo(this.spMap)
        .bindPopup('<strong>You</strong><br>Your live location');
    }

    // Add user markers for all active jobs with GPS
    this.activeJobs.forEach(job => {
      if (job.userLat && job.userLng) {
        this.addUserMarkerToSpMap(job);
      }
    });

    this.spMapInitialized = true;
    setTimeout(() => this.spMap?.invalidateSize(), 300);
  }

  /** Update SP marker position on the live map */
  updateSpMap(lat: number, lng: number): void {
    if (!this.spMap) return;

    const newLatLng = L.latLng(lat, lng);

    if (this.spMarker) {
      this.spMarker.setLatLng(newLatLng);
    } else {
      const spIcon = L.divIcon({
        html: '<div style="background:#3b82f6;color:white;width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:16px;box-shadow:0 3px 8px rgba(59,130,246,.4);border:2px solid white"><i class="fa-solid fa-truck-fast"></i></div>',
        className: 'custom-div-icon',
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });
      this.spMarker = L.marker(newLatLng, { icon: spIcon })
        .addTo(this.spMap)
        .bindPopup('<strong>You</strong><br>Your live location');
    }

    // Pan if out of view
    if (!this.spMap.getBounds().contains(newLatLng)) {
      this.spMap.panTo(newLatLng, { animate: true, duration: 0.5 });
    }
  }

  /** Add a user pin to the SP live map */
  addUserMarkerToSpMap(job: ActiveJob): void {
    if (!this.spMap || !job.userLat || !job.userLng) return;
    if (this.spUserMarkers.has(job.requestServiceId)) return;

    const userIcon = L.divIcon({
      html: '<div style="background:#10b981;color:white;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;box-shadow:0 2px 6px rgba(0,0,0,.3)"><i class="fa-solid fa-user"></i></div>',
      className: 'custom-div-icon',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    const marker = L.marker([job.userLat, job.userLng], { icon: userIcon })
      .addTo(this.spMap)
      .bindPopup(`<strong>${job.userName}</strong><br>${job.location}`);

    this.spUserMarkers.set(job.requestServiceId, marker);
  }

  /** Remove a user marker from the SP live map */
  removeUserMarkerFromSpMap(requestServiceId: string): void {
    const marker = this.spUserMarkers.get(requestServiceId);
    if (marker && this.spMap) {
      this.spMap.removeLayer(marker);
      this.spUserMarkers.delete(requestServiceId);
    }
  }

  /** Recenter SP map to fit all markers */
  recenterSpMap(): void {
    if (!this.spMap) return;
    const markers: any[] = [];
    if (this.spMarker) markers.push(this.spMarker);
    this.spUserMarkers.forEach(m => markers.push(m));
    if (markers.length > 0) {
      const group = L.featureGroup(markers);
      this.spMap.fitBounds(group.getBounds().pad(0.3), { animate: true });
    }
  }

  /** Destroy the SP live map */
  destroySpMap(): void {
    if (this.spMap) {
      this.spMap.remove();
      this.spMap = null;
      this.spMarker = null;
      this.spUserMarkers.clear();
      this.spMapInitialized = false;
    }
  }

  // ===================== CLEANUP =====================

  ngOnDestroy(): void {
    this.destroySpMap();

    this.jobMaps.forEach((map) => map.remove());
    this.jobMaps.clear();

    this.trackingMap.forEach((watchId) => {
      navigator.geolocation.clearWatch(watchId);
    });
    this.trackingMap.clear();
    this.destroy$.next();
    this.destroy$.complete();
  }
}
