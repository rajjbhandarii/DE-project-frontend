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
    this.socket.on('serviceRequestUpdated', cb);
  }

  onServiceUpdate(cb: (data: any) => void) {
    this.socket.on('servicesUpdated', cb);
  }
}
