import { Injectable } from '@angular/core';
import { io } from 'socket.io-client';
import { environment } from '../environments/environment';
@Injectable({ providedIn: 'root' })
export class SocketService {

  socket = io(environment.socketUrl);

  joinRoom(room: string) {
    this.socket.emit('join-room', { room });
  }

  onServiceRequestUpdate(cb: (data: any) => void) {
    this.socket.on('serviceRequestUpdated', cb); //to listen for new service requests in SP dashboard
  }

  onServiceUpdate(cb: (data: any) => void) {
    this.socket.on('servicesUpdated', cb); //to listen for new services added by SP in user Servcies page
  }

  sendNotificationToUser(userEmail: string, arg1: { message: string; requestServiceId: string; providerName: string }) {
    this.socket.emit('SP-Dashboard/sendNotificationToUser', { userEmail, ...arg1 }); //to send notification to user when SP accepts/rejects service request
  }

  sendNotificationToProvider(providerEmail: string, arg1: { message: string; userLocation: string; requestServiceId: string; userName: string; userLat?: number; userLng?: number; }) {
    this.socket.emit('serviceComponent/sendNotificationToProvider', { providerEmail, ...arg1 }); //to send notification to provider when user requests for a service
  }

  receiveNotificationFromUser(cb: (data: any) => void) {
    this.socket.on('navbarComponent/notificationFromUser', cb); //to receive notification in SP dashboard when user requests for a service
  }

  receiveNotificationFromProvider(cb: (data: any) => void) {
    this.socket.on('navbarComponent/notificationFromProvider', cb); //to receive notification in user dashboard when SP accepts/rejects service request
  }

  // --- Real-time location tracking ---

  /** SP emits their GPS coordinates to the user */
  emitLocationUpdate(userEmail: string, lat: number, lng: number, providerName: string, requestServiceId: string) {
    this.socket.emit('tracking/updateLocation', { userEmail, lat, lng, providerName, requestServiceId });
  }

  /** SP signals that they've stopped sharing location */
  stopTracking(userEmail: string, requestServiceId: string, providerName: string) {
    this.socket.emit('tracking/stopTracking', { userEmail, requestServiceId, providerName });
  }

  /** User listens for real-time location updates from the SP */
  onProviderLocationUpdate(cb: (data: { lat: number; lng: number; providerName: string; requestServiceId: string }) => void) {
    this.socket.on('tracking/providerLocation', cb);
  }

  /** User listens for when the SP stops tracking */
  onProviderStopped(cb: (data: { requestServiceId: string; providerName: string }) => void) {
    this.socket.on('tracking/providerStopped', cb);
  }
}
