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
    this.socket.emit('sendNotificationToUser', { userEmail, ...arg1 }); //to send notification to user when SP accepts/rejects service request
  }

  receiveNotificationFromProvider(cb: (data: any) => void) {
    this.socket.on('notificationFromProvider', cb); //to receive notification in user dashboard when SP accepts/rejects service request
  }

  sendNotificationToProvider(providerEmail: string, arg1: { message: string; userLocation: string; requestServiceId: string; userName: string; }) {
    this.socket.emit('sendNotificationToProvider', { providerEmail, ...arg1 }); //to send notification to provider when user requests for a service
  }

  receiveNotificationFromUser(cb: (data: any) => void) {
    this.socket.on('notificationFromUser', cb); //to receive notification in SP dashboard when user requests for a service
  }
}
