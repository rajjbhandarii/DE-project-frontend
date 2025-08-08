import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AccesspointService, User } from '../app/accesspoint/accesspoint.service';
@Component({
  selector: 'app-navbar',
  imports: [RouterLink, CommonModule, RouterOutlet],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  currentUser$: Observable<User | null>;
  menuActive = false;
  constructor(private accesspointService: AccesspointService) {
    this.currentUser$ = this.accesspointService.currentUser$;
  }

  toggleMenu() {
    this.menuActive = !this.menuActive;
  }
  logout() {
    this.accesspointService.logout();
  }
}
