import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { AccesspointService, User } from '../app/accesspoint/accesspoint.service';
import { Observable } from 'rxjs';
@Component({
  selector: 'app-services',
  imports: [CommonModule],
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.css']
})
export class ServicesComponent {
  currentUser$: Observable<User | null>;

  constructor(private accesspointService: AccesspointService) {
    this.currentUser$ = this.accesspointService.currentUser$;
  }

}
