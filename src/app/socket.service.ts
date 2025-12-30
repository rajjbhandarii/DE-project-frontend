import { Injectable } from '@angular/core';
import { io } from 'socket.io-client';
@Injectable({ providedIn: 'root' })
export class SocketService {
  socket = io('http://localhost:3000');

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
