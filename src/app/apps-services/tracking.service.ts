import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SocketService } from './socket.service';

export interface TrackingInfo {
  lat: number;
  lng: number;
  providerName: string;
  requestServiceId: string;
}

/**
 * Centralized tracking state service.
 * Listens on Socket.IO for provider location updates and exposes
 * observables that any component (services page, tracking page) can subscribe to.
 */
@Injectable({ providedIn: 'root' })
export class TrackingService {
  private trackingSubject = new BehaviorSubject<TrackingInfo | null>(null);
  private activeSubject = new BehaviorSubject<boolean>(false);
  private stoppedSubject = new BehaviorSubject<{
    requestServiceId: string;
    providerName: string;
  } | null>(null);

  /** Emits the latest provider location (or null if not tracking) */
  tracking$ = this.trackingSubject.asObservable();

  /** Whether tracking is currently active */
  isActive$ = this.activeSubject.asObservable();

  /** Emits once when the provider stops sharing */
  stopped$ = this.stoppedSubject.asObservable();

  /** Location update history for the current tracking session */
  locationHistory: { lat: number; lng: number; timestamp: number }[] = [];

  /** Timestamp of when the tracking session started */
  trackingStartTime: number = 0;

  private initialized = false;

  constructor() {}

  /**
   * Call once from a top-level component (e.g. services page or navbar)
   * to start listening for tracking socket events.
   * Idempotent — safe to call multiple times.
   */

  socketService = inject(SocketService);
  init(userEmail: string): void {
    if (this.initialized) return;
    this.initialized = true;

    this.socketService.joinRoom(userEmail);

    this.socketService.onProviderLocationUpdate((data: TrackingInfo) => {
      if (!this.activeSubject.value) {
        this.activeSubject.next(true);
        this.trackingStartTime = Date.now();
        this.locationHistory = [];
      }
      this.locationHistory.push({
        lat: data.lat,
        lng: data.lng,
        timestamp: Date.now(),
      });
      this.trackingSubject.next(data);
    });

    this.socketService.onProviderStopped(
      (data: { requestServiceId: string; providerName: string }) => {
        this.activeSubject.next(false);
        this.trackingSubject.next(null);
        this.stoppedSubject.next(data);
      },
    );
  }

  /** Get the current tracking info snapshot (non-reactive) */
  get currentTracking(): TrackingInfo | null {
    return this.trackingSubject.value;
  }

  /** Get whether tracking is currently active (non-reactive) */
  get isActive(): boolean {
    return this.activeSubject.value;
  }

  /** Get elapsed tracking time in seconds */
  get elapsedSeconds(): number {
    if (!this.trackingStartTime) return 0;
    return Math.floor((Date.now() - this.trackingStartTime) / 1000);
  }

  /** Reset tracking state (e.g. when user manually dismisses) */
  reset(): void {
    this.activeSubject.next(false);
    this.trackingSubject.next(null);
    this.locationHistory = [];
    this.trackingStartTime = 0;
  }
}
