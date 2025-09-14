import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AccesspointService, AppUser } from '../app/accesspoint/accesspoint.service';
import { Observable } from 'rxjs/internal/Observable';
@Component({
  selector: 'app-navbar',
  imports: [RouterLink, CommonModule, RouterOutlet],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})

export class NavbarComponent {
  menuActive = false;
  currentUser$: Observable<AppUser | null>;

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
