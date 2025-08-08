import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { AccesspointService } from '../app/accesspoint/accesspoint.service';
@Component({
  selector: 'app-navbar',
  imports: [RouterLink, CommonModule, RouterOutlet],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  menuActive = false;
  constructor(private accesspointService: AccesspointService) {
  }

  toggleMenu() {
    this.menuActive = !this.menuActive;
  }
  logout() {
    this.accesspointService.logout();
  }
}
